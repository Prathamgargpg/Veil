export const CL={broker:'Broker',blade:'Blade',seer:'Seer'},BN=['','Cipher','Vesper','Null'];
const shuf=a=>{for(let i=a.length;i>1;){const j=Math.random()*i|0;i--;[a[i],a[j]]=[a[j],a[i]]}return a};
export function newGame(ps,o={}){const k=ps.length>2?4:3,deck=[],D=ps.length>2?[1,1,0,0]:[0,1];['Seer','Blade','Broker','Warden'].forEach(t=>{for(let i=0;i<k;i++)deck.push(t)});shuf(deck);
 return{players:ps.map(p=>({...p,hand:Array.from({length:o.hand||2},()=>deck.pop()),lost:[],asc:(o.start||D)[ps.indexOf(p)]||0})),cfg:{broker:o.broker||4,blade:o.blade||2},deck,turn:0,phase:'act',p:null,log:['The Veil lifts.']}}
const al=g=>g.players.map((_,i)=>i).filter(i=>g.players[i].hand.length);
export const waiting=g=>({act:[g.turn],react:g.p&&g.p.r,block:g.p&&[g.p.target],react2:g.p&&[g.p.actor],lose:g.p&&[g.p.l]}[g.phase]||[]);
const L=(g,s)=>g.log.push(s),N=(g,i)=>g.players[i].name;
function end(g){const a=al(g),w=g.players.findIndex(p=>p.asc>=10&&p.hand.length);
 if(a.length==1||w>=0){g.phase='over';g.win=w>=0?w:a[0];L(g,N(g,g.win)+' ascends the pyramid.');return}
 do g.turn=(g.turn+1)%g.players.length;while(!g.players[g.turn].hand.length);g.phase='act';g.p=null}
function lose(g,i,next){g.p.l=i;g.p.next=next;if(g.players[i].hand.length==1)drop(g,i,0);else g.phase='lose'}
function drop(g,i,c){const P=g.players[i],[t]=P.hand.splice(Math.max(0,Math.min(c,P.hand.length-1)),1);P.lost.push(t);L(g,`${P.name} loses ${t}.`);
 const n=g.p.next;if(n=='end')end(g);else if(n=='resolve')resolve(g);else if(g.players[g.p.target].hand.length)lose(g,g.p.target,'end');else end(g)}
function resolve(g){const{a,actor,target,i}=g.p,P=g.players[actor];
 if(a=='broker'){P.asc+=g.cfg.broker;L(g,`${P.name} brokers +${g.cfg.broker} Ascent.`);end(g)}
 else if(a=='seer'){const c=g.deck.pop();g.deck.push(P.hand[i]);P.hand[i]=c;shuf(g.deck);L(g,P.name+' consults the Seer.');end(g)}
 else if(g.players[target].hand.length){g.phase='block';L(g,N(g,target)+' may block.')}else end(g)}
function chal(g,ch,cl,card,ok,bad){const C=g.players[cl],k=C.hand.indexOf(card);L(g,`${N(g,ch)} challenges ${C.name}'s ${card}!`);
 if(k>=0){L(g,`${card} revealed — the doubter pays.`);g.deck.push(card);shuf(g.deck);C.hand[k]=g.deck.pop();lose(g,ch,ok)}
 else{L(g,C.name+' was bluffing!');lose(g,cl,bad)}}
function act(g,i,m){const P=g.players[i],a=m.a;
 if(a=='tithe'){P.asc++;L(g,P.name+' tithes +1.');return end(g)}
 if(!CL[a])return;const t=+m.target;
 if(a=='blade'){if(P.asc<g.cfg.blade||t==i||!g.players[t]||!g.players[t].hand.length)return;P.asc-=g.cfg.blade}
 g.p={a,actor:i,target:t,i:Math.min(+m.i||0,P.hand.length-1),r:al(g).filter(x=>x!=i)};g.phase='react';
 L(g,`${P.name} claims ${CL[a]}${a=='blade'?' against '+N(g,t):''}.`)}
export function step(g,i,m){if(!waiting(g).includes(i))return false;const ph=g.phase,p=g.p;
 if(ph=='act')act(g,i,m);
 else if(ph=='react'){if(m.a=='pass'){p.r=p.r.filter(x=>x!=i);if(!p.r.length)resolve(g)}else if(m.a=='challenge')chal(g,i,p.actor,CL[p.a],'resolve','end')}
 else if(ph=='block'){if(m.a=='block'){g.phase='react2';L(g,N(g,p.target)+' claims Warden.')}else lose(g,p.target,'end')}
 else if(ph=='react2'){if(m.a=='challenge')chal(g,i,p.target,'Warden','end','hit');else{L(g,'The blow is blocked.');end(g)}}
 else if(ph=='lose')drop(g,p.l,+m.c||0);
 return true}
export const safe=g=>({act:{a:'tithe'},block:{a:'accept'},lose:{c:0}}[g.phase]||{a:'pass'});
const known=(g,i,c)=>g.players[i].hand.filter(x=>x==c).length+g.players.reduce((n,q)=>n+q.lost.filter(x=>x==c).length,0);
export function bot(g,i,lv='normal'){const P=g.players[i],p=g.p,r=Math.random,f=al(g).filter(x=>x!=i),ph=g.phase,k=g.players.length>2?4:3,E=lv=='easy',H=lv=='hard';
 const sure=c=>!E&&known(g,i,c)>=k; // every copy is in my hand or face-up, so the claim must be a bluff
 if(ph=='act'){const t=f.sort((a,b)=>g.players[b].asc-g.players[a].asc)[0];
  if(P.asc>=g.cfg.blade&&r()<(E?.12:H?.5:.4))return{a:'blade',target:t};if(r()<(E?.35:.5))return{a:'broker'};if(!E&&r()<.2)return{a:'seer',i:0};return{a:'tithe'}}
 if(ph=='react')return{a:sure(CL[p.a])||r()<(E?.03:H?.2:.12)+(p.a=='broker'&&!E&&g.players[p.actor].asc>5?.25:0)?'challenge':'pass'};
 if(ph=='block')return{a:P.hand.includes('Warden')||r()<(E?.1:.3)?'block':'accept'};
 if(ph=='react2')return{a:sure('Warden')||r()<(E?.05:H?.4:.3)?'challenge':'pass'};
 return{c:r()*P.hand.length|0}}
export const view=(g,me)=>({phase:g.phase,turn:g.turn,me,win:g.win,wait:waiting(g),log:g.log.slice(-9),
 p:g.p&&{a:g.p.a,actor:g.p.actor,target:g.p.target},
 players:g.players.map((p,i)=>({name:p.name,bot:p.bot,asc:p.asc,n:p.hand.length,lost:p.lost,hand:i==me?p.hand:undefined}))});
