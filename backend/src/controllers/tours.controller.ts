import type { Request, Response } from "express";
import { prisma } from "../db/client.js";
import { successResponse, errorResponse } from "../utils/response.js";

export async function listTours(req: Request, res: Response) {
  try {
    const { category, location, featured, search } = req.query;

    const where: any = { isActive: true };
    if (category && category !== "all") where.category = String(category);
    if (location && location !== "all") where.location = { contains: String(location), mode: "insensitive" };
    if (featured === "true") where.featured = true;
    if (search) {
      where.OR = [
        { title: { contains: String(search), mode: "insensitive" } },
        { description: { contains: String(search), mode: "insensitive" } },
        { location: { contains: String(search), mode: "insensitive" } },
      ];
    }

    const tours = await prisma.tour.findMany({
      where,
      include: {
        images: { orderBy: { orderIndex: "asc" } },
        days: { orderBy: { dayNumber: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });

    return successResponse(res, tours);
  } catch (err: any) {
    return errorResponse(res, err.message || "Turlarni yuklashda xatolik");
  }
}

export async function getTourById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const tour = await prisma.tour.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        images: { orderBy: { orderIndex: "asc" } },
        days: { orderBy: { dayNumber: "asc" } },
        reviews: {
          include: {
            user: { select: { name: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!tour) {
      return errorResponse(res, "Tur topilmadi", "NOT_FOUND", 404);
    }

    return successResponse(res, tour);
  } catch (err: any) {
    return errorResponse(res, err.message || "Turni yuklashda xatolik");
  }
}

export async function createTour(req: Request, res: Response) {
  try {
    const { title, slug, description, location, durationDays, basePriceUzs, category, images, days } = req.body;

    const tour = await prisma.tour.create({
      data: {
        title,
        slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        description,
        location,
        durationDays: Number(durationDays || 1),
        basePriceUzs: Number(basePriceUzs),
        category: category || "classic",
        images: images?.length ? { create: images } : undefined,
        days: days?.length ? { create: days } : undefined,
      },
      include: { images: true, days: true },
    });

    return successResponse(res, tour, 201);
  } catch (err: any) {
    return errorResponse(res, err.message || "Tur yaratishda xatolik");
  }
}
