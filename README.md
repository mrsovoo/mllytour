# MILLYTOUR — MVP 1.0

O'zbekiston bo'ylab shaxsiy sayohatlar, turlar va turizm xizmatlarini (gidlar, haydovchilar, mehmonxonalar, restoranlar) birlashtiruvchi zamonaviy ekotizim platformasi.

---

## 🏛 Ekotizim Arxitekturasi

```text
                         MILLYTOUR
                             |
          +------------------+------------------+
          |                  |                  |
          v                  v                  v
     CUSTOMER WEB       PARTNER BOT       SUPER ADMIN
   (millytour.uz)        Telegram      (admin.millytour.uz)
       Vercel            Railway              Vercel
          |                  |                  |
          +------------------+------------------+
                             |
                             v
                    MILLYTOUR BACKEND
                  (api.millytour.uz)
                         Railway
                             |
                     REST API / JSON
                             |
                             v
                        PostgreSQL
                         Railway
```

---

## 📦 Loyiha Tuzilmasi (Monorepo Workspaces)

```text
millytour/
├── frontend/                 # Customer Web ilovasi (React 19 + Vite + TailwindCSS)
│   ├── src/
│   │   ├── api/              # API mijozlari (client.ts)
│   │   ├── components/       # Shadcn UI va sayt komponentlari
│   │   ├── pages/            # Landing, Tours, Checkout, PaymentSuccess, Profile
│   │   └── main.tsx          # Asosiy router va entrypoint
│   ├── package.json
│   └── vite.config.ts
│
├── admin/                    # Super Admin Paneli (React 19 + Vite + TailwindCSS)
│   ├── src/
│   │   ├── api/              # Admin REST klienti (admin.ts)
│   │   ├── layouts/          # AdminLayout va navigatsiya
│   │   ├── pages/            # Dashboard, Hamkorlar, Mehmonxonalar, To'lovlar, Audit
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                  # Yagona REST API va To'lovlar Serveri (Node.js + Express)
│   ├── src/
│   │   ├── config/           # Muhit o'zgaruvchilari
│   │   ├── controllers/      # Auth, Tours, Orders, Payments, Partners, Admin
│   │   ├── middleware/       # JWT Auth va RBAC (Customer, Partner, Admin)
│   │   ├── routes/           # REST API marshrutlari
│   │   ├── services/
│   │   │   └── payment/      # Click, Payme, Card providerlar va PaymentService
│   │   ├── db/               # PostgreSQL Prisma Client va Seed skripti
│   │   └── server.ts         # Asosiy Express server
│   ├── prisma/
│   │   └── schema.prisma     # PostgreSQL to'liq sxemasi
│   └── package.json
│
├── bot/                      # Hamkorlar Telegram Boti (Zero-dependency Telegram API)
│   ├── src/
│   │   └── bot.ts            # Hamkor arizasi, boshqaruv menyusi va buyurtma xabarlari
│   └── package.json
│
├── package.json              # Root workspace konfiguratsiyasi
└── README.md
```

---

## 💳 To'lov Tizimi (Click, Payme, Visa/Mastercard)

Platformaga to'liq xavfsiz va provider-agnostic to'lov arxitekturasi o'rnatilgan:

1. **Click:** Click Up ilovasi va veb-kassa havolalari (MD5 imzo tekshiruvi).
2. **Payme:** Paycom JSON-RPC protokoli va Base64 avtomatik to'lov URL yaratish.
3. **Visa / Mastercard:** Xorijiy sayyohlar uchun xalqaro kartalar integratsiyasi.
4. **Xavfsizlik & Idempotency:** 
   - Summa hech qachon frontend'dan olinmaydi, to'g'ridan-to'g'ri buyurtma ma'lumotlaridan hisoblanadi.
   - Takroriy webhook'lardan himoya (`provider + externalTransactionId` unikal kaliti orqali).
   - To'lov tasdiqlangach (`PAID`), avtomatik ravishda hamkor ulushi (`partner_earnings`) hisoblanadi (platforma komissiyasi ayirilib).
   - Super Admin panel orqali to'lovlarni to'liq qaytarish (Refund) imkoniyati.

---

## 🚀 Mahalliy Ishga Tushirish (Local Development)

### 1. Bog'liqliklarni o'rnatish
```bash
npm install
```

### 2. Xizmatlarni ishga tushirish

