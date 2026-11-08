import { escapeHtml } from './escape';
import { layout } from './layout';

export function renderHome(lang: 'en' | 'ar', featured: Record<string, unknown> | null, latest: Record<string, unknown>[], sectors: Record<string, unknown>[]): string {
 const dir = lang === 'ar' ? 'rtl' : 'ltr';
 const heading = lang === 'ar' ? 'شخصيات سعودية، حكايات ملهمة' : 'Remarkable Saudi Stories';
 const sub = lang === 'ar' ? 'قصصٌ تُلهم المستقبل' : 'Stories that move Saudi Arabia forward.';
 const featuredLabel = lang === 'ar' ? 'مُمَيَّز' : 'Featured';
 const latestLabel = lang === 'ar' ? 'أحدث الملفات' : 'Latest Profiles';
 const sectorLabel = lang === 'ar' ? 'القطاع' : 'Sector';

 let featuredHtml = '';
 if (featured) {
  const name = lang === 'ar' && featured.name_ar ? featured.name_ar : featured.name_en;
  const title = lang === 'ar' && featured.title_ar ? featured.title_ar : featured.title_en;
  const org = lang === 'ar' && featured.org_ar ? featured.org_ar : featured.org_en;
  const photoKey = featured.photo_key as string;
  const photoAlt = featured.photo_alt as string;
  featuredHtml = `
   <article class="card" style="margin-bottom: 2rem;">
    <div style="display: flex; gap: 1rem; align-items: center;">
     <img src="/img/${escapeHtml(photoKey)}-480.webp" width="480" height="600" alt="${escapeHtml(photoAlt)}" loading="lazy" style="width: 120px; height: 150px; object-fit: cover; border-radius: 8px;" />
     <div>
      <span style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--color-gold); font-weight: 700;">${featuredLabel}</span>
      <h1 style="font-family: var(--font-headline); font-size: 1.75rem; margin: 0.25rem 0 0.25rem; color: var(--color-navy);">${escapeHtml(name)}</h1>
      <p style="font-size: 1.1rem; color: var(--color-ink); margin: 0 0 0.25rem;">${escapeHtml(title)}</p>
      ${org ? `<p style="font-size: 0.95rem; color: var(--color-muted); margin: 0;">${escapeHtml(org)}</p>` : ''}
     </div>
    </div>
   </article>`;
 }

 const latestHtml = latest.map(p => {
  const name = lang === 'ar' && p.name_ar ? p.name_ar : p.name_en;
  const title = lang === 'ar' && p.title_ar ? p.title_ar : p.title_en;
  const photoKey = p.photo_key as string;
  const photoAlt = p.photo_alt as string;
  const sectorId = p.sector_id as number;
  const sector = sectors.find((s: any) => s.id === sectorId);
  const sectorName = lang === 'ar' ? (sector?.name_ar || sector?.name_en) : (sector?.name_en || sector?.name_ar);
  const slug = p.slug as string;
  return `
   <article class="card">
    <a href="/${lang}/p/${escapeHtml(slug)}" style="text-decoration: none; color: inherit; display: block;">
     <img src="/img/${escapeHtml(photoKey)}-480.webp" width="480" height="600" alt="${escapeHtml(photoAlt)}" loading="lazy" style="width: 100%; height: 200px; object-fit: cover; border-radius: 6px;" />
     <h3 style="font-family: var(--font-headline); font-size: 1.1rem; margin: 0.5rem 0 0.25rem; color: var(--color-navy);">${escapeHtml(name)}</h3>
     <p style="font-size: 0.9rem; color: var(--color-ink); margin: 0 0 0.25rem;">${escapeHtml(title)}</p>
     ${sectorName ? `<span style="font-size: 0.75rem; color: var(--color-gold); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">${escapeHtml(sectorName)}</span>` : ''}
    </a>
   </article>`;
 }).join('');

 const sectorChips = sectors.map(s => {
  const name = lang === 'ar' && s.name_ar ? s.name_ar : s.name_en;
  return `<span style="font-size: 0.8rem; color: var(--color-gold); border: 1px solid var(--color-gold); padding: 0.25rem 0.6rem; border-radius: 999px; margin-right: 0.5rem; display: inline-block; margin-bottom: 0.5rem;">${escapeHtml(name)}</span>`;
 }).join('');

 const bodyHtml = `
  <section>
   <h1 style="font-family: var(--font-headline); font-size: 2rem; margin-bottom: 0.5rem; color: var(--color-navy);">${escapeHtml(heading)}</h1>
   <p style="font-size: 1.1rem; color: var(--color-ink); margin-bottom: 1.5rem;">${escapeHtml(sub)}</p>
   ${featuredHtml}
   <h2 style="font-family: var(--font-headline); font-size: 1.25rem; margin-bottom: 1rem; color: var(--color-navy);">${escapeHtml(latestLabel)}</h2>
   <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem;">
    ${latestHtml || '<p style="color: var(--color-muted);">No profiles yet.</p>'}
   </div>
   <h2 style="font-family: var(--font-headline); font-size: 1.25rem; margin: 2rem 0 0.5rem; color: var(--color-navy);">Sectors</h2>
   <div>${sectorChips}</div>
  </section>`;

 return layout(lang, dir, heading, bodyHtml);
}
