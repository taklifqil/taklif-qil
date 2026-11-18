# GitHub telefon orqali yuklash uchun bitta papkali variant

**Barcha fayllar shu bitta papkada joylashgan.** GitHub repository asosiy sahifasiga ZIP ichidagi `TAKLIF_QIL_GITHUB_READY` papkasining **ichidagi** fayllarni yuklang (papkaning o‘zini emas). `server.js`, `package.json`, `railway.json` repository root qismida turishi kerak. `.env` faylini GitHub'ga yuklamang.

Koddagi lokal `lib/`, `public/`, `tests/` va `scripts/` yo‘llari shu tekis tuzilishga moslashtirildi. `/s/` faqat ruxsat etilgan CSS/JS fayllarni ko‘rsatadi, server fayllarini emas.

---

# Taklif Qil Studio — Bot + Mini App + Web + Admin

Taklif Qil v2.0 — Telegram bot va Telegram Mini App bilan integratsiyalangan onlayn taklifnoma platformasi. **Bu kodni Railway'ga avtomatik deploy qilingan deb hisoblamang.** Deploy amallarini hisob egasi bajarishi kerak.

## Arxitektura

- `server.js` — Express API, Telegram Telegraf bot, login, admin va statik sahifalar.
- `lib/db.js` — PostgreSQL: `users`, `invites`, `rsvps`, `views`, `photos`, `sessions`, `audit_logs`.
- `lib/auth.js` — Telegram Mini App `initData` HMAC va Telegram Login Widget imzosini tekshiradi. Imzo va `auth_date` serverda tekshiriladi.
- `lib/invitation.js` — asl ZIP'dagi taklifnoma HTML rendereri va tadbir shablonlari.
- `web.html`, `web.js`, `style.css` — responsive veb platforma va Telegram Mini App, light/dark, live preview, katalog, tahrir, RSVP statistika.
- `admin.html` — Telegram ID asosidagi private admin sahifa. **Admin API backendda tekshiriladi.**
- `invite.css`, `invite.js` — saqlab qolingan va optimallashtirilgan animatsiyali konvert, RSVP, countdown.
- `miniapp.html`, `legacy-server.reference.js` — eski kod xavfsiz tarzda arxivlash uchun qoldirilgan. Avvalgi Mini App `/legacy-app` da ochiladi, ammo asosiy Mini App `/app`.
- `import-legacy.js` — avvalgi JSON taklifnomalarini, RSVP javoblarini va rasmlarni PostgreSQL'ga ko‘chirish.
- `tests` — Telegram autentifikatsiyasi, input validatsiyasi va HTML escaping bo‘yicha testlar.

## GitHub / Railway deploy (Android telefondan)

1. GitHub.com saytida yangi **private** repository yarating. ZIP ichidagi loyiha fayllarini repository ildiziga joylang (ZIPning o‘zini emas). Android Chrome'da GitHub Codespaces (Code → Codespaces → Create codespace) yordamida terminaldan ishlashingiz mumkin. Yoki GitHub saytida fayllarni yuklang.
2. Railway.app → **New Project** → **Deploy from GitHub repo** → repository'ni tanlang.
3. Railway → **New** → **Database** → **PostgreSQL**. PostgreSQL service `DATABASE_URL` ulanishini taklif qiladi. Web service → Variables → `DATABASE_URL` = `${{Postgres.DATABASE_URL}}` (Railway interfeysida reference variable orqali kiriting; PostgreSQL service nomi sizda boshqacha bo‘lishi mumkin).
4. BotFather `/newbot` orqali token va bot username oling. Tokenni **faqat Railway Variables**ga kiriting.
5. Railway web service'ning Variables bo‘limiga quyidagilarni kiriting:

   | O‘zgaruvchi | Misol / izoh |
   |---|---|
   | `BOT_TOKEN` | BotFather maxfiy tokeni |
   | `BOT_USERNAME` | Bot username, `@` belgisiz |
   | `ADMIN_TELEGRAM_ID` | O‘zingizning raqamli Telegram ID'ingiz |
   | `DATABASE_URL` | Railway PostgreSQL connection reference |
   | `BASE_URL` | `https://...up.railway.app` — web service domeni |
   | `NODE_ENV` | `production` |
   | `PORT` | Railway avtomatik beradi; bo‘sh qoldirish ham mumkin |
   | `PGSSLMODE` | Tashqi database SSL talab qilsa `require`; Railway ichki Postgres uchun shart emas |

