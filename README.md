# TheProfilez

A bilingual editorial profile platform built on Cloudflare Workers, D1 and R2. Implementation is delivered in staged milestones so the private editorial workflow can be reviewed before the public experience is built.

## Stack
- Cloudflare Workers and Hono for routing and API delivery
- D1 for bilingual profiles, sectors, audit events, contact and takedown request records
- R2 for profile photos
- Cloudflare Access JWT verification with `jose`
- TypeScript, Wrangler and Vitest

## Stage 1 foundation
- D1 relational schema, operational indexes and FTS5 search index
- Eight fictional bilingual seed profiles, all drafts with consent disabled
- Cloudflare Access JWT signature, issuer, audience and expiry verification
- Required admin email allowlist (fails closed if not configured)
- CSRF double-submit validation and baseline security headers
- Admin profile list and bilingual editor with sector selection
- Draft, publish, unpublish and soft-delete actions
- Publish gate requiring EN/AR name, title, summary and a documented consent note
- Automatic return to draft if an edit invalidates publish requirements
- Client-side square crop and WebP conversion for profile photos
- Server-side WebP signature and upload-size checks, R2 storage and authenticated upload route
- Public JSON endpoints expose only published profiles with complete content in the requested language

## Stage 2 public experience\n- Responsive editorial homepage with featured and recently published profiles\n- Bilingual English and Arabic routes with RTL layout for Arabic\n- Public profile detail pages with biographies, pull quotes, organisation, city and social links\n- Sector browsing and public search across names, titles, organisations and summaries\n- About, Contact, Privacy, Terms and profile-removal information pages\n- Public queries are restricted to published, non-archived profiles with complete content in the requested language\n- Public photo URLs use the existing published-profile-only media handler\n\nThe contact and profile-removal pages currently provide editorial instructions rather than a live submission workflow. The privacy and terms pages are starter copy and require legal review before launch.\n\n## Local setup
1. Install dependencies with `npm install`.
2. Create a D1 database and R2 bucket, then configure `wrangler.jsonc`.
3. Copy `.dev.vars.example` to `.dev.vars` and set local Access values.
4. Apply schema migrations: `npx wrangler d1 migrations apply theprofilez --local`.
5. Load fictional sample data: `npx wrangler d1 execute theprofilez --local --file=seed/seed.sql`.
6. Start the Worker: `npm run dev`.

See [EDITOR_GUIDE.md](./EDITOR_GUIDE.md) for Access configuration and editorial instructions.

## Deployment note
The checked-in Wrangler configuration intentionally contains placeholders. Do not deploy until a real D1 database ID, Access team domain, Access application audience and admin email allowlist have been configured. The `main` branch remains unchanged; implementation is on `feat/editorial-platform`.

Stage 1 has not been deployed to a live Cloudflare account. Run the typecheck and test suite in the project environment before merging.
