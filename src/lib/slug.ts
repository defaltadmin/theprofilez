const arabic: Record<string,string> = {'ا':'a','أ':'a','إ':'i','آ':'a','ب':'b','ت':'t','ث':'th','ج':'j','ح':'h','خ':'kh','د':'d','ذ':'dh','ر':'r','ز':'z','س':'s','ش':'sh','ص':'s','ض':'d','ط':'t','ظ':'z','ع':'a','غ':'gh','ف':'f','ق':'q','ك':'k','ل':'l','م':'m','ن':'n','ه':'h','و':'w','ي':'y','ى':'a','ة':'h','ئ':'y','ؤ':'w','ء':''};
export function slugify(name: string): string {
 return name.split('').map(c=>arabic[c] ?? c).join('').normalize('NFKD').replace(/[\u0300-\u036f\u064b-\u065f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,100).replace(/-$/,'') || 'profile';
}
export async function uniqueSlug(db: D1Database, base: string, exclude = 0): Promise<string> {
 let candidate=base, n=2;
 while(await db.prepare('SELECT id FROM profiles WHERE slug = ? AND id != ?').bind(candidate,exclude).first()) candidate=base+'-'+n++;
 return candidate;
}