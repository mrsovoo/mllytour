import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import fs from "node:fs/promises";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env.local") });
dotenv.config({ path: path.join(__dirname, "..", ".env") });
const app = express();
const port = Number(process.env.PORT || 4000);
const databasePath = path.join(__dirname, "..", "data", "millytour.db");

await fs.mkdir(path.dirname(databasePath), { recursive: true });
const db = await open({ filename: databasePath, driver: sqlite3.Database });
await db.exec(`
  PRAGMA foreign_keys = ON;
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, email TEXT UNIQUE, name TEXT, image TEXT, is_anonymous INTEGER DEFAULT 0,
    role TEXT DEFAULT 'user', phone TEXT, country TEXT, language TEXT DEFAULT 'uz',
    telegram_id INTEGER, telegram_username TEXT, interests TEXT DEFAULT '[]', onboarded_at INTEGER
  );
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS auth_challenges (
    id TEXT PRIMARY KEY, type TEXT NOT NULL, identifier TEXT NOT NULL,
    code TEXT, status TEXT NOT NULL DEFAULT 'pending', user_id TEXT,
    created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
  );
  CREATE TABLE IF NOT EXISTS records (
    id TEXT PRIMARY KEY, kind TEXT NOT NULL, user_id TEXT, data TEXT NOT NULL, created_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
  );
  CREATE INDEX IF NOT EXISTS records_kind_idx ON records(kind);
  CREATE INDEX IF NOT EXISTS records_user_idx ON records(user_id);
`);
try {
  await db.exec("ALTER TABLE sessions ADD COLUMN expires_at INTEGER NOT NULL DEFAULT 0");
} catch (error) {
  if (!String(error?.message).includes("duplicate column name")) throw error;
}
await db.run("UPDATE sessions SET expires_at = ? WHERE expires_at = 0", Date.now() + 7 * 24 * 60 * 60 * 1000);

app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));

function json(value) { try { return JSON.parse(value); } catch { return value; } }
function cookieOptions() { return { httpOnly: true, sameSite: "lax", secure: false, maxAge: 7 * 24 * 60 * 60 * 1000 }; }
function reference(prefix = "MT") { return `${prefix}-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${randomUUID().slice(0, 6).toUpperCase()}`; }
function challengeExpiry() { return Date.now() + 10 * 60 * 1000; }

async function createSession(userId, res) {
  const sessionId = randomUUID();
  await db.run("INSERT INTO sessions (id,user_id,created_at,expires_at) VALUES (?, ?, ?, ?)", sessionId, userId, Date.now(), Date.now() + 7 * 24 * 60 * 60 * 1000);
  res.cookie("millytour_session", sessionId, cookieOptions());
  return sessionId;
}

async function userByEmail(email) {
  return db.get("SELECT * FROM users WHERE email = ?", email.toLowerCase());
}

