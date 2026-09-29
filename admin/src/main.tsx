import React, { StrictMode, Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { Toaster } from "@/components/ui/sonner";
import "./index.css";

const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminPartners = lazy(() => import("./pages/AdminPartners"));
const AdminHotels = lazy(() => import("./pages/AdminHotels"));
const AdminRestaurants = lazy(() => import("./pages/AdminRestaurants"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const AdminPayments = lazy(() => import("./pages/AdminPayments"));
const AdminAuditLogs = lazy(() => import("./pages/AdminAuditLogs"));
const AdminSettings = lazy(() => import("./pages/AdminSettings"));

function LoadingFallback() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground font-medium">Yuklanmoqda...</p>
      </div>
    </div>
  );
}

function AdminApp() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<AdminLogin />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          
          <Route path="/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />

          <Route path="/partners" element={<AdminPartners />} />
          <Route path="/admin/partners" element={<AdminPartners />} />

          <Route path="/hotels" element={<AdminHotels />} />
          <Route path="/admin/hotels" element={<AdminHotels />} />

          <Route path="/restaurants" element={<AdminRestaurants />} />
          <Route path="/admin/restaurants" element={<AdminRestaurants />} />

          <Route path="/users" element={<AdminUsers />} />
          <Route path="/admin/users" element={<AdminUsers />} />

          <Route path="/payments" element={<AdminPayments />} />
          <Route path="/admin/payments" element={<AdminPayments />} />

          <Route path="/audit-logs" element={<AdminAuditLogs />} />
          <Route path="/admin/audit-logs" element={<AdminAuditLogs />} />

          <Route path="/settings" element={<AdminSettings />} />
          <Route path="/admin/settings" element={<AdminSettings />} />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
      <Toaster />
    </BrowserRouter>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AdminApp />
  </StrictMode>,
);
