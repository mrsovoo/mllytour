import { useEffect, useState } from "react";

export type ApiState<T> = T | undefined;

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "";

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
  }, [module, operation, key, args, enabled]);

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
