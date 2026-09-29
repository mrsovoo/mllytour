import type { TourPackage } from "@/data/catalog";

/**
 * Tur paket va yo'nalish turlarini ajratish.
 *
 * - **Tur paket** — bitta shaharga (yoki bitta hududga) qaratilgan tur.
 * - **Yo'nalish** — 2-3 shaharni birlashtirgan katta tur. Katalogda bunday
 *   paketlarning `city` maydoni shaharlarni `·` bilan sanab yozadi, masalan
 *   `"Toshkent · Samarqand · Buxoro"` — shu belgi asosida aniqlanadi.
 */

export type TourKind = "package" | "direction";

/** Katalogda shaharlar ajratgichi. */
export const CITY_SEPARATOR = "·";

/** Turdagi shaharlar ro'yxati (`["Toshkent", "Samarqand"]`). */
export function tourCities(tour: TourPackage): string[] {
  return tour.city
    .split(CITY_SEPARATOR)
    .map((city) => city.trim())
    .filter(Boolean);
}

/** Tur bir nechta shaharni birlashtiradimi? */
export function isDirection(tour: TourPackage): boolean {
  return tourCities(tour).length > 1;
}

/** Tur turi: `package` (bitta shahar) yoki `direction` (2-3 shahar). */
export function tourKind(tour: TourPackage): TourKind {
  return isDirection(tour) ? "direction" : "package";
}

/** Shaharlar soni — kartochkadagi nishon uchun. */
export function cityCount(tour: TourPackage): number {
  return tourCities(tour).length;
}

/** Kartochkadagi manzil satri: `Samarqand · Samarqand viloyati`. */
export function tourAddress(tour: TourPackage): string {
  return isDirection(tour) ? tourCities(tour).join(" · ") : `${tour.city} · ${tour.region}`;
}

export const TOUR_KINDS: { id: TourKind; label: string; short: string; hint: string }[] = [
  {
    id: "package",
    label: "Tur paketlar",
    short: "Tur paket",
    hint: "Bitta shahar yoki hududga qaratilgan tayyor paketlar",
  },
  {
    id: "direction",
    label: "Yo'nalishlar",
    short: "Yo'nalish",
    hint: "2-3 shaharni birlashtirgan katta turlar",
  },
];

export function kindLabel(kind: TourKind): string {
  return TOUR_KINDS.find((item) => item.id === kind)?.short ?? "Tur";
}

/** Turi bo'yicha filtr (`kind` berilmasa — hammasi). */
export function filterByKind<T extends TourPackage>(tours: T[], kind?: TourKind | ""): T[] {
  if (!kind) {
    return tours;
  }
  return tours.filter((tour) => tourKind(tour) === kind);
}

/** Turi bo'yicha taqsimlash: bitta shaharli paketlar va ko'p shaharli yo'nalishlar. */
export function splitByKind<T extends TourPackage>(tours: T[]): { packages: T[]; directions: T[] } {
  const packages: T[] = [];
  const directions: T[] = [];
  for (const tour of tours) {
    (isDirection(tour) ? directions : packages).push(tour);
  }
  return { packages, directions };
}
