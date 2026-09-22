#!/usr/bin/env node
/**
 * Demo ma'lumotlarni bazaga yozadi.
 *
 *   npm run seed                       # bazada demo ma'lumot bo'lsa tegmaydi
 *   npm run seed -- --reset            # demo ma'lumotni qaytadan yozadi
 *   npm run seed -- --admin=me@site.uz # super admin emailini o'zgartirish
 *
 * Diqqat: `--force` ishlatilmaydi, chunki npm uni o'zining global flagi deb
 * o'qib yuboradi. Moslik uchun `FORCE=true` env ham qabul qilinadi.
 *
 * Yangi serverga deploy qilgandan keyin bir marta ishga tushiriladi, chunki
 * `backend/data/*.db` git'ga tushmaydi (gitignore) va serverda bo'sh baza
 * yaratiladi.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { databasePath, openDatabase } from "../server/schema.mjs";
import { DEFAULT_ADMIN_EMAIL, seedDemoData } from "../server/seed.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendDir = path.resolve(__dirname, "..");
const rootDir = path.resolve(backendDir, "..");

// `.env*` repo ildizida turadi (server ham, Vite ham shu yerdan o'qiydi).
dotenv.config({ path: path.join(rootDir, ".env.local") });
dotenv.config({ path: path.join(rootDir, ".env") });

const argv = process.argv.slice(2);
const force =
  argv.includes("--reset") ||
  argv.includes("--force") ||
  process.env.npm_config_force === "true" ||
  process.env.FORCE === "true";
const adminArg = process.argv.find((arg) => arg.startsWith("--admin="))?.slice(8);
const adminEmail = adminArg || process.env.SEED_ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL;
const databaseFile = process.env.DATABASE_PATH
  ? path.resolve(process.env.DATABASE_PATH)
  : databasePath(backendDir);

const formatCounts = (counts = {}) =>
  Object.entries(counts)
    .map(([kind, count]) => `${kind}=${count}`)
    .join("  ");

const db = await openDatabase(databaseFile);
const result = await seedDemoData(db, { force, adminEmail });
await db.close();

console.log(`Baza: ${databaseFile}`);
if (!result.seeded) {
  console.log(`→ ${result.reason}`);
  console.log(`Mavjud yozuvlar: ${formatCounts(result.counts)}`);
  process.exit(0);
}

console.log("✓ Demo ma'lumot yozildi");
console.log(`  Super admin : ${result.adminEmail} (parol yo'q — email OTP orqali kiriladi)`);
console.log(`  Yozuvlar    : ${formatCounts(result.counts)}`);
console.log("\nKeyingi qadam: npm run dev → http://localhost:3000/admin (admin panel)");
