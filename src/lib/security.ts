import type { MiddlewareHandler } from 'hono';
import type { Env } from '../env';
export const securityHeaders:MiddlewareHandler<{Bindings:Env}>=async(c,next)=>{await next();c.header('X-Content-Type-Options','nosniff');c.header('Referrer-Policy','strict-origin-when-cross-origin');c.header('X-Frame-Options','DENY');c.header('Permissions-Policy','camera=(), microphone=(), geolocation=()');c.header('Content-Security-Policy',"default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'");};
export function csrf(c:any):boolean{const v=(c.req.header('Cookie')||'').split(';').map((x:string)=>x.trim()).find((x:string)=>x.startsWith('tp_csrf='))?.slice(8);return !!v&&v===c.req.header('X-CSRF-Token')&&/^[a-f0-9]{32,128}$/.test(v);}
export function cleanText(v:unknown,n=5000):string{return typeof v==='string'?v.replace(/[\\u0000-\\u001f]/g,'').trim().slice(0,n):'';}
export function safeUrl(v:unknown):string{const s=cleanText(v,2048);try{const u=new URL(s);return u.protocol==='https:'?u.toString():'';}catch{return '';}}