- **Frontend (Customer Web):**
  ```bash
  npm run dev:frontend
  # Manzil: http://localhost:5173
  ```

- **Super Admin Paneli:**
  ```bash
  npm run dev:admin
  # Manzil: http://localhost:3000
  # Standart login: admin / admin123
  ```

- **Backend API:**
  ```bash
  npm run dev:backend
  # Manzil: http://localhost:4000
  # Health check: http://localhost:4000/api/health
  ```

- **Hamkor Telegram Boti:**
  ```bash
  npm run dev:bot
  ```

### 3. Testlarni tekshirish
```bash
node backend/tests/payment.test.mjs
```

---

## 🌐 Production Deploy Yo'riqnomasi

### 1. Backend & PostgreSQL (Railway)
1. [Railway.app](https://railway.app) ga kiring va yangi loyiha oching.
2. **New -> Database -> PostgreSQL** ni tanlang (Railway avtomatik `DATABASE_URL` beradi).
3. **New -> GitHub Repo** qilib loyihani ulang.
4. Sozlamalarda (Settings):
   - **Root Directory:** `backend`
   - **Build Command:** `npm run build`
   - **Start Command:** `npm start`
5. **Variables** bo'limiga quyidagilarni kiriting:
   - `DATABASE_URL` (PostgreSQL havolasi)
   - `JWT_SECRET` (Ixtiyoriy maxfiy kalit)
   - `COOKIE_SECRET` (Maxfiy kalit)
   - `CORS_ORIGIN=https://millytour.uz,https://admin.millytour.uz`
   - Click va Payme ma'lumotlari (`CLICK_SERVICE_ID`, `PAYME_MERCHANT_ID` va h.k.)
6. Railway loyihasiga `api.millytour.uz` custom domenini ulang.

### 2. Frontend (Vercel)
1. [Vercel.com](https://vercel.com) da yangi loyiha (Add New -> Project) oching.
2. Repozitoriyni tanlang va sozlamalarni quyidagicha belgilang:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Vite
3. Environment Variables bo'limiga:
   - `VITE_API_URL=https://api.millytour.uz`
4. Loyihaning **Settings -> Domains** qismiga `millytour.uz` domenini qo'shing.

### 3. Super Admin Paneli (Vercel)
1. Vercel'da yana bitta yangi loyiha oching va xuddi shu repozitoriyni tanlang:
   - **Root Directory:** `admin`
   - **Framework Preset:** Vite
2. Environment Variables:
   - `VITE_API_URL=https://api.millytour.uz`
3. Domains bo'limiga `admin.millytour.uz` domenini qo'shing.

### 4. Partner Telegram Bot (Railway)
1. Railway'da yangi xizmat (Service) qo'shing:
   - **Root Directory:** `bot`
   - **Start Command:** `node dist/bot.js`
2. Variables bo'limiga:
   - `API_URL=https://api.millytour.uz`
   - `TELEGRAM_BOT_TOKEN=sizning_bot_tokeningiz`

---

## 🔗 Eskiz.uz DNS Sozlamalari

Eskiz.uz shaxsiy kabinetingizdagi **DNS boshqaruvi** bo'limiga quyidagi yozuvlarni qo'shing:

| Turi | Host / Subdomain | Qiymat (Value) | Maqsadi |
| :--- | :--- | :--- | :--- |
| **A** | `@` (yoki bo'sh) | `76.76.21.21` | `millytour.uz` (Frontend Vercel) |
| **CNAME** | `www` | `cname.vercel-dns.com.` | `www.millytour.uz` yo'naltiruvchi |
| **CNAME** | `admin` | `cname.vercel-dns.com.` | `admin.millytour.uz` (Admin Vercel) |
| **CNAME** | `api` | `<railway-app-domen>.up.railway.app` | `api.millytour.uz` (Backend Railway) |

---

## 🛡 Xavfsizlik Qoidalari
- Hech qanday `.env` fayllari yoki maxfiy kalitlar Git repozitoriyasiga kiritilmaydi.
- Cookie-fayllar `HttpOnly`, `SameSite: Lax` va productionda `Secure` bayroqlari bilan himoyalangan.
- Barcha nozik operatsiyalar (hamkor arizalarini tasdiqlash, to'lovlarni qaytarish) `audit_logs` jadvalida administrator ismi va IP manzili bilan qayd etiladi.
