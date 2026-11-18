# TAKLIF QIL — Celebration Studio v3

Node.js 20+, Express, Telegraf, PostgreSQL. **Barcha fayllar bitta papkada.**

## Yuklash (Android / GitHub)
ZIP'ni oching va ichidagi fayllarni repository **ildiziga** yuklang (papkani o'zini emas). `server.js` va `package.json` rootda bo'lishi kerak. GitHub main branch'ga push qiling. Railway'da shu repository'ni ulang.

## Railway
Railway projectga PostgreSQL service qo'shing va web service Variables bo'limida quyidagilarni sozlang:

| Nomi | Qiymati |
|---|---|
| `BOT_TOKEN` | BotFather tokeni, **faqat Railway Variables'da** |
| `BOT_USERNAME` | `taklifnomaqil_bot` kabi username (`@` siz) |
| `ADMIN_TELEGRAM_ID` | Adminning Telegram raqamli ID'si |
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` reference |
| `BASE_URL` | `https://<sizning-domen>.up.railway.app` |
| `NODE_ENV` | `production` |

`.env` va tokenlar GitHub'ga yuborilmaydi. `PORT` Railway tomonidan beriladi.

## Telegram Login Widget
BotFather'da `/setdomain` orqali web domenni sozlang; widget domeni `BASE_URL` domeniga mos bo'lishi shart. HTTPS shart. Webdan cookie sessiya `/auth/telegram` orqali tekshiriladi, admin API esa har so'rovda server tarafida `ADMIN_TELEGRAM_ID` ni tekshiradi. Admin panel `/admin`; botdan `/admin` ham ochish mumkin. `initData` 1 soat amal qiladi, eskirsa botdan qayta oching.

## Funksiyalar
- 4 bosqich: Tadbir → Ismlar → Sana/manzil → Uslub. Jonli preview; yaratgandan keyin ulashish.
- To'y/tug'ilgan kun va boshqa turdagi taklifnomalar, animatsiya va oddiy fallback.
- Admin panel: login, tizim holati, sonlar, qidiruv/sahifalash, RSVP va taklifnoma matni (shaxsiy chatlar emas).
- Referral: `https://t.me/<bot>?start=ref_<inviteId>`. Users.ref orqali faqat birinchi manba yoziladi.
- RSVP: brauzer localStorage'da javob eslanadi; server IP uchun **1 soat** ichida qayta RSVP ni cheklaydi. Umumiy Wi-Fi'dagi boshqa foydalanuvchilarga ham vaqtincha ta'sir qilishi mumkin.
- Egasi cookie sessiyasi bilan taklifnomani ochsa, ko'rish hisoblanmaydi. Anonim brauzerda / alohida qurilmada ega aniqlanmasligi mumkin.
- Rasm brauzer canvas'da JPEG sifatida 1600 px gacha kichraytiriladi. HEIC ochilishi brauzer qo'lloviga bog'liq; ishlamasa JPG/PNG ishlating.

## Lokal test
```bash
npm install
npm run check
npm test
npm start
```

**package-lock.json holati:** Ushbu tayyorlash muhitida npm registry DNS (`EAI_AGAIN`) tufayli lockfile'ni ishonchli hosil qilib bo'lmadi. Kompyuter talab qilinmaydi: GitHub Codespaces terminalida `npm install --package-lock-only && git add package-lock.json && git commit -m "Add dependency lock" && git push` ni bajaring. So'ng `npm ci` orqali qat'iy install ishlaydi.

## Ma'lum cheklovlar
- Telegram Login Widget faqat BotFather `/setdomain` mos sozlanganda ishlaydi.
- Guestning shaxsi faqat ism kiritilsa yoki autentifikatsiya qilinsa ma'lum; anonim ochuvchining kimligini ko'rsatib bo'lmaydi.
- Rasm HEIC formatini hamma Android brauzer ocholmaydi.
- PostgreSQL/Telegram haqiqiy integratsiyasi va Railway deploy **ushbu ZIP uchun hali o'tkazilmagan**.
- RSVP IP limiti bir Wi-Fi tarmog'idagi mehmonlarga ta'sir qilishi mumkin; alohida RSVP mehmon tokenlari ishlab chiqilsa bu yechiladi.
- NPM lockfile internet cheklovi sabab kiritilmagan.

## Deploy tekshirish
`/health` — DB ulanishi; `/api/system-status` — faqat admin uchun DB, bot, HTTPS, username holati.

## Xavfsizlik
API admin ruxsatini backend tekshiradi; maxfiy tokenlar faqat env'dan olinadi. Sessiya cookie HttpOnly + SameSite; Telegram imzolari serverda tekshiriladi. Login sahifasini ko'rishning o'zi admin huquqini bermaydi. Taklifnoma xabarlari admin nazorati haqida botda ogohlantirish bor.
