'use strict';
const {parseWhen,OCC,DIRS}=require('./invitation');
const clean=(x,n=400)=>typeof x==='string'?x.trim().slice(0,n):'';
function validate(b) {
 if(!b||typeof b!=='object')throw Error('Ma’lumot kerak');
 if(!OCC[b.occ]||!DIRS[b.dir])throw Error('Tadbir turi noto‘g‘ri');
 const from=clean(b.from,160),to=clean(b.to,160);if(!from||(!to&&b.occ!=='toy'))throw Error('Ismlar kiritilmagan');
 const when=clean(b.when,40),w=parseWhen(when);if(!w)throw Error('Sana va vaqt noto‘g‘ri');
 const d={occ:b.occ,dir:b.dir,from,to,when,iso:w.iso,dateText:w.text,time:w.time,where:clean(b.where,300),msg:clean(b.msg,1200),style:[1,2,3].includes(Number(b.style))?Number(b.style):1};
 if(b.photo){if(!/^[a-f0-9]{32}\.jpg$/.test(b.photo))throw Error('Rasm noto‘g‘ri');d.photo=b.photo;}
 return d;
}
module.exports={validate,clean};
