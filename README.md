# MillyTour

MillyTour is a Vite + React travel platform with a local Express REST backend and SQLite database.

## Repository layout

Frontend va backend alohida npm workspace'larga ajratilgan; ildizdagi `package.json` faqat ularni boshqaradi (dev runner, audit skriptlari, format).

```text
millytour/
├── frontend/              # Vite + React ilovasi (npm workspace)
│   ├── index.html
│   ├── vite.config.ts     # root + envDir shu yerda
│   ├── package.json       # faqat frontend bog'liqliklari
│   ├── public/
│   └── src/               # app/ + features/ + shared/ (pastga qarang)
├── backend/               # Express backend (npm workspace)
│   ├── server/index.mjs   # REST API (:4000)
│   ├── server/dev.mjs     # backend + frontend'ni birga ko'taruvchi dev runner
│   ├── api/index.mjs      # backend uchun serverless entry
│   ├── data/millytour.db  # SQLite fayli
│   ├── main.ts            # Deno static server (frontend/dist ni beradi)
│   └── package.json       # backend bog'liqliklari (express, sqlite3, ...)
├── api/index.mjs          # Vercel funksiyasi → backend/server/index.mjs
├── scripts/               # ui-audit, ai-setup
├── package.json           # workspace ildizi
└── .env.local             # ikkala tomon o'qiydigan yagona env fayli
```

Vercel shu strukturada ham o'zgarmaydi: root papka repo ildizi bo'lib qoladi, funksiya sifatida ildizdagi `api/index.mjs` (backend'ga yo'naltiruvchi yupqa qobiq) olinadi, statik chiqish esa `frontend/dist`.

Ildizdagi buyruqlar o'zgarmagan — skriptlar workspace'ga yo'naltiriladi:

| Buyruq | Nima qiladi |
| --- | --- |
| `npm run dev` | backend + frontend birgalikda |
| `npm run dev:web` | faqat Vite (`frontend/`) |
| `npm run start:api` | faqat Express (`backend/`) |
| `npm run build` | `frontend/` ni typecheck qilib build qiladi → `frontend/dist` |
| `npm run typecheck` / `lint` / `preview` | `frontend/` workspace'ida bajariladi |

## Frontend strukturasi (`frontend/src`)

Kod uch qatlamga bo'lingan — **feature-first** tartib:

```text
frontend/src/
├── app/                       # ilova yadrosi: entry, routing, global css
│   ├── main.tsx               # Router, lazy route'lar, error boundary'lar
│   ├── index.css              # Tailwind + global stillar
│   ├── instrumentation.tsx
│   └── pages/not-found.tsx    # 404
├── features/                  # domen bo'yicha bo'lingan modullar
│   ├── home/                  # landing sahifasi va bo'limlari
│   ├── tours/                 # tur paketlar, yo'nalishlar, takliflar
│   ├── destinations/          # shaharlar
│   ├── services/              # xizmatlar sahifalari va buyurtma formalari
│   ├── ai/                    # Milly AI: chat, tavsiya engine, planner
│   ├── auth/                  # kirish, guard'lar, onboarding
│   ├── account/               # shaxsiy kabinet
│   ├── admin/                 # super admin panel
│   ├── partners/              # hamkorlar sahifasi va hamkor paneli
│   ├── marketplace/           # hunarmandlar
│   ├── documents/             # huquqiy hujjatlar
│   └── reviews/               # sharhlar (hozircha saytda ulanmagan)
└── shared/                    # domenga bog'lanmagan umumiy qatlam
    ├── api/client.ts          # REST client (useRestQuery/useRestMutation)
    ├── components/            # dizayn tizimi (ui/) + umumiy bloklar
    ├── data/catalog.ts        # umumiy katalog ma'lumotlari
    ├── hooks/                 # umumiy hook'lar (use-mobile)
    ├── lib/                   # utils, currency, i18n, vly-integrations
    ├── types/                 # global tiplar
    └── assets/
```

