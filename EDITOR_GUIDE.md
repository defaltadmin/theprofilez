# TheProfilez editor guide

## Access and sign-in
Protect `admin.theprofilez.com` with Cloudflare Access. Configure Google as the identity provider and restrict the application to the editorial administrator email addresses. The Worker independently verifies the `CF_Authorization` JWT signature, issuer, audience and expiry, then checks `ADMIN_EMAILS` when configured.

## Creating profiles
Open `/admin` after signing in. Create a profile using a unique lowercase URL slug. Add English and Arabic name, professional title and summary, then complete the optional biography, organisation, city and social links. Record the consent note and tick the consent confirmation before saving.

New profiles are drafts. Publishing is blocked unless both language versions have a name, title and summary and consent is confirmed. Unpublish returns a profile to draft. Delete is a soft delete in the API and is recorded in the audit log.

## Cloudflare setup
1. Create a D1 database named `theprofilez` and an R2 bucket named `theprofilez-media`.
2. Replace `REPLACE_WITH_D1_DATABASE_ID` in `wrangler.jsonc` with the database ID.
3. Set `ACCESS_TEAM_DOMAIN`, `ACCESS_AUD` and `ADMIN_EMAILS` as Worker variables/secrets. Do not commit real credentials.
4. Apply migrations: `npx wrangler d1 migrations apply theprofilez --remote`.
5. Install and deploy: `npm install` then `npm run deploy`.
6. Route the admin hostname through the same Worker and enforce Cloudflare Access at the edge.

The current Stage 1 editor supports bilingual text content, consent gating, drafts, publish/unpublish, soft deletion and audit events. Image upload/cropping, public editorial page templates, search UI, share cards, feeds and full operational backup automation are planned for later stages.
