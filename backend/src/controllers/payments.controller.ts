import type { Request, Response } from "express";
import { paymentService } from "../services/payment/payment.service.js";
import { successResponse, errorResponse } from "../utils/response.js";
import { prisma } from "../db/client.js";

export async function createPayment(req: Request, res: Response) {
  try {
    const { orderId, provider, returnUrl } = req.body;

    if (!orderId || !provider) {
      return errorResponse(res, "orderId va provider majburiy parametrlar", "VALIDATION_ERROR", 400);
    }

    const result = await paymentService.createPayment({
      orderId,
      provider: String(provider).toLowerCase() as any,
      userId: req.user?.id,
      returnUrl,
    });

    return successResponse(res, result, 201);
  } catch (err: any) {
    return errorResponse(res, err.message || "To'lovni yaratib bo'lmadi");
  }
}

export async function getPaymentById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        order: { select: { orderNumber: true, totalAmount: true, status: true } },
      },
    });

    if (!payment) {
      return errorResponse(res, "To'lov topilmadi", "NOT_FOUND", 404);
    }

    return successResponse(res, payment);
  } catch (err: any) {
    return errorResponse(res, err.message || "To'lovni yuklashda xatolik");
  }
}

export async function handleClickWebhook(req: Request, res: Response) {
  try {
    const rawResponse = await paymentService.handleWebhook("click", req.body, req.headers);
    return res.json(rawResponse);
  } catch (err: any) {
    return res.json({
      error: -1,
      error_note: err.message || "Webhook error",
    });
  }
}

export async function handlePaymeWebhook(req: Request, res: Response) {
  try {
    const rawResponse = await paymentService.handleWebhook("payme", req.body, req.headers);
    return res.json(rawResponse);
  } catch (err: any) {
    return res.json({
      jsonrpc: "2.0",
      id: req.body?.id || 1,
      error: {
        code: -31008,
        message: err.message || "Payme webhook error",
      },
    });
  }
}

export async function handleCardWebhook(req: Request, res: Response) {
  try {
    const rawResponse = await paymentService.handleWebhook("card", req.body, req.headers);
    return res.json(rawResponse);
  } catch (err: any) {
    return errorResponse(res, err.message || "Card webhook error", "BAD_REQUEST", 400);
  }
}

export async function refundPayment(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminUsername = req.admin?.username || "admin";

    const refund = await paymentService.processRefund(id, reason || "Admin refund", adminUsername);
    return successResponse(res, refund);
  } catch (err: any) {
    return errorResponse(res, err.message || "Qaytarishda xatolik");
  }
}
