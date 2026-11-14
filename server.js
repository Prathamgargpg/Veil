import{createHash}from 'crypto';import{readFileSync,existsSync}from 'fs';import path from 'path';
import express from 'express';import http from 'http';import{WebSocketServer}from 'ws';
import Database from 'better-sqlite3';import bcrypt from 'bcryptjs';import jwt from 'jsonwebtoken';
import{newGame,step,view,bot,safe,waiting,BN}from './game.js';
if(process.env.NODE_ENV=='production'&&!process.env.JWT_SECRET){console.error('JWT_SECRET is required in production');process.exit(1)}
const S=process.env.JWT_SECRET||'dev-secret-change-me',db=new Database(process.env.DB||'data.db');
db.exec(`create table if not exists users(id integer primary key,name text unique,hash text,created integer,played integer default 0,wins integer default 0);
create table if not exists games(id integer primary key,ts integer,size integer,players text,winner text,log text)`);
for(const c of['elo integer default 1000','rated integer default 0'])try{db.exec('alter table users add column '+c)}catch{}
db.exec("create table if not exists meta(k text primary key,v text);create table if not exists hall(season text,name text,elo integer)");
function season(){const now=new Date().toISOString().slice(0,7),c=db.prepare("select v from meta where k='season'").get();
 if(!c)db.prepare("insert into meta values('season',?)").run(now);
 else if(c.v!=now){db.prepare('insert into hall select ?,name,elo from users where rated>0 order by elo desc limit 3').run(c.v);db.exec('update users set elo=1000,rated=0');db.prepare("update meta set v=? where k='season'").run(now)}return now}
season();
const BAD=/fuck|shit|bitch|nazi|rape|porn|admin|moderator|support|^veil$/i; // minimal list: extend before a public launch
const app=express();app.set('trust proxy',1);app.disable('x-powered-by');
app.use((q,s,n)=>{s.set({'X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Referrer-Policy':'no-referrer'});n()});
// Rate limits: failed logins per ip+name (a shared proxy address cannot lock everyone out) and a loose cap on total sign-ups.
const fails=new Map();let regs=[];setInterval(()=>fails.clear(),36e5);const recent=a=>(a||[]).filter(x=>Date.now()-x<3e5);
app.use(express.json({limit:'2kb'}));app.use(express.static('public'));
// Forgiving layout: if page files were uploaded to the repo root instead of public/, serve just those pages (never the whole root).
const find=f=>existsSync('public/'+f)?'public/'+f:f;
for(const f of['index.html','privacy.html','terms.html'])if(!existsSync('public/'+f)&&existsSync(f)){console.warn('WARNING: public/'+f+' missing, serving ./'+f+'. Move it into the public/ folder.');app.get(f=='index.html'?['/','/index.html']:'/'+f,(q,s)=>s.sendFile(path.resolve(f)))}
if(!existsSync('public/index.html')&&!existsSync('index.html'))app.get('/',(q,s)=>s.status(500).send('VEIL: index.html not found. It must be at public/index.html in your GitHub repo.'));
const tok=u=>jwt.sign({id:u.id,name:u.name},S,{expiresIn:'7d'});
for(const k of['register','login'])app.post('/api/'+k,(q,s)=>{const{name,password}=q.body||{};
 const done=(c,o)=>{console.log(k,JSON.stringify(String(name).slice(0,16)),'->',c);s.status(c).json(o)},key=q.ip+'|'+String(name).toLowerCase();
 if(!/^\w{3,16}$/.test(name||'')||(password||'').length<6)return done(400,{error:'Name 3-16 letters/digits, password 6+'});
 let u=db.prepare('select * from users where name=?').get(name);
 if(k=='login'&&recent(fails.get(key)).length>=8)return done(429,{error:'Too many failed attempts. Wait a few minutes.'});
 if(k=='register'){regs=regs.filter(x=>Date.now()-x<6e5);if(regs.length>=60)return done(429,{error:'Too many sign-ups right now. Try again in a few minutes.'});
  if(BAD.test(name))return done(400,{error:'That name is not allowed'});if(u)return done(409,{error:'Name taken'});
  const r=db.prepare('insert into users(name,hash,created) values(?,?,?)').run(name,bcrypt.hashSync(password,10),Date.now());u={id:r.lastInsertRowid,name};regs.push(Date.now())}
 else if(!u||!bcrypt.compareSync(password,u.hash)){fails.set(key,[...recent(fails.get(key)),Date.now()]);return done(401,{error:'Wrong credentials'})}
 done(200,{token:tok(u),name:u.name})});
