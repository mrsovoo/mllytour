/**
 * Telegram botlar dvigateli.
 *
 * Uchta bot bor (`.env.example` ga qarang):
 *   - `main`  — mijozlar bilan ishlaydigan asosiy bot;
 *   - `auth`  — platformaga kirishni tasdiqlovchi bot;
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
  main: { token: "TELEGRAM_MAIN_BOT_TOKEN", username: "TELEGRAM_MAIN_BOT_USERNAME", fallback: "mllytour_bot" },
  auth: { token: "TELEGRAM_AUTH_BOT_TOKEN", username: "TELEGRAM_AUTH_BOT_USERNAME", fallback: "mtour_auth_bot" },
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
        if (!result.ok || !Array.isArray(result.result) || result.result.length === 0) continue;
        for (const update of result.result) {
          offsets.set(bot, Number(update.update_id) + 1);
          try {
            const handled = await handleUpdate({ bot, update, settings, ctx });
            if (handled?.ok) onEvent(`${bot}: ${handled.kind} → ${handled.sent ? "yuborildi" : "lokal"}`);
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

function mainMenu() {
  const site = SITE_URL();
  return {
    reply_markup: {
      inline_keyboard: [
        [{ text: "🌐 Saytni ochish", url: site }],
        [{ text: "📦 Tur paketlar", url: `${site}/paketlar` }, { text: "🏙 Shaharlar", url: `${site}/shaharlar` }],
        [{ text: "🤝 Hamkor bo'lish", url: `${site}/hamkorlar` }],
      ],
    },
  };
}

const HELP = {
  main: [
    "Millytour — O'zbekiston bo'ylab sayohat platformasi.",
    "",
    "Buyruqlar:",
    "/orders — buyurtmalarim",
    "/plans — AI dasturlarim",
    "/help — yordam",
  ].join("\n"),
  auth: ["Millytour kirish boti.", "/start — botni ishga tushirish", "/help — yordam"].join("\n"),
  stats: ["Millytour statistika boti.", "/stats — umumiy ko'rsatkichlar", "/help — yordam"].join("\n"),
};

function statusLabel(value) {
  const map = { new: "🆕 yangi", pending: "⏳ kutilmoqda", confirmed: "✅ tasdiqlangan", completed: "🏁 yakunlangan", cancelled: "❌ bekor qilingan" };
  return map[value] || value || "—";
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
  const from = message?.from || update?.callback_query?.from || null;
  const chatId = message?.chat?.id ?? from?.id ?? null;
  const token = settings?.[bot]?.token || null;
  const displayName = [from?.first_name, from?.last_name].filter(Boolean).join(" ") || "Millytour foydalanuvchisi";

  if (!message || !from) return { ok: false, reason: "Update'da xabar yo'q" };

  const command = text.split(/\s+/)[0].toLowerCase().replace(/@[\w_]+$/, "");
  const loginPayload = text.match(/^\/start(?:\s+login_([\w-]+))?/)?.[1] || null;
  let reply = "";
  let kind = "message";
  let extra = {};

  if (loginPayload) {
    // Kirishni tasdiqlash: istalgan botda `login_<challengeId>` qabul qilinadi.
    const challenge = await ctx.db.get(
      "SELECT * FROM auth_challenges WHERE id = ? AND type = 'telegram' AND expires_at > ?",
      loginPayload,
      Date.now(),
    );
    kind = "login";
    if (!challenge) {
      reply = "Kod eskirgan. Iltimos, saytga qaytib qaytadan urinib ko'ring.";
    } else {
      const user = await ctx.ensureUser({
        email: `telegram-${from.id}@telegram.local`,
        name: displayName,
        telegramId: from.id,
        telegramUsername: from.username,
      });
      await ctx.db.run("UPDATE auth_challenges SET status = 'verified', user_id = ? WHERE id = ?", user.id, challenge.id);
      reply = `✅ ${displayName}, hisobingiz tasdiqlandi. Saytga qaytishingiz mumkin.`;
      extra = mainMenu();
    }
  } else if (command === "/orders" || command === "/buyurtmalar") {
    const user = await ctx.ensureUser({
      email: `telegram-${from.id}@telegram.local`,
      name: displayName,
      telegramId: from.id,
      telegramUsername: from.username,
    });
    const bookings = await ctx.records("booking", user.id);
    kind = "orders";
    reply = bookings.length
      ? bookings
          .slice(0, 6)
          .map((item) => `${item.reference} · ${item.title || item.service || "Buyurtma"}\n${statusLabel(item.status)} · $${item.totalPrice || 0}`)
          .join("\n\n")
      : "Sizda hali buyurtma yo'q. Saytdan tur paket tanlang yoki /help ni bosing.";
    extra = mainMenu();
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
      "📊 Millytour ko'rsatkichlari",
      `Foydalanuvchilar: ${overview.totals.users}`,
      `Hamkorlar: ${overview.totals.providers} (${overview.totals.pendingProviders} tasdiq kutmoqda)`,
      `Buyurtmalar: ${overview.totals.bookings} (${overview.totals.openBookings} faol)`,
      `Tushum: $${overview.totals.gross} · komissiya $${overview.totals.commission}`,
      `Obuna: $${overview.totals.subscriptionRevenue}/oy`,
    ].join("\n");
  } else if (command === "/start") {
    const user = await ctx.ensureUser({
      email: `telegram-${from.id}@telegram.local`,
      name: displayName,
      telegramId: from.id,
      telegramUsername: from.username,
    });
    kind = "start";
    const bookings = await ctx.records("booking", user.id);
    reply = [
      `Assalomu alaykum, ${displayName}! 👋`,
      bot === "auth" ? "Bu bot orqali saytga xavfsiz kirasiz." : "Millytour botiga xush kelibsiz.",
      bot === "stats" ? "Statistika uchun /stats buyrug'ini bering." : "",
      bookings.length ? `Sizda ${bookings.length} ta buyurtma bor — /orders bilan ko'ring.` : "",
      "",
      HELP[bot] || HELP.main,
    ]
      .filter(Boolean)
      .join("\n");
    extra = bot === "stats" ? {} : mainMenu();
  } else {
    kind = "help";
    reply = HELP[bot] || HELP.main;
    extra = bot === "stats" ? {} : mainMenu();
  }

  let sent = false;
  let sendError = null;
  if (token && chatId) {
    const result = await sendMessage(token, chatId, reply, extra);
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

/** Simulyatsiya uchun Telegram update shakli. */
export function buildUpdate({ text, chatId = 990000001, firstName = "Lokal", lastName = "Foydalanuvchi", username = "local_tester" }) {
  return {
    update_id: Date.now(),
    message: {
      message_id: Date.now() % 100000,
      date: Math.floor(Date.now() / 1000),
      chat: { id: chatId, type: "private" },
      from: { id: chatId, is_bot: false, first_name: firstName, last_name: lastName, username, language_code: "uz" },
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
