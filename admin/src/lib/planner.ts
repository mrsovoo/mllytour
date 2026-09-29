import { CITY_SPOTS, TOUR_PACKAGES, type CitySpot } from "../data/catalog";

/**
 * AI Planner uchun umumiy tiplar va qoidaga asoslangan zaxira generatori.
 * Bu modul ham frontendda (chat oqimi, natijani ko'rsatish), ham backendda
 * action ichida (AI javob bermasa) ishlatiladi.
 */

export type InterestId = "history" | "craft" | "nature" | "food" | "pilgrimage" | "shopping";

export const INTEREST_OPTIONS: { id: InterestId; label: string }[] = [
  { id: "history", label: "Tarix va me'morchilik" },
  { id: "craft", label: "Hunarmandchilik" },
  { id: "nature", label: "Tabiat va ekoturizm" },
  { id: "food", label: "Gastronomiya" },
  { id: "pilgrimage", label: "Ziyorat" },
  { id: "shopping", label: "Bozor va xarid" },
];

export type Pace = "relaxed" | "balanced" | "intense";

export type PlannerAnswers = {
  city: string;
  days: number;
  travelers: number;
  budget: number;
  interests: InterestId[];
  pace: Pace;
  language: "uz" | "ru" | "en";
  startDate?: string;
  /** Mijozning "kamchilik bor" javobidan kelgan istaklar. */
  feedback?: string;
};

export type PlanItem = {
  time: string;
  title: string;
  note: string;
  kind: string;
};

export type PlanDay = {
  day: number;
  city: string;
  title: string;
  lodging: string;
  spend: number;
  items: PlanItem[];
};

export type Plan = {
  title: string;
  summary: string;
  cities: string[];
  days: PlanDay[];
  estimate: {
    total: number;
    perPerson: number;
    currency: "USD";
    withinBudget: boolean;
    breakdown: { label: string; amount: number }[];
  };
  tips: string[];
  pack: string[];
};

const KIND_TO_INTEREST: Record<CitySpot["kind"], InterestId> = {
  meros: "history",
  madaniyat: "history",
  tabiat: "nature",
  gastro: "food",
  bozor: "shopping",
  hunarmand: "craft",
  ziyorat: "pilgrimage",
};

const ROUTES: Record<string, string[]> = {
  Toshkent: ["Toshkent", "Samarqand"],
  Samarqand: ["Samarqand", "Shahrisabz"],
  Buxoro: ["Buxoro", "Samarqand"],
  Xiva: ["Xiva", "Nurota"],
  "Farg'ona": ["Farg'ona", "Toshkent"],
  Shahrisabz: ["Shahrisabz", "Samarqand"],
  Nurota: ["Nurota", "Buxoro"],
  Termiz: ["Termiz", "Shahrisabz"],
};

const SLOTS = ["09:00", "11:00", "13:30", "15:30", "17:30", "19:30"];

const LODGING_TIERS = [
  { label: "3* mehmonxona", price: 38 },
  { label: "4* mehmonxona", price: 62 },
  { label: "Butik mehmonxona", price: 95 },
];

export const PACE_ITEMS: Record<Pace, number> = {
  relaxed: 3,
  balanced: 4,
  intense: 5,
};

export function normalizeAnswers(
  raw: Partial<PlannerAnswers> | Record<string, unknown>,
): PlannerAnswers {
  const input = raw as Partial<PlannerAnswers>;
  const city = typeof input.city === "string" && input.city.length > 0 ? input.city : "Samarqand";
  return {
    city,
    days: Math.min(14, Math.max(1, Math.round(Number(input.days) || 3))),
    travelers: Math.min(12, Math.max(1, Math.round(Number(input.travelers) || 2))),
    budget: Math.max(80, Math.round(Number(input.budget) || 800)),
    interests:
      Array.isArray(input.interests) && input.interests.length > 0
        ? (input.interests.filter((i) =>
            INTEREST_OPTIONS.some((o) => o.id === i),
          ) as InterestId[])
        : ["history", "food"],
    pace: input.pace === "relaxed" || input.pace === "intense" ? input.pace : "balanced",
    language: input.language === "ru" || input.language === "en" ? input.language : "uz",
    startDate: typeof input.startDate === "string" ? input.startDate : undefined,
    feedback:
      typeof input.feedback === "string" && input.feedback.trim().length > 0
        ? input.feedback.trim().slice(0, 400)
        : undefined,
  };
}