const auth=(q,s,n)=>{try{q.u=jwt.verify((q.headers.authorization||'').slice(7),S);if(!db.prepare('select 1 from users where id=?').get(q.u.id))return s.sendStatus(401);season();n()}catch{s.sendStatus(401)}};
app.get('/api/me',auth,(q,s)=>s.json({...db.prepare('select name,created,played,wins,elo,rated from users where id=?').get(q.u.id),
 games:db.prepare('select ts,size,winner,players from games where players like ? order by id desc limit 6').all('%"'+q.u.name+'"%')}));
app.delete('/api/me',auth,(q,s)=>{const u=db.prepare('select name from users where id=?').get(q.u.id);
 db.prepare('update games set players=replace(players,?,?),winner=case when winner=? then ? else winner end where players like ?').run('"'+u.name+'"','"deleted"',u.name,'deleted','%"'+u.name+'"%');
 db.prepare('delete from users where id=?').run(q.u.id);s.json({ok:true})});
app.get('/api/top',auth,(q,s)=>s.json({season:season(),rows:db.prepare('select name,elo,wins from users where rated>0 order by elo desc limit 8').all(),champs:db.prepare('select season,name,elo from hall where season=(select max(season) from hall) order by elo desc').all()}));
const EM=['😈','🤔','👁','🔥','😂','🙏'];
const FILES={server:'server.js',game:'game.js',page:find('index.html'),privacy:find('privacy.html'),terms:find('terms.html')};
const BUILD=Object.fromEntries(Object.entries(FILES).map(([k,f])=>{try{return[k,createHash('sha1').update(readFileSync(f)).digest('hex').slice(0,8)]}catch{return[k,'missing']}}));
console.log('BUILD '+JSON.stringify(BUILD));
app.get('/api/health',(q,s)=>s.json({ok:true,build:BUILD}));
app.use('/api',(q,s)=>s.status(404).json({error:'Not found'}));
app.use((e,q,s,n)=>{console.error(e);s.status(e.status==400?400:500).json({error:e.status==400?'Bad request':'Server error, please try again'})});
const server=http.createServer(app),wss=new WebSocketServer({server,maxPayload:2048}),rooms=new Map();
const send=(w,o)=>w&&w.readyState==1&&w.send(JSON.stringify(o));
const mk=(size,pub)=>{let c;do c=Math.random().toString(36).slice(2,6).toUpperCase();while(rooms.has(c));const r={c,size,pub,pl:[],t:[]};rooms.set(c,r);return r};
const FILL=+process.env.FILL_MS||2e4;
const lobby=r=>r.pl.forEach(p=>send(p.ws,{t:'lobby',c:r.c,n:r.pl.length,size:r.size,fb:r.fbAt?Math.max(0,r.fbAt-Date.now()):0}));
const start=r=>{clearTimeout(r.fb);r.fbAt=0;r.g=newGame(r.pl.map(p=>({name:p.name,bot:!!p.bot})));tick(r)};
const mv=(r,i,m)=>{if(i>=0&&step(r.g,i,m||{}))tick(r)};
function tick(r){r.t.forEach(clearTimeout);r.t=[];const g=r.g;
 r.pl.forEach((p,i)=>send(p.ws,{t:'state',s:view(g,i),tm:r.tut?9e4:25000}));
 if(g.phase=='over')return done(r);
 waiting(g).forEach(i=>{const b=g.players[i].bot;r.t.push(setTimeout(()=>mv(r,i,b?bot(g,i,r.lv):safe(g)),b?900+Math.random()*1000:r.tut?9e4:25000))})}
// Elo for PvP games between distinct real accounts (practice/tutorial and bot seats are unrated)
function rate(r){const g=r.g,w=r.pl[g.win],hs=r.pl.filter(p=>p.uid);
 if(!w||!w.uid||hs.length<2||hs.length<r.pl.length||new Set(hs.map(p=>p.uid)).size<hs.length)return;
 const R0={},d={};hs.forEach(p=>{R0[p.uid]=db.prepare('select elo from users where id=?').get(p.uid).elo;d[p.uid]=0});const K=32/(hs.length-1);
 hs.filter(p=>p.uid!=w.uid).forEach(l=>{const x=K*(1-1/(1+10**((R0[l.uid]-R0[w.uid])/400)));d[w.uid]+=x;d[l.uid]-=x});
 hs.forEach(p=>{const n=Math.max(100,Math.round(R0[p.uid]+d[p.uid]));db.prepare('update users set elo=?,rated=rated+1 where id=?').run(n,p.uid);send(p.ws,{t:'rating',d:n-R0[p.uid],elo:n})})}
