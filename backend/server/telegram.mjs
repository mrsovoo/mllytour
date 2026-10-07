/**
 * Telegram botlar dvigateli.
 *
 * Uchta bot bor (`.env.example` ga qarang):
 *   - `main`  — mijozlar bilan ishlaydigan asosiy bot;
 *   - `auth`  — hamkorlar ro'yxatdan o'tadigan va saytga kiradigan bot
 *     (`@millyauth_bot`);
 *   - `stats` — egasi uchun qisqa statistika boti.
 *
 * Tokenlar ikki manbadan olinadi: avval **bazadagi** `bot_settings` (admin
 * paneldan saqlangan), bo'lmasa `.env`. Shu tufayli tokenni panelga qo'yish
 * kifoya — qayta ishga tushirish shart emas.
 *
 * Lokal rejim: token bo'lmasa bot baribir ishlaydi — `POST /api/telegram/:bot/simulate`
 * orqali Telegram yuboradigan update'ning aynan o'zi yuboriladi (login oqimini
 * to'liq sinash uchun). Haqiqiy botni ulash uchun token qo'yiladi va webhook
 * ro'yxatdan o'tkaziladi (`telegram/registerWebhooks`).
 */
import { randomUUID } from "node:crypto";

const API_BASE = "https://api.telegram.org";
const REQUEST_TIMEOUT_MS = 8000;

export const BOT_IDS = ["main", "auth", "stats"];

const BOT_ENV = {
  main: { token: "TELEGRAM_MAIN_BOT_TOKEN", username: "TELEGRAM_MAIN_BOT_USERNAME", fallback: "millytour_bot" },
  auth: { token: "TELEGRAM_AUTH_BOT_TOKEN", username: "TELEGRAM_AUTH_BOT_USERNAME", fallback: "millyauth_bot" },
  stats: { token: "TELEGRAM_STATS_BOT_TOKEN", username: "TELEGRAM_STATS_BOT_USERNAME", fallback: "mtour_by_statik_bot" },
};

export function maskToken(token) {
  return token ? `••••${String(token).slice(-4)}` : null;
}

/**
 * Xabar olish rejimi.
 *
 * - `auto`     — webhook bor bo'lsa unga tegilmaydi (serverda xavfsiz default);
 * - `takeover` — mavjud webhook olib tashlanadi va polling egallaydi (lokal dev);
 * - `off`      — polling umuman ishga tushmaydi (faqat webhook rejimi).
 *
 * Manba: avval baza (`bot_settings`), keyin `.env` (`TELEGRAM_POLLING`).
 */
export const POLLING_MODES = ["auto", "takeover", "off"];

function envPolling() {
  if (process.env.TELEGRAM_POLLING === "true") return "takeover";
  if (process.env.TELEGRAM_POLLING === "false") return "off";
  return "auto";
}

export function isLocalMode(settings) {
  return !BOT_IDS.some((bot) => Boolean(settings?.[bot]?.token));
}

/** Bazadagi `bot_settings` + `.env` birlashtirilgan holati (baza ustun). */
export async function loadBotSettings(db) {
  const row = await db.get("SELECT * FROM records WHERE kind = 'bot_settings' ORDER BY created_at DESC LIMIT 1");
  const saved = row ? safeParse(row.data) : {};
  const settings = {};
  for (const bot of BOT_IDS) {
    const env = BOT_ENV[bot];
    const stored = saved[bot] || {};
    const envToken = process.env[env.token] || null;
    settings[bot] = {
      token: stored.token || envToken,
      username: stored.username || process.env[env.username] || env.fallback,
      source: stored.token ? "panel" : envToken ? "env" : null,
    };
  }
  settings.ownerTelegramId = saved.ownerTelegramId || process.env.OWNER_TELEGRAM_ID || null;
  settings.polling = POLLING_MODES.includes(saved.polling) ? saved.polling : envPolling();
  return settings;
}

/** Egasi (stats/owner) chat id'si — baza ustun, keyin `.env`. */
export function resolveOwnerChatId(settings) {
  return settings?.ownerTelegramId || process.env.OWNER_TELEGRAM_ID || null;
}

/** Panelga kiritilgan token/username'larni saqlaydi (`.env` ga tegmaydi). */
export async function saveBotSettings(db, patch = {}) {
  const row = await db.get("SELECT * FROM records WHERE kind = 'bot_settings' ORDER BY created_at DESC LIMIT 1");
  const saved = row ? safeParse(row.data) : {};

  for (const bot of BOT_IDS) {
    const input = patch[bot];
    if (!input || typeof input !== "object") continue;
    const next = { ...(saved[bot] || {}) };
    if (typeof input.token === "string" && input.token.trim()) next.token = input.token.trim();
    if (typeof input.username === "string" && input.username.trim()) {
      next.username = input.username.trim().replace(/^@/, "");
    }
    if (input.clear === true) {
      delete next.token;
      delete next.username;
    }
    saved[bot] = next;
  }

  if (patch.ownerTelegramId !== undefined) {
    const value = String(patch.ownerTelegramId || "").trim();
    if (value) saved.ownerTelegramId = value;
    else delete saved.ownerTelegramId;
  }

  if (patch.polling !== undefined) {
    const mode = String(patch.polling || "").trim();
    if (POLLING_MODES.includes(mode)) saved.polling = mode;
    else delete saved.polling;
  }

  if (row) {
    await db.run("UPDATE records SET data = ? WHERE id = ?", JSON.stringify(saved), row.id);
  } else {
    await db.run(
      "INSERT INTO records (id, kind, user_id, data, created_at) VALUES (?, 'bot_settings', NULL, ?, ?)",
      randomUUID(),
      JSON.stringify(saved),
      Date.now(),
    );
  }
  return loadBotSettings(db);
}

