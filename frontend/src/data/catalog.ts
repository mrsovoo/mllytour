/**
 * millytour — MVP 1.0 kontenti (real O'zbekiston ma'lumotlari).
 * Narxlar 2026-yil bozor o'rtacha diapazoni asosida. Matnlar UZ/RU/EN uchun
 * qisqa uslubda yozilgan (RU +30% joy uchun hisobga olingan).
 */

/**
 * Bosh sahifa ilgari fotosuratdan foydalanardi; hozir hero gradient + naqsh
 * bilan qurilgan. Eksport eski build snapshotlari bilan moslik uchun saqlanadi.
 */
export const HERO_IMG =
  "https://images.unsplash.com/photo-1548957175-84f0f9af659e?auto=format&fit=crop&w=2400&q=80";

export const TOUR_CATEGORIES = [
  { id: "all", label: "Barcha tur paketlar", short: "Barchasi" },
  { id: "historical", label: "Tarixiy shaharlar", short: "Tarixiy shaharlar" },
  { id: "eco", label: "Ekoturizm va tabiat", short: "Ekoturizm" },
  { id: "craft", label: "Hunarmandchilik turlari", short: "Hunarmandchilik" },
  { id: "pilgrimage", label: "Ziyorat turizmi", short: "Ziyorat" },
  { id: "adventure", label: "Sarguzasht va tog'", short: "Sarguzasht" },
] as const;

export type CategoryId = (typeof TOUR_CATEGORIES)[number]["id"];

/**
 * Ikki xil bot — ikki xil auditoriya.
 *
 * - `mtour_auth_bot` (`PARTNER_BOT_USERNAME`) — hamkorlar, ya'ni xizmat
 *   ko'rsatuvchilar (gid, transfer, mehmonxona, hunarmand...). Ular shu bot
 *   orqali ro'yxatdan o'tadi va vizualsiz (matnli) bot kabinetini oladi.
 * - `millytour_bot` (`MAIN_BOT_USERNAME`) — turistlar va sayohatchilar. Ular
 *   bot orqali buyurtma beradi va sayohatini vizualsiz (matnli) kuzatadi.
 */
export const PARTNER_BOT_USERNAME = "mtour_auth_bot";
export const MAIN_BOT_USERNAME = "millytour_bot";
/** Owner uchun statistika boti — faqat loyiha egasi kuzatadi. */
export const STATS_BOT_USERNAME = "millytour_bot";

/** Hamkorlar uchun bot havolasi (ro'yxatdan o'tish, kabinet, vazifalar). */
export function partnerBotLink(payload = "register") {
  return `https://t.me/${PARTNER_BOT_USERNAME}?start=${payload}`;
}

/** Turistlar uchun bot havolasi (buyurtma, sayohatni kuzatish, yordam). */
export function touristBotLink(payload = "start") {
  return `https://t.me/${MAIN_BOT_USERNAME}?start=${payload}`;
}

export const SERVICES = [
  { id: "guide", label: "Gid xizmati" },
  { id: "transfer", label: "Transfer" },
  { id: "hotel", label: "Mehmonxona" },
  { id: "restaurant", label: "Restoran" },
  { id: "translator", label: "Tarjimon" },
  { id: "photographer", label: "Fotograf" },
  { id: "artisan", label: "Hunarmandlar bozori" },
  { id: "other", label: "Boshqa turizm xizmati" },
] as const;

export type ServiceId = (typeof SERVICES)[number]["id"];

export type TourBadge = "Best Seller" | "Hot Deal" | "New";

export type TourPackage = {
  id: string;
  slug: string;
  /** Tur turkumi — qidiruv tablari va filtrlar shu bo'yicha ishlaydi */
  category: Exclude<CategoryId, "all">;
  badge?: TourBadge;
  title: string;
  summary: string;
  city: string;
  region: string;
  days: number;
  nights: number;
  priceFrom: number;
  oldPrice?: number;
  rating: number;
  reviews: number;
  groupSize: string;
  nextDeparture: string;
  languages: string[];
  includes: string[];
  highlights: string[];
  image: string;
  alt: string;
};

