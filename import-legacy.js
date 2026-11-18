'use strict';
// Usage: DATA_DIR=/path/to/old/data node scripts/import-legacy.js
// Idempotent for invitation/user IDs. Run once before switching traffic.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const db=require('./db');
const dir=process.env.DATA_DIR;
if(!dir){console.error('DATA_DIR kerak');process.exit(1);}
const read=n=>{try{return JSON.parse(fs.readFileSync(path.join(dir,n),'utf8'));}catch(e){console.error(n,'o‘qilmadi:',e.message);return null;}};
(async()=>{db.connect();await db.migrate();const users=read('users.json')||{},invites=read('invites.json')||{};
let userCount=0,inviteCount=0;
for(const [id,u] of Object.entries(users)){if(!/^\d+$/.test(id))continue;await db.q(`INSERT INTO users(id,name,username) VALUES($1,$2,$3) ON CONFLICT(id) DO NOTHING`,[id,u.name||'',u.username||'']);userCount++;}
for(const [id,i] of Object.entries(invites)){
 if(!/^[a-f0-9]{10,40}$/i.test(id)||!/^\d+$/.test(String(i.owner)))continue;
 await db.q(`INSERT INTO users(id,name) VALUES($1,'Import qilingan foydalanuvchi') ON CONFLICT(id) DO NOTHING`,[String(i.owner)]);
 const d={...i};delete d.rsvp;delete d.createdAt;delete d.off;delete d.owner;delete d.id;
 if(!d.when&&d.iso){const m=String(d.iso).match(/^(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d)/);if(m)d.when=`${m[3]}.${m[2]}.${m[1]} ${m[4]}:${m[5]}`;}
 if(d.photo){const old=path.join(dir,'photos',path.basename(d.photo));if(fs.existsSync(old)){
 const name=crypto.randomBytes(16).toString('hex')+'.jpg';const content=fs.readFileSync(old);await db.q('INSERT INTO photos(id,owner,content) VALUES($1,$2,$3) ON CONFLICT DO NOTHING',[name,i.owner,content]);d.photo=name;
 }else delete d.photo;}
 const result=await db.q('INSERT INTO invites(id,owner,data,off) VALUES($1,$2,$3,$4) ON CONFLICT(id) DO NOTHING RETURNING id',[id,i.owner,JSON.stringify(d),!!i.off]);
 if(result.rowCount){inviteCount++;for(const r of (i.rsvp||[])){if(!['yes','no'].includes(r.a))continue;await db.q('INSERT INTO rsvps(invite_id,answer,guest_name) VALUES($1,$2,$3)',[id,r.a,'']);}}
}
console.log('Import natijasi:',userCount,'foydalanuvchi va',inviteCount,'taklifnoma.');process.exit(0);
})().catch(e=>{console.error('Import xatosi:',e.code||e.message);process.exit(1)});
