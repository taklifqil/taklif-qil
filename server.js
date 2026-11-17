const { Telegraf, Markup } = require('telegraf');
const express = require('express');
const fs = require('fs'), path = require('path'), crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const BASE = (process.env.BASE_URL || (process.env.RAILWAY_PUBLIC_DOMAIN ? 'https://' + process.env.RAILWAY_PUBLIC_DOMAIN : 'http://localhost:' + PORT)).replace(/\/$/, '');
const DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
fs.mkdirSync(path.join(DIR, 'photos'), { recursive: true });
const DB = path.join(DIR, 'invites.json');
let invites = {};
try { invites = JSON.parse(fs.readFileSync(DB, 'utf8')); } catch (e) {}
const atomic = (f, o) => { fs.writeFileSync(f + '.tmp', JSON.stringify(o)); fs.renameSync(f + '.tmp', f); };
const save = () => atomic(DB, invites);
const UDB = path.join(DIR, 'users.json');
let users = {};
try { users = JSON.parse(fs.readFileSync(UDB, 'utf8')); } catch (e) {}
const saveU = () => atomic(UDB, users);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const MON = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'];
const DAY = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
const OCC = {
  toy:  { n: '💍 To‘y', t: 'Sizni to‘yimizga taklif qilamiz', emo: ['💍', '🤍', '✨', '🕊'], lab: 'To‘y taklifnomasi' },
  tug:  { n: '🎂 Tug‘ilgan kun', t: 'Tug‘ilgan kunimga taklif', emo: ['🎈', '🎉', '🎂', '🎁'], lab: 'Tug‘ilgan kun' },
  uch:  { n: '❤️ Uchrashuv', t: 'Uchrashamizmi?', emo: ['❤', '✨', '💗'], lab: 'Faqat siz uchun' },
  yub:  { n: '🥂 Yubiley', t: 'Yubileyga taklif', emo: ['🥂', '✨', '🏆'], lab: 'Yubiley' },
  bosh: { n: '✨ Boshqa', t: 'Sizni taklif qilaman', emo: ['✨', '💌', '🌟'], lab: 'Taklifnoma' }
};
const DIRS = { bb: '👦→👦 Boladan bolaga', bq: '👦→👩 Boladan qizga', qb: '👩→👦 Qizdan bolaga', qq: '👩→👩 Qizdan qizga' };
const PAL = { bb: ['#1f3a5f', '#e9f0fa', '#c9a24b'], bq: ['#8e2f44', '#f7ece8', '#c9a24b'], qb: ['#a8456b', '#fcedf2', '#c9a24b'], qq: ['#6b3fa0', '#f3ecfa', '#d4a84b'] };
const FONTS = {
  1: ['Great Vibes', 'Cormorant Garamond', 'Great+Vibes&family=Cormorant+Garamond:wght@400;600'],
  2: ['Playfair Display', 'Poppins', 'Playfair+Display:ital,wght@0,600;1,500&family=Poppins:wght@400;500'],
  3: ['Poppins', 'Poppins', 'Poppins:wght@400;700;800']
};

function parseWhen(t) {
  const m = /^(\d{1,2})\.(\d{1,2})\.(\d{4})\s+(\d{1,2}):(\d{2})$/.exec(t.trim());
  if (!m) return null;
  const [, d, mo, y, h, mi] = m.map(Number);
  if (mo < 1 || mo > 12 || d < 1 || d > 31 || h > 23 || mi > 59) return null;
  const p = n => String(n).padStart(2, '0');
  return { iso: `${y}-${p(mo)}-${p(d)}T${p(h)}:${p(mi)}:00+05:00`, text: `${d}-${MON[mo - 1]}, ${DAY[new Date(Date.UTC(y, mo - 1, d)).getUTCDay()]}`, time: `${p(h)}:${p(mi)}` };
}