async function ensureUser({ email, name, isAnonymous = false, telegramId, telegramUsername }) {
  let user = await userByEmail(email);
  if (!user) {
    const id = randomUUID();
    await db.run("INSERT INTO users (id,email,name,is_anonymous,telegram_id,telegram_username) VALUES (?, ?, ?, ?, ?, ?)", id, email.toLowerCase(), name || "Millytour sayohatchisi", isAnonymous ? 1 : 0, telegramId || null, telegramUsername || null);
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
async function records(kind, userId) { const rows = userId === undefined ? await db.all("SELECT * FROM records WHERE kind = ? ORDER BY created_at DESC", kind) : await db.all("SELECT * FROM records WHERE kind = ? AND user_id = ? ORDER BY created_at DESC", kind, userId); return rows.map((row) => ({ _id: row.id, ...json(row.data) })); }
/** Mijozlar fikri reaksiyasi: faqat 👍 / 👎 bo'ladi. */
function reactionKind(row) { return row.kind === "dislike" ? "dislike" : "like"; }
/** Eski `review_like` yozuvlari ham "like" sifatida o'qiladi (moslik uchun). */
async function allReactionRows() { const rows = await records("review_reaction"); const legacy = await records("review_like"); return [...rows, ...legacy.map((row) => ({ ...row, kind: "like" }))]; }

function packageRow(slug) { return { key: `catalog:${slug}`, dbId: null, slug, title: slug.replaceAll("-", " "), summary: "O'zbekiston bo'ylab sayohat dasturi", category: "historical", city: "Samarqand", region: "Samarqand", days: 3, nights: 2, priceFrom: 250, rating: 4.8, reviews: 0, groupSize: "2-12 kishi", nextDeparture: "Har hafta", languages: ["uz", "ru", "en"], includes: [], highlights: [], image: "", alt: slug, status: "published", featured: false, source: "catalog" }; }
function buildPlans(answers = {}) { const city = typeof answers.city === "string" ? answers.city : "Samarqand"; const days = Math.max(1, Number(answers.days) || 3); const travelers = Math.max(1, Number(answers.travelers) || 2); const budget = Math.max(80, Number(answers.budget) || 800); return ["Komfort", "Tejamkor"].map((label, index) => { const total = Math.round(Math.min(budget, (index ? 75 : 125) * days * travelers)); return { title: `${label} ${city} sayohati`, summary: `${days} kunlik ${city} dasturi · ${label.toLowerCase()} variant`, cities: [city], days: Array.from({ length: days }, (_, day) => ({ day: day + 1, city, title: `${city} bo'ylab kun ${day + 1}`, lodging: index ? "3* mehmonxona" : "4* mehmonxona", spend: Math.round(total / days), items: [{ time: "09:00", title: "Shahar bo'ylab sayohat", note: "Mahalliy gid bilan", kind: "meros" }] })), estimate: { total, perPerson: Math.round(total / travelers), currency: "USD", withinBudget: total <= budget, breakdown: [{ label: "Turar joy va xizmatlar", amount: total }] }, tips: ["Qulay oyoq kiyim kiying"], pack: ["Pasport", "Quyoshdan himoya"] }; }); }

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
function telegramConfig() { const main = process.env.TELEGRAM_MAIN_BOT_TOKEN; const auth = process.env.TELEGRAM_AUTH_BOT_TOKEN; return { configured: { main: Boolean(main), auth: Boolean(auth) }, envKeys: { main: "TELEGRAM_MAIN_BOT_TOKEN", auth: "TELEGRAM_AUTH_BOT_TOKEN" }, masked: { main: main ? `••••${main.slice(-4)}` : null, auth: auth ? `••••${auth.slice(-4)}` : null }, usernames: { main: process.env.TELEGRAM_MAIN_BOT_USERNAME || "", auth: process.env.TELEGRAM_AUTH_BOT_USERNAME || "" }, authDeepLink: "", mainDeepLink: "", miniAppUrl: null }; }

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
  if (module === "packages" && ["list", "recommended", "adminList"].includes(operation)) return [];
  if (module === "packages" && operation === "bySlug") return packageRow(args.slug);
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
  if (module === "providers" && operation === "metrics") return { provider: null, open: 0, assigned: 0, completed: 0, tasks: [], upcomingTasks: [], taskEarnings: 0, revenue: 0, commission: 0, payout: 0 };
  if (module === "providers" && operation === "register") return await record("provider", { ...args, status: "pending", subscription: "trial", rating: 0, ratingCount: 0, completedOrders: 0, walletBalance: 0, createdAt: Date.now() }, userId);
  if (module === "providers" && operation === "submitLead") { await record("lead", { ...args, handled: false, createdAt: Date.now() }, userId); return { ok: true, message: "So'rov qabul qilindi" }; }
  if (module === "providers" && operation === "listLeads") return await records("lead");
  if (module === "providers" && ["updateProfile", "reportVehicle", "toggleUnavailableDate", "setStatus", "setSubscription", "handleLead"].includes(operation)) return { ok: true };
  if (module === "events" && operation === "list") return [];
  if (module === "market" && ["approved", "pending", "myItems"].includes(operation)) return [];
  if (module === "market" && ["addItem", "moderate", "removeItem"].includes(operation)) return { ok: true, itemId: randomUUID() };
  if (module === "bookings" && ["create", "requestService", "createFromPlan", "serviceBooking"].includes(operation)) return createBooking(args, req, user);
  if (module === "bookings" && operation === "mine") { const rows = await records("booking", userId); return { bookings: rows, stats: { total: rows.length, confirmed: rows.filter((r) => r.status === "confirmed").length, spent: rows.reduce((sum, r) => sum + Number(r.totalPrice || 0), 0) } }; }
  if (module === "bookings" && operation === "adminList") return await records("booking");
  if (module === "bookings" && ["setStatus", "setAssignmentStatus", "claim"].includes(operation)) return { ok: true };
  if (module === "assignments" && ["forBooking", "mine", "adminList"].includes(operation)) return [];
  if (module === "payments" && operation === "start") return { paid: false, paymentId: randomUUID(), reference: reference("PAY"), amount: 0 };
  if (module === "payments" && ["adminList", "mine", "byBooking"].includes(operation)) return [];
  if (module === "payments" && ["confirm", "refund"].includes(operation)) return { ok: true, alreadyPaid: false };
  if (module === "payments" && operation === "startSubscription") return { paymentId: randomUUID(), reference: reference("SUB"), amount: 0 };
  if (module === "paymentGateway" && operation === "createCheckout") return { configured: false, url: null, message: "Mahalliy rejimda to'lov shlyuzi sozlanmagan." };
  if (module === "reviews" && ["mine", "recent", "adminList", "forPackage", "forProvider"].includes(operation)) return [];
  if (module === "reviews" && operation === "create") return { reviewId: randomUUID() };
  if (module === "telegram" && operation === "config") return telegramConfig();
  if (module === "telegram" && operation === "menuPreview") return { screens: [], meta: {} };
  if (module === "telegram" && operation === "events") return [];
  if (module === "telegram" && operation === "linkCode") return { code: randomUUID().slice(0, 8), deepLink: "", mainDeepLink: "" };
  if (module === "telegram" && ["saveBotTokens", "registerWebhooks", "pollUpdates", "sendTestMessage"].includes(operation)) return { ok: true, message: "Local rejim" };
  if (module === "admin" && operation === "status") return { isSignedIn: Boolean(user), isAdmin: user?.role === "admin", adminCount: 0 };
  if (module === "admin" && operation === "claimAdmin") { const authUser = await requireUser(req); await db.run("UPDATE users SET role = 'admin' WHERE id = ?", authUser._id); return { ok: true }; }
  if (module === "admin" && operation === "overview") return { totals: {}, byDirection: [], series: [], recentBookings: [], topProviders: [] };
  if (module === "admin" && operation === "seedDemo") return { seeded: false, reason: "Local katalog statik frontend'dan olinadi" };
  return { ok: true };
}

app.get("/api/health", (_, res) => res.json({ ok: true, service: "millytour-local-backend", database: "sqlite" }));
app.post("/api/auth/signin", async (req, res) => { try { const provider = String(req.body?.provider || "anonymous"); const email = req.body?.email ? String(req.body.email).toLowerCase() : `${provider}-${randomUUID()}@local.test`; let user = await db.get("SELECT * FROM users WHERE email = ?", email); if (!user) { const id = randomUUID(); await db.run("INSERT INTO users (id,email,name,is_anonymous) VALUES (?, ?, ?, ?)", id, email, req.body?.name || "Local Demo User", provider === "anonymous" ? 1 : 0); user = await db.get("SELECT * FROM users WHERE id = ?", id); } const sessionId = randomUUID(); await db.run("INSERT INTO sessions (id,user_id,created_at,expires_at) VALUES (?, ?, ?, ?)", sessionId, user.id, Date.now(), Date.now() + 7 * 24 * 60 * 60 * 1000); res.cookie("millytour_session", sessionId, cookieOptions()); res.json({ ok: true, user: await currentUser({ cookies: { millytour_session: sessionId } }) }); } catch (error) { res.status(400).json({ error: error.message }); } });
app.post("/api/auth/email/request", async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  if (!email || !email.includes("@")) return res.status(400).json({ error: "Email manzili noto'g'ri" });
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const id = randomUUID();
  await db.run("INSERT INTO auth_challenges (id,type,identifier,code,status,created_at,expires_at) VALUES (?, 'email', ?, ?, 'pending', ?, ?)", id, email, code, Date.now(), challengeExpiry());
  if (process.env.NODE_ENV !== "production") console.log(`[auth] local email OTP for ${email}: ${code}`);
  res.json({ challengeId: id, email, ...(process.env.SHOW_DEV_OTP === "true" || process.env.NODE_ENV !== "production" ? { devCode: code } : {}) });
});
app.post("/api/auth/email/verify", async (req, res) => {
  const challenge = await db.get("SELECT * FROM auth_challenges WHERE id = ? AND type = 'email' AND expires_at > ?", req.body?.challengeId, Date.now());
  if (!challenge || challenge.code !== String(req.body?.code || "")) return res.status(401).json({ error: "Tasdiqlash kodi noto'g'ri yoki muddati tugagan" });
  const user = await ensureUser({ email: challenge.identifier, name: challenge.identifier.split("@")[0] });
  await db.run("UPDATE auth_challenges SET status = 'verified', user_id = ? WHERE id = ?", user.id, challenge.id);
  const sessionId = await createSession(user.id, res);
  res.json({ ok: true, user: await currentUser({ cookies: { millytour_session: sessionId } }) });
});
app.post("/api/auth/telegram/start", async (_, res) => {
  const id = randomUUID();
  await db.run("INSERT INTO auth_challenges (id,type,identifier,status,created_at,expires_at) VALUES (?, 'telegram', ?, 'pending', ?, ?)", id, id, Date.now(), challengeExpiry());
  const username = process.env.TELEGRAM_MAIN_BOT_USERNAME || "millytour_bot";
  res.json({ challengeId: id, deepLink: `https://t.me/${username}?start=login_${id}`, expiresAt: challengeExpiry() });
});
app.get("/api/auth/telegram/status", async (req, res) => {
  const challenge = await db.get("SELECT * FROM auth_challenges WHERE id = ? AND type = 'telegram'", req.query.challengeId);
  if (!challenge || challenge.expires_at < Date.now()) return res.json({ status: "expired" });
  if (challenge.status !== "verified" || !challenge.user_id) return res.json({ status: "pending" });
  const sessionId = await createSession(challenge.user_id, res);
  res.json({ status: "verified", user: await currentUser({ cookies: { millytour_session: sessionId } }) });
});
app.post("/api/auth/signout", async (req, res) => { if (req.cookies.millytour_session) await db.run("DELETE FROM sessions WHERE id = ?", req.cookies.millytour_session); res.clearCookie("millytour_session"); res.json({ ok: true }); });
app.get("/api/auth/me", async (req, res) => res.json({ user: await currentUser(req) }));
app.post("/api/rest/:module/:operation", async (req, res) => { try { res.json({ data: await dispatch(req.params.module, req.params.operation, req.body || {}, req) }); } catch (error) { res.status(error.message === "Authentication required" ? 401 : 400).json({ error: error.message || "Request failed" }); } });

