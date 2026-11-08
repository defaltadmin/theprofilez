export function languageAvailable(profile: Record<string, unknown>, lang: 'en' | 'ar'): boolean {
 return ['name','title','summary','body'].every(field => typeof profile[field+'_'+lang] === 'string' && String(profile[field+'_'+lang]).replace(/<[^>]*>/g,'').replace(/&nbsp;|&#160;/g,' ').trim().length > 0);
}