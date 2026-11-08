# TheProfilez

A bilingual editorial profile platform built on Cloudflare Workers, D1 and R2. The project is implemented in staged milestones to keep the public experience separate from the private editorial workflow.

## Stack
- Cloudflare Workers for routing and server-side rendering/API delivery
- D1 (SQLite) for profiles, sectors, consent records, audit events and requests
- R2 for profile media (binding configured; upload workflow follows in the next implementation pass)
- Hono for HTTP routing
- Cloudflare Access JWT validation using `jose`
- TypeScript, Wrangler and Vitest

## Stage 1 included
- Relational schema for bilingual profiles, sectors, audit log, contact messages, takedown requests and settings
- SQLite FTS5 index and update triggers
- Access JWT verification and optional email allowlist
- CSRF double-submit token for admin mutations
- Admin profile list and bilingual editor
- Draft, publish, unpublish and soft-delete actions
- Publish gate requiring complete EN/AR name, title and summary plus confirmed consent
- Public JSON read endpoints that only expose published profiles with a complete requested-language version
- Security headers and URL/text input handling

## Local setup
1. `npm install`
2. Create a D1 database and R2 bucket, then configure `wrangler.jsonc`.
3. Copy `.dev.vars.example` to `.dev.vars` and fill in local Access values.
4. `npx wrangler d1 migrations apply theprofilez --local`
5. `npm run dev`

See [EDITOR_GUIDE.md](./EDITOR_GUIDE.md) for Cloudflare Access and editorial instructions.

## Deployment note
The checked-in Wrangler configuration intentionally contains placeholders. Do not deploy until a real D1 database ID, Access team domain and Access application audience have been configured. The existing `main` branch remains untouched; implementation is on `feat/editorial-platform`.
