const BASE = (process.env.BASE_URL || (process.env.RAILWAY_PUBLIC_DOMAIN ? 'https://' + process.env.RAILWAY_PUBLIC_DOMAIN : 'http://localhost:' + (process.env.PORT || 3000))).replace(/\/$/, '');
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
  if (y < 2000 || y > 2100 || mo < 1 || mo > 12 || d < 1 || d > 31 || h > 23 || mi > 59 || new Date(Date.UTC(y, mo - 1, d)).getUTCMonth() !== mo - 1) return null;
  const p = n => String(n).padStart(2, '0');
  return { iso: `${y}-${p(mo)}-${p(d)}T${p(h)}:${p(mi)}:00+05:00`, text: `${d}-${MON[mo - 1]}, ${DAY[new Date(Date.UTC(y, mo - 1, d)).getUTCDay()]}`, time: `${p(h)}:${p(mi)}` };
}

/* ---------- Invitation page (qora dizayn, public/invite.css + public/invite.js) ---------- */
const SEAL = { toy: '♥', tug: '★', uch: '♥', yub: '★', bosh: '✦' };
function page(i) {
  const O = OCC[i.occ] || OCC.bosh, isU = i.occ === 'uch';
  const mode = (i.occ === 'tug' || i.occ === 'bosh') ? 'birthday' : 'wedding';
  const D = JSON.stringify({ iso: i.iso, id: i.id, occ: i.occ, mode }).replace(/</g, '\\u003c');
  const g = d => d.toISOString().replace(/[-:]|\.\d{3}/g, '');
  const t0 = new Date(i.iso), t1 = new Date(t0.getTime() + 3 * 3600000);
  const cal = 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent(O.lab + ': ' + i.from) + '&dates=' + g(t0) + '/' + g(t1) + '&location=' + encodeURIComponent(i.where || '');
  const map = i.where ? 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(i.where) : '';
  const title = isU ? esc(i.to) + ', uchrashamizmi?' : (i.occ === 'toy' ? esc(i.from) : esc(O.t));
  const sub = isU ? '' : (i.occ === 'toy' ? '<div class="who">' + esc(O.t) + '</div>' : '<div class="who">' + esc(i.from) + '</div>');
  return `<!doctype html><html lang="uz" data-mode="${mode}"><head><meta charset="utf-8"><title>${esc(O.lab)} — ${esc(i.from)}</title>
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#0D0D0D">
<meta property="og:title" content="${esc(O.t)}"><meta property="og:description" content="${esc(i.from)} sizni taklif qilmoqda 💌">
${i.photo ? '<meta property="og:image" content="' + BASE + '/p/' + esc(i.photo) + '">' : ''}
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@700;800&family=Cormorant+Garamond:ital,wght@0,500;1,500;1,600&family=Hanken+Grotesk:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/s/invite.css">
</head><body>
<canvas id="fx" aria-hidden="true"></canvas>
<main class="stage"><div class="glow"></div>
<button class="env-btn idle" id="envBtn" type="button" aria-label="Konvertni yirtib ochish">
  <div class="env" id="env"><div class="env-back"></div><div class="flap inner" id="flapIn"></div>
  <div class="letter" id="letter"><span>${esc(O.lab)}</span></div><div class="env-front"></div>
  <div class="flap" id="flap"></div><div class="seal" id="seal" aria-hidden="true">${SEAL[i.occ] || '✦'}</div><div class="tear" id="tear"></div></div>
  <div class="hint" id="hint"><i></i>Yirtish uchun bosing</div>
</button>
<article class="invite" id="invite">
${i.photo ? '<img class="photo" src="/p/' + esc(i.photo) + '" alt="">' : ''}
<p class="occ">${esc(O.lab)}</p>
${i.to && !isU ? '<p class="msg" style="margin:0 auto 8px">Hurmatli <b>' + esc(i.to) + '</b>,</p>' : ''}
<h1>${title}</h1>${sub}
${i.msg ? '<p class="msg">' + esc(i.msg).replace(/\n/g, '<br>') + '</p>' : ''}
<div class="when"><div><small>Sana</small><b>${esc(i.dateText)}</b></div><div><small>Vaqt</small><b>${esc(i.time)}</b></div>${i.where ? '<div class="full"><small>Manzil</small><b>' + esc(i.where) + '</b></div>' : ''}</div>
<div class="cd" id="cd"></div>
${isU ? '<div class="arena" id="ar"><button class="yes" type="button" onclick="rsvp(\'yes\')">♥ HA</button><button class="no" id="no" type="button">Yo‘q</button></div><div class="cn" id="cn"></div>'
 : '<div class="rsvp" id="rsvp"><button class="yes" type="button" onclick="rsvp(\'yes\')">Boraman</button><button class="no" type="button" onclick="rsvp(\'no\')">Kela olmayman</button></div>'}
<label class="guest-label" for="guestName">Ismingiz (ixtiyoriy)<input id="guestName" maxlength="120" placeholder="Mehmon ismi" autocomplete="name"></label>
<div class="thanks" id="thanks">Javobingiz yuborildi 💖</div>
${map ? '<a class="lnk" target="_blank" rel="noopener" href="' + map + '">Xaritada ko‘rish</a>' : ''}
<a class="lnk" target="_blank" rel="noopener" href="${cal}">Kalendarga qo‘shish</a>
<div class="by">${esc(i.from)} tomonidan ilqlik bilan yaratildi</div>
</article></main>
<script>window.D=${D};</script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<script src="/s/invite.js"></script>
</body></html>`;
}


module.exports = { page, parseWhen, OCC, DIRS, esc };
