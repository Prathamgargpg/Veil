// VEIL UI extras: decorates the table after each redraw, tilts cards under the pointer and shows a turn timer on the waiting player.
(()=>{
 const root=document.getElementById('game'),cfg={childList:true,subtree:true};let q=0;
 const kind=t=>/Challenge/.test(t)?'danger':/Blade/.test(t)?'atk':/Block \(/.test(t)?'shield':/Tithe|Let it pass|Accept block/.test(t)?'safe':'';
 function deco(){
  root.querySelectorAll('#act button').forEach(b=>{const k=kind(b.textContent);if(k)b.classList.add(k)});
  root.querySelectorAll('.pc').forEach(p=>{const n=p.querySelector('b');if(n&&!p.querySelector('.av')){const a=document.createElement('span');a.className='av';a.textContent=n.textContent.trim().charAt(0).toUpperCase();p.prepend(a)}p.style.setProperty('--sc',getComputedStyle(p).borderLeftColor)})}
 const mo=new MutationObserver(()=>{if(q)return;q=requestAnimationFrame(()=>{q=0;mo.disconnect();deco();mo.observe(root,cfg)})});
 mo.observe(root,cfg);
 document.addEventListener('pointermove',e=>{const c=e.target.closest&&e.target.closest('.hc');if(!c)return;const r=c.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;c.style.setProperty('--ry',x*16+'deg');c.style.setProperty('--rx',-y*16+'deg')});
 document.addEventListener('pointerout',e=>{const c=e.target.closest&&e.target.closest('.hc');if(c){c.style.removeProperty('--rx');c.style.removeProperty('--ry')}});
 setInterval(()=>{try{if(!S||S.phase=='over'||root.hidden)return;const p=Math.max(0,Math.min(100,(S.dl-Date.now())/S.tm*100));root.querySelectorAll('.pc.w').forEach(c=>{c.style.setProperty('--p',p);c.classList.toggle('hot',p<32)})}catch{}},200);
})();