function done(r){season();try{rate(r)}catch(e){console.error(e)}const g=r.g,w=g.players[g.win].name;
 db.prepare('insert into games(ts,size,players,winner,log) values(?,?,?,?,?)').run(Date.now(),r.size,JSON.stringify(g.players.map(p=>p.name)),w,JSON.stringify(g.log));
 r.pl.forEach(p=>p.uid&&db.prepare('update users set played=played+1,wins=wins+? where id=?').run(p.name==w?1:0,p.uid));rooms.delete(r.c)}
wss.on('connection',ws=>{let u,room,le=0;
 const enter=r=>{room=r;r.pl.push({name:u.name,uid:u.id,ws});if(r.pl.length==r.size)return start(r);
  if(r.pub&&!r.fb){r.fbAt=Date.now()+FILL;r.fb=setTimeout(()=>{if(!r.g&&r.pl.length){for(let i=r.pl.length;i<r.size;i++)r.pl.push({name:BN[i]||'Ghost',bot:1});start(r)}},FILL)}
  lobby(r)};
 const bye=away=>{if(!room)return;const r=room,i=r.pl.findIndex(p=>p.ws==ws);room=null;if(i<0)return;
  if(!r.g){r.pl.splice(i,1);lobby(r);if(!r.pl.length){clearTimeout(r.fb);rooms.delete(r.c)}}
  else if(r.g.phase!='over'){const p=r.pl[i];p.ws=null;r.g.players[i].bot=true;if(away===true)p.away=true;else p.bot=1;
   if(!r.pl.some(x=>x.ws)){r.t.forEach(clearTimeout);r.t=[];if(r.pl.some(x=>x.away))r.gc=setTimeout(()=>rooms.delete(r.c),9e4);else rooms.delete(r.c)}else tick(r)}};
 ws.on('message',d=>{let m;try{m=JSON.parse(d)}catch{return}
  if(m.t=='auth'){try{u=jwt.verify(m.token,S);if(!db.prepare('select 1 from users where id=?').get(u.id))throw 0}catch{console.log('ws auth failed');send(ws,{t:'err',e:'auth'});return}
   console.log('ws auth ok',u.name);
   const r=[...rooms.values()].find(x=>x.g&&x.g.phase!='over'&&x.pl.some(p=>p.uid==u.id&&p.away)),i=r?r.pl.findIndex(p=>p.uid==u.id&&p.away):-1;
   if(i>=0){room=r;const p=r.pl[i];p.ws=ws;p.away=false;r.g.players[i].bot=false;clearTimeout(r.gc);send(ws,{t:'ok',rejoin:true});tick(r)}else send(ws,{t:'ok'});return}
  if(!u)return;
  if(m.t=='play'&&!room){const size=m.size==4?4:2;let r;
   if(m.mode=='quick')r=[...rooms.values()].find(x=>!x.g&&x.pub&&x.size==size);
   if(!r){r=mk(size,m.mode=='quick');r.lv=['easy','hard'].includes(m.lv)?m.lv:'normal';r.tut=!!m.tut&&m.mode=='practice';if(m.mode=='practice')for(let i=1;i<size;i++)r.pl.push({name:BN[i],bot:1})}
   enter(r)}
  else if(m.t=='join'&&!room){const r=rooms.get(String(m.c).toUpperCase());
   if(!r||r.g||r.pl.length>=r.size)send(ws,{t:'err',e:'Room unavailable'});else enter(r)}
  else if(m.t=='move'&&room&&room.g)mv(room,room.pl.findIndex(p=>p.ws==ws),m.m);
  else if(m.t=='emote'&&room&&room.g&&EM.includes(m.e)&&Date.now()-le>1000){le=Date.now();const i=room.pl.findIndex(p=>p.ws==ws);if(i>=0)room.pl.forEach(p=>send(p.ws,{t:'emote',i,e:m.e}))}
  else if(m.t=='leave')bye()});
 ws.on('close',()=>bye(true))});
server.listen(process.env.PORT||3000,()=>console.log('VEIL on :'+(process.env.PORT||3000)));
