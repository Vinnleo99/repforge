import {exThumb} from './icons.js';
import {alertBox,confirmBox,promptBox,sheetBox} from './dialog.js';
import './style.css';
import { EXERCISES } from './exercises.js';
import { stats, draw, SIZE, recordVideo } from './share.js';
const KEY='repforge-data-v1';
const db=Object.assign({workouts:[],routines:[],active:null,profileName:'Victricius'},JSON.parse(localStorage.getItem(KEY)||'{}'));
const save=()=>localStorage.setItem(KEY,JSON.stringify(db));
const ui={pages:[],metric:'duration',equip:'All',share:null,tab:'home',view:null,picker:null,search:'',muscle:'All',routineDraft:null,summary:null,rest:null};
const exById=id=>EXERCISES.find(e=>e.id===id)||{name:id,muscle:'',equipment:''};
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fmtDur=s=>{s=Math.max(0,Math.floor(s));const h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60;return h?`${h}h ${m}min`:m?`${m}min ${x}s`:`${x}s`};
const clock=s=>{s=Math.max(0,Math.floor(s));return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`};
const vol=w=>w.exercises.reduce((a,e)=>a+e.sets.filter(s=>s.done).reduce((b,s)=>b+(+s.kg||0)*(+s.reps||0),0),0);
const sets=w=>w.exercises.reduce((a,e)=>a+e.sets.filter(s=>s.done).length,0);
const dateStr=t=>new Date(t).toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
const sv=p=>`<svg viewBox="0 0 24 24" class="o">${p}</svg>`;
const I={
 home:sv('<path d="M3.5 10.5 12 3.8l8.5 6.7V20a1 1 0 0 1-1 1h-5v-6h-5v6h-5a1 1 0 0 1-1-1z"/>'),
 dumbbell:sv('<path d="M3 9.5v5M6 7v10M18 7v10M21 9.5v5M6 12h12"/>'),
 user:sv('<circle cx="12" cy="8" r="4"/><path d="M4.5 21c.6-4 3.7-6 7.5-6s6.9 2 7.5 6"/>'),
 check:sv('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
 trophy:'<svg viewBox="0 0 24 24" class="f"><circle cx="12" cy="9" r="6"/><path d="M8.5 14l-1.5 7 5-2.5 5 2.5-1.5-7z"/></svg>',
 clock:sv('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
 plus:sv('<path d="M12 5v14M5 12h14"/>'),
 search:sv('<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 20 20"/>'),
 back:sv('<path d="M20 12H4M10 6l-6 6 6 6"/>'),
 chev:sv('<path d="M9 5l7 7-7 7"/>'),
 down:sv('<path d="M6 9l6 6 6-6"/>'),
 dots:'<svg viewBox="0 0 24 24" class="f"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>',
 note:sv('<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 3h6v3H9zM8.5 11h7M8.5 15h5"/>'),
 pencil:sv('<path d="M4 20l1-4L16 5l3 3L8 19zM14 7l3 3"/>'),
 upload:sv('<path d="M12 15V4M7.5 8.5 12 4l4.5 4.5M5 13v7h14v-7"/>'),
 gear:sv('<path d="M19.09 10.26 L21.46 10.38 L21.46 13.62 L19.09 13.74 L18.24 15.79 L19.84 17.54 L17.54 19.84 L15.79 18.24 L13.74 19.09 L13.62 21.46 L10.38 21.46 L10.26 19.09 L8.21 18.24 L6.46 19.84 L4.16 17.54 L5.76 15.79 L4.91 13.74 L2.54 13.62 L2.54 10.38 L4.91 10.26 L5.76 8.21 L4.16 6.46 L6.46 4.16 L8.21 5.76 L10.26 4.91 L10.38 2.54 L13.62 2.54 L13.74 4.91 L15.79 5.76 L17.54 4.16 L19.84 6.46 L18.24 8.21Z" stroke-linejoin="round"/><circle cx="12" cy="12" r="3"/>'),
 chart:sv('<path d="M3 20h18M5 16l5-5 3.5 3L20 7"/>'),
 person:sv('<circle cx="12" cy="4.5" r="2"/><path d="M5 8.5h14M12 8.5v6M9 21l3-6.5 3 6.5"/>'),
 cal:sv('<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 9.5h17M8 3v4M16 3v4M8 13h.01M12 13h.01M16 13h.01M8 17h.01M12 17h.01"/>'),
 like:sv('<path d="M7.5 10.5V20H4v-9.5zM7.5 10.5 11 3.5c1.8 0 2.7 1.2 2.3 3L12.8 9H19a1.5 1.5 0 0 1 1.5 1.8l-1.6 7.7A2 2 0 0 1 17 20H7.5"/>'),
 comment:sv('<path d="M12 4c4.7 0 8.5 3.2 8.5 7.2s-3.8 7.2-8.5 7.2c-1 0-2-.1-2.9-.4L4 20l1.4-4A6.8 6.8 0 0 1 3.5 11.2C3.5 7.2 7.3 4 12 4z"/>'),
 bars:sv('<rect x="5" y="12" width="3.5" height="8" rx="1"/><rect x="10.3" y="8" width="3.5" height="12" rx="1"/><rect x="15.6" y="4" width="3.5" height="16" rx="1"/>'),
 info:sv('<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.5h.01"/>'),
 download:sv('<path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 15v5h14v-5"/>'),
 trash:sv('<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>'),
 timer:sv('<circle cx="12" cy="13" r="8"/><path d="M12 9v4M9.5 2.5h5"/>'),
 scale:sv('<rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="M8 9a5 5 0 0 1 8 0l-3 3"/>'),
 flame:'<svg viewBox="0 0 24 24" class="f" style="color:#f4511e"><path d="M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 2-4.5 2-7 2 1 2.5 3 2.5 3S13 6 12 2z"/></svg>',
 moon:'<svg viewBox="0 0 24 24" class="f" style="color:#3d8af7"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/></svg>',
};

const plural=(n,w)=>`${n} ${n===1?w:w+'s'}`;
const initials=n=>(n||'?').trim().split(/\s+/).map(x=>x[0]).join('').slice(0,2).toUpperCase();
const thumb=e=>exThumb(e);
const avatar=(cls='')=>`<div class="avatar ${cls}">${db.photo?`<img src="${db.photo}" alt="">`:`<span>${esc((db.profileName||'?').trim()[0]?.toUpperCase()||'?')}</span>`}</div>`;
const glassGroup=btns=>`<div class="glass group">${btns.map(([a,ic,l,v])=>`<button class="gbtn" data-a="${a}" ${v?`data-v="${v}"`:''} aria-label="${l}">${ic}</button>`).join('')}</div>`;
const bigHeader=(t,right='')=>`<header class="hdr"><h1>${t}</h1>${right}</header>`;
const subHeader=(t,right='')=>`<header class="hdr sub"><button class="glass round" data-a="back" aria-label="Back">${I.back}</button><h2>${t}</h2>${right||'<span class="round-ph"></span>'}</header>`;
const ago=t=>{const d=Math.floor((Date.now()-t)/864e5);return d<1?'Today':d===1?'Yesterday':d<7?`${d} days ago`:new Date(t).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})};
function previousFor(exId){for(let i=db.workouts.length-1;i>=0;i--){const e=db.workouts[i].exercises.find(x=>x.exId===exId);if(e){const d=e.sets.filter(s=>s.done);if(d.length)return d}}return[]}
function bestWeight(exId,beforeIdx=db.workouts.length){let b=0;db.workouts.slice(0,beforeIdx).forEach(w=>w.exercises.filter(e=>e.exId===exId).forEach(e=>e.sets.filter(s=>s.done).forEach(s=>b=Math.max(b,+s.kg||0))));return b}

function feedCard(w){const more=w.exercises.length-3;
 return `<article class="post">
  <div class="post-head">${avatar()}<div><b>${esc(db.profileName)}</b><small>${ago(w.start)}</small></div><span class="spacer"></span><button class="icon" data-a="openShare" data-v="${w.id}" aria-label="More">${I.dots}</button></div>
  <h3>${esc(w.name)}</h3>
  <div class="stats"><div><small>Time</small><b>${fmtDur(w.duration)}</b></div><div><small>Volume</small><b>${vol(w).toLocaleString('en-GB')} kg</b></div><div><small>Records</small><b>${w.records?.length?`<span class="medal">${I.trophy}</span> ${w.records.length}`:'0'}</b></div></div>
  <div class="post-ex">${w.exercises.slice(0,3).map(e=>{const x=exById(e.exId);const n=e.sets.filter(s=>s.done).length;return `<div class="row">${thumb(x)}<span>${n} ${n===1?'set':'sets'} ${esc(x.name)}</span>${w.records?.includes(e.exId)?`<span class="medal">${I.trophy}</span>`:''}</div>`}).join('')}
  ${more>0?`<p class="see">See ${more} more ${more===1?'exercise':'exercises'}</p>`:''}</div>
  ${w.comment?`<p class="comment">${esc(w.comment)}</p>`:''}
  <div class="actions"><button class="icon ${w.liked?'liked':''}" data-a="like" data-v="${w.id}" aria-label="Like">${I.like}</button><button class="icon" data-a="comment" data-v="${w.id}" aria-label="Comment">${I.comment}</button><button class="icon" data-a="openShare" data-v="${w.id}" aria-label="Share">${I.upload}</button></div>
 </article>`}
function homeView(){const ws=[...db.workouts].reverse();
 return bigHeader('Home',glassGroup([['page',I.search,'Exercises','exercises'],['page',I.cal,'Calendar','calendar']]))+`<main class="scroll flush">
 ${ws.length?ws.map(feedCard).join('<div class="sep"></div>'):`<div class="empty">${I.dumbbell}<h2>No workouts yet</h2><p>Your finished workouts will appear here.</p><button class="btn primary" data-a="tab" data-v="workout">Start your first workout</button></div>`}
 </main>`}
function workoutTabView(){
 return bigHeader('Workout')+`<main class="scroll">
 <button class="btn grey wide left" data-a="startEmpty">${I.plus} Start Empty Workout</button>
 <div class="sec-row"><h3>Routines</h3></div>
 <div class="two"><button class="btn grey left" data-a="newRoutine">${I.note} New Routine</button><button class="btn grey left" data-a="page" data-v="exercises">${I.search} Explore</button></div>
 <p class="label">${I.down} My Routines (${db.routines.length})</p>
 ${db.routines.length?'':'<p class="muted">Create a routine to start a planned workout with one tap.</p>'}
 ${db.routines.map(r=>`<div class="routine"><div class="rt-head"><h3>${esc(r.name)}</h3><button class="icon" data-a="editRoutine" data-v="${r.id}" aria-label="Edit routine">${I.dots}</button></div>
   <p class="clamp">${r.exercises.map(e=>esc(exById(e.exId).name)).join(', ')||'No exercises'}</p>
   <button class="btn primary wide" data-a="startRoutine" data-v="${r.id}">Start Routine</button></div>`).join('')}
 </main>`}
// ---------- Profile ----------
function weekly(metric,n=12){const mon=new Date();mon.setHours(0,0,0,0);mon.setDate(mon.getDate()-((mon.getDay()+6)%7));const f={duration:w=>w.duration/3600,volume:vol,reps:w=>w.exercises.reduce((a,e)=>a+e.sets.filter(s=>s.done).reduce((b,s)=>b+(+s.reps||0),0),0)}[metric];
 const out=[];for(let i=n-1;i>=0;i--){const s=new Date(mon);s.setDate(s.getDate()-7*i);const e=new Date(s);e.setDate(e.getDate()+7);out.push({label:s.toLocaleDateString('en-GB',{day:'numeric',month:'short'}),v:db.workouts.filter(w=>w.start>=+s&&w.start<+e).reduce((a,w)=>a+f(w),0)})}return out}
function chartCard(){const m=ui.metric||'duration';const weeks=weekly(m);const max=Math.max(...weeks.map(w=>w.v));
 const unit={duration:'hours',volume:'kg',reps:'repetitions'}[m];const cur=weeks.at(-1).v;
 const body=max?`<div class="chart-top"><b>${m==='duration'?cur.toFixed(1):Math.round(cur).toLocaleString('en-GB')} ${unit}</b> <small>this week</small></div><svg class="chart" viewBox="0 0 330 150">${weeks.map((w,i)=>{const h=Math.round(w.v/max*110);return `<rect x="${i*27.5+5}" y="${125-h}" width="17" height="${h}" rx="3" class="${i===11?'cur':''}"/>${i%3===0?`<text x="${i*27.5+5}" y="143">${w.label}</text>`:''}`}).join('')}<line x1="0" x2="330" y1="125.5" y2="125.5"/></svg>`:`<div class="nodata">${I.bars}<p>No data in time period</p></div>`;
 return `<div class="range">Last 3 months ${I.down}</div><div class="chartcard">${body}</div>
 <div class="pills">${[['duration','Duration'],['volume','Volume'],['reps','Reps']].map(([k,l])=>`<button class="pill ${m===k?'on':''}" data-a="metric" data-v="${k}">${l}</button>`).join('')}</div>`}
function profileView(){const recs=db.workouts.reduce((a,w)=>a+(w.records?.length||0),0);
 return bigHeader(esc(db.profileName),glassGroup([['page',I.pencil,'Edit profile','editProfile'],['exportData',I.upload,'Export backup'],['page',I.gear,'Settings','settings']]))+`<main class="scroll">
 <div class="prof">${avatar('big')}<div class="prof-r"><b class="pname">${esc(db.profileName)}</b><div class="pstats"><div><small>Workouts</small><b>${db.workouts.length}</b></div><div><small>Records</small><b>${recs}</b></div><div><small>Routines</small><b>${db.routines.length}</b></div></div></div></div>
 ${db.bio?`<p class="bio">${esc(db.bio)}</p>`:''}
 ${chartCard()}
 <p class="label">Dashboard</p>
 <div class="two"><button class="btn grey left" data-a="page" data-v="statistics">${I.chart} Statistics</button><button class="btn grey left" data-a="page" data-v="exercises">${I.dumbbell} Exercises</button>
 <button class="btn grey left" data-a="page" data-v="measures">${I.person} Measures</button><button class="btn grey left" data-a="page" data-v="calendar">${I.cal} Calendar</button></div>
 <p class="label">Workouts</p></main>`.replace('</main>',`<div class="flush-in">${[...db.workouts].reverse().map(feedCard).join('<div class="sep"></div>')||'<p class="muted">No workouts yet.</p>'}</div></main>`)}
// ---------- Sub-pages ----------
const listRow=(a,v,ic,l,extra='')=>`<button class="lrow" data-a="${a}" ${v?`data-v="${v}"`:''}>${ic}<span>${l}</span>${extra}${I.chev}</button>`;
function settingsPage(){return subHeader('Settings')+`<main class="scroll flush grouped">
 <p class="ghead">Account</p><div class="glist">${listRow('page','editProfile',I.user,'Profile')}</div>
 <p class="ghead">Preferences</p><div class="glist">${listRow('defaultRest','',I.timer,'Default rest timer',`<em>${clock(db.defaultRest??90)}</em>`)}${listRow('page','measures',I.scale,'Measurements')}</div>
 <p class="ghead">Data</p><div class="glist">${listRow('exportData','',I.upload,'Export backup')}<label class="lrow">${I.download}<span>Import backup</span>${I.chev}<input type="file" id="importFile" accept="application/json,.json" hidden></label>${listRow('resetData','',I.trash,'Delete all data on this device')}</div>
 <p class="ghead">About</p><div class="glist">${listRow('about','',I.info,'About Repforge')}</div>
 <p class="foot">Your data is stored only on this device. Export a backup now and then, because iPhone can clear website data.</p></main>`}
function exercisesPage(){const q=(ui.search||'').toLowerCase();const list=EXERCISES.filter(e=>(ui.muscle==='All'||e.muscle===ui.muscle)&&(ui.equip==='All'||e.equipment===ui.equip)&&e.name.toLowerCase().includes(q));
 const picking=ui.view==='picker';
 return (picking?subHeader('Add Exercise'):subHeader('Exercises'))+`<div class="pad16"><div class="searchbox">${I.search}<input id="search" placeholder="Search exercise" value="${esc(ui.search||'')}"></div>
 <div class="two"><button class="btn grey sm2" data-a="cycleEquip">${ui.equip==='All'?'All Equipment':ui.equip}</button><button class="btn grey sm2" data-a="cycleMuscle">${ui.muscle==='All'?'All Muscles':ui.muscle}</button></div></div>
 <main class="scroll flush"><p class="label pad16">${picking?'All Exercises':'Exercises'} (${list.length})</p>${list.map(e=>`<button class="exrow" data-a="${picking?'pick':'noop'}" data-v="${e.id}">${thumb(e)}<div><b>${esc(e.name)} (${e.equipment})</b><small>${e.muscle}</small></div>${I.chev}</button>`).join('')||'<p class="muted pad16">No exercises match your search.</p>'}</main>`}
function measuresPage(){const m=[...(db.measures||[])].reverse();
 return subHeader('Measures')+`<main class="scroll">
 <div class="chartcard tight"><small class="muted">Latest bodyweight</small><b class="big">${m[0]?m[0].kg+' kg':'—'}</b></div>
 <div class="addm"><input id="bw" inputmode="decimal" placeholder="Bodyweight in kilograms"><button class="btn primary sm2" data-a="addMeasure">Add</button></div>
 <p class="label">History</p><div class="glist">${m.map((x,i)=>`<div class="lrow static"><span>${new Date(x.t).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})}</span><em>${x.kg} kg</em><button class="icon" data-a="delMeasure" data-v="${m.length-1-i}" aria-label="Delete">${I.trash}</button></div>`).join('')||'<p class="muted pad16">No measurements yet.</p>'}</div></main>`}
function calendarPage(){const days=new Set(db.workouts.map(w=>new Date(w.start).toDateString()));const today=new Date();today.setHours(0,0,0,0);
 // week streak: consecutive weeks (ending this or last week) with a workout
 const wk=d=>{const x=new Date(d);x.setHours(0,0,0,0);x.setDate(x.getDate()-((x.getDay()+6)%7));return +x};const weeks=new Set(db.workouts.map(w=>wk(w.start)));
 let streak=0,c=wk(today);if(!weeks.has(c))c-=7*864e5;while(weeks.has(c)){streak++;c-=7*864e5}
 const first=db.workouts.length?new Date(Math.min(...db.workouts.map(w=>w.start))):today;const f0=new Date(first);f0.setHours(0,0,0,0);
 const rest=Math.round((today-f0)/864e5)+1-days.size;
 const months=[];for(let i=2;i>=0;i--)months.push(new Date(today.getFullYear(),today.getMonth()-i,1));
 const grid=m=>{const n=new Date(m.getFullYear(),m.getMonth()+1,0).getDate();const off=(m.getDay()+6)%7;let h='';for(let i=0;i<off;i++)h+='<span></span>';for(let d=1;d<=n;d++){const dt=new Date(m.getFullYear(),m.getMonth(),d);h+=`<span class="${days.has(dt.toDateString())?'wd':''} ${+dt===+today?'today':''}">${d}</span>`}return h};
 return subHeader('Calendar')+`<div class="streak"><div>${I.flame} ${streak} week streak</div><div>${I.moon} ${Math.max(0,rest)} rest days</div></div>
 <div class="dow">${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=>`<span>${d}</span>`).join('')}</div>
 <main class="scroll flush">${months.map(m=>`<h3 class="mhead">${m.toLocaleDateString('en-GB',{month:'long',year:'numeric'})}</h3><div class="mgrid">${grid(m)}</div>`).join('')}</main>`}
function editProfilePage(){return subHeader('Edit Profile',`<button class="glass pillbtn" data-a="saveProfile">Done</button>`)+`<main class="scroll">
 <div class="center-av">${avatar('big')}<label class="blue linkbtn">Change Picture<input type="file" id="photoFile" accept="image/*" class="vh"></label>${db.photo?'<button class="link danger" data-a="removePhoto">Remove Picture</button>':''}</div>
 <p class="ghead">Public profile data</p><div class="glist form"><label class="lrow static"><span>Name</span><input id="pname" value="${esc(db.profileName)}"></label><label class="lrow static"><span>Bio</span><input id="pbio" placeholder="Describe yourself" value="${esc(db.bio||'')}"></label></div></main>`}
function statisticsPage(){const since=Date.now()-7*864e5;const last=db.workouts.filter(w=>w.start>=since);const mus={};db.workouts.forEach(w=>w.exercises.forEach(e=>{const m=exById(e.exId).muscle;mus[m]=(mus[m]||0)+e.sets.filter(s=>s.done).length}));const tot=Object.values(mus).reduce((a,b)=>a+b,0)||1;
 return subHeader('Statistics')+`<main class="scroll"><p class="label">Last 7 days</p><div class="two"><div class="tile"><small>Workouts</small><b>${last.length}</b></div><div class="tile"><small>Duration</small><b>${fmtDur(last.reduce((a,w)=>a+w.duration,0))}</b></div><div class="tile"><small>Volume</small><b>${last.reduce((a,w)=>a+vol(w),0).toLocaleString('en-GB')} kg</b></div><div class="tile"><small>Sets</small><b>${last.reduce((a,w)=>a+sets(w),0)}</b></div></div>
 <p class="label">Set count by muscle (all time)</p>${Object.entries(mus).sort((a,b)=>b[1]-a[1]).map(([m,n])=>`<div class="mbar"><span>${m}</span><div><i style="width:${n/tot*100}%"></i></div><em>${n}</em></div>`).join('')||'<p class="muted">No data yet.</p>'}</main>`}
const PAGES={settings:settingsPage,exercises:exercisesPage,measures:measuresPage,calendar:calendarPage,editProfile:editProfilePage,statistics:statisticsPage};

// ---------- Active workout ----------
function activeView(){
 const w=db.active;const el=(Date.now()-w.start)/1000;
 return `<div class="sheet"><header class="top bar"><button class="glass round" data-a="minimise" aria-label="Minimise">${I.down}</button><h2>Log Workout</h2><span class="spacer"></span><button class="btn primary sm" data-a="finish">Finish</button></header>
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
 return `<div class="restbar glass"><div class="fill" style="width:${pct}%"></div><button class="btn dark sm" data-a="rest" data-v="-15">−15</button><b id="restclock">${clock(left)}</b><button class="btn dark sm" data-a="rest" data-v="15">+15</button><button class="btn primary sm" data-a="skipRest">Skip</button></div>`}
