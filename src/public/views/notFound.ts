import { escapeHtml } from './escape';
import { layout } from './layout';

export function renderNotFound(lang: 'en' | 'ar'): string {
 const dir = lang === 'ar' ? 'rtl' : 'ltr';
 const heading = lang === 'ar' ? 'لم يتم العثور على الصفحة' : 'Page Not Found';
 const sub = lang === 'ar' ? 'الملف المطلوب غير موجود أو غير منشور.' : 'The requested profile is not found or not published.';
 const backHome = lang === 'ar' ? 'العودة إلى الصفحة الرئيسية' : 'Back to Home';

 const bodyHtml = `
  <section>
   <h1 style="font-family: var(--font-headline); font-size: 2rem; color: var(--color-navy);">${escapeHtml(heading)}</h1>
   <p style="font-size: 1.1rem; color: var(--color-ink); margin-bottom: 1.5rem;">${escapeHtml(sub)}</p>
   <a href="/${lang}" class="btn">${escapeHtml(backHome)}</a>
  </section>`;

 return layout(lang, dir, heading, bodyHtml);
}
