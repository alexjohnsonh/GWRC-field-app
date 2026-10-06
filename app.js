const YN=['Yes','No'], PF=['Pass','Fail'], GFP=['Good','Fair','Poor'], LC=['Laminar','Complex'];
const SECTIONS=[
 {t:'Asset identification',f:[
  {k:'culvert_no',l:'Culvert No.',type:'text',req:1},
  {k:'location',l:'GPS location',hint:'latitude, longitude',type:'gps',csv:'GPS location (lat, long)'}]},
 {t:'Inspection details',f:[
  {k:'inspector',l:'Name of inspector',type:'text',req:1,remember:1},
  {k:'date',l:'Inspection date',type:'date',req:1,half:1},
  {k:'time',l:'Inspection time',type:'time',req:1,half:1},
  {k:'weather',l:'Weather conditions at the time of inspection',type:'choice',opts:['Fine','Overcast','Showers','Rain'],req:1}]},
 {t:'Assessment of fish passage against WS.7',f:[
  {k:'debris_clear',l:'Is the waterway within the culvert substantively clear of debris?',type:'choice',opts:YN,req:1,bad:'No'},
  {k:'erosion',l:'Has any erosion of the stream bank or bed occurred because of the culvert/stream works?',type:'choice',opts:YN,req:1,bad:'Yes'},
  {k:'remedial',l:'If so, are remedial works required?',type:'choice',opts:['NA','Yes','No'],req:1,bad:'Yes'},
  {k:'impeded_to',l:'Is fish passage to the culvert impeded?',type:'choice',opts:YN,req:1,bad:'Yes'},
  {k:'impeded_through',l:'Is fish passage through the culvert impeded?',type:'choice',opts:YN,req:1,bad:'Yes'},
  {k:'ws7_comments',l:'Comments',csv:'WS.7 comments',type:'textarea'}]},
 {t:'Upstream & inlet',f:[
  {k:'vel_up',l:'Velocity upstream',type:'choice',opts:LC,req:1},
  {k:'inlet_cond',l:'Inlet condition',type:'choice',opts:GFP,req:1,bad:'Poor'},
  {k:'scour_in',l:'Erosion or scouring at inlet',type:'choice',opts:YN,req:1,bad:'Yes'},
  {k:'veg_in',l:'Vegetation at inlet',hint:'excluding planter pods',type:'choice',opts:YN,req:1},
  {k:'us_tie',l:'Upstream tie-in',type:'choice',opts:PF,req:1,bad:'Fail'},
  {k:'ph1',l:'Upstream of culvert',type:'photo',req:1,half:1,n:1,g:'up'},
  {k:'ph2',l:'Upstream end of culvert',type:'photo',req:1,half:1,n:2,g:'up'}]},
 {t:'Within the culvert',f:[
  {k:'culvert_cond',l:'Condition in culvert',type:'choice',opts:GFP,req:1,bad:'Poor'},
  {k:'vel_in',l:'Velocities in culvert',type:'choice',opts:LC,req:1},
  {k:'depth',l:'Water depth',type:'number',unit:'mm',req:1,half:1},
  {k:'flow',l:'Flow rate (estimate)',type:'number',unit:'L/s',req:1,half:1,step:'any'},
  {k:'sed_in',l:'Sediment / debris accumulation within culvert',type:'choice',opts:YN,req:1,bad:'Yes'},
  {k:'baffles',l:'Baffles / flexi baffles',type:'choice',opts:PF,req:1,bad:'Fail'},
  {k:'spat_rope',l:'Spat rope',type:'choice',opts:PF,req:1,bad:'Fail'}]},
 {t:'Downstream & outlet',f:[
  {k:'vel_out',l:'Velocity at outlet',type:'choice',opts:LC,req:1},
  {k:'outlet_cond',l:'Outlet condition',type:'choice',opts:GFP,req:1,bad:'Poor'},
  {k:'sed_out',l:'Sediment / debris accumulation at outlet',type:'choice',opts:YN,req:1,bad:'Yes'},
  {k:'scour_out',l:'Erosion or scouring at outlet',type:'choice',opts:YN,req:1,bad:'Yes'},
  {k:'veg_out',l:'Vegetation at outlet',hint:'excluding planter pods',type:'choice',opts:YN,req:1},
  {k:'apron_channels',l:'Concrete channels on apron',type:'choice',opts:PF,req:1,bad:'Fail'},
  {k:'planter_pods',l:'Planter pods',type:'choice',opts:PF,req:1,bad:'Fail'},
  {k:'ds_tie',l:'Downstream tie-ins',type:'choice',opts:PF,req:1,bad:'Fail'},
  {k:'ph3',l:'Downstream of culvert',type:'photo',req:1,half:1,n:3,g:'down'},
  {k:'ph4',l:'Downstream end of culvert',type:'photo',req:1,half:1,n:4,g:'down'}]},
 {t:'Species & general notes',f:[
  {k:'species',l:'Species observed during inspection',hint:'What & where?',type:'textarea'},
  {k:'final_comments',l:'Other comments',csv:'General comments',type:'textarea'}]},
];
const FIELDS=SECTIONS.flatMap(s=>s.f), REQ=FIELDS.filter(f=>f.req), PHOTOS=FIELDS.filter(f=>f.type==='photo');
const KEY={recs:'fpi.records.v1',draft:'fpi.draft.v1',prefs:'fpi.prefs.v1'};
const $=id=>document.getElementById(id);

let storageOK=true;
function load(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){storageOK=false;return d}}
function store(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){storageOK=false;$('storeWarn').hidden=false;return false}}
try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist()}catch(e){}

let records=load(KEY.recs,[]), prefs=load(KEY.prefs,{}), cur=load(KEY.draft,null);
let auth=load('fpi.auth.v1',null); // {name,email,role} remembered on this phone after first sign-in
const pad=n=>String(n).padStart(2,'0');
function nowParts(){const d=new Date();return{date:`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`,time:`${pad(d.getHours())}:${pad(d.getMinutes())}`}}
function fresh(){if(typeof gpsAutoDone!=='undefined')gpsAutoDone=false;const n=nowParts();return{id:null,v:{inspector:prefs.inspector||(auth&&auth.name)||'',date:n.date,time:n.time}}}
if(!cur)cur=fresh();

