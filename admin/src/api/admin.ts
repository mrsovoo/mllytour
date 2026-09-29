import { useCallback, useEffect, useState } from "react";

/**
 * Admin panel REST klienti.
 *
 * Panel backend'dagi `/api/admin/*` marshrutlaridan foydalanadi (username/parol
 * sessiyasi — `millytour_admin_session` cookie). Javoblar doim `{ data: ... }`,
 * `{ admin: ... }` yoki `{ ok: true }` ko'rinishida keladi, shu qatlam ularni
 * ochib beradi.
 *
 * Oddiy sayt qatlami (`src/api/client.ts`) o'zgarmaydi: u `/api/rest/:module`
 * RPC yo'lidan foydalanadi, admin panel esa klassik REST yo'lidan.
 */

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "";

export type AdminSession = { username: string; role: string };

type Envelope<T> = { data?: T; error?: string } & Record<string, unknown>;

/**
 * Filtr qiymatlarini query'ga aylantiradi.
 * `undefined`, `""` va `"all"` (filtr o'chirilgan holat) yuborilmaydi.
 */
function queryString(params?: Record<string, unknown>) {
  if (!params) {
    return "";
  }
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "" || value === "all") {
      continue;
    }
    search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

export async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("millytour_admin_token") : null;
  const headers: Record<string, string> = {
    ...(init?.headers as Record<string, string> || {}),
  };
  if (init?.body) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}/api/admin${path}`, {
    credentials: "include",
    ...init,
    headers,
  });
  const payload = (await response.json().catch(() => ({}))) as any;
  if (!response.ok) {
    const errorMsg =
      typeof payload.error === "object"
        ? payload.error?.message
        : payload.error || payload.message;
    throw new Error(errorMsg ?? `Admin API xatosi: ${response.status}`);
  }
  return (payload.data ?? payload) as T;
}

/** Admin sessiyasi (`GET /api/admin/me`) — yo'q bo'lsa `null`. */
export async function fetchAdminSession(): Promise<AdminSession | null> {
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("millytour_admin_token") : null;
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const response = await fetch(`${API_BASE}/api/admin/me`, {
      credentials: "include",
      headers,
    });
    if (!response.ok) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("millytour_admin_token");
        localStorage.removeItem("millytour_admin_user");
      }
      return null;
    }
    const payload = (await response.json().catch(() => ({}))) as any;
    return payload.data?.admin ?? payload.admin ?? null;
  } catch {
    return null;
  }
}

/** Ro'yxat/statistika o'qish (`GET /api/admin/...`). */
export function useAdminQuery<T>(
  path: string,
  params?: Record<string, unknown>,
  enabled = true,
) {
  const [data, setData] = useState<T>();
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const query = queryString(params);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    try {
      setData(await adminFetch<T>(`${path}${query}`));
      setError(null);
    } catch (requestError) {
      console.error(`[admin:${path}]`, requestError);
      setError(requestError instanceof Error ? requestError.message : "Xatolik yuz berdi");
    } finally {
      setIsLoading(false);
    }
  }, [path, query]);

  // Ma'lumotlar shu yerda yuklanadi: `setState` faqat promise callback'larida
  // chaqiriladi (effekt tanasida sinxron `setState` qilishdan saqlanamiz).
  useEffect(() => {
    if (!enabled) {
      return;
    }
    let active = true;
    adminFetch<T>(`${path}${query}`)
      .then((result) => {
        if (active) {
          setData(result);
          setError(null);
        }
      })
      .catch((requestError) => {
        console.error(`[admin:${path}]`, requestError);
        if (active) {
          setError(requestError instanceof Error ? requestError.message : "Xatolik yuz berdi");
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [path, query, enabled]);

  return { data, isLoading, error, refetch };
}

/**
 * `:id` o'rniga argumentdan kelgan id'ni qo'yadi, qolgan maydonlarni
 * so'rov tanasi qiladi. Sahifalar `{ id, status }` yoki `{ providerId, ... }`
 * ko'rinishida chaqiradi — ikkalasi ham qo'llab-quvvatlanadi.
 */
function buildRequest(path: string, args: Record<string, unknown>) {
  const id = args.id ?? args.providerId;
  const body: Record<string, unknown> = { ...args };
  delete body.id;
  delete body.providerId;
  const url = id === undefined ? path : path.replace(":id", encodeURIComponent(String(id)));
  return { url, body };
}

/** Holatni o'zgartirish (`POST /api/admin/...`). */
export function useAdminMutation<T = { ok?: boolean }>(path: string) {
  const mutate = useCallback(
    async (args: Record<string, unknown> = {}) => {
      const { url, body } = buildRequest(path, args);
      return adminFetch<T>(url, { method: "POST", body: JSON.stringify(body) });
    },
    [path],
  );
  return { mutate };
}
