import { TOUR_PACKAGES, type CategoryId, type TourPackage } from "../data/catalog";
import type { InterestId, PlannerAnswers } from "./planner";

/**
 * Milly AI tavsiya dvigateli.
 *
 * Muhim qoida: Milly AI o'zidan yangi tur o'ylab topmaydi — u faqat saytdagi
 * mavjud tur paketlarini (`src/data/catalog.ts`) ularning narxi bo'yicha
 * saralab tavsiya qiladi. Shu sababli bu modul tashqi AI modeliga umuman
 * bog'liq emas: GROQ/OPENAI kaliti bo'lmasa ham to'liq ishlaydi. Kalit
 * qo'yilganda esa natija o'zgarmaydi — kalit faqat javobning ohangini
 * (matnini) yozib beradi, tanlov esa shu narx algoritmida qoladi.
 */

/** Qiziqish → turkum mosligi (planner.ts dagi packFor bilan bir xil mantiq). */
const INTEREST_TO_CATEGORY: Record<InterestId, Exclude<CategoryId, "all">> = {
  history: "historical",
  craft: "craft",
  nature: "eco",
  food: "historical",
  pilgrimage: "pilgrimage",
  shopping: "craft",
};

export type RecommendInput = {
  /** Umumiy byudjet (USD). */
  budget?: number;
  /** Necha kishi uchun hisoblanadi. */
  travelers?: number;
  /** Necha kunlik sayohat rejalashtirilgan. */
  days?: number;
  /** Boshlanish shahri. */
  city?: string;
  interests?: InterestId[];
  /** Nechta paket qaytariladi (default 3). */
  limit?: number;
};

export type PackageRecommendation = {
  tour: TourPackage;
  /** 1 kishi uchun narx (katalogdagi `priceFrom`). */
  perPerson: number;
  /** Guruh uchun umumiy narx: `perPerson × travelers`. */
  total: number;
  /** Byudjet ichidami (byudjet ko'rsatilmagan bo'lsa `null`). */
  withinBudget: boolean | null;
  /** Byudjetdan qancha arzon/qimmat (musbat — arzon, manfiy — qimmat). */
  gap: number | null;
  score: number;
  /** Narxga asoslangan, foydalanuvchiga ko'rsatiladigan izoh. */
  reason: string;
};

const BADGE_WEIGHT: Record<TourPackage["badge"] & string, number> = {
  "Best Seller": 26,
  "Hot Deal": 18,
  New: 12,
};

/**
 * Hozirda eng yaxshi ketayotgan turlar: reyting, sharhlar soni va "Best
 * Seller"/"Hot Deal" nishonlari asosida. Hero karuseli va "mashhur turlar"
 * ro'yxatlari shu algoritmdan foydalanadi.
 */
