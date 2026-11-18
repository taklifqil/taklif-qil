'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {checkMini,checkLogin}=require('./auth');
const token='987654:fake-test-token',now=Date.now(),auth_date=Math.floor(now/1000);
function mini(user){const p=new URLSearchParams({user:JSON.stringify(user),auth_date:String(auth_date),query_id:'AAE'});const check=[...p].sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>k+'='+v).join('\n');const s=crypto.createHmac('sha256','WebAppData').update(token).digest();p.set('hash',crypto.createHmac('sha256',s).update(check).digest('hex'));return p.toString();}
test('Mini App valid signed user',()=>assert.equal(checkMini(mini({id:123,first_name:'A'}),token,now).id,123));
test('Mini App rejects altered user',()=>assert.throws(()=>checkMini(mini({id:123}).replace('123','999'),token,now)));
test('Mini App rejects expired auth',()=>assert.throws(()=>checkMini(mini({id:123}),token,now+4000000)));
test('Mini App rejects missing token',()=>assert.throws(()=>checkMini(mini({id:123}),'',now)));
test('Login widget verifies Telegram hash',()=>{const data={id:'123',first_name:'Test',auth_date:String(auth_date)};const text=Object.entries(data).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>k+'='+v).join('\n');data.hash=crypto.createHmac('sha256',crypto.createHash('sha256').update(token).digest()).update(text).digest('hex');assert.equal(checkLogin(data,token,now).id,123);assert.throws(()=>checkLogin({...data,id:'321'},token,now));});
