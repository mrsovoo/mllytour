import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { openDatabase } from "./schema.mjs";
import { seedDemoData } from "./seed.mjs";
import {
  BOT_IDS,
  botConfigView,
  buildUpdate,
  getMe,
  getWebhookInfo,
  handleUpdate,
  isLocalMode,
  loadBotSettings,
  registerWebhook,
  resolveOwnerChatId,
  saveBotSettings,
  sendMessage,
  startPolling,
  fetchUpdates,
} from "./telegram.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// `.env*` repo ildizida turadi (Vite ham `envDir` orqali shu yerdan o'qiydi).
dotenv.config({ path: path.join(__dirname, "..", "..", ".env.local") });
dotenv.config({ path: path.join(__dirname, "..", "..", ".env") });
const app = express();
const port = Number(process.env.PORT || 4000);
const databasePath = path.join(__dirname, "..", "data", "millytour.db");

const db = await openDatabase(databasePath);
await db.run("UPDATE sessions SET expires_at = ? WHERE expires_at = 0", Date.now() + 7 * 24 * 60 * 60 * 1000);

/**
 * CORS.
 *
 * `CORS_ORIGIN` — vergul bilan ajratilgan ro'yxat, masalan
 * `https://millytour.uz,https://millytour-adm.vercel.app`.
 * Bo'sh bo'lsa so'rovchi origin qaytariladi (lokal dev uchun qulay), ammo
 * productionda ro'yxatni to'ldirish shart: `credentials: true` bilan birga
 * har qanday saytga ochiq qoldirish xavfli.
 */
const corsOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
app.use(cors({ origin: corsOrigins.length ? corsOrigins : true, credentials: true }));
app.use(cookieParser());
// Rasm biriktirmalar data-URL ko'rinishida keladi — limit biroz katta.
app.use(express.json({ limit: "4mb" }));

function json(value) { try { return JSON.parse(value); } catch { return value; } }
/**
 * Sessiya cookie'si.
 *
 * - `COOKIE_SECURE`    — `"true"` / `"false"`. Berilmasa HTTPS so'rovlarda
 *   avtomatik `true` bo'ladi (lokal http'da — false).
 * - `COOKIE_SAME_SITE` — `"lax"` | `"strict"` | `"none"` (default: `"lax"`).
 *   Frontend va backend **boshqa sayt** bo'lsa (masalan vercel.app → onrender.com)
 *   `"none"` + `COOKIE_SECURE=true` kerak. Subdomenlar (`millytour.uz` +
 *   `api.millytour.uz`) bir sayt hisoblanadi — `"lax"` ishlayveradi.
 * - `COOKIE_DOMAIN`    — subdomenlar orasida ulashish uchun, masalan `.millytour.uz`.
 */
function isSecureRequest(req) {
  if (process.env.COOKIE_SECURE) return process.env.COOKIE_SECURE === "true";
  const forwardedProto = req?.get?.("x-forwarded-proto");
  return Boolean(req?.secure) || String(forwardedProto || "").split(",")[0].trim() === "https";
}

function cookieOptions(req) {
  return {
    httpOnly: true,
    sameSite: process.env.COOKIE_SAME_SITE || "lax",
    secure: isSecureRequest(req),
    ...(process.env.COOKIE_DOMAIN ? { domain: process.env.COOKIE_DOMAIN } : {}),
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}
function reference(prefix = "MT") { return `${prefix}-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${randomUUID().slice(0, 6).toUpperCase()}`; }
function challengeExpiry() { return Date.now() + 10 * 60 * 1000; }

async function createSession(userId, res, req) {
  const sessionId = randomUUID();
  await db.run("INSERT INTO sessions (id,user_id,created_at,expires_at) VALUES (?, ?, ?, ?)", sessionId, userId, Date.now(), Date.now() + 7 * 24 * 60 * 60 * 1000);
  res.cookie("millytour_session", sessionId, cookieOptions(req));
  return sessionId;
}

async function userByEmail(email) {
  return db.get("SELECT * FROM users WHERE email = ?", email.toLowerCase());
}

async function userByPhone(phone) {
  return db.get("SELECT * FROM users WHERE phone = ?", phone);
}

/** Telefon raqamini yagona ko'rinishga keltiradi (faqat raqamlar). */
function normalizePhone(value) { return String(value || "").replace(/\D/g, ""); }

/** Identifikator email bo'lsa — email bo'yicha, aks holda telefon bo'yicha qidiradi. */
async function ensureUser({ email, name, isAnonymous = false, telegramId, telegramUsername }) {
  const identifier = String(email || "").trim().toLowerCase();
  const isPhone = Boolean(identifier) && !identifier.includes("@") && /\d/.test(identifier);
  const phone = isPhone ? normalizePhone(identifier) : null;
  let user = isPhone ? await userByPhone(phone) : await userByEmail(identifier);
  if (!user) {
    const id = randomUUID();
    await db.run("INSERT INTO users (id,email,name,is_anonymous,phone,telegram_id,telegram_username) VALUES (?, ?, ?, ?, ?, ?, ?)", id, isPhone ? null : identifier, name || "MillyTour sayohatchisi", isAnonymous ? 1 : 0, phone, telegramId || null, telegramUsername || null);
    user = await db.get("SELECT * FROM users WHERE id = ?", id);
  } else if (telegramId) {
    await db.run("UPDATE users SET telegram_id = ?, telegram_username = ?, name = COALESCE(?, name), is_anonymous = 0 WHERE id = ?", telegramId, telegramUsername || null, name || null, user.id);
    user = await db.get("SELECT * FROM users WHERE id = ?", user.id);
  }
  return user;
}

async function currentUser(req) {
  const sessionId = req.cookies?.millytour_session;
  if (!sessionId) return null;
  const row = await db.get("SELECT users.* FROM sessions JOIN users ON users.id = sessions.user_id WHERE sessions.id = ? AND sessions.expires_at > ?", sessionId, Date.now());
  if (!row) return null;
  return { _id: row.id, email: row.email, name: row.name, image: row.image, isAnonymous: Boolean(row.is_anonymous), role: row.role, phone: row.phone, country: row.country, language: row.language, telegramId: row.telegram_id, telegramUsername: row.telegram_username, interests: json(row.interests || "[]"), onboardedAt: row.onboarded_at };
}
async function requireUser(req) { const user = await currentUser(req); if (!user) throw new Error("Authentication required"); return user; }
async function record(kind, data, userId = null) { const id = randomUUID(); await db.run("INSERT INTO records (id, kind, user_id, data, created_at) VALUES (?, ?, ?, ?, ?)", id, kind, userId, JSON.stringify(data), Date.now()); return { _id: id, ...data }; }
async function records(kind, userId) { const rows = userId === undefined ? await db.all("SELECT * FROM records WHERE kind = ? ORDER BY created_at DESC", kind) : await db.all("SELECT * FROM records WHERE kind = ? AND user_id = ? ORDER BY created_at DESC", kind, userId); return rows.map((row) => ({ _id: row.id, createdAt: row.created_at, ...json(row.data) })); }
async function updateRecord(id, patch) { const row = await db.get("SELECT * FROM records WHERE id = ?", id); if (!row) throw new Error("Yozuv topilmadi"); const next = { ...json(row.data), ...patch }; await db.run("UPDATE records SET data = ? WHERE id = ?", JSON.stringify(next), id); return { _id: id, createdAt: row.created_at, ...next }; }
async function removeRecord(id) { await db.run("DELETE FROM records WHERE id = ?", id); return { ok: true }; }

/** Taassurot kayfiyati — frontenddagi tanlov bilan bir xil ro'yxat. */
const IMPRESSION_MOODS = ["great", "happy", "calm", "adventurous", "tired"];

/**
 * Qo'llab-quvvatlash (support) suhbati.
 *
 * Xabarlar `support_message` turidagi yozuvlar sifatida saqlanadi va foydalanuvchi
 * id'si bilan bog'lanadi (thread = user._id). Rasm biriktirma data-URL sifatida
 * yozuvga qo'shiladi (limit: 4mb JSON).
 */
async function supportThread(userId) {
  const rows = await records("support_message", userId);
  // `records` eng yangisini birinchi qaytaradi — suhbat uchun eskisini birinchi qilamiz.
  return rows.slice().sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));
}

