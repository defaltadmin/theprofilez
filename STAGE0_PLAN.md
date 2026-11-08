# theprofilez.com: Stage 0 Plan (source of truth)

Bilingual (EN/AR) editorial site featuring prominent Saudi professionals, with a private admin for a non-technical editor. Repo: `defaltadmin/theprofilez` (private).

Status note: Devin built Stage 1 (admin) in a cloud sandbox, but it may never have been pushed. If `src/` is empty or missing, rebuild Stage 1 from this document, one task at a time. Use the reference screenshots in `docs/reference/` for the admin UI.

## Rules for any AI agent working in this repo

- Extend this project. Do NOT create standalone HTML sites or new projects.
- Work on a branch (`stage-1`, `stage-2`, ...). Small commits. Never touch `main`, never force-push.
- Never print, log or commit tokens or secrets. Secrets go in `.dev.vars` (gitignored) or `wrangler secret put`.
- Do not deploy, create or delete Cloudflare resources, or change DNS without showing the exact command and waiting for approval.
- The dev-only Access bypass must require an env var that is NEVER set in `wrangler.jsonc`, and must fail closed.
- Do one task, report results (test output, files changed), then STOP and wait for "next".
- Tests: use `@cloudflare/vitest-plugin` (NOT the old `@cloudflare/vitest-pool-workers`, which was renamed; the config API is unchanged).
- It is a Cloudflare **Worker** (Hono + TypeScript), not Cloudflare Pages. Use `wrangler.jsonc`, not `wrangler.toml`.

## Decisions already made

- Tags: a `tags` table with EN and AR names, linked to profiles (many-to-many).
- City: a fixed list of cities, each with an English and Arabic name.
- Fonts: IBM Plex Sans Arabic (Arabic), Source Serif 4 (English headlines), Inter (English body). Self-hosted, open licence.
- Brand: navy `#0B2140`, gold `#C9A04A`, white, as CSS variables (replaceable). Logo lives in `assets/brand/`.
- Tagline (EN): "Stories that move Saudi Arabia forward." Tagline (AR): "حكايات تلهم المستقبل". Admin eyebrow: "The people behind the progress". Admin subtitle: "Discover, shape and share remarkable Saudi stories."
- Profile content is written by the client; every profile needs a recorded consent confirmation before publishing.

## Architecture

One Worker (Hono + TypeScript) serves both hosts and routes by hostname:
- `theprofilez.com`: public site
- `admin.theprofilez.com`: admin UI and API (behind Cloudflare Access, Google login, email allowlist)

Static files (CSS, fonts, admin JS) are served through Workers Static Assets. D1 holds data; R2 holds photos, served through the Worker at `/img/:key` with long immutable caching.

Dependencies: `hono` at runtime; `wrangler`, `typescript`, `vitest` (+ `@cloudflare/vitest-plugin`) for development. Everything else uses built-in Worker features.

- **Access JWT verification:** WebCrypto checks the RS256 signature against Access's public keys (cached), plus issuer, audience and expiry. Runs on every admin/API request; failure gives 403.
- **HTML sanitizing:** Cloudflare's built-in HTML parser with a strict allowlist: `p, h2, h3, strong, em, ul, ol, li, a[href]`. Links must be http(s) or mailto and get `rel="noopener nofollow"`. Runs on the server at save time.
- **Search:** SQLite FTS5 in D1, kept in sync by triggers.
- **Caching:** public pages in the edge cache. On publish, unpublish or edit, purge affected URLs via the Cloudflare purge-by-URL API (profile in both languages, home, sector, RSS, sitemap). Needs an API token stored as a Worker secret (zone cache-purge permission only).
- **Security:** per-response CSP nonce, plus HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, `frame-ancestors 'none'`. Admin CSRF: strict Origin check, double-submit token, SameSite=Strict cookies. Public forms: server-side Turnstile check, hidden honeypot, Workers Rate Limiting binding.
- **Backups:** nightly scheduled job exports every table to R2 as NDJSON at `backups/YYYY-MM-DD/`; delete backups older than 30 days.

## Content rules

A profile appears in a language only if its required fields in that language (name, title, summary, body) are filled in. Otherwise that language's page returns 404 and there is no hreflang link to it.

URLs:
- `/en`, `/ar`
- profile: `/{lang}/p/{slug}`
- sector: `/{lang}/sector/{slug}`
- search: `/{lang}/search?q=`
- pages: `/{lang}/about`, `/contact`, `/privacy`, `/terms`, `/takedown`
- feeds/SEO: `/{lang}/rss.xml`, `/sitemap.xml`, `/robots.txt`

Slugs are Latin, generated from `name_en` (or transliterated from Arabic if there is no English name), kept unique. The same slug is used in both languages.

## Phase 2 readiness (design for it, do not build yet)

- `profiles` has a stable id.
- `audit_log` table records who changed what and when.
- Stub `social_posts` table: profile, platform, language, caption, card key, status (queued, posted, failed), scheduled time, external id.
- A Cloudflare Queue binding is reserved.
- The Share Kit caption builder is a shared module the queue can reuse later.

## File tree