/** Admin panel ko'radigan xavfsiz ko'rinish (tokenlar maskalangan). */
export function botConfigView(settings) {
  const local = isLocalMode(settings);
  const siteUrl = (process.env.SITE_URL || "http://localhost:5173").replace(/\/$/, "");
  return {
    configured: { main: Boolean(settings.main.token), auth: Boolean(settings.auth.token), stats: Boolean(settings.stats.token) },
    sources: { main: settings.main.source, auth: settings.auth.source, stats: settings.stats.source },
    envKeys: { main: BOT_ENV.main.token, auth: BOT_ENV.auth.token, stats: BOT_ENV.stats.token },
    masked: {
      main: maskToken(settings.main.token),
      auth: maskToken(settings.auth.token),
      stats: maskToken(settings.stats.token),
    },
    usernames: { main: settings.main.username, auth: settings.auth.username, stats: settings.stats.username },
    deepLinks: {
      main: `https://t.me/${settings.main.username}`,
      auth: `https://t.me/${settings.auth.username}`,
      stats: `https://t.me/${settings.stats.username}`,
    },
    // Eski panel maydonlari bilan moslik
    authDeepLink: `https://t.me/${settings.auth.username}`,
    mainDeepLink: `https://t.me/${settings.main.username}`,
    miniAppUrl: siteUrl,
    siteUrl,
    ownerTelegramId: settings.ownerTelegramId || null,
    polling: settings.polling || "auto",
    localMode: local,
    webhookPaths: { main: "/api/telegram/main", auth: "/api/telegram/auth", stats: "/api/telegram/stats" },
  };
}

/** Bot API chaqiruvi (token bo'lmasa xato qaytaradi, otmaydi). */
export async function callBotApi(token, method, payload = {}, httpMethod = "POST") {
  if (!token) return { ok: false, description: "Bot tokeni sozlanmagan" };
  try {
    const response = await fetch(`${API_BASE}/bot${token}/${method}`, {
      method: httpMethod,
      headers: { "Content-Type": "application/json" },
      body: httpMethod === "GET" ? undefined : JSON.stringify(payload),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    const data = await response.json().catch(() => ({}));
    return data?.ok
      ? { ok: true, result: data.result }
      : { ok: false, description: data?.description || `Telegram HTTP ${response.status}` };
  } catch (error) {
    return { ok: false, description: error?.message || "Telegram API'ga ulanib bo'lmadi" };
  }
}

export function sendMessage(token, chatId, text, extra = {}) {
  return callBotApi(token, "sendMessage", { chat_id: chatId, text, disable_web_page_preview: true, ...extra });
}

/** Webhook'ni ro'yxatdan o'tkazadi (faqat HTTPS — Telegram talabi). */
export async function registerWebhook({ token, bot, secret, siteUrl }) {
  const base = (siteUrl || process.env.SITE_URL || "http://localhost:5173").replace(/\/$/, "");
  const url = `${base}/api/telegram/${bot}`;
  if (!url.startsWith("https://")) {
    return {
      ok: false,
      description: `Telegram webhook faqat HTTPS manzilni qabul qiladi (hozir: ${url}). Lokal rejimda /api/telegram/${bot}/simulate dan foydalaning yoki SITE_URL ni https:// bilan qo'ying.`,
    };
  }
  return callBotApi(token, "setWebhook", {
    url,
    ...(secret ? { secret_token: secret } : {}),
    allowed_updates: ["message", "callback_query"],
    drop_pending_updates: true,
  });
}

export function getWebhookInfo(token) {
  return callBotApi(token, "getWebhookInfo");
}

/** Webhook'ni olib tashlaydi — `getUpdates` (polling) ishlashi uchun shart. */
export function deleteWebhook(token) {
  return callBotApi(token, "deleteWebhook", { drop_pending_updates: false });
}

/**
 * Lokal (va webhook o'rnatilmagan har qanday) muhit uchun long-polling.
 *
 * Telegram bir vaqtda faqat bittasiga ruxsat beradi: webhook **yoki**
 * `getUpdates`. Shuning uchun polling boshlanishida webhook olib tashlanadi va
 * yangi xabarlar shu tsikl orqali `handleUpdate` ga uzatiladi. Shu tufayli
 * localhost'da ham botlar to'liq ishlaydi (login, /orders, /stats).
 */
export function startPolling({ getSettings, ctx, intervalMs = 2500, takeOver = false, onEvent = () => {} }) {
  const offsets = new Map();
  /** Har bir bot uchun 409 (konflikt) holati — ogohlantirish bir marta chiqadi. */
  const conflicts = new Map();
  let stopped = false;
  let busy = false;
  let prepared = false;

  const prepare = async (settings) => {
    for (const bot of BOT_IDS) {
      const token = settings[bot]?.token;
      if (!token) continue;
      const info = await getWebhookInfo(token);
      if (!info.ok || !info.result?.url) continue;
      if (!takeOver) {
        onEvent(`${bot}: webhook o'rnatilgan (${info.result.url}). Polling uchun TELEGRAM_POLLING=true qo'ying — aks holda getUpdates 409 qaytaradi.`);
        continue;
      }
      const removed = await deleteWebhook(token);
      onEvent(removed.ok ? `${bot}: webhook olib tashlandi — endi polling rejimida` : `${bot}: webhook o'chirilmadi — ${removed.description}`);
    }
  };

  const tick = async () => {
    if (stopped || busy) return;
    busy = true;
    try {
      const settings = await getSettings();
      if (!prepared) {
        await prepare(settings);
        prepared = true;
      }
      for (const bot of BOT_IDS) {
        const token = settings[bot]?.token;
        if (!token) continue;
        const offset = offsets.get(bot) || 0;
        const result = await callBotApi(token, `getUpdates?timeout=0${offset ? `&offset=${offset}` : ""}`, {}, "GET");
        if (!result.ok) {
          // 409 — shu bot tokeni bilan boshqa `getUpdates` mijozi ham ishlayapti
          // (Telegram bir vaqtda faqat bittasiga ruxsat beradi), shuning uchun
          // xabarlar bizga kelmaydi. Ogohlantirishni takrorlab chiqarmaymiz —
          // bot uchun bir marta aytamiz, tiklanishda yana bir marta.
          if (!conflicts.get(bot)) {
            const conflict = /conflict/i.test(result.description || "");
            conflicts.set(bot, conflict ? "conflict" : "error");
            onEvent(
              conflict
                ? `${bot}: 409 konflikt — shu token bilan boshqa nusxa poll qilmoqda (lokal bot xabar olmaydi). Faqat bitta nusxa ishlashiga ishonch hosil qiling yoki tokenni yangilang.`
                : `${bot}: getUpdates xatosi — ${result.description}`,
            );
          }
          continue;
        }
        if (conflicts.get(bot)) {
          conflicts.delete(bot);
          onEvent(`${bot}: ulanish tiklandi — xabarlar qabul qilinmoqda`);
        }
        if (!Array.isArray(result.result) || result.result.length === 0) continue;
        onEvent(`${bot}: ${result.result.length} ta yangilanish olindi`);
        for (const update of result.result) {
          offsets.set(bot, Number(update.update_id) + 1);
          try {
            const handled = await handleUpdate({ bot, update, settings, ctx });
            if (handled?.ok) onEvent(`${bot}: ${handled.kind} → ${handled.sent ? "yuborildi" : "lokal"}`);
            else onEvent(`${bot}: yangilanish o'tkazib yuborildi — ${handled?.reason || "sabab yo'q"}`);
          } catch (error) {
            onEvent(`${bot}: update xatosi — ${error?.message || error}`);
          }
        }
      }
    } finally {
      busy = false;
    }
  };

  const timer = setInterval(() => void tick(), intervalMs);
  timer.unref?.();
  void tick();

  return {
    stop: () => {
      stopped = true;
      clearInterval(timer);
    },
    tick,
  };
}

export function getMe(token) {
  return callBotApi(token, "getMe");
}

/** Bitta marta `getUpdates` — admin paneldagi "Polling" tugmasi uchun. */
export function fetchUpdates(token, offset = 0) {
  return callBotApi(token, `getUpdates?timeout=0${offset ? `&offset=${offset}` : ""}`, {}, "GET");
}

const SITE_URL = () => (process.env.SITE_URL || "http://localhost:5173").replace(/\/$/, "");

/**
 * Telegram inline tugmasi uchun URL yaroqlimi?
 *
 * Telegram ommaviy bo'lmagan manzillarni (`http://localhost:5173`, IP, `.local`)
 * rad etadi va **butun xabarni** yubormaydi: "inline keyboard button URL ... is
 * invalid". Shu sababli yuborishdan oldin bunday tugmalarni olib tashlaymiz.
 */
export function isTelegramButtonUrl(url) {
  if (typeof url !== "string" || !url) return false;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase();
    if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) return false;
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.includes(":")) return false; // IP (IPv4/IPv6)
    return host.includes(".");
  } catch {
    return false;
  }
}

