# MillyTour Loyiha Arxitekturasi va Tuzilishi

Ushbu hujjat **MillyTour** loyihasining qanday ishlashi, texnologiyalar steki va frontend-backend arxitekturasini tushuntiradi. Hozirda loyiha bitta umumiy repozitoriy (monolit) sifatida shakllantirilgan, lekin Vercel (Frontend) va Railway (Backend) da alohida deploy qilinishi uchun ikki qismga — `frontend` va `backend` papkalariga ajratiladi.

## Texnologiyalar steki

### Frontend (Mijoz, Hamkor va Admin panellari)
- **Framework:** React 19 + Vite (TypeScript bilan)
- **UI Kutubxonalari:** TailwindCSS, Shadcn UI (Radix UI)
- **Routing:** React Router v7
- **Animatsiyalar:** Framer Motion
- **Holatni Boshqarish:** Custom hook-lar (Kichik holatlar uchun useState, API so'rovlar uchun custom fetch hooklar `useAdminQuery`, `useRestQuery`)
- **Deploy:** Vercel

### Backend (API va Ma'lumotlar bazasi)
- **Framework:** Express.js + Hono (API marshrutlari uchun)
- **Ma'lumotlar Bazasi:** SQLite (Hozircha. Railway'da PostgresSQL'ga o'tish tavsiya etiladi)
- **Autentifikatsiya:** JSON Web Token (JWT) + Cookie parser, shuningdek `@oslojs/crypto`
- **Deploy:** Railway

---

## Loyihani Ikki Qismga (Frontend va Backend) Ajratish Tuzilishi

Loyiha quyidagi tuzilishga o'tkazilishi tavsiya etiladi (Frontend va Backend alohida deploy qilinishi uchun):

```text
millytour/
├── frontend/                 # Vercel'ga yuklanuvchi qism
│   ├── public/               # Statik fayllar (rasmlar, ikonlar)
│   ├── src/                  # React kodlari
│   │   ├── api/              # API bilan ishlash uchun xizmatlar (admin.ts, client.ts)
│   │   ├── assets/           # CSS va boshqa resurslar
│   │   ├── components/       # Umumiy komponentlar (Shadcn UI, navigatsiya)
│   │   ├── data/             # Mock ma'lumotlar va konstantalar
│   │   ├── hooks/            # Custom React hook-lar
│   │   ├── layouts/          # Sahifa layout'lari (AdminLayout, PublicLayout)
│   │   ├── lib/              # Yordamchi funksiyalar (utils.ts)
│   │   ├── pages/            # Asosiy sahifalar (AdminDashboard, Landing va h.k.)
│   │   ├── types/            # TypeScript turlari
│   │   ├── index.css         # Asosiy Tailwind stillari
│   │   └── main.tsx          # React loyihani ishga tushiruvchi asosiy fayl
│   ├── package.json          # Frontend dastur paketlari (React, Tailwind, Vite)
│   ├── vite.config.ts        # Vite sozlamalari
│   └── index.html            # Asosiy HTML fayl
│
├── backend/                  # Railway'ga yuklanuvchi qism
│   ├── server/               # Express/Hono backend kodlari
│   │   ├── index.mjs         # Asosiy serverni ishga tushirish
│   │   ├── dev.mjs           # Mahalliy serverni yurgizish
│   │   └── db/               # SQLite bazasi yoki Mongoose modellar (agar bo'lsa)
│   ├── package.json          # Backend paketlari (Express, Hono, sqlite3, cors)
│   └── .env                  # Backend o'zgaruvchilari (DATABASE_URL, JWT_SECRET, CORS_ORIGIN)
│
├── README.md                 # Loyiha haqida umumiy ma'lumot
└── .gitignore                # Gitga kirmaydigan fayllar (.env, node_modules)
```

---

## Tizim Qanday Ishlaydi?

### 1. Ma'lumotlar Oqimi (Data Flow)
1. Foydalanuvchi brauzer orqali Vercel'da turgan Frontend'ga (`millytour.uz`) kiradi.
2. Frontend (React) Vercel orqali HTML, CSS va JS fayllarni foydalanuvchiga jo'natadi.
3. Agar foydalanuvchiga ma'lumot (masalan, turlar, hamkorlar ro'yxati) kerak bo'lsa, React ilovasi API so'rov yuboradi.
4. API so'rovi Frontend'dagi `VITE_API_URL` manzili (masalan, `https://api.millytour.uz`) orqali Railway'da turgan Backend serverga boradi.
5. Railway'dagi Express/Hono server bazaga so'rov yuborib ma'lumotni JSON formatida frontend'ga qaytaradi.

### 2. Autentifikatsiya (Login/Parol)
- Backend **JWT (JSON Web Token)** va **Cookie**-lardan foydalanadi.
- Admin yoki Hamkor saytga kirganda backend unga yashirin token (cookie) jo'natadi.
- Frontend kelgusi har bir so'rovda bu cookie'ni avtomatik qo'shib jo'natadi. Shuning uchun Frontend'da API so'rovlarda `credentials: "include"` ishlatilgan.
- CORS (Cross-Origin Resource Sharing) sozlamalari Backend'da juda muhim! Backend Vercel domeningizdan kelayotgan so'rovlarga va cookie yuborishga ruxsat berishi uchun `.env` faylida to'g'ri `CORS_ORIGIN` ko'rsatilgan bo'lishi kerak.

### 3. Vercel (Frontend) va Railway (Backend) Deploy Tizimi
- **Vercel:** Vercel sozlamalarida "Root Directory" ni `frontend` deb belgilashingiz kerak. Vercel faqat React/Vite kodini olib, `npm run build` qiladi va statik saytni tarqatadi.
- **Railway:** Railway sozlamalarida "Root Directory" ni `backend` deb belgilashingiz kerak. Railway Express serverini ishga tushirish uchun `npm start` (bu `node server/index.mjs` ni ishlatadi) buyrug'idan foydalanadi.

---

## O'tish Bo'yicha Asosiy Tavsiyalar
- **Ma'lumotlar bazasi:** Siz hozirda SQLite'dan foydalanyapsiz, u bitta fayl sifatida saqlanadi (`.kilo/` yoki shunga o'xshash). Railway'da har safar server yangilanganda bu fayl o'chib ketadi (chunki ephemeral file system). Shuning uchun Railway'da ichki **PostgresSQL** bepul xizmatidan foydalanishga o'tish tavsiya etiladi.
- **Muhit o'zgaruvchilari (.env):** 
  - Frontend'da: `.env` faylida `VITE_API_URL=https://<railway-api-domeningiz>` (misol: api.millytour.uz) qilib sozlang.
  - Backend'da: Railway Variables qismida `CORS_ORIGIN=https://millytour.uz` ni sozlash yodingizdan chiqmasin.