async function telegramWebhook(req, res) {
  const bot = req.params.bot;
  const update = req.body;
  const message = update?.message?.text || "";
  const chatId = update?.message?.chat?.id;
  const telegramUser = update?.message?.from;
  const token = bot === "auth" ? process.env.TELEGRAM_AUTH_BOT_TOKEN : bot === "stats" ? process.env.TELEGRAM_STATS_BOT_TOKEN : process.env.TELEGRAM_MAIN_BOT_TOKEN;
  const startPayload = message.match(/^\/start\s+login_([\w-]+)/)?.[1];
  let reply = "Millytour bot: xabaringiz qabul qilindi.";
  if (startPayload && telegramUser) {
    const challenge = await db.get("SELECT * FROM auth_challenges WHERE id = ? AND type = 'telegram' AND expires_at > ?", startPayload, Date.now());
    if (challenge) {
      const user = await ensureUser({ email: `telegram-${telegramUser.id}@telegram.local`, name: [telegramUser.first_name, telegramUser.last_name].filter(Boolean).join(" "), telegramId: telegramUser.id, telegramUsername: telegramUser.username });
      await db.run("UPDATE auth_challenges SET status = 'verified', user_id = ? WHERE id = ?", user.id, challenge.id);
      reply = "Millytour: hisobingiz tasdiqlandi. Platformaga qaytishingiz mumkin.";
    }
  } else if (bot === "main" && telegramUser) {
    const user = await ensureUser({ email: `telegram-${telegramUser.id}@telegram.local`, name: [telegramUser.first_name, telegramUser.last_name].filter(Boolean).join(" "), telegramId: telegramUser.id, telegramUsername: telegramUser.username });
    const bookings = await records("booking", user.id);
    reply = message === "/orders" ? (bookings.length ? bookings.slice(0, 5).map((item) => `${item.reference}: ${item.status || "new"} · ${item.city || ""}`).join("\n") : "Sizda hali buyurtmalar yo'q.") : "Millytour: /orders — buyurtmalarni ko'rish, /help — yordam.";
  }
  if (token && chatId) await fetch(`https://api.telegram.org/bot${token}/sendMessage`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chat_id: chatId, text: reply }) });
  res.send("ok");
}
app.post("/api/telegram/:bot", telegramWebhook);
app.post("/api/payments/webhook", async (req, res) => { const secret = process.env.DODO_WEBHOOK_SECRET; if (secret) { const supplied = req.get("x-dodo-signature") || ""; const expected = createHmac("sha256", secret).update(JSON.stringify(req.body)).digest("hex"); if (supplied.length !== expected.length || !timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))) return res.status(401).send("invalid signature"); } res.json({ ok: true }); });

