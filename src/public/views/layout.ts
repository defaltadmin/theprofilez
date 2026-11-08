import { escapeHtml } from './escape';

const CRITICAL_CSS = `
* { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body { font-family: var(--font-body); color: var(--color-ink); background: var(--color-paper); line-height: 1.6; }
a { color: var(--color-navy); text-decoration: none; }
.skip-link { position: absolute; left: -9999px; top: auto; width: 1px; height: 1px; overflow: hidden; }
.container { max-width: 720px; margin: 0 auto; padding: 0 1.25rem; }
.header-inner { display: flex; align-items: center; justify-content: space-between; padding: 1rem 0; border-bottom: 1px solid var(--color-line); }
.brand { font-family: var(--font-headline); font-weight: 700; font-size: 1.5rem; letter-spacing: -0.02em; color: var(--color-navy); }
.lang-toggle { font-size: 0.9rem; color: var(--color-muted); }
.lang-toggle a { color: var(--color-gold); }
.section-title { font-family: var(--font-headline); font-weight: 700; font-size: 1.25rem; margin: 2rem 0 1rem; color: var(--color-navy); }
.card { border: 1px solid var(--color-line); border-radius: var(--radius); background: var(--color-white); padding: 1rem; margin-bottom: 1rem; }
.btn { display: inline-block; padding: 0.6rem 1.2rem; border: 1px solid var(--color-navy); background: var(--color-navy); color: var(--color-white); border-radius: var(--radius); font-weight: 600; font-size: 0.95rem; cursor: pointer; text-decoration: none; }
.btn:hover { background: var(--color-gold); border-color: var(--color-gold); }
footer { border-top: 1px solid var(--color-line); padding: 2.5rem 0 1rem; margin-top: 3rem; color: var(--color-muted); font-size: 0.9rem; }
footer a { color: var(--color-navy); text-decoration: underline; }
@media (max-width: 480px) { .container { padding: 0 1rem; } }
`;

export function layout(lang: 'en' | 'ar', dir: 'ltr' | 'rtl', title: string, bodyHtml: string): string {
 const otherLang = lang === 'en' ? 'ar' : 'en';
 const otherLangName = lang === 'en' ? 'العربية' : 'English';
 const otherHref = lang === 'en' ? '/ar' : '/en';
 return `<!doctype html>
<html lang="${lang}" dir="${dir}">
<head>
 <meta charset="utf-8" />
 <meta name="viewport" content="width=device-width,initial-scale=1" />
 <title>${escapeHtml(title)} — The Profilez</title>
 <link rel="icon" type="image/png" href="/brand/favicon.png" />
 <link rel="preload" as="font" href="/fonts/inter-latin-wght-normal.woff2" />
 <link rel="preload" as="font" href="/fonts/ibm-plex-sans-arabic-arabic-400-normal.woff2" />
 <link rel="preload" as="font" href="/fonts/source-serif-4-latin-400-normal.woff2" />
 <link rel="stylesheet" href="/css/site.css" />
 <style>${CRITICAL_CSS}</style>
</head>
<body>
 <a class="skip-link" href="#main">Skip to main content</a>
 <header>
  <div class="container header-inner">
   <a class="brand" href="/${lang}">The Profilez</a>
   <div class="lang-toggle">
    <a href="${otherHref}">${otherLangName}</a>
   </div>
  </div>
 </header>
 <main id="main">
  <div class="container">
   ${bodyHtml}
  </div>
 </main>
 <footer>
  <div class="container">
   <nav style="margin-bottom: 1rem;">
    <a href="/${lang}/about">About</a>
    <a href="/${lang}/privacy">Privacy</a>
    <a href="/${lang}/terms">Terms</a>
    <a href="/${lang}/takedown">Takedown</a>
   </nav>
   <p>&copy; <span id="year"></span> Mohammed Siddiqui. Built with Cloudflare Workers.</p>
  </div>
 </footer>
 <script>document.getElementById('year').textContent = new Date().getFullYear();</script>
</body>
</html>`;
}
