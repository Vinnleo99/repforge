import {chromium,webkit} from 'playwright';import {spawn} from 'child_process';import assert from 'assert';import fs from 'fs';
const srv=spawn('npx',['vite','preview','--port','4173','--strictPort'],{stdio:'ignore'});await new Promise(r=>setTimeout(r,2500));
const WK=process.env.BROWSER==='webkit';const OUT=process.env.OUT||'screenshots';fs.mkdirSync(OUT,{recursive:true});
const b=WK?await webkit.launch():await chromium.launch({executablePath:'/usr/bin/google-chrome'});
const ctx=await b.newContext({colorScheme:process.env.SCHEME||'light',viewport:{width:390,height:844},deviceScaleFactor:2,acceptDownloads:true});
const p=await ctx.newPage();p.on('dialog',d=>d.accept());const errs=[];p.on('pageerror',e=>errs.push(e.message));
const shot=n=>p.screenshot({path:`${OUT}/${n}.png`});
try{
await p.goto('http://localhost:4173/');
async function workout(kg,ss){await p.click('nav >> text=Workout');await p.click('text=Start Empty Workout');
 await p.click('text=Add exercise');await p.fill('#search','bench');await p.click('.exrow >> text=Bench Press');
 for(let i=0;i<ss;i++){if(i)await p.click('text=Add set');await p.fill(`[data-f=kg][data-i="0-${i}"]`,String(kg));await p.fill(`[data-f=reps][data-i="0-${i}"]`,'8');await p.click(`.tick[data-v="0-${i}"]`)}}
await shot('01-home-empty');
await workout(60,2);await p.click('text=Finish');await p.click('[data-a=doneSummary]');
await p.click('nav >> text=Workout');await p.click('text=New routine');await p.fill('#rname','Push day');await p.click('text=Add exercise');
await p.click('.exrow >> text=Overhead Press');await p.click('text=Add exercise');await p.click('.exrow >> text=Lateral Raise');await shot('06-routine-editor');await p.click('text=Save');
await shot('02-workout-tab');
await workout(70,3);await p.click('text=Add exercise');await shot('04-exercise-picker');await p.fill('#search','goblet');await p.click('.exrow >> text=Goblet Squat');
await p.fill('[data-f=kg][data-i="1-0"]','24');await p.fill('[data-f=reps][data-i="1-0"]','12');await p.click('.tick[data-v="1-0"]');
assert(await p.isVisible('.restbar'),'rest timer should be visible');await shot('03-active-workout');
await p.click('text=Finish');assert(await p.isVisible('text=Well done!'));assert(await p.isVisible('text=Personal records'),'PR expected');await shot('05-finish-summary');
await p.click('text=Share with a photo or video');
const q=await ctx.newPage();await q.setViewportSize({width:900,height:1200});await q.setContent('<body style="margin:0;height:1200px;background:linear-gradient(160deg,#4a6b8a,#1d2a38 60%,#0c1117)"><div style="position:absolute;left:300px;top:380px;width:300px;height:500px;border-radius:150px 150px 40px 40px;background:#22303e"></div></body>');const photo=await q.screenshot({type:'jpeg'});await q.close();
await p.setInputFiles('input[accept="image/*,video/*"]',{name:'gym.jpg',mimeType:'image/jpeg',buffer:photo});await p.waitForTimeout(600);await shot('08-share-panel');
await p.click('text=Centre card');await p.waitForTimeout(200);await shot('09-share-card');
await p.click('text=Transparent sticker');await p.waitForTimeout(200);await shot('10-share-sticker');
const dl=p.waitForEvent('download');await p.click('text=Save to device');const d=await dl;assert(d.suggestedFilename().endsWith('.png'));
await p.click('text=Close');await p.click('[data-a=doneSummary]');
assert.equal(await p.locator('.post').count(),2,'two workouts in history');assert(await p.isVisible('.post .medal, .post >> text=record'));await shot('00-home-history');
await p.click('nav >> text=Profile');await shot('07-profile');
for(const [pg,n] of [['exercises','11-exercises'],['settings','12-settings'],['calendar','13-calendar'],['measures','14-measures'],['statistics','15-statistics'],['editProfile','16-edit-profile']]){await p.click(`[data-a=page][data-v=${pg}]`);if(pg==='measures'){await p.fill('#bw','78.5');await p.click('text=Add')}await shot(n);await p.click('[data-a=back]')}
await p.click('[data-a=metric][data-v=volume]');await p.evaluate(()=>document.querySelector('.scroll').scrollTop=0);await shot('07-profile');
{const cen=await p.evaluate(()=>[...document.querySelectorAll('.avatar span')].map(s=>{const a=s.parentElement.getBoundingClientRect(),r=document.createRange();r.selectNodeContents(s);const b=r.getBoundingClientRect();return Math.max(Math.abs((a.left+a.width/2)-(b.left+b.width/2)),Math.abs((a.top+a.height/2)-(b.top+b.height/2)))}));console.log('avatar letter offset px',cen);assert(cen.length&&cen.every(x=>x<3))}
await p.click('[data-a=page][data-v=editProfile]');await shot('17-edit-profile-initial');await p.setInputFiles('#photoFile','tests/photo.png');await p.waitForSelector('.avatar img');
const sz=await p.evaluate(()=>new Promise(r=>{const i=new Image();i.onload=()=>r([i.width,i.height,JSON.parse(localStorage.getItem('repforge-data-v1')).photo.length]);i.src=document.querySelector('.avatar img').src}));console.log('photo',sz);assert(sz[0]===400&&sz[1]===400);
await shot('18-edit-profile-photo');await p.click('[data-a=back]');await shot('19-profile-photo');
const dl2=p.waitForEvent('download');await p.click('header [data-a=exportData]');const bk=await dl2;
{const j=JSON.parse(fs.readFileSync(await bk.path(),'utf8'));assert.equal(j.data.workouts.length,2);assert(j.data.photo.startsWith('data:image/jpeg'))}
await p.click('nav >> text=Workout');await p.click('text=Start Empty Workout');await p.click('[data-a=settings]');await p.waitForSelector('#dlg-in');await p.waitForTimeout(400);await shot('20-alert-title');await p.fill('#dlg-in','Leg day');await p.click('#dlg >> text=Save');assert.equal(await p.locator('#dlg.open').count(),0);
await p.click('[data-a=discard]');await p.waitForSelector('.asheet');await p.waitForTimeout(400);await shot('21-sheet-discard');await p.click('#dlg >> text=Discard Workout');assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('repforge-data-v1')).active),null);
await p.click('nav >> text=Profile');await p.click('[data-a=page][data-v=settings]');await p.click('text=Delete all data');await p.waitForSelector('.alert');await p.waitForTimeout(400);await shot('22-alert-delete');await p.click('#dlg >> text=Cancel');await p.click('[data-a=back]');
const vres=WK?-1:await p.evaluate(async()=>{const c=document.createElement('canvas');c.width=320;c.height=240;const g=c.getContext('2d');const r=new MediaRecorder(c.captureStream(30),{mimeType:'video/webm'});const ch=[];r.ondataavailable=e=>ch.push(e.data);r.start();for(let i=0;i<45;i++){g.fillStyle=`hsl(${i*8},60%,40%)`;g.fillRect(0,0,320,240);await new Promise(q=>setTimeout(q,33))}r.stop();await new Promise(q=>r.onstop=q);return new Blob(ch).size});
assert(WK||vres>0);console.log('All checks passed. Video smoke bytes:',vres,'Page errors:',errs);
}catch(e){await shot("zz-fail");throw e}finally{await b.close();srv.kill()}
process.exit(errs.length?1:0);
