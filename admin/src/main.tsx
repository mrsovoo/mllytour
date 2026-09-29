import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { Toaster } from "@/components/ui/sonner";
import AdminLayout from "./layouts/AdminLayout";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminPartners from "./pages/AdminPartners";
import AdminHotels from "./pages/AdminHotels";
import AdminRestaurants from "./pages/AdminRestaurants";
import AdminUsers from "./pages/AdminUsers";
import AdminPayments from "./pages/AdminPayments";
import AdminAuditLogs from "./pages/AdminAuditLogs";
import AdminSettings from "./pages/AdminSettings";
import "./index.css";

function AdminApp() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/login" element={<AdminLogin />} />
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Persistent Shell Layout */}
        <Route element={<AdminLayout />}>
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
        </Route>

        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AdminApp />
  </StrictMode>,
);
