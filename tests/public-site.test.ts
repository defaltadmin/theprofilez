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
  it('renders the English homepage', async () => {
    const { db } = mockDb();
    const response = await site.request('/en', {}, { DB: db } as Env);
    const html = await response.text();
    expect(response.status).toBe(200);
    expect(html).toContain('Discover people shaping what comes next.');
    expect(html).toContain('THE<span>PROFILEZ</span>');
  });

  it('renders Arabic with right-to-left document direction', async () => {
    const { db } = mockDb();
    const response = await site.request('/ar', {}, { DB: db } as Env);
    const html = await response.text();
    expect(response.status).toBe(200);
    expect(html).toContain('<html lang="ar" dir="rtl">');
    expect(html).toContain('اكتشف الأشخاص الذين يصنعون ملامح المستقبل.');
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
