import '@vly-ai/integrations';
import { Toaster } from '@/components/ui';
import { RequireAuth } from "@/components/RequireAuth";
import { VlyToolbar } from "../vly-toolbar-readonly.tsx";
import { AiAssistant } from "@/components/AiAssistant";
import { ScrollToTop } from "@/components/ScrollToTop";
import { OnboardingGate } from "@/components/OnboardingGate";
import { SiteLayout } from "@/components/site";
import React, { StrictMode, useEffect, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes, useLocation, useRoutes } from "react-router";
import { LangProvider } from "@/lib/i18n";
import "./index.css";

/**
 * Panel rejimi.
 *
 * - `admin`   — `npm run dev:admin` (:3000) va millytour-adm.* domeni: faqat
 *   `/admin` hamda `/auth`.
 * - `partner` — `npm run dev:partner` (:3001): faqat `/partner` hamda `/auth`.
 * - `public`  — oddiy sayt (default).
 *
 * Qolgan barcha manzillar tanlangan panelga yo'naltiriladi.
 */
const APP_PANEL =
  import.meta.env.VITE_APP_PANEL ?? (import.meta.env.VITE_ADMIN_ONLY === "1" ? "admin" : "public");

// Lazy load route components for better code splitting
const Landing = lazy(() => import("./pages/Landing.tsx"));
const Packages = lazy(() => import("./pages/Packages.tsx"));
const PackageDetail = lazy(() => import("./pages/PackageDetail.tsx"));
const Destinations = lazy(() => import("./pages/Destinations.tsx"));
const Deals = lazy(() => import("./pages/Deals.tsx"));
const Documents = lazy(() => import("./pages/Documents.tsx"));
const DestinationDetail = lazy(() => import("./pages/DestinationDetail.tsx"));
const Marketplace = lazy(() => import("./pages/Marketplace.tsx"));
const Services = lazy(() => import("./pages/Services.tsx"));
const ServiceDetail = lazy(() => import("./pages/ServiceDetail.tsx"));
const Partners = lazy(() => import("./pages/Partners.tsx"));
const AuthPage = lazy(() => import("./pages/Auth.tsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.tsx"));
const Partner = lazy(() => import("./pages/Partner.tsx"));
const Admin = lazy(() => import("./pages/Admin.tsx"));
const AdminLogin = lazy(() => import("./pages/AdminLogin.tsx"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard.tsx"));
const AdminPartners = lazy(() => import("./pages/AdminPartners.tsx"));
const AdminHotels = lazy(() => import("./pages/AdminHotels.tsx"));
const AdminRestaurants = lazy(() => import("./pages/AdminRestaurants.tsx"));
const AdminUsers = lazy(() => import("./pages/AdminUsers.tsx"));
const AdminSettings = lazy(() => import("./pages/AdminSettings.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

function AdminRoutes() {
  const routes = useRoutes([
    { path: "/admin/login", element: <AdminLogin /> },
    {
      path: "/admin",
      element: <RequireAdmin />,
      children: [
        { path: "dashboard", element: <AdminDashboard /> },
        { path: "partners", element: <AdminPartners /> },
        { path: "hotels", element: <AdminHotels /> },
        { path: "restaurants", element: <AdminRestaurants /> },
        { path: "users", element: <AdminUsers /> },
        { path: "settings", element: <AdminSettings /> },
        { index: true, element: <AdminDashboard /> },
      ],
    },
  ]);

  return routes;
}

// Simple loading fallback for route transitions
function RouteLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground">Loading...</div>
    </div>
  );
}

/** Public sahifalar umumiy header va footer ichida ko'rsatiladi. */
function Public({ children }: { children: React.ReactNode }) {
  return <SiteLayout>{children}</SiteLayout>;
}

/** Silent error boundary — if VlyToolbar crashes it renders nothing instead of
 *  crashing the whole app (e.g. hook errors in WebContainer environment). */
class ToolbarErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err: Error) {
    console.warn("[VlyToolbar] Caught error, toolbar disabled:", err.message);
  }
  render() {
    return this.state.hasError ? null : this.props.children;
  }
}

