import { useState, useEffect } from "react";

/**
 * Foydalanuvchi Telegram Mini App ichida ekanligini aniqlash.
 * Shuningdek ?app=1 yoki ?mode=app parametri orqali ham mobil app rejimini yoqish mumkin.
 */
export function isTelegramWebApp(): boolean {
  if (typeof window === "undefined") return false;

  // 1. Session storage keshini tekshirish
  try {
    if (sessionStorage.getItem("milly_is_app") === "1") {
      return true;
    }
  } catch {}

  // 2. Telegram WebApp obyekti
  const tg = (window as any).Telegram?.WebApp;
  const hasInitData = Boolean(tg?.initData && tg.initData.length > 0);
  const hasPlatform = Boolean(tg?.platform && tg.platform !== "unknown");

  // 3. URL parametrlari (Telegram query / hash yoki majburiy app rejimi)
  const search = window.location.search || "";
  const hash = window.location.hash || "";
  const hasTgParam =
    search.includes("tgWebApp") ||
    search.includes("tgWebAppStartParam") ||
    hash.includes("tgWebAppData") ||
    search.includes("app=1") ||
    search.includes("mode=app");

  const isApp = hasInitData || hasPlatform || hasTgParam;

  if (isApp) {
    try {
      sessionStorage.setItem("milly_is_app", "1");
    } catch {}
  }

  return isApp;
}

export function useIsTelegramWebApp(): boolean {
  const [isTg, setIsTg] = useState<boolean>(() => isTelegramWebApp());

  useEffect(() => {
    setIsTg(isTelegramWebApp());
  }, []);

  return isTg;
}

export function getTelegramUser(): {
  id?: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
} | null {
  if (typeof window === "undefined") return null;
  return (window as any).Telegram?.WebApp?.initDataUnsafe?.user || null;
}

export function triggerHaptic(type: "light" | "medium" | "heavy" = "light") {
  try {
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.HapticFeedback) {
      tg.HapticFeedback.impactOccurred(type);
    }
  } catch {}
}
