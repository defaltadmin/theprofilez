import { Hono } from 'hono';
import type { AppEnv } from '../env';
export const publicApp = new Hono<AppEnv>();
publicApp.get('/',c=>c.html('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>The Profilez · Coming soon</title><body><h1>The Profilez</h1><p>Saudi people. Remarkable stories. Coming soon.</p><p lang="ar" dir="rtl">شخصيات سعودية، حكايات ملهمة. قريباً.</p></body></html>'));