Har bir feature o'z ichida `components/`, `pages/`, `hooks/`, `lib/`, `data/` papkalaridan faqat keraklilarini saqlaydi. Import'lar doim `@/` alias'i bilan yoziladi (`@/features/...`, `@/shared/...`, `@/app/...`). Yangi kod qo'shganda: sahifa va o'sha domenga tegishli narsa `features/<domen>/` ga, umuman qayta ishlatiladigan narsa `shared/` ga tushadi.

## Local development

```bash
npm install
npm run seed   # demo ma'lumot (birinchi marta)
npm run dev
```

The command starts Vite at `http://localhost:5173`, Express at `http://127.0.0.1:4000`, and initializes `backend/data/millytour.db`. The browser communicates with the backend through `/api`.

Other scripts:

```bash
npm run dev:admin  # admin panel: http://localhost:3000/admin (panel rejimi)
npm run dev:partner # hamkor paneli: http://localhost:3001/partner (panel rejimi)
npm run build      # typecheck + production build
npm run typecheck  # tsc -b
npm run lint       # eslint
npm run preview    # serve the production build
npm run audit:ui   # responsive audit: overflow + chat size + marquee (dev server yoniq bo'lsin)
npm run audit:admin # admin panel oqimi: guard → OTP kirish → super admin panel (:3000 yoniq bo'lsin)
npm run seed       # bazani demo ma'lumot bilan to'ldirish
```

## Demo ma'lumot (`npm run seed`)

`backend/data/*.db` git'ga tushmaydi, shuning uchun yangi muhitda (lokal yoki serverda)
baza bo'sh bo'ladi va admin panel, hamkor paneli hamda kabinet bo'sh ko'rinadi.
Seed skript kutgan shakldagi boy ma'lumot yozadi — bir xil seed har doim bir xil
natija beradi (deterministik).

| Nima | Miqdor va holatlar |
| --- | --- |
| Foydalanuvchilar | 59 — 1 super admin, 26 sayohatchi, 27 hamkor hisobi (+ ilova ochganda yaratilganlar) |
| Hamkorlar (`provider`) | 27 — 8 yo'nalish, `approved` / `pending` / `paused`, reyting, obuna, mashina/xona |
| Tur paketlar (`package`) | 13 — `packages/list` shu yozuvlardan o'qiydi |
| Buyurtmalar (`booking`) | 262 — **3 tur**: tur paket (206), xizmat (20), transfer (36) |
| To'lovlar (`payment`) | 189 — Click / Payme / UZCARD, bir qismi qaytarilgan |
| Vazifalar (`assignment`) | 193 — hamkorlarga biriktirilgan, `pending` / `accepted` / `done` |
| Marketplace (`market_item`) | 29 — `approved` / `pending` / `rejected` |
| Sharhlar | 64 sharh + 48 reaksiya |
| Lead'lar (`lead`) | 20 — botdan kelgan hamkorlik so'rovlari |
| Bot hodisalari (`telegram_event`) | 96 — uchala bot: `/start`, `/orders`, `/plans`, `/stats`, Xato holatlari ham |
| AI rejalar (`plan`) | 12 — kabinetdagi "Mening dasturlarim" uchun |
| Tadbirlar (`event`) | 13 — takrorlanuvchi festivallar (oy yorlig'i so'rovda hisoblanadi) |
| Hamkor to'lovlari (`payout`) | 60 — `pending` / `paid`, komissiya va net summa |
| Obuna hisob-fakturalari (`subscription_invoice`) | 120 — 6 oylik, `paid` / `unpaid` |
| Bildirishnomalar (`notification`) | 84 — `site` / `telegram` / `email` kanallari |
| Yordam so'rovlari (`support_ticket`) | 14 — `open` / `pending` / `resolved` |
| Hujjatlar (`document`) | 24 — shartnoma, litsenziya, voucher, polis |
| Audit jurnali (`audit_log`) | 64 — admin harakatlari (`panel` / `bot` / `api`) |

xorijiy ma'lumot **transfer** bo'yicha alohida boy: 12 yo'nalish (Toshkent aeroporti → mehmonxona,
Toshkent → Samarqand, Buxoro → Xiva, Urganch aeroporti → Xiva, Nurota → Aydar ko'li va boshqalar),
har birida mashina modeli, o'rindiq soni, masofa va soatlar bor.

