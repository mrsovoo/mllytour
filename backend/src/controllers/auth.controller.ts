import type { Request, Response } from "express";
import { prisma } from "../db/client.js";
import { hashPassword, verifyPassword, createToken } from "../utils/security.js";
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