/**
 * Yaroqsiz URL tugmalarni olib tashlaydi. Agar barcha tugmalar olib tashlansa,
 * klaviatura umuman qo'shilmaydi — matn (masalan, kirish kodi) baribir yetib boradi.
 */
export function sanitizeReplyMarkup(extra = {}) {
  const rows = extra?.reply_markup?.inline_keyboard;
  if (!Array.isArray(rows)) return extra;
  const cleaned = rows
    .map((row) => (Array.isArray(row) ? row.filter((button) => !button?.url || isTelegramButtonUrl(button.url)) : row))
    .filter((row) => !Array.isArray(row) || row.length > 0);
  if (!cleaned.length) {
    const { reply_markup: _drop, ...rest } = extra;
    return rest;
  }
  return { ...extra, reply_markup: { ...extra.reply_markup, inline_keyboard: cleaned } };
}

function mainMenu() {
  const site = SITE_URL();
  return {
    reply_markup: {
      inline_keyboard: [
        [{ text: "📦 Buyurtmalarim", callback_data: "t:orders" }, { text: "🌐 Saytni ochish", url: site }],
        [{ text: "📦 Tur paketlar", url: `${site}/paketlar` }, { text: "🏙 Shaharlar", url: `${site}/shaharlar` }],
        [{ text: "🤝 Hamkor bo'lish", url: `${site}/hamkorlar` }],
      ],
    },
  };
}

const HELP = {
  main: [
    "MillyTour — O'zbekiston bo'ylab sayohat platformasi.",
    "",
    "Buyruqlar:",
    "/orders — buyurtmalarim",
    "/plans — AI dasturlarim",
    "/help — yordam",
  ].join("\n"),
  auth: [
    "MillyTour hamkor boti.",
    "Ro'yxatdan o'tish: /royxatdan",
    "/me — hamkor profili",
    "/bandlik — band / bo'sh holati va slotlar",
    "/orders — biriktirilgan buyurtmalar",
    "/chaqiruvlar — yangi so'rovlar",
    "/obuna — obuna holati",
    "",
    "Saytga kirish: 6 xonali tasdiqlash kodini shu chatga yuboring.",
  ].join("\n"),
  stats: ["MillyTour statistika boti.", "/stats — umumiy ko'rsatkichlar", "/help — yordam"].join("\n"),
};

function statusLabel(value) {
  const map = { new: "🆕 yangi", pending: "⏳ kutilmoqda", confirmed: "✅ tasdiqlangan", completed: "🏁 yakunlangan", cancelled: "❌ bekor qilingan" };
  return map[value] || value || "—";
}

/* ---------------------------------------------------------------------------
 * Hamkor (xizmat ko'rsatuvchi) oqimi
 *
 * Saytdagi `/hamkorlar` sahifasida yo'nalish va tarif tanlanadi, so'ng
 * `t.me/<bot>?start=register_<direction>` havolasi ochiladi. Botda:
 *   1. Yo'nalishga mos savollar ketma-ket so'raladi (`bot_state` yozuvida
 *      saqlanadigan wizard holati);
 *   2. Oxirida `provider` yozuvi yaratiladi (status: pending, subscription:
 *      trial) va hamkor menyusi ochiladi;
 *   3. Menyudan bandlik/slotlar, buyurtmalar, chaqiruvlar, obuna va yordam
 *      boshqariladi.
 * ------------------------------------------------------------------------- */