/* ---------- build form ---------- */
const form=$('form');
function esc(s){return String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
function fieldHTML(f){
  const star=f.req?'<span class="req" aria-hidden="true">*</span>':'';
  const hint=f.hint?`<span class="hint">${esc(f.hint)}</span>`:'';
  if(f.type==='choice'){
    return `<div class="field" data-k="${f.k}"><span class="q" id="q-${f.k}">${esc(f.l)}${star}${hint}</span>
      <div class="seg" role="radiogroup" aria-labelledby="q-${f.k}">${f.opts.map(o=>`<button type="button" role="radio" aria-checked="false" data-k="${f.k}" data-v="${o}">${o}</button>`).join('')}</div></div>`;
  }
  if(f.type==='gps')return `<div class="field" data-k="${f.k}"><label for="f-${f.k}">${esc(f.l)}${hint}</label>
      <div class="gps"><input id="f-${f.k}" data-k="${f.k}" type="text" inputmode="decimal" autocomplete="off" placeholder="-41.10000, 174.90000">
      <button class="btn" type="button" id="gpsBtn">Use my location</button></div>
      <p class="fieldnote" id="gpsNote">GPS works without cell coverage. Stand at the culvert.</p></div>`;
  if(f.type==='photo')return `<div class="field" data-k="${f.k}"><span class="q">${esc(f.l)}${star}</span>
      <div class="shot" id="s-${f.k}"><span>Not taken yet</span></div>
      <div class="shotbtns"><label class="btn shotbtn" for="f-${f.k}" id="b-${f.k}">Take photo</label>
      <button type="button" class="btn shotbtn" data-move="${f.k}" id="m-${f.k}" hidden>Change view</button></div>
      <input id="f-${f.k}" data-k="${f.k}" type="file" accept="image/*" capture="environment" hidden></div>`;
  const lab=`<label for="f-${f.k}">${esc(f.l)}${star}${hint}</label>`;
  if(f.type==='textarea')return `<div class="field" data-k="${f.k}">${lab}<textarea id="f-${f.k}" data-k="${f.k}"></textarea></div>`;
  if(f.type==='number')return `<div class="field" data-k="${f.k}">${lab}<div class="unit"><input id="f-${f.k}" data-k="${f.k}" type="number" inputmode="decimal" min="0" step="${f.step||'any'}"><span>${f.unit}</span></div></div>`;
  return `<div class="field" data-k="${f.k}">${lab}<input id="f-${f.k}" data-k="${f.k}" type="${f.type}" ${f.type==='text'?'autocomplete="off" autocapitalize="characters"':''}></div>`;
}
form.innerHTML=SECTIONS.map(s=>{
  let html='',i=0;const fs=s.f;
  while(i<fs.length){
    if(fs[i].half&&fs[i+1]&&fs[i+1].half){html+=`<div class="row2">${fieldHTML(fs[i])}${fieldHTML(fs[i+1])}</div>`;i+=2}
    else html+=fieldHTML(fs[i++]);
  }
  return `<section class="card"><h2>${esc(s.t)}</h2>${html}</section>`;
}).join('');
// names/inspector shouldn't be forced upper-case
$('f-inspector').setAttribute('autocapitalize','words');
// Inspector: pre-filled from the last saved inspection, with earlier names offered as suggestions
(()=>{const el=$('f-inspector');el.setAttribute('list','inspectorList');el.setAttribute('autocomplete','off');
  const dl=document.createElement('datalist');dl.id='inspectorList';document.body.appendChild(dl);
  const h=document.createElement('p');h.id='insHint';h.className='fieldnote';h.hidden=true;el.after(h);
  el.addEventListener('focus',()=>{if(el.value)setTimeout(()=>el.select(),0)});
})();
function inspectorNames(){const seen=new Set(),out=[];[prefs.inspector,...records.map(r=>r.v.inspector)].forEach(n=>{n=(n||'').trim();if(n&&!seen.has(n.toLowerCase())){seen.add(n.toLowerCase());out.push(n)}});return out}
function refreshInspector(){
  $('inspectorList').innerHTML=inspectorNames().map(n=>`<option value="${esc(n)}">`).join('');
  const h=$('insHint'),v=(cur.v.inspector||'').trim();
  h.hidden=!(v&&!cur.id&&v===(prefs.inspector||'').trim());
  h.textContent='Filled in from the last inspection. Tap to change.';
}

function paint(){
  FIELDS.forEach(f=>{
    const v=cur.v[f.k]??'';
    if(f.type==='choice'){
      form.querySelectorAll(`button[data-k="${f.k}"]`).forEach(b=>b.setAttribute('aria-checked',b.dataset.v===v?'true':'false'));
    }else if(f.type==='photo'){showShot(f.k)}
    else{const el=$('f-'+f.k);if(el.value!==String(v))el.value=v}
  });
  applyRules();progress();refreshInspector();if(typeof renderPending==='function')renderPending();if(typeof cvHelp==='function')cvHelp(!!cur.v.culvert_no);
  $('formStatus').textContent=cur.id?`Editing saved inspection · ${cur.v.culvert_no||''}`:'New inspection · draft saves automatically';
  $('saveBtn').textContent=cur.id?'Update inspection':'Save inspection';
  $('saveBtn2').textContent=$('saveBtn').textContent;
}
function applyRules(){
  // "If so, are remedial works required?" only applies when erosion = Yes
  const e=cur.v.erosion;
  form.querySelectorAll('button[data-k="remedial"]').forEach(b=>{
    b.disabled = (e==='No' && b.dataset.v!=='NA') || (e==='Yes' && b.dataset.v==='NA');
  });
  if(e==='No'&&cur.v.remedial!=='NA'){cur.v.remedial='NA';setSel('remedial','NA')}
  if(e==='Yes'&&cur.v.remedial==='NA'){cur.v.remedial='';setSel('remedial','')}
}
function setSel(k,v){form.querySelectorAll(`button[data-k="${k}"]`).forEach(b=>b.setAttribute('aria-checked',b.dataset.v===v?'true':'false'))}
function filled(f){const v=cur.v[f.k];return v!==undefined&&v!==null&&String(v).trim()!==''}
function progress(){const n=REQ.filter(filled).length;$('prog').style.width=(n/REQ.length*100)+'%'}
let draftT;
function changed(k){
  const fld=form.querySelector(`.field[data-k="${k}"]`);if(fld&&filled(FIELDS.find(f=>f.k===k)))fld.classList.remove('missing');
  if(k==='erosion')applyRules();
  if(k==='inspector')refreshInspector();
  progress();clearTimeout(draftT);draftT=setTimeout(()=>store(KEY.draft,cur),250);
}
form.addEventListener('click',e=>{
  const b=e.target.closest('button[data-k]');if(!b||b.disabled)return;
  const k=b.dataset.k,v=b.dataset.v;
  cur.v[k]=(cur.v[k]===v)?'':v; setSel(k,cur.v[k]); changed(k);
});
form.addEventListener('input',e=>{const k=e.target.dataset.k;if(!k||e.target.type==='file')return;if(k==='location')cur.v.location_acc='';cur.v[k]=e.target.value;changed(k)});

/* ---------- photos (IndexedDB) ---------- */
let dbp=null;
function idb(){if(!dbp)dbp=new Promise((res,rej)=>{const r=indexedDB.open('fpi',1);r.onupgradeneeded=()=>r.result.createObjectStore('photos');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});return dbp}
async function tx(mode,fn){const db=await idb();return new Promise((res,rej)=>{const t=db.transaction('photos',mode),q=fn(t.objectStore('photos'));t.oncomplete=()=>res(q.result);t.onerror=()=>rej(t.error)})}
const putPhoto=(id,b)=>tx('readwrite',st=>st.put(b,id)), getPhoto=id=>tx('readonly',st=>st.get(id)),
      delPhoto=id=>tx('readwrite',st=>st.delete(id)), photoKeys=()=>tx('readonly',st=>st.getAllKeys());
const urls={};
async function shrink(file){
  let img;
  try{img=await createImageBitmap(file,{imageOrientation:'from-image'})}
  catch(e){img=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=URL.createObjectURL(file)})}
  const sc=Math.min(1,1920/Math.max(img.width,img.height)),c=document.createElement('canvas');
  c.width=Math.round(img.width*sc);c.height=Math.round(img.height*sc);c.getContext('2d').drawImage(img,0,0,c.width,c.height);
  return new Promise((res,rej)=>c.toBlob(b=>b?res(b):rej(new Error('encode')),'image/jpeg',0.82));
}
async function showShot(k){
  const box=$('s-'+k),btn=$('b-'+k),pid=cur.v[k];
  const mv=$('m-'+k);if(mv)mv.hidden=!pid;
  if(!pid){box.innerHTML='<span>Not taken yet</span>';btn.textContent='Take photo';return}
  btn.textContent='Retake';
  try{if(!urls[pid]){const b=await getPhoto(pid);if(!b)throw 0;urls[pid]=URL.createObjectURL(b)}
    if(cur.v[k]===pid)box.innerHTML=`<img src="${urls[pid]}" alt="Photo: ${esc(FIELDS.find(f=>f.k===k).l)}">`;}
  catch(e){if(cur.v[k]===pid){cur.v[k]='';box.innerHTML='<span>Photo missing, please retake</span>';btn.textContent='Take photo';progress()}}
}
form.addEventListener('change',async e=>{
  const el=e.target;if(el.type!=='file'||!el.dataset.k)return;
  const f=el.files[0],k=el.dataset.k;el.value='';if(!f)return;
  $('s-'+k).innerHTML='<span>Saving photo…</span>';
  try{const b=await shrink(f),pid='P'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
    await putPhoto(pid,b);cur.v[k]=pid;changed(k);store(KEY.draft,cur);showShot(k)}
  catch(err){toast('Could not store that photo. Try again.');showShot(k)}
});
const PGROUPS=[{g:'up',name:'Upstream'},{g:'down',name:'Downstream'}];
const pendList=()=>(cur.v.ph_pending||[]).map(x=>typeof x==='string'?{pid:x,g:'up'}:x); // older drafts stored plain ids
function photoRefs(){const s=new Set(),add=v=>PHOTOS.forEach(f=>v[f.k]&&s.add(v[f.k]));records.forEach(r=>add(r.v));add(cur.v);pendList().forEach(p=>s.add(p.pid));return s}
/* photos sit in their own section (2 upstream, 2 downstream) and can be taken in any order:
   take or pick them, then tap which view each one is */
PGROUPS.forEach(({g,name})=>{
  const first=form.querySelector(`.field[data-k="${PHOTOS.find(f=>f.g===g).k}"]`),anchor=first.parentElement.classList.contains('row2')?first.parentElement:first;
  const d=document.createElement('div');d.className='field phadd';d.dataset.g=g;
  d.innerHTML=`<p class="q" style="margin:0 0 4px">${name} photos</p>
    <p class="fieldnote" style="margin:0 0 10px">Take the 2 ${name.toLowerCase()} photos in any order. After each one, tap which view it is.</p>
    <div class="phbtns"><label class="btn primary" for="phCam-${g}">Take photo</label><label class="btn" for="phLib-${g}">Choose from gallery</label></div>
    <input id="phCam-${g}" data-g="${g}" class="phin" type="file" accept="image/*" capture="environment" hidden>
    <input id="phLib-${g}" data-g="${g}" class="phin" type="file" accept="image/*" multiple hidden>
    <div id="phPending-${g}"></div>`;
  anchor.before(d);
});
const newPid=()=>'P'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
async function addPending(files,g){
  const list=[...files];if(!list.length)return;$('phPending-'+g).insertAdjacentHTML('afterbegin','<p class="fieldnote">Saving photo…</p>');
  const P=pendList();
  for(const f of list){try{const b=await shrink(f),pid=newPid();await putPhoto(pid,b);P.push({pid,g})}catch(e){toast('Could not store a photo. Try again.')}}
  cur.v.ph_pending=P;store(KEY.draft,cur);renderPending();
}
async function renderPending(){
  const P=pendList();
  for(const {g} of PGROUPS){
    const box=$('phPending-'+g),html=[];
    for(const {pid} of P.filter(x=>x.g===g)){
      try{if(!urls[pid]){const b=await getPhoto(pid);if(!b)continue;urls[pid]=URL.createObjectURL(b)}}catch(e){continue}
      html.push(`<div class="pend"><img src="${urls[pid]}" alt="New photo"><div><p class="q" style="margin:0 0 8px">Which view is this?</p><div class="pendbtns">
        ${PHOTOS.filter(f=>f.g===g).map(f=>`<button type="button" class="btn small" data-assign="${f.k}" data-pid="${pid}">${esc(f.l)}${cur.v[f.k]?' <span class="muted">(replace)</span>':''}</button>`).join('')}
        <button type="button" class="btn small danger" data-discard="${pid}">Discard</button></div></div></div>`);
    }
    box.innerHTML=html.join('');
  }
}
form.addEventListener('change',e=>{if(!e.target.classList.contains('phin'))return;const el=e.target;addPending(el.files,el.dataset.g).then(()=>{el.value=''})});
form.addEventListener('click',e=>{
  const a=e.target.closest('[data-assign]'),dc=e.target.closest('[data-discard]'),mv=e.target.closest('[data-move]');
  if(!a&&!dc&&!mv)return;
  let P=pendList();
  if(a){const k=a.dataset.assign,pid=a.dataset.pid;P=P.filter(x=>x.pid!==pid);cur.v[k]=pid;changed(k);showShot(k)}
  if(dc){P=P.filter(x=>x.pid!==dc.dataset.discard)}
  if(mv){const k=mv.dataset.move,f=PHOTOS.find(x=>x.k===k);if(cur.v[k]){P.push({pid:cur.v[k],g:f.g});cur.v[k]='';changed(k);showShot(k)}}
  cur.v.ph_pending=P;store(KEY.draft,cur);renderPending();if(dc)gc();
});
async function gc(){try{const refs=photoRefs();for(const k of await photoKeys())if(!refs.has(k)){await delPhoto(k);if(urls[k]){URL.revokeObjectURL(urls[k]);delete urls[k]}}}catch(e){}}
const safe=s=>String(s||'').trim().replace(/[^A-Za-z0-9._-]+/g,'-').replace(/^-+|-+$/g,'')||'culvert';
function photoName(r,f){return `${safe(r.v.culvert_no)}_${(r.v.date||'').replace(/-/g,'')}-${(r.v.time||'').replace(':','')}_${f.n}-${safe(f.l)}.jpg`}

