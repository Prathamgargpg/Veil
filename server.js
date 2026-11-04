import express from 'express';import http from 'http';import{WebSocketServer}from 'ws';
import Database from 'better-sqlite3';import bcrypt from 'bcryptjs';import jwt from 'jsonwebtoken';
import{newGame,step,view,bot,safe,waiting,BN}from './game.js';
if(process.env.NODE_ENV=='production'&&!process.env.JWT_SECRET){console.error('JWT_SECRET is required in production');process.exit(1)}
const S=process.env.JWT_SECRET||'dev-secret-change-me',db=new Database(process.env.DB||'data.db');
db.exec(`create table if not exists users(id integer primary key,name text unique,hash text,created integer,played integer default 0,wins integer default 0);
create table if not exists games(id integer primary key,ts integer,size integer,players text,winner text,log text)`);
const app=express();app.set('trust proxy',1);app.disable('x-powered-by');
app.use((q,s,n)=>{s.set({'X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Referrer-Policy':'no-referrer'});n()});
const hits=new Map();setInterval(()=>hits.clear(),36e5);
const lim=(q,s,n)=>{const t=Date.now(),a=(hits.get(q.ip)||[]).filter(x=>t-x<3e5);a.push(t);hits.set(q.ip,a);a.length>12?s.status(429).json({error:'Too many attempts. Wait a few minutes.'}):n()};
app.use(express.json({limit:'2kb'}));app.use(express.static('public'));
const tok=u=>jwt.sign({id:u.id,name:u.name},S,{expiresIn:'7d'});
for(const k of['register','login'])app.post('/api/'+k,lim,(q,s)=>{const{name,password}=q.body||{};
 if(!/^\w{3,16}$/.test(name||'')||(password||'').length<6)return s.status(400).json({error:'Name 3-16 letters/digits, password 6+'});
 let u=db.prepare('select * from users where name=?').get(name);
 if(k=='register'){if(u)return s.status(409).json({error:'Name taken'});
  const r=db.prepare('insert into users(name,hash,created) values(?,?,?)').run(name,bcrypt.hashSync(password,10),Date.now());u={id:r.lastInsertRowid,name}}
 else if(!u||!bcrypt.compareSync(password,u.hash))return s.status(401).json({error:'Wrong credentials'});
 s.json({token:tok(u),name:u.name})});
const auth=(q,s,n)=>{try{q.u=jwt.verify((q.headers.authorization||'').slice(7),S);n()}catch{s.sendStatus(401)}};
app.get('/api/me',auth,(q,s)=>s.json({...db.prepare('select name,created,played,wins from users where id=?').get(q.u.id),
 games:db.prepare('select ts,size,winner,players from games where players like ? order by id desc limit 6').all('%"'+q.u.name+'"%')}));
app.get('/api/top',auth,(q,s)=>s.json(db.prepare('select name,wins,played from users order by wins desc,played asc limit 8').all()));
const EM=['😈','🤔','👁','🔥','😂','🙏'];
app.get('/api/health',(q,s)=>s.json({ok:true}));
app.use('/api',(q,s)=>s.status(404).json({error:'Not found'}));
app.use((e,q,s,n)=>{console.error(e);s.status(e.status==400?400:500).json({error:e.status==400?'Bad request':'Server error, please try again'})});
const server=http.createServer(app),wss=new WebSocketServer({server,maxPayload:2048}),rooms=new Map();
const send=(w,o)=>w&&w.readyState==1&&w.send(JSON.stringify(o));
const mk=(size,pub)=>{let c;do c=Math.random().toString(36).slice(2,6).toUpperCase();while(rooms.has(c));const r={c,size,pub,pl:[],t:[]};rooms.set(c,r);return r};
const lobby=r=>r.pl.forEach(p=>send(p.ws,{t:'lobby',c:r.c,n:r.pl.length,size:r.size}));
const start=r=>{r.g=newGame(r.pl.map(p=>({name:p.name,bot:!!p.bot})));tick(r)};
const mv=(r,i,m)=>{if(i>=0&&step(r.g,i,m||{}))tick(r)};
function tick(r){r.t.forEach(clearTimeout);r.t=[];const g=r.g;
 r.pl.forEach((p,i)=>send(p.ws,{t:'state',s:view(g,i)}));
 if(g.phase=='over')return done(r);
 waiting(g).forEach(i=>{const b=g.players[i].bot;r.t.push(setTimeout(()=>mv(r,i,b?bot(g,i):safe(g)),b?900+Math.random()*1000:25000))})}
