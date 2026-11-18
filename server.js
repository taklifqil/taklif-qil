'use strict';
const express=require('express');
const {Telegraf,Markup}=require('telegraf');
const helmet=require('helmet');
const {rateLimit}=require('express-rate-limit');
const crypto=require('node:crypto');
const path=require('node:path');
const fs=require('node:fs');
const db=require('./db');
const {page,OCC,DIRS,parseWhen,esc}=require('./invitation');
const {checkMini,checkLogin}=require('./auth');
const {validate,clean}=require('./validate');
const PORT=Number(process.env.PORT||3000);
const BASE=(process.env.BASE_URL||(process.env.RAILWAY_PUBLIC_DOMAIN?'https://'+process.env.RAILWAY_PUBLIC_DOMAIN:'http://localhost:'+PORT)).replace(/\/$/,'');
const TOKEN=process.env.BOT_TOKEN;
const ADMIN_ID=String(process.env.ADMIN_TELEGRAM_ID||'');
const bot=TOKEN?new Telegraf(TOKEN):null;
const app=express();app.disable('x-powered-by');app.set('trust proxy',1);
app.use(helmet({contentSecurityPolicy:false,crossOriginEmbedderPolicy:false}));
app.use(express.json({limit:'100kb'}));
app.use('/api',rateLimit({windowMs:60*1000,limit:100,standardHeaders:'draft-7',legacyHeaders:false}));
// Only serve approved public files; never expose source code or secrets.
const PUBLIC_ASSETS = new Set(['invite.css','invite.js','style.css','web.js']);
app.get('/s/:asset',(req,res,next)=>{
  const asset=req.params.asset;
  if(!PUBLIC_ASSETS.has(asset))return res.sendStatus(404);
  return res.sendFile(path.join(__dirname,asset),{maxAge:'1h'},next);
});
const run=f=>(req,res,next)=>Promise.resolve().then(()=>f(req,res,next)).catch(next);
const newId=()=>crypto.randomBytes(10).toString('hex');
const url=id=>BASE+'/i/'+encodeURIComponent(id);
const isHttps=BASE.startsWith('https://');
const cookie=req=>Object.fromEntries((req.headers.cookie||'').split(';').map(x=>x.trim().split('=').map(decodeURIComponent)).filter(x=>x.length===2));
const sessionHash=x=>crypto.createHash('sha256').update(x).digest('hex');
const sessionUser=async req=>{
 const token=cookie(req).tq_session;if(!token||!/^[a-f0-9]{64}$/.test(token))return null;
 const r=await db.q('SELECT u.id,u.blocked FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>now()',[sessionHash(token)]);
 return r.rows[0]&&!r.rows[0].blocked?{id:Number(r.rows[0].id)}:null;
};
const csrf=req=>{if(!req.headers.origin)return false;try{return new URL(req.headers.origin).origin===new URL(BASE).origin;}catch{return false;}};
const auth=run(async(req,res,next)=>{
 let u=null;
 if(req.headers['x-init-data']){
  try {u=checkMini(req.headers['x-init-data'],TOKEN);}catch{return res.status(401).json({error:'Telegram autentifikatsiyasi xato'});}
  if(!await db.upsertUser(u))return res.sendStatus(403);
 }else u=await sessionUser(req);
 if(!u)return res.status(401).json({error:'Telegram orqali tizimga kiring'});
 req.user=u;next();
});
const requireWrite=(req,res,next)=>{if(req.headers['x-init-data']||csrf(req))return next();return res.sendStatus(403);};
const admin=[auth,(req,res,next)=>String(req.user.id)===ADMIN_ID&&ADMIN_ID?next():res.sendStatus(403)];
const own=async(req,res)=>{const i=await db.invitation(req.params.id);if(!i||String(i.owner)!==String(req.user.id)){res.sendStatus(404);return null;}return i;};
const notify=(id,msg)=>bot&&bot.telegram.sendMessage(id,msg).catch(()=>{});
const summary=async i=>({...i,...await db.rsvpCounts(i.id),url:url(i.id)});
app.get('/health',run(async(req,res)=>{await db.q('SELECT 1');res.json({ok:true,database:'connected',botConfigured:!!TOKEN});}));
app.get('/',(req,res)=>res.sendFile(path.join(__dirname,'web.html')));
app.get('/app',(req,res)=>res.sendFile(path.join(__dirname,'web.html')));
app.get('/legacy-app',(req,res)=>{
 let html=fs.readFileSync(path.join(__dirname,'miniapp.html'),'utf8');
 html=html.replace('__CFG__',JSON.stringify({OCC,DIRS,BASE}).replace(/</g,'\\u003c'));
 res.type('html').send(html);
});
app.get('/auth/telegram',run(async(req,res)=>{
 let user;try{user=checkLogin(req.query,TOKEN);}catch{return res.status(401).send('Telegram login tekshiruvidan o‘tmadi');}
 if(!await db.upsertUser(user))return res.sendStatus(403);
 const secret=crypto.randomBytes(32).toString('hex');
 await db.q("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '7 days')",[sessionHash(secret),user.id]);
 res.cookie('tq_session',secret,{httpOnly:true,sameSite:'lax',secure:isHttps,maxAge:7*86400000,path:'/'}).redirect('/');
}));
app.post('/api/logout',requireWrite,run(async(req,res)=>{const secret=cookie(req).tq_session;if(secret)await db.q('DELETE FROM sessions WHERE token_hash=$1',[sessionHash(secret)]);res.clearCookie('tq_session',{path:'/'}).json({ok:true});}));
app.get('/api/config',(req,res)=>res.json({botUsername:process.env.BOT_USERNAME||'',base:BASE,adminConfigured:!!ADMIN_ID,templates:OCC}));
app.get('/api/me',auth,(req,res)=>res.json({id:req.user.id,admin:String(req.user.id)===ADMIN_ID}));
app.get('/p/:name',run(async(req,res)=>{
 if(!/^[a-f0-9]{32}\.jpg$/.test(req.params.name))return res.sendStatus(404);
 const r=await db.q('SELECT content FROM photos WHERE id=$1',[req.params.name]);if(!r.rowCount)return res.sendStatus(404);
 res.set('Cache-Control','public,max-age=3600').type('image/jpeg').send(r.rows[0].content);
}));
app.get('/i/:id',run(async(req,res)=>{
 const i=await db.invitation(req.params.id);if(!i)return res.status(404).send('Taklifnoma topilmadi');if(i.off)return res.status(410).send('Taklifnoma faol emas');
 db.q('INSERT INTO views(invite_id) VALUES($1) ON CONFLICT(invite_id,viewed_on) DO UPDATE SET hits=views.hits+1',[i.id]).catch(()=>{});
 res.type('html').send(page(i));
}));
app.post('/api/rsvp/:id',rateLimit({windowMs:60*1000,limit:10}),run(async(req,res)=>{
 const i=await db.invitation(req.params.id);if(!i)return res.sendStatus(404);if(i.off)return res.sendStatus(410);
 if(!['yes','no'].includes(req.body?.answer))return res.status(400).json({error:'Javob noto‘g‘ri'});
 const guest=clean(req.body?.name,120);
 await db.q('INSERT INTO rsvps(invite_id,answer,guest_name) VALUES($1,$2,$3)',[i.id,req.body.answer,guest]);
 notify(i.owner,`💌 Yangi RSVP: ${req.body.answer==='yes'?'✅ Keladi':'❌ Kela olmaydi'}\n${guest||'Noma’lum mehmon'}\n${url(i.id)}`);
 res.json({ok:true});
}));
app.post('/api/app/photo',auth,express.raw({type:'image/jpeg',limit:'6mb'}),run(async(req,res)=>{
 const b=req.body;if(!Buffer.isBuffer(b)||b.length<4||b[0]!==255||b[1]!==216||b[2]!==255)return res.status(400).json({error:'JPEG rasm kerak'});
 const name=crypto.randomBytes(16).toString('hex')+'.jpg';await db.q('INSERT INTO photos(id,owner,content) VALUES($1,$2,$3)',[name,req.user.id,b]);res.json({photo:name});
}));
app.get('/api/app/invites',auth,run(async(req,res)=>{
 const items=await db.listInvites(req.user.id);res.json(await Promise.all(items.map(summary)));
}));
app.post('/api/app/invites',auth,requireWrite,run(async(req,res)=>{
 let d;try{d=validate(req.body);}catch(e){return res.status(400).json({error:e.message});}
 const items=await db.listInvites(req.user.id);if(items.length>=100)return res.status(429).json({error:'100 ta taklifnoma limitiga yetdingiz'});
 if(d.photo){const r=await db.q('SELECT 1 FROM photos WHERE id=$1 AND owner=$2',[d.photo,req.user.id]);if(!r.rowCount)return res.status(400).json({error:'Rasm sizga tegishli emas'});}
 d.id=newId();d.owner=req.user.id;await db.saveInvite(d);notify(req.user.id,`🎉 Taklifnoma tayyor!\n${url(d.id)}`);res.status(201).json({id:d.id,url:url(d.id)});
}));
app.put('/api/app/invites/:id',auth,requireWrite,run(async(req,res)=>{
 const i=await own(req,res);if(!i)return;
 let d;try{d=validate(req.body);}catch(e){return res.status(400).json({error:e.message});}
 if(d.photo){const p=await db.q('SELECT 1 FROM photos WHERE id=$1 AND owner=$2',[d.photo,req.user.id]);if(!p.rowCount)return res.sendStatus(403);}
 await db.q('UPDATE invites SET data=$1 WHERE id=$2',[JSON.stringify({...d}),i.id]);res.json({ok:true,url:url(i.id)});
}));
app.get('/api/app/invites/:id',auth,run(async(req,res)=>{
 const i=await own(req,res);if(!i)return;res.json(await summary(i));
}));
app.get('/api/app/invites/:id/guests',auth,run(async(req,res)=>{
 const i=await own(req,res);if(!i)return;
 const {rows}=await db.q('SELECT answer,guest_name,created_at FROM rsvps WHERE invite_id=$1 ORDER BY created_at DESC LIMIT 500',[i.id]);res.json(rows);
}));
app.post('/api/app/invites/:id/toggle',auth,requireWrite,run(async(req,res)=>{const i=await own(req,res);if(!i)return;await db.q('UPDATE invites SET off=$1 WHERE id=$2',[!i.off,i.id]);res.json({off:!i.off});}));
app.post('/api/app/invites/:id/delete',auth,requireWrite,run(async(req,res)=>{const i=await own(req,res);if(!i)return;await db.q('DELETE FROM invites WHERE id=$1',[i.id]);res.json({ok:true});}));
app.get('/admin',(req,res)=>res.sendFile(path.join(__dirname,'admin.html')));
app.get('/api/admin/dashboard',...admin,run(async(req,res)=>{
 const {rows:[s]}=await db.q(`SELECT (SELECT COUNT(*)::int FROM users) users,(SELECT COUNT(*)::int FROM users WHERE last_seen>now()-interval '30 days') active_users,(SELECT COUNT(*)::int FROM invites) invites,(SELECT COALESCE(SUM(hits),0)::int FROM views) views,(SELECT COUNT(*)::int FROM rsvps WHERE answer='yes') yes,(SELECT COUNT(*)::int FROM rsvps WHERE answer='no') no`);
 const daily=(await db.q(`SELECT viewed_on::text AS day,SUM(hits)::int AS views FROM views GROUP BY viewed_on ORDER BY viewed_on DESC LIMIT 30`)).rows;
 const users=(await db.q('SELECT id::text,name,username,blocked,created_at,last_seen FROM users ORDER BY last_seen DESC LIMIT 200')).rows;
 const invites=(await db.q('SELECT i.id,i.owner::text,i.data,i.off,i.created_at,(SELECT COUNT(*)::int FROM rsvps r WHERE r.invite_id=i.id) rsvp_count,(SELECT COALESCE(SUM(hits),0)::int FROM views v WHERE v.invite_id=i.id) view_count FROM invites i ORDER BY i.created_at DESC LIMIT 200')).rows;
 res.json({stats:s,daily,users,invites});
}));
app.post('/api/admin/users/:id/block',...admin,requireWrite,run(async(req,res)=>{
 if(String(req.params.id)===ADMIN_ID)return res.status(400).json({error:'Adminni bloklash mumkin emas'});
 const blocked=req.body?.blocked===true;await db.q('UPDATE users SET blocked=$1 WHERE id=$2',[blocked,req.params.id]);
 await db.q('INSERT INTO audit_logs(actor,action,target) VALUES($1,$2,$3)',[req.user.id,blocked?'block_user':'unblock_user',req.params.id]);res.json({ok:true});
}));
app.post('/api/admin/invites/:id/delete',...admin,requireWrite,run(async(req,res)=>{
 await db.q('DELETE FROM invites WHERE id=$1',[req.params.id]);await db.q('INSERT INTO audit_logs(actor,action,target) VALUES($1,$2,$3)',[req.user.id,'delete_invite',req.params.id]);res.json({ok:true});
}));
app.post('/api/admin/invites/:id/toggle',...admin,requireWrite,run(async(req,res)=>{
 await db.q('UPDATE invites SET off=NOT off WHERE id=$1',[req.params.id]);await db.q('INSERT INTO audit_logs(actor,action,target) VALUES($1,$2,$3)',[req.user.id,'toggle_invite',req.params.id]);res.json({ok:true});
}));
app.get('/api/admin/logs',...admin,run(async(req,res)=>res.json((await db.q('SELECT * FROM audit_logs ORDER BY id DESC LIMIT 200')).rows)));
app.use((err,req,res,next)=>{console.error('Server error:',err.code||err.name||'unknown');if(res.headersSent)return next(err);res.status(err.status||500).json({error:err.status===413?'Fayl juda katta':'Server xatosi'});});
const sessions=new Map();
function ask(ctx,step){const s=sessions.get(ctx.chat.id);if(!s)return; s.step=step;
 const questions={from:'✍️ Kim nomidan taklif? Ism(lar)ni kiriting',to:'💌 Mehmonning ismi? (to‘y uchun /skip)',when:'📆 Sana: 25.12.2026 19:00',where:'📍 Manzil? (/skip)',msg:'💬 Xabar matni? (/skip)',photo:'🖼 Rasm yuboring yoki /skip'};
 if(step==='style')return ctx.reply('🎨 Shablonni tanlang',Markup.inlineKeyboard([[Markup.button.callback('🌹 Romantik','st:1'),Markup.button.callback('👑 Klassik','st:2')],[Markup.button.callback('⚡ Zamonaviy','st:3')]]));
 return ctx.reply(questions[step]);
}
const steps=['from','to','when','where','msg','photo','style'];
function advance(ctx){const s=sessions.get(ctx.chat.id);if(s)ask(ctx,steps[steps.indexOf(s.step)+1]);}
async function finish(ctx){const s=sessions.get(ctx.chat.id);if(!s)return;
 let d;try{d=validate(s.d);}catch(e){return ctx.reply('❌ '+e.message+' /yangi bilan qayta boshlang');}
 d.id=newId();d.owner=ctx.from.id;await db.saveInvite(d);sessions.delete(ctx.chat.id);
 return ctx.reply('🎉 Taklifnoma tayyor!\n'+url(d.id),Markup.inlineKeyboard([[Markup.button.url('📤 Ulashish','https://t.me/share/url?url='+encodeURIComponent(url(d.id)))]]));
}
if(bot){
 bot.use(async(ctx,next)=>{if(ctx.from){const ok=await db.upsertUser(ctx.from);if(!ok)return;}return next();});
 bot.catch(e=>console.error('Bot xato:',e.code||e.message));
 const start=ctx=>{sessions.set(ctx.chat.id,{step:'dir',d:{dir:'bq',occ:'toy',style:1}});return ctx.reply('💌 Taklif Qil platformasiga xush kelibsiz!\nTadbir turini tanlang:',Markup.inlineKeyboard(Object.entries(OCC).map(([id,o])=>[Markup.button.callback(o.n,'occ:'+id)]).concat(isHttps?[[Markup.button.webApp('📱 Mini App',BASE+'/app')]]:[])));};
 bot.start(start);bot.command('yangi',start);
 bot.command('mening',async ctx=>{const a=await db.listInvites(ctx.from.id);ctx.reply(a.length?(await Promise.all(a.slice(0,20).map(async i=>`${OCC[i.occ]?.n||'Taklif'} · ${i.dateText}\n${url(i.id)}\n✅ ${(await db.rsvpCounts(i.id)).yes}`))).join('\n\n'):'Hali taklifnoma yo‘q. /yangi');});
 bot.command('admin',ctx=>String(ctx.from.id)===ADMIN_ID?ctx.reply('Admin panel: '+BASE+'/admin'):ctx.reply('Ruxsat yo‘q'));
 bot.command('skip',ctx=>{const s=sessions.get(ctx.chat.id);if(!s||!['to','where','msg','photo'].includes(s.step)||(s.step==='to'&&s.d.occ!=='toy'))return ctx.reply('Bu bosqichni o‘tkazib bo‘lmaydi');advance(ctx);});
 bot.action(/^occ:(\w+)$/,ctx=>{const s=sessions.get(ctx.chat.id);if(!s||!OCC[ctx.match[1]])return ctx.answerCbQuery();s.d.occ=ctx.match[1];ctx.answerCbQuery();ask(ctx,'from');});
 bot.action(/^st:([123])$/,async ctx=>{const s=sessions.get(ctx.chat.id);if(!s)return ctx.answerCbQuery();s.d.style=Number(ctx.match[1]);await ctx.answerCbQuery();await finish(ctx);});
 bot.on('text',ctx=>{const s=sessions.get(ctx.chat.id);if(!s)return start(ctx);const t=clean(ctx.message.text,400);if(s.step==='when'){if(!parseWhen(t))return ctx.reply('Format: 25.12.2026 19:00');s.d.when=t;}else if(['from','to','where','msg'].includes(s.step))s.d[s.step]=t;else return ctx.reply('Tugmani tanlang yoki rasm yuboring');advance(ctx);});
 bot.on('photo',async ctx=>{const s=sessions.get(ctx.chat.id);if(!s||s.step!=='photo')return ctx.reply('Rasm bosqichida yuboring');
 try{const photo=ctx.message.photo.at(-1),fileUrl=await ctx.telegram.getFileLink(photo.file_id),resp=await fetch(fileUrl);const buf=Buffer.from(await resp.arrayBuffer());if(buf.length>6*1024*1024||buf[0]!==255||buf[1]!==216)return ctx.reply('JPEG rasm kerak (6 MB gacha)');
 const id=crypto.randomBytes(16).toString('hex')+'.jpg';await db.q('INSERT INTO photos(id,owner,content) VALUES($1,$2,$3)',[id,ctx.from.id,buf]);s.d.photo=id;advance(ctx);}catch(e){ctx.reply('Rasmni olib bo‘lmadi');}});
}
async function main(){db.connect();await db.migrate();app.listen(PORT,'0.0.0.0',()=>console.log('Taklif Qil port',PORT));if(bot)await bot.launch().then(()=>console.log('Telegram bot connected')).catch(()=>console.error('Bot launch failed'));else console.warn('BOT_TOKEN yo‘q: bot o‘chirilgan');}
if(require.main===module)main().catch(e=>{console.error('Startup failed:',e.code||e.message);process.exitCode=1;});
process.once('SIGTERM',()=>{if(bot&&bot.botInfo)bot.stop('SIGTERM');});
module.exports={app,main};
