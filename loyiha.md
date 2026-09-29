# MILLYTOUR — MVP 1.0 TO'LIQ ARXITEKTURA VA QO'LLANMA

Ushbu hujjat **MillyTour MVP 1.0** loyihasining to'liq arxitekturasi, ishlash mexanizmi, rollar taqsimoti, to'lov tizimlari va deploy qilish bo'yicha master qo'llanmadir.

---

## 1. YAKUNIY ARXITEKTURA VA TIZIM MODELI

MillyTour platformasi monolit frontend emas, balki aniq chegaralangan 4 ta mustaqil qismdan (monorepo workspaces) tashkil topgan:

```text
                                  MILLYTOUR
                                      │
         ┌────────────────────────────┼───────────────────────────┐
         │                            │                           │
         ▼                            ▼                           ▼
   ODDIY TURIST              XIZMAT KO'RSATUVCHI             SUPER ADMIN
    (Customer)                    (Partner)                  (Management)
         │                            │                           │
  millytour.uz               Telegram Partner Bot           admin.millytour.uz
  (Vercel SPA)                 + [🚀 Launch App]               (Vercel SPA)
         │                            │                           │
         │                   Partner Mini App                     │
         │               (millytour.uz/partner/app)               │
         │                            │                           │
         └────────────────────────────┼───────────────────────────┘
                                      │
                                      ▼
                                MILLYTOUR API
                             (api.millytour.uz)
                              Node.js / Express
                                      │
               ┌──────────────────────┴──────────────────────┐
               ▼                                             ▼
       PostgreSQL (Prisma)                        PAYMENT PROVIDERS
    - Users (RBAC)                                - CLICK (Uzbekistan)
    - Partners & Services                         - PAYME (Uzbekistan)
    - Tours & Bookings                            - CARD (Visa/Mastercard)
    - Payments & Refunds
    - Partner Earnings
```

---

## 2. MONOREPO STRUKTURASI

Loyiha quyidagi workspaces tartibida tashkil qilingan:

```text
millytour/
├── frontend/               # Customer Web + Telegram Mini App (Vercel)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Landing.tsx          # Asosiy sayt (millytour.uz)
│   │   │   ├── Packages.tsx         # Turlar katalogi
│   │   │   ├── PackageDetail.tsx    # Tur sahifasi va bron qilish
│   │   │   ├── Checkout.tsx         # To'lov sahifasi (/checkout/:orderId)
│   │   │   ├── PaymentSuccess.tsx   # Muvaffaqiyatli to'lov natijasi
│   │   │   ├── PaymentFailed.tsx    # Xatolik natijasi
│   │   │   ├── PartnerMiniApp.tsx   # Telegram Partner Mini App (/partner/app)
│   │   │   └── ...
│   │   ├── components/              # UI komponentlar (Tailwind, Lucide)
│   │   └── api/                     # Backend API bilan aloqa
│   ├── package.json
│   └── vite.config.ts
│
├── admin/                  # Super Admin Dashboard (admin.millytour.uz)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── AdminDashboard.tsx   # Asosiy statistika
│   │   │   ├── AdminPartners.tsx    # Hamkor arizalarini ko'rib chiqish/tasdiqlash
│   │   │   ├── AdminHotels.tsx      # Mehmonxonalar boshqaruvi
│   │   │   ├── AdminRestaurants.tsx # Restoranlar boshqaruvi
│   │   │   ├── AdminUsers.tsx       # Foydalanuvchilar va rollar
│   │   │   ├── AdminPayments.tsx    # To'lovlar, refundlar va daromadlar nazorati
│   │   │   ├── AdminAuditLogs.tsx   # Tizim xavfsizlik audit loglari
│   │   │   └── AdminSettings.tsx    # Platforma komissiyalari va sozlamalar
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                # Production REST API (Railway / Docker)
│   ├── prisma/
│   │   └── schema.prisma   # PostgreSQL ma'lumotlar sxemasi (18 ta model)
│   ├── src/
│   │   ├── config/         # Muhit o'zgaruvchilari (env)
│   │   ├── controllers/    # API kontrollerlari (auth, tour, order, partner, payment)
│   │   ├── middleware/     # RBAC (authMiddleware, requireRole)
│   │   ├── services/
│   │   │   └── payment/    # Provider-agnostic to'lov xizmatlari
│   │   │       ├── click.provider.ts   # Click Complete/Prepare MD5 hash
│   │   │       ├── payme.provider.ts   # Payme JSON-RPC va Base64 URL
│   │   │       ├── card.provider.ts    # Visa/Mastercard integratsiyasi
│   │   │       └── payment.service.ts  # Idempotency, hisob-kitob, refunds
│   │   ├── utils/          # HMAC-SHA256 Telegram validation, JWT, Argon2/Bcrypt
│   │   └── server.ts       # Express server va marshrutlar
│   ├── tests/              # Unit va integratsion testlar
│   └── package.json
│
├── bot/                    # Telegram Hamkor Boti (Railway worker)
│   ├── src/
│   │   └── bot.ts          # Telegram Bot API (Mini App Launch Web_app knopkasi)
│   └── package.json
│
├── package.json            # Monorepo root workspaces
└── loyiha.md               # Ushbu arxitektura hujjati
```