function supportAttachment(value) {
  if (!value || typeof value !== "object") return null;
  const dataUrl = String(value.dataUrl || "");
  if (!dataUrl.startsWith("data:image/")) return null;
  return {
    name: String(value.name || "rasm").slice(0, 120),
    type: String(value.type || "image/jpeg").slice(0, 60),
    dataUrl: dataUrl.slice(0, 3_000_000),
  };
}

async function supportSend(user, args = {}) {
  const text = String(args.text || "").trim().slice(0, 4000);
  const attachment = supportAttachment(args.attachment);
  if (!text && !attachment) throw new Error("Xabar bo'sh");
  const message = await record("support_message", {
    threadId: user._id,
    role: "user",
    authorName: user.name || "Sayohatchi",
    text,
    attachment,
    replyTo: args.replyTo
      ? { _id: String(args.replyTo._id || ""), text: String(args.replyTo.text || "").slice(0, 300) }
      : null,
    createdAt: Date.now(),
  }, user._id);
  // Operator hali javob bermagan bo'lsa, avtomatik tasdiq yuboriladi.
  const replies = await records("support_message", user._id);
  if (!replies.some((row) => row.role === "support")) {
    await record("support_message", {
      threadId: user._id,
      role: "support",
      authorName: "MillyTour",
      text: "Xabaringiz qabul qilindi. Operator tez orada javob beradi — shu chatda davom etamiz.",
      attachment: null,
      replyTo: null,
      automated: true,
      createdAt: Date.now() + 1,
    }, user._id);
  }
  return message;
}
/** Mijozlar fikri reaksiyasi: faqat 👍 / 👎 bo'ladi. */
function reactionKind(row) { return row.kind === "dislike" ? "dislike" : "like"; }
/** Eski `review_like` yozuvlari ham "like" sifatida o'qiladi (moslik uchun). */
async function allReactionRows() { const rows = await records("review_reaction"); const legacy = await records("review_like"); return [...rows, ...legacy.map((row) => ({ ...row, kind: "like" }))]; }

function packageRow(slug) { return { key: `catalog:${slug}`, dbId: null, slug, title: slug.replaceAll("-", " "), summary: "O'zbekiston bo'ylab sayohat dasturi", category: "historical", city: "Samarqand", region: "Samarqand", days: 3, nights: 2, priceFrom: 250, rating: 4.8, reviews: 0, groupSize: "2-12 kishi", nextDeparture: "Har hafta", languages: ["uz", "ru", "en"], includes: [], highlights: [], image: "", alt: slug, status: "published", featured: false, source: "catalog" }; }
function buildPlans(answers = {}) { const city = typeof answers.city === "string" ? answers.city : "Samarqand"; const days = Math.max(1, Number(answers.days) || 3); const travelers = Math.max(1, Number(answers.travelers) || 2); const budget = Math.max(80, Number(answers.budget) || 800); return ["Komfort", "Tejamkor"].map((label, index) => { const total = Math.round(Math.min(budget, (index ? 75 : 125) * days * travelers)); return { title: `${label} ${city} sayohati`, summary: `${days} kunlik ${city} dasturi · ${label.toLowerCase()} variant`, cities: [city], days: Array.from({ length: days }, (_, day) => ({ day: day + 1, city, title: `${city} bo'ylab kun ${day + 1}`, lodging: index ? "3* mehmonxona" : "4* mehmonxona", spend: Math.round(total / days), items: [{ time: "09:00", title: "Shahar bo'ylab sayohat", note: "Mahalliy gid bilan", kind: "meros" }] })), estimate: { total, perPerson: Math.round(total / travelers), currency: "USD", withinBudget: total <= budget, breakdown: [{ label: "Turar joy va xizmatlar", amount: total }] }, tips: ["Qulay oyoq kiyim kiying"], pack: ["Pasport", "Quyoshdan himoya"] }; }); }

/** Platforma komissiyasi — hamkor daromadidan ushlanadigan ulush. */
const COMMISSION_RATE = 0.12;
/** Kun uzunligi (ms) — kunlik grafik va vazifa sanalari uchun. */
const DAY_MS = 24 * 60 * 60 * 1000;
/** Hamkor yo'nalishlari (`frontend/src/shared/data/catalog.ts` dagi PARTNER_DIRECTIONS bilan bir xil). */
const PROVIDER_DIRECTIONS = ["guide", "transfer", "artisan", "hotel", "translator", "photographer", "restaurant", "other"];
const PROVIDER_LABELS = { guide: "Gid", transfer: "Transfer", artisan: "Hunarmand", hotel: "Mehmonxona", translator: "Tarjimon", photographer: "Fotograf", restaurant: "Restoran / oshxona", other: "Boshqa turizm xizmati" };
/**
 * Yo'nalish bo'yicha oylik obuna narxi (USD).
 * Frontenddagi `PARTNER_DIRECTIONS` bilan bir xil bo'lishi shart — provider
 * yozuvining `monthlyFee` maydoni shu jadvaldan to'ldiriladi.
 */
const PROVIDER_FEES = { guide: 29, transfer: 39, artisan: 19, hotel: 49, translator: 25, photographer: 25, restaurant: 29, other: 15 };

/** Yo'nalishni tekshirib, provider yozuvining umumiy maydonlarini tayyorlaydi. */
function providerPayload(args = {}) {
  const direction = PROVIDER_DIRECTIONS.includes(args.direction) ? args.direction : "other";
  return {
    direction,
    businessName: String(args.businessName || "").trim().slice(0, 160) || "MillyTour hamkori",
    city: String(args.city || "").trim().slice(0, 80),
    phone: String(args.phone || "").trim().slice(0, 40),
    telegramUsername: args.telegramUsername ? String(args.telegramUsername).replace(/^@/, "").slice(0, 60) : null,
    telegramId: args.telegramId ?? null,
    about: String(args.about || "").trim().slice(0, 1500),
    experienceYears: Number(args.experienceYears) || 0,
    languages: Array.isArray(args.languages) ? args.languages.slice(0, 8) : [],
    directionAnswers: args.directionAnswers && typeof args.directionAnswers === "object" ? args.directionAnswers : {},
    monthlyFee: PROVIDER_FEES[direction] ?? PROVIDER_FEES.other,
  };
}

/**
 * Hamkor profilini yaratadi — sayt (`providers.register`) va bot wizard'i shu
 * yo'ldan foydalanadi, shunda ikkalasida maydonlar bir xil to'ladi.
 */
async function createProvider(userId, args = {}) {
  return await record(
    "provider",
    {
      userId,
      email: args.email || null,
      ...providerPayload(args),
      // Botdagi "band / bo'sh" ko'rsatkichi — slot ochish-yopish shunga tayanadi.
      availability: "available",
      status: "pending",
      subscription: "trial",
      rating: 0,
      ratingCount: 0,
      completedOrders: 0,
      walletBalance: 0,
      createdAt: Date.now(),
    },
    userId,
  );
}

/**
 * Hamkor ko'rsatkichlari: profil, ochiq so'rovlar va biriktirilgan buyurtmalar.
 * Saytdagi `/partner` paneli ham, bot menyusi ham bir xil hisobdan foydalanadi.
 */
