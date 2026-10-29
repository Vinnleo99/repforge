import './style.css';
import { EXERCISES } from './exercises.js';
import { stats, draw, SIZE, recordVideo } from './share.js';
const KEY='repforge-data-v1';
const db=Object.assign({workouts:[],routines:[],active:null,profileName:'Victricius'},JSON.parse(localStorage.getItem(KEY)||'{}'));
const save=()=>localStorage.setItem(KEY,JSON.stringify(db));
const ui={share:null,tab:'home',view:null,picker:null,search:'',muscle:'All',routineDraft:null,summary:null,rest:null};
const exById=id=>EXERCISES.find(e=>e.id===id)||{name:id,muscle:'',equipment:''};
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fmtDur=s=>{s=Math.max(0,Math.floor(s));const h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60;return h?`${h}h ${m}min`:m?`${m}min ${x}s`:`${x}s`};
const clock=s=>{s=Math.max(0,Math.floor(s));return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`};
const vol=w=>w.exercises.reduce((a,e)=>a+e.sets.filter(s=>s.done).reduce((b,s)=>b+(+s.kg||0)*(+s.reps||0),0),0);
const sets=w=>w.exercises.reduce((a,e)=>a+e.sets.filter(s=>s.done).length,0);
const dateStr=t=>new Date(t).toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
const I={
 home:'<svg viewBox="0 0 24 24"><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>',
 dumbbell:'<svg viewBox="0 0 24 24"><path d="M2 10h2v4H2zM5 7h3v10H5zM16 7h3v10h-3zM20 10h2v4h-2zM8 11h8v2H8z"/></svg>',
 user:'<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7z"/></svg>',
 check:'<svg viewBox="0 0 24 24"><path d="M9 16.2l-4.2-4.2-1.4 1.4L9 19 21 7l-1.4-1.4z"/></svg>',
 trophy:'<svg viewBox="0 0 24 24"><path d="M7 3h10v2h4v3a4 4 0 0 1-4 4h-.3A5 5 0 0 1 13 15v3h4v3H7v-3h4v-3a5 5 0 0 1-3.7-3H7a4 4 0 0 1-4-4V5h4zm-2 4v1a2 2 0 0 0 2 2V7zm14 0h-2v3a2 2 0 0 0 2-2z"/></svg>',
 clock:'<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 10.4l3.5 2.1-.8 1.3L11 13V7h2z"/></svg>',
 plus:'<svg viewBox="0 0 24 24"><path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6z"/></svg>',
 search:'<svg viewBox="0 0 24 24"><path d="M10 3a7 7 0 0 1 5.6 11.2l5 5-1.4 1.4-5-5A7 7 0 1 1 10 3zm0 2a5 5 0 1 0 0 10 5 5 0 0 0 0-10z"/></svg>',
 back:'<svg viewBox="0 0 24 24"><path d="M15.4 5.4L14 4l-8 8 8 8 1.4-1.4L8.8 12z"/></svg>',
 dots:'<svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>',
 note:'<svg viewBox="0 0 24 24"><path d="M4 4h16v12l-4 4H4zm2 2v12h9v-3h3V6z"/></svg>',
};
const initials=n=>n.split(/\s+/).map(x=>x[0]).join('').slice(0,2).toUpperCase();
const thumb=e=>`<div class="thumb">${initials(e.name)}</div>`;

function previousFor(exId){for(let i=db.workouts.length-1;i>=0;i--){const e=db.workouts[i].exercises.find(x=>x.exId===exId);if(e){const d=e.sets.filter(s=>s.done);if(d.length)return d}}return[]}
function bestWeight(exId,beforeIdx=db.workouts.length){let b=0;db.workouts.slice(0,beforeIdx).forEach(w=>w.exercises.filter(e=>e.exId===exId).forEach(e=>e.sets.filter(s=>s.done).forEach(s=>b=Math.max(b,+s.kg||0))));return b}

// ---------- Home ----------
function homeView(){
 const ws=[...db.workouts].reverse();
 return `<header class="top"><h1>Home</h1></header><main class="scroll">
 ${ws.length?'':`<div class="empty">${I.dumbbell}<h2>No workouts yet</h2><p>Your finished workouts will appear here.</p><button class="btn primary" data-a="tab" data-v="workout">Start your first workout</button></div>`}
 ${ws.map(w=>`<article class="card post">
  <div class="post-head"><div class="avatar">${initials(db.profileName)}</div><div><b>${esc(db.profileName)}</b><small>${dateStr(w.start)}</small></div></div>
  <div class="rt-head"><h3>${esc(w.name)}</h3><button class="btn dark sm" data-a="openShare" data-v="${w.id}">Share</button></div>
  <div class="stats"><div><small>Time</small><b>${fmtDur(w.duration)}</b></div><div><small>Volume</small><b>${vol(w).toLocaleString('en-GB')} kg</b></div><div><small>Sets</small><b>${sets(w)}</b></div>${w.records?.length?`<div><small>Records</small><b class="gold">${I.trophy}${w.records.length}</b></div>`:''}</div>
  <div class="post-ex">${w.exercises.map(e=>{const x=exById(e.exId);const n=e.sets.filter(s=>s.done).length;return `<div class="row">${thumb(x)}<span>${n} ${n===1?'set':'sets'} ${esc(x.name)}</span>${w.records?.includes(e.exId)?'<span class="pr">'+I.trophy+'Personal record</span>':''}</div>`}).join('')}</div>
 </article>`).join('')}
 </main>`;
}
// ---------- Workout tab ----------
function workoutTabView(){
 return `<header class="top"><h1>Workout</h1></header><main class="scroll">
 <p class="label">Quick start</p>
 <button class="btn wide dark" data-a="startEmpty">${I.plus} Start an empty workout</button>
 <div class="label-row"><p class="label">Routines</p></div>
 <div class="two"><button class="btn dark" data-a="newRoutine">${I.note} New routine</button><button class="btn dark" data-a="tab" data-v="profile">${I.search} Explore statistics</button></div>
 <p class="label">My routines (${db.routines.length})</p>
 ${db.routines.length?'':'<p class="muted pad">Create a routine to start a planned workout with one tap.</p>'}
 ${db.routines.map(r=>`<div class="card routine"><div class="rt-head"><h3>${esc(r.name)}</h3><button class="icon" data-a="editRoutine" data-v="${r.id}" aria-label="Edit routine">${I.dots}</button></div>
   <p class="muted">${r.exercises.map(e=>esc(exById(e.exId).name)).join(', ')||'No exercises'}</p>
   <button class="btn primary wide" data-a="startRoutine" data-v="${r.id}">Start routine</button></div>`).join('')}
 ${db.active?`<div class="resume" data-a="openActive">Workout in progress · ${fmtDur((Date.now()-db.active.start)/1000)} <b>Resume</b></div>`:''}
 </main>`;
}
// ---------- Profile ----------
function weeklyVolume(){const now=new Date();const mon=new Date(now);mon.setHours(0,0,0,0);mon.setDate(mon.getDate()-((mon.getDay()+6)%7));
 const weeks=[];for(let i=7;i>=0;i--){const s=new Date(mon);s.setDate(s.getDate()-7*i);const e=new Date(s);e.setDate(e.getDate()+7);weeks.push({label:s.toLocaleDateString('en-GB',{day:'numeric',month:'short'}),v:db.workouts.filter(w=>w.start>=+s&&w.start<+e).reduce((a,w)=>a+vol(w),0)})}return weeks}
function profileView(){
 const weeks=weeklyVolume();const max=Math.max(1,...weeks.map(w=>w.v));
 const total=db.workouts.reduce((a,w)=>a+vol(w),0), time=db.workouts.reduce((a,w)=>a+w.duration,0);
 const recs=db.workouts.reduce((a,w)=>a+(w.records?.length||0),0);
 const bar=(w,i)=>{const h=Math.round(w.v/max*120);return `<g><rect x="${i*40+8}" y="${140-h}" width="24" height="${h}" rx="4" class="${i===7?'cur':''}"/><text x="${i*40+20}" y="158">${w.label.split(' ')[0]}</text></g>`};
 return `<header class="top"><h1>Profile</h1></header><main class="scroll">
 <div class="prof"><div class="avatar big">${initials(db.profileName)}</div><div><h2>${esc(db.profileName)}</h2><div class="pstats"><div><small>Workouts</small><b>${db.workouts.length}</b></div><div><small>Records</small><b>${recs}</b></div><div><small>Routines</small><b>${db.routines.length}</b></div></div></div></div>
 <div class="card"><div class="chart-head"><div><b>${weeks[7].v.toLocaleString('en-GB')} kg</b><small> this week</small></div><span class="chip on">Volume</span></div>
 <svg class="chart" viewBox="0 0 320 165">${weeks.map(bar).join('')}</svg><p class="muted small">Weekly volume (weight × repetitions) over the last eight weeks</p></div>
 <div class="two"><div class="card tile"><small>Total volume</small><b>${total.toLocaleString('en-GB')} kg</b></div><div class="card tile"><small>Total time</small><b>${fmtDur(time)}</b></div></div>
 <p class="label">Backup</p><p class="muted small pad">Your data lives only on this phone. iPhone can clear website data, so export a backup now and then.</p><div class="two"><button class="btn dark" data-a="exportData">Export backup</button><label class="btn dark">Import backup<input type="file" id="importFile" accept="application/json,.json" hidden></label></div>
 <button class="btn dark wide" data-a="resetData">Delete all data on this device</button>
 </main>`;
}
// ---------- Active workout ----------
function activeView(){
 const w=db.active;const el=(Date.now()-w.start)/1000;
 return `<div class="sheet"><header class="top bar"><button class="icon" data-a="minimise" aria-label="Minimise">${I.back}</button><h2>Log workout</h2><span class="spacer"></span><button class="btn primary sm" data-a="finish">Finish</button></header>
 <div class="wstats"><div><small>Duration</small><b class="blue" id="dur">${fmtDur(el)}</b></div><div><small>Volume</small><b id="wvol">${vol(w).toLocaleString('en-GB')} kg</b></div><div><small>Sets</small><b id="wsets">${sets(w)}</b></div></div>
 <main class="scroll pb">
 ${w.exercises.length?'':`<div class="empty">${I.dumbbell}<h2>Get started</h2><p>Add an exercise to start your workout.</p></div>`}
 ${w.exercises.map((e,ei)=>exCard(e,ei)).join('')}
 <button class="btn primary wide" data-a="addEx">${I.plus} Add exercise</button>
 <div class="two"><button class="btn dark" data-a="settings">Settings</button><button class="btn danger" data-a="discard">Discard workout</button></div>
 </main>${restBar()}</div>`;
}
function exCard(e,ei){const x=exById(e.exId);const prev=previousFor(e.exId);const best=bestWeight(e.exId);
 return `<section class="ex"><div class="ex-head">${thumb(x)}<h3 class="blue">${esc(x.name)}</h3><button class="icon" data-a="removeEx" data-v="${ei}" aria-label="Remove exercise">${I.dots}</button></div>
 <input class="exnote" placeholder="Add notes here…" data-note="${ei}" value="${esc(e.note||'')}">
 <div class="rest-line">${I.clock} Rest timer: <b>${clock(e.rest??90)}</b> <button class="link" data-a="restChange" data-v="${ei}">Change</button></div>
 <div class="sets"><div class="sr hdr"><span>Set</span><span>Previous</span><span>kg</span><span>Reps</span><span>${I.check}</span></div>
 ${e.sets.map((s,si)=>{const p=prev[si];const isPr=s.done&&(+s.kg)>best&&best>0;return `<div class="sr ${s.done?'done':''}" data-row="${ei}-${si}">
  <span class="setno">${si+1}</span><span class="prev">${p?`${p.kg} kg × ${p.reps}`:'—'}</span>
  <input inputmode="decimal" data-f="kg" data-i="${ei}-${si}" value="${esc(s.kg)}" placeholder="${p?p.kg:'0'}">
  <input inputmode="numeric" data-f="reps" data-i="${ei}-${si}" value="${esc(s.reps)}" placeholder="${p?p.reps:'0'}">
  <button class="tick" data-a="tick" data-v="${ei}-${si}" aria-label="Complete set">${I.check}</button>${isPr?'<span class="prdot" title="Personal record">'+I.trophy+'</span>':''}</div>`}).join('')}
 </div><button class="btn dark wide sm" data-a="addSet" data-v="${ei}">${I.plus} Add set</button></section>`}
function restBar(){if(!ui.rest)return'';const left=(ui.rest.end-Date.now())/1000;const pct=Math.max(0,left/ui.rest.total*100);
 return `<div class="restbar"><div class="fill" style="width:${pct}%"></div><button class="btn dark sm" data-a="rest" data-v="-15">−15</button><b id="restclock">${clock(left)}</b><button class="btn dark sm" data-a="rest" data-v="15">+15</button><button class="btn primary sm" data-a="skipRest">Skip</button></div>`}
// ---------- Picker ----------
function pickerView(){const q=ui.search.toLowerCase();const muscles=['All',...new Set(EXERCISES.map(e=>e.muscle))];
 const list=EXERCISES.filter(e=>(ui.muscle==='All'||e.muscle===ui.muscle)&&(e.name.toLowerCase().includes(q)||e.equipment.toLowerCase().includes(q)));
 const groups={};list.forEach(e=>(groups[e.muscle]??=[]).push(e));
 return `<div class="sheet"><header class="top bar"><button class="link" data-a="closePicker">Cancel</button><h2>Add exercise</h2><span class="spacer"></span></header>
 <div class="searchbox">${I.search}<input id="search" placeholder="Search exercise" value="${esc(ui.search)}"></div>
 <div class="chips">${muscles.map(m=>`<button class="chip ${m===ui.muscle?'on':''}" data-a="muscle" data-v="${m}">${m==='All'?'All muscles':m}</button>`).join('')}</div>
 <main class="scroll" id="plist">${Object.entries(groups).map(([m,xs])=>`<p class="label">${m}</p>${xs.map(e=>`<button class="pick" data-a="pick" data-v="${e.id}">${thumb(e)}<div><b>${esc(e.name)}</b><small>${e.muscle} · ${e.equipment}</small></div></button>`).join('')}`).join('')||'<p class="muted pad">No exercises match your search.</p>'}</main></div>`}
// ---------- Routine editor ----------
function routineView(){const r=ui.routineDraft;
 return `<div class="sheet"><header class="top bar"><button class="link" data-a="cancelRoutine">Cancel</button><h2>${r.isNew?'Create routine':'Edit routine'}</h2><span class="spacer"></span><button class="btn primary sm" data-a="saveRoutine">Save</button></header>
 <main class="scroll"><input id="rname" class="title-input" placeholder="Routine title" value="${esc(r.name)}">
 ${r.exercises.map((e,i)=>{const x=exById(e.exId);return `<section class="ex"><div class="ex-head">${thumb(x)}<h3 class="blue">${esc(x.name)}</h3><button class="link danger-t" data-a="rRemove" data-v="${i}">Remove</button></div>
 <div class="rset">Sets <button class="btn dark sm" data-a="rSets" data-v="${i}|-1">−</button><b>${e.sets}</b><button class="btn dark sm" data-a="rSets" data-v="${i}|1">+</button></div></section>`}).join('')}
 <button class="btn primary wide" data-a="rAdd">${I.plus} Add exercise</button>
 ${r.isNew?'':'<button class="btn danger wide" data-a="rDelete">Delete routine</button>'}</main></div>`}
// ---------- Summary ----------
function summaryView(){const w=ui.summary;
 return `<div class="sheet"><main class="scroll center"><div class="confetti">${I.trophy}</div><h1>Well done!</h1><p class="muted">That was workout number ${db.workouts.length}.</p>
 <div class="card"><h3>${esc(w.name)}</h3><p class="muted small">${dateStr(w.start)}</p>
 <div class="stats"><div><small>Time</small><b>${fmtDur(w.duration)}</b></div><div><small>Volume</small><b>${vol(w).toLocaleString('en-GB')} kg</b></div><div><small>Sets</small><b>${sets(w)}</b></div></div>
 ${w.records.length?`<p class="label">Personal records</p>${w.records.map(id=>`<div class="row"><span class="pr">${I.trophy}</span> ${esc(exById(id).name)} — heaviest weight ${bestWeight(id)} kg</div>`).join('')}`:''}
 ${w.exercises.map(e=>`<div class="row">${thumb(exById(e.exId))}<span>${e.sets.filter(s=>s.done).length} sets ${esc(exById(e.exId).name)}</span></div>`).join('')}</div>
 <button class="btn dark wide" data-a="openShare" data-v="${w.id}">Share with a photo or video</button><button class="btn primary wide" data-a="doneSummary">Done</button></main></div>`}

function render(){
 const v=ui.view;let body;
 if(v==='active')body=activeView();else if(v==='picker')body=pickerView();else if(v==='routine')body=routineView();else if(v==='summary')body=summaryView();else if(v==='share')body=shareView();
 else body=(ui.tab==='home'?homeView():ui.tab==='workout'?workoutTabView():profileView())+
  (db.active?`<div class="mini" data-a="openActive"><span>Workout in progress</span><b class="blue">${fmtDur((Date.now()-db.active.start)/1000)}</b></div>`:'')+
  `<nav class="tabs">${[['home','Home',I.home],['workout','Workout',I.dumbbell],['profile','Profile',I.user]].map(([k,l,ic])=>`<button class="${ui.tab===k?'on':''}" data-a="tab" data-v="${k}">${ic}<span>${l}</span></button>`).join('')}</nav>`;
 $('#app').innerHTML=body;
 if(v==='share')paint();
}
function newWorkout(name,exercises=[]){db.active={name,start:Date.now(),exercises};save();ui.view='active';render()}
const A={
 tab:v=>{ui.tab=v;ui.view=null},
 startEmpty:()=>newWorkout(timeName()),
 startRoutine:id=>{const r=db.routines.find(x=>x.id===id);newWorkout(r.name,r.exercises.map(e=>({exId:e.exId,rest:90,sets:Array.from({length:e.sets},()=>({kg:'',reps:'',done:false}))})))},
 openActive:()=>{ui.view='active'},minimise:()=>{ui.view=null},
 addEx:()=>{ui.picker='workout';ui.view='picker';ui.search='';ui.muscle='All'},
 closePicker:()=>{ui.view=ui.picker==='workout'?'active':'routine'},
 muscle:v=>{ui.muscle=v},
 pick:id=>{if(ui.picker==='workout'){db.active.exercises.push({exId:id,rest:90,sets:[{kg:'',reps:'',done:false}]});save();ui.view='active'}else{ui.routineDraft.exercises.push({exId:id,sets:3});ui.view='routine'}},
 addSet:i=>{const e=db.active.exercises[i];const l=e.sets.at(-1);e.sets.push({kg:l?.kg||'',reps:l?.reps||'',done:false});save()},
 removeEx:i=>{if(confirm('Remove this exercise from the workout?')){db.active.exercises.splice(+i,1);save()}},
 restChange:i=>{const e=db.active.exercises[i];const opts=[0,30,60,90,120,180];e.rest=opts[(opts.indexOf(e.rest??90)+1)%opts.length];save()},
 tick:v=>{const[ei,si]=v.split('-').map(Number);const e=db.active.exercises[ei],s=e.sets[si];
  if(!s.done){const p=previousFor(e.exId)[si];if(s.kg===''&&p)s.kg=p.kg;if(s.reps===''&&p)s.reps=p.reps;if(s.kg==='')s.kg='0';if(s.reps==='')s.reps='0'}
  s.done=!s.done;save();if(s.done&&(e.rest??90)>0){const t=e.rest??90;ui.rest={end:Date.now()+t*1000,total:t}}},
 rest:d=>{ui.rest.end+=d*1000;ui.rest.total=Math.max(ui.rest.total,(ui.rest.end-Date.now())/1000)},skipRest:()=>{ui.rest=null},
 settings:()=>{const n=prompt('Workout title',db.active.name);if(n){db.active.name=n;save()}},
 discard:()=>{if(confirm('Discard this workout? It will not be saved.')){db.active=null;ui.rest=null;save();ui.view=null}},
 finish:()=>{const w=db.active;w.exercises.forEach(e=>e.sets=e.sets.filter(s=>s.done));w.exercises=w.exercises.filter(e=>e.sets.length);
  if(!w.exercises.length){alert('Tick at least one set before finishing.');return}
  w.duration=Math.round((Date.now()-w.start)/1000);w.id='w'+Date.now();
  w.records=w.exercises.filter(e=>{const b=bestWeight(e.exId);return b>0&&Math.max(...e.sets.map(s=>+s.kg||0))>b}).map(e=>e.exId);
  db.workouts.push(w);db.active=null;ui.rest=null;save();ui.summary=w;ui.view='summary'},
 exportData:()=>{const b=new Blob([JSON.stringify({app:'repforge',version:1,exported:new Date().toISOString(),data:db},null,2)],{type:'application/json'});download(b,`repforge-backup-${new Date().toISOString().slice(0,10)}.json`)},
 doneSummary:()=>{ui.view=null;ui.tab='home'},
 newRoutine:()=>{ui.routineDraft={id:'r'+Date.now(),name:'',exercises:[],isNew:true};ui.view='routine'},
 editRoutine:id=>{ui.routineDraft={...structuredClone(db.routines.find(r=>r.id===id)),isNew:false};ui.view='routine'},
 cancelRoutine:()=>{ui.view=null},
 rAdd:()=>{ui.routineDraft.name=$('#rname').value;ui.picker='routine';ui.view='picker';ui.search='';ui.muscle='All'},
 rRemove:i=>{ui.routineDraft.exercises.splice(+i,1)},
 rSets:v=>{const[i,d]=v.split('|').map(Number);const e=ui.routineDraft.exercises[i];e.sets=Math.max(1,e.sets+d)},
 saveRoutine:()=>{const r=ui.routineDraft;r.name=$('#rname').value.trim()||'Untitled routine';const{isNew,...clean}=r;const i=db.routines.findIndex(x=>x.id===r.id);if(i>=0)db.routines[i]=clean;else db.routines.push(clean);save();ui.view=null;ui.tab='workout'},
 rDelete:()=>{if(confirm('Delete this routine?')){db.routines=db.routines.filter(x=>x.id!==ui.routineDraft.id);save();ui.view=null}},
 resetData:()=>{if(confirm('Delete every workout and routine on this device?')){localStorage.removeItem(KEY);location.reload()}},
};
function timeName(){const h=new Date().getHours();return h<12?'Morning workout':h<18?'Afternoon workout':'Evening workout'}
document.addEventListener('click',ev=>{const b=ev.target.closest('[data-a]');if(!b)return;const f=A[b.dataset.a];if(!f)return;f(b.dataset.v);render()});
document.addEventListener('change',async ev=>{const t=ev.target;
 if(t.id==='importFile'&&t.files[0]){try{const j=JSON.parse(await t.files[0].text());const d=j.data||j;if(!Array.isArray(d.workouts))throw 0;if(!confirm(`Replace the data on this device with the backup (${d.workouts.length} workouts, ${(d.routines||[]).length} routines)?`))return;localStorage.setItem(KEY,JSON.stringify(d));location.reload()}catch{alert('That file is not a valid backup.')}}
 if(t.id==='media'&&t.files[0])loadMedia(t.files[0]);});
document.addEventListener('input',ev=>{const t=ev.target;
 if(t.dataset.f){const[ei,si]=t.dataset.i.split('-').map(Number);db.active.exercises[ei].sets[si][t.dataset.f]=t.value.replace(',','.');save();const vv=$('#wvol');if(vv)vv.textContent=vol(db.active).toLocaleString('en-GB')+' kg'}
 else if(t.dataset.note!==undefined){db.active.exercises[+t.dataset.note].note=t.value;save()}
 else if(t.id==='search'){ui.search=t.value;const pos=t.selectionStart;render();const s=$('#search');s.focus();s.setSelectionRange(pos,pos)}
 else if(t.id==='rname'){ui.routineDraft.name=t.value}});
setInterval(()=>{
 if(ui.rest&&ui.rest.end<=Date.now()){ui.rest=null;navigator.vibrate?.([200,100,200]);if(ui.view==='active')render();return}
 if(ui.view==='active'){const d=$('#dur');if(d)d.textContent=fmtDur((Date.now()-db.active.start)/1000);const r=$('#restclock');if(r){r.textContent=clock((ui.rest.end-Date.now())/1000);$('.restbar .fill').style.width=Math.max(0,(ui.rest.end-Date.now())/10/ui.rest.total)+'%'}}
},1000);
render();
if('serviceWorker' in navigator&&location.protocol!=='file:')navigator.serviceWorker.register('./sw.js');

// ---------- Share ----------
function download(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),5000)}
const shareState={layout:'panel',sticker:false,media:null,mw:0,mh:0,isVideo:false,busy:''};
function shareData(w){const s=stats(w,id=>exById(id).name);return{name:w.name,date:new Date(w.start).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'}),duration:fmtDur(w.duration),volume:vol(w).toLocaleString('en-GB')+' kg',sets:sets(w),...s}}
function shareView(){const st=shareState;
 return `<div class="sheet"><header class="top bar"><button class="link" data-a="closeShare">Close</button><h2>Share workout</h2><span class="spacer"></span></header>
 <main class="scroll"><div class="canvas-wrap ${st.sticker?'checker':''}"><canvas id="sc" width="${SIZE.W}" height="${SIZE.H}"></canvas></div>
 <div class="two"><label class="btn dark">Choose photo or video<input type="file" id="media" accept="image/*,video/*" hidden></label><label class="btn dark">Take photo<input type="file" id="media" accept="image/*" capture="environment" hidden></label></div>
 <p class="label">Layout</p><div class="chips">${[['panel','Bottom panel'],['card','Centre card'],['minimal','Minimal']].map(([k,l])=>`<button class="chip ${st.layout===k?'on':''}" data-a="layout" data-v="${k}">${l}</button>`).join('')}
 <button class="chip ${st.sticker?'on':''}" data-a="sticker">Transparent sticker</button></div>
 ${st.busy?`<p class="muted pad">${st.busy}</p>`:''}
 <button class="btn primary wide" data-a="doShare">${st.isVideo&&!st.sticker?'Make video and share':'Share'}</button>
 <button class="btn dark wide" data-a="doSave">Save to device</button>
 ${st.isVideo?'<p class="muted small pad">Videos are re-recorded with the overlay burnt in, up to 60 seconds. Keep this screen open while it records.</p>':''}
 </main></div>`}
function paint(){const c=$('#sc');if(!c)return;draw(c.getContext('2d'),{...shareState,media:shareState.sticker?null:shareState.media,d:shareData(ui.share)})}
function loadMedia(file){const url=URL.createObjectURL(file);
 if(file.type.startsWith('video/')){const v=document.createElement('video');v.src=url;v.playsInline=true;v.muted=true;v.preload='auto';v.onloadeddata=()=>{Object.assign(shareState,{media:v,mw:v.videoWidth,mh:v.videoHeight,isVideo:true});render();paint()};v.load()}
 else{const i=new Image();i.onload=()=>{Object.assign(shareState,{media:i,mw:i.naturalWidth,mh:i.naturalHeight,isVideo:false});render();paint()};i.src=url}}
async function makeBlob(){const c=$('#sc');
 if(shareState.isVideo&&!shareState.sticker){shareState.busy='Recording video… 0%';render();const c2=$('#sc');
  const blob=await recordVideo(shareState.media,c2,paint,p=>{const el=$('.sheet .muted.pad');if(el)el.textContent=`Recording video… ${Math.round(p*100)}%`});
  shareState.busy='';render();paint();return{blob,name:`repforge-workout.${blob.type.includes('mp4')?'mp4':'webm'}`}}
 const blob=await new Promise(r=>c.toBlob(r,'image/png'));return{blob,name:shareState.sticker?'repforge-sticker.png':'repforge-workout.png'}}
async function shareOut(saveOnly){try{const{blob,name}=await makeBlob();const file=new File([blob],name,{type:blob.type});
 if(!saveOnly&&navigator.canShare?.({files:[file]})){await navigator.share({files:[file],title:ui.share.name})}else download(blob,name)}catch(e){if(e.name!=='AbortError')alert('Could not share: '+e.message)}}
const SHARE={
 openShare:id=>{ui.share=db.workouts.find(w=>w.id===id);Object.assign(shareState,{media:null,isVideo:false,busy:''});ui.backFrom=ui.view;ui.view='share';setTimeout(paint)},
 closeShare:()=>{ui.view=ui.backFrom==='summary'?'summary':null},
 layout:v=>{shareState.layout=v;setTimeout(paint)},sticker:()=>{shareState.sticker=!shareState.sticker;setTimeout(paint)},
 doShare:()=>{shareOut(false)},doSave:()=>{shareOut(true)},
};
Object.assign(A,SHARE);
