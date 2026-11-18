'use strict';
const crypto = require('node:crypto');
function safeEqual(a,b) {const x=Buffer.from(String(a),'utf8'),y=Buffer.from(String(b),'utf8');return x.length===y.length && crypto.timingSafeEqual(x,y);}
function checkMini(initData,token,now=Date.now()) {
 if (!token||typeof initData!=='string'||initData.length>8192) throw Error('Telegram imzosi yo‘q');
 const p=new URLSearchParams(initData),hash=p.get('hash');if (!hash||!/^[a-f\d]{64}$/i.test(hash)) throw Error('Telegram hash noto‘g‘ri');p.delete('hash');
 const t=Number(p.get('auth_date'));if(!Number.isSafeInteger(t)||t>now/1000+60||now/1000-t>3600) throw Error('Telegram sessiyasi eskirgan');
 const check=[...p.entries()].sort((a,b)=>a[0].localeCompare(b[0])).map(([k,v])=>`${k}=${v}`).join('\n');
 const secret=crypto.createHmac('sha256','WebAppData').update(token).digest();
 const computed=crypto.createHmac('sha256',secret).update(check).digest('hex');if(!safeEqual(computed,hash)) throw Error('Telegram imzosi noto‘g‘ri');
 const user=JSON.parse(p.get('user')||'null');if(!user||!Number.isSafeInteger(user.id)||user.id<=0) throw Error('Foydalanuvchi noto‘g‘ri');return user;
}
function checkLogin(payload,token,now=Date.now()) {
 const {hash,...rest}=payload; if(!token||!hash||!/^[a-f\d]{64}$/i.test(hash)) throw Error('Login hash yo‘q');
 const t=Number(rest.auth_date);if(!Number.isSafeInteger(t)||t>now/1000+60||now/1000-t>3600) throw Error('Login eskirgan');
 const msg=Object.entries(rest).filter(([,v])=>v!==undefined&&v!==null).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>`${k}=${v}`).join('\n');
 const expected=crypto.createHmac('sha256',crypto.createHash('sha256').update(token).digest()).update(msg).digest('hex');
 if(!safeEqual(expected,hash))throw Error('Login imzosi noto‘g‘ri');
 const id=Number(rest.id);if(!Number.isSafeInteger(id)||id<=0)throw Error('ID noto‘g‘ri');return {id,first_name:rest.first_name||'',last_name:rest.last_name||'',username:rest.username||''};
}
module.exports={checkMini,checkLogin};