function pickerView(){return exercisesPage()}
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
 ${w.exercises.map(e=>`<div class="row">${thumb(exById(e.exId))}<span>${plural(e.sets.filter(s=>s.done).length,'set')} ${esc(exById(e.exId).name)}</span></div>`).join('')}</div>
 <button class="btn dark wide" data-a="openShare" data-v="${w.id}">Share with a photo or video</button><button class="btn primary wide" data-a="doneSummary">Done</button></main></div>`}

function render(){
 const v=ui.view;let body;
 if(v==='active')body=activeView();else if(v==='picker')body=pickerView();else if(v==='routine')body=routineView();else if(v==='summary')body=summaryView();else if(v==='share')body=shareView();
 else{const pg=ui.pages.at(-1);body=(pg?PAGES[pg]():ui.tab==='home'?homeView():ui.tab==='workout'?workoutTabView():profileView())+
  (db.active?`<div class="mini glass" data-a="openActive">${I.clock}<span>Workout in progress</span><b class="blue">${fmtDur((Date.now()-db.active.start)/1000)}</b></div>`:'')+
  `<nav class="tabs glass">${[['home','Home',I.home],['workout','Workout',I.dumbbell],['profile','Profile',I.user]].map(([k,l,ic])=>`<button class="${ui.tab===k?'on':''}" data-a="tab" data-v="${k}">${ic}<span>${l}</span></button>`).join('')}</nav>`}
 $('#app').innerHTML=body;
 if(v==='share')paint();
}
function newWorkout(name,exercises=[]){db.active={name,start:Date.now(),exercises};save();ui.view='active';render()}
const A={
 tab:v=>{ui.tab=v;ui.view=null;ui.pages=[]},
 page:v=>{ui.pages.push(v);ui.search='';ui.muscle='All';ui.equip='All'},
 back:()=>{if(ui.view==='picker')return A.closePicker();ui.pages.pop()},
 metric:v=>{ui.metric=v},noop:()=>{},
 cycleMuscle:()=>{const m=['All',...new Set(EXERCISES.map(e=>e.muscle))];ui.muscle=m[(m.indexOf(ui.muscle)+1)%m.length]},
 cycleEquip:()=>{const m=['All',...new Set(EXERCISES.map(e=>e.equipment))];ui.equip=m[(m.indexOf(ui.equip)+1)%m.length]},
 like:id=>{const w=db.workouts.find(x=>x.id===id);w.liked=!w.liked;save()},
 comment:async id=>{const w=db.workouts.find(x=>x.id===id);const c=await promptBox('Add a comment',w.comment||'','Write a comment');if(c!==null){w.comment=c;save()}},
 defaultRest:()=>{const o=[0,30,60,90,120,180];db.defaultRest=o[(o.indexOf(db.defaultRest??90)+1)%o.length];save()},
 about:()=>alertBox('Repforge','Version 1. Your own workout tracker. All data stays on this device.'),
 addMeasure:()=>{const v=parseFloat($('#bw').value.replace(',','.'));if(!(v>0))return alertBox('Bodyweight needed','Enter your bodyweight in kilograms.');(db.measures??=[]).push({t:Date.now(),kg:v});save()},
 delMeasure:i=>{db.measures.splice(+i,1);save()},
 removePhoto:()=>{keepProfileFields();delete db.photo;save();render()},
 saveProfile:()=>{db.profileName=$('#pname').value.trim()||'Athlete';db.bio=$('#pbio').value.trim();save();ui.pages.pop()},
 startEmpty:()=>newWorkout(timeName()),
 startRoutine:id=>{const r=db.routines.find(x=>x.id===id);newWorkout(r.name,r.exercises.map(e=>({exId:e.exId,rest:90,sets:Array.from({length:e.sets},()=>({kg:'',reps:'',done:false}))})))},
 openActive:()=>{ui.view='active'},minimise:()=>{ui.view=null},
 addEx:()=>{ui.picker='workout';ui.view='picker';ui.search='';ui.muscle='All';ui.equip='All'},
 closePicker:()=>{ui.view=ui.picker==='workout'?'active':'routine'},
 muscle:v=>{ui.muscle=v},
 pick:id=>{if(ui.picker==='workout'){db.active.exercises.push({exId:id,rest:db.defaultRest??90,sets:[{kg:'',reps:'',done:false}]});save();ui.view='active'}else{ui.routineDraft.exercises.push({exId:id,sets:3});ui.view='routine'}},
 addSet:i=>{const e=db.active.exercises[i];const l=e.sets.at(-1);e.sets.push({kg:l?.kg||'',reps:l?.reps||'',done:false});save()},
 removeEx:async i=>{if(await sheetBox(null,'Remove this exercise from the workout?','Remove Exercise')){db.active.exercises.splice(+i,1);save()}},
 restChange:i=>{const e=db.active.exercises[i];const opts=[0,30,60,90,120,180];e.rest=opts[(opts.indexOf(e.rest??90)+1)%opts.length];save()},
 tick:v=>{const[ei,si]=v.split('-').map(Number);const e=db.active.exercises[ei],s=e.sets[si];
  if(!s.done){const p=previousFor(e.exId)[si];if(s.kg===''&&p)s.kg=p.kg;if(s.reps===''&&p)s.reps=p.reps;if(s.kg==='')s.kg='0';if(s.reps==='')s.reps='0'}
  s.done=!s.done;save();if(s.done&&(e.rest??90)>0){const t=e.rest??90;ui.rest={end:Date.now()+t*1000,total:t}}},
 rest:d=>{ui.rest.end+=d*1000;ui.rest.total=Math.max(ui.rest.total,(ui.rest.end-Date.now())/1000)},skipRest:()=>{ui.rest=null},
 settings:async()=>{const n=(await promptBox('Workout title',db.active.name,'Workout title'))?.trim();if(n){db.active.name=n;save()}},
 discard:async()=>{if(await sheetBox(null,'Are you sure you want to discard this workout? It will not be saved.','Discard Workout')){db.active=null;ui.rest=null;save();ui.view=null}},
 finish:()=>{const w=db.active;w.exercises.forEach(e=>e.sets=e.sets.filter(s=>s.done));w.exercises=w.exercises.filter(e=>e.sets.length);
  if(!w.exercises.length){alertBox('No completed sets','Tick at least one set before finishing.');return}
  w.duration=Math.round((Date.now()-w.start)/1000);w.id='w'+Date.now();
  w.records=w.exercises.filter(e=>{const b=bestWeight(e.exId);return b>0&&Math.max(...e.sets.map(s=>+s.kg||0))>b}).map(e=>e.exId);
  db.workouts.push(w);db.active=null;ui.rest=null;save();ui.summary=w;ui.view='summary'},
 exportData:()=>{const b=new Blob([JSON.stringify({app:'repforge',version:1,exported:new Date().toISOString(),data:db},null,2)],{type:'application/json'});download(b,`repforge-backup-${new Date().toISOString().slice(0,10)}.json`)},
 doneSummary:()=>{ui.view=null;ui.tab='home';ui.pages=[]},
 newRoutine:()=>{ui.routineDraft={id:'r'+Date.now(),name:'',exercises:[],isNew:true};ui.view='routine'},
 editRoutine:id=>{ui.routineDraft={...structuredClone(db.routines.find(r=>r.id===id)),isNew:false};ui.view='routine'},
 cancelRoutine:()=>{ui.view=null},
 rAdd:()=>{ui.routineDraft.name=$('#rname').value;ui.picker='routine';ui.view='picker';ui.search='';ui.muscle='All';ui.equip='All'},
 rRemove:i=>{ui.routineDraft.exercises.splice(+i,1)},
 rSets:v=>{const[i,d]=v.split('|').map(Number);const e=ui.routineDraft.exercises[i];e.sets=Math.max(1,e.sets+d)},
 saveRoutine:()=>{const r=ui.routineDraft;r.name=$('#rname').value.trim()||'Untitled routine';const{isNew,...clean}=r;const i=db.routines.findIndex(x=>x.id===r.id);if(i>=0)db.routines[i]=clean;else db.routines.push(clean);save();ui.view=null;ui.tab='workout';ui.pages=[]},
 rDelete:async()=>{if(await sheetBox(null,'Delete this routine? This cannot be undone.','Delete Routine')){db.routines=db.routines.filter(x=>x.id!==ui.routineDraft.id);save();ui.view=null}},
 resetData:async()=>{if(await confirmBox('Delete all data?','Every workout, routine and measurement on this device will be deleted. Export a backup first if you want to keep them.','Delete',true)){localStorage.removeItem(KEY);location.reload()}},
};
function timeName(){const h=new Date().getHours();return h<12?'Morning workout':h<18?'Afternoon workout':'Evening workout'}
document.addEventListener('click',ev=>{const b=ev.target.closest('[data-a]');if(!b)return;const f=A[b.dataset.a];if(!f)return;const r=f(b.dataset.v);render();if(r?.then)r.then(render)});
function keepProfileFields(){const n=$('#pname'),b=$('#pbio');if(n)db.profileName=n.value.trim()||db.profileName;if(b)db.bio=b.value.trim()}
function resizePhoto(file){return new Promise((ok,no)=>{const u=URL.createObjectURL(file);const im=new Image();im.onload=()=>{const S=400,s=Math.min(im.naturalWidth,im.naturalHeight);const c=document.createElement('canvas');c.width=c.height=S;c.getContext('2d').drawImage(im,(im.naturalWidth-s)/2,(im.naturalHeight-s)/2,s,s,0,0,S,S);URL.revokeObjectURL(u);ok(c.toDataURL('image/jpeg',.85))};im.onerror=()=>{URL.revokeObjectURL(u);no()};im.src=u})}
document.addEventListener('change',async ev=>{const t=ev.target;
 if(t.id==='photoFile'&&t.files[0]){try{keepProfileFields();db.photo=await resizePhoto(t.files[0]);save();render()}catch(e){alertBox('Picture not read','That picture could not be read. Please try a different photo.')}return}
 if(t.id==='importFile'&&t.files[0]){try{const j=JSON.parse(await t.files[0].text());const d=j.data||j;if(!Array.isArray(d.workouts))throw 0;if(!await confirmBox('Import backup?',`Replace the data on this device with the backup (${d.workouts.length} workouts, ${(d.routines||[]).length} routines)?`,'Replace',true))return;localStorage.setItem(KEY,JSON.stringify(d));location.reload()}catch{alertBox('Backup not imported','That file is not a valid Repforge backup.')}}
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
if('serviceWorker' in navigator&&location.protocol!=='file:')navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).then(r=>{r.update();document.addEventListener('visibilitychange',()=>{if(!document.hidden)r.update()})});
if('serviceWorker' in navigator&&navigator.serviceWorker.controller){let done=false;navigator.serviceWorker.addEventListener('controllerchange',()=>{if(!done){done=true;location.reload()}})}

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
 if(!saveOnly&&navigator.canShare?.({files:[file]})){await navigator.share({files:[file],title:ui.share.name})}else download(blob,name)}catch(e){if(e.name!=='AbortError')alertBox('Could not share',e.message)}}
const SHARE={
 openShare:id=>{ui.share=db.workouts.find(w=>w.id===id);Object.assign(shareState,{media:null,isVideo:false,busy:''});ui.backFrom=ui.view;ui.view='share';setTimeout(paint)},
 closeShare:()=>{ui.view=ui.backFrom==='summary'?'summary':null},
 layout:v=>{shareState.layout=v;setTimeout(paint)},sticker:()=>{shareState.sticker=!shareState.sticker;setTimeout(paint)},
 doShare:()=>{shareOut(false)},doSave:()=>{shareOut(true)},
};
Object.assign(A,SHARE);
