import { CITY_SPOTS, IMG, TOUR_PACKAGES, type CitySpot, type TourPackage } from "@/data/catalog";

/**
 * Yo'nalishlar (shaharlar).
 *
 * Har bir yo'nalish mavjud tur paketlar va diqqatga sazovor joylar
 * (`CITY_SPOTS`) asosida quriladi — narx, reyting va sharhlar real
 * katalogdan hisoblanadi, qo'lda yozilmaydi.
 */

export type Destination = {
  slug: string;
  name: string;
  region: string;
  tagline: string;
  description: string;
  image: string;
  alt: string;
  /** Shu yo'nalishga kiruvchi shahar nomlari (paketlarni filtrlash uchun). */
  cities: string[];
  /** Diqqatga sazovor joylar qaysi kalitdan olinadi (`CITY_SPOTS`). */
  spotKey: string;
  /** Mavsumiy chegirma foizi (karta nishoni uchun). */
  discountPercent: number;
  bestSeason: string;
  languages: string[];
  /** Yo'nalish haqida qisqa faktlar. */
  facts: { label: string; value: string }[];
};

export const DESTINATIONS: Destination[] = [
  {
    slug: "samarqand",
    name: "Samarqand",
    region: "Samarqand viloyati",
    tagline: "Registon, Shohi Zinda va Amir Temur merosi",
    description:
      "Ipak yo'lining yuragi — uch madrasa ansambli, moviy koshinli maqbaralar va Afrosiyobning VII asr suratlari. Shahar bir kunda ham, uch kunda ham to'liq ochiladi.",
    image: IMG.registan,
    alt: "Registon majmuasi, Samarqand",
    cities: ["Samarqand"],
    spotKey: "Samarqand",
    discountPercent: 25,
    bestSeason: "Mart–may, sentabr–noyabr",
    languages: ["uz", "ru", "en"],
    facts: [
      { label: "UNESCO obidalari", value: "4 ta" },
      { label: "Aeroport", value: "Samarqand (SKD)" },
      { label: "Shahar ichida", value: "Yurish qulay" },
    ],
  },
  {
    slug: "buxoro",
    name: "Buxoro",
    region: "Buxoro viloyati",
    tagline: "Poi Kalon, Ark qal'asi va Labi Hovuz",
    description:
      "140 dan ortiq obida joylashgan ochiq muzey-shahar. Minorai Kalon, amirlar qarorgohi va choyxonalar bir-biridan yurish masofasida.",
    image: IMG.buxoro,
    alt: "Buxoro shahri panoramasi",
    cities: ["Buxoro"],
    spotKey: "Buxoro",
    discountPercent: 30,
    bestSeason: "Aprel–iyun, sentabr–oktabr",
    languages: ["uz", "ru", "en"],
    facts: [
      { label: "Tarixiy yoshi", value: "2500+ yil" },
      { label: "Obidalar", value: "140+ ta" },
      { label: "Poyezd", value: "Afrosiyob qulay" },
    ],
  },
  {
    slug: "xiva",
    name: "Xiva",
    region: "Xorazm viloyati",
    tagline: "Ichan Qal'a — ochiq osmon ostidagi muzey",
    description:
      "Shahar ichida shahar: Ichan Qal'a devorlari, Kalta Minor va karvonsaroylar. Kechasi chiroqlar yonishi bilan eng chiroyli manzara ochiladi.",
    image: IMG.xiva,
    alt: "Xiva, Ichan Qal'a minoralari",
    cities: ["Xiva"],
    spotKey: "Xiva",
    discountPercent: 20,
    bestSeason: "Aprel–may, sentabr",
    languages: ["uz", "ru", "en"],
    facts: [
      { label: "Ichan Qal'a", value: "UNESCO" },
      { label: "Minoralar", value: "Kalta Minor" },
      { label: "Eng yaxshi vaqt", value: "Quyosh botishi" },
    ],
  },
  {
    slug: "toshkent",
    name: "Toshkent",
    region: "Poytaxt",
    tagline: "Zamonaviy shahar, Chorsu bozori va metro san'ati",
    description:
      "Sayohat poytaxtdan boshlanadi: Hazrati Imom majmuasi, Chorsu gumbazi, bezatilgan metro bekatlari va kechki gastronomik dasturxon.",
    image: IMG.toshkent,
    alt: "Toshkent shahri",
    cities: ["Toshkent"],
    spotKey: "Toshkent",
    discountPercent: 15,
    bestSeason: "Butun yil",
    languages: ["uz", "ru", "en"],
    facts: [
      { label: "Xalqaro aeroport", value: "TAS" },
      { label: "Metro", value: "Bezatilgan bekatlar" },
      { label: "Boshlanish nuqtasi", value: "Barcha turlar" },
    ],
  },
  {
    slug: "nurota",
    name: "Nurota",
    region: "Navoiy viloyati",
    tagline: "Chashma bulog'i, tuya safari va Qizilqum",
    description:
      "Sahro va karvon yo'li ta'mi: muqaddas chashma, Nur qal'asi xarobalari, tuya minish va yulduzli osmon ostidagi tunash.",
    image: IMG.tog,
    alt: "Nurota cho'li va tog'lari",
    cities: ["Nurota"],
    spotKey: "Nurota",
    discountPercent: 20,
    bestSeason: "Mart–may, sentabr–noyabr",
    languages: ["uz", "ru"],
    facts: [
      { label: "Tur turi", value: "Ekoturizm" },
      { label: "Tuya safari", value: "Mavjud" },
      { label: "Tunash", value: "Yurta / qishloq uyi" },
    ],
  },
  {
    slug: "fargona-vodiysi",
    name: "Farg'ona vodiysi",
    region: "Farg'ona, Marg'ilon, Rishton",
    tagline: "Rishton kulolchiligi va Marg'ilon atlasi",
    description:
      "Hunarmandchilik markazi: kulolchilik charxida o'z qo'lingiz bilan likopcha yasash, atlas to'qish jarayoni va Qo'qon saroyi.",
    image: IMG.yol,
    alt: "Farg'ona vodiysi yo'llari",
    cities: ["Farg'ona", "Rishton", "Marg'ilon", "Qo'qon"],
    spotKey: "Rishton",
    discountPercent: 25,
    bestSeason: "Aprel–iyun, sentabr–oktabr",
    languages: ["uz", "ru", "en"],
    facts: [
      { label: "Ustaxonalar", value: "20+ ta" },
      { label: "Xarid", value: "Eksport hujjati" },
      { label: "Poyezd", value: "Toshkent–Qo'qon" },
    ],
  },
];