async function providerMetrics(userId) {
  const provider = (await records("provider", userId))[0] || null;
  if (!provider) return { provider: null, open: [], assigned: [], completed: 0, tasks: [], upcomingTasks: [], taskEarnings: 0, revenue: 0, commission: 0, payout: 0 };
  const [bookings, assignments] = await Promise.all([records("booking"), records("assignment")]);
  const mine = assignments.filter((task) => task.providerId === provider._id || task.providerUserId === userId);
  const takenIds = new Set(assignments.map((task) => task.bookingId));
  const sameCity = (booking) => String(booking.city || "").toLowerCase().includes(String(provider.city || "").toLowerCase()) && String(provider.city || "").length > 0;
  const open = bookings
    .filter((booking) => booking.status === "pending" && !takenIds.has(booking._id))
    .sort((a, b) => Number(sameCity(b)) - Number(sameCity(a)) || Number(b.createdAt || 0) - Number(a.createdAt || 0))
    .slice(0, 12);
  const myBookingIds = new Set(mine.map((task) => task.bookingId));
  const assigned = bookings.filter((booking) => myBookingIds.has(booking._id) && booking.status !== "cancelled");
  const revenue = assigned.filter((booking) => booking.status !== "pending").reduce((sum, booking) => sum + Number(booking.totalPrice || 0), 0);
  const commission = Math.round(revenue * COMMISSION_RATE);
  return {
    provider,
    open,
    assigned,
    completed: mine.filter((task) => task.status === "done").length,
    tasks: mine,
    upcomingTasks: mine.filter((task) => Number(task.scheduledFor || 0) >= Date.now() && task.status !== "done").sort((a, b) => Number(a.scheduledFor || 0) - Number(b.scheduledFor || 0)),
    taskEarnings: mine.filter((task) => task.status === "done").reduce((sum, task) => sum + Number(task.amount || 0), 0),
    revenue,
    commission,
    payout: revenue - commission,
  };
}
const UZ_MONTHS = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];

/** Katalogdagi tur paketni paket ko'rinishiga (PackageView) keltiradi. */
function packageView(row) {
  return {
    key: `db:${row._id}`,
    dbId: row._id,
    slug: row.slug,
    category: row.category || "historical",
    badge: row.badge ?? null,
    title: row.title || row.slug,
    summary: row.summary || "",
    city: row.city || "",
    region: row.region || "",
    days: Number(row.days) || 1,
    nights: Number(row.nights) || Math.max(0, (Number(row.days) || 1) - 1),
    priceFrom: Number(row.priceFrom) || 0,
    oldPrice: row.oldPrice ?? null,
    rating: Number(row.rating) || 0,
    reviews: Number(row.reviews) || 0,
    groupSize: row.groupSize || "2-12 kishi",
    nextDeparture: row.nextDeparture || "Har hafta",
    languages: row.languages || ["uz"],
    includes: row.includes || [],
    highlights: row.highlights || [],
    image: row.image || "",
    alt: row.alt || row.title || row.slug,
    status: row.status || "published",
    featured: Boolean(row.featured),
  };
}

/** Tadbirni joriy oyga nisbatan boyitadi (oy yorlig'i, tavsiya sababi). */
function eventView(row, now = new Date()) {
  const month = Math.min(12, Math.max(1, Number(row.month) || now.getMonth() + 1));
  const current = now.getMonth() + 1;
  const monthsAhead = (month - current + 12) % 12;
  return {
    ...row,
    month,
    monthLabel: UZ_MONTHS[month - 1],
    isCurrentMonth: month === current,
    monthsAhead,
    reason: monthsAhead === 0 ? "Shu oy bo'lib o'tadi" : `${monthsAhead} oydan keyin`,
  };
}

/** Admin panelning umumiy ko'rsatkichlari — barchasi bazadagi yozuvlardan hisoblanadi. */
async function adminOverview() {
  const [userRows, providers, bookings, payments, items, botEvents, assignments] = await Promise.all([
    db.all("SELECT id, role FROM users"),
    records("provider"),
    records("booking"),
    records("payment"),
    records("market_item"),
    records("telegram_event"),
    records("assignment"),
  ]);
  const providerUserIds = new Set(providers.map((provider) => provider.userId));
  const paidBookings = bookings.filter((booking) => booking.paymentStatus === "paid");
  const gross = paidBookings.reduce((sum, booking) => sum + Number(booking.totalPrice || 0), 0);
  const activeSubscriptions = providers.filter((provider) => provider.status === "approved" && provider.subscription === "active");
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const series = Array.from({ length: 14 }, (_, index) => {
    const dayStart = startOfToday.getTime() - (13 - index) * DAY_MS;
    const dayBookings = bookings.filter((booking) => Number(booking.createdAt || 0) >= dayStart && Number(booking.createdAt || 0) < dayStart + DAY_MS);
    const day = new Date(dayStart);
    return {
      day: `${String(day.getDate()).padStart(2, "0")}.${String(day.getMonth() + 1).padStart(2, "0")}`,
      bookings: dayBookings.length,
      revenue: dayBookings.filter((booking) => booking.paymentStatus === "paid").reduce((sum, booking) => sum + Number(booking.totalPrice || 0), 0),
    };
  });
  const providerRevenue = (providerId) => assignments.filter((task) => task.providerId === providerId && task.status === "done").reduce((sum, task) => sum + Number(task.amount || 0), 0);
  return {
    totals: {
      users: userRows.length,
      tourists: userRows.filter((row) => !providerUserIds.has(row.id)).length,
      providers: providers.length,
      pendingProviders: providers.filter((provider) => provider.status === "pending").length,
      bookings: bookings.length,
      openBookings: bookings.filter((booking) => ["pending", "confirmed"].includes(booking.status)).length,
      gross,
      commission: Math.round(gross * COMMISSION_RATE),
      subscriptionRevenue: activeSubscriptions.reduce((sum, provider) => sum + Number(provider.monthlyFee || 0), 0),
      pendingItems: items.filter((item) => item.status === "pending").length,
      botEvents: botEvents.length,
      payments: payments.length,
    },
    byDirection: PROVIDER_DIRECTIONS.map((direction) => {
      const rows = providers.filter((provider) => provider.direction === direction);
      return {
        direction,
        label: PROVIDER_LABELS[direction],
        total: rows.length,
        approved: rows.filter((provider) => provider.status === "approved").length,
        pending: rows.filter((provider) => provider.status === "pending").length,
        mrr: rows.filter((provider) => provider.status === "approved" && provider.subscription === "active").reduce((sum, provider) => sum + Number(provider.monthlyFee || 0), 0),
      };
    }).filter((row) => row.total > 0),
    series,
    recentBookings: bookings.slice(0, 8),
    topProviders: providers
      .map((provider) => ({ _id: provider._id, businessName: provider.businessName, direction: provider.direction, city: provider.city, rating: provider.rating, completedOrders: provider.completedOrders, revenue: providerRevenue(provider._id) }))
      .sort((a, b) => b.rating - a.rating || b.completedOrders - a.completedOrders)
      .slice(0, 5),
  };
}

/**
 * Milly AI uchun qat'iy qoida: model faqat katalogdagi mavjud tur paketlarni
 * tavsiya qiladi. Narx, kun va shaharlar o'zgartirilmaydi — model matn yozadi,
 * tanlov esa klientdagi narx algoritmida (src/lib/ai-recommend.ts) qoladi.
 */
const CATALOG_RULE = "Siz Milly AI siz. Faqat quyidagi ro'yxatdagi tur paketlarni tavsiya qilasiz: narx, kun soni va shaharni o'zgartirmaysiz, yangi tur yoki narx o'ylab topmaysiz. Javobni foydalanuvchi tilida yozasiz.";

function catalogPrompt(catalog) {
  if (!Array.isArray(catalog) || catalog.length === 0) return "";
  const rows = catalog
    .slice(0, 8)
    .map((item) => `- ${item.title} | ${item.city || "O'zbekiston"} | ${item.days || "?"} kun | $${item.perPerson}/kishi (jami ~$${item.total})`)
    .join("\n");
  return `${CATALOG_RULE}\n\nMavjud tur paketlar:\n${rows}`;
}

