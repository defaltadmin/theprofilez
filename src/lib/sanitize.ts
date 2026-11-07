const allowed = new Set(['p','br','h2','h3','strong','em','ul','ol','li','a']);
const drop = new Set(['script','style','iframe','object','embed','svg','math','template','noscript','form']);
const mapped: Record<string,string> = {b:'strong',i:'em',h1:'h2',h4:'h3',h5:'h3',h6:'h3'};
export async function sanitize(html: string): Promise<string> {
 const rewriter = new HTMLRewriter().on('*',{
 element(el) {
 const tag = el.tagName.toLowerCase();
 if (drop.has(tag)) { el.remove(); return; }
 const target = mapped[tag] || tag;
 if (!allowed.has(target)) { el.removeAndKeepContent(); return; }
 let href = el.getAttribute('href');
 for (const [name] of [...el.attributes]) el.removeAttribute(name);
 el.tagName = target;
 if (target === 'a') {
 if (href) {
 href = href.trim();
 try { const u = new URL(href); if (['http:','https:','mailto:'].includes(u.protocol)) el.setAttribute('href',u.href); } catch {}
 }
 el.setAttribute('rel','noopener noreferrer nofollow');
 }
 }, comments(comment) { comment.remove(); }
 }).onDocument({comments(comment) {comment.remove();}});
 return rewriter.transform(new Response(html,{headers:{'Content-Type':'text/html;charset=utf-8'}})).text();
}