/* ---------- Invitation page ---------- */
function page(i) {
  const p = PAL[i.dir] || PAL.bq, F = FONTS[i.style] || FONTS[1], O = OCC[i.occ] || OCC.bosh;
  const D = JSON.stringify({ iso: i.iso, emo: O.emo, id: i.id, occ: i.occ, title: O.t }).replace(/</g, '\\u003c');
  const g = d => d.toISOString().replace(/[-:]|\.\d{3}/g, '');
  const t0 = new Date(i.iso), t1 = new Date(t0.getTime() + 3 * 3600000);
  const cal = 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent(O.lab + ': ' + i.from) + '&dates=' + g(t0) + '/' + g(t1) + '&location=' + encodeURIComponent(i.where || '');
  const map = i.where ? 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(i.where) : '';
  const isU = i.occ === 'uch';
  return `<!doctype html><html lang="uz"><head><meta charset="utf-8"><title>${esc(O.lab)} — ${esc(i.from)}</title>
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta property="og:title" content="${esc(O.t)}"><meta property="og:description" content="${esc(i.from)} sizni taklif qilmoqda 💌">
${i.photo ? '<meta property="og:image" content="' + BASE + '/p/' + esc(i.photo) + '">' : ''}
<link href="https://fonts.googleapis.com/css2?family=${F[2]}&display=swap" rel="stylesheet">
<style>
:root{--a:${p[0]};--bg:${p[1]};--g:${p[2]};--h:'${F[0]}',serif;--b:'${F[1]}',sans-serif}
*{box-sizing:border-box}body{margin:0;min-height:100vh;background:radial-gradient(circle at 20% 10%,#fff,var(--bg));font-family:var(--b);color:#2b2024;display:flex;justify-content:center;padding:18px;overflow-x:hidden}
#env{position:fixed;inset:0;background:var(--a);display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;z-index:50;cursor:pointer;transition:transform .9s,opacity .9s}
#env .e{font-size:5rem;animation:bob 1.6s infinite}#env p{letter-spacing:.2em;text-transform:uppercase;font-size:.8rem}
#env.go{transform:translateY(-100%);opacity:0;pointer-events:none}
@keyframes bob{50%{transform:translateY(-12px) scale(1.08)}}
.card{width:100%;max-width:460px;background:#fff;border-radius:28px;padding:30px 24px;text-align:center;box-shadow:0 24px 60px rgba(0,0,0,.15);border:2px solid var(--g);position:relative;opacity:0;transform:translateY(30px);transition:all 1s .5s}
.card.on{opacity:1;transform:none}
.ph{width:150px;height:150px;border-radius:50%;object-fit:cover;border:4px solid var(--g);box-shadow:0 0 0 8px rgba(255,255,255,.8),0 0 0 10px var(--g);animation:glow 3s infinite}
@keyframes glow{50%{box-shadow:0 0 0 8px #fff,0 0 28px 12px var(--g)}}
.lab{font-size:.72rem;letter-spacing:.25em;text-transform:uppercase;color:var(--a);font-weight:600;margin:18px 0 6px}
h1{font-family:var(--h);font-weight:500;font-size:2.2rem;color:var(--a);margin:6px 0}
.nm{font-family:var(--h);font-size:2.6rem;color:var(--g);margin:4px 0 10px;line-height:1.1}
p{line-height:1.6;margin:10px 0;color:#5a4a4e}
.box{background:var(--bg);border-radius:18px;padding:14px;margin:16px 0;text-align:left;line-height:1.9}
.cd{display:flex;gap:8px;justify-content:center;margin:14px 0}.cd div{background:var(--a);color:#fff;border-radius:12px;padding:8px 10px;min-width:58px}.cd b{display:block;font-size:1.3rem}.cd span{font-size:.6rem;letter-spacing:.1em;text-transform:uppercase}
.btn{display:block;width:100%;border:0;border-radius:999px;padding:14px;margin-top:10px;background:var(--a);color:#fff;font:600 .85rem var(--b);letter-spacing:.1em;text-decoration:none;cursor:pointer}
.btn.o{background:none;color:var(--a);border:1px solid var(--a)}
.arena{position:relative;height:150px}.arena .btn{position:absolute;width:auto;padding:14px 38px;left:50%;top:20px;transform:translateX(-50%);transition:transform .2s}
#no{left:20px;top:100px;transform:none;background:#fff;color:#333;border:1px solid #ccc;padding:9px 16px;transition:all .25s}
.f{position:fixed;bottom:-40px;pointer-events:none;animation:fl linear forwards;z-index:5}
@keyframes fl{to{transform:translateY(-115vh) rotate(60deg);opacity:.2}}
.sm{font-size:.7rem;color:#999;margin-top:18px}
</style></head><body>
<div id="env"><div class="e">${isU ? '💌' : '✉️'}</div><p>Ochish uchun bosing</p></div>
<div class="card" id="card">
${i.photo ? '<img class="ph" src="/p/' + esc(i.photo) + '" alt="">' : '<div style="font-size:4rem">' + O.emo[0] + '</div>'}
<div class="lab">${esc(O.lab)}</div>
${i.to && !isU ? '<p>Hurmatli <b>' + esc(i.to) + '</b>,</p>' : ''}
<h1>${isU ? esc(i.to) + ', uchrashamizmi?' : esc(O.t)}</h1>
${isU ? '' : '<div class="nm">' + esc(i.from) + '</div>'}
${i.msg ? '<p>' + esc(i.msg).replace(/\n/g, '<br>') + '</p>' : ''}
<div class="box">📅 <b>${esc(i.dateText)}</b><br>🕒 <b>${esc(i.time)}</b>${i.where ? '<br>📍 ' + esc(i.where) : ''}</div>
<div class="cd" id="cd"></div>
${isU ? '<div class="arena" id="ar"><button class="btn" id="ha" onclick="rsvp(\'yes\')">♥ HA</button><button class="btn" id="no">Yo‘q</button></div><div class="sm" id="cn"></div>'
 : '<button class="btn" onclick="rsvp(\'yes\')">✅ BORAMAN</button><button class="btn o" onclick="rsvp(\'no\')">Kela olmayman</button>'}
<div id="ty" style="display:none"><p style="color:var(--a);font-size:1.2rem"><b>Javobingiz yuborildi 💖</b></p></div>
${map ? '<a class="btn o" target="_blank" rel="noopener" href="' + map + '">📍 XARITADA KO‘RISH</a>' : ''}
<a class="btn o" target="_blank" rel="noopener" href="${cal}">📅 KALENDARGA QO‘SHISH</a>
<div class="sm">${esc(i.from)} tomonidan ilqlik bilan yaratildi</div>
</div>
<script>
var D=${D};
function fly(n){for(var k=0;k<n;k++){var s=document.createElement('span');s.className='f';s.textContent=D.emo[k%D.emo.length];s.style.left=Math.random()*100+'vw';s.style.fontSize=(14+Math.random()*26)+'px';s.style.animationDuration=(4+Math.random()*5)+'s';document.body.appendChild(s);(function(x){setTimeout(function(){x.remove()},9500)})(s)}}
document.getElementById('env').onclick=function(){this.classList.add('go');document.getElementById('card').classList.add('on');fly(18);setInterval(function(){fly(2)},1200)};
function tick(){var d=new Date(D.iso)-new Date(),c=document.getElementById('cd');if(isNaN(d)||d<0){c.style.display='none';return}var v=[[86400000,'kun'],[3600000,'soat'],[60000,'daqiqa'],[1000,'soniya']],h='';for(var k=0;k<4;k++){var n=Math.floor(d/v[k][0]);d-=n*v[k][0];h+='<div><b>'+n+'</b><span>'+v[k][1]+'</span></div>'}c.innerHTML=h}
tick();setInterval(tick,1000);
function rsvp(a){fetch('/api/rsvp/'+D.id,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({answer:a})}).catch(function(){});
 ['ar'].forEach(function(x){var e=document.getElementById(x);if(e)e.style.display='none'});document.querySelectorAll('.btn:not(.o)').forEach(function(b){b.style.display='none'});
 document.querySelectorAll('.btn.o').forEach(function(b){if(!b.href)b.style.display='none'});document.getElementById('ty').style.display='block';if(a==='yes')fly(40)}
var no=document.getElementById('no'),t=0,M=['Aniqmi?','Juda iltimos qilsam-chi?','Yana bir bor o‘ylab ko‘rasizmi?','Yuragim sinadi…','Oxirgi marta so‘rayman!','Mayli, tugma yo‘qoldi 😄'];
if(no){var run=function(e){e.preventDefault();t++;var ar=document.getElementById('ar');no.style.left=Math.random()*(ar.clientWidth-90)+'px';no.style.top=Math.random()*(ar.clientHeight-40)+'px';document.getElementById('cn').textContent=M[Math.min(t-1,M.length-1)];document.getElementById('ha').style.transform='translateX(-50%) scale('+Math.min(1+t*.12,1.9)+')';if(t>=6)no.style.display='none'};no.addEventListener('mouseenter',run);no.addEventListener('touchstart',run,{passive:false});no.addEventListener('click',run)}
</script></body></html>`;
}