function spotsFor(city: string, interests: InterestId[], wanted: number): CitySpot[] {
  const pool = CITY_SPOTS[city] ?? CITY_SPOTS.Samarqand;
  const scored = pool
    .map((spot, index) => ({
      spot,
      score: interests.includes(KIND_TO_INTEREST[spot.kind]) ? 1 : 0,
      index,
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index);
  const picked = scored.slice(0, wanted).map((s) => s.spot);
  return picked.length > 0 ? picked : pool.slice(0, wanted);
}

function durationOf(spot: CitySpot) {
  const parts = spot.hours.split("·");
  return parts[1]?.trim() ?? "1 soat";
}

function packFor(city: string, interests: InterestId[]): string[] {
  const slugs = TOUR_PACKAGES.filter((t) => t.city.includes(city)).map((t) => t.slug);
  const byInterest: Record<InterestId, string> = {
    history: "historical",
    craft: "craft",
    nature: "eco",
    food: "historical",
    pilgrimage: "pilgrimage",
    shopping: "craft",
  };
  const extra = TOUR_PACKAGES.filter((t) =>
    interests.some((i) => t.category === byInterest[i]),
  ).map((t) => t.slug);
  return Array.from(new Set([...slugs, ...extra])).slice(0, 3);
}

/**
 * AI Planner har safar 2 xil taklif beradi (1-variant: komfort, 2-variant: tejamkor).
 * Foydalanuvchi birini tanlaydi, fikr bildiradi yoki tasdiqlab bron qiladi.
 */
export type PlanVariantId = "comfort" | "economy";

export const PLAN_VARIANT_META: {
  id: PlanVariantId;
  label: string;
  tagline: string;
  emoji: string;
}[] = [
  {
    id: "comfort",
    label: "1-variant",
    tagline: "Komfort — qulay mehmonxona, muvozanatli sur'at",
    emoji: "🏨",
  },
  {
    id: "economy",
    label: "2-variant",
    tagline: "Tejamkor — ko'proq shahar va nuqta, arzon turar joy",
    emoji: "💸",
  },
];

type VariantConfig = {
  id: PlanVariantId;
  label: string;
  tagline: string;
  /** Turar joy darajasini qancha pasaytirish. */
  lodgingShift: number;
  /** Kunlik nuqtalar sonini qancha o'zgartirish. */
  paceShift: number;
  /** Ikkinchi shaharga qaysi kundan o'tiladi (0..1). */
  citySplit: number;
};

const VARIANTS: Record<PlanVariantId, VariantConfig> = {
  comfort: {
    id: "comfort",
    label: "1-variant",
    tagline: "Komfort dastur",
    lodgingShift: 0,
    paceShift: 0,
    citySplit: 0.55,
  },
  economy: {
    id: "economy",
    label: "2-variant",
    tagline: "Tejamkor dastur",
    lodgingShift: -1,
    paceShift: 1,
    citySplit: 0.35,
  },
};

export function buildRuleBasedPlanWithVariant(
  raw: Partial<PlannerAnswers> | Record<string, unknown>,
  variantId: PlanVariantId = "comfort",
): Plan {
  const variant = VARIANTS[variantId];
  const answers = normalizeAnswers(raw);
  const route = ROUTES[answers.city] ?? [answers.city];
  const perDayBudget = answers.budget / answers.days / answers.travelers;

  const baseTier =
    perDayBudget > 150 ? 2 : perDayBudget > 90 ? 1 : 0;
  const lodging = LODGING_TIERS[Math.max(0, Math.min(2, baseTier + variant.lodgingShift))];

  const itemCount = Math.max(2, Math.min(6, PACE_ITEMS[answers.pace] + variant.paceShift));

  const days: PlanDay[] = [];
  for (let index = 0; index < answers.days; index += 1) {
    const share = answers.days > 1 ? index / (answers.days - 1) : 0;
    const city = route.length > 1 && share > variant.citySplit ? route[1] : route[0];
    const spots = spotsFor(city, answers.interests, itemCount);
    const items: PlanItem[] = spots.map((spot, i) => ({
      time: SLOTS[i] ?? "19:30",
      title: spot.name,
      note: `${durationOf(spot)} · ${spot.note}`,
      kind: spot.kind,
    }));
    days.push({
      day: index + 1,
      city,
      title:
        index === 0
          ? `${city} bilan tanishuv`
          : `${city} — ${items[0]?.title ?? "erkin vaqt"}`,
      lodging: lodging.label,
      spend: Math.round(perDayBudget * 0.9 + 20),
      items,
    });
  }

  const rooms = Math.ceil(answers.travelers / 2);
  const lodgingTotal = lodging.price * Math.max(0, answers.days - 1) * rooms;
  const food = 28 * answers.travelers * answers.days;
  const transport = 20 * answers.travelers * answers.days;
  const tickets = 12 * answers.travelers * answers.days;
  const guide = 45 * answers.days;
  const rawTotal = lodgingTotal + food + transport + tickets + guide;

  /*
   * Byudjet qoidasi: 1-variant (komfort) byudjetning 80–97% oralig'ida,
   * 2-variant (tejamkor) 45–70% oralig'ida chiqadi — mijoz byudjeti ichida
   * qoladi, lekin shubhali arzon ko'rinmaydi. Taqsimot bir xil ulushda
   * siqiladi, gid ulushi yaxlitlikni saqlaydi.
   */
  const band = variantId === "economy" ? { lo: 0.45, hi: 0.7 } : { lo: 0.8, hi: 0.97 };
  const target = Math.min(
    Math.round(answers.budget * band.hi),
    Math.max(Math.round(answers.budget * band.lo), rawTotal),
  );
  const factor = rawTotal > 0 ? target / rawTotal : 1;
  const sLodging = Math.round(lodgingTotal * factor);
  const sFood = Math.round(food * factor);
  const sTransport = Math.round(transport * factor);
  const sTickets = Math.round(tickets * factor);
  const sGuide = Math.max(20, target - sLodging - sFood - sTransport - sTickets);
  const total = sLodging + sFood + sTransport + sTickets + sGuide;

  const cities = Array.from(new Set(days.map((d) => d.city)));
  const interestsLabel = answers.interests
    .map((i) => INTEREST_OPTIONS.find((o) => o.id === i)?.label ?? i)
    .slice(0, 3)
    .join(", ");

  return {
    title: `${variant.label}: ${cities.join(" va ")} — ${answers.days} kunlik dastur`,
    summary:
      `${variant.tagline} · ${answers.travelers} kishi uchun ${interestsLabel} yo'nalishida tuzilgan marshrut.${
        answers.startDate ? ` Boshlanish sanasi: ${answers.startDate}.` : ""
      } Turar joy darajasi: ${lodging.label}, kuniga ${itemCount} nuqta.${
        answers.feedback ? ` Sizning istaklaringiz: «${answers.feedback}».` : ""
      }`,
    cities,
    days,
    estimate: {
      total,
      perPerson: Math.round(total / answers.travelers),
      currency: "USD",
      withinBudget: total <= answers.budget,
      breakdown: [
        {
          label: `Turar joy (${lodging.label}) × ${Math.max(0, answers.days - 1)} kecha`,
          amount: sLodging,
        },
        { label: `Ovqatlanish × ${answers.travelers} kishi`, amount: sFood },
        { label: "Shahar ichida transport", amount: sTransport },
        { label: "Muzey va obida chiptalari", amount: sTickets },
        { label: "Gid xizmati", amount: sGuide },
      ],
    },
    tips: [
      "Obidalar 09:00–10:00 oralig'ida kam odam bo'ladi — surat uchun eng yaxshi vaqt.",
      "Naqd so'm ham, karta ham olib yuring; bozorlarda naqd qulay.",
      "Yozda 14:00–16:00 eng issiq vaqt — bu oraliqda choyxona yoki muzeyni tanlang.",
      `Buyurtmani saytda bekor qilish 24 soat ichida bepul${
        answers.budget < total ? "; byudjetga moslash uchun 2-variantni tanlang" : ""
      }.`,
    ],
    pack: packFor(answers.city, answers.interests),
  };
}

/** Bitta variantni olish (eski nom bilan moslik). */
export function buildRuleBasedPlan(
  raw: Partial<PlannerAnswers> | Record<string, unknown>,
): Plan {
  return buildRuleBasedPlanWithVariant(raw, "comfort");
}

/** Har doim 2 xil taklif: komfort va tejamkor. */
export function buildRuleBasedPlans(
  raw: Partial<PlannerAnswers> | Record<string, unknown>,
): Plan[] {
  return PLAN_VARIANT_META.map((variant) =>
    buildRuleBasedPlanWithVariant(raw, variant.id),
  );
}

/** AI promptiga qo'shiladigan mavjud tur paketlari slug'lari. */
export const TOUR_SLUG_HINT: string[] = TOUR_PACKAGES.map((t) => t.slug);

/** Chat oqimidagi savollar — widget ham, sahifa ham shu ro'yxatdan foydalanadi. */
export type PlanQuestion = {
  id: keyof PlannerAnswers;
  prompt: string;
  hint?: string;
  type: "city" | "days" | "travelers" | "budget" | "interests" | "pace";
  options?: { value: string; label: string }[];
};

export const PLAN_QUESTIONS: PlanQuestion[] = [
  {
    id: "city",
    prompt: "Qaysi shahardan boshlaymiz?",
    hint: "Marshrut shu shahar atrofidan tuziladi.",
    type: "city",
  },
  {
    id: "days",
    prompt: "Sayohat necha kun bo'ladi?",
    type: "days",
    options: [
      { value: "2", label: "2 kun" },
      { value: "3", label: "3 kun" },
      { value: "5", label: "5 kun" },
      { value: "7", label: "7 kun" },
      { value: "9", label: "9 kun" },
    ],
  },
  {
    id: "travelers",
    prompt: "Nechki kishi sayohat qiladi?",
    type: "travelers",
    options: [
      { value: "1", label: "1 kishi" },
      { value: "2", label: "2 kishi" },
      { value: "4", label: "4 kishi" },
      { value: "6", label: "6 kishi" },
    ],
  },
  {
    id: "interests",
    prompt: "Nimalarga qiziqasiz?",
    hint: "Bir nechtasini tanlashingiz mumkin.",
    type: "interests",
  },
  {
    id: "pace",
    prompt: "Sayohat sur'ati qanday bo'lsin?",
    type: "pace",
    options: [
      { value: "relaxed", label: "Sokin — kuniga 3 nuqta" },
      { value: "balanced", label: "Muvozanatli — 4 nuqta" },
      { value: "intense", label: "To'yingan — 5 nuqta" },
    ],
  },
  {
    id: "budget",
    prompt: "Umumiy byudjet qancha (USD)?",
    hint: "Turar joy, transport va gid hisobga olinadi.",
    type: "budget",
    options: [
      { value: "400", label: "$400" },
      { value: "800", label: "$800" },
      { value: "1500", label: "$1500" },
      { value: "3000", label: "$3000" },
    ],
  },
];