/* ---------- GPS ---------- */
function parseLoc(s){const m=String(s||'').match(/(-?\d{1,3}(?:\.\d+)?)\s*[,\s]\s*(-?\d{1,3}(?:\.\d+)?)/);if(!m)return null;
  const lat=+m[1],lng=+m[2];return Math.abs(lat)<=90&&Math.abs(lng)<=180?{lat,lng}:null}
let gpsBusy=false;
function getGPS(auto){
  if(gpsBusy)return;const note=$('gpsNote');
  if(!navigator.geolocation){if(!auto)note.textContent='This browser can\'t read GPS. Type the coordinates instead.';return}
  gpsBusy=true;$('gpsBtn').disabled=true;note.textContent='Finding your location…';
  navigator.geolocation.getCurrentPosition(p=>{
    gpsBusy=false;$('gpsBtn').disabled=false;
    const v=`${p.coords.latitude.toFixed(6)}, ${p.coords.longitude.toFixed(6)}`,acc=Math.round(p.coords.accuracy);
    cur.v.location=v;cur.v.location_acc=String(acc);$('f-location').value=v;changed('location');if(typeof cvHelp==='function')cvHelp(false);
    note.textContent=`Location recorded (accurate to about ${acc} m).`+(acc>50?' Try again in the open for a better fix.':'');
  },e=>{
    gpsBusy=false;$('gpsBtn').disabled=false;
    note.textContent=e.code===1?'Location permission is off. Allow it for this site in the phone settings, or type the coordinates.':'Couldn\'t get a GPS fix. Try again in the open, or type the coordinates.';
  },{enableHighAccuracy:true,timeout:25000,maximumAge:60000});
}
form.addEventListener('click',e=>{if(e.target.id==='gpsBtn')getGPS(false)});
// first time a Culvert No. is typed on a new inspection, grab the location automatically
var gpsAutoDone=false; // var: fresh() can run before this line
form.addEventListener('focusin',e=>{if(e.target.id==='f-culvert_no'&&!gpsAutoDone&&!cur.id&&!(cur.v.location||'').trim()){gpsAutoDone=true;getGPS(true)}});