6. Railway → Web service → Settings → Networking → **Generate Domain**. Hosil bo‘lgan `https://...` domenini `BASE_URL` ga kiriting va deployni yakunlang.
7. BotFather → `/mybots` → bot → **Bot Settings** → **Menu Button** → `https://SIZNING-DOMEN/app`. Mini App Telegram bot ichidan ochiladi.
8. **Web Login** uchun BotFather → `/setdomain` (yoki Bot Settings → Domain) orqali domenni ulang. Web sahifada Telegram Login Widget ishlashi uchun `BOT_USERNAME` to‘g‘ri bo‘lishi kerak. Odatda `https://SIZNING-DOMEN/` kirish sahifasi.
9. `https://SIZNING-DOMEN/health` da `{"ok":true,"database":"connected"}` chiqishini tekshiring. `/admin` ni faqat o‘z Telegram hisobingiz bilan login qilib oching.
10. Ixtiyoriy: GitHub Codespaces terminalida `npm ci` yoki `npm install` → `npm test` → `npm run check`. **Dastlabki yuklamada** `package-lock.json` mavjud bo‘lmasa `npm install` uni yaratadi va commit qilishingiz mumkin.

### Bot buyruqlari
`/start`, `/yangi`, `/mening`, `/admin` (faqat admin), `/skip` (ixtiyoriy bosqichda). Botni ishga tushirish uchun BotFather tokeni va ochiq Telegram tarmog‘i kerak. Bot ishga tushganda avtomatik polling ishlatadi — bir vaqtning o‘zida faqat **bitta** bot instance'ni yoqing.

### Ma’lumotlarning saqlanishi
Barcha asosiy ma’lumotlar, shu jumladan rasmlar, `DATABASE_URL` orqali **PostgreSQL** ga yoziladi. Railway web service restart bo‘lganda PostgreSQL ma’lumotlari saqlanadi. PostgreSQL'ni o‘chirib tashlamang va muntazam backup qiling. Fayl tizimiga JSON yozilmaydi.

**Eski ma’lumotni import qilish:** agar sizda avvalgi Railway volume'dagi `users.json`, `invites.json`, `photos/` mavjud bo‘lsa, ularni avval export qiling, keyin bir martalik Codespaces terminalida: `DATA_DIR=/path/to/old/data DATABASE_URL=... node import-legacy.js`. Maxfiy connection string'ni chatga yoki gitga yubormang. Importdan oldin PostgreSQL backup oling; bir necha marta import qilish taklifnomalarni takrorlamaydi, ammo import qaytadan ishga tushsa rasmlarning ortiqcha nusxalari yaratilishi mumkin. Eski JSON fayllari ushbu ZIP'da mavjud emas — shuning uchun real eski ma’lumot migratsiyasi bajarilmadi.

## Funksiyalar va cheklovlar

- ✅ Bot orqali ketma-ket taklifnoma yaratish, havola, ulashish, xabar berish.
- ✅ Mini App va web: Telegram autentifikatsiyasi, yaratish/tahrirlash/ochirish, RSVP soni va mehmonlar, shablonlar.
- ✅ Public taklifnoma: konvert, xarita, kalendar, countdown, RSVP. Animatsiyalarni o‘chirish va OS `prefers-reduced-motion` qo‘llab-quvvatlanadi.
- ✅ Admin API: ID bo‘yicha qat’iy tekshiruv, statistikalar, oxirgi 200 foydalanuvchi/taklifnoma, bloklash, o‘chirish va audit log.
- ✅ Rate limiting, server input validation, HTML escaping, parametrli SQL query, signed login va httpOnly cookie sessiyasi. Cookie orqali yozuvchi metodlarda `Origin` tekshiriladi.
- ⚠️ **To‘liq production audit bajarilmadi.** Bu ZIP uchun npm dependencies va haqiqiy Postgres/Telegram/Railway tarmoq testlari ushbu ishlab chiqish muhitida o'tkazilmadi.
- ⚠️ Telegram bot xabarlarining monitoringi, to‘liq tizim loglari, administratorga broadcast, jadvalga bog‘langan sanalar statistikasi va media galereyasi hozircha qisman yoki amalga oshirilmagan.
- ⚠️ RSVP mehmon ismi ixtiyoriy: bitta mehmon bir necha marta javob berishi mumkin; faqat IP rate limiting bor. Maxfiy taklifnoma access-code yoki unikal taklif etish tokeni yo‘q.
- ⚠️ Auth uchun Telegram hisobi kerak; alohida email/password registratsiya yo‘q. Bu xavfsiz Telegram-first variant.
- ⚠️ Katta hajmdagi rasmlarni uzoq muddat PostgreSQL'da saqlash o‘rniga keyinchalik S3-compatible storage tavsiya etiladi.

