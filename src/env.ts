export interface Env {
 DB: D1Database; MEDIA: R2Bucket; ASSETS: Fetcher;
 PUBLIC_HOST: string; ADMIN_HOST: string; ACCESS_TEAM_DOMAIN: string; ACCESS_AUD: string;
 ADMIN_EMAILS?: string; DEV_AUTH_BYPASS?: string; DEV_USER_EMAIL?: string;
 CF_ZONE_ID?: string; CF_API_TOKEN?: string;
 FORM_RATE_LIMITER: { limit(options: {key: string}): Promise<{success: boolean}> };
}
export type AppEnv = { Bindings: Env; Variables: { email: string; nonce: string } };