/* ---------- culvert list: suggestions only, never filled in automatically ---------- */
let CULVERTS=load('fpi.culverts.v1',[]);
const ckey=s=>String(s||'').toUpperCase().replace(/\(.*?\)/g,'').replace(/[^A-Z0-9]/g,'');   // ignores spaces, dashes, case, "(Bridge 17)"
const ckeyFull=s=>String(s||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
const cvKeys=c=>[ckeyFull(c.name),ckey(c.name),...(c.aliases||[]).map(ckeyFull)].filter(Boolean);
function findCulvert(t){if(!t)return null;const a=ckeyFull(t),b=ckey(t);return CULVERTS.find(c=>{const k=cvKeys(c);return k.includes(a)||k.includes(b)})||null}
const cvByName=n=>n?CULVERTS.find(c=>c.name===n)||null:null;
function lev(a,b){const d=Array.from({length:b.length+1},(_,i)=>i);for(let i=1;i<=a.length;i++){let p=d[0];d[0]=i;for(let j=1;j<=b.length;j++){const t=d[j];d[j]=Math.min(d[j]+1,d[j-1]+1,p+(a[i-1]===b[j-1]?0:1));p=t}}return d[b.length]}
function distM(a,b){const R=6371e3,r=x=>x*Math.PI/180,dl=r(b.lat-a.lat),dg=r(b.lng-a.lng),h=Math.sin(dl/2)**2+Math.cos(r(a.lat))*Math.cos(r(b.lat))*Math.sin(dg/2)**2;return 2*R*Math.asin(Math.sqrt(h))}
const fmtDist=m=>m<1000?Math.round(m/10)*10+' m':(m/1000).toFixed(1)+' km';
function cvSuggest(t,loc){
  const k=ckeyFull(t);
  let L=CULVERTS.map(c=>{const ks=cvKeys(c);let sc=null;
    if(k){if(ks.some(x=>x.startsWith(k)))sc=0;else if(k.length>=2&&ks.some(x=>x.includes(k)))sc=1;
      else if(k.length>=4){const d=Math.min(...ks.map(x=>lev(x,k)));if(d<=2)sc=1+d}}
    return{c,sc,dm:loc&&c.lat!=null?distM(loc,c):null}});
  L=k?L.filter(x=>x.sc!==null).sort((a,b)=>a.sc-b.sc||(a.dm??1e12)-(b.dm??1e12)):L.filter(x=>x.dm!=null&&x.dm<2000).sort((a,b)=>a.dm-b.dm);
  return L.slice(0,5);
}
function cvHelp(final){
  const box=$('cvHelp');if(!box)return;
  const t=String(cur.v.culvert_no||'').trim(),loc=parseLoc(cur.v.location);
  if(!CULVERTS.length){box.innerHTML=t?'':'<p class="cvlab">The culvert list downloads when you sign in with coverage.</p>';return}
  const chips=L=>'<div class="cvchips">'+L.map(x=>`<button type="button" class="cvchip" data-cv="${esc(x.c.name)}">${esc(x.c.name)}${x.dm!=null?`<small>${fmtDist(x.dm)}</small>`:''}</button>`).join('')+'</div>';
  const ex=findCulvert(t);let h='';
  if(ex){
    h=`<p class="cvok">✓ In the culvert list${ckeyFull(ex.name)!==ckeyFull(t)?` as <b>${esc(ex.name)}</b> <button type="button" class="cvchip" data-cv="${esc(ex.name)}">Use this spelling</button>`:''}</p>`;
    const dm=loc&&ex.lat!=null?distM(loc,ex):null;
    if(dm!=null&&dm>200)h+=`<p class="cvwarn">You're about ${fmtDist(dm)} from where ${esc(ex.name)} is listed. Check it's the right culvert.</p>`;
  }else{
    const L=cvSuggest(t,loc);
    if(!t&&L.length)h='<p class="cvlab">Near you (tap to use):</p>'+chips(L);
    else if(t&&L.length)h=`<p class="cvlab">${final?'Not in the list. Did you mean':'Suggestions (tap to use)'}:</p>`+chips(L);
    else if(t&&final)h='<p class="cvnew">Not in the culvert list. It will be saved as typed and flagged for the office to check.</p>';
  }
  box.innerHTML=h;
}
(()=>{const f=form.querySelector('.field[data-k="culvert_no"]'),d=document.createElement('div');d.id='cvHelp';d.className='cvhelp';f.appendChild(d)})();
$('f-culvert_no').addEventListener('input',()=>setTimeout(()=>cvHelp(false),0));
$('f-culvert_no').addEventListener('blur',()=>setTimeout(()=>cvHelp(true),250)); // delay so a tap on a suggestion still lands
form.addEventListener('click',e=>{const b=e.target.closest('.cvchip');if(!b)return;
  cur.v.culvert_no=b.dataset.cv;$('f-culvert_no').value=b.dataset.cv;changed('culvert_no');cvHelp(true)});
async function fetchCulverts(){ // small list; refreshed whenever the phone is online and signed in
  if(!FB_READY||!fbAuth||!fbAuth.currentUser||!navigator.onLine)return;
  try{const s=await withTimeout(fdb.collection('culverts').get(),20e3);
    CULVERTS=s.docs.map(d=>d.data()).filter(c=>c&&c.name);store('fpi.culverts.v1',CULVERTS);cvHelp(false)}catch(e){}
}
const cvFor=r=>cvByName(r.linkRef)||cvByName(r.v.culvert_ref)||findCulvert(r.v.culvert_no);
/* delete everywhere: an admin leaves a marker in "deleted"; every device removes those inspections when it syncs */
function removeLocal(ids){
  const set=new Set(ids),before=records.length;records=records.filter(r=>!set.has(r.id));
  if(cur.id&&set.has(cur.id)){cur=fresh();store(KEY.draft,cur);paint()}
  if(records.length!==before){store(KEY.recs,records);renderList();gc()}
  return before-records.length;
}
async function fetchDeleted(){
  if(!FB_READY||!fbAuth||!fbAuth.currentUser||!navigator.onLine)return new Set();
  try{const s=await withTimeout(fdb.collection('deleted').get(),15e3),ids=s.docs.map(d=>d.id);removeLocal(ids);return new Set(ids)}catch(e){return new Set()}
}
async function deleteEverywhere(id){
  if(!FB_READY||!fbAuth||!fbAuth.currentUser||!navigator.onLine)throw new Error('offline');
  await withTimeout(fdb.collection('deleted').doc(id).set({at:new Date().toISOString(),by:auth.name}),20e3);
  await withTimeout(fdb.collection('inspections').doc(id).delete(),20e3);
  for(const f of PHOTOS){try{await withTimeout(fst.ref(`inspections/${id}/${f.k}.jpg`).delete(),20e3)}catch(e){}}
  removeLocal([id]);
}

/* ---------- save / clear ---------- */
function issues(v){
  return FIELDS.filter(f=>f.bad&&v[f.k]===f.bad).map(f=>`${f.l.replace(/\?$/,'')}: ${v[f.k]}`);
}
$('saveBtn').onclick=()=>{
  {const P=pendList();if(P.length){$('phPending-'+P[0].g).scrollIntoView({behavior:'smooth',block:'center'});toast('Tap which view each new photo is (or discard it) before saving');return}}
  delete cur.v.ph_pending;
  const miss=REQ.filter(f=>!filled(f));
  form.querySelectorAll('.field.missing').forEach(x=>x.classList.remove('missing'));
  if(miss.length){
    miss.forEach(f=>form.querySelector(`.field[data-k="${f.k}"]`).classList.add('missing'));
    const first=form.querySelector(`.field[data-k="${miss[0].k}"]`);
    first.scrollIntoView({behavior:'smooth',block:'center'});
    toast(`${miss.length} required field${miss.length>1?'s':''} still to fill`);return;
  }
  cur.v.culvert_no=String(cur.v.culvert_no).trim().replace(/\s+/g,' ').toUpperCase(); // tidy for matching at the office
  {const m=findCulvert(cur.v.culvert_no);cur.v.culvert_ref=m?m.name:''} // link to the list; blank = flagged for the office
  const stamp=new Date().toISOString();
  if(cur.id){const i=records.findIndex(r=>r.id===cur.id);const rec={...records[i],v:{...cur.v},updated:stamp};if(i>=0)records[i]=rec;else records.unshift(rec)}
  else records.unshift({id:'FPI-'+Date.now().toString(36).toUpperCase(),saved:stamp,updated:stamp,v:{...cur.v}});
  if(!store(KEY.recs,records)){toast('Could not save: storage blocked');return}
  if(!cur.id||records[0]&&records[0].id===cur.id){prefs.inspector=(cur.v.inspector||'').trim();store(KEY.prefs,prefs)}
  const no=cur.v.culvert_no;cur=fresh();store(KEY.draft,cur);paint();window.scrollTo(0,0);
  renderList();gc();toast(`Saved ${no}`);if(typeof autoSync==='function')setTimeout(autoSync,800);
};
$('saveBtn2').onclick=()=>$('saveBtn').click(); // second Save at the end of the form, in case the bottom bar is hidden on a device
let clearArm=0;
$('clearBtn').onclick=()=>{
  const b=$('clearBtn');
  if(Date.now()-clearArm<3000){cur=fresh();store(KEY.draft,cur);form.querySelectorAll('.missing').forEach(x=>x.classList.remove('missing'));paint();gc();b.textContent='Clear';b.classList.remove('danger');toast('Form cleared');clearArm=0;return}
  clearArm=Date.now();b.textContent='Tap again';b.classList.add('danger');
  setTimeout(()=>{b.textContent='Clear';b.classList.remove('danger')},3000);
};

/* ---------- list ---------- */
function fmtDate(d){if(!d)return'';const[y,m,dd]=d.split('-');return `${dd}/${m}/${y}`}
function renderList(){
  if(typeof renderReport==='function')setTimeout(renderReport,0);
  if(typeof syncUI==='function')setTimeout(()=>{try{syncUI()}catch(e){}},0);
  $('count').textContent=`(${records.length})`;
  const L=$('list');
  if(!records.length){L.innerHTML='<div class="empty">No saved inspections yet.<br>Fill in the Inspection tab and tap Save.</div>';return}
  L.innerHTML=records.map(r=>{
    const iss=issues(r.v);
    return `<div class="rec" data-id="${r.id}"><div class="top"><div><h3>${esc(r.v.culvert_no)}</h3>
      <div class="meta">${fmtDate(r.v.date)} ${esc(r.v.time)} · ${esc(r.v.inspector)} · ${esc(r.v.weather)} · ${PHOTOS.filter(f=>r.v[f.k]).length}/4 photos</div></div>
      <span class="chips"><span class="chip ${iss.length?'bad':'ok'}">${iss.length?iss.length+' issue'+(iss.length>1?'s':''):'No issues'}</span>
      <span class="chip ${isSynced(r)?'cloud':'wait'}">${isSynced(r)?'In cloud ✓':'On phone only'}</span></span></div>
      ${iss.length?`<ul class="issues">${iss.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:''}
      <div class="acts"><button class="btn small" data-act="edit">Edit</button><button class="btn small" data-act="del">Delete from this phone</button>
      ${auth&&auth.role==='admin'?'<button class="btn small danger" data-act="delall">Delete everywhere</button>':''}</div></div>`;
  }).join('');
}
$('list').addEventListener('click',e=>{
  const b=e.target.closest('button[data-act]');if(!b)return;
  const id=b.closest('.rec').dataset.id, r=records.find(x=>x.id===id);
  if(b.dataset.act==='edit'){cur={id:r.id,v:{...r.v}};store(KEY.draft,cur);paint();show('form');window.scrollTo(0,0)}
  if(b.dataset.act==='del'){
    if(b.dataset.armed){records=records.filter(x=>x.id!==id);store(KEY.recs,records);renderList();gc();toast(isSynced(r)?'Removed from this phone (the cloud copy is kept)':'Inspection deleted');return}
    b.dataset.armed='1';b.textContent='Confirm delete';b.classList.add('danger');
    setTimeout(()=>{if(b.isConnected){delete b.dataset.armed;b.textContent='Delete from this phone';b.classList.remove('danger')}},3000);
  }
  if(b.dataset.act==='delall'){
    if(!b.dataset.armed){b.dataset.armed='1';b.textContent='Tap again: delete for everyone';setTimeout(()=>{if(b.isConnected){delete b.dataset.armed;b.textContent='Delete everywhere'}},4000);return}
    b.disabled=true;b.textContent='Deleting…';
    deleteEverywhere(id).then(()=>toast('Deleted everywhere. Other devices remove it next time they sync.'))
      .catch(err=>{toast(err.message==='offline'?'Needs a connection. Try again when you have coverage.':'Could not delete: '+(err.code||err.message));renderList()});
  }
});

/* ---------- export ---------- */
function csv(){
  // Field data only; merge with the culvert spreadsheet at the office on the Culvert No. column
  const col=f=>[f.type==='photo'?`Photo ${f.n}: ${f.l}`:(f.csv||f.l)+(f.unit?` (${f.unit})`:''),r=>f.type==='photo'?(r.v[f.k]?photoName(r,f):''):f.k==='date'?fmtDate(r.v.date):r.v[f.k]];
  const cols=[col(FIELDS[0]),['Culvert in list',r=>{const c=cvFor(r);return c?c.name:'NOT IN LIST'}],
    ...FIELDS.slice(1).flatMap(f=>f.k==='location'?[['Latitude',r=>{const L=parseLoc(r.v.location);return L?L.lat:''}],['Longitude',r=>{const L=parseLoc(r.v.location);return L?L.lng:''}]]:[col(f)]),
    ['GPS accuracy (m)',r=>r.v.location_acc||''],['Issue count',r=>issues(r.v).length],['Record ID',r=>r.id],['Saved',r=>r.saved],['Last updated',r=>r.updated]];
  const q=s=>{s=String(s??'');return /[",\n\r]/.test(s)?`"${s.replace(/"/g,'""')}"`:s};
  return '﻿'+[cols.map(c=>q(c[0])).join(','),...records.map(r=>cols.map(c=>q(c[1](r))).join(','))].join('\r\n');
}
const stampName=()=>{const n=nowParts();return n.date.replace(/-/g,'')+'-'+n.time.replace(':','')};
function download(name,text,type){
  const a=document.createElement('a');a.href=URL.createObjectURL(text instanceof Blob?text:new Blob([text],{type}));a.download=name;
  document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1000);
}
$('exportCsv').onclick=()=>{if(!records.length)return toast('Nothing to export yet');download(`fish-passage-inspections-${stampName()}.csv`,csv(),'text/csv')};
const CRC=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
function crc32(u){let c=0xFFFFFFFF;for(let i=0;i<u.length;i++)c=CRC[(c^u[i])&255]^(c>>>8);return(c^0xFFFFFFFF)>>>0}
function zip(files){ // stored (uncompressed) zip: JPEGs are already compressed
  const enc=new TextEncoder(),parts=[],cd=[],d=new Date();let off=0;
  const dt=((d.getFullYear()-1980)<<9)|((d.getMonth()+1)<<5)|d.getDate(),tm=(d.getHours()<<11)|(d.getMinutes()<<5)|(d.getSeconds()>>1);
  for(const f of files){const nm=enc.encode(f.name),crc=crc32(f.data),sz=f.data.length;
    const h=new DataView(new ArrayBuffer(30));[[0,0x04034b50,4],[4,20],[6,0x0800],[8,0],[10,tm],[12,dt],[14,crc,4],[18,sz,4],[22,sz,4],[26,nm.length],[28,0]].forEach(([o,v,w])=>w===4?h.setUint32(o,v,true):h.setUint16(o,v,true));
    parts.push(h.buffer,nm,f.data);
    const c=new DataView(new ArrayBuffer(46));[[0,0x02014b50,4],[4,20],[6,20],[8,0x0800],[10,0],[12,tm],[14,dt],[16,crc,4],[20,sz,4],[24,sz,4],[28,nm.length],[42,off,4]].forEach(([o,v,w])=>w===4?c.setUint32(o,v,true):c.setUint16(o,v,true));
    cd.push(c.buffer,nm);off+=30+nm.length+sz}
  const cds=cd.reduce((a,b)=>a+b.byteLength,0),e=new DataView(new ArrayBuffer(22));
  e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);e.setUint32(12,cds,true);e.setUint32(16,off,true);
  return new Blob([...parts,...cd,e.buffer],{type:'application/zip'});
}
// Caption is burnt in at export, so it always matches the saved record (even after edits)
async function stampPhoto(blob,r,f){
  try{
    const img=await createImageBitmap(blob),c=document.createElement('canvas');c.width=img.width;c.height=img.height;
    const g=c.getContext('2d');g.drawImage(img,0,0);
    const fs=Math.max(16,Math.round(Math.min(c.width,c.height)*0.042)),padd=Math.round(fs*0.6);
    const lines=[`${r.v.culvert_no||''}  ·  ${f.n}. ${f.l}`,`${fmtDate(r.v.date)} ${r.v.time||''}`];
    const bh=fs*lines.length*1.3+padd*1.4;
    g.fillStyle='rgba(0,0,0,0.6)';g.fillRect(0,c.height-bh,c.width,bh);
    g.fillStyle='#fff';g.textBaseline='top';
    lines.forEach((t,i)=>{g.font=`${i?400:700} ${fs}px system-ui,-apple-system,Roboto,Arial,sans-serif`;g.fillText(t,padd,c.height-bh+padd*0.7+i*fs*1.3,c.width-padd*2)});
    return await new Promise((res,rej)=>c.toBlob(b=>b?res(b):rej(),'image/jpeg',0.85));
  }catch(e){return blob}
}
async function photoFiles(){const out=[];for(const r of records)for(const f of PHOTOS){const pid=r.v[f.k];if(!pid)continue;const b=await getPhoto(pid);if(b)out.push({name:photoName(r,f),blob:await stampPhoto(b,r,f)})}return out}
async function buildZip(){
  const n=stampName(),enc=new TextEncoder(),files=[{name:`fish-passage-inspections-${n}.csv`,data:enc.encode(csv())}];
  for(const p of await photoFiles())files.push({name:'photos/'+p.name,data:new Uint8Array(await p.blob.arrayBuffer())});
  return {name:`fish-passage-inspections-${n}.zip`,blob:zip(files)};
}
$('exportZip').onclick=async()=>{
  if(!records.length)return toast('Nothing to export yet');toast('Building zip…');
  try{const z=await buildZip();download(z.name,z.blob)}catch(e){toast('Could not build the zip')}
};
$('shareCsv').onclick=async()=>{
  if(!records.length)return toast('Nothing to share yet');
  const n=stampName(),can=a=>navigator.canShare&&navigator.canShare({files:a});
  try{
    const list=[new File([csv()],`fish-passage-inspections-${n}.csv`,{type:'text/csv'}),...(await photoFiles()).map(p=>new File([p.blob],p.name,{type:'image/jpeg'}))];
    if(can(list)){await navigator.share({files:list,title:'Fish passage inspections'});return}
    const z=await buildZip(),zf=new File([z.blob],z.name,{type:'application/zip'});
    if(can([zf])){await navigator.share({files:[zf],title:'Fish passage inspections'});return}
    toast('Sharing not available here, downloading zip instead');download(z.name,z.blob);
  }catch(e){if(e.name!=='AbortError')toast('Share failed. Try Download all (zip).')}
};
const toDataURL=b=>new Promise(r=>{const f=new FileReader();f.onload=()=>r(f.result);f.readAsDataURL(b)});
$('backup').onclick=async()=>{
  toast('Building backup…');const photos={};
  try{for(const pid of photoRefs()){const b=await getPhoto(pid);if(b)photos[pid]=await toDataURL(b)}}catch(e){}
  download(`fish-passage-backup-${stampName()}.json`,JSON.stringify({app:'fpi',version:2,records,photos}),'application/json');
};
$('restore').onchange=e=>{
  const f=e.target.files[0];if(!f)return;const rd=new FileReader();
  rd.onload=async()=>{try{
    const d=JSON.parse(rd.result);if(!Array.isArray(d.records))throw 0;
    const have=new Set(records.map(r=>r.id));let n=0;
    for(const r of d.records){if(r&&r.id&&r.v&&!have.has(r.id)){records.push(r);n++;
      for(const pf of PHOTOS){const pid=r.v[pf.k];if(pid&&d.photos&&d.photos[pid]){const b=await (await fetch(d.photos[pid])).blob();await putPhoto(pid,b)}}}}
    records.sort((a,b)=>(b.saved||'').localeCompare(a.saved||''));store(KEY.recs,records);renderList();toast(`Restored ${n} inspection${n===1?'':'s'}`);
  }catch(err){toast('That file is not a Fish Passage backup')}};
  rd.readAsText(f);e.target.value='';
};

