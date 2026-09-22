# Deploy: frontend va backend qanday ulanadi

Frontend va backend **alohida** joylashtirilishi mumkin. Ular orasidagi bog'lanish
faqat uchta narsadan iborat: **API manzili**, **CORS** va **sessiya cookie'si**.

```text
brauzer ──► frontend (statik build)          backend (Express :4000)
                 │                                  ▲
                 └── /api/... so'rovi ──────────────┘
                     + millytour_session cookie
```

- REST chaqiruvlar: `frontend/src/shared/api/client.ts` (`API_BASE`, `apiUrl()`)
- Auth chaqiruvlari: `frontend/src/features/auth/hooks/use-auth.ts`,
  `.../components/auth-choice-dialog.tsx`
- Sessiya: `millytour_session` cookie → SQLite `sessions` jadvali

## Variant A — bitta domen (tavsiya, kod o'zgarishi yo'q)

Nginx frontend'ni statik beradi, `/api/` ni esa backend'ga proksi qiladi.
Namuna: [`nginx.conf.example`](./nginx.conf.example).

| Sozlama | Qiymat |
| --- | --- |
| `VITE_API_URL` | bo'sh (nisbiy `/api/...`) |
| `CORS_ORIGIN` | kerak emas (bir xil origin) |
| `COOKIE_*` | kerak emas (`SameSite=Lax` yetarli) |

Deploy qadamlar:

```bash
git clone <repo> && cd millytour
npm install                                  # ikkala workspace
cp .env.example .env                          # backend o'qiydigan qiymatlar
npm run build                                 # → frontend/dist
npm run seed                                  # baza bo'sh bo'lgani uchun SHART
npm run bots                                  # bot holati (token bor/yo'q)
npm run start:api                             # Express :4000 (systemd/pm2 bilan)
```

> `backend/data/*.db` git'ga tushmaydi — birinchi ishga tushirishda baza bo'sh
> bo'ladi va admin/hamkor panellari bo'sh ko'rinadi. `npm run seed` shu bo'shliqni
> to'ldiradi (super admin, hamkorlar, buyurtmalar, to'lovlar, sharhlar va h.k.).
> Baza boshqa joyda saqlanishi kerak bo'lsa `DATABASE_PATH=/var/lib/millytour/millytour.db`,
> super admin emaili boshqa bo'lsa `SEED_ADMIN_EMAIL=me@millytour.uz` qo'yiladi.

## Variant B — ikki alohida domen

Masalan frontend `millytour.uz`, backend `api.millytour.uz`:

| Sozlama | Qiymat | Nima uchun |
| --- | --- | --- |
| `VITE_API_URL` | `https://api.millytour.uz` | frontend shu manzilga so'rov yuboradi (build paytida kodga yoziladi → o'zgarsa **qayta build**) |
| `CORS_ORIGIN` | `https://millytour.uz,https://millytour-adm.vercel.app` | backend faqat shu saytlarga javob beradi |
| `COOKIE_SAME_SITE` | `lax` | `millytour.uz` va `api.millytour.uz` — bir sayt hisoblanadi |
| `COOKIE_SECURE` | `true` | HTTPS majburiy |
| `COOKIE_DOMAIN` | `.millytour.uz` | sessiyani barcha subdomenlarga ulashish (ixtiyoriy) |

⚠️ Agar frontend va backend **butunlay boshqa saytlarda** bo'lsa (masalan
`*.vercel.app` + `*.onrender.com`), `SameSite=Lax` cookie yuborilmaydi va login
"ishlagandek" ko'rinib, aslida sessiya saqlanmaydi. Bunda:

```bash
COOKIE_SAME_SITE=none
COOKIE_SECURE=true
CORS_ORIGIN=https://<frontend-domen>
```

Diqqat: `foo.vercel.app` va `bar.vercel.app` — **turli sayt** hisoblanadi
(vercel.app public suffix ro'yxatida).

## Telegram botlar serverda

Serverda botlar **webhook** rejimida ishlaydi (Telegram faqat HTTPS manzilni qabul qiladi):

```bash
# 1) Tokenlarni `.env` ga yozing (yoki `npm run bots -- --main=... --auth=... --stats=...`)
TELEGRAM_MAIN_BOT_TOKEN=...
TELEGRAM_AUTH_BOT_TOKEN=...
TELEGRAM_STATS_BOT_TOKEN=...
OWNER_TELEGRAM_ID=6724823030
SITE_URL=https://api.millytour.uz        # webhook shu manzilga o'rnatiladi
TELEGRAM_POLLING=false                   # productionda polling o'chiriladi

# 2) Webhook'larni ulang (admin panel → Bot sozlamalari) yoki:
curl -X POST https://api.millytour.uz/api/rest/telegram/registerWebhooks \
  -H 'Content-Type: application/json' -H 'Cookie: millytour_session=<admin-sessiya>' -d '{}'
```

Manzillar: `/api/telegram/main`, `/api/telegram/auth`, `/api/telegram/stats`
(`TELEGRAM_WEBHOOK_SECRET` qo'yilsa Telegram `secret_token` bilan keladi va tekshiriladi).

⚠️ **Telegram bir vaqtda faqat bitta manbaga ruxsat beradi.** Agar botlarda allaqachon
boshqa deploy (masalan eski Convex loyihasi) webhook'i turgan bo'lsa, yangi webhook uni
almashtiradi va **eski bot javob berishdan to'xtaydi**. Lokalda polling ishlatilsa ham
`TELEGRAM_POLLING=true` faqat shu sababdan kerak — u webhook'ni olib tashlaydi.

## Muhit o'zgaruvchilari qayerda turadi

| Fayl | Kim o'qiydi |
| --- | --- |
| `.env` / `.env.local` (repo ildizi) | Express (`dotenv`) va Vite (`envDir`) |
| `.env.production` (repo ildizi) | faqat `npm run build` paytida Vite |
| hosting panelidagi env (Vercel/Render) | shu platforma ishga tushiradigan jarayon |

Seed va baza bilan bog'liq o'zgaruvchilar: `SEED_ADMIN_EMAIL`, `DATABASE_PATH`
(`npm run seed` ularni o'qiydi).

Vite `VITE_` bilan boshlanmagan kalitlarni brauzerga **hech qachon** bermaydi —
`GROQ_API_KEY`, `TELEGRAM_*`, `DODO_*` faqat backendda qoladi.

## Tekshirish

```bash
curl https://api.millytour.uz/api/health      # {"ok":true,...}
curl -i -X POST https://api.millytour.uz/api/rest/aiStatus/status \
  -H "Content-Type: application/json" -d '{}'
```

Cookie to'g'ri o'rnatilganini `Set-Cookie` sarlavhasida ko'rish mumkin:
`SameSite=None; Secure` yoki `SameSite=Lax`.
