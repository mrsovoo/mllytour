import { useEffect, useState } from "react";

export type ApiState<T> = T | undefined;

/**
 * Backend manzili.
 *
 * - Bo'sh qolsa (`""`) so'rovlar nisbiy `/api/...` ga ketadi: dev'da Vite proxy,
 *   prod'da esa bir xil domendagi rewrite (masalan nginx `location /api/`).
 * - Backend alohida domenga chiqarilsa `VITE_API_URL=https://api.example.com`
 *   bilan build qilinadi (Vite bu qiymatni build paytida kodga yozib qo'yadi).
 */
export const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "";

/**
 * REST helper'dan tashqaridagi chaqiruvlar uchun to'liq API manzili
 * (masalan `/api/auth/me`). Har doim shu funksiyadan foydalaning — aks holda
 * backend boshqa domenda bo'lganda so'rov frontend hostiga ketib 404 bo'ladi.
 */
export function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}


export async function apiRequest<T>(
  module: string,
  operation: string,
  args: Record<string, unknown> = {},
): Promise<T> {
  const response = await fetch(`${API_BASE}/api/rest/${module}/${operation}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
  const payload = (await response.json().catch(() => ({}))) as {
    data?: T;
    error?: string;
  };
  if (!response.ok) {
    throw new Error(payload.error ?? `API request failed: ${response.status}`);
  }
  return payload.data as T;
}

// REST responses intentionally preserve the existing page-specific shapes.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useRestQuery<T = any>(
  module: string,
  operation: string,
  args: Record<string, unknown> = {},
  enabled = true,
): T | undefined {
  const [value, setValue] = useState<T>();
  const key = JSON.stringify(args);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    let active = true;
    apiRequest<T>(module, operation, args)
      .then((result) => {
        if (active) setValue(result);
      })
      .catch((error) => {
        console.error(`[api:${module}.${operation}]`, error);
        if (active) setValue(undefined);
      });
    return () => {
      active = false;
    };
  }, [module, operation, key, enabled]);

  return enabled ? value : undefined;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useRestMutation<T = any>(module: string, operation: string) {
  return (args: Record<string, unknown> = {}) => apiRequest<T>(module, operation, args);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useRestAction<T = any>(module: string, operation: string) {
  return (args: Record<string, unknown> = {}) => apiRequest<T>(module, operation, args);
}
