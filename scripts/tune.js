// Rule tuning: node scripts/tune.js  (normal bots, 6000 games per variant)
import{newGame,step,waiting,bot}from '../game.js';
const run=(size,o,N=6000)=>{const w=Array(size).fill(0);let st=0,asc=0;
 for(let n=0;n<N;n++){const g=newGame(Array.from({length:size},(_,i)=>({name:'P'+i,bot:true})),o);let k=0;
  while(g.phase!='over'&&k++<3000){const i=waiting(g)[0];step(g,i,bot(g,i,'normal'))}
  w[g.win]++;st+=k;if(g.players[g.win].asc>=10)asc++}
 const p=w.map(x=>x/N*100);return `win% ${p.map(x=>x.toFixed(1)).join('/')} spread ${(Math.max(...p)-Math.min(...p)).toFixed(1)} | decisions ${(st/N).toFixed(0)} | by Ascent ${(asc/N*100).toFixed(0)}%`};
for(const b of[2,3,4,5])console.log('2P broker +'+b,run(2,{broker:b,start:[]}));
for(const s of[[0,0],[0,1],[0,2]])console.log('2P start',s,run(2,{broker:4,start:s}));
for(const b of[3,4,5])console.log('4P broker +'+b,run(4,{broker:b,start:[]}));
for(const s of[[1,1,0,0],[2,1,1,0],[2,2,1,0],[3,2,1,0]])console.log('4P start',s,run(4,{broker:4,start:s}));