/* ---------- GWRC PDF report ---------- */
const REP={off:new Set()}; // culverts the user has unticked
function repRange(){return{from:$('repFrom').value,to:$('repTo').value}}
function repInRange(r){const{from,to}=repRange(),d=r.v.date||'';return(!from||d>=from)&&(!to||d<=to)}
function repSelected(){
  return records.filter(r=>repInRange(r)&&!REP.off.has(r.v.culvert_no))
    .sort((a,b)=>((a.v.date||'')+(a.v.time||'')).localeCompare((b.v.date||'')+(b.v.time||''))||String(a.v.culvert_no).localeCompare(String(b.v.culvert_no)));
}
function renderReport(){
  const box=$('repCulverts');if(!box)return;
  $('repCard').hidden=!records.length;
  if(!REP.userRange&&records.length){ // default: span of all saved inspections
    const ds=records.map(r=>r.v.date).filter(Boolean).sort();$('repFrom').value=ds[0]||'';$('repTo').value=ds[ds.length-1]||'';
  }
  const counts={};records.filter(repInRange).forEach(r=>{counts[r.v.culvert_no]=(counts[r.v.culvert_no]||0)+1});
  const names=Object.keys(counts).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
  box.innerHTML=names.length?names.map(n=>`<label class="check"><input type="checkbox" data-c="${esc(n)}" ${REP.off.has(n)?'':'checked'}><span>${esc(n)}</span><small>${counts[n]}</small></label>`).join('')
    :'<p class="fieldnote">No inspections in these dates.</p>';
  const n=repSelected().length;$('repCount').textContent=`${n} inspection${n===1?'':'s'} will be included.`;
  $('repPdf').disabled=$('repShare').disabled=!n;
}
['repFrom','repTo'].forEach(id=>$(id).addEventListener('change',()=>{REP.userRange=true;renderReport()}));
$('repCulverts').addEventListener('change',e=>{const c=e.target.dataset.c;if(c===undefined)return;e.target.checked?REP.off.delete(c):REP.off.add(c);renderReport()});
$('repAll').onclick=()=>{REP.off.clear();renderReport()};
$('repNone').onclick=()=>{$('repCulverts').querySelectorAll('input[data-c]').forEach(i=>REP.off.add(i.dataset.c));renderReport()};