/** Hard guard so runtime errors never leave the preview as a blank page. */
class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string; stack: string }
> {
  state = { hasError: false, message: "", stack: "" };
  static getDerivedStateFromError(error: Error) {
    return {
      hasError: true,
      message: error.message || "Unknown runtime error",
      stack: error.stack || "",
    };
  }
  componentDidCatch(err: Error) {
    console.error("[WebContainer preview] Root crash:", err);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
          <div className="max-w-lg text-center">
            <p className="text-sm font-semibold">Preview runtime error</p>
            <p className="mt-2 text-xs text-muted-foreground break-words">
              {this.state.message}
            </p>
            {this.state.stack && (
              <pre className="mt-3 text-left text-[10px] leading-4 text-muted-foreground/80 max-h-40 overflow-auto rounded border border-border/60 p-2">
                {this.state.stack}
              </pre>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function RouteSyncer() {
  const location = useLocation();
  useEffect(() => {
    window.parent.postMessage(
      { type: "iframe-route-change", path: location.pathname },
      "*",
    );
  }, [location.pathname]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === "navigate") {
        if (event.data.direction === "back") window.history.back();
        if (event.data.direction === "forward") window.history.forward();
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return null;
}


const root = createRoot(document.getElementById("root")!);

root.render(
  <StrictMode>
    <RootErrorBoundary>
      <ToolbarErrorBoundary>
        <VlyToolbar />
      </ToolbarErrorBoundary>
      <LangProvider>
        <BrowserRouter>
            <RouteSyncer />
            <Suspense fallback={<RouteLoading />}>
              {APP_PANEL === "admin" ? (
                <>
                  <Routes>
                    <Route path="/auth" element={<AuthPage redirectAfterAuth="/admin" />} />
                    <Route path="*" element={<Navigate to="/admin" replace />} />
                  </Routes>
                  <AdminRoutes />
                </>
              ) : APP_PANEL === "partner" ? (
                <>
                  <Routes>
                    <Route path="/auth" element={<AuthPage redirectAfterAuth="/partner" />} />
                    <Route path="/partner" element={<RequireAuth><Partner /></RequireAuth>} />
                    <Route path="*" element={<Navigate to="/partner" replace />} />
                  </Routes>
                  <AdminRoutes />
                </>
              ) : (
                <Routes>
                  <Route path="/" element={<Public><Landing /></Public>} />
                  <Route path="/paketlar" element={<Public><Packages /></Public>} />
                  <Route path="/paketlar/:slug" element={<Public><PackageDetail /></Public>} />
                  <Route path="/shaharlar" element={<Public><Destinations /></Public>} />
                  <Route path="/takliflar" element={<Public><Deals /></Public>} />
                  <Route path="/shaharlar/:slug" element={<Public><DestinationDetail /></Public>} />
                  <Route path="/xizmatlar" element={<Public><Services /></Public>} />
                  <Route path="/xizmatlar/:service" element={<Public><ServiceDetail /></Public>} />
                  <Route path="/hunarmandlar" element={<Public><Marketplace /></Public>} />
                  <Route path="/hamkorlar" element={<Public><Partners /></Public>} />
                  <Route path="/hujjatlar" element={<Public><Documents /></Public>} />
                  <Route path="/auth" element={<AuthPage redirectAfterAuth="/dashboard" />} />
                  <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
                  <Route path="/partner" element={<RequireAuth><Partner /></RequireAuth>} />
                  <Route path="*" element={<Public><NotFound /></Public>} />
                </Routes>
              )}
            </Suspense>
            <ScrollToTop />
            <AiAssistant />
            <OnboardingGate />
        </BrowserRouter>
      </LangProvider>
      <Toaster />
    </RootErrorBoundary>
  </StrictMode>,
);
