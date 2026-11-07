import { Hono } from 'hono';
import type { AppEnv } from '../env';
import { validateProfile, publishError } from '../lib/validate';
import { sanitize } from '../lib/sanitize';
import { slugify, uniqueSlug } from '../lib/slug';
import { audit, profileById } from '../lib/db';
import { purgeProfile } from '../lib/cache';
export const api = new Hono<AppEnv>();
api.get('/meta',async c=>{
 const [sectors,cities,tags]=await Promise.all(['SELECT * FROM sectors ORDER BY sort_order','SELECT * FROM cities ORDER BY name_en','SELECT * FROM tags ORDER BY name_en'].map(sql=>c.env.DB.prepare(sql).all()));
 return c.json({sectors:sectors.results,cities:cities.results,tags:tags.results});
});
api.get('/profiles',async c=>{
 const status=c.req.query('status') || 'all', q=c.req.query('q') || '';
 if (!['draft','published','all'].includes(status) || q.length>200) return c.json({error:'Invalid filter'},400);
 const result=await c.env.DB.prepare("SELECT * FROM profiles WHERE deleted_at IS NULL AND (? = 'all' OR status = ?) AND (name_en LIKE ? OR name_ar LIKE ? OR title_en LIKE ? OR org_en LIKE ?) ORDER BY updated_at DESC,id DESC").bind(status,status,...Array(4).fill('%'+q+'%')).all();
 return c.json(result.results);
});
api.get('/profiles/:id',async c=>{
 const p=await profileById(c.env.DB,c.req.param('id')); if(!p) return c.json({error:'Not found'},404);
 const tags=await c.env.DB.prepare('SELECT tag_id FROM profile_tags WHERE profile_id = ?').bind(p.id).all<{tag_id:number}>();
 return c.json({...p,tags:tags.results.map(t=>t.tag_id)});
});
api.on(['POST','PUT'],['/profiles','/profiles/:id'],async c=>{
 const updating=c.req.method==='PUT', id=c.req.param('id');
 if ((updating && !id) || (!updating && id)) return c.json({error:'Invalid method'},405);
 const previous=updating ? await profileById(c.env.DB,id!) : null;
 if(updating && !previous) return c.json({error:'Not found'},404);
 let p: Record<string,unknown>;
 try {p=await validateProfile(await c.req.json(),c.env.DB);} catch(e) {return c.json({error:e instanceof Error?e.message:'Invalid profile'},400);}
 p.body_en=await sanitize(String(p.body_en)); p.body_ar=await sanitize(String(p.body_ar));
 const requested=String(p.slug);
 p.slug=requested || await uniqueSlug(c.env.DB,slugify(String(p.name_en || p.name_ar)),Number(previous?.id || 0));
 if(await c.env.DB.prepare('SELECT id FROM profiles WHERE slug = ? AND id != ?').bind(p.slug,previous?.id || 0).first()) return c.json({error:'Slug is already in use'},409);
 if(previous?.status==='published') { const error=publishError(p); if(error) return c.json({error},400); }
 if(p.photo_key && (!await c.env.MEDIA.head(p.photo_key+'-1200.webp') || !await c.env.MEDIA.head(p.photo_key+'-480.webp'))) return c.json({error:'Photo has not been uploaded'},400);
 const tags=p.tags as number[]; delete p.tags;
 const fields=Object.keys(p);
 const profileId=previous?.id || (await c.env.DB.prepare('SELECT COALESCE(MAX(id),0)+1 AS id FROM profiles').first<{id:number}>())!.id;
 const statement=updating ? c.env.DB.prepare('UPDATE profiles SET '+fields.map(f=>f+' = ?').join(',')+', updated_at = CURRENT_TIMESTAMP WHERE id = ?').bind(...Object.values(p),profileId) :
 c.env.DB.prepare('INSERT INTO profiles(id,'+fields.join(',')+',created_by) VALUES('+Array(fields.length+2).fill('?').join(',')+')').bind(profileId,...Object.values(p),c.get('email'));
 try {await c.env.DB.batch([statement,c.env.DB.prepare('DELETE FROM profile_tags WHERE profile_id = ?').bind(profileId),...tags.map(tag=>c.env.DB.prepare('INSERT INTO profile_tags VALUES(?,?)').bind(profileId,tag)),audit(c.env.DB,c.get('email'),updating?'update':'create','profile',String(profileId))]);}
 catch {return c.json({error:'Could not save profile; please retry'},409);}
 const result=await profileById(c.env.DB,String(profileId));
 if(updating) { if(previous) await purgeProfile(c.env,previous); await purgeProfile(c.env,result!); }
 return c.json({...result,tags},updating?200:201);
});
api.post('/profiles/:id/:action',async c=>{
 const action=c.req.param('action'); if(!['publish','unpublish'].includes(action)) return c.json({error:'Not found'},404);
 const p=await profileById(c.env.DB,c.req.param('id')); if(!p) return c.json({error:'Not found'},404);
 if(action==='publish') {const error=publishError(p);if(error) return c.json({error},400);}
 await c.env.DB.batch([c.env.DB.prepare("UPDATE profiles SET status = ?, published_at = CASE WHEN ? = 'published' THEN COALESCE(published_at,CURRENT_TIMESTAMP) ELSE published_at END, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(action==='publish'?'published':'draft',action==='publish'?'published':'draft',p.id),audit(c.env.DB,c.get('email'),action,'profile',String(p.id))]);
 await purgeProfile(c.env,p);
 return c.json(await profileById(c.env.DB,String(p.id)));
});
api.delete('/profiles/:id',async c=>{
 const p=await profileById(c.env.DB,c.req.param('id'));if(!p) return c.json({error:'Not found'},404);
 await c.env.DB.batch([c.env.DB.prepare('UPDATE profiles SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?').bind(p.id),audit(c.env.DB,c.get('email'),'delete','profile',String(p.id))]);
 await purgeProfile(c.env,p);return c.json({ok:true});
});
api.post('/upload',async c=>{
 if(Number(c.req.header('Content-Length') || 0)>2000000) return c.json({error:'Upload too large'},413);
 let form: FormData;try{form=await c.req.raw.formData();}catch{return c.json({error:'Invalid multipart upload'},400);}
 const buffers: ArrayBuffer[]=[];
 for(const [name,max] of [['large',1572864],['small',307200]] as const) {
 const file=form.get(name);
 if(!file || typeof file==='string' || file.size>max || file.size<30) return c.json({error:'Invalid '+name+' WebP or size limit exceeded'},400);
 const data=await file.arrayBuffer(), bytes=new Uint8Array(data), view=new DataView(data);
 const text=(start:number,end:number)=>String.fromCharCode(...bytes.slice(start,end));
 if(text(0,4)!=='RIFF' || text(8,12)!=='WEBP' || view.getUint32(4,true)+8!==file.size) return c.json({error:'Invalid WebP magic bytes'},400);
 buffers.push(data);
 }
 const base='photos/'+crypto.randomUUID();
 await Promise.all(buffers.map((buffer,i)=>c.env.MEDIA.put(base+(i===0?'-1200.webp':'-480.webp'),buffer,{httpMetadata:{contentType:'image/webp'}})));
 await audit(c.env.DB,c.get('email'),'upload','photo',base).run();
 return c.json({key:base},201);
});