/** Ro'yxatdan o'tishda so'raladigan umumiy maydonlar (yo'nalish savollaridan oldin). */
const REGISTER_FIELDS = [
  { key: "businessName", question: "🏷 Biznesingiz yoki xizmatingiz nomi qanday?" },
  { key: "phone", question: "📞 Telefon raqamingizni yuboring (masalan +998 90 123 45 67)." },
  { key: "city", question: "📍 Qaysi shaharda xizmat ko'rsatasiz?" },
  { key: "experienceYears", question: "⏳ Necha yillik tajribangiz bor? (raqamda yozing)" },
  { key: "about", question: "📝 Xizmatingiz haqida qisqacha yozib qoldiring." },
];

/** `YYYY-MM-DD` ko'rinishidagi mahalliy sana kaliti. */
function isoDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/** Hamkor menyusi (inline tugmalar) — saytdagi panel bilan bir xil bo'limlar. */
function providerKeyboard(site) {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "🧑‍💼 Ma'lumotlarim", callback_data: "p:me" },
          { text: "💳 Obuna", callback_data: "p:sub" },
        ],
        [{ text: "🟢 Bandlik va slotlar", callback_data: "p:slots" }],
        [
          { text: "📦 Buyurtmalar", callback_data: "p:orders" },
          { text: "🔔 Chaqiruvlar", callback_data: "p:calls" },
        ],
        [{ text: "🆘 Yordam", callback_data: "p:help" }],
        [{ text: "🌐 Saytdagi panel", url: `${site}/partner` }],
      ],
    },
  };
}

/** Yo'nalish tanlash tugmalari — ro'yxatdan o'tishni boshlaydi. */
function directionKeyboard(ctx) {
  const directions = ctx.providerDirections || [];
  const rows = [];
  for (let index = 0; index < directions.length; index += 2) {
    rows.push(
      directions.slice(index, index + 2).map((direction) => ({
        text: ctx.providerLabels?.[direction] || direction,
        callback_data: `p:register:${direction}`,
      })),
    );
  }
  return { reply_markup: { inline_keyboard: rows } };
}

function providerLabel(ctx, direction) {
  return ctx.providerLabels?.[direction] || direction || "—";
}

function profileText(ctx, provider) {
  const statusMap = {
    pending: "⏳ tasdiq kutmoqda",
    approved: "✅ tasdiqlangan",
    rejected: "❌ rad etilgan",
    paused: "⏸ to'xtatilgan",
  };
  return [
    `🧑‍💼 ${provider.businessName}`,
    `Yo'nalish: ${providerLabel(ctx, provider.direction)}`,
    `Shahar: ${provider.city || "—"}`,
    `Telefon: ${provider.phone || "—"}`,
    `Tajriba: ${provider.experienceYears || 0} yil`,
    `Reyting: ${provider.rating ? Number(provider.rating).toFixed(1) : "—"} (${provider.ratingCount || 0} sharh)`,
    `Bajarilgan buyurtmalar: ${provider.completedOrders || 0}`,
    `Holat: ${statusMap[provider.status] || provider.status}`,
  ].join("\n");
}

function subscriptionText(ctx, provider) {
  const fee = provider.monthlyFee ?? ctx.providerFees?.[provider.direction] ?? ctx.providerFees?.other ?? 0;
  const statusMap = {
    trial: "🎁 sinov davri",
    active: "✅ faol",
    paused: "⏸ to'xtatilgan",
    overdue: "⚠️ muddati o'tgan",
  };
  return [
    `💳 Obuna: ${statusMap[provider.subscription] || provider.subscription || "—"}`,
    `Yo'nalish: ${providerLabel(ctx, provider.direction)}`,
    `Oylik to'lov: $${fee}/oy`,
    provider.paidUntil ? `Amal qiladi: ${new Date(provider.paidUntil).toLocaleDateString("uz-UZ")}` : null,
    "",
    "To'lov va hisob-fakturalar saytdagi paneldan ham ko'rinadi.",
  ]
    .filter(Boolean)
    .join("\n");
}

/** Bandlik: bugungi holat va keyingi 7 kun uchun slotlar. */
function slotsView(provider) {
  const busy = String(provider.availability || "available") === "busy";
  const closed = Array.isArray(provider.unavailableDates) ? provider.unavailableDates : [];
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, offset) => {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset);
    const key = isoDate(date);
    return {
      key,
      label: date.toLocaleDateString("uz-UZ", { day: "2-digit", month: "short", weekday: "short" }),
      closed: closed.includes(key),
    };
  });
  return { busy, days };
}

function slotsText(provider) {
  const { busy, days } = slotsView(provider);
  return [
    busy
      ? "🔴 Hozirgi holat: BAND — yangi chaqiruvlar to'xtatilgan."
      : "🟢 Hozirgi holat: BO'SH — chaqiruvlar qabul qilinadi.",
    "",
    "Keyingi 7 kun (🟢 ochiq, 🔴 yopilgan):",
    ...days.map((day) => `${day.closed ? "🔴" : "🟢"} ${day.label}`),
    "",
    "Kunni bosib slotni ochish/yopish mumkin.",
  ].join("\n");
}

function slotsKeyboard(provider) {
  const { busy, days } = slotsView(provider);
  return {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: busy ? "🟢 Bugun bo'sh deb belgilash" : "🔴 Bugun band deb belgilash",
            callback_data: "p:availability",
          },
        ],
        ...days.map((day) => [
          { text: `${day.closed ? "🔴" : "🟢"} ${day.label}`, callback_data: `p:date:${day.key}` },
        ]),
        [{ text: "⬅️ Menyu", callback_data: "p:menu" }],
      ],
    },
  };
}

function providerMenuText(ctx, provider, metrics) {
  return [
    "🤝 MillyTour hamkor paneli",
    `${provider.businessName} · ${providerLabel(ctx, provider.direction)}`,
    "",
    `📦 Biriktirilgan buyurtmalar: ${(metrics.assigned || []).length}`,
    `🔔 Ochiq chaqiruvlar: ${(metrics.open || []).length}`,
    `🟢 Holat: ${String(provider.availability || "available") === "busy" ? "band" : "bo'sh"}`,
    "",
    "Kerakli bo'limni tanlang:",
  ].join("\n");
}