/* ---------- Web ---------- */
const app = express();
app.use(express.json());
app.use('/p', express.static(path.join(DIR, 'photos'), { maxAge: '7d' }));
app.get('/', (q, r) => r.send('Taklifnoma boti ishlayapti 💌'));
app.get('/i/:id', (q, r) => { const i = invites[q.params.id]; if (!i) return r.status(404).send('Taklif topilmadi'); if (i.off) return r.status(410).send('Bu taklif faol emas'); r.send(page(i)); });
app.post('/api/rsvp/:id', (q, r) => {
  const i = invites[q.params.id]; if (!i) return r.sendStatus(404);
  if (i.off) return r.sendStatus(410);
  const a = q.body && q.body.answer === 'yes' ? 'yes' : 'no';
  i.rsvp = i.rsvp || []; if (i.rsvp.length >= 200) return r.sendStatus(429);
  i.rsvp.push({ a, at: Date.now() }); save();
  bot.telegram.sendMessage(i.owner, `🔔 Taklifingizga javob keldi!\n${a === 'yes' ? '✅ Keladi' : '❌ Kela olmaydi'}\n(${i.to || 'mehmon'} · ${i.dateText})`).catch(() => {});
  r.json({ ok: 1 });
});

/* ---------- Admin panel ---------- */
const ADMIN = process.env.ADMIN_PASSWORD;
const auth = (q, r, n) => {
  if (!ADMIN) return r.status(503).send('ADMIN_PASSWORD o‘rnatilmagan');
  const m = /^Basic (.+)$/.exec(q.headers.authorization || '');
  const pw = m ? Buffer.from(m[1], 'base64').toString().split(':').slice(1).join(':') : '';
  const a = Buffer.from(pw), b = Buffer.from(ADMIN);
  if (a.length === b.length && crypto.timingSafeEqual(a, b)) return n();
  r.set('WWW-Authenticate', 'Basic realm="Admin"').sendStatus(401);
};
const xhr = (q, r, n) => q.headers['x-admin'] === '1' ? n() : r.sendStatus(403);
const sleep = ms => new Promise(r => setTimeout(r, ms));
function adminPage() {
  const all = Object.values(invites).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  const yes = all.reduce((n, i) => n + (i.rsvp || []).filter(x => x.a === 'yes').length, 0);
  const no = all.reduce((n, i) => n + (i.rsvp || []).filter(x => x.a === 'no').length, 0);
  const wk = all.filter(i => Date.now() - (i.createdAt || 0) < 7 * 864e5).length;
  const byOcc = Object.keys(OCC).map(k => OCC[k].n + ': <b>' + all.filter(i => i.occ === k).length + '</b>').join(' · ');
  const rows = all.map(i => `<tr><td>${esc(OCC[i.occ] ? OCC[i.occ].n : i.occ)}</td><td>${esc(i.from)}${i.to ? ' → ' + esc(i.to) : ''}</td><td>${esc(i.dateText)} ${esc(i.time)}</td><td>${(i.rsvp || []).filter(x => x.a === 'yes').length}/${(i.rsvp || []).filter(x => x.a === 'no').length}</td><td>${i.createdAt ? new Date(i.createdAt).toLocaleDateString('ru-RU') : '-'}</td><td><a href="/i/${esc(i.id)}" target="_blank">ko‘rish</a> <button onclick="act('toggle','${esc(i.id)}')">${i.off ? 'Yoqish' : 'O‘chirish'}</button> <button onclick="if(confirm('O‘chirilsinmi?'))act('delete','${esc(i.id)}')">🗑</button></td></tr>`).join('');
  return `<!doctype html><html lang="uz"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Admin</title>
<style>body{font-family:system-ui;margin:0;padding:16px;background:#f4f1ee;color:#222}h1{margin:0 0 12px}.g{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px}.c{background:#fff;border-radius:14px;padding:14px}.c b{font-size:1.6rem;display:block}.w{overflow-x:auto;margin-top:14px}table{width:100%;border-collapse:collapse;background:#fff;border-radius:14px;font-size:.85rem}td,th{padding:9px;border-bottom:1px solid #eee;text-align:left;white-space:nowrap}button{cursor:pointer;border:1px solid #ccc;background:#fff;border-radius:8px;padding:4px 8px}textarea{width:100%;border-radius:10px;border:1px solid #ccc;padding:10px;font:inherit}.p{background:#8e2f44;color:#fff;border:0;padding:10px 18px;border-radius:999px;margin-top:8px}</style></head><body>
<h1>💌 Admin panel</h1>
<div class="g"><div class="c">Foydalanuvchilar<b>${Object.keys(users).length}</b></div><div class="c">Takliflar<b>${all.length}</b></div><div class="c">7 kunda<b>${wk}</b></div><div class="c">✅ Keladi<b>${yes}</b></div><div class="c">❌ Kelmaydi<b>${no}</b></div></div>
<p>${byOcc}</p>
<div class="c"><b style="font-size:1rem">📢 Hammaga xabar yuborish</b><textarea id="bm" rows="3" placeholder="Xabar matni"></textarea><button class="p" onclick="bc()">Yuborish</button> <span id="bs"></span></div>
<div class="w"><table><tr><th>Tur</th><th>Kim</th><th>Sana</th><th>✅/❌</th><th>Yaratilgan</th><th></th></tr>${rows || '<tr><td colspan=6>Hali taklif yo‘q</td></tr>'}</table></div>
<script>
function post(u,b){return fetch(u,{method:'POST',headers:{'Content-Type':'application/json','X-Admin':'1'},body:JSON.stringify(b||{})}).then(function(r){return r.json()})}
function act(a,id){post('/admin/'+a+'/'+id).then(function(){location.reload()})}
function bc(){var t=document.getElementById('bm').value.trim();if(!t||!confirm('Hamma foydalanuvchilarga yuborilsinmi?'))return;document.getElementById('bs').textContent='Yuborilmoqda…';post('/admin/broadcast',{text:t}).then(function(r){document.getElementById('bs').textContent='Yuborildi: '+r.sent+', xato: '+r.failed})}
</script></body></html>`;
}
app.get('/admin', auth, (q, r) => r.send(adminPage()));
app.post('/admin/delete/:id', auth, xhr, (q, r) => {
  const i = invites[q.params.id];
  if (i && i.photo) fs.unlink(path.join(DIR, 'photos', path.basename(i.photo)), () => {});
  delete invites[q.params.id]; save(); r.json({ ok: 1 });
});
app.post('/admin/toggle/:id', auth, xhr, (q, r) => { const i = invites[q.params.id]; if (i) { i.off = !i.off; save(); } r.json({ ok: 1 }); });
app.post('/admin/broadcast', auth, xhr, async (q, r) => {
  const text = String((q.body && q.body.text) || '').slice(0, 3500); let sent = 0, failed = 0;
  if (!text) return r.json({ sent, failed });
  for (const id of Object.keys(users)) { try { await bot.telegram.sendMessage(id, text); sent++; } catch (e) { failed++; } await sleep(60); }
  r.json({ sent, failed });
});