// Location map for the PDF: OpenStreetMap tiles (needs internet when the report is made)
async function mapImage(lat,lng,wPx,hPx,z){
  const n=2**z,wx=(lng+180)/360*n*256,rad=lat*Math.PI/180,wy=(1-Math.log(Math.tan(rad)+1/Math.cos(rad))/Math.PI)/2*n*256;
  const x0=wx-wPx/2,y0=wy-hPx/2,c=document.createElement('canvas');c.width=wPx;c.height=hPx;const g=c.getContext('2d');
  g.fillStyle='#e8ece9';g.fillRect(0,0,wPx,hPx);
  const jobs=[];
  for(let tx=Math.floor(x0/256);tx<=Math.floor((x0+wPx)/256);tx++)for(let ty=Math.floor(y0/256);ty<=Math.floor((y0+hPx)/256);ty++){
    jobs.push(new Promise((res,rej)=>{const im=new Image();im.crossOrigin='anonymous';
      const t=setTimeout(()=>rej(new Error('timeout')),15000);
      im.onload=()=>{clearTimeout(t);g.drawImage(im,tx*256-x0,ty*256-y0);res()};im.onerror=()=>{clearTimeout(t);rej(new Error('tile'))};
      im.src=`https://tile.openstreetmap.org/${z}/${((tx%n)+n)%n}/${ty}.png`}));
  }
  await Promise.all(jobs);
  const cx=wPx/2,cy=hPx/2;g.beginPath();g.arc(cx,cy,30,0,2*Math.PI);g.fillStyle='rgba(179,38,30,.25)';g.fill();
  g.beginPath();g.arc(cx,cy,14,0,2*Math.PI);g.fillStyle='#d11f1f';g.fill();g.lineWidth=4;g.strokeStyle='#fff';g.stroke();
  g.font='600 15px Arial,sans-serif';const a='© OpenStreetMap contributors',tw=g.measureText(a).width;
  g.fillStyle='rgba(255,255,255,.85)';g.fillRect(wPx-tw-12,hPx-24,tw+12,24);g.fillStyle='#333';g.fillText(a,wPx-tw-6,hPx-7);
  return c.toDataURL('image/jpeg',0.85);
}
async function pdfImage(pid){ // smaller copy for the PDF so the file stays a sensible size
  const b=await getPhoto(pid);if(!b)return null;
  const img=await createImageBitmap(b),sc=Math.min(1,1200/Math.max(img.width,img.height)),c=document.createElement('canvas');
  c.width=Math.round(img.width*sc);c.height=Math.round(img.height*sc);c.getContext('2d').drawImage(img,0,0,c.width,c.height);
  return{data:c.toDataURL('image/jpeg',0.78),w:c.width,h:c.height};
}
// Layout follows "Appendix C: Fish Passage Maintenance Inspection Form – Transmission Gully" (one filled form per inspection)
const FACING={ph1:'Upstream',ph2:'Downstream',ph3:'Downstream',ph4:'Upstream'}; // direction the camera faces
async function buildReport(){
  const recs=repSelected();if(!recs.length)throw new Error('none');
  const {jsPDF}=window.jspdf;const doc=new jsPDF({unit:'mm',format:'a4'});
  const W=210,H=297,M=18,CW=W-2*M,TOP=34,BOT=H-16;
  const GREY=[190,190,190],LBL=[148,179,214],HDR=[141,179,225],BLUE=[79,129,188],NAVY=[23,54,93],INK=[0,0,0],RED=[179,38,30],MUT=[90,90,90];
  const col=c=>doc.setTextColor(...c),fill=c=>doc.setFillColor(...c),draw=c=>doc.setDrawColor(...c);
  const font=(sz,st='normal',fam='helvetica')=>{doc.setFont(fam,st);doc.setFontSize(sz)};
  const LH=3.6,PAD=1.8,FS=8.5;
  let y=TOP;
  const newPage=()=>{doc.addPage();y=TOP};
  const need=h=>{if(y+h>BOT)newPage()};
  const heading=(t,keep=28)=>{need(keep);font(9,'bold');col(BLUE);doc.text(t,M,y+3.5);y+=6};
  const lines=(t,w)=>doc.splitTextToSize(String(t??''),w-2*PAD);
  // label/value table with grey title row (Appendix C style)
  function kvTable(title,rows,labelW){
    font(FS,'bold');const th=LH+2*PAD+0.6;need(th+8);
    fill(GREY);draw(INK);doc.setLineWidth(0.25);doc.rect(M,y,CW,th,'FD');col(INK);doc.text(title,M+PAD,y+PAD+3);y+=th;
    rows.forEach(([lab,val,bad])=>{
      font(FS);const L=lines(lab,labelW),V=lines(val===''||val==null?'':val,CW-labelW);
      const h=Math.max(L.length,V.length,1)*LH+2*PAD+0.6;
      if(y+h>BOT){newPage()}
      fill(LBL);doc.rect(M,y,labelW,h,'FD');doc.rect(M+labelW,y,CW-labelW,h,'S');
      col(INK);doc.text(L,M+PAD,y+PAD+3);
      col(bad?RED:INK);font(FS,bad?'bold':'normal');doc.text(V,M+labelW+PAD,y+PAD+3);
      y+=h;
    });
    y+=5;
  }
  // grid table with blue header row (Remedial actions, Photo log)
  function gridTable(cols,rows,minH=6){
    font(FS,'bold');
    const hl=cols.map(([t,w])=>lines(t,w)),hh=Math.max(...hl.map(l=>l.length))*LH+2*PAD;need(hh+minH*2);
    let x=M;cols.forEach(([t,w],i)=>{fill(HDR);draw(INK);doc.rect(x,y,w,hh,'FD');col(INK);doc.text(hl[i],x+PAD,y+PAD+3);x+=w});y+=hh;
    rows.forEach(r=>{
      font(FS);const cl=r.map((c,i)=>lines(c,cols[i][1]));const h=Math.max(minH,Math.max(...cl.map(l=>l.length))*LH+2*PAD);
      if(y+h>BOT)newPage();
      let x=M;cl.forEach((l,i)=>{doc.rect(x,y,cols[i][1],h,'S');col(INK);doc.text(l,x+PAD,y+PAD+3);x+=cols[i][1]});y+=h;
    });
    y+=5;
  }
  const v=(r,k)=>r.v[k]??'';
  const isBad=(r,k)=>{const f=FIELDS.find(f=>f.k===k);return !!(f&&f.bad&&r.v[k]===f.bad)};
  const pair=(r,a,b,la,lb)=>`${la}: ${v(r,a)||'–'}    ${lb}: ${v(r,b)||'–'}`;
  const period=()=>{const ds=recs.map(r=>r.v.date).filter(Boolean).sort();return ds.length?(ds[0]===ds[ds.length-1]?fmtDate(ds[0]):`${fmtDate(ds[0])} to ${fmtDate(ds[ds.length-1])}`):''};
  const culverts=[...new Set(recs.map(r=>r.v.culvert_no))];
  const inspectors=[...new Set(recs.map(r=>(r.v.inspector||'').trim()).filter(Boolean))];
  const pageOwner={}; // page number -> culvert no. (for the footer)

  /* Cover */
  y=TOP+30;font(24,'bold','times');col(NAVY);doc.text(doc.splitTextToSize('Greater Wellington Regional Council Report',CW),M,y);y+=24;
  font(13);col(BLUE);doc.text('Fish Passage Maintenance Inspections',M,y);y+=4;draw(BLUE);doc.setLineWidth(0.4);doc.line(M,y,M+CW,y);y+=12;
  kvTable('Report Details',[
    ['Project:','Waka Kotahi NZ Transport Agency – Transmission Gully Project'],
    ['Prepared by:','ATS Environmental'],
    ['Inspection period:',period()],
    ['Culverts inspected:',`${culverts.length} culvert${culverts.length===1?'':'s'}, ${recs.length} inspection${recs.length===1?'':'s'}`],
    ['Inspectors:',inspectors.join(', ')],
    ['Report date:',fmtDate(nowParts().date)],
    ['Assessment basis:','Assessment of fish passage against WS.7']],62);

  /* Summary */
  newPage();heading('Summary of Inspections');
  gridTable([['Culvert No.',30],['Date',22],['Inspector',34],['Passage to impeded',22],['Passage through impeded',24],['Remedial works required',22],['Issues found',CW-154]],
    recs.map(r=>{const n=issues(r.v).length;return[r.v.culvert_no,fmtDate(r.v.date),r.v.inspector,v(r,'impeded_to'),v(r,'impeded_through'),v(r,'remedial'),n?`${n}`:'None']}));

  /* One Appendix C form per inspection */
  for(const r of recs){
    newPage();const first=doc.getNumberOfPages();
    kvTable('Asset Identification',[
      ['RAMM Reference / Culvert No.:',(()=>{const c=cvFor(r);return r.v.culvert_no+(c&&c.name!==r.v.culvert_no?`  (listed as ${c.name})`:c?'':'  (not in culvert list)')})()],
      ['Road / Catchment / Stream Name:',(c=>c?[c.catchment&&('Catchment: '+c.catchment+(c.subcatchment?` (${c.subcatchment})`:'')),c.streamClass&&('Stream: '+c.streamClass)].filter(Boolean).join('  ·  '):'')(cvFor(r))],
      ['Latitude/Longitude Coordinates:',(()=>{const L=parseLoc(r.v.location),c=cvFor(r);return L?`${L.lat.toFixed(6)}, ${L.lng.toFixed(6)}`+(r.v.location_acc?`  (GPS ±${r.v.location_acc} m)`:''):c&&c.lat!=null?`${c.lat.toFixed(6)}, ${c.lng.toFixed(6)}  (from culvert list)`:''})()],
      ...(()=>{const c=cvFor(r)||{};
        const type=[c.pipeClass||c.shape,c.material&&!c.pipeClass?c.material:'',c.slope!=null?`grade ${c.slope}`:''].filter(Boolean).join(', ');
        const dia=c.pipeSize||(c.diameter?c.diameter+(/\d$/.test(c.diameter)?' mm':''):'');
        return[['Culvert Type:',type],['Culvert diameter:',dia],['Culvert length:',c.length?c.length+' m':'']]})()],CW*0.5);
    kvTable('Inspection Details',[
      ['Name of inspector:',r.v.inspector],['Organisation:','ATS Environmental'],
      ['Inspection Date:',fmtDate(r.v.date)],['Inspection Time:',r.v.time],
      ['Weather Conditions at the time of inspection:',r.v.weather],['Rainfall volume in previous 24 hours:','']],CW*0.5);
    heading('Consent Compliance – Outcome of Inspection');
    kvTable('Assessment of fish passage against WS.7',[
      ['Is the waterway within the culvert substantively clear of debris?',v(r,'debris_clear'),isBad(r,'debris_clear')],
      ['Has any erosion of the stream bank or bed occurred because of the culvert/stream works?\nIf so, are remedial works required?',`${v(r,'erosion')||'–'}\n${v(r,'remedial')||'–'}`,isBad(r,'erosion')||isBad(r,'remedial')],
      ['Is fish passage to and through the culvert impeded?',pair(r,'impeded_to','impeded_through','To','Through'),isBad(r,'impeded_to')||isBad(r,'impeded_through')],
      ['Comments:',v(r,'ws7_comments')]],CW*0.5);
    heading('Asset Condition Summary');
    const LW=CW*0.39;
    kvTable('General Observations',[
      ['Inlet condition:',v(r,'inlet_cond'),isBad(r,'inlet_cond')],['Outlet condition:',v(r,'outlet_cond'),isBad(r,'outlet_cond')],
      ['Condition in culvert:',v(r,'culvert_cond'),isBad(r,'culvert_cond')],
      ['Velocity upstream:',v(r,'vel_up')],['Velocities in culvert:',v(r,'vel_in')],['Velocity at outlet:',v(r,'vel_out')],
      ['Water depth / flow:',`${v(r,'depth')?v(r,'depth')+' mm':'–'} / ${v(r,'flow')?v(r,'flow')+' L/s (estimate)':'–'}`],
      ['Target species upstream:',''],['Species observed during inspection:',v(r,'species')]],LW);
    kvTable('Inspection of fish passage aids:',[
      ['Baffles/flexi baffles:',v(r,'baffles'),isBad(r,'baffles')],['Spat rope:',v(r,'spat_rope'),isBad(r,'spat_rope')],
      ['Planter pods:',v(r,'planter_pods'),isBad(r,'planter_pods')],['Concrete channels on apron:',v(r,'apron_channels'),isBad(r,'apron_channels')],
      ['Sediment / debris accumulation within culvert:',v(r,'sed_in'),isBad(r,'sed_in')]],LW);
    kvTable('Inspection of fish passage aids:',[
      ['Sediment / debris accumulation at outlet:',v(r,'sed_out'),isBad(r,'sed_out')],
      ['Erosion or scouring at inlet/outlet:',pair(r,'scour_in','scour_out','Inlet','Outlet'),isBad(r,'scour_in')||isBad(r,'scour_out')],
      ['Vegetation at inlet/outlet:',pair(r,'veg_in','veg_out','Inlet','Outlet')],
      ['Upstream/downstream tie-ins:',pair(r,'us_tie','ds_tie','Upstream','Downstream'),isBad(r,'us_tie')||isBad(r,'ds_tie')]],LW);
    heading('Recommended Remedial Actions');
    gridTable([['Issue No.',18],['Recommended Action',CW-18-26-18-28],['Responsibility',26],['Priority',18],['Target Completion Date',28]],[1,2,3,4,5,6].map(n=>[String(n),'','','','']),7.5);
    heading('Follow-Up / Close-Out');
    kvTable('Follow-Up / Close-Out',[['Follow-Up Inspection Required:',''],['Follow-Up Date:',''],['Remedial Works Completed By:',''],['Completion Date:','']],CW*0.47);
    heading('Photo Log');
    gridTable([['Photo No.',16],['Description',40],['Direction Facing',22],['Filename / Link',CW-78]],
      PHOTOS.map(f=>[String(f.n),f.l,FACING[f.k],r.v[f.k]?photoName(r,f):'']));
    heading('Additional Notes');
    font(FS);col(INK);const note=lines(v(r,'final_comments')||'(Record any other relevant comments, environmental observations, or coordination notes.)',CW);
    need(note.length*LH+4);if(!v(r,'final_comments'))col(MUT);doc.text(note,M,y+3);y+=note.length*LH+6;
    // photographs, 2x2
    // location map + photographs on their own page
    newPage();const L=parseLoc(r.v.location)||(c=>c&&c.lat!=null?{lat:c.lat,lng:c.lng}:null)(cvFor(r));
    heading('Location',0);const mh=72;
    draw(INK);doc.setLineWidth(0.25);
    if(L){
      const img=await mapImage(L.lat,L.lng,1160,480,16).catch(()=>null);
      if(img){doc.addImage(img,'JPEG',M,y,CW,mh,undefined,'FAST');doc.rect(M,y,CW,mh,'S')}
      else{fill([236,240,237]);doc.rect(M,y,CW,mh,'FD');col(MUT);font(9);doc.text('Map could not be loaded (no internet when the report was made).',M+CW/2,y+mh/2,{align:'center'})}
      y+=mh+4;col(INK);font(FS);doc.text(`${r.v.culvert_no}: ${L.lat.toFixed(6)}, ${L.lng.toFixed(6)}`+(r.v.location_acc?`  (GPS accuracy about ${r.v.location_acc} m)`:''),M,y+1);y+=7;
    }else{fill([236,240,237]);doc.rect(M,y,CW,16,'FD');col(MUT);font(9);doc.text('No GPS location was recorded for this inspection.',M+CW/2,y+9,{align:'center'});y+=22}
    const gap=6;let pw=(CW-gap)/2,ph=Math.min(pw*0.75,(BOT-y-26)/2);
    heading('Photographs',0);pw=Math.min(pw,ph/0.75);
    for(let i=0;i<PHOTOS.length;i++){
      const f=PHOTOS[i],x=M+(CW-2*pw-gap)/2+(i%2)*(pw+gap),yy=y+Math.floor(i/2)*(ph+11);
      draw(INK);doc.setLineWidth(0.25);doc.rect(x,yy,pw,ph,'S');
      const im=r.v[f.k]?await pdfImage(r.v[f.k]).catch(()=>null):null;
      if(im){const s=Math.min(pw/im.w,ph/im.h),w=im.w*s,h=im.h*s;doc.addImage(im.data,'JPEG',x+(pw-w)/2,yy+(ph-h)/2,w,h,undefined,'FAST')}
      else{col(MUT);font(9);doc.text('No photo',x+pw/2,yy+ph/2,{align:'center'})}
      col(INK);font(FS,'bold');doc.text(`Photo ${f.n}: ${f.l}`,x,yy+ph+4.5);font(7.5);col(MUT);doc.text(`Facing ${FACING[f.k].toLowerCase()}`,x,yy+ph+8.3);
    }
    for(let p=first;p<=doc.getNumberOfPages();p++)pageOwner[p]=r.v.culvert_no;
  }

  /* running header + footer, as on the Appendix C form */
  const N=doc.getNumberOfPages();
  for(let i=1;i<=N;i++){doc.setPage(i);
    col(INK);font(10,'bold','times');doc.text('Waka Kotahi NZ Transport Agency',W-M,13,{align:'right'});doc.text('Transmission Gully Project',W-M,17.5,{align:'right'});
    font(8.5);col(BLUE);doc.text(i===1?'Greater Wellington Regional Council Report':'Fish Passage Maintenance Inspection Form'+(pageOwner[i]?`  –  ${pageOwner[i]}`:''),M,24);
    draw([150,150,150]);doc.setLineWidth(0.2);doc.line(M,26,W-M,26);
    font(7.5);col(MUT);doc.text('Prepared by ATS Environmental',M,H-8);doc.text(`Page ${i} of ${N}`,W-M,H-8,{align:'right'});
  }
  return{blob:doc.output('blob'),name:`GWRC-fish-passage-report-${stampName()}.pdf`};
}
async function runReport(share){
  const btn=share?$('repShare'):$('repPdf'),t=btn.textContent;btn.disabled=true;btn.textContent='Building report…';
  try{
    const rep=await buildReport();
    if(share){const f=new File([rep.blob],rep.name,{type:'application/pdf'});
      if(navigator.canShare&&navigator.canShare({files:[f]})){try{await navigator.share({files:[f],title:'GWRC fish passage report'})}catch(e){if(e.name!=='AbortError')throw e}}
      else{toast('Sharing not available here, downloading instead');download(rep.name,rep.blob)}}
    else download(rep.name,rep.blob);
  }catch(e){toast(e.message==='none'?'No inspections selected':'Could not build the report')}
  btn.textContent=t;renderReport();
}
$('repPdf').onclick=()=>runReport(false);$('repShare').onclick=()=>runReport(true);