function ordersText(metrics) {
  const assigned = metrics.assigned || [];
  if (!assigned.length) {
    return "📦 Sizga biriktirilgan buyurtma yo'q.\n\nYangi so'rovlar «Chaqiruvlar» bo'limida ko'rinadi.";
  }
  return [
    "📦 Buyurtmalaringiz:",
    ...assigned
      .slice(0, 6)
      .map(
        (booking) =>
          `• ${booking.reference} · ${booking.title || booking.city || "Buyurtma"}\n  ${statusLabel(booking.status)} · $${booking.totalPrice || 0} · ${booking.startDate || "—"}`,
      ),
  ].join("\n");
}

function callsText(metrics) {
  const open = metrics.open || [];
  if (!open.length) return "🔔 Hozircha ochiq chaqiruv yo'q. Yangi so'rovlar shu yerda paydo bo'ladi.";
  return [
    "🔔 Ochiq chaqiruvlar (yangi so'rovlar):",
    ...open
      .slice(0, 6)
      .map((booking) => `• ${booking.city || "—"} · ${booking.startDate || "—"}\n  $${booking.totalPrice || 0} · ${booking.title || ""}`),
    "",
    "Qabul qilish saytdagi panelda yoki operator orqali amalga oshiriladi.",
  ].join("\n");
}

/**
 * Suhbat holati (`bot_state` yozuvi) — har bir oqim uchun foydalanuvchi bo'yicha
 * bitta yozuv: hamkor wizard'i (`provider_register`) va kirish wizard'i (`login`).
 */
async function loadState(ctx, userId, flow = null) {
  const rows = await ctx.records("bot_state", userId);
  return (flow ? rows.find((row) => row.flow === flow) : rows[0]) || null;
}

async function saveState(ctx, userId, flow, data) {
  const existing = await loadState(ctx, userId, flow);
  if (existing) return await ctx.updateRecord(existing._id, { ...data, flow });
  return await ctx.record("bot_state", { flow, ...data }, userId);
}

async function clearState(ctx, userId, flow) {
  const existing = await loadState(ctx, userId, flow);
  if (existing) await ctx.removeRecord(existing._id);
}

async function loadWizard(ctx, userId) {
  return await loadState(ctx, userId, "provider_register");
}

async function saveWizard(ctx, userId, data) {
  return await saveState(ctx, userId, "provider_register", data);
}

async function clearWizard(ctx, userId) {
  return await clearState(ctx, userId, "provider_register");
}

/**
 * Telegram orqali kirish: bot ism-familiyani so'raydi, so'ng saytda
 * kiritiladigan 6 xonali kodni beradi.
 *
 * Kod saytdagi «Tasdiqlash kodi» maydoniga kiritiladi va shu ism-familiya bilan
 * hisob yaratiladi (`POST /api/auth/telegram/verify`).
 */
async function startLogin(ctx, user, challengeId) {
  await clearState(ctx, user.id, "login");
  await saveState(ctx, user.id, "login", { challengeId, step: 0, answers: {}, startedAt: Date.now() });
  return {
    reply: [
      "Assalomu alaykum! 👋",
      "MillyTour hisobingizga kirish uchun ismingizni yozing:",
    ].join("\n"),
  };
}

async function loginAnswer(ctx, user, state, answer) {
  const step = Number(state.step) || 0;
  const answers = { ...(state.answers || {}) };

  if (step === 0) {
    answers.firstName = answer.slice(0, 60);
    await saveState(ctx, user.id, "login", { ...state, answers, step: 1 });
    return { reply: "Rahmat! Endi familiyangizni yozing:" };
  }

  answers.lastName = answer.slice(0, 60);
  await clearState(ctx, user.id, "login");

  const fullName =
    [answers.firstName, answers.lastName].filter(Boolean).join(" ").trim() ||
    user.name ||
    "MillyTour foydalanuvchisi";

  const account = await ctx.ensureUser({
    email: user.email || `telegram-${user.telegram_id}@telegram.local`,
    name: fullName,
    telegramId: user.telegram_id,
    telegramUsername: user.telegram_username,
  });

  const code = String(Math.floor(100000 + Math.random() * 900000));
  await ctx.db.run(
    "UPDATE auth_challenges SET code = ?, user_id = ?, status = 'pending' WHERE id = ? AND type = 'telegram'",
    code,
    account.id,
    state.challengeId,
  );

  return {
    reply: [
      `✅ ${fullName}, rahmat!`,
      "",
      `Saytga kirish kodingiz: ${code}`,
      "Shu kodni saytdagi «Tasdiqlash kodi» maydoniga kiriting. Kod 10 daqiqa amal qiladi.",
    ].join("\n"),
    extra: mainMenu(),
  };
}

/** Wizard qadamlari: umumiy maydonlar + yo'nalishga xos savollar. */
function wizardSteps(ctx, direction) {
  const questions = ctx.directionQuestions?.[direction] || ctx.directionQuestions?.other || [];
  return [
    ...REGISTER_FIELDS,
    ...questions.map((question, index) => ({
      key: `d${index}`,
      label: question,
      question: `❓ ${question}`,
      into: "directionAnswers",
    })),
  ];
}

/** Ro'yxatdan o'tishni boshlaydi (yo'nalish yo'q bo'lsa tanlash tugmalarini beradi). */
async function startWizard(ctx, user, direction, site) {
  const safeDirection = (ctx.providerDirections || []).includes(direction) ? direction : null;
  if (!safeDirection) {
    return {
      reply: "🤝 MillyTour hamkorlik botiga xush kelibsiz!\n\nQaysi yo'nalishda xizmat ko'rsatasiz? Tanlang:",
      extra: directionKeyboard(ctx),
    };
  }
  const steps = wizardSteps(ctx, safeDirection);
  await clearWizard(ctx, user.id);
  await saveWizard(ctx, user.id, {
    direction: safeDirection,
    step: 0,
    answers: {},
    startedAt: Date.now(),
  });
  const fee = ctx.providerFees?.[safeDirection] ?? ctx.providerFees?.other ?? 0;
  return {
    reply: [
      `🤝 ${providerLabel(ctx, safeDirection)} yo'nalishi uchun ro'yxatdan o'tamiz.`,
      `Oylik obuna: $${fee}/oy — birinchi davr sinov sifatida.`,
      `${steps.length} ta savol bor, bekor qilish uchun /bekor yozing.`,
      "",
      `1/${steps.length}. ${steps[0].question}`,
    ].join("\n"),
  };
}