/** AI kaliti yo'q paytdagi zaxira javob — baribir faqat mavjud paketlar. */
function catalogReply(catalog) {
  if (!Array.isArray(catalog) || catalog.length === 0) {
    return "Milly AI hozir narxga asoslangan rejimda ishlayapti. Shahar, kunlar soni va byudjetni yozing — katalogdagi mos tur paketlarni narxi bilan taklif qilaman.";
  }
  const lines = catalog
    .slice(0, 5)
    .map((item, index) => `${index + 1}. ${item.title} — ${item.reason || `$${item.perPerson}/kishi`}`);
  return `Hozir AI modeli ulanmagan (API kaliti sozlanmagan), shuning uchun katalogdagi mavjud tur paketlarni narx bo'yicha saralab berdim:\n\n${lines.join("\n")}\n\n«Tur paketlar» bo'limida batafsil ma'lumot bor.`;
}

async function groq(message, history = [], catalog = []) {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  const system = catalogPrompt(catalog) || "You are Milly AI, a helpful Uzbekistan travel assistant. Reply in the user's language.";
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` }, body: JSON.stringify({ model: process.env.GROQ_MODEL || "qwen/qwen3-32b", temperature: 0.6, max_tokens: 700, messages: [{ role: "system", content: system }, ...history, { role: "user", content: message }] }) });
  if (!response.ok) return null;
  const payload = await response.json();
  return payload.choices?.[0]?.message?.content || null;
}

const DIRECTION_QUESTIONS = {
  guide: ["Qaysi tillarda gidlik qilasiz?", "Litsenziya yoki sertifikatingiz bormi?", "Bir kunda nechta guruh qabul qilasiz?"],
  transfer: ["Avtomobil modeli va ishlab chiqarilgan yili?", "Nechta yo'lovchi o'rni bor?", "Davlat raqami va texnik holati?"],
  hotel: ["Nechta xona mavjud?", "Xona toifalari va narx oralig'i qanday?", "Qabul qilish vaqti qanday?"],
  restaurant: ["Nechta mehmon uchun joy bor?", "Qaysi milliy taomlar mavjud?", "Guruhlar uchun maxsus menyu bormi?"],
  translator: ["Qaysi tillarda tarjima qilasiz?", "Qaysi mavzularda tajribangiz bor?", "Bir kunda necha soat xizmat ko'rsatasiz?"],
  photographer: ["Qaysi turdagi fotosessiyalarni qilasiz?", "Qanday kamera va jihozlaringiz bor?", "Bir haftada nechta sessiya qabul qilasiz?"],
  artisan: ["Qaysi hunarmandchilik mahsulotlarini tayyorlaysiz?", "Mahsulot tayyorlash uchun necha kun kerak?", "Oyiga taxminan nechta buyurtma qabul qilasiz?"],
  other: ["Xizmatingiz turistga qanday yordam beradi?", "Qaysi shaharlarda xizmat ko'rsatasiz?", "Buyurtmani bajarish uchun qancha vaqt kerak?"],
};

async function createBooking(args, req, user) {
  const authUser = user || await requireUser(req);
  const totalPrice = Number(args.totalPrice || 0);
  const booking = await record("booking", { ...args, reference: reference("MT"), status: "new", paymentStatus: "unpaid", totalPrice, createdAt: Date.now(), updatedAt: Date.now() }, authUser._id);
  const payment = await record("payment", { bookingId: booking._id, reference: reference("PAY"), amount: totalPrice, method: args.paymentMethod || "payme", status: "pending", createdAt: Date.now() }, authUser._id);
  return { bookingId: booking._id, reference: booking.reference, paymentId: payment._id, paymentReference: payment.reference, totalPrice, startDate: args.startDate, days: Number(args.days || 1), guests: Number(args.guests || 1), specialists: [] };
}
/**
 * Telegram botlari uchun kontekst — bot dvigateli shu obyekt orqali bazaga
 * va biznes-mantiqqa ulanadi (webhook ham, simulyatsiya ham bir xil ishlaydi).
 */
const telegramCtx = {
  db,
  record,
  records,
  updateRecord,
  removeRecord,
  ensureUser,
  overview: adminOverview,
  providerDirections: PROVIDER_DIRECTIONS,
  providerLabels: PROVIDER_LABELS,
  providerFees: PROVIDER_FEES,
  directionQuestions: DIRECTION_QUESTIONS,
  createProvider,
  providerMetrics,
};

async function dispatch(module, operation, args, req) {
  const user = await currentUser(req); const userId = user?._id;
  if (module === "users" && operation === "currentUser") return user;
  if (module === "account" && operation === "profile") return user;
  if (module === "account" && operation === "completeOnboarding") { const authUser = await requireUser(req); await db.run("UPDATE users SET name = COALESCE(?, name), interests = ?, onboarded_at = ? WHERE id = ?", args.name || null, JSON.stringify(args.interests || []), Date.now(), authUser._id); return { ok: true }; }
  if (module === "account" && operation === "setLanguage") { const authUser = await requireUser(req); await db.run("UPDATE users SET language = ? WHERE id = ?", args.language, authUser._id); return { language: args.language }; }
  if (module === "account" && operation === "setInterests") { const authUser = await requireUser(req); await db.run("UPDATE users SET interests = ? WHERE id = ?", JSON.stringify(args.interests || []), authUser._id); return { ok: true }; }
  if (module === "aiStatus" && operation === "status") return { provider: process.env.GROQ_API_KEY ? "groq" : "none", model: process.env.GROQ_MODEL || "rule-based", ready: Boolean(process.env.GROQ_API_KEY), engine: process.env.GROQ_API_KEY ? "llm" : "rule-based", recommender: "catalog-price", languages: ["uz", "ru", "en"], abilities: ["travel", "booking", "payments"] };
  if (module === "aiPlanner" && operation === "generate") { const options = buildPlans(args.answers); const saved = await record("plan", { sessionKey: args.sessionKey, answers: args.answers, options, plan: options[0], engine: "rule-based", createdAt: Date.now() }, userId); return { planId: saved._id, options, engine: "rule-based" }; }
  if (module === "millyChat" && operation === "chat") {
    // Klient katalogdagi mos paketlarni yuboradi — model faqat shular asosida javob yozadi.
    const catalog = Array.isArray(args.catalog) ? args.catalog : [];
    const reply = await groq(String(args.message || ""), args.history || [], catalog);
    return { reply: reply || catalogReply(catalog), lang: "uz", engine: reply ? "ai" : "rule-based", recommendations: catalog };
  }
  if (module === "millyChat" && operation === "bookTour") return createBooking(args, req, user);
  if (module === "aiMemory" && operation === "rateReply") return { ok: true };
  if (module === "packages" && ["list", "recommended", "adminList"].includes(operation)) {
    const rows = await records("package");
    // Baza bo'sh bo'lsa `[]` qaytadi — frontend statik katalogga tushadi.
    const filtered = rows.map(packageView).filter((row) => (!args.category || args.category === "all" || row.category === args.category)
      && (!args.city || row.city.toLowerCase().includes(String(args.city).toLowerCase()))
      && (!args.q || `${row.title} ${row.city}`.toLowerCase().includes(String(args.q).toLowerCase()))
      && (operation === "adminList" || row.status === "published"));
    return Number(args.limit) > 0 ? filtered.slice(0, Number(args.limit)) : filtered;
  }
  if (module === "packages" && operation === "bySlug") {
    const row = (await records("package")).find((item) => item.slug === args.slug);
    return row ? packageView(row) : packageRow(args.slug);
  }
  // Mijozlar fikri uchun "foydali" (tasdiqlash) tugmasi. Login qilmagan
  // mijoz `sessionKey` orqali aniqlanadi, shuning uchun like yo'qolmaydi.
  // Mijozlar fikriga 👍 / 👎 reaksiyalari. Login qilmagan mijoz `sessionKey`
  // orqali aniqlanadi, shuning uchun reaksiya yo'qolmaydi.
  if (module === "reviews" && operation === "reactions") {
    const rows = await allReactionRows();
    const sessionKey = args.sessionKey ? String(args.sessionKey) : null;
    const counts = {};
    const mine = {};
    for (const row of rows) {
      const kind = reactionKind(row);
      const entry = counts[row.reviewId] || { like: 0, dislike: 0 };
      entry[kind] += 1;
      counts[row.reviewId] = entry;
      if ((userId && row.userId === userId) || (sessionKey && row.sessionKey === sessionKey)) mine[row.reviewId] = kind;
    }
    return { counts, mine };
  }
  if (module === "reviews" && operation === "toggleReaction") {
    const reviewId = String(args.reviewId || "");
    if (!reviewId) throw new Error("reviewId kerak");
    const kind = args.kind === "dislike" ? "dislike" : "like";
    const sessionKey = args.sessionKey ? String(args.sessionKey) : null;
    const isMine = (row) => (userId && row.userId === userId) || (sessionKey && row.sessionKey === sessionKey);
    const existing = (await allReactionRows()).find((row) => row.reviewId === reviewId && isMine(row));
    let mine = null;
    if (existing) {
      await db.run("DELETE FROM records WHERE id = ?", existing._id);
      if (reactionKind(existing) !== kind) {
        await record("review_reaction", { reviewId, sessionKey, kind }, userId);
        mine = kind;
      }
    } else {
      await record("review_reaction", { reviewId, sessionKey, kind }, userId);
      mine = kind;
    }
    const counts = { like: 0, dislike: 0 };
    for (const row of await allReactionRows()) {
      if (row.reviewId === reviewId) counts[reactionKind(row)] += 1;
    }
    return { reviewId, mine, counts };
  }
  if (module === "plans" && operation === "mine") return await records("plan", userId);
  if (module === "plans" && operation === "latestBySession") return (await records("plan")).find((item) => item.sessionKey === args.sessionKey) || null;
  if (module === "plans" && operation === "choose") return { ok: true, chosenIndex: args.chosenIndex };
  // Shaxsiy sayohat rejalari — foydalanuvchi o'zi yozib qo'yadigan kelgusi safarlar.
  if (module === "tripPlans" && operation === "mine") return await records("trip_plan", userId);
  if (module === "tripPlans" && operation === "create") {
    const authUser = await requireUser(req);
    if (!String(args.title || "").trim()) throw new Error("Reja nomini kiriting");
    return await record("trip_plan", {
      title: String(args.title).trim().slice(0, 120),
      city: String(args.city || "").trim().slice(0, 80),
      startDate: args.startDate || null,
      endDate: args.endDate || null,
      notes: String(args.notes || "").trim().slice(0, 2000),
      status: "upcoming",
      createdAt: Date.now(),
    }, authUser._id);
  }
  if (module === "tripPlans" && operation === "remove") {
    const authUser = await requireUser(req);
    const mine = await records("trip_plan", authUser._id);
    if (!mine.some((row) => row._id === args.planId)) throw new Error("Reja topilmadi");
    return await removeRecord(args.planId);
  }
  // Sayohat taassurotlari — "Tarix" bo'limida bitta bron uchun bitta taassurot
  // muhurlanadi (matn + kayfiyat + baho). Qayta saqlansa yangilanadi.
  if (module === "impressions" && operation === "mine") return await records("trip_impression", userId);
  if (module === "impressions" && operation === "save") {
    const authUser = await requireUser(req);
    const bookingId = String(args.bookingId || "");
    const booking = (await records("booking", authUser._id)).find((row) => row._id === bookingId);
    if (!booking) throw new Error("Buyurtma topilmadi");
    const text = String(args.text || "").trim().slice(0, 1200);
    if (!text) throw new Error("Taassurot matnini kiriting");
    const payload = {
      bookingId,
      reference: booking.reference || null,
      title: booking.title || null,
      city: booking.city || null,
      startDate: booking.startDate || null,
      mood: IMPRESSION_MOODS.includes(args.mood) ? args.mood : "happy",
      rating: Math.min(5, Math.max(1, Math.round(Number(args.rating) || 5))),
      text,
      stampedAt: Date.now(),
    };
    const existing = (await records("trip_impression", authUser._id)).find(
      (row) => row.bookingId === bookingId,
    );
    return existing ? await updateRecord(existing._id, payload) : await record("trip_impression", payload, authUser._id);
  }
  if (module === "impressions" && operation === "remove") {
    const authUser = await requireUser(req);
    const mine = await records("trip_impression", authUser._id);
    if (!mine.some((row) => row._id === args.impressionId)) throw new Error("Taassurot topilmadi");
    return await removeRecord(args.impressionId);
  }
  if (module === "providers" && operation === "list") {
    const rows = await records("provider");
    return rows.filter((provider) => (!args.status || provider.status === args.status) && (!args.direction || provider.direction === args.direction));
  }
  if (module === "providers" && operation === "publicList") {
    const rows = await records("provider");
    return rows.filter((provider) => provider.status === "approved" && (!args.direction || provider.direction === args.direction)).map((provider) => ({ ...provider, contact: user ? { phone: provider.phone, telegramUsername: provider.telegramUsername || null } : null }));
  }
  if (module === "providers" && operation === "me") {
    const provider = (await records("provider", userId))[0] || null;
    return provider ? { user, provider } : null;
  }
  if (module === "providers" && operation === "questions") {
    const direction = DIRECTION_QUESTIONS[args.direction] ? args.direction : "other";
    const questions = DIRECTION_QUESTIONS[direction];
    const aiIntro = await groq(`Hamkor ${direction} yo'nalishida ro'yxatdan o'tmoqda. Unga o'zbek tilida qisqa, do'stona 1 jumlalik kirish yozing. Faqat jumlani qaytaring.`);
    return { direction, questions, aiIntro: aiIntro || `${direction} yo'nalishi uchun kerakli ma'lumotlarni kiriting.` };
  }
  if (module === "providers" && operation === "metrics") return await providerMetrics(userId);
  if (module === "providers" && operation === "register") return await createProvider(userId, args);
  if (module === "providers" && operation === "submitLead") { await record("lead", { ...args, handled: false, createdAt: Date.now() }, userId); return { ok: true, message: "So'rov qabul qilindi" }; }
  if (module === "providers" && operation === "listLeads") return await records("lead");
  if (module === "providers" && operation === "updateProfile") {
    const provider = (await records("provider", userId))[0];
    if (!provider) throw new Error("Hamkor profili topilmadi");
    return await updateRecord(provider._id, { ...args, updatedAt: Date.now() });
  }
  if (module === "providers" && operation === "reportVehicle") {
    const provider = (await records("provider", userId))[0];
    if (!provider) throw new Error("Hamkor profili topilmadi");
    return await updateRecord(provider._id, { vehicle: { ...(provider.vehicle || {}), ...args, reportedAt: Date.now() } });
  }
  if (module === "providers" && operation === "toggleUnavailableDate") {
    const provider = (await records("provider", userId))[0];
    if (!provider) throw new Error("Hamkor profili topilmadi");
    const current = Array.isArray(provider.unavailableDates) ? provider.unavailableDates : [];
    const next = current.includes(args.date) ? current.filter((date) => date !== args.date) : [...current, args.date];
    return await updateRecord(provider._id, { unavailableDates: next });
  }
  if (module === "providers" && operation === "setStatus") return await updateRecord(args.providerId, { status: args.status, updatedAt: Date.now() });
  if (module === "providers" && operation === "setSubscription") {
    const months = Number(args.months) || 1;
    const patch = { subscription: args.subscription, months, paidUntil: Date.now() + months * 30 * DAY_MS, updatedAt: Date.now() };
    if (args.subscription === "active") patch.status = "approved";
    return await updateRecord(args.providerId, patch);
  }
  if (module === "providers" && operation === "handleLead") return await updateRecord(args.leadId, { handled: args.handled !== false, handledAt: Date.now(), handledBy: userId });
  if (module === "events" && operation === "list") {
    const rows = (await records("event")).map((row) => eventView(row)).sort((a, b) => a.monthsAhead - b.monthsAhead);
    return Number(args.limit) > 0 ? rows.slice(0, Number(args.limit)) : rows;
  }
  if (module === "market" && operation === "approved") return (await records("market_item")).filter((item) => item.status === "approved");
  if (module === "market" && operation === "pending") return (await records("market_item")).filter((item) => item.status === "pending");
  if (module === "market" && operation === "myItems") return await records("market_item", userId);
  if (module === "market" && operation === "addItem") {
    const provider = (await records("provider", userId))[0] || null;
    const item = await record("market_item", {
      title: args.title,
      category: args.category || "Boshqa",
      city: args.city || provider?.city || "",
      price: Number(args.price) || 0,
      seller: provider?.businessName || user?.name || "MillyTour hamkori",
      handmadeDays: Number(args.handmadeDays) || 0,
      image: args.image || "",
      providerId: provider?._id || null,
      status: "pending",
      moderatedAt: null,
    }, userId);
    return { ok: true, itemId: item._id };
  }
  if (module === "market" && operation === "moderate") return await updateRecord(args.itemId, { status: args.status, moderatedAt: Date.now(), moderatedBy: userId });
  if (module === "market" && operation === "removeItem") return await removeRecord(args.itemId);
  if (module === "bookings" && ["create", "requestService", "createFromPlan", "serviceBooking"].includes(operation)) return createBooking(args, req, user);
  if (module === "bookings" && operation === "mine") { const rows = await records("booking", userId); return { bookings: rows, stats: { total: rows.length, confirmed: rows.filter((r) => r.status === "confirmed").length, spent: rows.reduce((sum, r) => sum + Number(r.totalPrice || 0), 0) } }; }
  if (module === "bookings" && operation === "adminList") return await records("booking");
  if (module === "bookings" && operation === "setStatus") return await updateRecord(args.bookingId, { status: args.status, updatedAt: Date.now() });
  if (module === "bookings" && operation === "setAssignmentStatus") return await updateRecord(args.assignmentId, { status: args.status, completedAt: args.status === "done" ? Date.now() : null });
  if (module === "bookings" && operation === "claim") {
    const booking = (await records("booking")).find((row) => row._id === args.bookingId);
    if (!booking) throw new Error("Buyurtma topilmadi");
    const provider = (await records("provider", userId))[0] || null;
    const existing = (await records("assignment")).find((task) => task.bookingId === booking._id && task.providerId === provider?._id);
    if (!existing) {
      await record("assignment", {
        providerId: provider?._id || null,
        providerUserId: userId,
        bookingId: booking._id,
        bookingReference: booking.reference,
        task: `${booking.city} bo'ylab ${booking.days || 1} kunlik xizmat`,
        role: provider?.direction || "other",
        city: booking.city,
        days: booking.days,
        guests: booking.guests,
        amount: Math.round(Number(booking.totalPrice || 0) * 0.28),
        scheduledFor: Date.parse(booking.startDate) || Date.now(),
        status: "accepted",
      }, userId);
    }
    await updateRecord(booking._id, { status: "confirmed", providerId: provider?._id || null });
    return { ok: true, bookingId: booking._id };
  }
  if (module === "assignments" && operation === "adminList") return await records("assignment");
  if (module === "assignments" && operation === "forBooking") return (await records("assignment")).filter((task) => task.bookingId === args.bookingId);
  if (module === "assignments" && operation === "mine") {
    const provider = (await records("provider", userId))[0] || null;
    if (!provider) return [];
    return (await records("assignment")).filter((task) => task.providerId === provider._id || task.providerUserId === userId);
  }
  if (module === "payments" && operation === "start") return { paid: false, paymentId: randomUUID(), reference: reference("PAY"), amount: 0 };
  if (module === "payments" && operation === "adminList") return await records("payment");
  if (module === "payments" && operation === "mine") return await records("payment", userId);
  if (module === "payments" && operation === "byBooking") return (await records("payment")).filter((row) => row.bookingId === args.bookingId);
  if (module === "payments" && operation === "confirm") return await updateRecord(args.paymentId, { status: "paid", confirmedAt: Date.now() });
  if (module === "payments" && operation === "refund") return await updateRecord(args.paymentId, { status: "refunded", refundedAt: Date.now() });
  if (module === "payments" && operation === "startSubscription") return { paymentId: randomUUID(), reference: reference("SUB"), amount: 0 };
  if (module === "paymentGateway" && operation === "createCheckout") return { configured: false, url: null, message: "Mahalliy rejimda to'lov shlyuzi sozlanmagan." };
  if (module === "reviews" && operation === "adminList") return await records("review");
  if (module === "reviews" && operation === "mine") return await records("review", userId);
  if (module === "reviews" && operation === "recent") {
    const rows = (await records("review")).filter((row) => row.status !== "hidden");
    return Number(args.limit) > 0 ? rows.slice(0, Number(args.limit)) : rows;
  }
  if (module === "reviews" && operation === "forPackage") return (await records("review")).filter((row) => row.packageSlug === args.slug && row.status !== "hidden");
  if (module === "reviews" && operation === "forProvider") return (await records("review")).filter((row) => row.providerId === args.providerId);
  if (module === "reviews" && operation === "create") return await record("review", { ...args, rating: Number(args.rating) || 5, status: "pending", createdAt: Date.now() }, userId);
  if (module === "telegram" && operation === "config") return botConfigView(await loadBotSettings(db));
  if (module === "telegram" && operation === "menuPreview") {
    const direction = PROVIDER_DIRECTIONS.includes(args.direction) ? args.direction : "guide";
    const label = PROVIDER_LABELS[direction];
    return {
      meta: { direction, label },
      screens: [
        { key: "start", title: "MillyTour hamkorlik", body: `${label} yo'nalishi: shartlar, oylik to'lov va ro'yxatdan o'tish.` },
        { key: "cabinet", title: "Kabinet", body: "Profil, obuna holati va to'lovlar tarixi." },
        { key: "orders", title: "Buyurtmalar", body: "Yangi so'rovlar, faol buyurtmalar va ularning holati." },
        { key: "tasks", title: "Vazifalar", body: "Kunlik topshiriqlar: qabul qilish, bajarish, hisobot." },
        { key: "support", title: "Yordam", body: "Operator bilan bog'lanish va hujjatlarni yuklash." },
      ],
    };
  }
  if (module === "telegram" && operation === "events") {
    const rows = await records("telegram_event");
    return Number(args.limit) > 0 ? rows.slice(0, Number(args.limit)) : rows;
  }
  if (module === "telegram" && operation === "linkCode") {
    const settings = await loadBotSettings(db);
    const code = randomUUID().slice(0, 8);
    return {
      code,
      deepLink: `https://t.me/${settings.auth.username}?start=link_${code}`,
      mainDeepLink: `https://t.me/${settings.main.username}?start=link_${code}`,
    };
  }
  if (module === "telegram" && operation === "saveBotTokens") {
    const authUser = await requireUser(req);
    if (authUser.role !== "admin") throw new Error("Bot tokenlarini faqat administrator saqlay oladi");
    const settings = await saveBotSettings(db, args);
    return { ok: true, message: "Tokenlar saqlandi", config: botConfigView(settings) };
  }
  if (module === "telegram" && operation === "registerWebhooks") {
    const authUser = await requireUser(req);
    if (authUser.role !== "admin") throw new Error("Webhook'ni faqat administrator o'rnata oladi");
    const settings = await loadBotSettings(db);
    const results = {};
    for (const bot of BOT_IDS) {
      if (!settings[bot].token) {
        results[bot] = { ok: false, description: "Token sozlanmagan" };
        continue;
      }
      const result = await registerWebhook({
        token: settings[bot].token,
        bot,
        secret: process.env.TELEGRAM_WEBHOOK_SECRET,
        siteUrl: process.env.SITE_URL,
      });
      results[bot] = result.ok ? { ok: true, url: `${(process.env.SITE_URL || "").replace(/\/$/, "")}/api/telegram/${bot}` } : result;
    }
    const registered = Object.values(results).filter((row) => row.ok).length;
    return {
      ok: registered > 0,
      registered,
      results,
      message: registered > 0
        ? `${registered} ta webhook ro'yxatdan o'tdi`
        : "Webhook o'rnatilmadi — HTTPS manzil kerak. Lokal uchun TELEGRAM_POLLING=true qo'ying.",
    };
  }
  if (module === "telegram" && operation === "pollUpdates") {
    const authUser = await requireUser(req);
    if (authUser.role !== "admin") throw new Error("Bot holatini faqat administrator ko'ra oladi");
    const settings = await loadBotSettings(db);
    const bots = BOT_IDS.includes(args.bot) ? [args.bot] : BOT_IDS;
    const results = {};
    for (const bot of bots) {
      const token = settings[bot].token;
      if (!token) {
        results[bot] = { ok: false, description: "Token sozlanmagan", message: "token yo'q" };
        continue;
      }
      const me = await getMe(token);
      const info = await getWebhookInfo(token);
      const webhook = info.result?.url || null;
      if (!me.ok) {
        results[bot] = { ok: false, description: me.description || "Bot API javob bermadi", webhook, message: me.description || "ulanmadi" };
        continue;
      }

      // Webhook o'rnatilgan bo'lsa Telegram `getUpdates` ni 409 bilan rad etadi —
      // shuning uchun faqat holat ko'rsatiladi. Webhook olib tashlansa (yoki
      // `TELEGRAM_POLLING=true` bilan polling boshlansa) xabarlar shu yerdan olinadi.
      let processed = 0;
      let message = webhook ? `webhook o'rnatilgan: ${webhook}` : "xabar yo'q";
      if (!webhook) {
        const fetched = await fetchUpdates(token, Number(args.offset) || 0);
        const updates = fetched.ok && Array.isArray(fetched.result) ? fetched.result : [];
        for (const update of updates) {
          try {
            await handleUpdate({ bot, update, settings, ctx: telegramCtx });
            processed += 1;
          } catch (error) {
            console.error(`[telegram] ${bot}: update xatosi — ${error?.message || error}`);
          }
        }
        message = processed ? `${processed} ta xabar qayta ishlandi` : "yangi xabar yo'q";
      }
      results[bot] = {
        ok: true,
        username: me.result?.username || settings[bot].username,
        webhook,
        pendingUpdates: info.result?.pending_update_count ?? 0,
        lastError: info.result?.last_error_message || null,
        processed,
        message,
      };
    }
    const summary = Object.entries(results).map(([bot, row]) => `${bot}: ${row.message}`).join(" · ");
    return { ok: Object.values(results).some((row) => row.ok), results, message: summary };
  }
  if (module === "telegram" && operation === "sendTestMessage") {
    const settings = await loadBotSettings(db);
    const bot = BOT_IDS.includes(args.bot) ? args.bot : "main";
    const chatId = args.chatId || resolveOwnerChatId(settings);
    if (!settings[bot].token) return { ok: false, message: `${bot} bot tokeni sozlanmagan` };
    if (!chatId) return { ok: false, message: "chatId yoki OWNER_TELEGRAM_ID kerak" };
    const text = args.text || "MillyTour: test xabari — bot ishlayapti ✅";
    const result = await sendMessage(settings[bot].token, chatId, text);
    await record("telegram_event", { kind: "test", target: bot, text, chatId, status: result.ok ? "delivered" : "failed", error: result.ok ? null : result.description });
    return { ok: result.ok, message: result.ok ? "Xabar yuborildi" : result.description };
  }
  if (module === "telegram" && operation === "simulate") {
    const settings = await loadBotSettings(db);
    const bot = BOT_IDS.includes(args.bot) ? args.bot : "main";
    // Haqiqiy tokenlar sozlangan bo'lsa ham admin bot dvigatelini shu yerda
    // sinashi mumkin (Telegram'ga boradigan haqiqiy yangilanishlarga tegmasdan).
    if (!isLocalMode(settings)) {
      const authUser = await requireUser(req);
      if (authUser.role !== "admin") throw new Error("Simulyatsiyani faqat administrator ishga tushira oladi");
    }
    if (args.telegram === false) {
      // Telegram'ga hech narsa yubormasdan faqat javobni ko'rish (test uchun).
      settings[bot] = { ...settings[bot], token: null };
    }
    const update = buildUpdate({
      text: args.text || "/start",
      chatId: Number(args.chatId) || 990000001,
      username: args.username || "local_tester",
      firstName: args.firstName || "Lokal",
      lastName: args.lastName ?? "Foydalanuvchi",
      // `callback` berilsa inline tugma bosilishini taqlid qiladi.
      callback: args.callback || null,
    });
    return await handleUpdate({ bot, update, settings, ctx: telegramCtx });
  }
  if (module === "admin" && operation === "status") {
    const row = await db.get("SELECT COUNT(*) AS count FROM users WHERE role = 'admin'");
    return { isSignedIn: Boolean(user), isAdmin: user?.role === "admin", adminCount: row?.count ?? 0 };
  }
  if (module === "admin" && operation === "claimAdmin") { const authUser = await requireUser(req); await db.run("UPDATE users SET role = 'admin' WHERE id = ?", authUser._id); return { ok: true }; }
  if (module === "admin" && operation === "overview") return await adminOverview();
  if (module === "admin" && operation === "seedDemo") {
    const authUser = await requireUser(req);
    if (authUser.role !== "admin") throw new Error("Demo ma'lumotni faqat administrator yuklay oladi");
    return await seedDemoData(db, { force: args.force === true, adminEmail: authUser.email });
  }
  return { ok: true };
}