---

## 3. FOYDALANUVCHILAR ROLLARI VA OQIMLARI

### 3.1. Oddiy Turist (Customer)
1. **Kirish:** `millytour.uz` saytiga brauzer orqali yoki Telegram Mini App orqali kiradi.
2. **Tanlov:** Turlar, yo'nalishlar, mehmonxonalar va xizmatlarni ko'rib chiqadi.
3. **Bron qilish:** Tur sahifasidan kerakli sana va sayohatchilar sonini kiritib `Bron qilish` tugmasini bosadi.
4. **Checkout:** `/checkout/:orderId` sahifasida to'lov usulini tanlaydi:
   - Click (O'zbekiston so'mi)
   - Payme (O'zbekiston so'mi)
   - Xalqaro karta (Visa/Mastercard)
5. **To'lov tasdiqlash:** Foydalanuvchi to'lov provayderi sahifasiga yo'naltiriladi. To'lov amalga oshirilgach, provayder to'g'ridan-to'g'ri Backend Webhook'ga xabar yuboradi. Backend tekshirib, statusni `PAID` va buyurtmani `CONFIRMED` qiladi.

### 3.2. Xizmat Ko'rsatuvchi (Partner)
Gidlar, haydovchilar, mehmonxonalar, restoranlar, turoperatorlar:
1. **Telegram Bot:** Telegramda `@MillyTourPartnerBot`ga kiradi va `/start` bosadi.
2. **Mini App ochish:** Botdagi `[🚀 Launch App (Hamkor Portali)]` tugmasini bosadi.
3. **Avtorizatsiya:** Telegram WebApp `initData` orqali backendda kriptografik (HMAC-SHA256) usulda xavfsiz avtorizatsiyadan o'tadi.
4. **Onboarding:** Ariza formasini Mini App orqali to'ldiradi (Faoliyat yo'nalishi, shahar, xizmat narxlari, hujjatlar).
5. **Dashboard:** Ariza tasdiqlangach, xizmatlarini boshqarish, yangi buyurtmalarni qabul qilish va daromadlarini monitoring qilish imkoniyatiga ega bo'ladi.

### 3.3. Super Admin
1. **Kirish:** `admin.millytour.uz` orqali xavfsiz tizimga kiradi.
2. **Hamkorlarni tasdiqlash:** Yangi kelib tushgan arizalarni tekshiradi, tasdiqlaydi (`APPROVED`) yoki rad etadi (`REJECTED`).
3. **Moliya:** Click, Payme va Kartalar bo'yicha to'lovlar tarixini, provayder tranzaksiyalarini va platformaning sof komissiya daromadini real vaqtda ko'radi.
4. **Qaytarish (Refund):** Zarur hollarda bitta tugma orqali to'lovni bekor qiladi va mablag'ni mijozga qaytaradi.

---

## 4. XAVFSIZLIK VA TO'LOV ARXITEKTURASI