// ═══════════════════════════════════════════════════════════════
// ADMIN PANEL — username/password auth (separate from user auth)
// ═══════════════════════════════════════════════════════════════
function adminConfig() {
  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "admin123";
  return { username, password };
}

function adminCookieOptions() {
  return { httpOnly: true, sameSite: "lax", secure: false, maxAge: 7 * 24 * 60 * 60 * 1000 };
}

async function currentAdmin(req) {
  const sessionId = req.cookies?.millytour_admin_session;
  if (!sessionId) return null;
  return await db.get("SELECT * FROM admin_sessions WHERE id = ? AND expires_at > ?", sessionId, Date.now()) || null;
}

async function requireAdmin(req, res) {
  const admin = await currentAdmin(req);
  if (!admin) {
    res.status(401).json({ error: "Admin authentication required" });
    return null;
  }
  return admin;
}

app.post("/api/admin/login", async (req, res) => {
  const { username, password } = req.body || {};
  const config = adminConfig();
  if (username !== config.username || password !== config.password) {
    return res.status(401).json({ error: "Foydalanuvchi yoki parol noto'g'ri" });
  }
  const sessionId = randomUUID();
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
  await db.run("INSERT INTO admin_sessions (id, username, created_at, expires_at) VALUES (?, ?, ?, ?)", sessionId, config.username, Date.now(), expiresAt);
  res.cookie("millytour_admin_session", sessionId, adminCookieOptions());
  res.json({ ok: true, admin: { username: config.username, role: "owner" } });
});

