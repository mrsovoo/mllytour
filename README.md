# Millytour

Millytour is a Vite + React travel platform with a local Express REST backend and SQLite database.

## Local development

```bash
npm install
npm run dev
```

The command starts Vite at `http://localhost:5173`, Express at `http://127.0.0.1:4000`, and initializes `data/millytour.db`. The browser communicates with the backend through `/api`.

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
```

### Panellar alohida portda (va alohida domenda)

| Skript | Port | Rejim | Marshrutlar |
| --- | --- | --- | --- |
| `npm run dev` | 5173 | public | butun sayt |
| `npm run dev:admin` | 3000 | `VITE_APP_PANEL=admin` | `/admin`, `/auth` |
| `npm run dev:partner` | 3001 | `VITE_APP_PANEL=partner` | `/partner`, `/auth` |

Panel rejimlarida ilova faqat o'z marshrutlarini ko'rsatadi, qolgan barcha manzillar panelga yo'naltiriladi. Uchtasi ham bitta backenddan (`:4000`) foydalanadi — backend allaqachon ishlayotgan bo'lsa qayta ishga tushirilmaydi, shu sababli `npm run dev` bilan bir vaqtda ochish mumkin.

Localda super admin bo'lish: `http://localhost:3000/admin` → `/auth` orqali kirish (`.env.local` da `SHOW_DEV_OTP=true` bo'lsa OTP ekranda ko'rsatiladi). Tizimda hali admin yo'q bo'lsa, panel "Administrator bo'lish" tugmasini beradi — bir marta bosilsa, keyingi kirishlarda to'liq super admin paneli ochiladi.

Vercel'da ikki loyiha bir xil repodan deploy qilinadi:

| Loyiha | Domen | Sozlama |
| --- | --- | --- |
| Sayt | `millytour.vercel.app` | qo'shimcha env yo'q |
| Admin | `millytour-adm.vercel.app` | `VITE_ADMIN_ONLY=1` |

## Environment

Copy `.env.example` to `.env.local` and set server-only values there. Private AI and Telegram keys are read by Express and are never exposed through Vite.

**All keys are optional.** The app runs fully offline without any of them: the catalog, booking flow, partner dashboard and Milly AI all work. Setting a key only replaces the corresponding fallback:

| Variable | Without it | With it |
| --- | --- | --- |
| `GROQ_API_KEY` | Milly AI answers from the rule-based engine | Same recommendations, but the wording is written by the LLM |
| `TELEGRAM_*_BOT_TOKEN` | Telegram login/webhook responses are simulated | Real bot messages are sent |
| `DODO_*` | Payments return a local mock reference | Real checkout sessions |
| `AUTH_GOOGLE_*` | Email one-time-code login only | Google sign-in |

`SHOW_DEV_OTP=true` returns the email login code in the API response so you can log in locally without mail.

## Milly AI

Milly AI recommends **only the tour packages that already exist** in `src/data/catalog.ts` — it never invents trips or prices.

- `src/lib/ai-recommend.ts` — the recommender. It ranks the catalog by price against the user's budget (budget fit is the primary signal, then city, category, trip length, rating), and always stays inside the budget when a budget is given. Each result carries a price-based explanation.
- `src/components/planner-chat.tsx` — the chat flow. After the two itinerary variants it lists the top catalog matches, and every free-chat message sends the ranked catalog to the backend as `catalog` context.
- `server/index.mjs` — `millyChat.chat` passes that context to the LLM as the *only* allowed source (see `CATALOG_RULE`); when no key is configured it replies from the same context with `catalogReply()`.
- `aiStatus.status` reports `engine: "llm" | "rule-based"` and `recommender: "catalog-price"`, which the chat header shows to the user.

To enable the model later, set `GROQ_API_KEY` (and optionally `GROQ_MODEL`) in `.env.local` and restart the backend. No code changes are required.

## Fon va hero

