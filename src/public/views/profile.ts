import { escapeHtml } from './escape';
import { layout } from './layout';

export function renderProfile(lang: 'en' | 'ar', profile: Record<string, unknown>, sectors: Record<string, unknown>[], cities: Record<string, unknown>[], related: Record<string, unknown>[]): string {
 const dir = lang === 'ar' ? 'rtl' : 'ltr';
 const name = lang === 'ar' && profile.name_ar ? profile.name_ar : profile.name_en;
 const title = lang === 'ar' && profile.title_ar ? profile.title_ar : profile.title_en;
 const org = lang === 'ar' && profile.org_ar ? profile.org_ar : profile.org_en;
 const summary = lang === 'ar' && profile.summary_ar ? profile.summary_ar : profile.summary_en;
 const body = lang === 'ar' && profile.body_ar ? profile.body_ar : profile.body_en;
 const pullQuote = lang === 'ar' && profile.pull_quote_ar ? profile.pull_quote_ar : profile.pull_quote_en;
 const photoKey = profile.photo_key as string;
 const photoAlt = profile.photo_alt as string;
 const sectorId = profile.sector_id as number;
 const city = profile.city as string;
 const sector = sectors.find((s: any) => s.id === sectorId);
 const sectorName = lang === 'ar' ? (sector?.name_ar || sector?.name_en) : (sector?.name_en || sector?.name_ar);
 const cityObj = cities.find((c: any) => c.slug === city);
 const cityName = lang === 'ar' ? (cityObj?.name_ar || cityObj?.name_en) : (cityObj?.name_en || cityObj?.name_ar);

 const socialLinks: Array<{label: string; url?: string; icon: string}> = [
  { label: 'LinkedIn', url: profile.linkedin_url as string, icon: 'in' },
  { label: 'X', url: profile.x_url as string, icon: 'x' },
  { label: 'Instagram', url: profile.instagram_url as string, icon: 'camera' },
  { label: 'Facebook', url: profile.facebook_url as string, icon: 'f' },
  { label: 'Website', url: profile.website_url as string, icon: 'globe' },
  { label: 'Organisation LinkedIn', url: profile.org_linkedin_url as string, icon: 'briefcase' },
 ].filter(l => l.url);

 const socialHtml = socialLinks.map(l => `
  <a href="${escapeHtml(l.url!)}" target="_blank" rel="noopener" class="btn" style="margin-top: 0.5rem; font-size: 0.85rem; padding: 0.4rem 0.8rem;">${escapeHtml(l.label)}</a>
 `).join('');

 const tagsHtml = [
  sectorName ? `<span style="font-size: 0.75rem; color: var(--color-gold); border: 1px solid var(--color-gold); padding: 0.2rem 0.5rem; border-radius: 999px; margin-right: 0.4rem; margin-bottom: 0.4rem; display: inline-block;">${escapeHtml(sectorName)}</span>` : '',
  cityName ? `<span style="font-size: 0.75rem; color: var(--color-gold); border: 1px solid var(--color-gold); padding: 0.2rem 0.5rem; border-radius: 999px; margin-right: 0.4rem; margin-bottom: 0.4rem; display: inline-block;">${escapeHtml(cityName)}</span>` : '',
 ].join('');

 const relatedHtml = related.length > 0 ? `
  <section style="margin-top: 3rem;">
   <h2 style="font-family: var(--font-headline); font-size: 1.25rem; margin-bottom: 1rem; color: var(--color-navy);">Related Profiles</h2>
   <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 1rem;">
    ${related.map(p => {
     const rName = lang === 'ar' && p.name_ar ? p.name_ar : p.name_en;
     const rSlug = p.slug as string;
     const rPhotoKey = p.photo_key as string;
     const rPhotoAlt = p.photo_alt as string;
     return `
     <article class="card" style="padding: 0.5rem;">
      <a href="/${lang}/p/${escapeHtml(rSlug)}" style="text-decoration: none; color: inherit; display: block;">
       <img src="/img/${escapeHtml(rPhotoKey)}-480.webp" width="480" height="600" alt="${escapeHtml(rPhotoAlt)}" loading="lazy" style="width: 100%; height: 160px; object-fit: cover; border-radius: 6px;" />
       <h3 style="font-family: var(--font-headline); font-size: 0.95rem; margin: 0.5rem 0 0.25rem; color: var(--color-navy);">${escapeHtml(rName)}</h3>
      </a>
     </article>`;
    }).join('')}
   </div>
  </section>` : '';

 const bodyHtml = `
  <article class="card">
   <div style="display: flex; gap: 1rem; align-items: flex-start; margin-bottom: 1.5rem;">
    <img src="/img/${escapeHtml(photoKey)}-1200.webp" width="1200" height="1500" srcset="/img/${escapeHtml(photoKey)}-480.webp 480w, /img/${escapeHtml(photoKey)}-1200.webp 1200w" sizes="(max-width: 480px) 100vw, 50vw" alt="${escapeHtml(photoAlt)}" loading="lazy" style="width: 160px; height: 200px; object-fit: cover; border-radius: 8px; flex-shrink: 0;" />
    <div>
     <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.5rem;">${tagsHtml}</div>
     <h1 style="font-family: var(--font-headline); font-size: 2rem; margin: 0 0 0.25rem; color: var(--color-navy);">${escapeHtml(name)}</h1>
     <p style="font-size: 1.1rem; color: var(--color-ink); margin: 0 0 0.25rem;">${escapeHtml(title)}</p>
     ${org ? `<p style="font-size: 0.95rem; color: var(--color-muted); margin: 0;">${escapeHtml(org)}</p>` : ''}
    </div>
   </div>
   ${pullQuote ? `<blockquote style="font-family: var(--font-headline); font-size: 1.25rem; color: var(--color-navy); border-left: 3px solid var(--color-gold); padding-left: 1rem; margin: 1.5rem 0; font-style: italic;">“${escapeHtml(pullQuote)}”</blockquote>` : ''}
   ${summary ? `<p style="font-size: 1.05rem; color: var(--color-ink); margin-bottom: 1.5rem;">${escapeHtml(summary)}</p>` : ''}
   <div style="white-space: pre-wrap;">${body}</div>
   ${socialHtml}
  </article>
  ${relatedHtml}`;

 return layout(lang, dir, name, bodyHtml);
}