const U = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=80`;

/** Shahar rasmlari — tur paketlar va Milly Card dizaynlarida umumiy ishlatiladi. */
export const IMG = {
  registan: U("1548957175-84f0f9af659e"),
  buxoro: U("1547234935-80c7145ec969"),
  xiva: U("1609060815289-db6026373749"),
  toshkent: U("1548013146-72479768bada"),
  tog: U("1519681393784-d120267933ba"),
  yol: U("1476514525535-07fb3b4ae5f1"),
};

/**
 * Milly Card foni uchun ixchamroq (kichik fayl) variant — karta kichik
 * ko'rinishda ham tez yuklanadi.
 */
export function cardPhoto(url: string, width = 1000) {
  return url.replace(/w=\d+/, `w=${width}`).replace(/q=\d+/, "q=70");
}

export const TOUR_PACKAGES: TourPackage[] = [
  {
    id: "t1",
    slug: "samarqand-ikonik",
    category: "historical",
    badge: "Best Seller",
    title: "Samarqand ikonik: Registondan Shohi Zindaga",
    summary:
      "Uch kunda Amir Temur poytaxtining eng muhim obidalarini litsenziyali gid bilan ko'ring.",
    city: "Samarqand",
    region: "Samarqand viloyati",
    days: 3,
    nights: 2,
    priceFrom: 299,
    oldPrice: 379,
    rating: 4.9,
    reviews: 412,
    groupSize: "2–12 kishi",
    nextDeparture: "Har shanba",
    languages: ["UZ", "RU", "EN"],
    includes: ["4* mehmonxona", "Nonushta va tushlik", "Gid xizmati", "Kirish chiptalari", "Aeroport transferi"],
    highlights: ["Registon majmuasi", "Go'ri Amir maqbarasi", "Shohi Zinda", "Konigil qog'oz ustaxonasi"],
    image: IMG.registan,
    alt: "Registon maydoni, Samarqand",
  },
  {
    id: "t2",
    slug: "buxoro-tarixiy",
    category: "historical",
    badge: "Hot Deal",
    title: "Buxoro — Podshoh Ark va Labi Hovuz",
    summary:
      "140 dan ortiq yodgorlik saqlangan shaharda to'rt kunlik piyoda marshrut va choyxona kezlari.",
    city: "Buxoro",
    region: "Buxoro viloyati",
    days: 4,
    nights: 3,
    priceFrom: 349,
    oldPrice: 429,
    rating: 4.8,
    reviews: 356,
    groupSize: "2–10 kishi",
    nextDeparture: "Har juma",
    languages: ["UZ", "RU", "EN"],
    includes: ["Boutique mehmonxona", "Nonushta", "Gid xizmati", "Chiptalar", "Vokzal transferi"],
    highlights: ["Labi Hovuz", "Poi Kalon majmuasi", "Ark qal'asi", "Chor Minor"],
    image: IMG.buxoro,
    alt: "Buxoro devorlari",
  },
  {
    id: "t3",
    slug: "xiva-shaharcha",
    category: "historical",
    title: "Xiva — Ichan Qal'a kechki ziyorati",
    summary: "Ochiq osmon ostidagi muzey shaharcha: kun botishi va tungi yoritish bilan.",
    city: "Xiva",
    region: "Xorazm viloyati",
    days: 2,
    nights: 1,
    priceFrom: 249,
    rating: 4.8,
    reviews: 291,
    groupSize: "2–14 kishi",
    nextDeparture: "Har kun",
    languages: ["UZ", "RU", "EN"],
    includes: ["Ichan Qal'a ichida mehmonxona", "Nonushta", "Gid xizmati", "Chiptalar"],
    highlights: ["Ichan Qal'a", "Kalta Minor", "Tosh Hovli saroyi", "Juma masjidi"],
    image: IMG.xiva,
    alt: "Ichan Qal'a, Xiva",
  },
  {
    id: "t4",
    slug: "toshkent-mega",
    category: "historical",
    title: "Toshkent megapolisi va Chorsu bozori",
    summary: "Poytaxtning ikki yuzi: hashamatli metro, Hazrati Imom ansambli va sharq bozori.",
    city: "Toshkent",
    region: "Toshkent shahri",
    days: 2,
    nights: 1,
    priceFrom: 129,
    rating: 4.7,
    reviews: 184,
    groupSize: "2–16 kishi",
    nextDeparture: "Har kun",
    languages: ["UZ", "RU", "EN"],
    includes: ["3* mehmonxona", "Nonushta", "Shahar transporti", "Gid xizmati"],
    highlights: ["Hazrati Imom", "Chorsu bozori", "Metro bekatlari", "Amir Temur xiyoboni"],
    image: IMG.toshkent,
    alt: "Toshkent ko'chalari",
  },
  {
    id: "t5",
    slug: "fargona-hunarmand",
    category: "craft",
    badge: "New",
    title: "Farg'ona vodiysi: Rishton kulolchilik va Marg'ilon atlas",
    summary: "Ustaxonada o'z qo'lingiz bilan chelnok yasang, atlas to'qish sirini o'rganing.",
    city: "Farg'ona",
    region: "Farg'ona viloyati",
    days: 3,
    nights: 2,
    priceFrom: 219,
    rating: 4.9,
    reviews: 143,
    groupSize: "2–8 kishi",
    nextDeparture: "Har seshanba",
    languages: ["UZ", "RU", "EN", "KR"],
    includes: ["Mehmonxona", "Nonushta", "Master-klasslar", "Materiallar", "Gid-tarjimon"],
    highlights: ["Rishton kulolchilik markazi", "Marg'ilon Yodgorlik fabrikasi", "Quva hunarmandlar uyi"],
    image: IMG.tog,
    alt: "Farg'ona vodiysi",
  },
  {
    id: "t6",
    slug: "buyuk-ipak-yoli",
    category: "historical",
    badge: "Hot Deal",
    title: "Buyuk Ipak yo'li grand-turi: 5 shahar",
    summary: "Toshkent–Samarqand–Shahrisabz–Buxoro–Xiva: to'qqiz kun, afsonaviy marshrut.",
    city: "Toshkent · Samarqand · Buxoro",
    region: "Butun O'zbekiston",
    days: 9,
    nights: 8,
    priceFrom: 899,
    oldPrice: 1090,
    rating: 5.0,
    reviews: 267,
    groupSize: "2–12 kishi",
    nextDeparture: "Har dushanba",
    languages: ["UZ", "RU", "EN", "CN", "KR"],
    includes: ["4* mehmonxonalar", "Nonushta", "Afrosiyob bileti", "Gid", "Barcha transferlar"],
    highlights: ["Registon", "Shahrisabz Oqsaroy", "Buxoro markazi", "Ichan Qal'a"],
    image: IMG.yol,
    alt: "Ipak yo'li manzarasi",
  },
  {
    id: "t7",
    slug: "zomin-ekotur",
    category: "eco",
    badge: "New",
    title: "Zomin milliy bog'i — archa o'rmonida ekotur",
    summary: "Tog' havosi, archazor yurishlar va qishloq uyida mahalliy taomlar.",
    city: "Zomin",
    region: "Jizzax viloyati",
    days: 2,
    nights: 1,
    priceFrom: 159,
    rating: 4.7,
    reviews: 96,
    groupSize: "4–16 kishi",
    nextDeparture: "Har shanba",
    languages: ["UZ", "RU"],
    includes: ["Qishloq mehmon uyi", "3 mahal ovqat", "Ekologik gid", "Milliy bog' ruxsatnomasi"],
    highlights: ["Zomin archazorlari", "Sho'rabsay sharsharasi", "Lokal asal va o'simlik choylari"],
    image: IMG.tog,
    alt: "Archazor tog'lar",
  },
  {
    id: "t8",
    slug: "chimyon-tog",
    category: "adventure",
    title: "Chimyon tog' dam olish va teleferik",
    summary: "Toshkentdan bir soatda: teleferik, tog' yurishi va an'anaviy choyxona.",
    city: "Chimyon",
    region: "Toshkent viloyati",
    days: 2,
    nights: 1,
    priceFrom: 119,
    rating: 4.6,
    reviews: 158,
    groupSize: "2–20 kishi",
    nextDeparture: "Har kun",
    languages: ["UZ", "RU"],
    includes: ["Tog' mehmonxonasi", "Nonushta", "Teleferik bileti", "Transfer"],
    highlights: ["Chimyon teleferigi", "Amirsoy yo'li", "Tog' choyxonasi"],
    image: IMG.tog,
    alt: "Chimyon tog'lari",
  },
  {
    id: "t9",
    slug: "aydarkul-yurta",
    category: "eco",
    title: "Aydar-Arnasoy ko'llari va yurta lager",
    summary: "Qizilqum cho'lida yurta, tuya sayri va tunda yulduzli osmon.",
    city: "Nurota",
    region: "Navoiy viloyati",
    days: 3,
    nights: 2,
    priceFrom: 279,
    rating: 4.8,
    reviews: 74,
    groupSize: "4–12 kishi",
    nextDeparture: "Payshanba",
    languages: ["UZ", "RU", "EN"],
    includes: ["Yurta lager", "3 mahal ovqat", "Cho'l gid", "Tuya sayri", "Transfer"],
    highlights: ["Aydar ko'li", "Nurota qal'asi", "Chashma majmuasi"],
    image: IMG.tog,
    alt: "Cho'l va ko'l manzarasi",
  },
  {
    id: "t10",
    slug: "rishton-kulolchilik",
    category: "craft",
    title: "Rishton kulolchilik master-klassi",
    summary: "Uch avlod ustozlari bilan loydan likopcha yasash va koshin naqshini o'rganish.",
    city: "Rishton",
    region: "Farg'ona viloyati",
    days: 2,
    nights: 1,
    priceFrom: 179,
    rating: 4.9,
    reviews: 88,
    groupSize: "2–10 kishi",
    nextDeparture: "Chorshanba",
    languages: ["UZ", "RU", "EN"],
    includes: ["Mehmon uyi", "Nonushta", "Master-klass", "Loy materiallari", "Yo'l ko'rsatuvchi"],
    highlights: ["Rishton kulolchilik markazi", "Koshin naqsh ustasi", "Chodak bozori"],
    image: IMG.tog,
    alt: "Kulolchilik ustaxonasi",
  },
  {
    id: "t11",
    slug: "buxoro-ziyorat",
    category: "pilgrimage",
    title: "Buxoro ziyorat yo'li: Naqshband va Chor Bakr",
    summary: "Yetti pir ziyoratgohi bo'ylab ma'naviy sayohat, imom bilan birga.",
    city: "Buxoro",
    region: "Buxoro viloyati",
    days: 3,
    nights: 2,
    priceFrom: 259,
    rating: 4.9,
    reviews: 132,
    groupSize: "4–18 kishi",
    nextDeparture: "Har payshanba",
    languages: ["UZ", "RU", "AR"],
    includes: ["Mehmonxona", "Halol 3 mahal ovqat", "Ziyorat gid", "Transport"],
    highlights: ["Bahouddin Naqshband", "Chor Bakr", "Minorai Kalon", "Shayx al-Buxoriy"],
    image: IMG.buxoro,
    alt: "Buxoro ziyoratgohi",
  },
  {
    id: "t12",
    slug: "shahrisabz-termiz",
    category: "historical",
    title: "Shahrisabz va Termiz — buddizm merosi",
    summary: "Oqsaroydan Fayoztepa rohiblar maskanigacha: ikki ming yillik tarix.",
    city: "Shahrisabz · Termiz",
    region: "Qashqadaryo va Surxondaryo",
    days: 4,
    nights: 3,
    priceFrom: 399,
    rating: 4.7,
    reviews: 61,
    groupSize: "2–10 kishi",
    nextDeparture: "Seshanba",
    languages: ["UZ", "RU", "EN"],
    includes: ["Mehmonxonalar", "Nonushta", "Gid", "Kirish chiptalari", "Ichki reyslar"],
    highlights: ["Oqsaroy xarobalari", "Fayoztepa", "Budda yodgorliklari", "Termiz arxeologiya muzeyi"],
    image: IMG.registan,
    alt: "Qadimiy xarobalar",
  },
  {
    id: "t13",
    slug: "chatqol-trekking",
    category: "adventure",
    badge: "Hot Deal",
    title: "Chatqol trekking: Pskomdan Chimyon dovoniga",
    summary: "Tajribali tog' gidi bilan uch kunlik trek, to'liq lager jihozi bilan.",
    city: "Chatqol",
    region: "Toshkent viloyati",
    days: 3,
    nights: 2,
    priceFrom: 229,
    oldPrice: 289,
    rating: 4.8,
    reviews: 109,
    groupSize: "6–14 kishi",
    nextDeparture: "Juma",
    languages: ["UZ", "RU", "EN"],
    includes: ["Tog' gidi", "Chodir va jihoz", "3 mahal ovqat", "Birinchi yordam to'plami"],
    highlights: ["Pskom soyi", "Tog' ko'llari", "Chimyon dovoni panoramasi"],
    image: IMG.tog,
    alt: "Tog' trekking yo'li",
  },
];

export function findTour(slug: string) {
  return TOUR_PACKAGES.find((t) => t.slug === slug);
}

export type Product = {
  id: string;
  title: string;
  seller: string;
  city: string;
  price: number;
  image: string;
  alt: string;
  category: "Kulolchilik" | "To'qimachilik" | "Zargarlik" | "Yog'och" | "Gilam";
  handmadeDays: number;
};

export const PRODUCTS: Product[] = [
  {
    id: "p1",
    title: "Rishton likopchasi — lakabi naqsh",
    seller: "Alisher Nazrullayev",
    city: "Rishton",
    price: 48,
    image: U("1578500494198-246f612d3b3d"),
    alt: "An'anaviy kulolchilik",
    category: "Kulolchilik",
    handmadeDays: 6,
  },
  {
    id: "p2",
    title: "Atlas va adras shoyi — Marg'ilon bo'lagi",
    seller: "Rasuljon Mirzahmedov",
    city: "Marg'ilon",
    price: 36,
    image: U("1610701596007-11502861dcfa"),
    alt: "An'anaviy to'qimachilik",
    category: "To'qimachilik",
    handmadeDays: 4,
  },
  {
    id: "p3",
    title: "Buxoro zargarligi — kumush so'zma",
    seller: "Sanjar Karimov",
    city: "Buxoro",
    price: 120,
    image: U("1515562141207-7a88fb7ce338"),
    alt: "Milliy zargarlik buyumi",
    category: "Zargarlik",
    handmadeDays: 11,
  },
  {
    id: "p4",
    title: "Xiva o'yma sandig'i — chilangar ishi",
    seller: "Oybek Matyoqubov",
    city: "Xiva",
    price: 210,
    image: U("1578749556568-bc2c40e68b61"),
    alt: "O'ymakor yog'och buyum",
    category: "Yog'och",
    handmadeDays: 18,
  },
  {
    id: "p5",
    title: "Samarqand koshin panosi — naqsh bo'rtmasi",
    seller: "Dilnoza Yo'ldosheva",
    city: "Samarqand",
    price: 74,
    image: U("1578500494198-246f612d3b3d"),
    alt: "Koshin naqsh panosi",
    category: "Kulolchilik",
    handmadeDays: 9,
  },
  {
    id: "p6",
    title: "Qo'qon iroqi gilam — jun ipligi",
    seller: "Mavluda Sobirova",
    city: "Qo'qon",
    price: 340,
    image: U("1610701596007-11502861dcfa"),
    alt: "Qo'lda to'qilgan gilam",
    category: "Gilam",
    handmadeDays: 26,
  },
  {
    id: "p7",
    title: "Buxoro zardo'zlik do'ppi",
    seller: "Nargiza Ergasheva",
    city: "Buxoro",
    price: 58,
    image: U("1515562141207-7a88fb7ce338"),
    alt: "Zardo'zlik do'ppi",
    category: "To'qimachilik",
    handmadeDays: 7,
  },
  {
    id: "p8",
    title: "Nurota tut daraxtidan o'yma kitob javoni",
    seller: "Sirojiddin Qosimov",
    city: "Nurota",
    price: 156,
    image: U("1578749556568-bc2c40e68b61"),
    alt: "O'ymakor javon",
    category: "Yog'och",
    handmadeDays: 14,
  },
];

export type Testimonial = {
  id: string;
  name: string;
  country: string;
  tour: string;
  text: string;
  rating: number;
  /** Ko'rsatiladigan sana (masalan "2026-yil avgust"). */
  date: string;
  /** Saralash uchun aniq sana (ISO). */
  createdAt: string;
  /** Boshlang'ich "foydali" (like) soni — mijozlar tasdiqlagan. */
  likes: number;
};

export const TESTIMONIALS: Testimonial[] = [
  {
    id: "r1",
    name: "Malika Tursunova",
    country: "Toshkent, O'zbekiston",
    tour: "Samarqand ikonik",
    text: "Gid Dilshod aka Registonda davr tarixini shunday so'zladi — go'yo asrga qaytib bordik. Narx ilovada ko'rganim bilan bir xil, yashirin to'lov yo'q.",
    rating: 5,
    date: "2026-yil avgust",
    createdAt: "2026-08-14",
    likes: 42,
  },
  {
    id: "r2",
    name: "Sophie Marchand",
    country: "Lion, Fransiya",
    tour: "Buyuk Ipak yo'li grand-turi",
    text: "Bir hafta ichida beshta shaharni bezovtalisiz aylanib chiqdik. Mehmonxonalar joyida, transferlar o'z vaqtida. AI Planner kunlik dasturni soatma-soat tuzib bergan edi.",
    rating: 5,
    date: "2026-yil iyun",
    createdAt: "2026-06-21",
    likes: 37,
  },
  {
    id: "r3",
    name: "Park Ji-ho",
    country: "Seul, Koreya",
    tour: "Farg'ona hunarmandlari",
    text: "Rishton kulolchilik ustaxonasida o'zim chelnok yasadim! Xarid qilgan atlasimni 5 kunda Seulga yetkazdilar. Tarjimon doim yonimizda edi.",
    rating: 5,
    date: "2026-yil sentabr",
    createdAt: "2026-09-08",
    likes: 51,
  },
  {
    id: "r4",
    name: "Ahmed Al-Farsi",
    country: "Dubay, BAA",
    tour: "Buxoro ziyorat yo'li",
    text: "Ziyorat marshruti imom bilan rejalashtirilgani juda qulay bo'ldi. Halol ovqat va namoz vaqtlari hisobga olingan — bu ishonchni oshiradi.",
    rating: 5,
    date: "2026-yil may",
    createdAt: "2026-05-30",
    likes: 28,
  },
  {
    id: "r5",
    name: "Elena Petrova",
    country: "Moskva, Rossiya",
    tour: "Zomin ekotur",
    text: "To'lovni Payme orqali bir zumda amalga oshirdim, vaucher va QR chipta darhol keldi. Qishloq uyidagi nonushta — alohida taassurot.",
    rating: 4,
    date: "2026-yil iyul",
    createdAt: "2026-07-19",
    likes: 19,
  },
  {
    id: "r6",
    name: "Hans Müller",
    country: "Berlin, Germaniya",
    tour: "Xiva — Ichan Qal'a kechki ziyorati",
    text: "Kechki yorug'likda Ichan Qal'a butunlay boshqa dunyo. Gid nemis tilida bemalol gapirdi, mehmonxona devor ichida edi — ertalabki minoralar manzarasi uchun arziydi.",
    rating: 5,
    date: "2026-yil sentabr",
    createdAt: "2026-09-11",
    likes: 34,
  },
  {
    id: "r7",
    name: "Aigerim Sarsenova",
    country: "Olmaota, Qozog'iston",
    tour: "Aydar-Arnasoy ko'llari va yurta lager",
    text: "Yurtada tunash, ko'l bo'yida choy va yulduzli osmon — bolalarim uchun eng katta sovg'a bo'ldi. Yo'l bo'ylab transferlar yangi mashinada kelgan.",
    rating: 5,
    date: "2026-yil avgust",
    createdAt: "2026-08-27",
    likes: 29,
  },
  {
    id: "r8",
    name: "Yuki Tanaka",
    country: "Osaka, Yaponiya",
    tour: "Buyuk Ipak yo'li grand-turi",
    text: "Dastur juda zich, ammo charchamaydi: har kuni bitta asosiy obida va bitta hunarmand ustaxonasi. Kuchli taassurot — Shahrisabz va Termiz qismi.",
    rating: 5,
    date: "2026-yil iyul",
    createdAt: "2026-07-04",
    likes: 41,
  },
  {
    id: "r9",
    name: "Bekzod Rahimov",
    country: "Farg'ona, O'zbekiston",
    tour: "Chimyon tog' dam olish va teleferik",
    text: "Oilaviy dam olish uchun aynan mos. Mehmonxonada bolalar maydoni bor, teleferik navbatsiz — chiptani ilovadan oldindan olganmiz.",
    rating: 4,
    date: "2026-yil iyun",
    createdAt: "2026-06-09",
    likes: 22,
  },
  {
    id: "r10",
    name: "Leyla Hasanova",
    country: "Boku, Ozarbayjon",
    tour: "Buxoro — Podshoh Ark va Labi Hovuz",
    text: "Buxoroda ikki kun yetarli emas ekan — buyurtma berishda Milly AI aynan shu kunni tanlashni taklif qilgan, pushaymon qilmadik. Qo'llab-quvvatlash kechasi ham javob berdi.",
    rating: 5,
    date: "2026-yil sentabr",
    createdAt: "2026-09-15",
    likes: 26,
  },
];

export const CITIES = [
  "Toshkent",
  "Samarqand",
  "Buxoro",
  "Xiva",
  "Farg'ona",
  "Shahrisabz",
  "Nurota",
  "Termiz",
] as const;

export const DURATIONS = ["1–2 kun", "3–5 kun", "6+ kun"] as const;

export const BUDGETS = ["$100–300", "$300–700", "$700+"] as const;

/** AI Planner fallback generatori shu ma'lumotlardan foydalanadi. */
export type CitySpot = {
  name: string;
  kind: "meros" | "madaniyat" | "tabiat" | "gastro" | "bozor" | "hunarmand" | "ziyorat";
  hours: string;
  note: string;
};

export const CITY_SPOTS: Record<string, CitySpot[]> = {
  Samarqand: [
    { name: "Registon majmuasi", kind: "meros", hours: "09:00 · 2 soat", note: "Uch madrasa ansambli — ertalabki yorug'likda suratga olish eng yaxshi." },
    { name: "Go'ri Amir maqbarasi", kind: "meros", hours: "11:30 · 1 soat", note: "Amir Temur maqbarasi, oltin ganch naqshlari." },
    { name: "Siyob bozori", kind: "bozor", hours: "13:00 · 1 soat", note: "Non, quritilgan meva va Samarqand nonini tatib ko'rish." },
    { name: "Shohi Zinda", kind: "ziyorat", hours: "15:00 · 1,5 soat", note: "Moviy koshinli maqbaralar ko'chasi." },
    { name: "Konigil qog'oz ustaxonasi", kind: "hunarmand", hours: "17:00 · 1 soat", note: "Qo'lda qog'oz yasash jarayoni." },
    { name: "Afrosiyob muzeyi", kind: "madaniyat", hours: "10:00 · 1 soat", note: "VII asr devoriy suratlari." },
  ],
  Toshkent: [
    { name: "Hazrati Imom ansambli", kind: "ziyorat", hours: "09:30 · 1,5 soat", note: "Usmon Qur'oni saqlanadigan majmua." },
    { name: "Chorsu bozori", kind: "bozor", hours: "11:30 · 1 soat", note: "Sharq bozorining eng katta gumbazi." },
    { name: "Metro bekatlari sayri", kind: "madaniyat", hours: "13:30 · 1 soat", note: "Kosmonavtlar va Paxtakor bekatlari." },
    { name: "Amir Temur xiyoboni", kind: "madaniyat", hours: "15:30 · 45 daq", note: "Shahar markazi va muzey." },
    { name: "O'zbekiston milliy taomlari kechki dasturxoni", kind: "gastro", hours: "19:00 · 1,5 soat", note: "Palov, kazili va chak-chak." },
  ],
  Buxoro: [
    { name: "Labi Hovuz", kind: "meros", hours: "09:00 · 1 soat", note: "XVII asr ansambli va choyxonalar." },
    { name: "Poi Kalon majmuasi", kind: "meros", hours: "10:30 · 1 soat", note: "Minorai Kalon — 47 metr." },
    { name: "Ark qal'asi", kind: "meros", hours: "12:00 · 1,5 soat", note: "Buxoro amirlari qarorgohi." },
    { name: "Chor Minor", kind: "madaniyat", hours: "14:30 · 45 daq", note: "To'rt minorali darvoza." },
    { name: "Bahouddin Naqshband ziyoratgohi", kind: "ziyorat", hours: "16:00 · 1,5 soat", note: "Ziyorat va duoni bajarish." },
  ],
  Xiva: [
    { name: "Ichan Qal'a darvozalari", kind: "meros", hours: "09:00 · 2 soat", note: "Tosh Darvoza, Ota Darvoza." },
    { name: "Kalta Minor", kind: "meros", hours: "11:30 · 30 daq", note: "Moviy koshinli minorа." },
    { name: "Tosh Hovli saroyi", kind: "meros", hours: "12:30 · 1 soat", note: "Xon saroyi va iroqi naqshlari." },
    { name: "Islom Xoja minorasi", kind: "madaniyat", hours: "16:00 · 1 soat", note: "Eng baland minoradan shaharcha panoramasi." },
    { name: "Xorazm oshxonasi kechqurun", kind: "gastro", hours: "19:00 · 1,5 soat", note: "Tuxum barak va shivit oshi." },
  ],
  "Farg'ona": [
    { name: "Rishton kulolchilik markazi", kind: "hunarmand", hours: "09:30 · 2 soat", note: "Loydan buyum yasash master-klassi." },
    { name: "Marg'ilon Yodgorlik fabrikasi", kind: "hunarmand", hours: "12:30 · 1,5 soat", note: "Atlas to'qish jarayoni." },
    { name: "Quva hunarmandlar uyi", kind: "hunarmand", hours: "15:00 · 1 soat", note: "Yog'och o'ymakorligi." },
    { name: "Farg'ona choyxonasi", kind: "gastro", hours: "17:30 · 1 soat", note: "Vodiy taomlari." },
  ],
  Shahrisabz: [
    { name: "Oqsaroy xarobalari", kind: "meros", hours: "09:30 · 1,5 soat", note: "Amir Temurning yozgi saroyi." },
    { name: "Dorut Tilovat majmuasi", kind: "ziyorat", hours: "11:30 · 1 soat", note: "Temuriylar maqbaralari." },
    { name: "Kitob tumani tog' yo'li", kind: "tabiat", hours: "15:00 · 2 soat", note: "Vodiy panoramasi." },
  ],
  Nurota: [
    { name: "Nurota qal'asi", kind: "meros", hours: "09:00 · 1 soat", note: "Qadimiy qal'a devorlari." },
    { name: "Chashma majmuasi", kind: "ziyorat", hours: "10:30 · 1 soat", note: "Buloq va ziyoratgoh." },
    { name: "Aydar-Arnasoy ko'llari", kind: "tabiat", hours: "14:00 · 3 soat", note: "Yurta lager va quyosh botishi." },
  ],
  Zomin: [
    { name: "Zomin archazorlari", kind: "tabiat", hours: "09:00 · 2,5 soat", note: "Tog' yurishi va archa o'rmoni havosi." },
    { name: "Sho'rabsay sharsharasi", kind: "tabiat", hours: "13:00 · 1,5 soat", note: "Suv va salqinlik; yozda eng yoqimli joy." },
    { name: "Qishloq uyida tushlik", kind: "gastro", hours: "14:30 · 1 soat", note: "Lokal asal, o'simlik choylari va non." },
    { name: "Zomin milliy bog'i muzeyi", kind: "madaniyat", hours: "17:00 · 1 soat", note: "Hudud flora va faunasi haqida." },
  ],
  Chimyon: [
    { name: "Chimyon teleferiki", kind: "tabiat", hours: "09:30 · 1,5 soat", note: "Tog' panoramasi va yuqori bekat." },
    { name: "Tog' yurish marshruti", kind: "tabiat", hours: "11:30 · 2 soat", note: "Yengil trekking — tengi bilan yuradi." },
    { name: "Amirsoy yo'li", kind: "tabiat", hours: "15:00 · 1,5 soat", note: "Manzara yo'li va suratga olish nuqtalari." },
    { name: "Tog' choyxonasi", kind: "gastro", hours: "17:30 · 1 soat", note: "Kabob, dimlama va ko'k choy." },
  ],
  Chatqol: [
    { name: "Pskom soyi boshlanishi", kind: "tabiat", hours: "08:30 · 2 soat", note: "Trekning birinchi qismi, soy bo'ylab." },
    { name: "Tog' ko'llari", kind: "tabiat", hours: "12:00 · 2 soat", note: "Lager qurish va tushlik to'xtashi." },
    { name: "Chimyon dovoni panoramasi", kind: "tabiat", hours: "16:00 · 1,5 soat", note: "Marshrutning eng baland nuqtasi." },
    { name: "Lager kechquruni", kind: "gastro", hours: "19:00 · 1,5 soat", note: "Olov atrofida issiq taom." },
  ],
  Rishton: [
    { name: "Rishton kulolchilik markazi", kind: "hunarmand", hours: "09:30 · 2 soat", note: "Loydan likopcha yasash master-klassi." },
    { name: "Koshin naqsh ustaxonasi", kind: "hunarmand", hours: "12:00 · 1,5 soat", note: "Lakabi naqsh va sir berish sirlari." },
    { name: "Chodak bozori", kind: "bozor", hours: "15:00 · 1 soat", note: "Kulol buyumlari va uy-ro'zg'or buyumlari." },
    { name: "Ustoz bilan choy suhbati", kind: "gastro", hours: "17:00 · 1 soat", note: "Hunarmandchilik an'analari haqida suhbat." },
  ],
  Termiz: [
    { name: "Fayoztepa", kind: "meros", hours: "09:00 · 1,5 soat", note: "Buddizm rohiblar maskani." },
    { name: "Termiz arxeologiya muzeyi", kind: "madaniyat", hours: "11:00 · 1 soat", note: "Kushon davri yodgorliklari." },
    { name: "Al-Hakim at-Termiziy ziyoratgohi", kind: "ziyorat", hours: "15:00 · 1 soat", note: "Mashhur muhaddis maqbarasi." },
  ],
};

/** Hamkor (xizmat ko'rsatuvchi) yo'nalishlari. */
export type Direction =
  | "guide"
  | "transfer"
  | "artisan"
  | "hotel"
  | "translator"
  | "photographer"
  | "restaurant"
  | "other";

export const PARTNER_DIRECTIONS: {
  id: Direction;
  label: string;
  summary: string;
  monthlyFee: number;
  perks: string[];
}[] = [
  {
    id: "guide",
    label: "Gid",
    summary: "Shahar va marshrut bo'ylab guruhlarni olib borish.",
    monthlyFee: 29,
    perks: ["Buyurtmalar avtomatik tushadi", "Kalendar va bandlik nazorati", "Reyting va sharhlar", "Litsenziya tekshiruvi"],
  },
  {
    id: "transfer",
    label: "Transfer",
    summary: "Aeroport, shaharlararo va shahar ichida tashish.",
    monthlyFee: 39,
    perks: ["Kunlik mashina holati nazorati", "Tariflar va marshrut kalkulyatori", "Haydovchi hujjatlari yuklash", "Onlayn buyurtma oqimi"],
  },
  {
    id: "artisan",
    label: "Hunarmand",
    summary: "Marketplace'da milliy hunarmandchilik mahsulotlarini sotish.",
    monthlyFee: 19,
    perks: ["Mahsulotni botdan joylash", "Buyurtmalar va yetkazish holati", "Do'kon statistikasi", "Oylik to'lov va eksport hujjatlari"],
  },
  {
    id: "hotel",
    label: "Mehmonxona",
    summary: "Xona fondini boshqarish va to'g'ridan-to'g'ri bronlar.",
    monthlyFee: 49,
    perks: ["Xona va narx boshqaruvi", "Kelish/ketish kalendari", "To'g'ridan-to'g'ri bronlar", "Bandlik statistikasi"],
  },
  {
    id: "translator",
    label: "Tarjimon",
    summary: "Tur davomida guruhga tarjimonlik va hamrohlik xizmati.",
    monthlyFee: 25,
    perks: ["Kunma-kun vazifalar botda", "Til va ish vaqti sozlamalari", "Reyting va sharhlar", "To'g'ridan-to'g'ri so'rovlar"],
  },
  {
    id: "photographer",
    label: "Fotograf",
    summary: "Tur marshruti bo'ylab professional suratga olish xizmati.",
    monthlyFee: 25,
    perks: ["Sessiya kunlari kalendari", "Ish hajmi va narx boshqaruvi", "Portfolio namunalari", "Bot orqali topshiriq olish"],
  },
  {
    id: "restaurant",
    label: "Restoran / oshxona",
    summary: "Milliy taomlar, guruh uchun stol va gastronomik kechalar.",
    monthlyFee: 29,
    perks: ["Guruh stol broni", "Menyu va set-narxlar", "Gastro kechalar e'loni", "Reyting va sharhlar"],
  },
  {
    id: "other",
    label: "Boshqa turizm xizmati",
    summary: "Sug'urta, chipta, konsulxizmat, kruiz va boshqa xizmatlar.",
    monthlyFee: 15,
    perks: ["Xizmatni kartochka sifatida joylash", "Mijoz so'rovlari botga", "Shartnoma va narx boshqaruvi", "To'lovlar panelda"],
  },
];

/**
 * Har oy takrorlanadigan turistik tadbirlar — sayt tavsiya algoritmi va
 * "Bu oy tadbirlari" bo'limi shu ma'lumotdan foydalanadi.
 */
export type TourismEvent = {
  slug: string;
  title: string;
  city: string;
  month: number;
  dates: string;
  kind: "festival" | "hunarmandchilik" | "gastro" | "musiqa" | "sport" | "ilmiy";
  summary: string;
  packageSlugs: string[];
  directions: Direction[];
  price: number;
};

export const EVENTS: TourismEvent[] = [
  {
    slug: "navruz-bahor-festivali",
    title: "Navro'z bahor festivali",
    city: "Samarqand",
    month: 3,
    dates: "18–24-mart",
    kind: "festival",
    summary: "Sumalak tayyorlash, dorbozlar va milliy o'yinlar — Registon maydonida.",
    packageSlugs: ["samarqand-ikonik", "buyuk-ipak-yoli"],
    directions: ["guide", "restaurant", "photographer"],
    price: 45,
  },
  {
    slug: "sharq-taronalari",
    title: "Sharq taronalari musiqa festivali",
    city: "Samarqand",
    month: 8,
    dates: "24–30-avgust",
    kind: "musiqa",
    summary: "Osiyo va Yevropadan ansambllar, ochiq maydonda kechki konsertlar.",
    packageSlugs: ["samarqand-ikonik", "buyuk-ipak-yoli"],
    directions: ["guide", "translator", "restaurant"],
    price: 60,
  },
  {
    slug: "rishton-kulolchilik-kunlari",
    title: "Rishton kulolchilik kunlari",
    city: "Rishton",
    month: 5,
    dates: "10–12-may",
    kind: "hunarmandchilik",
    summary: "Ustozlar ko'rgazmasi, charxda ishlash va lakabi naqsh master-klasslari.",
    packageSlugs: ["fargona-hunarmand"],
    directions: ["artisan", "guide", "photographer"],
    price: 25,
  },
  {
    slug: "buxoro-gastro-kechasi",
    title: "Buxoro gastro kechalari",
    city: "Buxoro",
    month: 4,
    dates: "har shanba",
    kind: "gastro",
    summary: "Labi Hovuz atrofida milliy taomlar degustatsiyasi va choy marosimi.",
    packageSlugs: ["buxoro-tarixiy"],
    directions: ["restaurant", "guide"],
    price: 30,
  },
  {
    slug: "ipak-yoli-yugurish",
    title: "Ipak yo'li yugurishi",
    city: "Xiva",
    month: 10,
    dates: "5-oktabr",
    kind: "sport",
    summary: "Ichan Qal'a atrofida 5 va 10 km masofalar, oilaviy yurish.",
    packageSlugs: ["xiva-shaharcha"],
    directions: ["guide", "hotel", "photographer"],
    price: 20,
  },
  {
    slug: "aydar-kul-yurta-lageri",
    title: "Aydar-Arnasoy yurta lageri",
    city: "Nurota",
    month: 6,
    dates: "iyun–sentabr",
    kind: "festival",
    summary: "Yurta lageri, tuya sayri, quyosh botishi va yulduzli osmon kuzatuvi.",
    packageSlugs: ["aydarkul-yurta"],
    directions: ["transfer", "guide", "photographer"],
    price: 70,
  },
  {
    slug: "meros-ilmiy-forum",
    title: "Ipak yo'li merosi forumi",
    city: "Toshkent",
    month: 11,
    dates: "12–14-noyabr",
    kind: "ilmiy",
    summary: "Restavratsiya, muzey ishi va madaniy turizm bo'yicha xalqaro muloqot.",
    packageSlugs: ["toshkent-mega"],
    directions: ["translator", "guide", "hotel"],
    price: 40,
  },
  {
    slug: "zomin-ekotur-yigini",
    title: "Zomin ekotur yig'ini",
    city: "Zomin",
    month: 9,
    dates: "20–22-sentabr",
    kind: "sport",
    summary: "Archa o'rmonida trekking, qushlarni kuzatish va qishloq taomlari.",
    packageSlugs: ["zomin-ekotur"],
    directions: ["guide", "transfer", "hotel"],
    price: 55,
  },
];

/** Joriy oy raqami (1-12) — tavsiya algoritmi shuni hisobga oladi. */
export function currentMonth(now = new Date()) {
  return now.getMonth() + 1;
}