/* ---------- Mini App ---------- */
let MINI = '';
try { MINI = fs.readFileSync(path.join(__dirname, 'miniapp.html'), 'utf8').replace('__CFG__', JSON.stringify({ OCC, DIRS, BASE }).replace(/</g, '\\u003c')); } catch (e) { console.error('miniapp.html topilmadi'); }
app.get('/app', (q, r) => r.set('Cache-Control', 'no-cache').type('html').send(MINI || 'Mini ilova topilmadi'));

// Telegram initData tekshiruvi: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
function tgAuth(q, r, n) {
  let u;
  try {
    const tok = process.env.BOT_TOKEN, p = new URLSearchParams(q.headers['x-init-data'] || ''), hash = p.get('hash');
    if (!tok || !hash) throw 0;
    p.delete('hash');
    const chk = [...p.entries()].sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0)).map(([k, v]) => k + '=' + v).join('\n');
    const secret = crypto.createHmac('sha256', 'WebAppData').update(tok).digest();
    const h = crypto.createHmac('sha256', secret).update(chk).digest(), given = Buffer.from(hash, 'hex');
    if (given.length !== h.length || !crypto.timingSafeEqual(h, given)) throw 0;
    if (Date.now() / 1000 - Number(p.get('auth_date')) > 86400) throw 0;
    u = JSON.parse(p.get('user'));
    if (!u || !u.id) throw 0;
  } catch (e) { return r.sendStatus(401); }
  q.tg = u;
  if (!users[u.id]) { users[u.id] = { id: u.id, name: [u.first_name, u.last_name].filter(Boolean).join(' '), username: u.username || '', at: Date.now() }; saveU(); }
  n();
}
const str = (v, n) => (typeof v === 'string' ? v.trim().slice(0, n) : '');
const bad = (r, m) => r.status(400).json({ error: m });
const mine = q => Object.values(invites).filter(i => i.owner === q.tg.id);

