// iOS-style alerts and action sheets, rendered in the app's own design.
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let root;
function show({title,message,actions,input,sheet}){
 return new Promise(done=>{
  root??=Object.assign(document.body.appendChild(document.createElement('div')),{id:'dlg'});
  const prev=document.activeElement;
  root.innerHTML=`<div class="dlg-scrim"></div><div class="${sheet?'asheet':'alert'}" role="alertdialog" aria-modal="true" aria-labelledby="dlg-t">
   <div class="dlg-body glass-solid">${title?`<h3 id="dlg-t">${esc(title)}</h3>`:''}${message?`<p>${esc(message)}</p>`:''}${input?`<input id="dlg-in" value="${esc(input.value)}" placeholder="${esc(input.placeholder||'')}" autocomplete="off">`:''}
   ${sheet?'':`<div class="dlg-acts ${actions.length>2?'col':''}">${actions.map((a,i)=>`<button data-i="${i}" class="${a.style||''}">${esc(a.label)}</button>`).join('')}</div>`}</div>
   ${sheet?`<div class="dlg-body glass-solid acts">${actions.filter(a=>a.style!=='cancel').map(a=>`<button data-i="${actions.indexOf(a)}" class="${a.style||''}">${esc(a.label)}</button>`).join('')}</div>${actions.filter(a=>a.style==='cancel').map(a=>`<button data-i="${actions.indexOf(a)}" class="dlg-body glass-solid cancel">${esc(a.label)}</button>`).join('')}`:''}</div>`;
  root.className='open';
  const inp=root.querySelector('#dlg-in');if(inp){inp.focus();inp.select()}else root.querySelector('button:not(.cancel)')?.focus();
  const close=v=>{root.className='';root.innerHTML='';root.onclick=root.onkeydown=null;prev?.focus?.();done(v)};
  root.onclick=e=>{const b=e.target.closest('button[data-i]');if(b){const a=actions[+b.dataset.i];close(a.style==='cancel'?(input?null:false):(input?inp.value:a.value??true))}else if(e.target.classList.contains('dlg-scrim')&&sheet)close(input?null:false)};
  root.onkeydown=e=>{if(e.key==='Escape')close(input?null:false);if(e.key==='Enter'&&inp)close(inp.value)};
 })}
export const alertBox=(title,message)=>show({title,message,actions:[{label:'OK',style:'bold'}]});
export const confirmBox=(title,message,ok='OK',destructive=false)=>show({title,message,actions:[{label:'Cancel',style:'cancel'},{label:ok,style:destructive?'danger bold':'bold'}]});
export const promptBox=(title,value='',placeholder='')=>show({title,input:{value,placeholder},actions:[{label:'Cancel',style:'cancel'},{label:'Save',style:'bold'}]});
export const sheetBox=(title,message,ok,destructive=true)=>show({title,message,sheet:true,actions:[{label:ok,style:destructive?'danger':''},{label:'Cancel',style:'cancel'}]});
