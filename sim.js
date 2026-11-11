// Balance check: node scripts/sim.js  (bot-vs-bot, normal level)
import{newGame,step,waiting,bot}from '../game.js';
for(const size of[2,4]){let wins=Array(size).fill(0),steps=0,asc=0;const N=4000;
 for(let n=0;n<N;n++){const g=newGame(Array.from({length:size},(_,i)=>({name:'P'+i,bot:true})));let k=0;
  while(g.phase!='over'&&k++<3000){const i=waiting(g)[0];step(g,i,bot(g,i,'normal'))}
  wins[g.win]++;steps+=k;if(g.players[g.win].asc>=10)asc++}
 console.log(`${size}P: seat win% ${wins.map(w=>(w/N*100).toFixed(1)).join(' / ')} | avg decisions ${(steps/N).toFixed(0)} | won by Ascent ${(asc/N*100).toFixed(0)}%`)}