export function findDestination(slug: string | undefined): Destination | undefined {
  return DESTINATIONS.find((item) => item.slug === slug);
}

/** Yo'nalishga tegishli tur paketlar (shahar nomi bo'yicha moslik). */
export function packagesFor(destination: Destination): TourPackage[] {
  return TOUR_PACKAGES.filter((tour) =>
    destination.cities.some((city) => tour.city.toLowerCase().includes(city.toLowerCase())),
  );
}

/** Diqqatga sazovor joylar ro'yxati. */
export function spotsFor(destination: Destination): CitySpot[] {
  return CITY_SPOTS[destination.spotKey] ?? [];
}

export type DestinationPricing = {
  priceFrom: number;
  oldPrice: number;
  discount: number;
  packageCount: number;
  rating: number;
  reviews: number;
};

/** Narx va chegirma — eng arzon paketdan hisoblanadi. */
export function destinationPricing(destination: Destination): DestinationPricing {
  const packages = packagesFor(destination);
  const priceFrom = packages.length
    ? Math.min(...packages.map((tour) => tour.priceFrom))
    : 0;
  const withOld = packages.filter((tour) => tour.oldPrice);
  const realOld = withOld.length
    ? Math.min(...withOld.map((tour) => tour.oldPrice as number))
    : 0;
  const oldPrice =
    realOld > priceFrom
      ? realOld
      : Math.round(priceFrom / (1 - destination.discountPercent / 100));
  const reviews = packages.reduce((sum, tour) => sum + tour.reviews, 0);
  const rating = reviews
    ? Math.round(
        (packages.reduce((sum, tour) => sum + tour.rating * tour.reviews, 0) / reviews) * 10,
      ) / 10
    : 0;
  return {
    priceFrom,
    oldPrice,
    discount: Math.max(0, Math.round((1 - priceFrom / oldPrice) * 100)),
    packageCount: packages.length,
    rating,
    reviews,
  };
}