function done(r){const g=r.g,w=g.players[g.win].name;
 db.prepare('insert into games(ts,size,players,winner,log) values(?,?,?,?,?)').run(Date.now(),r.size,JSON.stringify(g.players.map(p=>p.name)),w,JSON.stringify(g.log));
 r.pl.forEach(p=>p.uid&&db.prepare('update users set played=played+1,wins=wins+? where id=?').run(p.name==w?1:0,p.uid));rooms.delete(r.c)}
wss.on('connection',ws=>{let u,room,le=0;
 const enter=r=>{room=r;r.pl.push({name:u.name,uid:u.id,ws});r.pl.length==r.size?start(r):lobby(r)};
 const bye=away=>{if(!room)return;const r=room,i=r.pl.findIndex(p=>p.ws==ws);room=null;if(i<0)return;
  if(!r.g){r.pl.splice(i,1);lobby(r);if(!r.pl.length)rooms.delete(r.c)}
  else if(r.g.phase!='over'){const p=r.pl[i];p.ws=null;r.g.players[i].bot=true;if(away===true)p.away=true;else p.bot=1;
   if(!r.pl.some(x=>x.ws)){r.t.forEach(clearTimeout);r.t=[];if(r.pl.some(x=>x.away))r.gc=setTimeout(()=>rooms.delete(r.c),9e4);else rooms.delete(r.c)}else tick(r)}};
 ws.on('message',d=>{let m;try{m=JSON.parse(d)}catch{return}
  if(m.t=='auth'){try{u=jwt.verify(m.token,S)}catch{send(ws,{t:'err',e:'auth'});return}
   const r=[...rooms.values()].find(x=>x.g&&x.g.phase!='over'&&x.pl.some(p=>p.uid==u.id&&p.away)),i=r?r.pl.findIndex(p=>p.uid==u.id&&p.away):-1;
   if(i>=0){room=r;const p=r.pl[i];p.ws=ws;p.away=false;r.g.players[i].bot=false;clearTimeout(r.gc);send(ws,{t:'ok',rejoin:true});tick(r)}else send(ws,{t:'ok'});return}
  if(!u)return;
  if(m.t=='play'&&!room){const size=m.size==4?4:2;let r;
   if(m.mode=='quick')r=[...rooms.values()].find(x=>!x.g&&x.pub&&x.size==size);
   if(!r){r=mk(size,m.mode=='quick');if(m.mode=='practice')for(let i=1;i<size;i++)r.pl.push({name:BN[i],bot:1})}
   enter(r)}
  else if(m.t=='join'&&!room){const r=rooms.get(String(m.c).toUpperCase());
   if(!r||r.g||r.pl.length>=r.size)send(ws,{t:'err',e:'Room unavailable'});else enter(r)}
  else if(m.t=='move'&&room&&room.g)mv(room,room.pl.findIndex(p=>p.ws==ws),m.m);
  else if(m.t=='emote'&&room&&room.g&&EM.includes(m.e)&&Date.now()-le>1000){le=Date.now();const i=room.pl.findIndex(p=>p.ws==ws);if(i>=0)room.pl.forEach(p=>send(p.ws,{t:'emote',i,e:m.e}))}
  else if(m.t=='leave')bye()});
 ws.on('close',()=>bye(true))});
server.listen(process.env.PORT||3000,()=>console.log('VEIL on :'+(process.env.PORT||3000)));