```
theprofilez/
├─ wrangler.jsonc            # routes for both hosts, D1, R2, assets, ratelimit, cron
├─ package.json  tsconfig.json  vitest.config.ts  .dev.vars.example
├─ migrations/
│  ├─ 0001_init.sql          # sectors, cities, tags, profiles, indexes
│  ├─ 0002_fts.sql           # FTS5 + sync triggers
│  └─ 0003_ops.sql           # audit_log, contact_messages, takedown_requests, social_posts (stub)
├─ seed/seed.sql             # 8 sectors + cities + tags + 8 fake bilingual profiles (dev only)
├─ src/
│  ├─ index.ts               # Hono app, host router, scheduled() export
│  ├─ env.ts                 # binding types
│  ├─ lib/                   # access-jwt.ts, sanitize.ts, validate.ts, slug.ts, csrf.ts,
│  │                         # headers.ts (CSP/nonce), cache.ts (edge cache + purge),
│  │                         # turnstile.ts, i18n.ts, jsonld.ts, share-captions.ts, db.ts
│  ├─ public/                # routes.ts + views/ (layout, home, profile, sector, search,
│  │                         # static pages, forms) as escaped template-literal HTML
│  ├─ admin/                 # routes.ts (HTML shell) + api.ts (profiles CRUD, upload, publish)
│  ├─ seo/                   # sitemap.ts, rss.ts, robots.ts
│  └─ cron/export.ts         # D1 -> R2 backup
├─ assets/
│  ├─ css/site.css           # CSS variables, logical properties, mobile-first
│  ├─ fonts/                 # self-hosted subset woff2
│  ├─ brand/                 # logo -> favicon, OG fallback
│  └─ admin/                 # admin.css, app.js, editor.js, cropper.js, sharekit.js, sharecard.js
├─ test/                     # sanitize, jwt, slug, validation, routing/lang-availability tests
├─ docs/                     # STAGE0_PLAN.md, reference/ (screenshots), EDITOR_GUIDE.md
└─ README.md
```

## Admin UI (reference: `docs/reference/`)

Dark navy sidebar with the logo, "THE PROFILEZ / EDITORIAL STUDIO", a Workspace section with a "Profiles" item (EN / AR badge), the English and Arabic taglines at the bottom, and an "Editorial team / Secure workspace · Access protected" footer.

"New profile" page:
- **The story** card with English / العربية tabs. Fields per language: Full name, Professional title, Organisation, Short introduction, Pull quote, Full story (rich-text editor with B, I, H2, H3, bullet list, numbered list, Link).
- **Profile details** card: URL slug (auto-generated from name on save), Sector (select), City (select, bilingual names), Tags (multi-select, EN · AR labels), "Feature this profile" checkbox.
- **Portrait** card: file input (JPEG, PNG or WebP, up to 10 MB before compression), Photo alt text.
- **Permission to publish** card: checkbox "I confirm this person has consented to publication." and a Consent note field ("When and how was consent obtained?").
- **Links & presence**: LinkedIn, X / Twitter, Instagram, Facebook, website, organisation LinkedIn URL.
- Buttons: Save draft, Publish profile. Publish stays disabled until the consent checkbox is ticked (enforced client-side AND server-side).

## Admin details

- **Photos:** pick a file, crop to 4:5 in a small vanilla-JS cropper, export two WebP sizes (1200x1500 and 480x600) in the browser. The server re-checks the file type from its actual bytes and rejects anything over 2 MB after compression.
- **Editor:** a small contenteditable toolbar (bold, italic, headings, lists, links). HTML is sanitized again on the server on save.
- **Publishing:** blocked until `consent_confirmed` is true. Preview uses the real public templates and is not cached.
- **Delete:** soft delete via `deleted_at`.
- **Share card:** drawn on a 1200x630 canvas in the browser. Arabic text is set right-to-left and drawn only after the Arabic font has loaded, so letters join correctly.
- **Share Kit:** after publishing, show copy-ready captions per platform (LinkedIn, X, Instagram, Facebook) in EN and AR with URL and hashtags, plus a "who/what to tag" checklist built from the profile's fields (person, organisation, LinkedIn URLs).

## Design

Colours and fonts as CSS variables (see Decisions). RTL via CSS logical properties. Lighthouse 95+ target: no JS on public pages (except Turnstile on forms), critical CSS inlined, fonts preloaded, images in WebP with fixed dimensions.

## Stages and tasks (do one at a time)

**Stage 1: admin**
1. Worker foundation: `package.json`, `wrangler.jsonc`, `tsconfig`, Hono host router, migrations, seed.
2. Auth and security: Access JWT check, dev-only bypass (fails closed), CSRF, security headers, validation, sanitizer, audit log.
3. Admin API: profiles CRUD, upload to R2, publish/unpublish, soft delete.
4. Admin UI: form per the reference above, cropper, editor, consent gating.
5. Tests (`@cloudflare/vitest-plugin`): sanitize, jwt, slug, validation, language availability. `npm test` and `npx tsc --noEmit` must pass.

**Stage 2: public site**
6. Layout, home, profile page (EN/AR, RTL, hreflang rules).
7. Sector pages, search (FTS5), About/Privacy/Terms/Takedown.
8. Edge caching + purge on publish; Contact and Takedown forms with Turnstile, honeypot, rate limiting.

**Stage 3: SEO, sharing, ops**
9. Sitemap, robots, RSS, canonical, JSON-LD (Person + Article), OG/Twitter tags.
10. Share Kit and share card in the admin.
11. Nightly D1 -> R2 backup cron.
12. README with deploy steps and Access setup; `docs/EDITOR_GUIDE.md`.

## Deploy checklist (human-approved steps only)

1. Domain DNS is on Cloudflare.
2. Create D1 and R2; put their IDs in `wrangler.jsonc`; routes for both hostnames.
3. Run migrations on the remote database. Do NOT load the fake seed profiles into production (only sectors, cities, tags).
4. Set secrets: zone-limited purge token, Turnstile secret, Access team domain and audience.
5. Create the Access application for `admin.theprofilez.com` with Google login and an email allowlist.
6. Verify an admin request without a login gets 403, and the dev bypass var is not set.
7. Confirm the backup job runs.
