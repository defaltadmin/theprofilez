# TheProfilez editor guide

## Access and sign-in
Protect `admin.theprofilez.com` with Cloudflare Access. Configure Google as the identity provider and restrict the application to the editorial administrator email addresses. The Worker independently verifies the `CF_Authorization` JWT signature, issuer, audience and expiry, then checks the `ADMIN_EMAILS` allowlist.

## Creating profiles
Open `https://admin.theprofilez.com` after signing in. Its root redirects to the protected `/admin` editor. Create a profile using a unique lowercase URL slug. Add English and Arabic name, professional title and summary, then complete the optional biography, organisation, city and social links. Record the consent note and tick the consent confirmation before saving.

New profiles are drafts. Publishing is blocked unless both language versions have a name, title and summary and a consent note is recorded. Unpublish returns a profile to draft. Delete is a soft delete and is recorded in the audit log.

## Profile photos
Save the text profile first. Choose a JPG, PNG or WebP image, adjust the square crop zoom, then upload. The browser converts the crop to a 1200 × 1200 WebP image. The Worker independently checks the WebP file signature and enforces a 3 MB upload limit before writing to the private R2 bucket. Photos are served through the Worker media route.

## Cloudflare setup
1. Create a D1 database named `theprofilez` and an R2 bucket named `theprofilez-media`.
2. Replace `REPLACE_WITH_D1_DATABASE_ID` in `wrangler.jsonc` with the database ID.
3. Set `ACCESS_TEAM_DOMAIN`, `ACCESS_AUD` and `ADMIN_EMAILS` as Worker variables/secrets. Do not commit real credentials.
4. Apply migrations: `npx wrangler d1 migrations apply theprofilez --remote`.
5. Install and deploy: `npm install` then `npm run deploy`.
6. Route the admin hostname through the same Worker and enforce Cloudflare Access at the edge.

## Demo data
`seed/seed.sql` contains eight fictional bilingual draft profiles. They are not published and have no consent confirmation. Use them for layout and editor testing only.

The current Stage 1 editor supports bilingual text, photo crop/upload, consent gating, drafts, publish/unpublish, soft deletion and audit events. Public editorial page templates, search UI, share cards, feeds and operational backup automation are subsequent stages.
