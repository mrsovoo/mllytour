import { useEffect, useMemo, useState } from "react";

type LocalUser = {
  _id: string;
  email?: string;
  name?: string;
  isAnonymous?: boolean;
  onboardedAt?: string | null;
  role?: "admin" | "user";
  telegramId?: string | number | null;
  language?: string;
};

const STORAGE_KEY = "millytour-local-user";

async function loadUser(): Promise<LocalUser | null> {
  try {
    const response = await fetch("/api/auth/me", { credentials: "include" });
    if (!response.ok) return null;
    const payload = await response.json();
    if (!payload || !payload.user) return null;
    return payload.user;
  } catch {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as LocalUser;
    } catch {
      return null;
    }
  }
}

export function useAuth() {
  const [user, setUser] = useState<LocalUser | null | undefined>(undefined);

  useEffect(() => {
    let mounted = true;
    const refresh = () => {
      loadUser().then((nextUser) => {
        if (mounted) setUser(nextUser);
      });
    };

    refresh();
    window.addEventListener("millytour:auth-change", refresh);

    return () => {
      mounted = false;
      window.removeEventListener("millytour:auth-change", refresh);
    };
  }, []);

  const signIn = async (provider: string, formData?: FormData) => {
    const payload = formData ? Object.fromEntries(formData.entries()) : { provider };

    if (provider === "email-otp") {
      const endpoint = payload.code ? "/api/auth/email/verify" : "/api/auth/email/request";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Email tasdiqlanmadi");
      if (!payload.code) return data;
      const nextUser = data.user as LocalUser;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
      setUser(nextUser);
      window.dispatchEvent(new Event("millytour:auth-change"));
      return nextUser;
    }

    const response = await fetch("/api/auth/signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ provider, ...payload }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || "Sign in failed");
    }

    const nextUser = data.user ?? {
      _id: `local-user-${Date.now()}`,
      email: String(payload.email ?? "demo@example.com"),
      name: "Local Demo User",
      isAnonymous: provider === "anonymous",
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
    setUser(nextUser);
    window.dispatchEvent(new Event("millytour:auth-change"));
    return nextUser;
  };

  const signOut = async () => {
    try {
      await fetch("/api/auth/signout", { method: "POST", credentials: "include" });
    } catch {
      // noop fallback for local dev
    }
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
    window.dispatchEvent(new Event("millytour:auth-change"));
  };

  const isLoading = user === undefined;

  return useMemo(
    () => ({
      isLoading,
      isAuthenticated: Boolean(user),
      user,
      signIn,
      signOut,
    }),
    [isLoading, user],
  );
}
