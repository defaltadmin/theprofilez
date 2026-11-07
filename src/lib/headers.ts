import type { MiddlewareHandler } from 'hono';
import type { AppEnv } from '../env';
export const securityHeaders: MiddlewareHandler<AppEnv> = async (c,next) => {
 const nonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(18))));
 c.set('nonce',nonce);
 await next();
 const admin = new URL(c.req.url).hostname === c.env.ADMIN_HOST;
 const challenge = admin ? '' : ' https://challenges.cloudflare.com';
 c.header('Content-Security-Policy', `default-src 'self'; img-src 'self' data: blob:; script-src 'self' 'nonce-${nonce}'${challenge}; style-src 'self' 'nonce-${nonce}'; frame-src 'self'${challenge}; frame-ancestors 'none'; base-uri 'none'; form-action 'self'`);
 c.header('Strict-Transport-Security','max-age=31536000; includeSubDomains');
 c.header('X-Content-Type-Options','nosniff');
 c.header('Referrer-Policy','strict-origin-when-cross-origin');
 c.header('Permissions-Policy','camera=(), microphone=(), geolocation=()');
 if (admin) c.header('Cache-Control','no-store');
};