app.post('/api/app/photo', tgAuth, express.raw({ type: 'image/*', limit: '6mb' }), (q, r) => {
  const b = q.body;
  if (!Buffer.isBuffer(b) || b.length < 4 || b[0] !== 0xff || b[1] !== 0xd8 || b[2] !== 0xff) return bad(r, 'Rasm JPEG bo‘lishi kerak');
  const name = crypto.randomBytes(8).toString('hex') + '.jpg';
  fs.writeFileSync(path.join(DIR, 'photos', name), b);
  r.json({ photo: name });
});

app.post('/api/app/invites', tgAuth, (q, r) => {
  const b = q.body || {}, d = {};
  if (!DIRS[b.dir] || !OCC[b.occ]) return bad(r, 'Tur yoki tadbir noto‘g‘ri');
  if (mine(q).length >= 50) return bad(r, 'Takliflar limiti (50) to‘ldi');
  d.dir = b.dir; d.occ = b.occ; d.style = [1, 2, 3].includes(+b.style) ? +b.style : 1;
  d.from = str(b.from, 400); if (!d.from) return bad(r, 'Ismingizni yozing');
  d.to = str(b.to, 400); if (!d.to && d.occ !== 'toy') return bad(r, 'Kimga yuborishingizni yozing');
  const w = parseWhen(str(b.when, 40)); if (!w) return bad(r, 'Sana va vaqt noto‘g‘ri');
  Object.assign(d, { iso: w.iso, dateText: w.text, time: w.time });
  d.where = str(b.where, 400); d.msg = str(b.msg, 400);
  if (b.photo) {
    if (typeof b.photo !== 'string' || !/^[a-f0-9]{16}\.jpg$/.test(b.photo) || !fs.existsSync(path.join(DIR, 'photos', b.photo))) return bad(r, 'Rasm topilmadi');
    d.photo = b.photo;
  }
  const id = crypto.randomBytes(5).toString('hex');
  invites[id] = Object.assign({ id, owner: q.tg.id, rsvp: [], createdAt: Date.now() }, d); save();
  const url = BASE + '/i/' + id;
  bot.telegram.sendMessage(q.tg.id, '🎉 Taklifnoma tayyor!\n\n' + url + '\n\n/mening — takliflarim').catch(() => {});
  r.json({ id, url });
});

