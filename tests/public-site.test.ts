import { describe, expect, it } from 'vitest';
import type { Env } from '../src/env';
import site from '../src/public';

function mockDb(profile: Record<string, unknown> | null = null) {
  const queries: string[] = [];
  const db = {
    prepare(sql: string) {
      queries.push(sql);
      return {
        bind() { return this; },
        async all() {
          if (sql.includes('FROM sectors')) return { results: [] };
          return { results: [] };
        },
        async first() { return profile; },
      };
    },
  };
  return { db: db as unknown as D1Database, queries };
}

describe('public editorial pages', () => {
  it('renders the English homepage with canonical, Open Graph and alternate language metadata', async () => {
    const { db } = mockDb();
    const response = await site.request('/en', {}, { DB: db } as Env);
    const html = await response.text();
    expect(response.status).toBe(200);
    expect(html).toContain('Discover people shaping what comes next.');
    expect(html).toContain('THE<span>PROFILEZ</span>');
    expect(html).toContain('<link rel="canonical" href="https://theprofilez.com/en">');
    expect(html).toContain('property="og:image"');
    expect(html).toContain('hreflang="ar"');
    expect(html).toContain('application/ld+json');
  });

  it('renders Arabic with right-to-left document direction', async () => {
    const { db } = mockDb();
    const response = await site.request('/ar', {}, { DB: db } as Env);
    const html = await response.text();
    expect(response.status).toBe(200);
    expect(html).toContain('<html lang="ar" dir="rtl">');
    expect(html).toContain('اكتشف الأشخاص الذين يصنعون ملامح المستقبل.');
  });

  it('serves robots rules and a share card', async () => {
    const { db } = mockDb();
    const robots = await site.request('/robots.txt', {}, { DB: db } as Env);
    expect(await robots.text()).toContain('Sitemap: https://theprofilez.com/sitemap.xml');
    const card = await site.request('/share-card.svg', {}, { DB: db } as Env);
    expect(card.headers.get('content-type')).toContain('image/svg+xml');
    expect(await card.text()).toContain('width="1200" height="630"');
  });

  it('serves XML sitemap and localized RSS feeds', async () => {
    const { db } = mockDb();
    const sitemap = await site.request('/sitemap.xml', {}, { DB: db } as Env);
    expect(sitemap.headers.get('content-type')).toContain('application/xml');
    expect(await sitemap.text()).toContain('hreflang="ar"');
    const feed = await site.request('/ar/feed.xml', {}, { DB: db } as Env);
    expect(feed.headers.get('content-type')).toContain('application/rss+xml');
    expect(await feed.text()).toContain('<language>ar</language>');
  });

  it('returns a not-found page for an unpublished or missing profile', async () => {
    const { db, queries } = mockDb(null);
    const response = await site.request('/en/profile/not-published', {}, { DB: db } as Env);
    expect(response.status).toBe(404);
    expect(queries[0]).toContain("p.status='published'");
    expect(queries[0]).toContain('p.deleted_at IS NULL');
  });

  it('escapes profile content before rendering it', async () => {
    const { db } = mockDb({
      id: '00000000-0000-4000-8000-000000000001',
      slug: 'sample-person',
      name: '<script>alert(1)</script>',
      title: 'Founder',
      organisation: '',
      summary: 'A safe summary.',
      body: '<img src=x onerror=alert(1)>',
      photo_key: null,
      city: null,
    });
    const response = await site.request('/en/profile/sample-person', {}, { DB: db } as Env);
    const html = await response.text();
    expect(response.status).toBe(200);
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
  });
});
