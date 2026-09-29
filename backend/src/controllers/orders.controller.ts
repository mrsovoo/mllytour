import type { Request, Response } from "express";
import { prisma } from "../db/client.js";
import { successResponse, errorResponse } from "../utils/response.js";
import { randomBytes } from "node:crypto";

export async function createOrder(req: Request, res: Response) {
  try {
    const { tourId, partnerId, peopleCount, travelDate, customerName, customerPhone, customerEmail, notes } = req.body;

    const count = Number(peopleCount || 1);
    let totalAmount = 1800000;
    let tourTitle = "Maxsus Sayohat Turi";

    if (tourId) {
      const tour = await prisma.tour.findUnique({ where: { id: tourId } });
      if (tour) {
        totalAmount = tour.basePriceUzs * count;
        tourTitle = tour.title;
      }
    }

    const orderNumber = `MT-${new Date().getFullYear()}-${randomBytes(3).toString("hex").toUpperCase()}`;

    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: req.user?.id || null,
        tourId: tourId || null,
        partnerId: partnerId || null,
        peopleCount: count,
        travelDate: travelDate || "Kelishilgan sanada",
        totalAmount,
        currency: "UZS",
        status: "PENDING_PAYMENT",
        customerName: customerName || "Hurmatli Mijoz",
        customerPhone: customerPhone || "+998900000000",
        customerEmail: customerEmail || null,
        notes: notes || null,
      },
      include: {
        tour: true,
      },
    });

    return successResponse(res, {
      ...order,
      tourTitle,
    }, 201);
  } catch (err: any) {
    return errorResponse(res, err.message || "Buyurtma yaratishda xatolik");
  }
}

export async function getOrderById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id }, { orderNumber: id }],
      },
      include: {
        tour: true,
        payments: true,
      },
    });

    if (!order) {
      return errorResponse(res, "Buyurtma topilmadi", "NOT_FOUND", 404);
    }

    return successResponse(res, {
      ...order,
      tourTitle: order.tour?.title || "Sayohat Xizmati",
    });
  } catch (err: any) {
    return errorResponse(res, err.message || "Buyurtmani yuklashda xatolik");
  }
}

export async function listOrders(req: Request, res: Response) {
  try {
    const where: any = {};
    if (req.user?.role === "CUSTOMER") {
      where.userId = req.user.id;
    } else if (req.user?.role === "PARTNER") {
      const partner = await prisma.partner.findUnique({ where: { userId: req.user.id } });
      if (partner) where.partnerId = partner.id;
    }

    const orders = await prisma.order.findMany({
      where,
      include: { tour: true, payments: true },
      orderBy: { createdAt: "desc" },
    });

    return successResponse(res, orders);
  } catch (err: any) {
    return errorResponse(res, err.message || "Buyurtmalarni yuklashda xatolik");
  }
}
