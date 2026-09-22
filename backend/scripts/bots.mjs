#!/usr/bin/env node
/**
 * Telegram bot sozlamalarini bazaga yozadi (admin paneldagi "Bot sozlamalari"
 * bilan bir xil joy — `bot_settings` yozuvi).
 *
 * Nega kerak: `.env.local` serverda qulay, lekin lokalda uni har safar qo'lda
 * tahrirlash shart emas. Bu skript tokenlarni bazaga yozadi — baza `.env` dan
 * ustun turadi va qayta ishga tushirish talab qilmaydi.
 *
 *   npm run bots                                        # faqat holatni ko'rsatadi
 *   npm run bots -- --main=123:AAA --auth=456:BBB --stats=789:CCC
 *   npm run bots -- --owner=6724823030
 *   npm run bots -- --from-env                          # .env dagi qiymatlarni yozadi
 *   npm run bots -- --polling=takeover                  # webhook'ni olib, lokal polling
 *   npm run bots -- --polling=off                       # polling'siz, faqat webhook
 *   npm run bots -- --clear=stats                       # bitta botni tozalaydi
 *
 * Flag berilmasa `.env` / `.env.local` dagi qiymatlar ishlatiladi (bo'sh
 * bo'lganlari o'tkazib yuboriladi), ya'ni `--from-env` bilan bir xil.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { databasePath, openDatabase } from "../server/schema.mjs";
import { BOT_IDS, botConfigView, loadBotSettings, saveBotSettings } from "../server/telegram.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendDir = path.resolve(__dirname, "..");
const rootDir = path.resolve(backendDir, "..");

dotenv.config({ path: path.join(rootDir, ".env.local") });
dotenv.config({ path: path.join(rootDir, ".env") });

const argv = process.argv.slice(2);
const flag = (name) => argv.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3)?.trim();

const patch = {};
for (const bot of BOT_IDS) {
  const value = flag(bot) || process.env[`TELEGRAM_${bot.toUpperCase()}_BOT_TOKEN`]?.trim();
  const username = flag(`${bot}-username`) || process.env[`TELEGRAM_${bot.toUpperCase()}_BOT_USERNAME`]?.trim();
  if (value || username) patch[bot] = { ...(value ? { token: value } : {}), ...(username ? { username } : {}) };
}
for (const bot of BOT_IDS) {
  if (argv.includes(`--clear=${bot}`)) patch[bot] = { clear: true };
}
const owner = flag("owner") || process.env.OWNER_TELEGRAM_ID?.trim();
if (owner) patch.ownerTelegramId = owner;

const polling =
  flag("polling") ||
  (process.env.TELEGRAM_POLLING === "true" ? "takeover" : process.env.TELEGRAM_POLLING === "false" ? "off" : "");
if (polling) patch.polling = polling;

const databaseFile = process.env.DATABASE_PATH
  ? path.resolve(process.env.DATABASE_PATH)
  : databasePath(backendDir);

const db = await openDatabase(databaseFile);

if (Object.keys(patch).length === 0) {
  const view = botConfigView(await loadBotSettings(db));
  console.log(`Baza: ${databaseFile}`);
  console.log(`Rejim: ${view.localMode ? "lokal (token yo'q — simulyatsiya ishlaydi)" : "haqiqiy bot"}`);
  for (const bot of BOT_IDS) {
    console.log(
      `  ${bot.padEnd(5)} ${view.configured[bot] ? view.masked[bot] : "—"}${
        view.sources[bot] ? ` (${view.sources[bot]})` : ""
      }  @${view.usernames[bot]}  ${view.deepLinks[bot]}`,
    );
  }
  console.log(`Owner : ${view.ownerTelegramId ?? "—"}`);
  console.log(`Polling: ${view.polling}`);
  console.log("\nYozish uchun: npm run bots -- --main=TOKEN --auth=TOKEN --stats=TOKEN --owner=ID --polling=takeover");
  await db.close();
  process.exit(0);
}

const settings = await saveBotSettings(db, patch);
const view = botConfigView(settings);
await db.close();

console.log(`Baza: ${databaseFile}`);
console.log("✓ Bot sozlamalari saqlandi (manba: panel)");
for (const bot of BOT_IDS) {
  console.log(`  ${bot.padEnd(5)} ${view.configured[bot] ? view.masked[bot] : "—"}  @${view.usernames[bot]}`);
}
console.log(`Owner : ${view.ownerTelegramId ?? "—"}`);
console.log(`Polling: ${view.polling}`);
console.log("\nDiqqat: polling rejimi o'zgarishi backend qayta ishga tushganda kuchga kiradi.");
console.log("Keyingi qadam: npm run dev → admin panel → Bot sozlamalari");
