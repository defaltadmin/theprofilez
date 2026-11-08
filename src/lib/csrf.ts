import { getCookie, setCookie } from 'hono/cookie';
import type { MiddlewareHandler } from 'hono';
import type { AppEnv } from '../env';
export function constantTimeEqual(a: string,b: string): boolean {
 let diff = a.length ^ b.length;
 for (let i=0;i<Math.max(a.length,b.length);i++) diff |= (a.charCodeAt(i)||0) ^ (b.charCodeAt(i)||0);
 return diff === 0;
}
export const csrf: MiddlewareHandler<AppEnv> = async (c,next) => {
 const url = new URL(c.req.url);
 const secure = url.protocol === 'https:';
 const name = secure ? '__Host-csrf' : 'csrf';
 const cookie = getCookie(c,name);
 if (!['GET','HEAD','OPTIONS'].includes(c.req.method)) {
 const token = c.req.header('X-CSRF-Token');
 if (c.req.header('Origin') !== url.origin || !cookie || !token || token.length > 128 || !constantTimeEqual(cookie,token)) return c.json({error:'CSRF validation failed'},403);
 }
 if (!cookie) setCookie(c,name,crypto.randomUUID(),{path:'/',secure,sameSite:'Strict',httpOnly:false});
 await next();
};