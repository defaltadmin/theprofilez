import { Hono } from 'hono';
import type { AppEnv } from '../env';
import { languageAvailable } from '../lib/i18n';
import { profileBySlug, publishedProfiles, featuredProfile, sectors, cities } from '../lib/db';
import { renderHome } from './views/home';
import { renderProfile } from './views/profile';
import { renderNotFound } from './views/notFound';

export const publicApp = new Hono<AppEnv>();

const VALID_LANGS = ['en', 'ar'] as const;

function isValidLang(lang: string): lang is 'en' | 'ar' {
 return VALID_LANGS.includes(lang as 'en' | 'ar');
}

publicApp.get('/', c => c.redirect('/en'));

publicApp.get('/:lang', async c => {
 const lang = c.req.param('lang');
 if (!isValidLang(lang)) return c.html(renderNotFound(lang), 404);

 const featured = await featuredProfile(c.env.DB);
 const latest = await publishedProfiles(c.env.DB);
 const sectorList = await sectors(c.env.DB);

 const featuredLang = featured && languageAvailable(featured, lang) ? featured : null;
 const latestLang = latest.filter(p => languageAvailable(p, lang)).slice(0, 9);

 return c.html(renderHome(lang, featuredLang, latestLang, sectorList));
});

publicApp.get('/:lang/p/:slug', async c => {
 const lang = c.req.param('lang');
 const slug = c.req.param('slug');
 if (!isValidLang(lang)) return c.html(renderNotFound(lang), 404);

 const profile = await profileBySlug(c.env.DB, slug);
 if (!profile) return c.html(renderNotFound(lang), 404);
 if (!languageAvailable(profile, lang)) return c.html(renderNotFound(lang), 404);

 const sectorList = await sectors(c.env.DB);
 const cityList = await cities(c.env.DB);
 const related = (await publishedProfiles(c.env.DB))
  .filter(p => p.id !== profile.id && languageAvailable(p, lang))
  .slice(0, 3);

 return c.html(renderProfile(lang, profile, sectorList, cityList, related));
});