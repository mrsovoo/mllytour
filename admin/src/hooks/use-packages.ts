import { useRestQuery } from "@/api/client";
import { TOUR_PACKAGES, type TourPackage } from "@/data/catalog";

/**
 * Tur paketlar bazadan o'qiladi (administrator narx/badge/holatni boshqaradi).
 * Baza hali to'ldirilmagan bo'lsa, `src/data/catalog.ts` dagi statik katalog
 * ko'rsatiladi — sayt hech qachon bo'sh chiqmaydi.
 */

export type PackageView = Omit<TourPackage, "id"> & {
  id: string;
  key: string;
  dbId: string | null;
  status: string;
  featured: boolean;
};

function fromStatic(tour: TourPackage): PackageView {
  return {
    ...tour,
    id: tour.id,
    key: `catalog:${tour.slug}`,
    dbId: null,
    status: "published",
    featured: Boolean(tour.badge),
  };
}

export function usePackages(args?: {
  category?: string;
  city?: string;
  q?: string;
  limit?: number;
}) {
  const queryArgs: Record<string, string | number> = {};
  if (args?.category && args.category !== "all") {
    queryArgs.category = args.category;
  }
  if (args?.city) {
    queryArgs.city = args.city;
  }
  if (args?.q) {
    queryArgs.q = args.q;
  }
  if (args?.limit) {
    queryArgs.limit = args.limit;
  }

  const rows = useRestQuery("packages", "list", queryArgs);
  const isLoading = rows === undefined;

  const packages: PackageView[] = (rows ?? []).map((row) => ({
    id: row.slug,
    key: row.key,
    dbId: row.dbId,
    slug: row.slug,
    category: row.category,
    badge: row.badge,
    title: row.title,
    summary: row.summary,
    city: row.city,
    region: row.region,
    days: row.days,
    nights: row.nights,
    priceFrom: row.priceFrom,
    oldPrice: row.oldPrice,
    rating: row.rating,
    reviews: row.reviews,
    groupSize: row.groupSize,
    nextDeparture: row.nextDeparture,
    languages: row.languages,
    includes: row.includes,
    highlights: row.highlights,
    image: row.image,
    alt: row.alt,
    status: row.status,
    featured: row.featured,
  }));

  // Backend javobi kelgunicha statik katalog ko'rsatiladi — sahifa hech qachon
  // bo'sh ko'rinmaydi (sekin/uzilgan tarmoqda ham paketlar ko'rinib turadi).
  if (isLoading || packages.length === 0) {
    return {
      packages: TOUR_PACKAGES.map(fromStatic),
      isLoading,
      live: false,
      staticCatalog: TOUR_PACKAGES,
    };
  }

  return {
    packages,
    isLoading: false,
    live: packages.some((p) => p.dbId !== null),
    staticCatalog: TOUR_PACKAGES,
  };
}

/** Bitta paketni slug bo'yicha olish (baza → statik fallback). */
export function usePackage(slug: string | undefined) {
  const row = useRestQuery("packages", "bySlug", slug ? { slug } : {}, Boolean(slug));
  if (!slug) {
    return { pkg: null, isLoading: false };
  }
  if (row === undefined) {
    const fallback = TOUR_PACKAGES.find((t) => t.slug === slug);
    return {
      pkg: fallback ? fromStatic(fallback) : null,
      isLoading: true,
    };
  }
  if (row === null) {
    const fallback = TOUR_PACKAGES.find((t) => t.slug === slug);
    return { pkg: fallback ? fromStatic(fallback) : null, isLoading: false };
  }
  return {
    pkg: {
      ...row,
      id: row.slug,
      key: row.key,
      dbId: row.dbId,
      status: row.status,
      featured: row.featured,
    } as PackageView,
    isLoading: false,
  };
}
