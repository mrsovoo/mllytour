import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { config } from "../config/index.js";

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = createHmac("sha256", config.jwtSecret)
    .update(`${salt}:${password}`)
    .digest("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, originalHash] = storedHash.split(":");
  if (!salt || !originalHash) return false;
  const hash = createHmac("sha256", config.jwtSecret)
    .update(`${salt}:${password}`)
    .digest("hex");
  return timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(originalHash, "hex"));
}

export function createToken(payload: Record<string, unknown>, expiresInDays = 7): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const exp = Math.floor(Date.now() / 1000) + expiresInDays * 24 * 60 * 60;
  const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString("base64url");
  const signature = createHmac("sha256", config.jwtSecret)
    .update(`${header}.${body}`)
    .digest("base64url");
  return `${header}.${body}.${signature}`;
}

export function verifyToken<T>(token: string): T | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;
    const expectedSignature = createHmac("sha256", config.jwtSecret)
      .update(`${header}.${body}`)
      .digest("base64url");

    if (signature !== expectedSignature) return null;

    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf-8"));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload as T;
  } catch {
    return null;
  }
}