app.post("/api/admin/logout", (req, res) => {
  const sessionId = req.cookies?.millytour_admin_session;
  if (sessionId) {
    db.run("DELETE FROM admin_sessions WHERE id = ?", sessionId);
  }
  res.clearCookie("millytour_admin_session");
  res.json({ ok: true });
});

app.get("/api/admin/me", async (req, res) => {
  const admin = await currentAdmin(req);
  if (!admin) return res.json({ admin: null });
  res.json({ admin: { username: admin.username, role: admin.role } });
});

app.get("/api/admin/stats", async (req, res) => {
  if (!(await requireAdmin(req, res))) return;
  const users = await db.get("SELECT COUNT(*) as count FROM users");
  const providers = await db.get("SELECT COUNT(*) as count FROM records WHERE kind = 'provider'");
  const bookings = await db.get("SELECT COUNT(*) as count FROM records WHERE kind = 'booking'");
  const pendingProviders = await db.get("SELECT COUNT(*) as count FROM records WHERE kind = 'provider' AND json_extract(data, '$.status') = 'pending'");
  const reviews = await db.get("SELECT COUNT(*) as count FROM records WHERE kind = 'review_reaction'");
  res.json({
    data: {
      users: users.count,
      providers: providers.count,
      bookings: bookings.count,
      pendingProviders: pendingProviders.count,
      reviews: reviews.count,
      gross: 0,
      commission: 0,
      subscriptionRevenue: 0,
      botEvents: 0,
    },
  });
});