app.get("/api/health", (_, res) => res.json({ ok: true, service: "millytour-local-backend", database: "sqlite" }));
app.post("/api/auth/signin", async (req, res) => { try { const provider = String(req.body?.provider || "anonymous"); const email = req.body?.email ? String(req.body.email).toLowerCase() : `${provider}-${randomUUID()}@local.test`; let user = await db.get("SELECT * FROM users WHERE email = ?", email); if (!user) { const id = randomUUID(); await db.run("INSERT INTO users (id,email,name,is_anonymous) VALUES (?, ?, ?, ?)", id, email, req.body?.name || "Local Demo User", provider === "anonymous" ? 1 : 0); user = await db.get("SELECT * FROM users WHERE id = ?", id); } const sessionId = randomUUID(); await db.run("INSERT INTO sessions (id,user_id,created_at,expires_at) VALUES (?, ?, ?, ?)", sessionId, user.id, Date.now(), Date.now() + 7 * 24 * 60 * 60 * 1000); res.cookie("millytour_session", sessionId, cookieOptions(req)); res.json({ ok: true, user: await currentUser({ cookies: { millytour_session: sessionId } }) }); } catch (error) { res.status(400).json({ error: error.message }); } });
app.post("/api/auth/email/request", async (req, res) => {
  // Identifikator sifatida email yoki telefon raqam qabul qilinadi.
  const identifier = String(req.body?.email || "").trim().toLowerCase();
  const isEmail = identifier.includes("@");
  const isPhone = /^[+\d][\d\s()-]{6,}$/.test(identifier);
  if (!identifier || (!isEmail && !isPhone)) return res.status(400).json({ error: "Email yoki telefon raqamni kiriting" });
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const id = randomUUID();
  await db.run("INSERT INTO auth_challenges (id,type,identifier,code,status,created_at,expires_at) VALUES (?, 'email', ?, ?, 'pending', ?, ?)", id, identifier, code, Date.now(), challengeExpiry());
  if (process.env.NODE_ENV !== "production") console.log(`[auth] local OTP for ${identifier}: ${code}`);
  res.json({ challengeId: id, identifier, email: identifier, ...(process.env.SHOW_DEV_OTP === "true" || process.env.NODE_ENV !== "production" ? { devCode: code } : {}) });
});
app.post("/api/auth/email/verify", async (req, res) => {
  const challenge = await db.get("SELECT * FROM auth_challenges WHERE id = ? AND type = 'email' AND expires_at > ?", req.body?.challengeId, Date.now());
  if (!challenge || challenge.code !== String(req.body?.code || "")) return res.status(401).json({ error: "Tasdiqlash kodi noto'g'ri yoki muddati tugagan" });
  const user = await ensureUser({ email: challenge.identifier, name: challenge.identifier.includes("@") ? challenge.identifier.split("@")[0] : undefined });
  await db.run("UPDATE auth_challenges SET status = 'verified', user_id = ? WHERE id = ?", user.id, challenge.id);
  const sessionId = await createSession(user.id, res, req);
  res.json({ ok: true, user: await currentUser({ cookies: { millytour_session: sessionId } }) });
});
app.post("/api/auth/telegram/start", async (_, res) => {
  const id = randomUUID();
  // Tasdiqlash kodini bot o'zi beradi (ism-familiyani so'rab) va bazadagi
  // `code` + `user_id` shu chaqiruvga yoziladi — shuning uchun bu yerda faqat
  // "kutilayotgan" chaqiruv yaratiladi.
  await db.run("INSERT INTO auth_challenges (id,type,identifier,status,created_at,expires_at) VALUES (?, 'telegram', ?, 'pending', ?, ?)", id, id, Date.now(), challengeExpiry());
  const settings = await loadBotSettings(db);
  res.json({
    challengeId: id,
    // Turistlar asosiy botga yo'naltiriladi; `login_<id>` payload'ini ikkala
    // bot ham qabul qiladi, shu sababli zaxira havola ham qaytariladi.
    deepLink: `https://t.me/${settings.main.username}?start=login_${id}`,
    authDeepLink: `https://t.me/${settings.auth.username}?start=login_${id}`,
    expiresAt: challengeExpiry(),
  });
});
// Bot bergan kodni saytda tasdiqlash — shu ism-familiya bilan hisob ochiladi.
app.post("/api/auth/telegram/verify", async (req, res) => {
  const challenge = await db.get(
    "SELECT * FROM auth_challenges WHERE id = ? AND type = 'telegram' AND expires_at > ?",
    req.body?.challengeId,
    Date.now(),
  );
  if (!challenge || !challenge.code || challenge.code !== String(req.body?.code || "").trim()) {
    return res.status(401).json({ error: "Kod noto'g'ri yoki muddati tugagan" });
  }
  if (!challenge.user_id) {
    return res.status(409).json({ error: "Botda ism-familiyani kiriting va kodni oling" });
  }
  await db.run("UPDATE auth_challenges SET status = 'verified' WHERE id = ?", challenge.id);
  const sessionId = await createSession(challenge.user_id, res, req);
  res.json({ ok: true, user: await currentUser({ cookies: { millytour_session: sessionId } }) });
});
app.get("/api/auth/telegram/status", async (req, res) => {
  const challenge = await db.get("SELECT * FROM auth_challenges WHERE id = ? AND type = 'telegram'", req.query.challengeId);
  if (!challenge || challenge.expires_at < Date.now()) return res.json({ status: "expired" });
  if (challenge.status !== "verified" || !challenge.user_id) return res.json({ status: "pending" });
  const sessionId = await createSession(challenge.user_id, res, req);
  res.json({ status: "verified", user: await currentUser({ cookies: { millytour_session: sessionId } }) });
});
app.post("/api/auth/signout", async (req, res) => { if (req.cookies.millytour_session) await db.run("DELETE FROM sessions WHERE id = ?", req.cookies.millytour_session); res.clearCookie("millytour_session", cookieOptions(req)); res.json({ ok: true }); });
app.get("/api/auth/me", async (req, res) => res.json({ user: await currentUser(req) }));
// Qo'llab-quvvatlash suhbati — faqat kirgan foydalanuvchi uchun.
app.get("/api/support/thread", async (req, res) => {
  try {
    const user = await requireUser(req);
    res.json({ messages: await supportThread(user._id), name: user.name || null });
  } catch (error) {
    res.status(error.message === "Authentication required" ? 401 : 400).json({ error: error.message || "Request failed" });
  }
});
app.post("/api/support/send", async (req, res) => {
  try {
    const user = await requireUser(req);
    const message = await supportSend(user, req.body || {});
    res.json({ ok: true, message });
  } catch (error) {
    res.status(error.message === "Authentication required" ? 401 : 400).json({ error: error.message || "Request failed" });
  }
});
app.post("/api/rest/:module/:operation", async (req, res) => { try { res.json({ data: await dispatch(req.params.module, req.params.operation, req.body || {}, req) }); } catch (error) { res.status(error.message === "Authentication required" ? 401 : 400).json({ error: error.message || "Request failed" }); } });