/** Wizard javobini qabul qiladi va keyingi savolni (yoki yakuniy natijani) qaytaradi. */
async function wizardAnswer(ctx, user, wizard, answer, site) {
  const steps = wizardSteps(ctx, wizard.direction);
  const index = Number(wizard.step) || 0;
  const step = steps[index];
  if (!step) {
    await clearWizard(ctx, user.id);
    return { reply: "Anketa yakunlangan. /hamkor bilan menyuni oching." };
  }

  const answers = { ...(wizard.answers || {}) };
  if (step.into === "directionAnswers") {
    answers.directionAnswers = { ...(answers.directionAnswers || {}), [step.label]: answer };
  } else {
    answers[step.key] = answer;
  }

  const nextIndex = index + 1;
  if (nextIndex < steps.length) {
    await saveWizard(ctx, user.id, {
      flow: "provider_register",
      direction: wizard.direction,
      step: nextIndex,
      answers,
    });
    return { reply: `${nextIndex + 1}/${steps.length}. ${steps[nextIndex].question}` };
  }

  await clearWizard(ctx, user.id);
  const provider = await ctx.createProvider(user.id, {
    ...answers,
    direction: wizard.direction,
    email: user.email,
    telegramId: user.telegram_id ?? null,
    telegramUsername: user.telegram_username ?? null,
  });
  return {
    reply: [
      "✅ Rahmat! Anketangiz qabul qilindi.",
      "",
      profileText(ctx, provider),
      "",
      subscriptionText(ctx, provider),
      "",
      "Administrator hujjatlarni tekshirib tasdiqlaydi. Hozirdanoq menyudan foydalanishingiz mumkin:",
    ].join("\n"),
    extra: providerKeyboard(site),
  };
}

/**
 * Telegram update'ini qayta ishlaydi. Simulyatsiya ham shu funksiyani chaqiradi,
 * shuning uchun lokal va real oqim bir xil ishlaydi.
 *
 * @param {{ bot: "main"|"auth"|"stats", update: object, settings: object, ctx: object }} params
 */
