// Share card renderer: draws an original stats overlay on a photo, a video, or a transparent sticker.
const W=1080,H=1350;
export function stats(w,exName){
 let heavy=null;const top=[];
 w.exercises.forEach(e=>{let best=null;e.sets.filter(s=>s.done).forEach(s=>{const kg=+s.kg||0,r=+s.reps||0;if(!best||kg*r>best.kg*best.reps)best={kg,reps:r};if(!heavy||kg>heavy.kg)heavy={kg,reps:r,name:exName(e.exId)}});if(best)top.push({name:exName(e.exId),...best,v:best.kg*best.reps})});
 top.sort((a,b)=>b.v-a.v);return{heavy,top:top.slice(0,3)};
}
function fit(ctx,img,iw,ih){const s=Math.max(W/iw,H/ih);ctx.drawImage(img,(W-iw*s)/2,(H-ih*s)/2,iw*s,ih*s)}
function rr(ctx,x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r)}
function mark(ctx,x,y,s=1){ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.fillStyle='#2F8CFF';[[0,14,10,24],[12,6,8,40],[36,6,8,40],[46,14,10,24],[20,23,16,6]].forEach(r=>ctx.fillRect(...r));ctx.fillStyle='#fff';ctx.font='700 30px system-ui,sans-serif';ctx.textBaseline='middle';ctx.fillText('REPFORGE',68,26);ctx.restore()}
export function draw(ctx,o){ // o:{media,mw,mh,layout,sticker,w,d}
 const{layout,sticker,d}=o;ctx.clearRect(0,0,W,H);
 if(!sticker){if(o.media)fit(ctx,o.media,o.mw,o.mh);else{ctx.fillStyle='#1c1f26';ctx.fillRect(0,0,W,H)}}
 const F=(wt,sz)=>ctx.font=`${wt} ${sz}px system-ui,-apple-system,sans-serif`;
 ctx.textBaseline='alphabetic';ctx.shadowColor=sticker?'rgba(0,0,0,.6)':'transparent';ctx.shadowBlur=sticker?12:0;
 const items=[['Duration',d.duration],['Volume',d.volume],['Sets',String(d.sets)]];
 if(layout==='panel'){
  if(!sticker){const g=ctx.createLinearGradient(0,H*0.45,0,H);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.85)');ctx.fillStyle=g;ctx.fillRect(0,H*0.45,W,H*0.55)}
  ctx.fillStyle='#fff';F(800,72);ctx.fillText(d.name,64,H-520);F(500,34);ctx.fillStyle='#cfd6e4';ctx.fillText(d.date,64,H-468);
  items.forEach(([k,v],i)=>{const x=64+i*330;F(500,30);ctx.fillStyle='#9fb0c8';ctx.fillText(k,x,H-390);F(800,58);ctx.fillStyle='#fff';ctx.fillText(v,x,H-330)});
  ctx.fillStyle='#2F8CFF';ctx.fillRect(64,H-295,W-128,4);
  F(600,32);d.top.forEach((t,i)=>{ctx.fillStyle='#fff';ctx.fillText(t.name,64,H-235+i*52);ctx.fillStyle='#9fb0c8';const s=`${t.kg} kg × ${t.reps}`;ctx.fillText(s,W-64-ctx.measureText(s).width,H-235+i*52)});
  if(d.heavy){F(600,28);ctx.fillStyle='#2F8CFF';ctx.fillText(`Heaviest set: ${d.heavy.name} ${d.heavy.kg} kg × ${d.heavy.reps}`,64,H-60)}
  mark(ctx,W-300,40);
 }else if(layout==='card'){
  ctx.shadowBlur=0;ctx.fillStyle='rgba(18,20,26,.82)';rr(ctx,90,330,W-180,700,40);ctx.fill();ctx.fillStyle='#2F8CFF';rr(ctx,90,330,W-180,12,6);ctx.fill();
  ctx.textAlign='center';ctx.fillStyle='#fff';F(800,64);ctx.fillText(d.name,W/2,450);F(500,30);ctx.fillStyle='#9fb0c8';ctx.fillText(d.date,W/2,500);
  items.forEach(([k,v],i)=>{const x=W/2+(i-1)*280;F(800,54);ctx.fillStyle='#fff';ctx.fillText(v,x,610);F(500,28);ctx.fillStyle='#9fb0c8';ctx.fillText(k,x,650)});
  F(600,32);d.top.forEach((t,i)=>{ctx.fillStyle='#fff';ctx.fillText(`${t.name}  ·  ${t.kg} kg × ${t.reps}`,W/2,750+i*56)});
  if(d.heavy){F(700,30);ctx.fillStyle='#2F8CFF';ctx.fillText(`Heaviest: ${d.heavy.kg} kg`,W/2,960)}
  ctx.textAlign='left';mark(ctx,W/2-130,1060);
 }else{ // minimal stacked numbers, top-left
  ctx.fillStyle='#fff';const rows=[['Workout',d.name],...items,...(d.heavy?[['Heaviest set',`${d.heavy.kg} kg × ${d.heavy.reps}`]]:[])];
  rows.forEach(([k,v],i)=>{F(500,30);ctx.fillStyle='rgba(255,255,255,.8)';ctx.fillText(k,70,130+i*150);F(800,64);ctx.fillStyle='#fff';ctx.fillText(v,70,195+i*150)});
  mark(ctx,70,H-110);
 }
 ctx.shadowBlur=0;
}
export const SIZE={W,H};
export async function recordVideo(video,canvas,drawFrame,onProgress){
 const types=['video/mp4;codecs=avc1','video/mp4','video/webm;codecs=vp9','video/webm'];
 const mime=types.find(t=>window.MediaRecorder&&MediaRecorder.isTypeSupported(t));
 if(!mime||!canvas.captureStream)throw new Error('This browser cannot record video from the canvas.');
 const stream=canvas.captureStream(30);
 try{const vs=video.captureStream?.()||video.mozCaptureStream?.();vs?.getAudioTracks().forEach(t=>stream.addTrack(t))}catch{}
 const rec=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:6e6});const chunks=[];rec.ondataavailable=e=>e.data.size&&chunks.push(e.data);
 const done=new Promise(r=>rec.onstop=r);video.currentTime=0;video.muted=false;await video.play().catch(()=>{video.muted=true;return video.play()});rec.start(250);
 await new Promise(res=>{const step=()=>{drawFrame();onProgress?.(video.currentTime/(video.duration||1));if(video.ended||video.currentTime>=Math.min(video.duration,60)){res();return}requestAnimationFrame(step)};step()});
 video.pause();rec.stop();await done;return new Blob(chunks,{type:mime.split(';')[0]});
}
