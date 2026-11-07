import {createEditor} from './editor.js';
import {setupCropper} from './cropper.js';
const $=s=>document.querySelector(s), form=$('#profile-form');
let meta,current={},status='all',editors={},searchTimer;
const message=text=>{$('#message').textContent=text;};
async function request(path,options={}) {
 const cookieName=location.protocol==='https:'?'__Host-csrf':'csrf';
 const token=document.cookie.split('; ').find(c=>c.startsWith(cookieName+'='))?.slice(cookieName.length+1);
 const response=await fetch('/api'+path,{...options,headers:{...(options.body instanceof FormData?{}:{'Content-Type':'application/json'}),'X-CSRF-Token':decodeURIComponent(token || ''),...options.headers}});
 const body=await response.json();if(!response.ok)throw new Error(body.error || 'Request failed');return body;
}
function element(tag,text,className){const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(className)el.className=className;return el;}
function field(name,label,kind='input'){const wrapper=element('label',label),input=document.createElement(kind);input.name=name;if(kind==='textarea')input.rows=3;wrapper.append(input);return wrapper;}
for(const lang of ['en','ar']){
 const pane=document.createElement('div');pane.dataset.pane=lang;pane.hidden=lang!=='en';pane.lang=lang;if(lang==='ar')pane.dir='rtl';
 for(const [key,label,kind] of [['name','Full name'],['title','Professional title'],['org','Organisation'],['summary','Short introduction','textarea'],['pull_quote','Pull quote','textarea']])pane.append(field(key+'_'+lang,label,kind));
 const label=element('label','Full story');pane.append(label);editors[lang]=createEditor(label);$('#language-fields').append(pane);
}
for(const [name,label] of [['linkedin_url','LinkedIn'],['x_url','X / Twitter'],['instagram_url','Instagram'],['facebook_url','Facebook'],['website_url','Website'],['org_linkedin_url','Organisation LinkedIn']]){const f=field(name,label);f.querySelector('input').type='url';f.querySelector('input').placeholder='https://';$('#social-fields').append(f);}
document.querySelectorAll('[data-lang]').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('[data-lang]').forEach(b=>b.classList.toggle('selected',b===button));document.querySelectorAll('[data-pane]').forEach(p=>p.hidden=p.dataset.pane!==button.dataset.lang);}));
function updateConsent(){const consent=form.elements.consent_confirmed.checked;$('#publish').disabled=!consent;$('#publish-help').textContent=consent?'Ready for server checks: complete one language and add photo alt text.':'Confirm consent to enable publishing.';}
form.elements.consent_confirmed.addEventListener('change',updateConsent);
function showEdit(profile={}){
 current=profile;form.reset();message('');cropper.reset();
 for(const control of form.elements){if(!control.name)continue;if(control.name==='tags'){for(const option of control.options)option.selected=(profile.tags || []).includes(Number(option.value));continue;}if(control.type==='checkbox')control.checked=Boolean(profile[control.name]);else control.value=profile[control.name]??'';}
 for(const lang of ['en','ar'])editors[lang].set(profile['body_'+lang]);
 $('#list-view').hidden=true;$('#edit-view').hidden=false;$('h1').textContent=profile.id?'Edit profile':'New profile';
 $('#edit-status').textContent=profile.status || 'draft';$('#edit-status').className='badge '+(profile.status || '');
 $('#unpublish').hidden=profile.status!=='published';$('#share-kit').hidden=profile.status!=='published';$('#delete').hidden=!profile.id;
 $('#preview').hidden=!profile.id;$('#preview').href='/preview/'+profile.id+'/en';
 form.querySelector('[type=submit]').textContent=profile.status==='published'?'Save changes':'Save draft';
 if(profile.photo_key){$('#photo-preview').src='/img/'+profile.photo_key+'-480.webp';$('#photo-preview').hidden=false;}
 updateConsent();window.scrollTo(0,0);
}
function read(){const data={};for(const control of form.elements){if(!control.name)continue;if(control.name==='tags')data.tags=[...control.selectedOptions].map(o=>Number(o.value));else data[control.name]=control.type==='checkbox'?(control.checked?1:0):control.value;}data.sector_id=data.sector_id?Number(data.sector_id):null;for(const lang of ['en','ar'])data['body_'+lang]=editors[lang].get();data.photo_key=current.photo_key || null;return data;}
async function save(){const result=await request(current.id?'/profiles/'+current.id:'/profiles',{method:current.id?'PUT':'POST',body:JSON.stringify(read())});showEdit(result);message('Profile saved.');return result;}
form.addEventListener('submit',async e=>{e.preventDefault();try{await save();}catch(e){message(e.message);}});
$('#publish').addEventListener('click',async()=>{try{const p=await save();const published=await request('/profiles/'+p.id+'/publish',{method:'POST'});showEdit({...p,...published});message('Profile published successfully.');}catch(e){message(e.message);}});
$('#unpublish').addEventListener('click',async()=>{try{await request('/profiles/'+current.id+'/unpublish',{method:'POST'});showEdit(await request('/profiles/'+current.id));message('Profile moved to draft.');}catch(e){message(e.message);}});
$('#delete').addEventListener('click',async()=>{if(!confirm('Delete this profile? It will be removed from the site.'))return;try{await request('/profiles/'+current.id,{method:'DELETE'});await showList();message('Profile deleted.');}catch(e){message(e.message);}});
const cropper=setupCropper({fileInput:$('#photo-file'),canvas:$('#crop-canvas'),zoom:$('#crop-zoom'),area:$('#crop-area'),button:$('#use-crop'),preview:$('#photo-preview'),onError:message,onUpload:async(large,small)=>{const body=new FormData();body.append('large',large,'large.webp');body.append('small',small,'small.webp');const result=await request('/upload',{method:'POST',body});current.photo_key=result.key;message('Portrait uploaded. Add alt text and save your profile.');}});
async function loadProfiles(){
 const profiles=await request('/profiles?status='+status+'&q='+encodeURIComponent($('#search').value));
 const tbody=$('#profiles');tbody.replaceChildren();
 for(const p of profiles){
 const tr=document.createElement('tr'),person=element('div',undefined,'person'),initials=p.name_en.split(' ').slice(0,2).map(n=>n[0]).join('');
 person.append(element('span',initials || 'P','portrait'));const description=document.createElement('div');description.append(element('strong',p.name_en || p.name_ar),element('small',p.title_en || p.title_ar));person.append(description);
 const personCell=document.createElement('td');personCell.append(person);tr.append(personCell,element('td',meta.sectors.find(s=>s.id===p.sector_id)?.name_en || '—'));
 const languages=document.createElement('td');for(const lang of ['en','ar'])if(['name','title','summary','body'].every(f=>p[f+'_'+lang]?.trim()))languages.append(element('span',lang.toUpperCase(),'language-badge'));tr.append(languages);
 const state=document.createElement('td');state.append(element('span',(p.status==='published'?'● Published':'○ Draft'), 'badge '+p.status));tr.append(state,element('td',p.updated_at?.slice(0,10)));
 const action=document.createElement('td'),button=element('button','Edit ↗');button.addEventListener('click',async()=>{try{showEdit(await request('/profiles/'+p.id));}catch(e){message(e.message);}});action.append(button);tr.append(action);tbody.append(tr);
 }
 if(!profiles.length){const row=document.createElement('tr'),cell=element('td','No profiles found. Create a new profile to get started.');cell.colSpan=6;row.append(cell);tbody.append(row);}
 $('#profile-count').textContent=profiles.length+' profile'+(profiles.length===1?'':'s');
}
async function showList(){$('#edit-view').hidden=true;$('#list-view').hidden=false;$('h1').textContent='Profiles';message('');await loadProfiles();}
$('#new-profile').addEventListener('click',()=>showEdit());
$('#back').addEventListener('click',()=>showList().catch(e=>message(e.message)));
document.querySelectorAll('[data-status]').forEach(button=>button.addEventListener('click',()=>{status=button.dataset.status;document.querySelectorAll('[data-status]').forEach(b=>b.classList.toggle('selected',b===button));loadProfiles().catch(e=>message(e.message));}));
$('#search').addEventListener('input',()=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>loadProfiles().catch(e=>message(e.message)),200);});
try{
 meta=await request('/meta');
 for(const [name,values,key] of [['sector_id',meta.sectors,'id'],['city',meta.cities,'slug'],['tags',meta.tags,'id']]){const select=form.elements[name];if(name!=='tags')select.append(new Option('Choose '+(name==='city'?'city':'sector'),'') );for(const value of values)select.append(new Option(value.name_en+' · '+value.name_ar,value[key]));}
 await loadProfiles();
}catch(e){message(e.message);}