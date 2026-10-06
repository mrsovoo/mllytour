import { lazy } from "react";
import { Navigate, Route } from "react-router";
import { RequireAuth } from "@/features/auth/components/require-auth";

/**
 * Hamkor (partner) route daraxti.
 *
 * `npm run dev:partner` (:3001) yoki hamkor domeni shu daraxtni ishlatadi —
 * ilova faqat `/partner` va kirish uchun `/auth` ni ko'rsatadi, qolgan barcha
 * manzillar panelga yo'naltiriladi.
 */

const AuthPage = lazy(() => import("@/features/auth/pages/auth.tsx"));
const Partner = lazy(() => import("@/features/partners/pages/partner.tsx"));

export const PARTNER_PATH = "/partner";

export function partnerRoutes() {
  return (
    <>
      <Route path="/auth" element={<AuthPage redirectAfterAuth={PARTNER_PATH} />} />
      <Route
        path={PARTNER_PATH}
        element={
          <RequireAuth>
            <Partner />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to={PARTNER_PATH} replace />} />
    </>
  );
}
