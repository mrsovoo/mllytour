import type { Request, Response } from "express";
import { prisma } from "../db/client.js";
import { successResponse, errorResponse } from "../utils/response.js";

export async function applyPartner(req: Request, res: Response) {
  try {
    const { businessName, contactName, phone, direction, city, about, telegramUsername, telegramId } = req.body;

    if (!businessName || !phone || !direction) {
      return errorResponse(res, "businessName, phone va direction majburiy", "VALIDATION_ERROR", 400);
    }

    const partner = await prisma.partner.create({
      data: {
        userId: req.user?.id || null,
        businessName,
        contactName: contactName || null,
        phone,
        direction,
        city: city || "Toshkent",
        about: about || null,
        telegramUsername: telegramUsername || null,
        telegramId: telegramId ? BigInt(telegramId) : null,
        status: "PENDING",
      },
    });

    return successResponse(res, {
      ...partner,
      telegramId: partner.telegramId ? partner.telegramId.toString() : null,
    }, 201);
  } catch (err: any) {
    return errorResponse(res, err.message || "Hamkorlik arizasini topshirishda xatolik");
  }
}

export async function getPartnerProfile(req: Request, res: Response) {
  try {
    let partner = null;
    if (req.user) {
      partner = await prisma.partner.findFirst({
        where: { userId: req.user.id },
        include: { services: true, earnings: true },
      });
    }

    if (!partner && req.query.telegramId) {
      partner = await prisma.partner.findFirst({
        where: { telegramId: BigInt(String(req.query.telegramId)) },
        include: { services: true, earnings: true },
      });
    }

    if (!partner) {
      return errorResponse(res, "Hamkor profili topilmadi", "NOT_FOUND", 404);
    }

    const p = partner as any;
    return successResponse(res, {
      ...p,
      telegramId: p.telegramId ? p.telegramId.toString() : null,
    });
  } catch (err: any) {
    return errorResponse(res, err.message || "Profilni yuklashda xatolik");
  }
}

export async function addPartnerService(req: Request, res: Response) {
  try {
    const { partnerId, name, description, region, duration, price, currency } = req.body;

    const service = await prisma.partnerService.create({
      data: {
        partnerId,
        name,
        description,
        region,
        duration: duration || null,
        price: Number(price),
        currency: currency || "UZS",
        status: "PENDING",
      },
    });

    return successResponse(res, service, 201);
  } catch (err: any) {
    return errorResponse(res, err.message || "Xizmat qo'shishda xatolik");
  }
}