export async function handleUpdate({ bot, update, settings, ctx }) {
  const message = update?.message || update?.edited_message || update?.callback_query?.message || null;
  const text = String(message?.text || update?.callback_query?.data || "").trim();
  // Callback'da `message.from` — bot, foydalanuvchi esa `callback_query.from` da.
  const from = update?.callback_query?.from || message?.from || null;
  const chatId = message?.chat?.id ?? from?.id ?? null;
  const token = settings?.[bot]?.token || null;
  const displayName = [from?.first_name, from?.last_name].filter(Boolean).join(" ") || "MillyTour foydalanuvchisi";

  if (!message || !from) return { ok: false, reason: "Update'da xabar yo'q" };

  // Statistika boti faqat loyiha egasi uchun: tushum va komissiya raqamlari
  // begona odamga ko'rinmasligi kerak (bot topilsa ham javob bermaydi).
  const ownerChatId = resolveOwnerChatId(settings);
  if (bot === "stats" && ownerChatId && String(ownerChatId) !== String(from.id)) {
    const denied = "🔒 Bu bot faqat MillyTour egasi uchun.";
    if (token && chatId) await sendMessage(token, chatId, denied);
    await ctx.record("telegram_event", {
      kind: "denied",
      target: bot,
      text: denied,
      chatId,
      chatUsername: from.username || null,
      userName: displayName,
      status: token ? "delivered" : "local",
      error: null,
    });
    return { ok: false, kind: "denied", reply: denied, sent: Boolean(token && chatId), chatId };
  }

  const command = text.split(/\s+/)[0].toLowerCase().replace(/@[\w_]+$/, "");
  const loginPayload = text.match(/^\/start(?:\s+login_([\w-]+))?/)?.[1] || null;
  /** Sayt tarif tanlagach ochadigan havola: `/start register_<direction>`. */
  const registerPayload = text.match(/^\/start\s+register_([a-z]+)/i)?.[1] || null;
  /** Inline tugmalar: hamkor menyusi `p:<action>`, turist menyusi `t:<action>`. */
  const rawCallback = update?.callback_query?.data ? String(update.callback_query.data) : null;
  const callbackData = rawCallback?.startsWith("p:") ? rawCallback : null;
  const touristCallback = rawCallback?.startsWith("t:") ? rawCallback : null;
  const siteUrl = SITE_URL();
  /** Telegram hisobiga bog'langan sayt hisobi (kerak bo'lsa yaratiladi). */
  const ensureTelegramUser = () =>
    ctx.ensureUser({
      email: `telegram-${from.id}@telegram.local`,
      name: displayName,
      telegramId: from.id,
      telegramUsername: from.username,
    });
  let reply = "";
  let kind = "message";
  let extra = {};

  // Suhbat (wizard) davom etayotgan bo'lsa, oddiy matn javob sifatida qabul
  // qilinadi — hamkor anketasi yoki kirish (ism-familiya) bosqichi.
  const pendingState =
    bot !== "stats" &&
    text &&
    !text.startsWith("/") &&
    !callbackData &&
    !touristCallback &&
    !loginPayload &&
    !registerPayload
      ? await loadState(ctx, (await ensureTelegramUser()).id)
      : null;

  if (loginPayload) {
    // Sayt «Telegram orqali kirish» havolasi: bot ism-familiyani so'raydi va
    // saytga kiritiladigan kodni beradi.
    const challenge = await ctx.db.get(
      "SELECT * FROM auth_challenges WHERE id = ? AND type = 'telegram' AND expires_at > ?",
      loginPayload,
      Date.now(),
    );
    kind = "login";
    if (!challenge) {
      reply = "Havola eskirgan. Saytga qaytib «Telegram orqali kirish» tugmasini qaytadan bosing.";
      extra = mainMenu();
    } else {
      const user = await ensureTelegramUser();
      const started = await startLogin(ctx, user, challenge.id);
      reply = started.reply;
      extra = started.extra || {};
    }
  } else if (registerPayload) {
    // Saytda tarif tanlanib "botga o'tish" bosilganda shu havola ochiladi.
    const user = await ensureTelegramUser();
    const started = await startWizard(ctx, user, registerPayload, siteUrl);
    kind = "provider_register";
    reply = started.reply;
    extra = started.extra || {};
  } else if (callbackData) {
    if (update?.callback_query?.id && token) {
      await callBotApi(token, "answerCallbackQuery", { callback_query_id: update.callback_query.id });
    }
    const user = await ensureTelegramUser();
    const [, action, ...rest] = callbackData.split(":");
    const value = rest.join(":");
    const metrics = await ctx.providerMetrics(user.id);
    const provider = metrics.provider;
    kind = `provider_${action}`;

    if (action === "register") {
      const started = await startWizard(ctx, user, value, siteUrl);
      reply = started.reply;
      extra = started.extra || {};
    } else if (action === "help") {
      reply = HELP.auth;
      extra = provider ? providerKeyboard(siteUrl) : directionKeyboard(ctx);
    } else if (!provider) {
      reply = "🤝 Avval hamkor profilini yaratish kerak. Yo'nalishni tanlang:";
      extra = directionKeyboard(ctx);
    } else if (action === "slots") {
      reply = slotsText(provider);
      extra = slotsKeyboard(provider);
    } else if (action === "availability") {
      const next = String(provider.availability || "available") === "busy" ? "available" : "busy";
      const updated = await ctx.updateRecord(provider._id, {
        availability: next,
        availabilityUpdatedAt: Date.now(),
      });
      reply = slotsText(updated);
      extra = slotsKeyboard(updated);
    } else if (action === "date" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const current = Array.isArray(provider.unavailableDates) ? provider.unavailableDates : [];
      const next = current.includes(value)
        ? current.filter((date) => date !== value)
        : [...current, value];
      const updated = await ctx.updateRecord(provider._id, { unavailableDates: next });
      reply = slotsText(updated);
      extra = slotsKeyboard(updated);
    } else if (action === "orders") {
      reply = ordersText(metrics);
      extra = providerKeyboard(siteUrl);
    } else if (action === "calls") {
      reply = callsText(metrics);
      extra = providerKeyboard(siteUrl);
    } else if (action === "me") {
      reply = profileText(ctx, provider);
      extra = providerKeyboard(siteUrl);
    } else if (action === "sub") {
      reply = subscriptionText(ctx, provider);
      extra = providerKeyboard(siteUrl);
    } else {
      reply = providerMenuText(ctx, provider, metrics);
      extra = providerKeyboard(siteUrl);
    }
  } else if (touristCallback) {
    if (update?.callback_query?.id && token) {
      await callBotApi(token, "answerCallbackQuery", { callback_query_id: update.callback_query.id });
    }
    const user = await ensureTelegramUser();
    const bookings = await ctx.records("booking", user.id);
    kind = "orders";
    reply = bookings.length
      ? [
          "📦 Buyurtmalaringiz:",
          ...bookings
            .slice(0, 6)
            .map(
              (item) =>
                `• ${item.reference} · ${item.title || item.service || "Buyurtma"}\n  ${statusLabel(item.status)} · $${item.totalPrice || 0} · ${item.startDate || "—"}`,
            ),
        ].join("\n")
      : "Sizda hali buyurtma yo'q. Saytdan tur paket tanlab, buyurtma bering.";
    extra = mainMenu();
  } else if (pendingState?.flow === "provider_register") {
    const user = await ensureTelegramUser();
    const result = await wizardAnswer(ctx, user, pendingState, text, siteUrl);
    kind = "provider_answer";
    reply = result.reply;
    extra = result.extra || {};
  } else if (pendingState?.flow === "login") {
    const user = await ensureTelegramUser();
    const result = await loginAnswer(ctx, user, pendingState, text);
    kind = "login_name";
    reply = result.reply;
    extra = result.extra || {};
  } else if (
    bot === "auth" &&
    ["/hamkor", "/menu", "/me", "/bandlik", "/chaqiruvlar", "/obuna", "/yordam", "/royxatdan", "/bekor"].includes(
      command,
    )
  ) {
    const user = await ensureTelegramUser();

    if (command === "/bekor") {
      await clearWizard(ctx, user.id);
      kind = "provider_cancel";
      reply = "Anketa bekor qilindi. Qaytadan boshlash uchun /royxatdan yozing.";
      extra = providerKeyboard(siteUrl);
    } else if (command === "/royxatdan") {
      const started = await startWizard(ctx, user, null, siteUrl);
      kind = "provider_register";
      reply = started.reply;
      extra = started.extra || {};
    } else {
      const metrics = await ctx.providerMetrics(user.id);
      const provider = metrics.provider;
      kind = "provider_menu";
      if (!provider) {
        reply = "🤝 Avval hamkor profilini yaratish kerak. Yo'nalishni tanlang:";
        extra = directionKeyboard(ctx);
      } else if (command === "/me") {
        reply = profileText(ctx, provider);
        extra = providerKeyboard(siteUrl);
      } else if (command === "/bandlik") {
        reply = slotsText(provider);
        extra = slotsKeyboard(provider);
      } else if (command === "/chaqiruvlar") {
        reply = callsText(metrics);
        extra = providerKeyboard(siteUrl);
      } else if (command === "/obuna") {
        reply = subscriptionText(ctx, provider);
        extra = providerKeyboard(siteUrl);
      } else if (command === "/yordam") {
        reply = HELP.auth;
        extra = providerKeyboard(siteUrl);
      } else {
        reply = providerMenuText(ctx, provider, metrics);
        extra = providerKeyboard(siteUrl);
      }
    }
  } else if (command === "/orders" || command === "/buyurtmalar") {
    const user = await ensureTelegramUser();
    kind = "orders";
    if (bot === "auth") {
      // Hamkor uchun "buyurtmalar" — unga biriktirilgan ishlar.
      const metrics = await ctx.providerMetrics(user.id);
      if (metrics.provider) {
        reply = ordersText(metrics);
        extra = providerKeyboard(siteUrl);
      } else {
        reply = "🤝 Avval hamkor profilini yaratish kerak. /royxatdan bilan boshlang.";
        extra = directionKeyboard(ctx);
      }
    } else {
      const bookings = await ctx.records("booking", user.id);
      reply = bookings.length
        ? bookings
            .slice(0, 6)
            .map((item) => `${item.reference} · ${item.title || item.service || "Buyurtma"}\n${statusLabel(item.status)} · $${item.totalPrice || 0}`)
            .join("\n\n")
        : "Sizda hali buyurtma yo'q. Saytdan tur paket tanlang yoki /help ni bosing.";
      extra = mainMenu();
    }
  } else if (command === "/plans" || command === "/dasturlar") {
    const user = await ctx.ensureUser({
      email: `telegram-${from.id}@telegram.local`,
      name: displayName,
      telegramId: from.id,
      telegramUsername: from.username,
    });
    const plans = await ctx.records("plan", user.id);
    kind = "plans";
    reply = plans.length
      ? plans.slice(0, 5).map((plan) => `• ${plan.title}\n  ${plan.summary || ""}`).join("\n")
      : "Hozircha AI dastur saqlanmagan.";
    extra = mainMenu();
  } else if (command === "/stats") {
    const overview = await ctx.overview();
    kind = "stats";
    reply = [
      "📊 MillyTour ko'rsatkichlari",
      `Foydalanuvchilar: ${overview.totals.users}`,
      `Hamkorlar: ${overview.totals.providers} (${overview.totals.pendingProviders} tasdiq kutmoqda)`,
      `Buyurtmalar: ${overview.totals.bookings} (${overview.totals.openBookings} faol)`,
      `Tushum: $${overview.totals.gross} · komissiya $${overview.totals.commission}`,
      `Obuna: $${overview.totals.subscriptionRevenue}/oy`,
    ].join("\n");
  } else if (command === "/start") {
    kind = "start";

    if (bot === "stats") {
      // Statistika boti foydalanuvchi yozuvi yaratmaydi — faqat egasiga
      // ko'rsatkichlarni beradi.
      reply = [
        `Assalomu alaykum, ${displayName}! 👋`,
        "Bu MillyTour egasi uchun statistika boti.",
        "",
        HELP.stats,
      ].join("\n");
      extra = {};
    } else if (bot === "auth") {
      const user = await ensureTelegramUser();
      // Hamkor allaqachon ro'yxatdan o'tgan bo'lsa — menyu, aks holda yo'nalish tanlash.
      const metrics = await ctx.providerMetrics(user.id);
      if (metrics.provider) {
        reply = `Assalomu alaykum, ${displayName}! 👋\n\n${providerMenuText(ctx, metrics.provider, metrics)}`;
        extra = providerKeyboard(siteUrl);
      } else {
        reply = [
          `Assalomu alaykum, ${displayName}! 👋`,
          "Bu bot — MillyTour hamkorlari uchun: gid, transfer, mehmonxona, hunarmand va boshqa xizmat ko'rsatuvchilar.",
          "Shu yerda ro'yxatdan o'tasiz, buyurtmalarni boshqarasiz va bandlikni (slotlarni) yuritasiz.",
          "",
          "Boshlash uchun yo'nalishingizni tanlang:",
        ].join("\n");
        extra = directionKeyboard(ctx);
      }
    } else {
      const user = await ensureTelegramUser();
      const bookings = await ctx.records("booking", user.id);
      reply = [
        `Assalomu alaykum, ${displayName}! 👋`,
        "MillyTour botiga xush kelibsiz. Saytda ko'rsatilgan 6 xonali kodni shu chatga yuboring — hisobingizni tasdiqlayman.",
        bookings.length ? `Sizda ${bookings.length} ta buyurtma bor — /orders bilan ko'ring.` : "",
        "",
        HELP.main,
      ]
        .filter(Boolean)
        .join("\n");
      extra = mainMenu();
    }
  } else {
    kind = "help";
    reply = HELP[bot] || HELP.main;
    extra = bot === "stats" ? {} : mainMenu();
  }

  let sent = false;
  let sendError = null;
  if (token && chatId) {
    // Yaroqsiz URL tugmalar (masalan lokal `http://localhost:5173`) xabarning
    // o'zini yuborilmay qo'yadi — shuning uchun avval klaviaturani tozalaymiz.
    const result = await sendMessage(token, chatId, reply, sanitizeReplyMarkup(extra));
    sent = result.ok;
    sendError = result.ok ? null : result.description;
  }

  // Bot hodisasi bazaga yoziladi — admin paneldagi "Bot hodisalari" ro'yxati shundan.
  await ctx.record("telegram_event", {
    kind,
    target: bot,
    text: reply.slice(0, 200),
    chatId,
    chatUsername: from.username || null,
    userName: displayName,
    command: command || null,
    status: token ? (sent ? "delivered" : "failed") : "local",
    error: sendError,
  });

  return { ok: true, kind, reply, sent, sendError, chatId };
}

