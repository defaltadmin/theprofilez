import type { MiddlewareHandler } from 'hono';
import type { AppEnv, Env } from '../env';
type SigningKey = JsonWebKey & { kid?: string };
const cache = new Map<string, { until: number; keys: SigningKey[] }>();
const refreshCache = new Map<string, number>();
async function keys(domain: string, refresh = false): Promise<SigningKey[]> {
 const hit = cache.get(domain);
 if (!refresh && hit && hit.until > Date.now()) return hit.keys;
 if (refresh && hit && Date.now() - (refreshCache.get(domain) ?? 0) < 60000) {
   return hit.keys;
 }
 const response = await fetch(domain + '/cdn-cgi/access/certs');
 if (!response.ok) throw new Error('JWKS unavailable');
 const data = await response.json() as { keys: SigningKey[] };
 if (!Array.isArray(data.keys)) throw new Error('Invalid JWKS');
 cache.set(domain, { until: Date.now() + 300000, keys: data.keys });
 refreshCache.set(domain, Date.now());
 return data.keys;
}
function decode(value: string): Uint8Array<ArrayBuffer> {
 return Uint8Array.from(atob(value.replace(/-/g,'+').replace(/_/g,'/')), c => c.charCodeAt(0));
}
export async function verifyAccess(token: string | undefined, env: Env): Promise<string> {
 if (!token || token.length > 16384) throw new Error('Missing token');
 const parts = token.split('.');
 if (parts.length !== 3) throw new Error('Invalid token');
 const header = JSON.parse(new TextDecoder().decode(decode(parts[0])));
 if (header.alg !== 'RS256' || typeof header.kid !== 'string') throw new Error('Invalid algorithm');
 let key = (await keys(env.ACCESS_TEAM_DOMAIN)).find(k => k.kid === header.kid);
 if (!key) key = (await keys(env.ACCESS_TEAM_DOMAIN, true)).find(k => k.kid === header.kid);
 if (!key) throw new Error('Unknown key');
 const imported = await crypto.subtle.importKey('jwk',key,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
 if (!await crypto.subtle.verify('RSASSA-PKCS1-v1_5',imported,decode(parts[2]),new TextEncoder().encode(parts[0]+'.'+parts[1]))) throw new Error('Invalid signature');
 const claims = JSON.parse(new TextDecoder().decode(decode(parts[1])));
 const now = Date.now()/1000;
 if (claims.iss !== env.ACCESS_TEAM_DOMAIN || !(Array.isArray(claims.aud) ? claims.aud : [claims.aud]).includes(env.ACCESS_AUD) ||
 typeof claims.exp !== 'number' || claims.exp < now-30 || (claims.nbf !== undefined && (typeof claims.nbf !== 'number' || claims.nbf > now+30)) ||
 typeof claims.email !== 'string' || !claims.email.trim()) throw new Error('Invalid claims');
 const email = claims.email.trim().toLowerCase();
 if (!env.ADMIN_EMAILS?.trim()) throw new Error('No admin emails configured');
if (!env.ADMIN_EMAILS.split(',').map(e=>e.trim().toLowerCase()).includes(email)) throw new Error('Not allowed');
 return email;
}
export const accessAuth: MiddlewareHandler<AppEnv> = async (c,next) => {
 try {
 const host = new URL(c.req.url).hostname;
 const email = c.env.DEV_AUTH_BYPASS === '1' && (host === 'localhost' || host.endsWith('.localhost')) ? c.env.DEV_USER_EMAIL : await verifyAccess(c.req.header('Cf-Access-Jwt-Assertion'),c.env);
 if (!email) return c.text('Forbidden',403);
 c.set('email',email);
 } catch { return c.text('Forbidden',403); }
 await next();
};