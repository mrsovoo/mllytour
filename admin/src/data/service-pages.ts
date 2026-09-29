import type { Direction } from "@/data/catalog";

/**
 * Har bir xizmat yo'nalishi uchun alohida to'liq sahifa kontenti.
 *
 * `/xizmatlar` — barcha yo'nalishlar ro'yxati.
 * `/xizmatlar/:slug` — shu yerdagi bitta yo'nalish uchun to'liq sahifa:
 * turlari (masalan mehmonxona uchun "3 yulduz", "butik", "homestay"),
 * qanday ishlashi, FAQ va mutaxassislar ro'yxati shu sahifada ochiladi.
 */

export type ServiceType = {
  id: string;
  label: string;
  desc: string;
  /** Turlar ro'yxatida ko'rsatiladigan boshlang'ich narx belgisi. */
  priceHint: string;
  /** Mutaxassis kartochkalarini filtrlash uchun kalit so'zlar. */
  keywords: string[];
};

export type ServicePage = {
  slug: string;
  direction: Direction;
  label: string;
  title: string;
  desc: string;
  image: string;
  highlights: string[];
  types: ServiceType[];
  how: { title: string; desc: string }[];
  faq: { q: string; a: string }[];
};

const img = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1600&q=80`;

export const SERVICE_PAGES: ServicePage[] = [
  {
    slug: "mehmonxona",
    direction: "hotel",
    label: "Mehmonxona",
    title: "Mehmonxona va turar joy bron qilish",
    desc: "Yulduz toifasidan milliy hovligacha — xona fondi, bandlik kalendari va narxi aniq ko'rsatilgan tasdiqlangan mehmonxonalar.",
    image: img("1566073771259-6a8506099945"),
    highlights: [
      "Xona fondi va band kunlar real vaqtda",
      "Kelish/ketish vaqtlari aniq kelishiladi",
      "Guruh va korporativ narxlar mavjud",
    ],
    types: [
      { id: "3star", label: "3 yulduz", desc: "Toza va tejamkor variant: nonushta, konditsioner, Wi-Fi. Guruh sayohatlari uchun eng ko'p tanlanadi.", priceHint: "35–60 USD", keywords: ["3", "tejamkor", "budget", "econom", "yulduz"] },
      { id: "4star", label: "4 yulduz", desc: "Keng xonalar, restoran va basseyn. Shahar markaziga yaqin joylashuv.", priceHint: "70–120 USD", keywords: ["4", "biznes", "basseyn", "restoran"] },
      { id: "5star", label: "5 yulduz", desc: "Premium servis, spa va bir nechta restoran. Individual kutib olish.", priceHint: "150–320 USD", keywords: ["5", "premium", "lux", "spa", "lyuks"] },
      { id: "boutique", label: "Butik mehmonxona", desc: "Kichik, dizayner uslubidagi 8–25 xonali mehmonxonalar. Buxoro va Samarqandda ko'p.", priceHint: "90–180 USD", keywords: ["butik", "boutique", "dizayn", "design"] },
      { id: "homestay", label: "Mehmon uyi", desc: "Mahalliy oila uyida yashash: nonushta va haqiqiy uy muhiti.", priceHint: "20–40 USD", keywords: ["mehmon uyi", "homestay", "oila", "uy"] },
      { id: "hovo", label: "Milliy hovli", desc: "An'anaviy hovli-uy: ayvon, supachi va mevali bog'. Xiva hamda Buxoroda mashhur.", priceHint: "30–70 USD", keywords: ["hovli", "an'anaviy", "ayvon"] },
      { id: "yurta", label: "Yurta / glamping", desc: "Cho'l yoki tog' sharoitida yurta va glamping chodirlari. Aydar-Arnasoy va Chimyon atrofida.", priceHint: "25–60 USD", keywords: ["yurta", "glamping", "chodir", "lager"] },
    ],
    how: [
      { title: "Sana va shaharni tanlaysiz", desc: "Boshlanish sanasi va necha kecha qolishingizni belgilaysiz — narx darhol hisoblanadi." },
      { title: "Mutaxassis tasdiqlaydi", desc: "Tanlangan mehmonxonaga so'rov tushadi; ular xona mavjudligini botda tasdiqlaydi." },
      { title: "To'lov va vaucher", desc: "To'lovni Click, Payme yoki karta orqali qilasiz; vaucher QR kod bilan kabinetda saqlanadi." },
    ],
    faq: [
      { q: "Xona fondi haqiqatan bo'shligini qanday bilaman?", a: "Mehmonxona har bir so'rovni o'z panelida tasdiqlaydi. Tasdiqlanmagan so'rov uchun to'lov olinmaydi — pul qaytariladi." },
      { q: "Nonushta narxga kiradimi?", a: "3 yulduz va undan yuqori toifadagi mehmonxonalarda nonushta narxga kiritilgan. Mehmon uyida esa bu mehmonxona sozlamasiga bog'liq va kartochkada ko'rsatiladi." },
      { q: "Guruh uchun chegirma bormi?", a: "6 va undan ortiq xona bron qilinganda hamkorlar odatda 10–15% chegirma beradi. So'rov izohiga guruh sonini yozing." },
    ],
  },
  {
    slug: "restoran",
    direction: "restaurant",
    label: "Restoran",
    title: "Restoran, choyxona va gastronomik kechalar",
    desc: "Milliy taomlar, guruh uchun stollar va set-menyular. Oshxona va sig'im ma'lumoti bilan tasdiqlangan muassasalar.",
    image: img("1555396273-367ea4eb4db5"),
    highlights: [
      "Guruh uchun stol oldindan band qilinadi",
      "Set-menyu va taom narxi kelishiladi",
      "Halol va vegetarian variantlar mavjud",
    ],
    types: [
      { id: "milliy", label: "Milliy taomlar", desc: "Palov, kazi, manti va shurpa — mahalliy oshxona an'analari.", priceHint: "12–25 USD", keywords: ["milliy", "palov", "o'zbek", "oshxona"] },
      { id: "choyxona", label: "Choyxona", desc: "Sokin muhit, supacha va ko'k choy bilan nonushta yoki tushlik.", priceHint: "6–14 USD", keywords: ["choyxona", "nonushta", "choy"] },
      { id: "gastro", label: "Gastrobistro", desc: "Zamonaviy taqdimot: regional mahsulotlardan pishirilgan mualliflik menyusi.", priceHint: "25–55 USD", keywords: ["gastro", "bistro", "mualliflik", "zamonaviy"] },
      { id: "set", label: "Guruh set-menyusi", desc: "10–60 kishi uchun oldindan kelishilgan set-menyu va alohida zal.", priceHint: "15–40 USD/kishi", keywords: ["guruh", "set", "zal", "banket"] },
      { id: "ziyofat", label: "Ziyofat va marosim", desc: "To'y, yubiley va korporativ tadbirlar uchun to'liq zal ijarasi.", priceHint: "kelishiladi", keywords: ["ziyofat", "to'y", "marosim", "banket"] },
      { id: "street", label: "Street food turi", desc: "Bozor va ko'cha taomlari bo'ylab gid bilan gastrotur.", priceHint: "20–35 USD", keywords: ["street", "bozor", "ko'cha", "tur"] },
    ],
    how: [
      { title: "Joy va vaqtni tanlaysiz", desc: "Shahar, sana va kishi sonini kiritasiz — mutaxassis stol mavjudligini tekshiradi." },
      { title: "Menyu kelishiladi", desc: "Oshxona set-menyu variantini va yakuniy narxni bot orqali tasdiqlaydi." },
      { title: "To'lov va tasdiq", desc: "Oldindan to'lov yoki joyida to'lash variantini tanlaysiz." },
    ],
    faq: [
      { q: "Halol taomlar bormi?", a: "Ha. Restoran kartochkasida \"halol\" belgisi ko'rsatiladi; aksariyat milliy muassasalar sertifikatlangan." },
      { q: "Vegetarian menyu bormi?", a: "So'rov izohida yozsangiz, oshxona vegetarianset-menyu taklif qiladi." },
      { q: "Guruhga alohida zal kerak bo'lsa?", a: "\"Guruh set-menyusi\" turini tanlang — oshxona alohida zal ajratadi va narxni kelishadi." },
    ],
  },
  {
    slug: "gid",
    direction: "guide",
    label: "Gid",
    title: "Litsenziyali gidlar — shahar va marshrut bo'ylab",
    desc: "Tarix, hunarmandchilik yoki ziyoratga ixtisoslashgan gidlar. Har biri litsenziya raqami va tillarini ko'rsatadi.",
    image: img("1590674899484-d5640e854abe"),
    highlights: [
      "Litsenziya raqami va tillar tekshirilgan",
      "Kunlik yoki to'liq marshrut bo'yicha ishlaydi",
      "Reyting va bajarilgan buyurtmalar ochiq",
    ],
    types: [
      { id: "shahar", label: "Shahar gidi", desc: "Bir shahar bo'ylab 4–8 soatlik piyoda avtobus yurishi.", priceHint: "45–70 USD/kun", keywords: ["shahar", "piyoda", "city"] },
      { id: "marshrut", label: "Marshrut gidi", desc: "Ko'p shaharli grand-tur bo'ylab guruhni to'liq olib borish.", priceHint: "70–110 USD/kun", keywords: ["marshrut", "guruh", "grand"] },
      { id: "ziyorat", label: "Ziyorat gidi", desc: "Yetti pir va ziyoratgohlar bo'ylab ma'naviy marshrut.", priceHint: "55–85 USD/kun", keywords: ["ziyorat", "pir", "ma'naviy"] },
      { id: "trekking", label: "Trekking gidi", desc: "Tog' marshrutlari: Chatqol, Chimyon, Zomin. Xavfsizlik jihozi bilan.", priceHint: "60–95 USD/kun", keywords: ["trekking", "tog", "chasqol", "chatqol", "zomin"] },
      { id: "bolalar", label: "Bolalar uchun gid", desc: "Interaktiv format: muzey-o'yin va hunarmandchilik ustaxonasi.", priceHint: "50–80 USD/kun", keywords: ["bolalar", "oila", "kids"] },
      { id: "foto", label: "Fotosessiya gidi", desc: "Eng yaxshi suratga olish nuqtalarini biladigan gid + fotograf bilan ishlash.", priceHint: "60–100 USD/kun", keywords: ["foto", "surat", "lokatsiya"] },
    ],
    how: [
      { title: "Gidni tanlaysiz", desc: "Til, shahar va mutaxassislik (tarix, ziyorat, trekking) bo'yicha filtrlab, gidni tanlaysiz." },
      { title: "Marshrut kelishiladi", desc: "Gid kunlik dasturni taklif qiladi va kerakli chipta/nuqtalarni kelishasiz." },
      { title: "Kun davomida guruh", desc: "Kelishilgan joyda uchrashasiz; to'lov kabinet orqali himoyalangan tarzda amalga oshiriladi." },
    ],
    faq: [
      { q: "Gid litsenziyasi bormi?", a: "Ha. Har bir gid profilida litsenziya raqami ko'rsatiladi va administrator tomonidan tasdiqlanadi." },
      { q: "Necha kishi bilan ishlaydi?", a: "Guruh kattaligi gid kartochkasida ko'rsatiladi (odatda 2–16 kishi). Yakka gid ham mavjud." },
      { q: "Kirish chiptalari narxga kiradimi?", a: "Odatda alohida. Gid so'rovida \"chiptalar\" bandi kiritilganini tekshiring." },
    ],
  },
  {
    slug: "transfer",
    direction: "transfer",
    label: "Transfer",
    title: "Aeroport va shaharlararo transfer",
    desc: "Kunlik mashina holati nazorat qilinadigan, haydovchisi va sig'imi aniq ko'rsatilgan transport xizmati.",
    image: img("1449965408869-eaa3f722e40d"),
    highlights: [
      "Mashina modeli va o'rindiq soni aniq",
      "Kunlik texnik holat nazorati",
      "Kutib olish belgisi bilan aeroportda uchrashuv",
    ],
    types: [
      { id: "airport", label: "Aeroport transferi", desc: "Terminallarda kutib olish, belgi bilan uchrashish va mehmonxonaga yetkazish.", priceHint: "20–45 USD", keywords: ["aeroport", "transfer", "kutib"] },
      { id: "sharlararo", label: "Shaharlararo", desc: "Toshkent–Samarqand–Buxoro–Xiva yo'nalishlari, to'xtash joylari bilan.", priceHint: "60–160 USD", keywords: ["shaharlararo", "yo'nalish", "shahar"] },
      { id: "sedan", label: "Premium sedan", desc: "1–3 kishi uchun komfort sedan (Cobalt, Malibu, Camry).", priceHint: "25–60 USD", keywords: ["sedan", "camry", "malibu", "comfort"] },
      { id: "miniven", label: "Miniven (7 o'rin)", desc: "Oila yoki kichik guruh uchun 6–7 o'rindiqli miniven.", priceHint: "40–90 USD", keywords: ["miniven", "7", "oila", "guruh"] },
      { id: "avtobus", label: "Mikroavtobus (20+ o'rin)", desc: "Katta guruhlar uchun Hiace, Sprinter va avtobus.", priceHint: "120–320 USD", keywords: ["avtobus", "mikroavtobus", "20", "katta"] },
      { id: "kuzatuv", label: "Kunlik kuzatuv (8 soat)", desc: "Shahar bo'ylab kun bo'yi siz bilan: muzey, bozor va restoranlarga borish.", priceHint: "70–130 USD/kun", keywords: ["kuzatuv", "kunlik", "8 soat"] },
    ],
    how: [
      { title: "Marshrutni kiritasiz", desc: "Qayerdan–qayerga, sana va vaqtni yozasiz; kishi soni sig'imni belgilaydi." },
      { title: "Mashina tasdiqlanadi", desc: "Hamkor model, o'rindiq soni va raqamni botda tasdiqlaydi. Kunlik texnik holat yangilanadi." },
      { title: "Haydovchi bog'lanadi", desc: "Safar oldidan haydovchi telefon/Telegram orqali bog'lanadi va kutib oladi." },
    ],
    faq: [
      { q: "Kechki reys uchun qo'shimcha to'lov bormi?", a: "Ba'zi hamkorlar tungi reyslar uchun 10–20% qo'shimcha oladi. Bu so'rovda oldindan ko'rsatiladi." },
      { q: "Bolalar o'rindig'i bormi?", a: "Izohda yozsangiz, hamkor bolalar o'rindig'ini tayyorlaydi." },
      { q: "Mashina buzilib qolsa nima bo'ladi?", a: "Kunlik holat nazorati shu uchun: nosozlik aniqlansa hamkor zaxira mashina taqdim etadi." },
    ],
  },
  {
    slug: "tarjimon",
    direction: "translator",
    label: "Tarjimon",
    title: "Guruh uchun tarjimon va hamrohlik xizmati",
    desc: "Sinxron, ketma-ket yoki hamrohlik tarjimasi. Til va ish vaqti bo'yicha aniq kelishiladi.",
    image: img("1521737604893-d14cc237f11d"),
    highlights: [
      "Til juftligi va ixtisoslik bo'yicha tanlov",
      "Kunma-kun vazifa botda beriladi",
      "Uchrashuv va tadbir tarjimasi uchun tayyor",
    ],
    types: [
      { id: "hamroh", label: "Hamrohlik tarjimasi", desc: "Sayohat davomida guruh bilan yurib, muloqotni ta'minlaydi.", priceHint: "40–70 USD/kun", keywords: ["hamroh", "sayohat", "guruh"] },
      { id: "ketma-ket", label: "Ketma-ket tarjima", desc: "Uchrashuv, muzokara va taqdimotlarda ketma-ket tarjima.", priceHint: "60–110 USD/kun", keywords: ["ketma", "muzokara", "uchrashuv"] },
      { id: "sinxron", label: "Sinxron tarjima", desc: "Konferensiya va katta tadbirlar uchun jihoz bilan sinxron tarjima.", priceHint: "150–300 USD/kun", keywords: ["sinxron", "konferensiya", "tadbir"] },
      { id: "hujjat", label: "Hujjat tarjimasi", desc: "Shartnoma, vaucher va texnik hujjatlarni yozma tarjima qilish.", priceHint: "8–20 USD/sahifa", keywords: ["hujjat", "yozma", "shartnoma"] },
      { id: "til", label: "Til juftligi", desc: "EN, RU, CN, KR, AR, DE va boshqa tillar bo'yicha mutaxassislar.", priceHint: "kelishiladi", keywords: ["ingliz", "rus", "xitoy", "koreys", "arab", "nemis"] },
    ],
    how: [
      { title: "Til va formatni tanlaysiz", desc: "Til juftligi, kunlar soni va tadbir turini kiritasiz." },
      { title: "Tarjimon tasdiqlaydi", desc: "Mutaxassis bandligini tekshiradi va ish vaqtini tasdiqlaydi." },
      { title: "Kun bo'yicha hisob-kitob", desc: "Ish kunlari bo'yicha to'lov; qo'shimcha soatlar oldindan kelishiladi." },
    ],
    faq: [
      { q: "Qaysi tillar mavjud?", a: "Asosan EN, RU, CN, KR va AR. Boshqa tillar bo'yicha mutaxassis kartochkasida yozilgan." },
      { q: "Yarim kunlik ishlay oladimi?", a: "Ha, ko'pchilik tarjimonlar yarim kunlik (4 soat) tarif bo'yicha ishlaydi — izohda yozing." },
      { q: "Jihozlar kim ta'minlaydi?", a: "Sinxron tarjima uchun audio jihozni tarjimon jamoasi olib keladi; bu narxga kiritiladi." },
    ],
  },
  {
    slug: "fotograf",
    direction: "photographer",
    label: "Fotograf",
    title: "Professional fotograf va videograf",
    desc: "Shahar fotosessiyasi, to'y va marosim, gastro-reportaj hamda dron suratga olish xizmatlari.",
    image: img("1552037073-b3e2d10bcc6a"),
    highlights: [
      "Portfolio va ish uslubi oldindan ko'rinadi",
      "Tayyor suratlar 48 soat ichida",
      "Lokatsiya va yorug'lik vaqti rejalashtiriladi",
    ],
    types: [
      { id: "shahar", label: "Shahar fotosessiyasi", desc: "Registon, Ichan Qal'a va Labi Hovuzda 1–2 soatlik sessiya.", priceHint: "55–120 USD", keywords: ["shahar", "sessiya", "surat"] },
      { id: "toy", label: "To'y va marosim", desc: "To'liq kunlik reportaj: tayyorgarlikdan oxirgi raqsga qadar.", priceHint: "250–600 USD", keywords: ["to'y", "marosim", "reportaj"] },
      { id: "gastro", label: "Gastro-reportaj", desc: "Oshxona, taom va ustaxonalar uchun kontent suratga olish.", priceHint: "120–280 USD", keywords: ["gastro", "kontent", "oshxona"] },
      { id: "dron", label: "Dron (aerofoto)", desc: "Havo suratlari va video: Ichan Qal'a, cho'l va tog' panoramalari.", priceHint: "150–350 USD", keywords: ["dron", "havo", "aerofoto"] },
    ],
    how: [
      { title: "Uslub va lokatsiya", desc: "Portfolio ko'riladi, sessiya joyi va vaqti (oltin soat) kelishiladi." },
      { title: "Suratga olish", desc: "Belgilangan joyda uchrashasiz; davomiyligi turga qarab 1–8 soat." },
      { title: "Tayyor fayllar", desc: "Rangli ishlov berilgan suratlar 48 soat ichida havola orqali topshiriladi." },
    ],
    faq: [
      { q: "Barcha suratlar beriladimi?", a: "Qayta ishlov berilgan suratlar paketi va tanlangan kadrlar beriladi; xom fayllar alohida kelishiladi." },
      { q: "Tashqi lokatsiyaga borish narxi?", a: "Shahar ichida odatda kiritilgan; shahar tashqarisida yo'l xarajati qo'shiladi." },
      { q: "Video ham olasizmi?", a: "Ha, ko'pchilik fotograf videograf bilan birga ishlaydi — izohda video kerakligini yozing." },
    ],
  },
  {
    slug: "boshqa",
    direction: "other",
    label: "Boshqa xizmatlar",
    title: "Sug'urta, chipta va qo'shimcha turizm xizmatlari",
    desc: "Sayohat sug'urtasi, avia va poyezd chiptalari, viza-konsulxizmat, tibbiy yordam va aloqa paketlari.",
    image: img("1436491865332-7a61a109cc05"),
    highlights: [
      "Bir joyda: sug'urta, chipta, viza va aloqa",
      "Hujjatlar va muddatlar nazorat qilinadi",
      "Favqulodda holatda tezkor yordam",
    ],
    types: [
      { id: "sugurta", label: "Sayohat sug'urtasi", desc: "Tibbiy xarajat, bagaj va bekor qilishni qoplovchi polis.", priceHint: "12–60 USD", keywords: ["sug'urta", "polis", "insurance"] },
      { id: "chipta", label: "Avia va poyezd chiptasi", desc: "Ichki va xalqaro reyslar, Afrosiyob va sharq yo'nalishlari.", priceHint: "kelishiladi", keywords: ["chipta", "avia", "poyezd", "afrosiyob"] },
      { id: "viza", label: "Viza va konsulxizmat", desc: "Viza arizasi, taklifnoma va konsullik hujjatlari bo'yicha yordam.", priceHint: "40–150 USD", keywords: ["viza", "konsul", "hujjat"] },
      { id: "tibbiy", label: "Tibbiy yordam", desc: "Klinikaga yo'llash, tarjimon-shifokor va dori yetkazish.", priceHint: "kelishiladi", keywords: ["tibbiy", "klinika", "shifokor"] },
      { id: "aloqa", label: "SIM karta va internet", desc: "Mahalliy SIM, eSIM va mobil internet paketlari.", priceHint: "5–30 USD", keywords: ["sim", "internet", "esim", "aloqa"] },
      { id: "kruiz", label: "Kruiz va ekskursiya", desc: "Qo'shni davlatlarga qisqa kruiz va bir kunlik ekskursiyalar.", priceHint: "kelishiladi", keywords: ["kruiz", "ekskursiya", "tur"] },
    ],
    how: [
      { title: "Xizmatni tanlaysiz", desc: "Kerakli tur (sug'urta, chipta, viza va h.k.) va sanani kiritasiz." },
      { title: "Mutaxassis hisoblaydi", desc: "Narx va muddat tasdiqlanadi; hujjatlar ro'yxati yuboriladi." },
      { title: "Natija kabinetda", desc: "Polis, chipta yoki hujjat nusxasi shaxsiy kabinetda saqlanadi." },
    ],
    faq: [
      { q: "Sug'urta qaysi holatlarni qoplaydi?", a: "Standart polis tibbiy xarajat va bagajni qoplaydi. Ekstremal turizm uchun alohida variant talab qilinadi." },
      { q: "Viza kafolati bormi?", a: "Viza qarori konsullik vakolatida — biz hujjatlarni to'g'ri tayyorlashga kafolat beramiz, qarorga kafolat bermaymiz." },
      { q: "Chiptani qaytarish mumkinmi?", a: "Tarif shartlariga bog'liq; qaytarilmaydigan tariflar oldindan ogohlantiriladi." },
    ],
  },
];

/** Slug bo'yicha bitta xizmat sahifasi. */
export function findServicePage(slug: string | undefined): ServicePage | undefined {
  if (!slug) {
    return undefined;
  }
  return SERVICE_PAGES.find((page) => page.slug === slug);
}

/** Server `direction` qiymatidan slug'ga (masalan "hotel" → "mehmonxona"). */
export function slugForDirection(direction: Direction): string {
  return SERVICE_PAGES.find((page) => page.direction === direction)?.slug ?? "";
}
