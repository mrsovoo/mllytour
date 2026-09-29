# MILLYTOUR - AUDIT REPORT

Ushbu hisobot **MillyTour MVP 1.0** loyihasining hozirgi holatini tahlil qiladi va talab qilingan arxitekturaga (Frontend, Backend, Admin, Bot) o'tish bo'yicha migratsiya rejasini o'z ichiga oladi.

## 1. CURRENT STATE (Hozirgi holat)
- **Struktura:** Loyiha yaqinda 2 ta asosiy qismga (`frontend` va `backend`) ajratilgan, lekin hanuz monorepo/kombinatsiyalashgan loyiha ko'rinishida. 
- **Frontend:** React 19, Vite, TailwindCSS va Shadcn UI ishlatilmoqda. `src/pages` papkasida Customer, Partner va Admin sahifalari aralashib yotibdi (masalan: `Admin.tsx`, `Dashboard.tsx`, `Partner.tsx`).
- **Backend:** Bitta yirik Express server fayli (`backend/server/index.mjs` - 44KB) ishlatilmoqda. API marshrutlari, biznes mantiq va ma'lumotlar bazasiga to'g'ridan-to'g'ri ulanish bitta faylda jamlangan.
- **Database:** SQLite ishlatilmoqda, jadvallar dinamik tarzda `db.exec` yordamida `index.mjs` da yaratilgan.
- **Bot:** Hozircha Telegram bot integratsiyasi va uning uchun alohida arxitektura mavjud emas.

## 2. PROBLEMS (Muammolar)
- **Arxitektura buzilishi:** Admin, Partner va Customer frontend kodlari bitta React ilovasida aralashib ketgan. Bu security va bundle size (kattalik) jihatidan xavfli. Admin sahifalar alohida loyihaga (`admin`) ajratilishi kerak.
- **Backend struktura yo'qligi:** Backend bitta yirik `index.mjs` faylda. `controllers`, `routes`, `services`, `models` (MVC yoki shunga o'xshash) kabi qatlamlarga ajratilmagan.
- **Database:** SQLite production uchun (ayniqsa Railway'da) yaroqsiz, chunki Railway fayl tizimi vaqtinchalik (ephemeral). Ma'lumotlar o'chib ketadi. PostgreSQL ga o'tish zarur.
- **Security:** Hozircha `Admin` va `Customer` uchun yagona authentication ishlayotgan bo'lishi mumkin, lekin haqiqiy role-based access control (RBAC) backend'da yaxshi shakllanmagan.
- **Telegram Bot:** Telegram bot kodlari mutlaqo yo'q (yoki ko'rinmayapti), talab bo'yicha u alohida `bot` papkasida bo'lishi va Telegram webhook orqali backend bilan ishlashi kerak.

## 3. WHAT TO KEEP (Nimalarni saqlab qolamiz)
- **UI/UX:** TailwindCSS, Shadcn UI, Framer motion asosida yozilgan Frontend komponentlari (`src/components/ui`) va umumiy dizayn kodlari saqlanadi.
- **Biznes mantiq (Qisman):** `index.mjs` da yozilgan ba'zi mantiqiy qismlarni (SQL so'rovlari va API javoblari) qayta ishlash orqali saqlash mumkin.
- **React Pages:** Mijozlar uchun yozilgan Landing, Tours (`Packages.tsx`), Profile kabi sahifalar qoladi, lekin biroz tozalanishi mumkin.

## 4. WHAT TO REMOVE (Nimalarni olib tashlaymiz)
- **SQLite fayllari va kutubxonalari:** `sqlite`, `sqlite3` dependencylari va `data/millytour.db` o'chiriladi.
- **Frontend'dagi aralash kodlar:** Frontend ilovasidan Admin paneliga tegishli barcha kodlar (ular `admin/` ilovasiga ko'chadi) o'chiriladi.
- **Eski/Ishlatilmaydigan kodlar:** Agar Convex bilan bog'liq qoldiqlar bo'lsa (hozir topilmadi, lekin `integrations` papkalarida bo'lishi mumkin) tozalab tashlanadi.

## 5. WHAT TO MIGRATE (Nimalarni ko'chiramiz/o'zgartiramiz)
- **SQLite -> PostgreSQL:** Ma'lumotlar bazasi PostgreSQL ga o'tkaziladi. ORM sifatida **Prisma** yoki **Drizzle** ishlatiladi (Prisma o'rganishga va tez ishlashga osonroq).
- **Monolit Backend -> Modular Backend:** `backend/server/index.mjs` faylidagi barcha route'lar (auth, tours, users, orders) mos ravishda `routes/` va `controllers/` papkalariga ko'chiriladi.
- **Aralash Frontend -> Workspace:** 
  - `frontend/` - Faqat Customer uchun.
  - `admin/` - Super Admin uchun alohida Vite/React loyihasi.

## 6. WHAT TO BUILD (Nimalar yangidan qurilishi kerak)
- **Telegram Partner Bot:** Node.js (Telegraf yoki node-telegram-bot-api) orqali yozilgan, hamkorlarni ro'yxatdan o'tkazish, buyurtmalarni qabul qilish uchun mo'ljallangan alohida `bot/` loyihasi.
- **PostgreSQL Migrations:** Prisma orqali barcha User, Tour, Partner, Order, Review, Memory jadvallarining qat'iy sxemalarini (Schema) yaratish.
- **RBAC (Role Based Access Control):** Backend'da middleware yozish (isAuth, isAdmin, isPartner).
- **Storage / Media handling:** Rasm yuklash uchun vaqtinchalik local fayllar emas, Cloudinary integratsiyasi yozilishi kerak.

---

**XULOSA VA KEYINGI QADAM:**
Kodni o'zgartirishdan oldin yuqoridagi **AUDIT REPORT** bilan tanishib chiqing. Agar rozilik bersangiz, **PHASE 2 (Architecture) va PHASE 3 (Database - PostgreSQL + Prisma)** ga o'tamiz va loyiha papkalarini (`admin`, `bot`, `backend`, `frontend`) to'g'ri holatga keltirib, DB sxemasini yozishni boshlaymiz.
