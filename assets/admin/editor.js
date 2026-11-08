const allowed = new Set(['P','BR','H2','H3','STRONG','EM','UL','OL','LI','A']);
const drop = new Set(['SCRIPT','STYLE','IFRAME','OBJECT','EMBED','SVG','MATH','TEMPLATE','NOSCRIPT','FORM']);
function clean(html) {
 const doc = new DOMParser().parseFromString(html,'text/html');
 const walk = node => {
 for (const child of [...node.childNodes]) {
 if(child.nodeType===8) {child.remove();continue;}
 if(child.nodeType!==1) continue;
 if(drop.has(child.tagName)) {child.remove();continue;}
 walk(child);
 const mapping={B:'strong',I:'em',H1:'h2',H4:'h3',H5:'h3',H6:'h3'};
 let el=child;
 if(mapping[child.tagName]) {el=doc.createElement(mapping[child.tagName]);el.append(...child.childNodes);child.replaceWith(el);}
 if(!allowed.has(el.tagName)) {el.replaceWith(...el.childNodes);continue;}
 const href=el.getAttribute('href');
 for(const attr of [...el.attributes]) el.removeAttribute(attr.name);
 if(el.tagName==='A' && href) {try{const url=new URL(href);if(['http:','https:','mailto:'].includes(url.protocol)){el.href=url.href;el.rel='noopener noreferrer nofollow';}}catch{}}
 }
 };
 walk(doc.body);return doc.body.innerHTML;
}
export function createEditor(container) {
 const toolbar=document.createElement('div');toolbar.className='editor-toolbar';
 const editor=document.createElement('div');editor.className='rich-editor';editor.contentEditable='true';editor.setAttribute('role','textbox');editor.setAttribute('aria-label','Profile body');editor.setAttribute('aria-multiline','true');
 for(const [label,command,value] of [['B','bold'],['I','italic'],['H2','formatBlock','h2'],['H3','formatBlock','h3'],['• List','insertUnorderedList'],['1. List','insertOrderedList'],['Link','createLink']]) {
 const button=document.createElement('button');button.type='button';button.textContent=label;button.setAttribute('aria-label',command);
 button.addEventListener('mousedown',event=>event.preventDefault());
 button.addEventListener('click',()=>{
 let argument=value;
 if(command==='createLink') {argument=prompt('Link URL (https://, http:// or mailto:)');if(!argument)return;try{if(!['http:','https:','mailto:'].includes(new URL(argument).protocol))return;}catch{return;}}
 editor.focus();document.execCommand(command,false,argument);
 });
 toolbar.append(button);
 }
 editor.addEventListener('paste',event=>{
 event.preventDefault();
 const html=event.clipboardData.getData('text/html');
 if(html) document.execCommand('insertHTML',false,clean(html));else document.execCommand('insertText',false,event.clipboardData.getData('text/plain'));
 });
 container.append(toolbar,editor);
 return {get:()=>clean(editor.innerHTML),set:html=>{editor.innerHTML=clean(html || '');}};
}