app.get("/api/admin/users", async (req, res) => {
  if (!(await requireAdmin(req, res))) return;
  const users = await db.all("SELECT id, email, name, is_anonymous, role, phone, country, language, telegram_id, telegram_username, interests, onboarded_at, created_at FROM users ORDER BY created_at DESC LIMIT 50");
  res.json({ data: users });
});

app.post("/api/admin/users/:id/role", async (req, res) => {
  if (!(await requireAdmin(req, res))) return;
  const { id } = req.params;
  const { role } = req.body;
  if (!["user", "admin", "owner"].includes(role)) {
    return res.status(400).json({ error: "Noto'g'ri rol" });
  }
  db.run("UPDATE users SET role = ? WHERE id = ?", role, id);
  res.json({ ok: true });
});

app.post("/api/admin/users/:id/delete", async (req, res) => {
  if (!(await requireAdmin(req, res))) return;
  const { id } = req.params;
  db.run("DELETE FROM sessions WHERE user_id = ?", id);
  db.run("DELETE FROM auth_challenges WHERE user_id = ?", id);
  db.run("DELETE FROM records WHERE user_id = ?", id);
  db.run("DELETE FROM users WHERE id = ?", id);
  res.json({ ok: true });
});

// ═══════════════════════════════════════════════════════════════
// PARTNER / PROVIDER MANAGEMENT
// ═══════════════════════════════════════════════════════════════
app.get("/api/admin/providers", async (req, res) => {
  if (!(await requireAdmin(req, res))) return;
  const { status, direction, city } = req.query;
  let query = "SELECT id, kind, user_id, data, created_at FROM records WHERE kind = 'provider'";
  const params = [];
  if (status) { query += " AND json_extract(data, '$.status') = ?"; params.push(status); }
  if (direction) { query += " AND json_extract(data, '$.direction') = ?"; params.push(direction); }
  if (city) { query += " AND json_extract(data, '$.city') = ?"; params.push(city); }
  query += " ORDER BY created_at DESC LIMIT 100";
  const rows = await db.all(query, ...params);
  const providers = rows.map(row => ({ ...json(row.data), _id: row.id, userId: row.user_id, createdAt: row.created_at }));
  res.json({ data: providers });
});

app.post("/api/admin/providers/:id/status", async (req, res) => {
  if (!(await requireAdmin(req, res))) return;
  const { id } = req.params;
  const { status } = req.body;
  if (!["pending", "approved", "paused", "rejected"].includes(status)) {
    return res.status(400).json({ error: "Noto'g'ri holat" });
  }
  const row = await db.get("SELECT data FROM records WHERE id = ? AND kind = 'provider'", id);
  if (!row) return res.status(404).json({ error: "Hamkor topilmadi" });
  const data = { ...json(row.data), status };
  db.run("UPDATE records SET data = ? WHERE id = ?", JSON.stringify(data), id);
  res.json({ ok: true });
});

