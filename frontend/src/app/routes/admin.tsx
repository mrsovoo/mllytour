import { lazy } from "react";
import { Navigate, Route } from "react-router";
import { RequireAuth } from "@/features/auth/components/require-auth";

/**
 * Admin route daraxti.
 *
 * `npm run dev:admin` (:3000) yoki admin domeni shu daraxtni ishlatadi —
 * ilova faqat `/admin` va kirish uchun `/auth` ni ko'rsatadi.
 */

const AuthPage = lazy(() => import("@/features/auth/pages/auth.tsx"));
const Admin = lazy(() => import("@/features/admin/pages/admin.tsx"));

export const ADMIN_PATH = "/admin";

export function adminRoutes() {
  return (
    <>
      <Route path="/auth" element={<AuthPage redirectAfterAuth={ADMIN_PATH} />} />
      <Route
        path={ADMIN_PATH}
        element={
          <RequireAuth>
            <Admin />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to={ADMIN_PATH} replace />} />
    </>
  );
}
