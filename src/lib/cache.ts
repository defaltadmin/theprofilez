import type { Env } from '../env';
export async function purgeProfile(env: Env,profile: Record<string,unknown>): Promise<void> {
 if (!env.CF_ZONE_ID || !env.CF_API_TOKEN) return;
 const sector = await env.DB.prepare('SELECT slug FROM sectors WHERE id = ?').bind(profile.sector_id ?? null).first<{slug:string}>();
 const paths = ['/sitemap.xml',...['en','ar'].flatMap(lang=>[`/${lang}`,`/${lang}/p/${profile.slug}`,`/${lang}/rss.xml`,...(sector ? [`/${lang}/sector/${sector.slug}`] : [])])];
 const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${env.CF_ZONE_ID}/purge_cache`,{method:'POST',headers:{Authorization:'Bearer '+env.CF_API_TOKEN,'Content-Type':'application/json'},body:JSON.stringify({files:paths.map(p=>'https://'+env.PUBLIC_HOST+p)})});
 if (!response.ok || !(await response.json() as {success:boolean}).success) throw new Error('Cache purge failed');
}