app.post("/api/admin/providers/:id/subscription", async (req, res) => {
  if (!(await requireAdmin(req, res))) return;
  const { id } = req.params;
  const { subscription, months } = req.body;
  const row = await db.get("SELECT data FROM records WHERE id = ? AND kind = 'provider'", id);
  if (!row) return res.status(404).json({ error: "Hamkor topilmadi" });
  const data = { ...json(row.data), subscription, subscriptionUntil: Date.now() + (months || 1) * 30 * 24 * 60 * 60 * 1000 };
  db.run("UPDATE records SET data = ? WHERE id = ?", JSON.stringify(data), id);
  res.json({ ok: true });
});

// ═══════════════════════════════════════════════════════════════
// HOTEL MANAGEMENT
// ═══════════════════════════════════════════════════════════════
app.get("/api/admin/hotels", async (req, res) => {
  if (!(await requireAdmin(req, res))) return;
  const { status, city } = req.query;
  let query = "SELECT id, kind, user_id, data, created_at FROM records WHERE kind = 'provider' AND json_extract(data, '$.direction') = 'hotel'";
  const params = [];
  if (status) { query += " AND json_extract(data, '$.status') = ?"; params.push(status); }
  if (city) { query += " AND json_extract(data, '$.city') = ?"; params.push(city); }
  query += " ORDER BY created_at DESC LIMIT 100";
  const rows = await db.all(query, ...params);
  const hotels = rows.map(row => ({ ...json(row.data), _id: row.id, userId: row.user_id, createdAt: row.created_at }));
  res.json({ data: hotels });
});

app.post("/api/admin/hotels/:id/status", async (req, res) => {
  if (!(await requireAdmin(req, res))) return;
  const { id } = req.params;
  const { status } = req.body;
  if (!["pending", "approved", "paused", "rejected"].includes(status)) {
    return res.status(400).json({ error: "Noto'g'ri holat" });
  }
  const row = await db.get("SELECT data FROM records WHERE id = ? AND kind = 'provider'", id);
  if (!row) return res.status(404).json({ error: "Mehmonxona topilmadi" });
  const data = { ...json(row.data), status };
  db.run("UPDATE records SET data = ? WHERE id = ?", JSON.stringify(data), id);
  res.json({ ok: true });
});

// ═══════════════════════════════════════════════════════════════
// RESTAURANT MANAGEMENT
// ═══════════════════════════════════════════════════════════════
app.get("/api/admin/restaurants", async (req, res) => {
  if (!(await requireAdmin(req, res))) return;
  const { status, city } = req.query;
  let query = "SELECT id, kind, user_id, data, created_at FROM records WHERE kind = 'provider' AND json_extract(data, '$.direction') = 'restaurant'";
  const params = [];
  if (status) { query += " AND json_extract(data, '$.status') = ?"; params.push(status); }
  if (city) { query += " AND json_extract(data, '$.city') = ?"; params.push(city); }
  query += " ORDER BY created_at DESC LIMIT 100";
  const rows = await db.all(query, ...params);
  const restaurants = rows.map(row => ({ ...json(row.data), _id: row.id, userId: row.user_id, createdAt: row.created_at }));
  res.json({ data: restaurants });
});

app.post("/api/admin/restaurants/:id/status", async (req, res) => {
  if (!(await requireAdmin(req, res))) return;
  const { id } = req.params;
  const { status } = req.body;
  if (!["pending", "approved", "paused", "rejected"].includes(status)) {
    return res.status(400).json({ error: "Noto'g'ri holat" });
  }
  const row = await db.get("SELECT data FROM records WHERE id = ? AND kind = 'provider'", id);
  if (!row) return res.status(404).json({ error: "Restoran topilmadi" });
  const data = { ...json(row.data), status };
  db.run("UPDATE records SET data = ? WHERE id = ?", JSON.stringify(data), id);
  res.json({ ok: true });
});

