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
