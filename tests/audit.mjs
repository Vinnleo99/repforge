// WebKit layout audit: icon geometry, text overflow, off-centre circles
import {webkit} from 'playwright';import {spawn} from 'child_process';
const srv=spawn('npx',['vite','preview','--port','4174','--strictPort'],{stdio:'ignore'});await new Promise(r=>setTimeout(r,2500));
const b=await webkit.launch();const p=await (await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2})).newPage();
await p.goto('http://localhost:4174/');
await p.evaluate(()=>{localStorage.setItem('repforge-data-v1',JSON.stringify({profileName:'Victricius',routines:[],workouts:[{id:'a',name:'Afternoon workout',start:Date.now()-4e6,duration:3600,exercises:[{exId:'bench',sets:[{kg:60,reps:8,done:true}]}],records:[]}],active:null}))});await p.reload();
const check=()=>p.evaluate(()=>{const out=[];
 document.querySelectorAll('svg').forEach(s=>{const r=s.getBoundingClientRect();if(!r.width)return;let bb;try{bb=s.getBBox()}catch(e){}const vb=s.viewBox.baseVal;if(!bb||bb.width<2||bb.height<2)out.push('empty svg '+s.outerHTML.slice(0,60));else if(vb&&vb.width&&(bb.x<-.5||bb.y<-.5||bb.x+bb.width>vb.width+.5||bb.y+bb.height>vb.height+.5))out.push('svg outside viewBox '+s.outerHTML.slice(0,80))});
 document.querySelectorAll('body *').forEach(e=>{if(!e.childElementCount&&e.textContent.trim()&&e.scrollWidth>e.clientWidth+1&&getComputedStyle(e).overflow!=='visible')out.push('clipped text: '+e.textContent.trim().slice(0,40))});
 document.querySelectorAll('.avatar,.thumb,.round').forEach(e=>{const r=e.getBoundingClientRect();if(Math.abs(r.width-r.height)>.5)out.push('not round: '+e.className+' '+r.width+'x'+r.height)});
 return out});
const res={};const visit=async(n)=>{res[n]=await check()};
await visit('home');await p.click('nav >> text=Workout');await visit('workout');await p.click('nav >> text=Profile');await visit('profile');
for(const pg of ['settings','exercises','measures','calendar','editProfile','statistics']){await p.click(`[data-a=page][data-v=${pg}]`);await visit(pg);await p.click('[data-a=back]')}
await p.click('nav >> text=Workout');await p.click('text=Start Empty Workout');await visit('active');
console.log(JSON.stringify(res,null,1));await b.close();srv.kill();