/**
 * Simulyatsiya uchun Telegram update shakli.
 *
 * `callback` berilsa, tugma bosilishini (`callback_query`) taqlid qiladi —
 * admin panel va audit skriptlari ham oddiy xabarni, ham inline tugmalarni
 * sinay oladi.
 */
export function buildUpdate({ text, chatId = 990000001, firstName = "Lokal", lastName = "Foydalanuvchi", username = "local_tester", callback = null }) {
  const from = { id: chatId, is_bot: false, first_name: firstName, last_name: lastName, username, language_code: "uz" };
  const chat = { id: chatId, type: "private" };
  if (callback) {
    return {
      update_id: Date.now(),
      callback_query: {
        id: String(Date.now()),
        from,
        chat_instance: String(chatId),
        data: callback,
        message: { message_id: Date.now() % 100000, date: Math.floor(Date.now() / 1000), chat, from: { id: 1, is_bot: true, first_name: "MillyTour" }, text: "…" },
      },
    };
  }
  return {
    update_id: Date.now(),
    message: {
      message_id: Date.now() % 100000,
      date: Math.floor(Date.now() / 1000),
      chat,
      from,
      text,
    },
  };
}

function safeParse(value) {
  try {
    return JSON.parse(value) || {};
  } catch {
    return {};
  }
}
