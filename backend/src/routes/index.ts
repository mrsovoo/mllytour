import { Router } from "express";
import { register, login, logout, getMe, telegramAuth } from "../controllers/auth.controller.js";
import { listTours, getTourById, createTour } from "../controllers/tours.controller.js";
import { createOrder, listOrders, getOrderById } from "../controllers/orders.controller.js";
import {
  createPayment,
  getPaymentById,
  handleClickWebhook,
  handlePaymeWebhook,
  handleCardWebhook,
  refundPayment,
} from "../controllers/payments.controller.js";
import {
  applyPartner,
  getPartnerProfile,
  addPartnerService,
} from "../controllers/partners.controller.js";
import {
  adminLogin,
  adminMe,
  getAdminDashboard,
  getAdminUsers,
  getAdminPartners,
  updatePartnerStatus,
  updatePartnerSubscription,
  getAdminPayments,
  getAdminPartnerEarnings,
  getAdminAuditLogs,
} from "../controllers/admin.controller.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

export const router = Router();

// Health check endpoint (Section 30)
router.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "millytour-api",
    timestamp: new Date().toISOString(),
  });
});

// Auth Routes
router.post("/auth/register", register);
router.post("/auth/login", login);
router.post("/auth/logout", logout);
router.post("/auth/telegram", telegramAuth);
router.get("/auth/me", requireAuth, getMe);

// Tours Routes
router.get("/tours", listTours);
router.get("/tours/:id", getTourById);
router.post("/tours", requireAdmin, createTour);

// Orders Routes
router.post("/orders", createOrder);
router.get("/orders", requireAuth, listOrders);
router.get("/orders/:id", getOrderById);

// Payment Routes
router.post("/payments/create", createPayment);
router.get("/payments/:id", getPaymentById);
router.post("/payments/webhooks/click", handleClickWebhook);
router.post("/payments/webhooks/payme", handlePaymeWebhook);
router.post("/payments/webhooks/card", handleCardWebhook);
router.post("/payments/:id/refund", requireAdmin, refundPayment);

// Partners Routes
router.post("/partners/apply", applyPartner);
router.get("/partners/me", getPartnerProfile);
router.post("/partners/services", requireAuth, addPartnerService);

// Admin Routes
router.post("/admin/login", adminLogin);
router.get("/admin/me", adminMe);
router.get("/admin/dashboard", requireAdmin, getAdminDashboard);
router.get("/admin/users", requireAdmin, getAdminUsers);
router.get("/admin/partners", requireAdmin, getAdminPartners);
router.post("/admin/partners/:id/status", requireAdmin, updatePartnerStatus);
router.post("/admin/partners/:id/subscription", requireAdmin, updatePartnerSubscription);
router.get("/admin/payments", requireAdmin, getAdminPayments);
router.get("/admin/partner-earnings", requireAdmin, getAdminPartnerEarnings);
router.get("/admin/audit-logs", requireAdmin, getAdminAuditLogs);
router.get("/admin/hotels", requireAdmin, (req, res) => {
  req.query.direction = "hotel";
  return getAdminPartners(req, res);
});
router.get("/admin/restaurants", requireAdmin, (req, res) => {
  req.query.direction = "restaurant";
  return getAdminPartners(req, res);
});
