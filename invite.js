/* Taklifnoma: konvert animatsiyasi + zarrachalar. D — server.js dan keladigan ma'lumot */
(function(){
var D=window.D,$=function(i){return document.getElementById(i)};
var mode=D.mode,isU=D.occ==='uch',opened=false;
var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches || localStorage.getItem('tq_motion')==='off';

/* yirtilgan chet */
(function(){var pts=[],n=34;for(var i=n;i>=0;i--){pts.push((i/n*100).toFixed(1)+'% '+(62+Math.random()*34-(i%2?10:0)).toFixed(0)+'%')}
$('tear').style.clipPath='polygon(0 0,100% 0,100% 70%,'+pts.join(',')+')'})();

/* zarrachalar */
var cv=$('fx'),cx=cv.getContext('2d'),P=[],W=0,H=0,dpr=Math.min(devicePixelRatio||1,2);
function size(){W=innerWidth;H=innerHeight;cv.width=W*dpr;cv.height=H*dpr;cx.setTransform(dpr,0,0,dpr,0,0)}
addEventListener('resize',size);size();
var R=function(a,b){return a+Math.random()*(b-a)};
var BDAY=['#FF5A00','#FFC93C','#2EC4B6','#FF3D81','#8E7CFF','#EDE7DB'];
var WED=['#D8B26E','#F0D5CC','#EDE7DB','#E8A6A1','#F6E7B8'];
var LOVE=['#FF5A00','#E8A6A1','#F0D5CC','#D8B26E','#FF7A9C'];
var w=mode==='wedding',PAL=isU?LOVE:(w?WED:BDAY);
function make(type,x,y,burst){
  var a=burst?R(-Math.PI*.95,-Math.PI*.05):Math.PI/2,sp=burst?R(w?4:7,w?11:18):R(.3,1);
  return{t:type,x:x,y:y,vx:Math.cos(a)*sp+(burst?0:R(-.4,.4)),vy:Math.sin(a)*sp,g:w?.06:.28,drag:.985,
    r:R(4,10),rot:R(0,6.28),vr:R(-.12,.12),ph:R(0,6.28),life:burst?R(180,300):R(500,800),age:0,
    col:PAL[Math.floor(Math.random()*PAL.length)],sway:w?R(.4,1.2):0}
}
function burst(){
  var r=$('env').getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height*.35,N=reduce?0:(w?80:110);
  for(var i=0;i<N;i++){
    var k=Math.random(),t;
    if(isU)t=k<.6?'heart':k<.85?'spark':'circle';
    else if(w)t=k<.55?'petal':k<.85?'spark':'circle';
    else t=k<.45?'rect':k<.7?'star':k<.88?'circle':'balloon';
    var p=make(t,x,y,true);
    if(t==='balloon'){p.vy=R(-3,-1.5);p.vx=R(-2,2);p.g=-.02;p.r=R(14,22);p.life=500}
    P.push(p);
  }
  if(!reduce)ambient();
}
var amb=null;
function ambient(){
  clearInterval(amb);
  amb=setInterval(function(){
    if(isU)P.push(make(Math.random()<.7?'heart':'spark',R(0,W),-20,false));
    else if(w)P.push(make(Math.random()<.8?'petal':'spark',R(0,W),-20,false));
    else if(Math.random()<.5)P.push(make('rect',R(0,W),-20,false));
  },w?260:320);
}
function star(c,r){c.beginPath();for(var i=0;i<10;i++){var a=i*Math.PI/5-Math.PI/2,d=i%2?r*.45:r;c.lineTo(Math.cos(a)*d,Math.sin(a)*d)}c.closePath();c.fill()}
function heart(c,s){c.beginPath();c.moveTo(0,s*.35);c.bezierCurveTo(-s*1.1,-s*.4,-s*.5,-s*1.1,0,-s*.45);c.bezierCurveTo(s*.5,-s*1.1,s*1.1,-s*.4,0,s*.35);c.fill()}
function draw(){
  cx.clearRect(0,0,W,H);
  for(var i=P.length-1;i>=0;i--){
    var p=P[i];p.age++;p.vx*=p.drag;p.vy=p.vy*p.drag+p.g;p.ph+=.04;
    p.x+=p.vx+Math.sin(p.ph)*p.sway;p.y+=p.vy;p.rot+=p.vr;
    var f=Math.min(1,(p.life-p.age)/40);
    if(p.age>p.life||p.y>H+40||p.y<-200||f<=0){P.splice(i,1);continue}
    cx.save();cx.globalAlpha=f;cx.translate(p.x,p.y);cx.rotate(p.rot);cx.fillStyle=p.col;
    if(p.t==='rect'){cx.scale(1,Math.cos(p.ph*2));cx.fillRect(-p.r/2,-p.r/4,p.r,p.r/2)}
    else if(p.t==='circle'){cx.beginPath();cx.arc(0,0,p.r/2.4,0,6.28);cx.fill()}
    else if(p.t==='star')star(cx,p.r);
    else if(p.t==='heart'){cx.rotate(-p.rot*.8);heart(cx,p.r*1.3)}
    else if(p.t==='petal'){cx.scale(1,.55+.45*Math.cos(p.ph*1.5));cx.beginPath();cx.ellipse(0,0,p.r*1.2,p.r*.65,0,0,6.28);cx.fill()}
    else if(p.t==='spark'){var s=p.r*(.6+.5*Math.sin(p.ph*3));cx.shadowColor=p.col;cx.shadowBlur=10;cx.fillRect(-s/6,-s,s/3,s*2);cx.fillRect(-s,-s/6,s*2,s/3)}
    else if(p.t==='balloon'){cx.rotate(-p.rot);cx.beginPath();cx.ellipse(0,0,p.r*.8,p.r,0,0,6.28);cx.fill();
      cx.strokeStyle='rgba(237,231,219,.5)';cx.lineWidth=1;cx.beginPath();cx.moveTo(0,p.r);cx.quadraticCurveTo(6,p.r+14,0,p.r+28);cx.stroke()}
    cx.restore();
  }
}
if(!reduce&&window.gsap)gsap.ticker.add(draw);

/* konvert ochilishi */
function showInvite(){
  if(!window.gsap){$('invite').style.visibility='visible';$('invite').style.opacity='1';$('invite').style.transform='none';return;}
  gsap.set('#invite',{visibility:'visible'});
  gsap.fromTo('#invite',{opacity:0,y:60,scale:.88,rotationX:12},{opacity:1,y:0,scale:1,rotationX:0,duration:reduce?.01:.9,ease:'back.out(1.2)'});
  gsap.from('#invite > *',{opacity:0,y:14,stagger:.08,duration:reduce?.01:.6,delay:.35,ease:'power2.out'});
}
function openEnv(){
  if(opened)return;opened=true;
  if(!window.gsap){$('envBtn').style.display='none';showInvite();return;}
  var b=$('envBtn');b.classList.remove('idle');b.disabled=true;gsap.set(b,{y:0,rotation:0});
  if(reduce){b.style.display='none';burst();showInvite();return}
  gsap.timeline()
    .to('#hint',{opacity:0,duration:.2})
    .to('#env',{x:'+=5',duration:.05,repeat:5,yoyo:true,ease:'none'})
    .to('#tear',{rotation:-8,x:'-3%',duration:.18,ease:'power2.in'},'<')
    .to('#tear',{x:'130%',y:-90,rotation:38,opacity:0,duration:.8,ease:'power3.in'},'>-0.02')
    .to('#flap',{rotationX:-180,duration:.7,ease:'power2.inOut',
       onUpdate:function(){if(this.progress()>.5)gsap.set('#flap',{zIndex:1,opacity:0})}},'-=.35')
    .to('#flapIn',{rotationX:-180,duration:.7,ease:'power2.inOut',transformOrigin:'50% 0',opacity:1},'<')
    .to('#seal',{scale:.2,opacity:0,duration:.3},'<')
    .to('#letter',{y:'-62%',duration:.8,ease:'back.out(1.3)'},'-=.15')
    .add(burst,'-=.5')
    .to('#letter',{scale:1.06,duration:.25,yoyo:true,repeat:1},'<')
    .to('#env',{y:'110vh',rotation:-6,duration:.9,ease:'power3.in'},'+=.3')
    .add(showInvite,'-=.55');
}
$('envBtn').addEventListener('click',openEnv);

/* taymer */
function tick(){
  var d=new Date(D.iso)-new Date(),c=$('cd');
  if(!c)return;if(isNaN(d)||d<0){c.style.display='none';return}
  var v=[[86400000,'kun'],[3600000,'soat'],[60000,'daqiqa'],[1000,'soniya']],h='';
  for(var k=0;k<4;k++){var n=Math.floor(d/v[k][0]);d-=n*v[k][0];h+='<div><b>'+n+'</b><span>'+v[k][1]+'</span></div>'}
  c.innerHTML=h;
}
tick();setInterval(tick,1000);

/* RSVP */
if(localStorage.getItem('tq_rsvp_'+D.id)){$('rsvp')&&($('rsvp').style.display='none');$('ar')&&($('ar').style.display='none');$('thanks')&&($('thanks').style.display='block');}
window.rsvp=async function(a){
  const key='tq_rsvp_'+D.id; if(localStorage.getItem(key)){alert('Siz bu taklifnomaga oldin javob bergansiz.');return;}
  var buttons=document.querySelectorAll('#rsvp button,#ar button');
  buttons.forEach(function(b){b.disabled=true});
  try {
    var response=await fetch('/api/rsvp/'+encodeURIComponent(D.id),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({answer:a,name:$('guestName')?.value||''})});
    if(!response.ok){const j=await response.json().catch(()=>({}));throw new Error(j.error||(response.status===429?'Javob yuborilgan.': 'Javobni saqlashda xatolik'));}localStorage.setItem(key,a);
    var ar=$('ar'),rs=$('rsvp');if(ar)ar.style.display='none';if(rs)rs.style.display='none';
    var cn=$('cn');if(cn)cn.style.display='none';
    $('thanks').style.display='block';if(!reduce&&window.gsap)gsap.from('#thanks',{scale:.8,opacity:0,duration:.5,ease:'back.out(2)'});
    if(a==='yes'&&!reduce){var r=$('thanks').getBoundingClientRect();for(var i=0;i<45;i++)P.push(make(isU?'heart':(w?'petal':'rect'),r.left+r.width/2,r.top,true));}
  } catch(e) {alert(e.message||'Internet yoki server xatosi. Qayta urinib ko‘ring.');buttons.forEach(function(b){b.disabled=false});}
};
/* "Yo'q" tugmasi qochadi (faqat uchrashuv) */
var no=$('no');
if(isU&&no){
  var t=0,M=['Aniqmi?','Juda iltimos qilsam-chi?','Yana bir bor o‘ylab ko‘rasizmi?','Yuragim sinadi…','Oxirgi marta so‘rayman!','Mayli, tugma yo‘qoldi 😄'];
  var run=function(e){e.preventDefault();t++;var ar=$('ar');
    no.style.left=R(0,ar.clientWidth-90)+'px';no.style.top=R(60,ar.clientHeight-40)+'px';
    $('cn').textContent=M[Math.min(t-1,M.length-1)];if(t>=M.length)no.style.display='none'};
  no.addEventListener('pointerenter',run);no.addEventListener('touchstart',run,{passive:false});no.addEventListener('click',run);
}
})();
