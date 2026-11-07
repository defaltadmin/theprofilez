import { describe,it,expect,vi,afterEach,beforeAll } from 'vitest';
import { env,applyD1Migrations,createExecutionContext,waitOnExecutionContext } from 'cloudflare:test';
import type { Env } from '../src/env';
import { app } from '../src';
import { sanitize } from '../src/lib/sanitize';
import { slugify,uniqueSlug } from '../src/lib/slug';
import { validateProfile,publishError } from '../src/lib/validate';
import { languageAvailable } from '../src/lib/i18n';
import { verifyAccess } from '../src/lib/access-jwt';
import { constantTimeEqual } from '../src/lib/csrf';
vi.mock('../src/lib/cache',()=>({purgeProfile:vi.fn(()=>{throw new Error('purge failed');})}));
declare module 'cloudflare:test' { interface ProvidedEnv extends Env { TEST_MIGRATIONS: D1Migration[] } }
const config={...env,ADMIN_HOST:'admin.localhost',PUBLIC_HOST:'localhost',DEV_AUTH_BYPASS:'1',DEV_USER_EMAIL:'editor@example.test',ADMIN_EMAILS:'editor@example.test',ACCESS_TEAM_DOMAIN:'https://test.cloudflareaccess.com',ACCESS_AUD:'test-aud'};
beforeAll(async()=>{await applyD1Migrations(env.DB,env.TEST_MIGRATIONS);await env.DB.batch([env.DB.prepare("INSERT INTO sectors VALUES(1,'technology','Technology','التقنية',0)"),env.DB.prepare("INSERT INTO cities VALUES(1,'riyadh','Riyadh','الرياض')"),env.DB.prepare("INSERT INTO tags VALUES(1,'innovation','Innovation','الابتكار')")]);});
afterEach(()=>vi.restoreAllMocks());
async function call(path:string,init:RequestInit={},bindings=config){
 const ctx=createExecutionContext();const response=await app.fetch(new Request('http://admin.localhost'+path,init),bindings,ctx);await waitOnExecutionContext(ctx);return response;
}
const writeHeaders={'Content-Type':'application/json',Origin:'http://admin.localhost',Cookie:'csrf=test-token','X-CSRF-Token':'test-token'};
describe('sanitizer',()=>{
 it('handles empty input',async()=>expect(await sanitize('')).toBe(''));
 it('preserves editorial markup and maps tags',async()=>expect(await sanitize('<h1>A</h1><b>B</b><i>I</i><h4>H</h4><div><p>Text<br>more</p></div>')).toBe('<h2>A</h2><strong>B</strong><em>I</em><h3>H</h3><p>Text<br>more</p>'));
 it.each(['script','style','iframe','object','svg','math','template','noscript','form'])('drops %s content',async tag=>{const result=await sanitize('<p>before</p><'+tag+'>DANGER</'+tag+'><p>after</p>');expect(result).not.toContain('DANGER');expect(result).not.toContain('<'+tag);});
 it.each(['javascript:alert(1)','java&#x73;cript:alert(1)','data:text/html,x','vbscript:x','//evil.test','/relative','java\nscript:alert(1)'])('rejects malicious href %s',async href=>expect(await sanitize('<a href="'+href+'" onclick="alert(1)" style="color:red">x</a>')).toBe('<a rel="noopener noreferrer nofollow">x</a>'));
 it('preserves only safe links',async()=>{const s=await sanitize('<a href="https://example.test" target="_blank" id="x">x</a><a href="mailto:a@example.test">mail</a>');expect(s).toContain('href="https://example.test/"');expect(s).toContain('mailto:a@example.test');expect(s).not.toContain('target=');expect(s).toContain('rel="noopener noreferrer nofollow"');});
 it('drops comments, attributes and embedded payloads',async()=>{const s=await sanitize('<!--secret--><p onmouseover="x" style="x">safe<img src=x onerror=alert(1)></p><svg><a href="javascript:x">bad</a></svg>');expect(s).toBe('<p>safe</p>');});
 it('handles malformed XSS',async()=>{const s=await sanitize('<IMG """><SCRIPT>alert("XSS")</SCRIPT>"><p class=x>Hello</p>');expect(s).not.toMatch(/script|onerror|class=/i);expect(s).toContain('Hello');});
  it('drops xmp and textarea content',async()=>{const s=await sanitize('<xmp><img src=x onerror=alert(1)></xmp><textarea><script>x</script></textarea>');expect(s).not.toContain('<img');expect(s).not.toContain('onerror');expect(s).not.toContain('<script');});
});
describe('slug and validation',()=>{
 it('normalizes Latin and Arabic names',()=>{expect(slugify('Noura Al Safa!')).toBe('noura-al-safa');expect(slugify('ريم')).toBe('rym');expect(slugify('')).toBe('profile');expect(slugify('Élodie')).toBe('elodie');});
 it('suffixes duplicate slugs including soft deleted profiles',async()=>{await env.DB.prepare("INSERT INTO profiles(slug,created_by,deleted_at) VALUES('duplicate','test',CURRENT_TIMESTAMP)").run();expect(await uniqueSlug(env.DB,'duplicate')).toBe('duplicate-2');});
 it('accepts normal input and taxonomy',async()=>{const p=await validateProfile({name_en:'A',sector_id:1,city:'riyadh',tags:[1],linkedin_url:'https://www.linkedin.com/in/a'},env.DB);expect(p.sector_id).toBe(1);expect(p.consent_confirmed).toBe(0);});
 it.each([{},null,{name_en:5},{name_en:'A',slug:'Bad Slug'},{name_en:'A',website_url:'http://example.test'},{name_en:'A',linkedin_url:'https://linkedin.com.evil.test/a'},{name_en:'A',tags:[999]},{name_en:'A',sector_id:999},{name_en:'A',city:'missing'},{name_en:'A',featured:2},{name_en:'A',summary_ar:'x'.repeat(2001)},{name_en:'A',photo_key:'../../secret'}])('rejects invalid input %j',async p=>{await expect(validateProfile(p,env.DB)).rejects.toThrow();});
 it('shares language availability and publication requirements',()=>{const p={name_en:'A',title_en:'Title',summary_en:'Intro',body_en:'<p>Body</p>',consent_confirmed:1};expect(languageAvailable(p,'en')).toBe(true);expect(languageAvailable({...p,body_en:'<p><br></p>'},'en')).toBe(false);expect(publishError(p)).toBeNull();expect(publishError({...p,photo_key:'x'})).toContain('alt');expect(publishError({...p,consent_confirmed:0})).toContain('Consent');});
});
describe('Access JWT',()=>{
 let pair:CryptoKeyPair,jwk:JsonWebKey;
 const encode=(value:Uint8Array)=>btoa(String.fromCharCode(...value)).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
 beforeAll(async()=>{pair=await crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']) as CryptoKeyPair;jwk=await crypto.subtle.exportKey('jwk',pair.publicKey);});
 async function token(overrides:Record<string,unknown>={},key=pair.privateKey,kid='test-key'){
 const header=encode(new TextEncoder().encode(JSON.stringify({alg:'RS256',kid})));
 const payload=encode(new TextEncoder().encode(JSON.stringify({iss:config.ACCESS_TEAM_DOMAIN,aud:[config.ACCESS_AUD],exp:Date.now()/1000+300,nbf:Date.now()/1000-10,email:'editor@example.test',...overrides})));
 const signature=await crypto.subtle.sign('RSASSA-PKCS1-v1_5',key,new TextEncoder().encode(header+'.'+payload));return header+'.'+payload+'.'+encode(new Uint8Array(signature));
 }
 function mockKeys(){return vi.spyOn(globalThis,'fetch').mockResolvedValue(Response.json({keys:[{...jwk,kid:'test-key'}]}));}
 it('accepts a valid signed token',async()=>{mockKeys();expect(await verifyAccess(await token(),config)).toBe('editor@example.test');});
 it('rejects bad signatures',async()=>{mockKeys();const other=await crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']) as CryptoKeyPair;await expect(verifyAccess(await token({},other.privateKey),config)).rejects.toThrow('signature');});
 it.each([{aud:['wrong']},{iss:'https://wrong.test'},{exp:Date.now()/1000-100},{nbf:Date.now()/1000+300},{email:''}])('rejects bad claims %j',async claims=>{mockKeys();await expect(verifyAccess(await token(claims),config)).rejects.toThrow();});
 it('enforces email allowlist',async()=>{mockKeys();await expect(verifyAccess(await token(),{...config,ADMIN_EMAILS:'other@example.test'})).rejects.toThrow('Not allowed');});
 it('refetches on unknown kid',async()=>{const fetch=mockKeys();await expect(verifyAccess(await token({},pair.privateKey,'new-key'),config)).rejects.toThrow('Unknown key');expect(fetch).toHaveBeenCalled();});
 it.each(['/','/api/profiles','/admin/app.js','/brand/logo.png','/img/photos/a-480.webp'])('protects every admin request: %s',async path=>{expect((await call(path,{}, {...config,DEV_AUTH_BYPASS:'0'})).status).toBe(403);});
 it('ignores spoofed email headers and does not bypass production hosts',async()=>{const ctx=createExecutionContext();const response=await app.fetch(new Request('https://admin.theprofilez.com/api/meta',{headers:{'Cf-Access-Authenticated-User-Email':'editor@example.test'}}),{...config,ADMIN_HOST:'admin.theprofilez.com'},ctx);expect(response.status).toBe(403);});
});
describe('CSRF and publication API',()=>{
 it('constant-time comparison handles mismatch and empty values',()=>{expect(constantTimeEqual('abc','abc')).toBe(true);expect(constantTimeEqual('abc','abd')).toBe(false);expect(constantTimeEqual('abc','ab')).toBe(false);});
 it.each<Record<string,string>>([{}, {Origin:'http://evil.test',Cookie:'csrf=x','X-CSRF-Token':'x'},{Origin:'http://admin.localhost',Cookie:'csrf=x','X-CSRF-Token':'y'}])('rejects missing or invalid CSRF %j',async headers=>{const response=await call('/api/profiles',{method:'POST',headers,body:'{}'});expect(response.status).toBe(403);});
 it('sets secure host CSRF cookie and security headers',async()=>{const response=await app.fetch(new Request('https://admin.localhost/api/meta'),config,createExecutionContext());expect(response.headers.get('Set-Cookie')).toContain('__Host-csrf=');expect(response.headers.get('Set-Cookie')).toContain('Secure');expect(response.headers.get('Cache-Control')).toBe('no-store');expect(response.headers.get('Content-Security-Policy')).toContain("nonce-");});
 it('creates sanitized draft, blocks missing consent, publishes, unpublishes and soft deletes with audits',async()=>{
 const body={name_en:'Test Person',title_en:'Director',summary_en:'Intro',body_en:'<p onclick="x">Story</p><script>bad</script>',sector_id:1,city:'riyadh',tags:[1]};
 const created=await call('/api/profiles',{method:'POST',headers:writeHeaders,body:JSON.stringify(body)});expect(created.status).toBe(201);
 const p=await created.json() as {id:number,body_en:string,slug:string};expect(p.body_en).toBe('<p>Story</p>');expect(p.slug).toBe('test-person');
 expect((await call('/api/profiles/'+p.id+'/publish',{method:'POST',headers:writeHeaders})).status).toBe(400);
 expect((await call('/api/profiles/'+p.id,{method:'PUT',headers:writeHeaders,body:JSON.stringify({...body,consent_confirmed:1})})).status).toBe(200);
 const published=await call('/api/profiles/'+p.id+'/publish',{method:'POST',headers:writeHeaders});expect(published.status).toBe(200);expect((await published.json() as {published_at:string}).published_at).toBeTruthy();
 expect((await call('/api/profiles/'+p.id+'/unpublish',{method:'POST',headers:writeHeaders})).status).toBe(200);
 expect((await call('/api/profiles/'+p.id,{method:'DELETE',headers:writeHeaders})).status).toBe(200);
 expect((await call('/api/profiles/'+p.id)).status).toBe(404);
 const logs=await env.DB.prepare('SELECT * FROM audit_log WHERE entity_id = ?').bind(String(p.id)).all();expect(logs.results.length).toBe(5);expect(logs.results.every(l=>l.actor==='editor@example.test')).toBe(true);
 });
 it('rejects non-WebP uploads',async()=>{const form=new FormData();form.append('large',new Blob(['not a webp']), 'large.webp');form.append('small',new Blob(['not a webp']), 'small.webp');const response=await call('/api/upload',{method:'POST',headers:{Origin:writeHeaders.Origin,Cookie:writeHeaders.Cookie,'X-CSRF-Token':'test-token'},body:form});expect(response.status).toBe(400);});
  it('returns success when cache purge fails',async()=>{const body={name_en:'Test Person',title_en:'Director',summary_en:'Intro',body_en:'<p>Story</p>',sector_id:1,city:'riyadh',tags:[1],consent_confirmed:1,photo_alt:'alt'};const created=await call('/api/profiles',{method:'POST',headers:writeHeaders,body:JSON.stringify(body)});expect(created.status).toBe(201);const p=await created.json() as {id:number};const published=await call('/api/profiles/'+p.id+'/publish',{method:'POST',headers:writeHeaders});expect(published.status).toBe(200);expect(published.headers.get('X-Cache-Purge')).toBe('failed');});
 it('returns empty search and 404 for nonexistent records',async()=>{expect(await (await call('/api/profiles?q=does-not-exist')).json()).toEqual([]);expect((await call('/api/profiles/99999')).status).toBe(404);});
});