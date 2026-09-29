import type { Request, Response } from "express";
import { prisma } from "../db/client.js";
import { hashPassword, verifyPassword, createToken } from "../utils/security.js";
import { successResponse, errorResponse } from "../utils/response.js";

export async function adminLogin(req: Request, res: Response) {
  try {
    const { username, password } = req.body;
    let admin = await prisma.adminUser.findUnique({ where: { username } });

    const envAdminUser = process.env.ADMIN_USERNAME || "millytour-adm";
    const envAdminPass = process.env.ADMIN_PASSWORD || "millytour-sovo";

    // Agar Railway env'da ko'rsatilgan admin bo'lsa va hali bazada yo'q bo'lsa yoki paroli o'zgargan bo'lsa
    if (username === envAdminUser && password === envAdminPass) {
      if (!admin) {
        admin = await prisma.adminUser.create({
          data: {
            username: envAdminUser,
            passwordHash: hashPassword(envAdminPass),
            fullName: "MillyTour Admin",
            role: "SUPER_ADMIN",
          },
        });
      } else if (!verifyPassword(password, admin.passwordHash)) {
        admin = await prisma.adminUser.update({
          where: { id: admin.id },
          data: { passwordHash: hashPassword(envAdminPass) },
        });
      }
    }

    // Agar baza bo'sh bo'lsa, zaxira default admin (admin / admin123) ni yaratamiz
    if (!admin && username === "admin") {
      admin = await prisma.adminUser.create({
        data: {
          username: "admin",
          passwordHash: hashPassword("admin123"),
          fullName: "Bosh Administrator",
          role: "SUPER_ADMIN",
        },
      });
    }

    if (!admin || !verifyPassword(password, admin.passwordHash)) {
      return errorResponse(res, "Login yoki parol noto'g'ri", "UNAUTHORIZED", 401);
    }

    const token = createToken({
      id: admin.id,
      username: admin.username,
      role: admin.role,
    });

    res.cookie("millytour_admin_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    await prisma.auditLog.create({
      data: {
        adminId: admin.id,
        adminUsername: admin.username,
        action: "ADMIN_LOGIN",
        targetType: "AdminUser",
        targetId: admin.id,
        details: "Admin tizimiga muvaffaqiyatli kirdi",
        ipAddress: req.ip,
      },
    });

    return successResponse(res, {
      admin: {
        id: admin.id,
        username: admin.username,
        role: admin.role,
        fullName: admin.fullName,
      },
      token,
    });
  } catch (err: any) {
    return errorResponse(res, err.message || "Admin login xatosi");
  }
}

export async function adminMe(req: Request, res: Response) {
  if (!req.admin) {
    return errorResponse(res, "Admin sessiyasi topilmadi", "UNAUTHORIZED", 401);
  }
  return successResponse(res, { admin: req.admin });
}

export async function getAdminDashboard(_req: Request, res: Response) {
  try {
    const totalUsers = await prisma.user.count();
    const totalPartners = await prisma.partner.count();
    const pendingPartners = await prisma.partner.count({ where: { status: "PENDING" } });
    const totalTours = await prisma.tour.count();
    const totalOrders = await prisma.order.count();

    const paidPayments = await prisma.payment.findMany({
      where: { status: "PAID" },
      select: { amount: true },
    });
    const totalRevenue = paidPayments.reduce((acc, p) => acc + p.amount, 0);

    return successResponse(res, {
      totalUsers,
      totalPartners,
      pendingPartners,
      totalTours,
      totalOrders,
      totalRevenue,
    });
  } catch (err: any) {
    return errorResponse(res, err.message || "Dashboard ma'lumotlarini yuklashda xatolik");
  }
}

export async function getAdminUsers(_req: Request, res: Response) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        country: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return successResponse(res, users);
  } catch (err: any) {
    return errorResponse(res, err.message);
  }
}

export async function getAdminPartners(req: Request, res: Response) {
  try {
    const { status, direction } = req.query;
    const where: any = {};
    if (status && status !== "all") where.status = String(status).toUpperCase();
    if (direction && direction !== "all") where.direction = String(direction);

    const partners = await prisma.partner.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    const formatted = partners.map((p) => ({
      _id: p.id,
      id: p.id,
      businessName: p.businessName,
      phone: p.phone,
      city: p.city,
      direction: p.direction,
      status: p.status.toLowerCase(),
      subscription: "active",
      rating: p.rating,
      ratingCount: p.ratingCount,
      completedOrders: p.completedOrders,
      telegramUsername: p.telegramUsername,
      monthlyFee: p.monthlyFee,
    }));

    return successResponse(res, formatted);
  } catch (err: any) {
    return errorResponse(res, err.message);
  }
}

export async function updatePartnerStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status, providerId } = req.body;
    const targetId = id || providerId;

    const partner = await prisma.partner.update({
      where: { id: targetId },
      data: { status: String(status).toUpperCase() as any },
    });

    await prisma.auditLog.create({
      data: {
        adminUsername: req.admin?.username || "admin",
        action: "UPDATE_PARTNER_STATUS",
        targetType: "Partner",
        targetId,
        details: `Hamkor holati o'zgartirildi: ${status}`,
        ipAddress: req.ip,
      },
    });

    return successResponse(res, partner);
  } catch (err: any) {
    return errorResponse(res, err.message);
  }
}

export async function updatePartnerSubscription(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { providerId, months } = req.body;
    const targetId = id || providerId;

    await prisma.auditLog.create({
      data: {
        adminUsername: req.admin?.username || "admin",
        action: "EXTEND_SUBSCRIPTION",
        targetType: "Partner",
        targetId,
        details: `Obuna uzaytirildi: ${months || 1} oy`,
        ipAddress: req.ip,
      },
    });

    return successResponse(res, { ok: true, message: "Obuna uzaytirildi" });
  } catch (err: any) {
    return errorResponse(res, err.message);
  }
}

export async function getAdminPayments(req: Request, res: Response) {
  try {
    const { status, provider } = req.query;
    const where: any = {};
    if (status && status !== "all") where.status = String(status).toUpperCase();
    if (provider && provider !== "all") where.provider = String(provider).toUpperCase();

    const payments = await prisma.payment.findMany({
      where,
      include: {
        order: { select: { customerName: true, orderNumber: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = payments.map((p) => ({
      id: p.id,
      orderId: p.order?.orderNumber || p.orderId,
      provider: p.provider.toLowerCase(),
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      customerName: p.order?.customerName,
      createdAt: p.createdAt.toISOString(),
      paidAt: p.paidAt?.toISOString(),
    }));

    return successResponse(res, formatted);
  } catch (err: any) {
    return errorResponse(res, err.message);
  }
}

export async function getAdminPartnerEarnings(_req: Request, res: Response) {
  try {
    const earnings = await prisma.partnerEarning.findMany({
      include: {
        partner: { select: { businessName: true } },
        order: { select: { orderNumber: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = earnings.map((e) => ({
      id: e.id,
      partnerId: e.partnerId,
      partnerName: e.partner?.businessName,
      orderId: e.order?.orderNumber || e.orderId,
      grossAmount: e.grossAmount,
      commissionRate: e.commissionRate,
      commissionAmount: e.commissionAmount,
      netAmount: e.netAmount,
      currency: e.currency,
      status: e.status,
      createdAt: e.createdAt.toISOString(),
    }));

    return successResponse(res, formatted);
  } catch (err: any) {
    return errorResponse(res, err.message);
  }
}

export async function getAdminAuditLogs(_req: Request, res: Response) {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return successResponse(res, logs);
  } catch (err: any) {
    return errorResponse(res, err.message);
  }
}
