import type { Request, Response } from "express";
import { prisma } from "../db/client.js";
import { hashPassword, verifyPassword, createToken, validateTelegramWebAppData } from "../utils/security.js";
import { config } from "../config/index.js";
import { successResponse, errorResponse } from "../utils/response.js";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email("Noto'g'ri email formati"),
  password: z.string().min(6, "Parol kamida 6 ta belgidan iborat bo'lishi kerak"),
  name: z.string().min(2, "Ism kamida 2 ta belgi"),
  phone: z.string().optional(),
  country: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function register(req: Request, res: Response) {
  try {
    const data = registerSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: data.email } });

    if (existing) {
      return errorResponse(res, "Ushbu email bilan foydalanuvchi allaqachon mavjud", "CONFLICT", 409);
    }

    const passwordHash = hashPassword(data.password);
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        name: data.name,
        phone: data.phone,
        country: data.country || "Uzbekistan",
        role: "CUSTOMER",
      },
    });

    const token = createToken({ id: user.id, email: user.email, role: user.role });
    res.cookie("millytour_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return successResponse(res, {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    }, 201);
  } catch (err: any) {
    return errorResponse(res, err.errors?.[0]?.message || err.message || "Ro'yxatdan o'tishda xatolik");
  }
}

export async function login(req: Request, res: Response) {
  try {
    const data = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: data.email } });

    if (!user || !user.passwordHash || !verifyPassword(data.password, user.passwordHash)) {
      return errorResponse(res, "Email yoki parol noto'g'ri", "INVALID_CREDENTIALS", 401);
    }

    const token = createToken({ id: user.id, email: user.email, role: user.role });
    res.cookie("millytour_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return successResponse(res, {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    });
  } catch (err: any) {
    return errorResponse(res, err.errors?.[0]?.message || err.message || "Tizimga kirishda xatolik");
  }
}

export async function logout(_req: Request, res: Response) {
  res.clearCookie("millytour_session");
  return successResponse(res, { message: "Muvaffaqiyatli chiqildi" });
}

export async function getMe(req: Request, res: Response) {
  if (!req.user) {
    return errorResponse(res, "Autentifikatsiyadan o'tilmagan", "UNAUTHORIZED", 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      country: true,
      currency: true,
    },
  });

  if (!user) {
    return errorResponse(res, "Foydalanuvchi topilmadi", "NOT_FOUND", 404);
  }

  return successResponse(res, { user });
}

export async function telegramAuth(req: Request, res: Response) {
  try {
    const { initData, role } = req.body;
    if (!initData) {
      return errorResponse(res, "initData majburiy", "VALIDATION_ERROR", 400);
    }

    const { isValid, user: tgUser } = validateTelegramWebAppData(
      initData,
      config.telegramBotToken,
    );

    if (!isValid || !tgUser?.id) {
      return errorResponse(res, "Telegram autentifikatsiyasi noto'g'ri (Invalid initData)", "UNAUTHORIZED", 401);
    }

    const telegramId = BigInt(tgUser.id);
    const targetRole = role === "PARTNER" ? "PARTNER" : "CUSTOMER";

    // 1. Telegram ID orqali mavjud foydalanuvchini topish yoki yaratish
    let user = await prisma.user.findFirst({
      where: { telegramId },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          telegramId,
          telegramUsername: tgUser.username || null,
          name: [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" ") || "Telegram Foydalanuvchi",
          role: targetRole,
          language: tgUser.language_code || "uz",
        },
      });
    }

    // 2. Agar foydalanuvchi hamkor bo'lsa, hamkor profilini topish
    let partner = null;
    if (targetRole === "PARTNER" || user.role === "PARTNER") {
      partner = await prisma.partner.findFirst({
        where: { telegramId },
        include: { services: true },
      });
    }

    const token = createToken({
      id: user.id,
      role: user.role,
      telegramId: user.telegramId?.toString(),
    });

    res.cookie("millytour_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return successResponse(res, {
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        telegramId: user.telegramId?.toString(),
      },
      partner: partner
        ? {
            ...partner,
            telegramId: partner.telegramId?.toString(),
          }
        : null,
      token,
    });
  } catch (err: any) {
    return errorResponse(res, err.message || "Telegram orqali kirishda xatolik");
  }
}

