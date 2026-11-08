const requiredFields=['name_en','name_ar','title_en','title_ar','summary_en','summary_ar'] as const;
export function canPublishProfile(profile:Record<string,unknown>):boolean{return requiredFields.every(key=>typeof profile[key]==='string'&&profile[key].trim().length>0)&&Boolean(profile.consent_confirmed)&&typeof profile.consent_note==='string'&&profile.consent_note.trim().length>0;}
