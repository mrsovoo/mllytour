import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { fetchAdminSession, type AdminSession } from "@/api/admin";

/**
 * Admin panel qo'riqchisi.
 *
 * Marshrut "layout" sifatida ishlatilganda (children'siz) `Outlet`ni ko'rsatadi,
 * `children` berilganda esa ularni o'zini. Sessiya backend'dagi
 * `/api/admin/me` orqali tekshiriladi (username/parol sessiyasi).
 */
export function RequireAdmin({ children }: { children?: ReactNode }) {
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [admin, setAdmin] = useState<AdminSession | null>(null);

  useEffect(() => {
    let active = true;
    fetchAdminSession()
      .then((session) => {
        if (active) setAdmin(session);
      })
      .finally(() => {
        if (active) setChecking(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </main>
    );
  }

  if (!admin) {
    const returnTo = `${location.pathname}${location.search}`;
    return (
      <Navigate to={`/admin/login?returnTo=${encodeURIComponent(returnTo)}`} replace />
    );
  }

  return children ? <>{children}</> : <Outlet />;
}