- **Frontendga ishonmaslik:** To'lov summasi hech qachon mijoz frontendidan olinmaydi. Barcha summa backend ma'lumotlar bazasidagi `Order.totalPrice` bo'yicha qat'iy hisoblanadi.
- **Idempotency:** Webhooklar orqali bir xil to'lov bir necha bor kelganda ham mablag' va statuslar takroran oshib ketmaydi.
- **Kriptografik Tekshiruv:**
  - Click: MD5 orqali `click_trans_id`, `service_id`, `secret_key`, `merchant_trans_id`, `amount`, `action`, `sign_time` imzosi tekshiriladi.
  - Payme: HTTP Basic Auth orqali `Paycom` kaliti va JSON-RPC usulida tranzaksiya holati tekshiriladi.
  - Telegram: Bot token orqali yaratilgan secret key bilan HMAC-SHA256 heshi tekshiriladi.

---

## 5. DEPLOY QILISH VA SOZLASH (PRODUCTION)

### 5.1. Railway (Backend API va PostgreSQL)
1. Railway loyihasida **PostgreSQL** qo'shing.
2. Railway'da yangi xizmat ochib, GitHub repozitoriyangizni ulang:
   - **Root Directory:** `backend`
   - **Build Command:** `npm run build`
   - **Start Command:** `npm start`
   - **Custom Domain:** `api.millytour.uz`
3. Environment Variables (Backend):
   ```env
   NODE_ENV=production
   PORT=4000
   DATABASE_URL=postgresql://postgres:...@...railway.app:port/railway
   JWT_SECRET=super_secret_jwt_key_2026_millytour
   TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
   CLICK_MERCHANT_ID=your_click_merchant_id
   CLICK_SERVICE_ID=your_click_service_id
   CLICK_SECRET_KEY=your_click_secret_key
   PAYME_MERCHANT_ID=your_payme_merchant_id
   PAYME_SECRET_KEY=your_payme_secret_key
   CORS_ORIGIN=https://millytour.uz,https://admin.millytour.uz
   ```

### 5.2. Railway (Telegram Bot Worker)
1. Railway'da ikkinchi xizmat oching:
   - **Root Directory:** `bot`
   - **Build Command:** `npm run build`
   - **Start Command:** `node dist/bot.js`
2. Environment Variables (Bot):
   ```env
   TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
   API_URL=https://api.millytour.uz
   PARTNER_APP_URL=https://millytour.uz/partner/app
   ```

### 5.3. Vercel (Customer Web)
1. Vercel'da yangi loyiha qo'shing:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Custom Domain:** `millytour.uz`
2. Environment Variables:
   ```env
   VITE_API_URL=https://api.millytour.uz
   ```

### 5.4. Vercel (Super Admin Panel)
1. Vercel'da alohida loyiha qo'shing:
   - **Root Directory:** `admin`
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Custom Domain:** `admin.millytour.uz`
2. Environment Variables:
   ```env
   VITE_API_URL=https://api.millytour.uz
   ```

### 5.5. Eskiz.uz DNS Sozlamalari
Eskiz.uz domen boshqaruv paneliga kirib quyidagi yozuvlarni kiriting:

| Turi (Type) | Qism / Subdomen (Name) | Qiymat (Target / Value) | Maqsad |
|---|---|---|---|
| **A** | `@` | `76.76.21.21` | Asosiy veb-sayt (Vercel) |
| **CNAME** | `www` | `cname.vercel-dns.com.` | WWW yo'naltirish |
| **CNAME** | `admin` | `cname.vercel-dns.com.` | Admin paneli (Vercel) |
| **CNAME** | `api` | `<railway-app-id>.up.railway.app` | Backend API (Railway) |

---

## 6. SINOVDAN O'TKAZISH VA TESTLAR

Loyiha to'liq testlangan:
- Frontend build: `npm --prefix frontend run build` (Muvaffaqiyatli, 0 xato)
- Admin build: `npm --prefix admin run build` (Muvaffaqiyatli, 0 xato)
- Backend build: `./node_modules/.bin/tsc --project backend` (Muvaffaqiyatli, 0 xato)
- Bot build: `./node_modules/.bin/tsc --project bot` (Muvaffaqiyatli, 0 xato)
- Payment tests: `node backend/tests/payment.test.mjs` (5 ta test muvaffaqiyatli o'tdi)
