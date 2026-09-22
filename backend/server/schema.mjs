/**
 * SQLite sxemasi va ulanish.
 *
 * Server (`index.mjs`) ham, seeder (`seed.mjs`, `scripts/seed.mjs`) ham shu
 * moduldan foydalanadi — sxema bitta joyda turadi va ikki nusxa bo'lib
 * qolmaydi.
 */
import fs from "node:fs/promises";
import path from "node:path";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

export function databasePath(backendDir) {
  return path.join(backendDir, "data", "millytour.db");
}

/** Jadvallar va indekslarni yaratadi (mavjud bo'lsa tegilmaydi). */
export async function ensureSchema(db) {
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
}

/** Bazani ochadi (kerak bo'lsa papkani yaratib, sxemani tayyorlaydi). */
export async function openDatabase(file) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const db = await open({ filename: file, driver: sqlite3.Database });
  await ensureSchema(db);
  return db;
}