Sayt fonida **hech qanday rasm yo'q**: `body` da `background-image: none` (`src/index.css`), hero ham toza oq fonda, matnlar to'q rangda (`src/pages/Landing.tsx` dagi `Hero()`). Dekorativ SVG naqsh (`PatternOverlay`) va barcha fon qatlamlari olib tashlangan.

Ichki sahifalarning sarlavhasi (`PageHero`) va brend bloklari hali ham ko'k gradientda — bu sahifa foni emas, alohida bloklar.

## Tur paketlar va yo'nalishlar

Turlar ikki turga bo'linadi (`src/lib/tours.ts`):

- **Tur paket** (`package`) — bitta shahar yoki hududga qaratilgan paket, masalan `Samarqand · Samarqand viloyati`.
- **Yo'nalish** (`direction`) — 2-3 shaharni birlashtirgan katta tur. Katalogda bunday paketning `city` maydoni `·` bilan yoziladi (`Toshkent · Samarqand · Buxoro`) — shu belgi asosida avtomatik aniqlanadi.

Ko'rinish:

- Bosh sahifadagi "Tur paketlar va yo'nalishlar" bo'limida **tur turi tablari** (`TourKindTabs`) — ikki tur bitta bo'lim ichida ajratiladi, tagida turkum filtri qoladi.
- `/paketlar` sahifasida ham **"Turi"** filtri bor (`?kind=package` / `?kind=direction`).
- Har bir kartochkada: manzil (shahar + viloyat, xarita belgisi bilan), tur nomi, kunlar/kechalar, reyting va sharhlar, guruh hajmi hamda narx ($ va so'm). Yo'nalishlarda qo'shimcha **"Yo'nalish · N shahar"** nishoni va viloyat satri chiqadi.

## Yo'nalishlar (shaharlar)

Shahar sahifalari mavjud tur paketlar va `CITY_SPOTS` ma'lumotlari asosida dinamik quriladi (`src/data/destinations.ts`).

- Sahifalar: `/shaharlar` (ro'yxat) va `/shaharlar/:slug` (obidalar, faktlar, paketlar, yon panel). Menyudan va footer'dan kiriladi.
- Kartochka: `src/components/destination-card.tsx`.

## Bosh sahifa bo'limlari

Hero → ishonch qatori → **qidiruv paneli** → qanday ishlaydi → **tur paketlar va yo'nalishlar** → tadbirlar → **Top takliflar** (`src/components/top-deals.tsx`) → xizmatlar → hunarmandlar → Milly AI → **afzalliklar qatori** (`src/components/advantages.tsx`) → hamkorlik CTA.

Qidiruv paneli ixcham: faqat **shahar · kunlar · odam soni** (1104×74px). Yuborilganda `/paketlar?city=…&days=…&guests=…` ga o'tadi. Bosh sahifadagi hero karuselida esa faqat kartochkalar qolgan (nuqtalar, izoh va skrol ishorasi olib tashlangan).

> "Mijozlar fikri" bo'limi hozircha o'chirilgan. Kodi (`src/lib/reviews.ts`, `src/hooks/use-review-reactions.ts`, serverdagi `reviews.reactions` / `reviews.toggleReaction`) saqlanib turibdi — kerak bo'lganda qayta ulanadi.

## Footer

`src/components/site.tsx` dagi `SiteFooter` — ustunlarga bo'lingan:

1. **Brend + qo'llab-quvvatlash** (yuqori qator): logo, tavsif, ijtimoiy tarmoq tugmalari, 24/7 telefon va Telegram bot kartasi (`@millytour_bot` — `MAIN_BOT_USERNAME` dan olinadi).
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

The existing React routes and UI remain in `src/pages` and `src/components`. REST bindings live in `src/api/client.ts`; database initialization and server routes live in `server/index.mjs`.

`SiteLayout` sahifa almashganda skrolni boshqaradi: yangi sahifada yuqoriga qaytadi, `#bo'lim` havolalarida esa shu bo'limga suradi (footer'dagi yuridik havolalar shu bilan ishlaydi).
# millytour