app.get('/api/app/invites', tgAuth, (q, r) => {
  const cnt = (i, a) => (i.rsvp || []).filter(x => x.a === a).length;
  r.json(mine(q).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).map(i => ({
    id: i.id, occ: i.occ, from: i.from, to: i.to || '', dateText: i.dateText, time: i.time, photo: i.photo || '',
    off: !!i.off, yes: cnt(i, 'yes'), no: cnt(i, 'no'), url: BASE + '/i/' + i.id
  })));
});

const own = (q, r) => { const i = invites[q.params.id]; if (!i || i.owner !== q.tg.id) { r.sendStatus(404); return null; } return i; };
app.post('/api/app/invites/:id/toggle', tgAuth, (q, r) => { const i = own(q, r); if (!i) return; i.off = !i.off; save(); r.json({ off: i.off }); });
app.post('/api/app/invites/:id/delete', tgAuth, (q, r) => {
  const i = own(q, r); if (!i) return;
  if (i.photo) fs.unlink(path.join(DIR, 'photos', path.basename(i.photo)), () => {});
  delete invites[i.id]; save(); r.json({ ok: 1 });
});

app.listen(PORT, () => console.log('Web :' + PORT));

/* ---------- Bot ---------- */
const bot = new Telegraf(process.env.BOT_TOKEN);
bot.use((ctx, next) => {
  const f = ctx.from;
  if (f && !users[f.id]) { users[f.id] = { id: f.id, name: [f.first_name, f.last_name].filter(Boolean).join(' '), username: f.username || '', at: Date.now() }; saveU(); }
  return next();
});
bot.catch((e, ctx) => { console.error('Bot xato:', e.message); try { ctx.reply('⚠️ Xatolik yuz berdi. /start bilan qayta urinib ko‘ring.'); } catch (x) {} });
const ADMIN_IDS = (process.env.ADMIN_IDS || '').split(',').map(x => x.trim()).filter(Boolean);
bot.command('admin', ctx => {
  if (!ADMIN_IDS.includes(String(ctx.from.id))) return;
  const all = Object.values(invites);
  ctx.reply(`📊 Foydalanuvchilar: ${Object.keys(users).length}\nTakliflar: ${all.length}\nPanel: ${BASE}/admin`);
});
const S = {};
const ORDER = ['from', 'to', 'when', 'where', 'msg', 'photo', 'style'];
const skippable = (s) => s.step === 'where' || s.step === 'msg' || s.step === 'photo' || (s.step === 'to' && s.d.occ === 'toy');