// ═══════════════════════════════════════════════════════════════
// DIRECTION MANAGEMENT (all providers by type)
// ═══════════════════════════════════════════════════════════════
app.get("/api/admin/directions/:direction", async (req, res) => {
  if (!(await requireAdmin(req, res))) return;
  const { direction } = req.params;
  const validDirections = ["hotel", "transfer", "guide", "restaurant", "translator", "photographer", "artisan", "other"];
  if (!validDirections.includes(direction)) {
    return res.status(400).json({ error: "Noto'g'ri yo'nalish" });
  }
  const { status } = req.query;
  let query = "SELECT id, kind, user_id, data, created_at FROM records WHERE kind = 'provider' AND json_extract(data, '$.direction') = ?";
  const params = [direction];
  if (status) { query += " AND json_extract(data, '$.status') = ?"; params.push(status); }
  query += " ORDER BY created_at DESC LIMIT 100";
  const rows = await db.all(query, ...params);
  const items = rows.map(row => ({ ...json(row.data), _id: row.id, userId: row.user_id, createdAt: row.created_at }));
  res.json({ data: items });
});

app.post("/api/admin/directions/:direction/:id/status", async (req, res) => {
  if (!(await requireAdmin(req, res))) return;
  const { direction, id } = req.params;
  const { status } = req.body;
  if (!["pending", "approved", "paused", "rejected"].includes(status)) {
    return res.status(400).json({ error: "Noto'g'ri holat" });
  }
  const row = await db.get("SELECT data FROM records WHERE id = ? AND kind = 'provider'", id);
  if (!row) return res.status(404).json({ error: "Topilmadi" });
  const data = { ...json(row.data), status };
  db.run("UPDATE records SET data = ? WHERE id = ?", JSON.stringify(data), id);
  res.json({ ok: true });
});

app.post("/api/admin/directions/:direction/:id", async (req, res) => {
  if (!(await requireAdmin(req, res))) return;
  const { direction } = req.params;
  const { businessName, phone, city, contactName, telegramUsername, about } = req.body || {};
  const id = randomUUID();
  const data = {
    businessName, phone, city, contactName, telegramUsername, about,
    direction, status: "pending", subscription: "trial", rating: 0, ratingCount: 0,
    completedOrders: 0, walletBalance: 0, createdAt: Date.now(),
  };
  db.run("INSERT INTO records (id, kind, user_id, data, created_at) VALUES (?, 'provider', ?, ?, ?)", id, null, JSON.stringify(data), Date.now());
  res.json({ ok: true, data });
});

app.post("/api/admin/directions/:direction/:id/delete", async (req, res) => {
  if (!(await requireAdmin(req, res))) return;
  const { id } = req.params;
  db.run("DELETE FROM records WHERE id = ? AND kind = 'provider'", id);
  res.json({ ok: true });
});

// Create admin_sessions table
await db.exec(`
  CREATE TABLE IF NOT EXISTS admin_sessions (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    role TEXT DEFAULT 'owner',
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL
  );
`);
try {
  await db.exec("ALTER TABLE users ADD COLUMN created_at INTEGER NOT NULL DEFAULT 0");
} catch (error) {
  if (!String(error?.message).includes("duplicate column name")) throw error;
}

app.post("/api/payments/webhook", async (req, res) => { const secret = process.env.DODO_WEBHOOK_SECRET; if (secret) { const supplied = req.get("x-dodo-signature") || ""; const expected = createHmac("sha256", secret).update(JSON.stringify(req.body)).digest("hex"); if (supplied.length !== expected.length || !timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))) return res.status(401).send("invalid signature"); } res.json({ ok: true }); });
if (path.resolve(process.argv[1] || "") === fileURLToPath(import.meta.url)) {
  app.listen(port, "127.0.0.1", () => console.log(`Local backend listening on http://127.0.0.1:${port}`));
}
export default app;
