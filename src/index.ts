import { Hono } from 'hono';
import type { AppEnv, Env } from './env';
import { securityHeaders } from './lib/headers';
import { accessAuth } from './lib/access-jwt';
import { csrf } from './lib/csrf';
import { api } from './admin/api';
import { admin } from './admin/routes';
import { publicApp } from './public';
const adminApp = new Hono<AppEnv>();
adminApp.use('*',accessAuth,csrf);
adminApp.route('/api',api);
adminApp.route('/',admin);
const app = new Hono<AppEnv>();
app.use('*',securityHeaders);
app.use('*',async(c,next)=>{
 const host=new URL(c.req.url).hostname;
 if(host!==c.env.ADMIN_HOST && host!==c.env.PUBLIC_HOST) return c.text('Unknown host',404);
 if(host===c.env.ADMIN_HOST) return adminApp.fetch(c.req.raw,c.env,c.executionCtx);
 await next();
});
async function image(request: Request,env: Env): Promise<Response> {
 const key=decodeURIComponent(new URL(request.url).pathname.slice(5));
 if(!/^photos\/[0-9a-f-]{36}-(1200|480)\.webp$/.test(key)) return new Response('Not found',{status:404});
 const object=await env.MEDIA.get(key);if(!object) return new Response('Not found',{status:404});
 return new Response(object.body,{headers:{'Content-Type':'image/webp','Cache-Control':'public, max-age=31536000, immutable','ETag':object.httpEtag}});
}
adminApp.get('/img/*',c=>image(c.req.raw,c.env));
adminApp.get('/admin/*',c=>c.env.ASSETS.fetch(c.req.raw));
adminApp.get('/brand/*',c=>c.env.ASSETS.fetch(c.req.raw));
app.get('/img/*',c=>image(c.req.raw,c.env));
app.get('/brand/*',c=>c.env.ASSETS.fetch(c.req.raw));
app.get('/css/*',c=>c.env.ASSETS.fetch(c.req.raw));
app.get('/fonts/*',c=>c.env.ASSETS.fetch(c.req.raw));
app.route('/',publicApp);
app.onError((error,c)=>{console.error(error.message);return c.json({error:'An unexpected error occurred'},500);});
export { app };
export default {fetch: app.fetch, scheduled: async (_event: ScheduledController,_env: Env,_ctx: ExecutionContext): Promise<void> => {}};