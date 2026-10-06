import { lazy, type ReactNode } from "react";
import { Navigate, Route } from "react-router";
import { RequireAuth } from "@/features/auth/components/require-auth";
import { SiteLayout } from "@/shared/components/site";

/**
 * Turist (public) route daraxti.
 *
 * Sayt + sayohatchi kabineti shu yerda yashaydi. Hamkor (`/partner`) va admin
 * (`/admin`) bo'limlari bu daraxtda faqat `RequireAuth` ortida qoladi va o'z
 * panellari sifatida ishlaydi — turist ularga havolalarda undalmaydi.
 */

const Landing = lazy(() => import("@/features/home/pages/landing.tsx"));
const Packages = lazy(() => import("@/features/tours/pages/packages.tsx"));
const PackageDetail = lazy(() => import("@/features/tours/pages/package-detail.tsx"));
const Destinations = lazy(() => import("@/features/destinations/pages/destinations.tsx"));
const Deals = lazy(() => import("@/features/tours/pages/deals.tsx"));
const Documents = lazy(() => import("@/features/documents/pages/documents.tsx"));
const DestinationDetail = lazy(
  () => import("@/features/destinations/pages/destination-detail.tsx"),
);
const Marketplace = lazy(() => import("@/features/marketplace/pages/marketplace.tsx"));
const Services = lazy(() => import("@/features/services/pages/services.tsx"));
const ServiceDetail = lazy(() => import("@/features/services/pages/service-detail.tsx"));
const Partners = lazy(() => import("@/features/partners/pages/partners.tsx"));
const AuthPage = lazy(() => import("@/features/auth/pages/auth.tsx"));
const Dashboard = lazy(() => import("@/features/account/pages/dashboard.tsx"));
const Partner = lazy(() => import("@/features/partners/pages/partner.tsx"));
const Admin = lazy(() => import("@/features/admin/pages/admin.tsx"));
const NotFound = lazy(() => import("@/app/pages/not-found.tsx"));

/** Turist kabinetining manzili — kirishdan keyin shu yerga qaytadi. */
export const TOURIST_CABINET_PATH = "/kabinet";

/** Public sahifalar umumiy header va footer ichida ko'rsatiladi. */
function Public({ children }: { children: ReactNode }) {
  return <SiteLayout>{children}</SiteLayout>;
}

export function touristRoutes() {
  return (
    <>
      <Route
        path="/"
        element={
          <Public>
            <Landing />
          </Public>
        }
      />
      <Route
        path="/paketlar"
        element={
          <Public>
            <Packages />
          </Public>
        }
      />
      <Route
        path="/paketlar/:slug"
        element={
          <Public>
            <PackageDetail />
          </Public>
        }
      />
      <Route
        path="/shaharlar"
        element={
          <Public>
            <Destinations />
          </Public>
        }
      />
      <Route
        path="/takliflar"
        element={
          <Public>
            <Deals />
          </Public>
        }
      />
      <Route
        path="/shaharlar/:slug"
        element={
          <Public>
            <DestinationDetail />
          </Public>
        }
      />
      <Route
        path="/xizmatlar"
        element={
          <Public>
            <Services />
          </Public>
        }
      />
      <Route
        path="/xizmatlar/:service"
        element={
          <Public>
            <ServiceDetail />
          </Public>
        }
      />
      <Route
        path="/hunarmandlar"
        element={
          <Public>
            <Marketplace />
          </Public>
        }
      />
      <Route
        path="/hamkorlar"
        element={
          <Public>
            <Partners />
          </Public>
        }
      />
      <Route
        path="/hujjatlar"
        element={
          <Public>
            <Documents />
          </Public>
        }
      />
      <Route path="/auth" element={<AuthPage redirectAfterAuth={TOURIST_CABINET_PATH} />} />
      <Route
        path={TOURIST_CABINET_PATH}
        element={
          <RequireAuth>
            <Dashboard />
          </RequireAuth>
        }
      />
      {/* Eski manzil — kabinet endi /kabinet. */}
      <Route path="/dashboard" element={<Navigate to={TOURIST_CABINET_PATH} replace />} />
      {/* Operator panellari: faqat kirgan foydalanuvchi uchun, sayt menyusida e'lon qilinmaydi. */}
      <Route
        path="/partner"
        element={
          <RequireAuth>
            <Partner />
          </RequireAuth>
        }
      />
      <Route
        path="/admin"
        element={
          <RequireAuth>
            <Admin />
          </RequireAuth>
        }
      />
      <Route
        path="*"
        element={
          <Public>
            <NotFound />
          </Public>
        }
      />
    </>
  );
}