function prompt(ctx, step) {
  const s = S[ctx.chat.id]; s.step = step; const o = s.d.occ;
  const T = {
    from: o === 'toy' ? '💍 Kimlar nomidan taklif? (masalan: Javohir & Shaxzoda)' : '✍️ Sizning ismingiz?',
    to: o === 'toy' ? '👥 Mehmon ismi? (umumiy bo‘lsa o‘tkazib yuboring)' : '💌 Kimga yuborasiz? Ismini yozing',
    when: '📅 Sana va vaqt?\nMasalan: 25.12.2026 19:00',
    where: '📍 Joy nomi va manzili? (masalan: Registon restorani, Toshkent)',
    msg: '💬 Shaxsiy xabaringizni yozing',
    photo: '🖼 Rasm yuboring (juftlik, tug‘ilgan kun egasi va h.k.)'
  };
  if (step === 'style') return ctx.reply('🎨 Uslubni tanlang:', Markup.inlineKeyboard([
    [Markup.button.callback('🌹 Romantik', 'st:1'), Markup.button.callback('👑 Klassik', 'st:2')], [Markup.button.callback('⚡ Zamonaviy', 'st:3')]]));
  return ctx.reply(T[step], skippable(s) ? Markup.inlineKeyboard([[Markup.button.callback('⏭ O‘tkazib yuborish', 'skip')]]) : Markup.removeKeyboard());
}
const next = ctx => { const s = S[ctx.chat.id]; prompt(ctx, ORDER[ORDER.indexOf(s.step) + 1]); };

