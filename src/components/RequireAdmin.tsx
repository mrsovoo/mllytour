import { useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router";
import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { apiRequest } from "@/api/client";

export function RequireAdmin({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await apiRequest<{ admin: { username: string; role: string } }>("admin", "me", {}, true);
        setIsAdmin(!!res.admin);
      } catch {
        setIsAdmin(false);
      } finally {
        setChecking(false);
      }
    };
    check();
  }, []);

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </main>
    );
  }

  if (!isAdmin) {
    const returnTo = `${location.pathname}${location.search}`;
    return (
      <Navigate
        to={`/admin/login?returnTo=${encodeURIComponent(returnTo)}`}
        replace
      />
    );
  }

  return <>{children}</>;
}
