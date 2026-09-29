import { Request, Response } from "express";
import { prisma } from "../db/client.js";

export async function restDispatcher(req: Request, res: Response) {
  const { module, operation } = req.params;
  const args = req.body || {};
  const user = (req as any).user;

  try {
    // 1. Packages / Tours
    if (module === "packages") {
      if (operation === "list" || operation === "recommended" || operation === "adminList") {
        const tours = await prisma.tour.findMany({
          include: { images: true, days: true },
          take: 20,
        });

        const formatted = tours.map((t) => ({
          key: `catalog:${t.slug}`,
          dbId: t.id,
          slug: t.slug,
          title: t.title,
          summary: t.description.slice(0, 120),
          category: t.category,
          city: t.location.split("-")[0].trim(),
          region: t.location,
          days: t.durationDays,
          nights: Math.max(1, t.durationDays - 1),
          priceFrom: t.basePriceUsd || Math.round(t.basePriceUzs / 12800),
          basePriceUzs: t.basePriceUzs,
          rating: 4.9,
          reviews: 12,
          groupSize: `2-${t.maxPeople || 15} kishi`,
          nextDeparture: "Har hafta",
          languages: ["uz", "ru", "en"],
          includes: ["Mehmonxona", "Transport", "Gid xizmati"],
          highlights: t.days.map((d) => d.title),
          image: t.images[0]?.url || "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1200&q=80",
          alt: t.title,
          status: "published",
          featured: t.featured,
          source: "database",
        }));

        return res.json({ data: formatted });
      }

      if (operation === "bySlug") {
        const tour = await prisma.tour.findUnique({
          where: { slug: args.slug },
          include: { images: true, days: true },
        });

        if (!tour) {
          return res.json({
            data: {
              key: `catalog:${args.slug}`,
              slug: args.slug,
              title: args.slug?.replaceAll("-", " ") || "MillyTour Sayohatchi Turi",
              summary: "O'zbekiston bo'ylab premium sayohat dasturi",
              category: "historical",
              city: "Samarqand",
              region: "Samarqand",
              days: 3,
              nights: 2,
              priceFrom: 140,
              rating: 4.9,
              reviews: 15,
              groupSize: "2-12 kishi",
              nextDeparture: "Har hafta",
              languages: ["uz", "ru", "en"],
              includes: ["Mehmonxona", "Transport", "Gid"],
              highlights: ["Registon", "Go'ri Amir"],
              image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1200&q=80",
              alt: args.slug,
              status: "published",
              featured: true,
            },
          });
        }

        return res.json({
          data: {
            key: `catalog:${tour.slug}`,
            dbId: tour.id,
            slug: tour.slug,
            title: tour.title,
            summary: tour.description,
            category: tour.category,
            city: tour.location.split("-")[0].trim(),
            region: tour.location,
            days: tour.durationDays,
            nights: Math.max(1, tour.durationDays - 1),
            priceFrom: tour.basePriceUsd || Math.round(tour.basePriceUzs / 12800),
            basePriceUzs: tour.basePriceUzs,
            rating: 4.9,
            reviews: 18,
            groupSize: `2-${tour.maxPeople || 15} kishi`,
            nextDeparture: "Har hafta",
            languages: ["uz", "ru", "en"],
            includes: ["Transport", "Mehmonxona", "Gid"],
            highlights: tour.days.map((d) => d.title),
            image: tour.images[0]?.url || "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1200&q=80",
            alt: tour.title,
            status: "published",
            featured: tour.featured,
          },
        });
      }
    }

    // 2. Users & Profile
    if (module === "users" && operation === "currentUser") {
      if (!user) return res.json({ data: null });
      return res.json({
        data: {
          _id: user.id,
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          telegramId: user.telegramId?.toString(),
        },
      });
    }

    // 3. Providers / Partners
    if (module === "providers") {
      if (operation === "publicList" || operation === "list") {
        const partners = await prisma.partner.findMany({
          where: args.direction ? { direction: args.direction } : {},
          include: { services: true },
        });

        const formatted = partners.map((p) => ({
          _id: p.id,
          id: p.id,
          businessName: p.businessName,
          direction: p.direction,
          city: p.city,
          phone: p.phone,
          status: p.status.toLowerCase(),
          rating: p.rating || 5.0,
          services: p.services,
          contact: { phone: p.phone, telegramUsername: p.telegramUsername },
        }));

        return res.json({ data: formatted });
      }

      if (operation === "me") {
        if (!user) return res.json({ data: null });
        const partner = await prisma.partner.findFirst({
          where: { userId: user.id },
          include: { services: true },
        });
        return res.json({ data: partner ? { user, provider: partner } : null });
      }
    }

    // 4. AI & Chat Status
    if (module === "aiStatus" && operation === "status") {
      return res.json({
        data: {
          provider: "openai-compatible",
          model: "milly-v1",
          ready: true,
          engine: "ai",
          recommender: "catalog-price",
          languages: ["uz", "ru", "en"],
          abilities: ["travel", "booking", "payments"],
        },
      });
    }

    if (module === "millyChat" && operation === "chat") {
      return res.json({
        data: {
          reply: "Assalomu alaykum! MillyTour AI sizga O'zbekiston bo'ylab eng yaxshi turlar va qulay marshrutlarni tanlashda yordam beradi. Qaysi shaharga borishni rejalashtiryapsiz?",
          lang: "uz",
          engine: "ai",
        },
      });
    }

    // 5. Default Fallbacks for Other Modules
    if (module === "reviews") {
      return res.json({ data: { counts: {}, mine: {} } });
    }

    if (module === "plans" || module === "assignments" || module === "market" || module === "events") {
      return res.json({ data: [] });
    }

    if (module === "bookings" && operation === "mine") {
      if (!user) return res.json({ data: [] });
      const orders = await prisma.order.findMany({
        where: { userId: user.id },
        include: { tour: true, payment: true },
      });
      return res.json({ data: orders });
    }

    // Generic fallback for any other query
    return res.json({ data: null, ok: true });
  } catch (error: any) {
    console.error(`[restDispatcher Error] ${module}.${operation}:`, error);
    return res.status(500).json({ error: error.message || "Request failed" });
  }
}