function start(ctx) {
  S[ctx.chat.id] = { step: 'dir', d: {} };
  return ctx.reply('💌 Assalomu alaykum! Chiroyli onlayn taklifnoma yaratamiz.\n\nKim kimga yuboradi?',
    Markup.inlineKeyboard(Object.entries(DIRS).map(([k, v]) => [Markup.button.callback(v, 'd:' + k)])
      .concat(BASE.startsWith('https') ? [[Markup.button.webApp('📱 Mini ilovada yaratish', BASE + '/app')]] : [])));
}
bot.start(start); bot.command('yangi', start);
bot.command('mening', ctx => {
  const mine = Object.values(invites).filter(i => i.owner === ctx.chat.id);
  if (!mine.length) return ctx.reply('Hali taklif yaratmagansiz. /start');
  ctx.reply(mine.map(i => `${OCC[i.occ].n} · ${i.dateText}\n${BASE}/i/${i.id}\n✅ ${(i.rsvp || []).filter(r => r.a === 'yes').length}  ❌ ${(i.rsvp || []).filter(r => r.a === 'no').length}`).join('\n\n'));
});
bot.action(/^d:(\w+)/, ctx => { const s = S[ctx.chat.id]; if (!s) return ctx.answerCbQuery(); s.d.dir = ctx.match[1]; ctx.answerCbQuery(); ctx.editMessageText('Qanday tadbir?', Markup.inlineKeyboard(Object.entries(OCC).map(([k, v]) => [Markup.button.callback(v.n, 'o:' + k)]))); });
bot.action(/^o:(\w+)/, ctx => { const s = S[ctx.chat.id]; if (!s) return ctx.answerCbQuery(); s.d.occ = ctx.match[1]; ctx.answerCbQuery(); prompt(ctx, 'from'); });
bot.action('skip', ctx => { const s = S[ctx.chat.id]; if (!s || !skippable(s)) return ctx.answerCbQuery(); ctx.answerCbQuery(); next(ctx); });
bot.action(/^st:(\d)/, ctx => { const s = S[ctx.chat.id]; if (!s) return ctx.answerCbQuery(); s.d.style = +ctx.match[1]; ctx.answerCbQuery(); finish(ctx); });

bot.on('text', ctx => {
  const s = S[ctx.chat.id]; if (!s) return start(ctx);
  const t = ctx.message.text.trim().slice(0, 400);
  if (s.step === 'from') s.d.from = t;
  else if (s.step === 'to') s.d.to = t;
  else if (s.step === 'when') { const w = parseWhen(t); if (!w) return ctx.reply('❗ Format noto‘g‘ri. Masalan: 25.12.2026 19:00'); Object.assign(s.d, { iso: w.iso, dateText: w.text, time: w.time }); }
  else if (s.step === 'where') s.d.where = t;
  else if (s.step === 'msg') s.d.msg = t;
  else return ctx.reply('Yuqoridagi tugmalardan foydalaning yoki rasm yuboring.');
  next(ctx);
});
bot.on('photo', async ctx => {
  const s = S[ctx.chat.id]; if (!s) return start(ctx); if (s.step !== 'photo') return ctx.reply('Hozir rasm kerak emas. Savolga javob bering.');
  try {
    const ph = ctx.message.photo.pop(), link = await ctx.telegram.getFileLink(ph.file_id);
    const buf = Buffer.from(await (await fetch(link.href)).arrayBuffer());
    const name = crypto.randomBytes(8).toString('hex') + '.jpg';
    fs.writeFileSync(path.join(DIR, 'photos', name), buf); s.d.photo = name;
    next(ctx);
  } catch (e) { ctx.reply('Rasmni yuklab bo‘lmadi, qayta urinib ko‘ring.'); }
});

function finish(ctx) {
  const s = S[ctx.chat.id], id = crypto.randomBytes(5).toString('hex');
  invites[id] = Object.assign({ id, owner: ctx.chat.id, rsvp: [], createdAt: Date.now() }, s.d); save(); delete S[ctx.chat.id];
  const url = BASE + '/i/' + id;
  ctx.reply('🎉 Taklifnoma tayyor!\n\n' + url + '\n\nUni xohlagan kishiga yuboring. Kimdir javob bersa, shu yerda xabar olasiz.\n/yangi — yana yaratish · /mening — takliflarim',
    Markup.inlineKeyboard([[Markup.button.url('📤 Ulashish', 'https://t.me/share/url?url=' + encodeURIComponent(url) + '&text=' + encodeURIComponent('💌 Sizga taklifnoma!'))], [Markup.button.url('👀 Ko‘rish', url)]]));
}

bot.launch().then(() => console.log('Bot ishga tushdi')).catch(e => console.error('Launch xato:', e.message));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