## Test

```bash
npm install
npm test
npm run check
npm start
```

`npm test` Telegram `initData`/Login Hash tekshiruvlari, invalid request va XSS HTML escapingni sinaydi. Production smoke-test: (1) haqiqiy botda `/start`; (2) Mini App autentifikatsiyasi; (3) yaratish/tahrirlash; (4) RSVP javobi; (5) admin ruxsatlari; (6) PostgreSQL restart persistentligi. Bularni real Railway muhitida **alohida** tekshirish kerak.

## Xavfsizlik

`.env` yoki haqiqiy tokenlarni GitHubga hech qachon yuklamang. Admin paroli talab qilinmaydi, chunki admin huquqi **faqat serverda tekshiriladigan Telegram ID**ga bog‘langan. Telegram Login Domain konfiguratsiyasi noto‘g‘ri bo‘lsa web login ishlamaydi. `BASE_URL` haqiqiy HTTPS domen bo‘lishi kerak.

## Celebration Edition — 2026-11-18

- Yangi premium bayramona dizayn: konvert, oltin/plum ranglar, gul naqshlari va yengil animatsiyalar.
- Animatsiya foydalanuvchi tomonidan o‘chiriladi; OS `prefers-reduced-motion` sozlamasi ham hurmat qilinadi.
- Saytga Telegram sessiyasiz kirgan mehmon `https://t.me/taklifnomaqil_bot?start=studio` manziliga yo‘naltiriladi. Bot orqali **Mini App** tugmasini bosib qaytadi.
- `/admin` Telegram ichidagi Mini App kontekstida `initData` orqali autentifikatsiyadan o‘tadi. Server `ADMIN_TELEGRAM_ID` ni alohida tekshiradi. Botda `/admin` buyrug‘i maxsus Web App tugmasini ko‘rsatadi.
- `/api/admin/activity` faqat admin uchun: taklifnoma egasi, yuboruvchi, mo‘ljallangan mehmon, taklifnoma matni, sana, umumiy ko‘rishlar va RSVP mehmon javoblari/vaqtlarini beradi. Bular platformaning o‘zida kiritilgan ma’lumotlar; Telegram shaxsiy suhbatlari monitoring qilinmaydi. Anonim taklifnoma ochuvchilarining shaxsini aniqlamaydi.

### Telefonda yuklash

Ushbu ZIP arxivning **ildizida** barcha loyiha fayllari bor, ichki papkalar yo‘q. Arxivni oching; GitHub repository asosiy sahifasida `Add file → Upload files` ni tanlab fayllarni yangilang. GitHub eski fayllar bilan kelishmovchilik bersa, GitHub Codespaces orqali ZIP ichidagi yangilangan fayllarni repository ildiziga nusxalang va commit qiling. `BOT_TOKEN`, database URL va parollarni GitHub fayliga yozmang. Railway GitHub main branch'ga ulangan bo‘lsa commitdan keyin yangi deploy boshlanadi.

### Ishlatishdan oldin tekshirish

`npm test`, `npm run check`, keyin Railway `/health`, bot `/start`, `/admin`, Mini App login va real RSVP sinovlarini bajaring. Admin activity qismi haqiqiy DB bilan test qilinmaguncha productionda to‘liq tekshirildi deb hisoblanmaydi.
