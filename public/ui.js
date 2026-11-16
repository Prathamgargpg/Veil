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
// Plain-English wording for hints and buttons, plus a nicer waiting room.
(()=>{
 const css=document.createElement('style');css.textContent=`#wc{display:inline-block;padding:6px 20px;border:2px dashed var(--ac);border-radius:12px;background:color-mix(in srgb,var(--ac) 12%,transparent);box-shadow:0 0 24px color-mix(in srgb,var(--ac) 30%,transparent)}#wait .dt{width:22px;height:22px;box-shadow:0 0 10px var(--ac)}#wait .lg{width:150px;filter:drop-shadow(0 0 22px var(--ac))}#wait h3{letter-spacing:.12em}`;document.head.append(css);
 const SAY=[[/^The Blade is at your throat\.$/,'A Blade is aimed at you.'],[/^Sacrifice a Sigil:$/,'Pick a card to lose:'],[/Block \(claim Warden\)/,'Block (say you have the Warden)'],[/^Accept$/,'Accept (lose a card)'],[/\(\u22122\)/,'(costs 2)'],[/Seer: swap #(\d)/,'Seer: swap card $1']];
 const fix=()=>document.querySelectorAll('#act p,#act button').forEach(e=>{const t=e.textContent;let n=t;for(const[r,v]of SAY)n=n.replace(r,v);if(n!==t)e.textContent=n});
 new MutationObserver(fix).observe(document.getElementById('act'),{childList:true,subtree:true});
 window.hint=s=>{const P=s.players,me=s.me,p=s.p,W=s.wait.includes(me);
  if(s.phase=='over')return s.win==me?'You won! Try a harder bot or a 4-player game next.':'You lost this time. Try again!';
  if(!P[me].n)return 'You are out. Watch the rest of the game.';
  if(!W)return s.phase=='act'?'Your opponent is choosing. Whatever they say, you can challenge it.':'Waiting for the other player to choose.';
  if(s.phase=='act')return P[me].asc<2?'YOUR MOVE. Tithe gives 1 point and is always safe. Broker gives 4 points, and you can say you have it even if you do not (that is a bluff!). Reach 10 points to win.':'YOUR MOVE. With 2 or more points you can pay 2 to use the Blade. Your rival loses a card, but they may challenge you.';
  if(s.phase=='react')return `${P[p.actor].name} says they have the ${CD[p.a]}. Do you think they are lying? Press Challenge. If they told the truth, you lose a card. If they lied, they lose a card. Not sure? Let it pass.`;
  if(s.phase=='block')return 'A Blade is aimed at you. Say you have the Warden to block it (even if you do not), or accept it and lose a card.';
  if(s.phase=='react2')return `${P[p.target].name} says they have the Warden. Press Challenge if you think they lie. If they lied, they lose a card and the Blade still hits them.`;
  return 'You must lose a card. Keep the one you trust most. The lost card is shown to everyone.'};
})();
// Plain-English game log: the server's wording is rewritten on screen only.
(()=>{
 const L=[[/^The Veil lifts\.$/,'The game begins.'],[/^(\w+) tithes \+1\.$/,'$1 takes 1 Ascent (Tithe).'],[/^(\w+) claims Blade against (\w+)\.$/,'$1 says they have the Blade and aims it at $2.'],[/^(\w+) claims (\w+)\.$/,'$1 says they have the $2.'],
  [/^(\w+) challenges (\w+)'s (\w+)!$/,'$1 challenges $2! $2 must show the $3.'],[/^(\w+) revealed \u2014 the doubter pays\.$/,'$1 shown. It was true, so the challenger loses a card.'],[/^(\w+) was bluffing!$/,'$1 was lying!'],
  [/^(\w+) loses (\w+)\.$/,'$1 loses the $2 card.'],[/^(\w+) brokers \+(\d+) Ascent\.$/,'$1 gets $2 Ascent.'],[/^(\w+) consults the Seer\.$/,'$1 swaps a card.'],[/^(\w+) may block\.$/,'$1 can block the Blade.'],
  [/^The blow is blocked\.$/,'The Blade is blocked.'],[/^(\w+) ascends the pyramid\.$/,'$1 reaches the top and wins.']];
 const fixLog=()=>document.querySelectorAll('#log div').forEach(e=>{const t=e.textContent;let n=t;for(const[r,v]of L)if(r.test(t)){n=t.replace(r,v);break}if(n!==t)e.textContent=n});
 new MutationObserver(fixLog).observe(document.getElementById('log'),{childList:true,subtree:true});
})();
