# Taklif bot (Railway)
1. @BotFather → /newbot → tokenni oling.
2. Bu papkani GitHub'ga yuklang → Railway: New Project → Deploy from GitHub.
3. Variables:
   - BOT_TOKEN = BotFather tokeni
   - DATA_DIR = /data
4. Settings → Networking → Generate Domain (BASE_URL kerak emas, RAILWAY_PUBLIC_DOMAIN avtomatik olinadi).
5. Volume qo'shing, mount path: /data (rasmlar va takliflar o'chib ketmasligi uchun).
Bot: /start, /yangi, /mening

## Admin panel
Variables: `ADMIN_PASSWORD` (panel paroli), `ADMIN_IDS` (Telegram ID'lar, vergul bilan; botda /admin uchun).
Panel: `https://domen/admin` (login ixtiyoriy, parol = ADMIN_PASSWORD).

## Mini app
Manzil: `https://domen/app` (BotFather → /mybots → Bot Settings → Menu Button yoki Configure Mini App'ga shu manzilni kiriting).
Mini ilovada taklif yaratish, rasm yuklash, javoblarni ko'rish, ulashish, faolsizlantirish va o'chirish mumkin.
Kirish Telegram `initData` imzosi orqali tekshiriladi (qo'shimcha o'zgaruvchi kerak emas, `BOT_TOKEN` yetarli).
Dizayn 60/30/10: 60% iliq oq (#FAF5EF) · 30% to'q qizil (#8E2F44) · 10% oltin (#C9A24B).