export function topTours(limit = 5, pool: TourPackage[] = TOUR_PACKAGES): TourPackage[] {
  return [...pool]
    .map((tour) => ({
      tour,
      score:
        tour.rating * 18 +
        Math.min(tour.reviews, 500) / 12 +
        (tour.badge ? (BADGE_WEIGHT[tour.badge] ?? 0) : 0),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(1, Math.round(limit)))
    .map((row) => row.tour);
}

/** Paketni chat orqali serverga uzatish uchun ixcham ko'rinish. */
export type RecommendationContext = {
  slug: string;
  title: string;
  city: string;
  days: number;
  priceFrom: number;
  perPerson: number;
  total: number;
  reason: string;
};

/**
 * Mavjud tur paketlarini narx ustuvorligida saralaydi.
 *
 * Ball taqsimoti (jami ~100):
 *   - narx / byudjet mosligi — asosiy mezon (~55–85 ball),
 *   - byudjet ko'rsatilmasa — arzonroq paket biroz yuqori baholanadi,
 *   - shahar mosligi — +14,
 *   - qiziqish/turkum mosligi — +12,
 *   - kunlar mosligi — +10 gacha,
 *   - reyting va sharhlar — +8 gacha.
 */
export function recommendPackages(
  input: RecommendInput = {},
  pool: TourPackage[] = TOUR_PACKAGES,
): PackageRecommendation[] {
  const travelers = Math.max(1, Math.round(Number(input.travelers) || 2));
  const budget = Number(input.budget) > 0 ? Math.round(Number(input.budget)) : null;
  const days = Number(input.days) > 0 ? Math.round(Number(input.days)) : null;
  const city = typeof input.city === "string" && input.city.trim() ? input.city.trim() : null;
  const categories = new Set((input.interests ?? []).map((i) => INTEREST_TO_CATEGORY[i]));
  const limit = Math.max(1, Math.round(Number(input.limit) || 3));

  const cheapest = pool.reduce((min, tour) => Math.min(min, tour.priceFrom), Number.POSITIVE_INFINITY);

  const scored = pool.map((tour) => {
    const perPerson = tour.priceFrom;
    const total = perPerson * travelers;
    let score = 0;
    let reason = "";
    let gap: number | null = null;
    let withinBudget: boolean | null = null;

    if (budget) {
      const ratio = total / budget;
      gap = Math.round(budget - total);
      withinBudget = ratio <= 1;

      if (ratio <= 1) {
        // Byudjet ichida: byudjetni to'liqroq ishlatgan variant foydaliroq
        // (juda arzon paket "sifati past" bo'lishi mumkin), lekin chegara
        // hech qachon byudjetdan oshmaydi.
        score += 55 + 30 * ratio;
        reason =
          gap <= Math.max(10, Math.round(budget * 0.05))
            ? `Byudjetingizga to'liq mos: jami ~$${total} (byudjet $${budget})`
            : `Byudjetdan $${gap} arzon: $${perPerson}/kishi, jami ~$${total}`;
      } else {
        const over = ratio - 1;
        score += Math.max(0, 55 - over * 110);
        reason = `Byudjetdan $${Math.round(-gap)} qimmat: $${perPerson}/kishi, jami ~$${total}`;
      }
    } else {
      // Byudjet aytilmagan bo'lsa — arzon paketlar yuqorida turadi.
      const spread = Number.isFinite(cheapest) && cheapest > 0 ? cheapest / perPerson : 1;
      score += 55 + 30 * spread;
      reason = `$${perPerson}/kishi · ${tour.days} kun / ${tour.nights} kecha`;
    }

    const extras: string[] = [];

    if (city && tour.city.toLowerCase().includes(city.toLowerCase())) {
      score += 14;
      extras.push(`${city} bo'ylab`);
    }

    if (categories.has(tour.category)) {
      score += 12;
    }

    if (days) {
      const diff = Math.abs(tour.days - days);
      score += 10 * (1 - Math.min(1, diff / Math.max(days, 1)));
      if (tour.days === days) extras.push(`${days} kunlik`);
    }

    score += 6 * (tour.rating / 5) + 2 * Math.min(1, tour.reviews / 400);

    if (extras.length > 0) {
      reason = `${reason} · ${extras.join(", ")}`;
    }

    return { tour, perPerson, total, withinBudget, gap, score, reason };
  });

  return scored.sort((a, b) => b.score - a.score || a.total - b.total).slice(0, limit);
}

/** Planner javoblaridan tavsiya uchun kirish ma'lumotini yig'adi. */
export function recommendFromAnswers(
  answers: Partial<PlannerAnswers>,
  extra: { budget?: number; limit?: number } = {},
): PackageRecommendation[] {
  return recommendPackages({
    budget: extra.budget ?? answers.budget,
    travelers: answers.travelers,
    days: answers.days,
    city: answers.city,
    interests: answers.interests,
    limit: extra.limit,
  });
}

/** Serverga (AI modeliga) uzatiladigan kontekst — faqat mavjud paketlar. */
export function toRecommendationContext(
  recommendations: PackageRecommendation[],
): RecommendationContext[] {
  return recommendations.map(({ tour, perPerson, total, reason }) => ({
    slug: tour.slug,
    title: tour.title,
    city: tour.city,
    days: tour.days,
    priceFrom: tour.priceFrom,
    perPerson,
    total,
    reason,
  }));
}

/** AI modeli ulanmagan holat uchun tayyor matn (narxga asoslangan). */
export function recommendationReply(
  recommendations: PackageRecommendation[],
  input: RecommendInput = {},
): string {
  if (recommendations.length === 0) {
    return "Hozircha katalogda mos tur paket topilmadi — shahar va kunlar sonini o'zgartirib ko'ring.";
  }
  const travelers = Math.max(1, Math.round(Number(input.travelers) || 2));
  const lines = recommendations.map(
    (r, index) => `${index + 1}. ${r.tour.title} — ${r.reason}`,
  );
  return (
    `Katalogdagi mavjud tur paketlardan ${travelers} kishi uchun eng mos variantlar ` +
    `(narx bo'yicha saralandi):\n\n${lines.join("\n")}\n\n` +
    "Batafsil ma'lumot «Tur paketlar» bo'limida. Xohlasangiz, dasturni ham tuzib beraman."
  );
}
