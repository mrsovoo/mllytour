import '@vly-ai/integrations';
import { Toaster } from "@/shared/components/ui/sonner";
import { VlyToolbar } from "../../vly-toolbar-readonly.tsx";
import { AiAssistant } from "@/features/ai/components/ai-assistant";
import { ScrollToTop } from "@/shared/components/scroll-to-top";
import { OnboardingGate } from "@/features/auth/components/onboarding-gate";
import React, { StrictMode, useEffect, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, useLocation } from "react-router";
import { LangProvider } from "@/shared/lib/i18n";
import { touristRoutes } from "@/app/routes/tourist";
import { partnerRoutes } from "@/app/routes/partner";
import { adminRoutes } from "@/app/routes/admin";
import "./index.css";

/**
 * Panel rejimi.
 *
 * - `admin`   — `npm run dev:admin` (:3000) va millytour-adm.* domeni: faqat
 *   `/admin` hamda `/auth` (`app/routes/admin.tsx`).
 * - `partner` — `npm run dev:partner` (:3001): faqat `/partner` va `/auth`
 *   (`app/routes/partner.tsx`).
 * - `public`  — turist sayti va kabineti (`app/routes/tourist.tsx`).
 *
 * Har bir rol o'z route daraxtiga ega; `main.tsx` faqat rejimga qarab
 * kerakli daraxtni tanlaydi.
 */
const APP_PANEL =
  import.meta.env.VITE_APP_PANEL ?? (import.meta.env.VITE_ADMIN_ONLY === "1" ? "admin" : "public");

// Simple loading fallback for route transitions
function RouteLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground">Loading...</div>
    </div>
  );
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
              <Routes>
                {APP_PANEL === "admin"
                  ? adminRoutes()
                  : APP_PANEL === "partner"
                    ? partnerRoutes()
                    : touristRoutes()}
              </Routes>
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