/* ---------- cloud sync (Firebase: Auth + Firestore + Storage) ---------- */
// Everything saves on the phone first. A background queue then uploads each inspection's answers,
// then its photos one at a time, with timeouts. A failure just pauses the queue and it retries later,
// so a patchy connection can never lock up the app.
const FB_READY=!!(window.firebase&&window.FIREBASE_CONFIG&&FIREBASE_CONFIG.apiKey&&!/PASTE/.test(FIREBASE_CONFIG.apiKey));
if(FB_READY)firebase.initializeApp(FIREBASE_CONFIG);
const fbAuth=FB_READY?firebase.auth():null, fdb=FB_READY?firebase.firestore():null, fst=FB_READY?firebase.storage():null;
if(fst){fst.setMaxUploadRetryTime(60e3);fst.setMaxOperationRetryTime(30e3)}
// Name + PIN become a Firebase email/password login (people never see these)
const slugName=n=>String(n||'').trim().toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
const loginEmail=async(name,pin)=>{ // the PIN is hashed so it never shows in the Firebase console
  const s=slugName(name),h=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('tg-fpi:'+s+':'+pin));
  return `${s}.${[...new Uint8Array(h)].slice(0,6).map(b=>b.toString(16).padStart(2,'0')).join('')}@staff.tg-fish-passage.example.com`;
};
const loginPass=pin=>`TG-fpi-${pin}`;