```bash
npm run seed                       # baza bo'sh bo'lsa to'ldiradi, aks holda tegmaydi
npm run seed -- --reset            # demo ma'lumotni qaytadan yozadi
npm run seed -- --admin=me@mail.uz # super admin emailini o'zgartirish
```

> `--force` ishlatilmaydi: npm uni o'zining global flagi deb o'qib yuboradi.

Kirish uchun namuna hisoblar (parol yo'q — email OTP, `SHOW_DEV_OTP=true` bo'lsa kod ekranda):

| Rol | Email | Qayerda |
| --- | --- | --- |
| Super admin | `admin@millytour.uz` | `npm run dev:admin` → `http://localhost:3000/admin` |
| Hamkor (Gid) | `registon.gidlar.jamoasi@partner.millytour.uz` | `npm run dev:partner` → `http://localhost:3001/partner` |
| Sayohatchi | `aziz.karimov@millytour.uz` | `http://localhost:5173/dashboard` |

### Panellar alohida portda (va alohida domenda)

| Skript | Port | Rejim | Marshrutlar |
| --- | --- | --- | --- |
| `npm run dev` | 5173 | public | butun sayt |
| `npm run dev:admin` | 3000 | `VITE_APP_PANEL=admin` | `/admin`, `/auth` |
| `npm run dev:partner` | 3001 | `VITE_APP_PANEL=partner` | `/partner`, `/auth` |

Panel rejimlarida ilova faqat o'z marshrutlarini ko'rsatadi, qolgan barcha manzillar panelga yo'naltiriladi. Uchtasi ham bitta backenddan (`:4000`) foydalanadi — backend allaqachon ishlayotgan bo'lsa qayta ishga tushirilmaydi, shu sababli `npm run dev` bilan bir vaqtda ochish mumkin.

Localda super admin bo'lish: `http://localhost:3000/admin` → `/auth` orqali kirish (`.env.local` da `SHOW_DEV_OTP=true` bo'lsa OTP ekranda ko'rsatiladi). Tizimda hali admin yo'q bo'lsa, panel "Administrator bo'lish" tugmasini beradi — bir marta bosilsa, keyingi kirishlarda to'liq super admin paneli ochiladi.

### Vercel'ga deploy (frontend)

Vercel'da **ikki loyiha bir xil repodan** deploy qilinadi (sayt va admin panel):

| Loyiha | Domen | Sozlama |
| --- | --- | --- |
| Sayt | `millytour.vercel.app` | `VITE_API_URL=https://<backend-domen>` |
| Admin | `millytour-adm.vercel.app` | `VITE_API_URL=...` + `VITE_ADMIN_ONLY=1` |

Qadamlar:

1. Vercel → **Add New → Project** → GitHub repo'ni tanlang.
2. **Root Directory** ni **bo'sh (repo ildizi)** qoldiring — `vercel.json` shu yerda
turibdi va build buyrug'i workspace orqali ishlaydi (`npm run build -w millytour-tourist`,
chiqish `frontend/dist`). `frontend/` ni root qilib qo'yilsa build buziladi.
3. **Environment Variables** (build paytida kerak, keyin o'zgartirsangiz **redeploy** shart):

| Kalit | Qiymat | Nima uchun |
| --- | --- | --- |
| `VITE_API_URL` | `https://<backend-domen>` (Railway/Render) | brauzer API'ni shu manzildan chaqiradi |
| `VITE_ADMIN_ONLY` | `1` — faqat admin loyihasida | panel rejimi |

4. **Deploy** → `vercel.app` domeni beriladi.
5. Backend tomonda (Railway/Render/host) shu uchta env **shart**, aks holda kirish
"ishlagandek" ko'rinib, sessiya saqlanmaydi:

```bash
SITE_URL=https://<vercel-domen>          # Telegram webhook manzili
CORS_ORIGIN=https://<vercel-domen>,https://<admin-vercel-domen>
COOKIE_SAME_SITE=none                     # vercel.app va railway.app — turli sayt
COOKIE_SECURE=true
SHOW_DEV_OTP=true                         # demoda email/pushsiz kirish uchun
```

> ⚠️ `vercel.json` dagi `/api/:path*` → `/api/index.mjs` qatori Express'ni **serverless
> funksiya** sifatida ulaydi, lekin baza SQLite fayl (`backend/data/*.db`) — serverless
> fayl tizimi esa vaqtinchalik. Shu sababli **backend Vercel'da ishlamaydi**: u alohida
> hostda turadi, frontend esa `VITE_API_URL` orqali unga murojaat qiladi.
> `VITE_API_URL` bo'sh qolsa brauzer Vercel funksiyasiga uradi va API bo'sh javob beradi.

CLI orqali (lokal):

```bash
npx vercel login
npx vercel --prod          # repo ildizidan
```

## Telegram botlar

Uchta bot bitta dvigatelda ishlaydi (`backend/server/telegram.mjs`):

| Bot | Username | Vazifasi | Env |
| --- | --- | --- | --- |
| Main | `@mllytour_bot` | Mijozlar: `/start`, `/orders`, `/plans`, buyurtma va yordam | `TELEGRAM_MAIN_BOT_TOKEN` |
| Auth | `@mtour_auth_bot` | Saytga kirishni tasdiqlash, hamkor ro'yxatdan o'tishi | `TELEGRAM_AUTH_BOT_TOKEN` |
| Stats | `@mtour_by_statik_bot` | Egasi uchun `/stats` ko'rsatkichlari | `TELEGRAM_STATS_BOT_TOKEN` |

`OWNER_TELEGRAM_ID` (egasining Telegram ID'si) statistika va test xabarlari uchun ishlatiladi.

**Tokenlarni ikki yo'l bilan berish mumkin** — baza `.env` dan ustun turadi va qayta ishga tushirishni talab qilmaydi:

```bash
# 1) Bazaga yozish (panel bilan bir xil joy) — `--main-username=...` ixtiyoriy
npm run bots -- --main=8821...:AAHE... --auth=8997...:AAFh... --stats=8855...:AAEg... --owner=6724823030
npm run bots                 # hozirgi holatni ko'rsatadi (tokenlar maskalangan)

# 2) `.env.local` ga yozish (serverda tavsiya etiladi)
TELEGRAM_MAIN_BOT_TOKEN=...
OWNER_TELEGRAM_ID=6724823030
```

Xabar oqimi ikki rejimda ishlaydi va Telegram **bir vaqtda faqat bittasiga** ruxsat beradi:

| Rejim | Qachon | Qanday |
| --- | --- | --- |
| **Polling** | lokal dev (default) | `getUpdates` orqali xabarlar o'zi olinadi — localhost'da ham login ishlaydi |
| **Webhook** | serverda (ochiq HTTPS) | Admin panel → Bot sozlamalari → **Webhook'larni ulash**, manzil `/api/telegram/<bot>` |

> Agar botda eski webhook o'rnatilgan bo'lsa, polling unga tegmaydi — `TELEGRAM_POLLING=true` qo'yilsagina
> webhook olib tashlanadi va polling egallaydi. `TELEGRAM_POLLING=false` esa polling'ni butunlay o'chiradi.

Admin panelning **Bot sozlamalari** bo'limida uchala token, egasi ID, har bir bot holati (manba: `panel` / `env`)
va *"Xabarlarni olish"* tugmasi bor. Lokalda botni Telegram'siz ham sinash mumkin:

```bash
curl -X POST http://127.0.0.1:4000/api/rest/telegram/simulate \
  -H 'Content-Type: application/json' \
  -d '{"bot":"auth","text":"/start login_<challengeId>","telegram":false}'
```

## Environment

Copy `.env.example` to `.env.local` and set server-only values there. Private AI and Telegram keys are read by Express and are never exposed through Vite.

**All keys are optional.** The app runs fully offline without any of them: the catalog, booking flow, partner dashboard and Milly AI all work. Setting a key only replaces the corresponding fallback:

| Variable | Without it | With it |
| --- | --- | --- |
| `GROQ_API_KEY` | Milly AI answers from the rule-based engine | Same recommendations, but the wording is written by the LLM |
| `TELEGRAM_MAIN_BOT_TOKEN` | Telegram update'lari simulyatsiya qilinadi (`/api/telegram/:bot/simulate`) | Real bot javob beradi — `main` bot mijozlarga, `auth` bot kirishni tasdiqlashga, `stats` bot egasiga xizmat qiladi |
| `OWNER_TELEGRAM_ID` | `stats` boti va test xabarlari uchun chat yo'q | Statistika va test xabarlar egasiga boradi |
| `DODO_*` | Payments return a local mock reference | Real checkout sessions |
| `AUTH_GOOGLE_*` | Email one-time-code login only | Google sign-in |

`SHOW_DEV_OTP=true` returns the email login code in the API response so you can log in locally without mail.

## Milly AI

Milly AI recommends **only the tour packages that already exist** in `frontend/src/shared/data/catalog.ts` — it never invents trips or prices.

- `frontend/src/features/ai/lib/ai-recommend.ts` — the recommender. It ranks the catalog by price against the user's budget (budget fit is the primary signal, then city, category, trip length, rating), and always stays inside the budget when a budget is given. Each result carries a price-based explanation.
- `frontend/src/features/ai/components/planner-chat.tsx` — the chat flow. After the two itinerary variants it lists the top catalog matches, and every free-chat message sends the ranked catalog to the backend as `catalog` context.
- `backend/server/index.mjs` — `millyChat.chat` passes that context to the LLM as the *only* allowed source (see `CATALOG_RULE`); when no key is configured it replies from the same context with `catalogReply()`.
- `aiStatus.status` reports `engine: "llm" | "rule-based"` and `recommender: "catalog-price"`, which the chat header shows to the user.

To enable the model later, set `GROQ_API_KEY` (and optionally `GROQ_MODEL`) in `.env.local` and restart the backend. No code changes are required.

## Fon va hero

Sayt fonida **hech qanday rasm yo'q**: `body` da `background-image: none` (`frontend/src/app/index.css`), hero ham toza oq fonda, matnlar to'q rangda (`frontend/src/features/home/pages/landing.tsx` dagi `Hero()`). Dekorativ SVG naqsh (`PatternOverlay`) va barcha fon qatlamlari olib tashlangan.

Ichki sahifalarning sarlavhasi (`PageHero`) va brend bloklari hali ham ko'k gradientda — bu sahifa foni emas, alohida bloklar.

## Tur paketlar va yo'nalishlar

Turlar ikki turga bo'linadi (`frontend/src/features/tours/lib/tours.ts`):

- **Tur paket** (`package`) — bitta shahar yoki hududga qaratilgan paket, masalan `Samarqand · Samarqand viloyati`.
- **Yo'nalish** (`direction`) — 2-3 shaharni birlashtirgan katta tur. Katalogda bunday paketning `city` maydoni `·` bilan yoziladi (`Toshkent · Samarqand · Buxoro`) — shu belgi asosida avtomatik aniqlanadi.

Ko'rinish:

- Bosh sahifadagi "Tur paketlar va yo'nalishlar" bo'limida **tur turi tablari** (`TourKindTabs`) — ikki tur bitta bo'lim ichida ajratiladi, tagida turkum filtri qoladi.
- `/paketlar` sahifasida ham **"Turi"** filtri bor (`?kind=package` / `?kind=direction`).
- Har bir kartochkada: manzil (shahar + viloyat, xarita belgisi bilan), tur nomi, kunlar/kechalar, reyting va sharhlar, guruh hajmi hamda narx ($ va so'm). Yo'nalishlarda qo'shimcha **"Yo'nalish · N shahar"** nishoni va viloyat satri chiqadi.

## Yo'nalishlar (shaharlar)

Shahar sahifalari mavjud tur paketlar va `CITY_SPOTS` ma'lumotlari asosida dinamik quriladi (`frontend/src/features/destinations/data/destinations.ts`).

- Sahifalar: `/shaharlar` (ro'yxat) va `/shaharlar/:slug` (obidalar, faktlar, paketlar, yon panel). Menyudan va footer'dan kiriladi.
- Kartochka: `frontend/src/features/destinations/components/destination-card.tsx`.

## Bosh sahifa bo'limlari

Hero → ishonch qatori → **qidiruv paneli** → qanday ishlaydi → **tur paketlar va yo'nalishlar** → tadbirlar → **Top takliflar** (`frontend/src/features/tours/components/top-deals.tsx`) → xizmatlar → hunarmandlar → Milly AI → **afzalliklar qatori** (`frontend/src/features/home/components/advantages.tsx`) → hamkorlik CTA.

Qidiruv paneli ixcham: faqat **shahar · kunlar · odam soni** (1104×74px). Yuborilganda `/paketlar?city=…&days=…&guests=…` ga o'tadi. Bosh sahifadagi hero karuselida esa faqat kartochkalar qolgan (nuqtalar, izoh va skrol ishorasi olib tashlangan).

> "Mijozlar fikri" bo'limi hozircha o'chirilgan. Kodi (`frontend/src/features/reviews/lib/reviews.ts`, `frontend/src/features/reviews/hooks/use-review-reactions.ts`, serverdagi `reviews.reactions` / `reviews.toggleReaction`) saqlanib turibdi — kerak bo'lganda qayta ulanadi.

## Footer

`frontend/src/shared/components/site.tsx` dagi `SiteFooter` — ustunlarga bo'lingan:

1. **Brend + qo'llab-quvvatlash** (yuqori qator): logo, tavsif, ijtimoiy tarmoq tugmalari, 24/7 telefon va Telegram bot kartasi (`@mllytour_bot` — `MAIN_BOT_USERNAME` dan olinadi).
2. **Sayohat** — tur paketlar, yo'nalishlar, xizmatlar, hunarmandlar, hamkorlar, kabinet.
3. **Yo'nalishlar** — `DESTINATIONS` dan dinamik (yangi shahar qo'shsangiz, ustunda o'zi paydo bo'ladi).
4. **Xizmatlar** — 7 ta xizmat sahifasi.
5. **Hamkorlarga** — hamkorlik shartlari, hamkor paneli, admin, hujjatlar.
6. **Aloqa** — manzil, telefon, email, ish vaqti.

Pastdagi huquqiy qatorda: yuridik havolalar (`/hujjatlar#maxfiylik`, `#foydalanish`, `#oferta`), dinamik yil bilan copyright va to'lov tizimlari (`Click`, `Payme`, `UZCARD`, `VISA`) ko'rsatilgan.

Kontakt, ijtimoiy tarmoq va to'lov tarmoqlari — `FOOTER_CONTACT`, `FOOTER_SOCIALS`, `PAYMENTS` konstantalarida (bitta joyda o'zgartiriladi).

## Pages

Public, wrapped in `SiteLayout` (header, footer, bottom nav): `/`, `/paketlar`, `/paketlar/:slug`, `/shaharlar`, `/shaharlar/:slug`, `/xizmatlar`, `/xizmatlar/:service`, `/hunarmandlar`, `/hamkorlar`, `/hujjatlar`, 404.
Standalone: `/auth`, and behind `RequireAuth`: `/dashboard`, `/partner`, `/admin`.

## Architecture

```text
React/Vite -> Express REST API -> SQLite
Telegram   -> Express REST API -> SQLite
Groq       <- Express REST API
```

Frontend `frontend/` (Vite + React) va backend `backend/` (Express + SQLite) npm workspace'larga ajratilgan. Route'lar `frontend/src/features/*/pages` da, umumiy UI esa `frontend/src/shared` da. REST bindings live in `frontend/src/shared/api/client.ts`; database initialization and server routes live in `backend/server/index.mjs`.

`SiteLayout` sahifa almashganda skrolni boshqaradi: yangi sahifada yuqoriga qaytadi, `#bo'lim` havolalarida esa shu bo'limga suradi (footer'dagi yuridik havolalar shu bilan ishlaydi).