/**
 * Telegram webhook: har uch bot shu manzilga update yuboradi
 * (`/api/telegram/main`, `/api/telegram/auth`, `/api/telegram/stats`).
 * Ishlov berish mantig'i `telegram.mjs` da — polling bilan bir xil.
 */
async function telegramWebhook(req, res) {
  const bot = BOT_IDS.includes(req.params.bot) ? req.params.bot : "main";
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (secret && req.get("x-telegram-bot-api-secret-token") !== secret) {
    return res.status(401).json({ ok: false, error: "invalid secret token" });
  }
  const settings = await loadBotSettings(db);
  const result = await handleUpdate({ bot, update: req.body, settings, ctx: telegramCtx });
  res.json({ ok: result.ok !== false, kind: result.kind || null, sent: result.sent || false, reason: result.reason || null });
}
app.post("/api/telegram/:bot", telegramWebhook);
app.post("/api/payments/webhook", async (req, res) => { const secret = process.env.DODO_WEBHOOK_SECRET; if (secret) { const supplied = req.get("x-dodo-signature") || ""; const expected = createHmac("sha256", secret).update(JSON.stringify(req.body)).digest("hex"); if (supplied.length !== expected.length || !timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))) return res.status(401).send("invalid signature"); } res.json({ ok: true }); });
if (path.resolve(process.argv[1] || "") === fileURLToPath(import.meta.url)) {
  // Botlar lokal/serverda qanday ishlaydi (`telegram.polling` sozlamasi —
  // admin panel, `npm run bots -- --polling=...` yoki `TELEGRAM_POLLING` env):
  //   - `auto`     → webhook bor bo'lsa unga tegilmaydi, polling navbat kutadi;
  //   - `takeover` → mavjud webhook olib tashlanadi va polling egallaydi (lokal dev);
  //   - `off`      → polling yo'q, faqat webhook (productionda tavsiya).
  const bootSettings = await loadBotSettings(db);
  if (bootSettings.polling === "off") {
    console.log("[telegram] polling o'chirilgan — faqat webhook rejimi");
  } else {
    startPolling({
      getSettings: () => loadBotSettings(db),
      ctx: telegramCtx,
      takeOver: bootSettings.polling === "takeover",
      onEvent: (message) => console.log(`[telegram] ${message}`),
    });
  }
  app.listen(port, "127.0.0.1", () => console.log(`Local backend listening on http://127.0.0.1:${port}`));
}
export default app;