let syncPrefs=load('fpi.sync.v1',{mode:'wifi'});
const SY={busy:false,fails:0,nextTry:0,msg:'',lastOk:load('fpi.lastsync.v1',0),progress:''};
const isSynced=r=>{const s=r.sync||{};return s.json===r.updated&&PHOTOS.every(f=>!r.v[f.k]||(s.ph||{})[f.k]===r.v[f.k])};
const pending=()=>records.filter(r=>!isSynced(r));
const netType=()=>{const c=navigator.connection;return c&&c.type?c.type:'unknown'};
function autoAllowed(){
  if(!auth||!fbAuth||!fbAuth.currentUser||!navigator.onLine||syncPrefs.mode==='manual')return false;
  if(syncPrefs.mode==='any')return true;
  const t=netType();return t==='wifi'||t==='ethernet'; // iPhones can't report this, so they sync on "Sync now" only
}
const withTimeout=(p,ms,onTimeout)=>new Promise((res,rej)=>{
  const t=setTimeout(()=>{try{onTimeout&&onTimeout()}catch(e){}rej(new Error('timeout'))},ms);
  p.then(v=>{clearTimeout(t);res(v)},e=>{clearTimeout(t);rej(e)});
});
const denied=e=>e&&(e.code==='permission-denied'||e.code==='storage/unauthorized'||e.code==='auth/user-token-expired');
async function uploadPhoto(path,blob){
  const task=fst.ref(path).put(blob,{contentType:'image/jpeg'});
  await withTimeout(new Promise((res,rej)=>task.then(res,rej)),90e3,()=>task.cancel());
}
async function syncNow(manual){
  if(SY.busy)return;
  if(!FB_READY){if(manual)toast('Cloud not set up yet (firebase-config.js)');return}
  if(!auth||!fbAuth.currentUser){if(manual)showLogin();return}
  if(!navigator.onLine){if(manual)toast('No connection right now');syncUI();return}
  if(!SY.busy){fetchCulverts();await fetchDeleted()} // pick up list changes and "delete everywhere" first
  if(!pending().length){if(manual)toast('Everything is uploaded');SY.lastOk=Date.now();store('fpi.lastsync.v1',SY.lastOk);syncUI();return}
  SY.busy=true;SY.msg='';syncUI();
  const find=id=>records.find(x=>x.id===id),email=fbAuth.currentUser.email;
  try{
    for(const id of pending().map(r=>r.id)){
      let r=find(id);if(!r)continue;
      const doc=fdb.collection('inspections').doc(id);
      if((r.sync||{}).json!==r.updated){
        const stamp=r.updated;SY.progress=`Uploading ${r.v.culvert_no}`;syncUI();
        const v={...r.v};PHOTOS.forEach(f=>{v[f.k]=v[f.k]?`inspections/${id}/${f.k}.jpg`:''}); // cloud paths, not phone ids
        await withTimeout(doc.set({id,saved:r.saved,updated:stamp,v,culvertNo:v.culvert_no,date:v.date,inspector:v.inspector,
          uploadedBy:email,uploadedByName:auth.name,receivedAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true}),25e3);
        r=find(id);if(r){r.sync={json:stamp,ph:(r.sync||{}).ph||{}};store(KEY.recs,records)}
      }
      for(const f of PHOTOS){
        r=find(id);if(!r)break;const pid=r.v[f.k];
        if(!pid||((r.sync||{}).ph||{})[f.k]===pid)continue;
        const b=await getPhoto(pid);if(!b)continue;
        SY.progress=`Uploading ${r.v.culvert_no} photo ${f.n} of 4`;syncUI();
        await uploadPhoto(`inspections/${id}/${f.k}.jpg`,b);
        await withTimeout(doc.set({photos:{[f.k]:true},uploadedBy:email},{merge:true}),25e3);
        r=find(id);if(r){r.sync={...(r.sync||{}),ph:{...((r.sync||{}).ph||{}),[f.k]:pid}};store(KEY.recs,records)}
      }
      renderList();
    }
    SY.fails=0;SY.nextTry=0;SY.lastOk=Date.now();store('fpi.lastsync.v1',SY.lastOk);
    if(manual)toast('All inspections uploaded');
  }catch(e){
    SY.fails++;SY.nextTry=Date.now()+Math.min(10*60e3,30e3*2**(SY.fails-1));
    SY.msg=denied(e)?'Upload not allowed. Ask the office to check your sign-in.':'Upload paused (weak connection). It will carry on later.';
    if(manual)toast(denied(e)?'Upload not allowed for this sign-in':e.message==='timeout'?'Connection too weak, upload paused':'Upload paused, will retry');
  }finally{SY.busy=false;SY.progress='';syncUI();renderList()}
}
function autoSync(){if(!SY.busy&&Date.now()>=SY.nextTry&&autoAllowed()&&pending().length)syncNow(false)}
function syncUI(){
  const n=pending().length,t=$('syncText'),b=$('syncBtn');
  const when=SY.lastOk?new Date(SY.lastOk).toLocaleString('en-NZ',{day:'numeric',month:'short',hour:'numeric',minute:'2-digit'}):'never';
  let msg=!FB_READY?'Cloud not set up':!auth?'Not signed in':SY.busy?SY.progress||'Uploading…':n?`${n} waiting to upload`:'All uploaded ✓';
  if(auth&&!SY.busy&&SY.msg)msg=SY.msg;
  t.textContent=(auth?auth.name+' · ':'')+msg;
  b.textContent=auth?'Sync now':'Sign in';b.disabled=SY.busy||!FB_READY;
  $('cloudUser').textContent=auth?`Signed in as ${auth.name}`:'Not signed in';
  $('cloudStatus').textContent=!FB_READY?'The Firebase settings (firebase-config.js) have not been filled in yet.':auth?`${n?n+' inspection'+(n>1?'s':'')+' waiting to upload':'Everything on this phone is uploaded'} · last upload ${when}`:'Sign in to upload inspections to the cloud.';
  $('cloudSync').disabled=SY.busy||!FB_READY;$('cloudSign').textContent=auth?'Sign out':'Sign in';$('cloudPull').disabled=!auth||SY.busy;
  $('syncMode').value=syncPrefs.mode;
  const t2=netType();
  $('wifiNote').textContent=syncPrefs.mode!=='wifi'?'':t2==='unknown'?'This phone can\'t tell Wi-Fi from mobile data (iPhones can\'t), so use Sync now when you are on Wi-Fi.':`Connection now: ${t2==='wifi'?'Wi-Fi':t2}.`;
}
/* sign in / out */
function showLogin(){if(!FB_READY){toast('Cloud not set up yet');return}$('login').hidden=false;$('loginErr').hidden=true;setTimeout(()=>$('loginName').focus(),50)}
function signOut(){
  auth=null;try{localStorage.removeItem('fpi.auth.v1')}catch(e){}
  if(fbAuth)fbAuth.signOut().catch(()=>{});syncUI();
}
$('loginForm').addEventListener('submit',async e=>{
  e.preventDefault();const name=$('loginName').value.trim(),pin=$('loginPin').value.trim(),err=$('loginErr');
  if(!name||!/^\d{4,8}$/.test(pin)){err.textContent='Enter your name and your 4 to 8 digit PIN.';err.hidden=false;return}
  const btn=$('loginBtn');btn.disabled=true;btn.textContent='Signing in…';err.hidden=true;
  try{
    const cred=await withTimeout(fbAuth.signInWithEmailAndPassword(await loginEmail(name,pin),loginPass(pin)),20e3);
    const staff=await withTimeout(fdb.collection('staff').doc(cred.user.email).get(),20e3).catch(()=>null);
    if(!staff||!staff.exists){await fbAuth.signOut();throw {code:'not-staff'}}
    auth={name:staff.data().name||name,email:cred.user.email,role:staff.data().role||'inspector'};store('fpi.auth.v1',auth);
    $('login').hidden=true;$('loginPin').value='';
    if(!cur.id&&!(cur.v.inspector||'').trim()){cur.v.inspector=auth.name;paint()}
    toast(`Signed in as ${auth.name}`);syncUI();autoSync();fetchCulverts();
  }catch(ex){
    const c=ex&&ex.code||'';
    err.textContent=c==='not-staff'?'This name isn\'t set up yet. Ask the office to add you.'
      :/invalid-credential|wrong-password|user-not-found|invalid-login/.test(c)?'Name or PIN not recognised.'
      :c==='auth/too-many-requests'?'Too many attempts. Wait a few minutes and try again.'
      :c==='auth/operation-not-allowed'?'Sign-in is not switched on in Firebase yet. Ask the office.'
      :'Can\'t reach the server. Sign in when you have coverage, or use offline for now.';
    err.hidden=false;
  }finally{btn.disabled=false;btn.textContent='Sign in'}
});
$('loginSkip').onclick=()=>{$('login').hidden=true;try{sessionStorage.setItem('fpi.skip','1')}catch(e){}syncUI()};
$('syncBtn').onclick=()=>auth?syncNow(true):showLogin();
$('cloudSync').onclick=()=>syncNow(true);
$('cloudSign').onclick=()=>auth?signOut():showLogin();
$('syncMode').onchange=e=>{syncPrefs.mode=e.target.value;store('fpi.sync.v1',syncPrefs);syncUI();autoSync()};
/* office: copy all uploaded inspections onto this device */
$('cloudPull').onclick=async()=>{
  if(!auth)return showLogin();const b=$('cloudPull'),t=b.textContent;b.disabled=true;
  try{
    b.textContent='Checking…';
    const gone=await fetchDeleted();
    const snap=await withTimeout(fdb.collection('inspections').get(),30e3);
    let added=0,i=0;
    for(const d of snap.docs){
      const it=d.data();i++;b.textContent=`Downloading ${i} of ${snap.size}…`;
      const local=records.find(r=>r.id===it.id);
      if(!it.v||gone.has(it.id))continue;
      if(local&&(local.updated||'')>=(it.updated||'')){if((local.linkRef||'')!==(it.culvertRef||'')){local.linkRef=it.culvertRef||'';store(KEY.recs,records)}continue}
      const v={...it.v},ph={};
      for(const f of PHOTOS){
        if(!(it.photos||{})[f.k]){v[f.k]='';continue}
        const url=await withTimeout(fst.ref(`inspections/${it.id}/${f.k}.jpg`).getDownloadURL(),30e3);
        const blob=await withTimeout(fetch(url).then(r=>{if(!r.ok)throw new Error('photo '+r.status);return r.blob()}),60e3);
        const pid='C'+it.id+f.k;await putPhoto(pid,blob);v[f.k]=pid;ph[f.k]=pid;
      }
      const rec={id:it.id,saved:it.saved,updated:it.updated,v,sync:{json:it.updated,ph},by:it.uploadedByName,linkRef:it.culvertRef||''};
      if(local)records[records.indexOf(local)]=rec;else records.push(rec);added++;
      store(KEY.recs,records);
    }
    records.sort((a,b)=>(b.saved||'').localeCompare(a.saved||''));store(KEY.recs,records);renderList();gc();
    toast(added?`Copied ${added} inspection${added>1?'s':''} from the cloud`:'This device already has everything');
  }catch(e){toast(e.message==='timeout'?'Connection too slow, try again on Wi-Fi':e instanceof TypeError?'Photos blocked: the Storage CORS setting is missing (see README)':'Could not download: '+(e.code||e.message))}
  finally{b.textContent=t;syncUI()}
};
if(fbAuth)fbAuth.onAuthStateChanged(u=>{ // Firebase remembers the sign-in on this phone, even offline
  if(!u&&auth&&navigator.onLine){auth=null;try{localStorage.removeItem('fpi.auth.v1')}catch(e){}}
  syncUI();if(u){fetchDeleted().then(autoSync);fetchCulverts()}
});
window.addEventListener('online',()=>{syncUI();autoSync()});
window.addEventListener('offline',syncUI);
if(navigator.connection&&navigator.connection.addEventListener)navigator.connection.addEventListener('change',()=>{syncUI();autoSync()});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)autoSync()});
setInterval(autoSync,2*60e3);
setInterval(()=>{if(auth&&navigator.onLine)fetchDeleted()},10*60e3);

/* ---------- tabs / misc ---------- */
function show(v){
  const isForm=v==='form';$('view-form').hidden=!isForm;$('view-list').hidden=isForm;$('formBar').hidden=!isForm;
  $('tab-form').setAttribute('aria-selected',isForm);$('tab-list').setAttribute('aria-selected',!isForm);
  document.querySelector('.progress').style.visibility=isForm?'visible':'hidden';
}
$('tab-form').onclick=()=>show('form');
$('tab-list').onclick=()=>{renderList();show('list');window.scrollTo(0,0)};
let tt;function toast(m){const t=$('toast');t.textContent=m;t.hidden=false;clearTimeout(tt);tt=setTimeout(()=>t.hidden=true,2600)}

try{localStorage.removeItem('fpi.assets.v1');localStorage.removeItem('fpi.assets.v2')}catch(e){}
paint();renderList();gc();syncUI();
let skipped=false;try{skipped=sessionStorage.getItem('fpi.skip')==='1'}catch(e){}
if(!auth&&!skipped)showLogin();
setTimeout(autoSync,1500);
// Offline support: cache the app on the phone (only when served over https)
if('serviceWorker' in navigator&&location.protocol==='https:'){navigator.serviceWorker.register('sw.js').catch(()=>{})}
if(!storageOK)$('storeWarn').hidden=false;
