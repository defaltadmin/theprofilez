import { languageAvailable } from './i18n';
export const textFields = ['name_en','name_ar','title_en','title_ar','org_en','org_ar','summary_en','summary_ar','body_en','body_ar','pull_quote_en','pull_quote_ar','photo_alt','consent_note','linkedin_url','x_url','instagram_url','facebook_url','website_url','org_linkedin_url'];
const domains: Record<string,string[]> = {linkedin_url:['linkedin.com'],org_linkedin_url:['linkedin.com'],x_url:['x.com','twitter.com'],instagram_url:['instagram.com'],facebook_url:['facebook.com']};
export async function validateProfile(input: unknown,db: D1Database): Promise<Record<string,unknown>> {
 if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Expected a profile object');
 const raw = input as Record<string,unknown>, out: Record<string,unknown> = {};
 for (const field of textFields) {
 const value = raw[field] ?? '';
 const max = field.startsWith('body_') ? 100000 : field.startsWith('summary_') || field === 'consent_note' ? 2000 : field.endsWith('_url') ? 2048 : 500;
 if (typeof value !== 'string' || value.length > max) throw new Error(field+' must be text, at most '+max+' characters');
 out[field] = value.trim();
 if (field.endsWith('_url') && value) {
 let u: URL; try {u=new URL(value);} catch {throw new Error(field+' must be a valid URL');}
 if (u.protocol !== 'https:' || u.username || u.password || (domains[field] && !domains[field].some(d=>u.hostname===d || u.hostname.endsWith('.'+d)))) throw new Error(field+' must use HTTPS and the correct platform domain');
 }
 }
 if (!out.name_en && !out.name_ar) throw new Error('A name is required in at least one language');
 if (raw.slug !== undefined && (typeof raw.slug !== 'string' || (raw.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(raw.slug)) || raw.slug.length > 120)) throw new Error('Invalid slug');
 out.slug = raw.slug || '';
 for (const flag of ['featured','consent_confirmed']) {
 if (raw[flag] !== undefined && ![true,false,0,1].includes(raw[flag] as boolean)) throw new Error('Invalid '+flag);
 out[flag] = raw[flag] ? 1 : 0;
 }
 const sector = raw.sector_id == null || raw.sector_id === '' ? null : Number(raw.sector_id);
 if (sector !== null && (!Number.isInteger(sector) || !await db.prepare('SELECT id FROM sectors WHERE id = ?').bind(sector).first())) throw new Error('Invalid sector');
 out.sector_id=sector;
 const city = raw.city || null;
 if (city !== null && (typeof city !== 'string' || !await db.prepare('SELECT id FROM cities WHERE slug = ?').bind(city).first())) throw new Error('Invalid city');
 out.city=city;
 const tags = raw.tags ?? [];
 if (!Array.isArray(tags) || tags.length > 30 || tags.some(id=>!Number.isInteger(id)) || new Set(tags).size !== tags.length) throw new Error('Invalid tags');
 for (const id of tags) if (!await db.prepare('SELECT id FROM tags WHERE id = ?').bind(id).first()) throw new Error('Unknown tag');
 out.tags=tags;
 if (raw.photo_key != null && (typeof raw.photo_key !== 'string' || !/^photos\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(raw.photo_key))) throw new Error('Invalid photo key');
 out.photo_key=raw.photo_key || null;
 return out;
}
export function publishError(p: Record<string,unknown>): string | null {
 if (p.consent_confirmed !== 1) return 'Consent must be confirmed before publishing';
 if (!languageAvailable(p,'en') && !languageAvailable(p,'ar')) return 'Complete name, title, summary and body in at least one language';
 if (p.photo_key && !String(p.photo_alt || '').trim()) return 'Photo alt text is required';
 return null;
}