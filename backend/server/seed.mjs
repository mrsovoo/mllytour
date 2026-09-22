/**
 * Demo ma'lumot generatori.
 *
 * Bu modul SQLite (`users` + `records`) ni haqiqiy mahsulotga o'xshash
 * ma'lumot bilan to'ldiradi: super admin, sayohatchilar, hamkorlar, tur
 * paketlar bo'yicha buyurtmalar, to'lovlar, vazifalar, marketplace e'lonlari,
 * lead'lar, sharhlar va Telegram bot hodisalari.
 *
 * Ikki joydan chaqiriladi:
 *   1. `npm run seed` (backend/scripts/seed.mjs) — lokal va serverda;
 *   2. `admin/seedDemo` REST amali — admin paneldagi tugma.
 *
 * Ma'lumot **deterministik** (bir xil seed → bir xil natija), shuning uchun
 * lokalda sinab ko'rilgan holat serverda ham takrorlanadi.
 */
import { randomUUID } from "node:crypto";

/** `--force` bilan tozalanadigan kind'lar. Foydalanuvchi va sessiyalarga tegilmaydi. */
export const SEED_KINDS = [
  "package",
  "provider",
  "market_item",
  "booking",
  "payment",
  "assignment",
  "telegram_event",
  "review",
  "review_reaction",
  "lead",
  "event",
  "plan",
  "payout",
  "subscription_invoice",
  "notification",
  "support_ticket",
  "document",
  "audit_log",
];

export const DEFAULT_ADMIN_EMAIL = "admin@millytour.uz";

/** [slug, title, city, days, narx] — `frontend/src/shared/data/catalog.ts` bilan bir xil. */
const PACKAGES = [
  ["samarqand-ikonik", "Samarqand ikonik: Registondan Shohi Zindaga", "Samarqand", 3, 299],
  ["buxoro-tarixiy", "Buxoro — Podshoh Ark va Labi Hovuz", "Buxoro", 4, 349],
  ["xiva-shaharcha", "Xiva — Ichan Qal'a kechki ziyorati", "Xiva", 2, 249],
  ["toshkent-mega", "Toshkent megapolisi va Chorsu bozori", "Toshkent", 2, 129],
  ["fargona-hunarmand", "Farg'ona vodiysi: Rishton kulolchilik va Marg'ilon atlas", "Farg'ona", 3, 219],
  ["buyuk-ipak-yoli", "Buyuk Ipak yo'li grand-turi: 5 shahar", "Toshkent · Samarqand · Buxoro", 9, 899],
  ["zomin-ekotur", "Zomin milliy bog'i — archa o'rmonida ekotur", "Zomin", 2, 159],
  ["chimyon-tog", "Chimyon tog' dam olish va teleferik", "Chimyon", 2, 119],
  ["aydarkul-yurta", "Aydar-Arnasoy ko'llari va yurta lager", "Nurota", 3, 279],
  ["rishton-kulolchilik", "Rishton kulolchilik master-klassi", "Rishton", 2, 179],
  ["buxoro-ziyorat", "Buxoro ziyorat yo'li: Naqshband va Chor Bakr", "Buxoro", 3, 259],
  ["shahrisabz-termiz", "Shahrisabz va Termiz — buddizm merosi", "Shahrisabz · Termiz", 4, 399],
  ["chatqol-trekking", "Chatqol trekking: Pskomdan Chimyon dovoniga", "Chatqol", 3, 229],
];

const TOURISTS = [
  ["aziz.karimov@millytour.uz", "Aziz Karimov", ["meros", "gastro"]],
  ["dilnoza.yusupova@millytour.uz", "Dilnoza Yusupova", ["hunarmandchilik", "foto"]],
  ["javohir.tursunov@millytour.uz", "Javohir Tursunov", ["ekotur", "trekking"]],
  ["malika.rahimova@millytour.uz", "Malika Rahimova", ["sog'liq", "sekin-sayohat"]],
  ["sardor.abdullayev@millytour.uz", "Sardor Abdullayev", ["meros", "tarix"]],
  ["nilufar.qodirova@millytour.uz", "Nilufar Qodirova", ["gastro", "musiqa"]],
  ["botir.ismoilov@millytour.uz", "Botir Ismoilov", ["sport", "tog'"]],
  ["zulfiya.nazarova@millytour.uz", "Zulfiya Nazarova", ["hunarmandchilik", "bozor"]],
  ["shohruh.ergashev@millytour.uz", "Shohruh Ergashev", ["avtopoyga", "ekotur"]],
  ["kamola.saidova@millytour.uz", "Kamola Saidova", ["meros", "foto"]],
  ["otabek.hasanov@millytour.uz", "Otabek Hasanov", ["meros", "avtopoyga"]],
  ["sevara.mirzayeva@millytour.uz", "Sevara Mirzayeva", ["gastro", "hunarmandchilik"]],
  ["islom.rasulov@millytour.uz", "Islom Rasulov", ["trekking", "ekotur"]],
  ["madina.tosheva@millytour.uz", "Madina Tosheva", ["foto", "musiqa"]],
  ["bekzod.olimov@millytour.uz", "Bekzod Olimov", ["tarix", "meros"]],
  ["gulbahor.ismoilova@millytour.uz", "Gulbahor Ismoilova", ["sekin-sayohat", "sog'liq"]],
  ["ruslan.akbarov@millytour.uz", "Ruslan Akbarov", ["sport", "tog'"]],
  ["nodira.sattorova@millytour.uz", "Nodira Sattorova", ["bozor", "gastro"]],
  ["temur.xolmatov@millytour.uz", "Temur Xolmatov", ["meros", "foto"]],
  ["zarina.abdullayeva@millytour.uz", "Zarina Abdullayeva", ["hunarmandchilik", "musiqa"]],
  ["firdavs.qobulov@millytour.uz", "Firdavs Qobulov", ["avtopoyga", "sport"]],
  ["lola.ergasheva@millytour.uz", "Lola Ergasheva", ["ekotur", "foto"]],
  ["sunatullo.mamatov@millytour.uz", "Sunatullo Mamatov", ["tarix", "ekotur"]],
  ["aziza.nurmatova@millytour.uz", "Aziza Nurmatova", ["sog'liq", "hunarmandchilik"]],
  ["bobur.saidov@millytour.uz", "Bobur Saidov", ["trekking", "meros"]],
  ["munisa.xudoyberdiyeva@millytour.uz", "Munisa Xudoyberdiyeva", ["gastro", "sekin-sayohat"]],
];

/** Hamkorlar — har yo'nalish uchun kamida bitta, turli holatlarda. */
const PROVIDERS = [
  ["Registon gidlar jamoasi", "guide", "Samarqand", "approved", 4.9, 128, 29, "+998 90 123 45 67", "@registon_guides", 9, ["uz", "ru", "en"], "Litsenziyali gidlar jamoasi: Registon, Go'ri Amir, Shohi Zinda yo'nalishlari."],
  ["Buxoro Transfer Servis", "transfer", "Buxoro", "approved", 4.7, 96, 39, "+998 91 234 56 78", "@buxoro_transfer", 6, ["uz", "ru"], "Aeroport va shaharlararo transfer: Cobalt, H1, Sprinter."],
  ["Xiva Boutique Inn", "hotel", "Xiva", "approved", 4.8, 74, 49, "+998 93 345 67 89", "@xiva_boutique", 11, ["uz", "ru", "en"], "Ichan Qal'a ichidagi 14 xonali butik mehmonxona."],
  ["Rishton kulolchilik uyi", "artisan", "Rishton", "approved", 4.9, 210, 19, "+998 94 456 78 90", "@rishton_ceramics", 14, ["uz", "ru"], "Uch avloddan beri kulolchilik: likop, kosa, koshin."],
  ["Samarqand Foto Studio", "photographer", "Samarqand", "approved", 4.6, 52, 25, "+998 97 567 89 01", "@samarqand_photo", 5, ["uz", "ru", "en"], "Registon va Konigil bo'ylab professional fotosessiyalar."],
  ["Sharq tarjimonlari", "translator", "Toshkent", "pending", 4.5, 18, 25, "+998 99 678 90 12", "@sharq_translators", 7, ["uz", "ru", "en", "tr"], "Guruhlarga sinxron va ketma-ket tarjimonlik."],
  ["Chorsu Gastro House", "restaurant", "Toshkent", "pending", 4.4, 31, 29, "+998 90 789 01 23", "@chorsu_gastro", 4, ["uz", "ru"], "Milliy taomlar, guruhlar uchun set-menyu va gastro kechalar."],
  ["Ipak Yo'li Sug'urta", "other", "Toshkent", "paused", 4.2, 9, 15, "+998 71 200 30 40", "@ipak_sugurta", 3, ["uz", "ru", "en"], "Turistlar uchun sug'urta va konsulxizmat."],
  // --- Transfer xizmatlari (har yirik shahar va aeroport uchun) ---
  ["Toshkent Aeroport Transfer", "transfer", "Toshkent", "approved", 4.8, 342, 45, "+998 90 200 10 10", "@tashkent_airport_transfer", 12, ["uz", "ru", "en", "tr"], "Toshkent xalqaro aeroportidan 24/7 individual va guruh transferi."],
  ["Samarqand Shuttle Line", "transfer", "Samarqand", "approved", 4.7, 268, 41, "+998 91 300 20 20", "@samarqand_shuttle", 8, ["uz", "ru", "en"], "Toshkent–Samarqand–Buxoro yo'nalishida kunlik microbus qatnovi."],
  ["Xiva Transfer & Tur", "transfer", "Xiva", "approved", 4.6, 154, 37, "+998 93 400 30 30", "@xiva_transfer", 7, ["uz", "ru"], "Urganch aeroporti, Xiva va Nukus yo'nalishlari; yurta lageriga yo'l."],
  ["Farg'ona Vodiy Trans", "transfer", "Farg'ona", "approved", 4.5, 121, 35, "+998 94 500 40 40", "@vodiy_trans", 9, ["uz", "ru", "ky"], "Farg'ona, Qo'qon, Andijon va Marg'ilon orasida qulay transfer."],
  ["Termiz Surxon Yo'li", "transfer", "Termiz", "pending", 4.4, 46, 33, "+998 99 600 50 50", "@termiz_yoli", 6, ["uz", "ru", "en"], "Termiz aeroporti va Surxondaryo ziyorat yo'nalishlari."],
  ["Buxoro Havo Yo'li Limo", "transfer", "Buxoro", "approved", 4.9, 187, 43, "+998 90 700 60 60", "@buxoro_limo", 15, ["uz", "ru", "en"], "Buxoro aeroporti, shahar ichi va Xiva yo'nalishi; VIP limousine."],
  // --- Gidlar, mehmonxonalar va boshqa xizmatlar ---
  ["Buxoro Meros Gidlari", "guide", "Buxoro", "approved", 4.9, 214, 31, "+998 91 800 70 70", "@buxoro_guides", 18, ["uz", "ru", "en", "de"], "UNESCO merosi bo'yicha ixtisoslashgan gidlar jamoasi."],
  ["Toshkent City Guides", "guide", "Toshkent", "approved", 4.7, 165, 27, "+998 93 900 80 80", "@tashkent_guides", 10, ["uz", "ru", "en"], "Metro, Chorsu va zamonaviy Toshkent bo'ylab shahar sayohatlari."],
  ["Samarqand Silk Road Inn", "hotel", "Samarqand", "approved", 4.8, 132, 51, "+998 97 110 90 90", "@silk_road_inn", 6, ["uz", "ru", "en"], "Registonga 7 daqiqa masofadagi 28 xonali 4* mehmonxona."],
  ["Toshkent Grand Plaza", "hotel", "Toshkent", "approved", 4.6, 96, 63, "+998 71 120 11 11", "@tashkent_grand", 9, ["uz", "ru", "en", "ko"], "Biznes-turistlar uchun konferens-zall va panorama manzarali xonalar."],
  ["Nurota Yurta Kamp", "hotel", "Nurota", "approved", 4.7, 58, 29, "+998 90 130 22 22", "@nurota_yurtakamp", 5, ["uz", "ru", "en"], "Aydar ko'li bo'yida 12 ta yurta va ochiq osmon ostidagi oshxona."],
  ["Marg'ilon Atlas Uyi", "artisan", "Marg'ilon", "approved", 4.9, 176, 21, "+998 91 140 33 33", "@margilon_atlas", 16, ["uz", "ru"], "Atlas va adras to'qish ustaxonasi: charx, bo'yash va master-klass."],
  ["Buxoro Zardo'zlik Markazi", "artisan", "Buxoro", "pending", 4.5, 37, 19, "+998 93 150 44 44", "@buxoro_zardozi", 11, ["uz", "ru"], "Zardo'zlik va kashtachilik bo'yicha oilaviy ustaxona."],
  ["Registon Foto Jamoa", "photographer", "Samarqand", "approved", 4.8, 88, 27, "+998 94 160 55 55", "@registon_photo", 8, ["uz", "ru", "en"], "To'y, family va sayohat fotosessiyalari; dron bilan suratga olish."],
  ["Tashkent Aerial Studio", "photographer", "Toshkent", "paused", 4.3, 41, 31, "+998 97 170 66 66", "@tashkent_aerial", 4, ["uz", "ru", "en"], "Reels va YouTube uchun videografiya, dron va steadycam."],
  ["Polyglot Tour Guides", "translator", "Samarqand", "approved", 4.7, 74, 33, "+998 99 180 77 77", "@polyglot_guides", 9, ["uz", "ru", "en", "fr", "es"], "Fransuz, ispan va nemis tillarida guruhlarga tarjimonlik."],
  ["Samarqand Choy Khana", "restaurant", "Samarqand", "approved", 4.6, 118, 27, "+998 90 190 88 88", "@samarqand_choykhana", 7, ["uz", "ru"], "Milliy oshxona: osh, somsa va choy marosimi; guruhlar uchun zallar."],
  ["Xiva Osh Markazi", "restaurant", "Xiva", "pending", 4.4, 34, 23, "+998 91 210 99 99", "@xiva_osh", 5, ["uz", "ru", "en"], "Tandir go'sht va Xorazm palovining ustozi."],
  ["Zomin Ekotur Boshqaruv", "other", "Zomin", "approved", 4.5, 52, 17, "+998 93 220 12 12", "@zomin_eco", 6, ["uz", "ru"], "Milliy bog' kirish ruxsatlari, marshrut va ekotur gidlar."],
];

const MARKET_ITEMS = [
  ["Rishton likopchasi — lakabi naqsh", "Kulolchilik", "Rishton", 48, "Rishton kulolchilik uyi", "approved", 3],
  ["Atlas va adras shoyi — Marg'ilon bo'lagi", "To'qimachilik", "Marg'ilon", 36, "Rishton kulolchilik uyi", "approved", 2],
  ["Buxoro zargarligi — kumush so'zma", "Zargarlik", "Buxoro", 120, "Buxoro Transfer Servis", "approved", 5],
  ["Xiva o'yma sandig'i — chilangar ishi", "Yog'och", "Xiva", 210, "Xiva Boutique Inn", "approved", 9],
  ["Samarqand koshin panosi — naqsh bo'rtmasi", "Kulolchilik", "Samarqand", 74, "Rishton kulolchilik uyi", "approved", 4],
  ["Qo'qon iroqi gilam — jun ipligi", "Gilam", "Qo'qon", 340, "Rishton kulolchilik uyi", "approved", 14],
  ["Buxoro zardo'zlik do'ppi", "To'qimachilik", "Buxoro", 58, "Buxoro Transfer Servis", "approved", 3],
  ["Nurota tut daraxtidan o'yma kitob javoni", "Yog'och", "Nurota", 156, "Xiva Boutique Inn", "approved", 7],
  ["Chust pichoq to'plami — o'yma dastali", "Metall", "Chust", 92, "Rishton kulolchilik uyi", "pending", 4],
  ["Nurota tuyatuyoq gilam — jundan", "Gilam", "Nurota", 265, "Xiva Boutique Inn", "pending", 10],
  ["Shahrisabz kashtachilik suzanisi", "Kashtachilik", "Shahrisabz", 134, "Rishton kulolchilik uyi", "pending", 6],
  ["Marg'ilon ipak ro'mol — klassik naqsh", "To'qimachilik", "Marg'ilon", 42, "Rishton kulolchilik uyi", "rejected", 2],
  ["Samarqand yog'och o'ymakorlik paneli", "Yog'och", "Samarqand", 168, "Samarqand Silk Road Inn", "approved", 8],
  ["Buxoro mis qandil — qo'lda bolg'alangan", "Metall", "Buxoro", 246, "Buxoro Zardo'zlik Markazi", "approved", 11],
  ["Xorazm ipak chorsi — qo'lda to'qilgan", "Gilam", "Xiva", 198, "Xiva Boutique Inn", "approved", 15],
  ["Toshkent kulolchilik choy to'plami", "Kulolchilik", "Toshkent", 64, "Rishton kulolchilik uyi", "approved", 3],
  ["Rishton koshin namozgoh — moviy naqsh", "Kulolchilik", "Rishton", 156, "Rishton kulolchilik uyi", "approved", 6],
  ["Nurota jundan to'qilgan uy sumkasi", "To'qimachilik", "Nurota", 38, "Nurota Yurta Kamp", "pending", 2],
  ["Farg'ona anor naqshli atlas ko'ylagi", "To'qimachilik", "Marg'ilon", 96, "Marg'ilon Atlas Uyi", "approved", 4],
  ["Buxoro zardo'zlik to'y kiyimi", "Kashtachilik", "Buxoro", 520, "Buxoro Zardo'zlik Markazi", "pending", 21],
  ["Samarqand miniatura rasm — Registon", "Rasm", "Samarqand", 84, "Registon Foto Jamoa", "approved", 5],
  ["Termiz qadimiy budda haykalchasi (nusxa)", "Suvenirlar", "Termiz", 46, "Termiz Surxon Yo'li", "approved", 3],
  ["Xiva o'yma eshik paneli", "Yog'och", "Xiva", 380, "Xiva Transfer & Tur", "pending", 18],
  ["Toshkent filigran kumush sirg'a", "Zargarlik", "Toshkent", 142, "Buxoro Zardo'zlik Markazi", "approved", 6],
  ["Zomin archa sharob qadahi (yog'och)", "Yog'och", "Zomin", 52, "Zomin Ekotur Boshqaruv", "approved", 3],
  ["Nurota tuya junidan qo'lqop", "To'qimachilik", "Nurota", 34, "Nurota Yurta Kamp", "rejected", 2],
  ["Samarqand kulolchilik guldon — turkuaz", "Kulolchilik", "Samarqand", 68, "Rishton kulolchilik uyi", "approved", 4],
  ["Buxoro qo'lda yozilgan xattotlik lavhasi", "Rasm", "Buxoro", 214, "Buxoro Zardo'zlik Markazi", "approved", 9],
  ["Marg'ilon ipak atlas chopon", "To'qimachilik", "Marg'ilon", 178, "Marg'ilon Atlas Uyi", "approved", 7],
];

/**
 * Xizmat buyurtmalari (tur paketga bog'lanmagan).
 * `service` — frontend `BookableService` qiymati, `perPerson` — kishi boshiga.
 */
const SERVICE_ORDERS = ["guide", "transfer", "hotel", "photographer", "translator", "restaurant", "artisan", "guide", "transfer", "hotel", "guide", "photographer", "transfer", "restaurant", "hotel", "artisan", "translator", "guide", "transfer", "hotel"];

const SERVICE_LABELS = {
  guide: "Gid xizmati",
  transfer: "Transfer xizmati",
  hotel: "Mehmonxona",
  photographer: "Fotosessiya",
  translator: "Tarjimon",
  restaurant: "Milliy oshxona",
  artisan: "Master-klass",
  other: "Turizm xizmati",
};

/** Xizmat uchun kunlik birlik narxi (USD). */
const SERVICE_RATES = {
  guide: 45,
  transfer: 60,
  hotel: 55,
  photographer: 70,
  translator: 80,
  restaurant: 30,
  artisan: 25,
  other: 40,
};

/** Transfer yo'nalishlari — haydovchi, mashina va masofa bilan. */
const TRANSFER_ROUTES = [
  ["Toshkent aeroporti → mehmonxona", "Toshkent", 0, 4, "Chevrolet Cobalt", 4, 25],
  ["Toshkent → Samarqand", "Toshkent · Samarqand", 300, 12, "Hyundai H1", 6, 90],
  ["Samarqand → Buxoro", "Samarqand · Buxoro", 270, 11, "Sprinter", 12, 130],
  ["Buxoro → Xiva", "Buxoro · Xiva", 450, 18, "Hyundai Starex", 8, 180],
  ["Urganch aeroporti → Xiva", "Urganch · Xiva", 35, 6, "Chevrolet Lacetti", 4, 40],
  ["Xiva → Nukus", "Xiva · Nukus", 190, 9, "Hyundai H1", 6, 110],
  ["Farg'ona → Marg'ilon → Qo'qon", "Farg'ona · Marg'ilon · Qo'qon", 120, 8, "Chevrolet Cobalt", 4, 70],
  ["Toshkent → Chimyon", "Toshkent · Chimyon", 80, 6, "Toyota Land Cruiser", 6, 95],
  ["Toshkent → Zomin", "Toshkent · Zomin", 180, 9, "Hyundai Starex", 8, 120],
  ["Termiz aeroporti → shahar", "Termiz", 12, 4, "Chevrolet Spark", 4, 30],
  ["Nurota → Aydar ko'li yurta lageri", "Nurota", 60, 6, "UAZ Patriot", 6, 85],
  ["Samarqand → Shahrisabz", "Samarqand · Shahrisabz", 90, 7, "Hyundai H1", 6, 100],
];

/** Obuna hisob-fakturalari uchun oylar (bugundan orqaga). */
const BILLING_MONTHS = 6;

/** Foydalanuvchi bildirishnomalari (mijoz kabinetining "Xabarlar" uchun). */
const NOTIFICATIONS = [
  ["booking", "Buyurtmangiz tasdiqlandi", "Hamkor xizmatni qabul qildi — marshrut tafsilotlari tayyor."],
  ["payment", "To'lov qabul qilindi", "To'lov muvaffaqiyatli o'tdi, kvitansiya profilingizda saqlanadi."],
  ["assignment", "Gid tayinlandi", "Sayohat kuningizga gid tayinlandi va aloqaga chiqadi."],
  ["review", "Fikringiz uchun rahmat", "Sharhingiz e'lon qilindi va boshqa sayohatchilarga yordam beradi."],
  ["event", "Yaqin tadbir", "Siz yoqtirgan yo'nalishda tadbir boshlanmoqda — joy band qiling."],
  ["plan", "AI dasturingiz yangilandi", "Milly AI byudjetingizga mos yangi variant tayyorladi."],
  ["document", "Hujjat tayyor", "Shartnoma va voucher yuklab olish uchun tayyor."],
  ["market", "E'loningiz tasdiqlandi", "Marketplace e'loni moderatsiyadan o'tdi va saytda ko'rinadi."],
  ["subscription", "Obuna eslatmasi", "Obuna muddati 7 kundan keyin tugaydi — balansni to'ldiring."],
  ["payout", "To'lov o'tkazildi", "Bu oylik daromadingiz hamyon hisobiga o'tkazildi."],
];

/** Yordam so'rovlari (support ticket). */
const SUPPORT_TICKETS = [
  ["To'lov qaytarish", "Buyurtmani bekor qildim, 3 kunda qaytariladi deb yozilgan.", "resolved", "payments"],
  ["Gid bilan aloqa", "Sayohatdan oldin gid telefon raqamini olishni istayman.", "resolved", "bookings"],
  ["Viza savoli", "O'zbekistonga vizasiz kirish tartibi bo'yicha ma'lumot kerak.", "open", "info"],
  ["Hamkorlik shartlari", "Komissiya foizi qanday hisoblanadi?", "pending", "providers"],
  ["Marketplace e'loni", "E'lonim nima uchun rad etildi?", "open", "market"],
  ["Bronni o'zgartirish", "Sayohat sanasini bir hafta kechiktirmoqchiman.", "resolved", "bookings"],
  ["Bot ishlamayapti", "Telegram botda /orders buyrug'i javob bermayapti.", "pending", "telegram"],
  ["Hisobga kirish", "Email OTP kodi kelmayapti.", "resolved", "auth"],
  ["Transferni bekor qilish", "Saqlandi, transferga ehtiyoj qolmadi.", "resolved", "bookings"],
  ["Narx bo'yicha taklif", "Guruh uchun chegirma bera olasizmi?", "open", "sales"],
  ["Fotograf xizmati", "To'yni suratga olish uchun qo'shimcha soatlar qo'shish mumkinmi?", "pending", "bookings"],
  ["Hujjat nusxasi", "Voucher va shartnomani yangidan yuboring.", "resolved", "documents"],
  ["Hunarmand mahsuloti", "Buyurtma qilgan likop buzilib yetib keldi.", "open", "market"],
  ["Obunani yangilash", "Hamkor obunasini qanday yangilayman?", "resolved", "subscription"],
];

/** Hamkor shartnomalari va hujjatlari. */
const DOCUMENTS = [
  ["contract", "Hamkorlik shartnomasi", "pdf", 128],
  ["license", "Faoliyat litsenziyasi", "pdf", 96],
  ["insurance", "Sug'urta polisi", "pdf", 64],
  ["voucher", "Sayohat voucheri", "pdf", 42],
  ["invoice", "Obuna hisob-fakturasi", "pdf", 38],
  ["passport", "Pasport nusxasi", "jpg", 210],
  ["vehicle", "Mashina texnik pasporti", "jpg", 88],
  ["sanitary", "Sanitariya xulosasi", "pdf", 54],
];

/** Admin harakatlari jurnali (audit log). */
const AUDIT_ACTIONS = [
  ["provider.approve", "Hamkor tasdiqlandi"],
  ["provider.pause", "Hamkor faoliyati to'xtatildi"],
  ["provider.subscription", "Obuna holati o'zgartirildi"],
  ["market.moderate", "Marketplace e'loni moderatsiya qilindi"],
  ["booking.status", "Buyurtma holati yangilandi"],
  ["payment.confirm", "To'lov tasdiqlandi"],
  ["payment.refund", "To'lov qaytarildi"],
  ["lead.handle", "Hamkorlik so'rovi ko'rib chiqildi"],
  ["bot.settings", "Bot tokenlari yangilandi"],
  ["bot.webhook", "Webhook ro'yxatdan o'tkazildi"],
  ["seed.demo", "Demo ma'lumot yuklandi"],
  ["user.role", "Foydalanuvchi huquqi o'zgartirildi"],
];

const LEADS = [
  ["Registon Tur Servis", "guide", "Samarqand", "Laziza Yo'ldosheva", "+998 90 111 22 33", "@laziza_guide", true],
  ["Zomin Ekotur Kamp", "other", "Zomin", "Ulug'bek Toshpo'latov", "+998 91 222 33 44", "@zomin_eco", false],
  ["Xiva Mehmon Uyi", "hotel", "Xiva", "Gulnora Allanazarova", "+998 93 333 44 55", "@xiva_guest", false],
  ["Nurota Kamel Safari", "other", "Nurota", "Bekzod Nurmatov", "+998 94 444 55 66", "@nurota_safari", true],
  ["Samarqand Gastronomi", "restaurant", "Samarqand", "Feruza Xolmatova", "+998 97 555 66 77", "@sam_gastro", false],
  ["Termiz Foto Yo'li", "photographer", "Termiz", "Anvar Xudoyberdiyev", "+998 99 666 77 88", "@termiz_foto", false],
  ["Urganch Transfer Plus", "transfer", "Urganch", "Sanjar Yo'ldoshev", "+998 90 121 34 56", "@urganch_transfer", true],
  ["Chimyon Alp Klub", "other", "Chimyon", "Rustam Ziyoyev", "+998 91 232 45 67", "@chimyon_alp", false],
  ["Qo'qon Hunarmandlar Uyi", "artisan", "Qo'qon", "Maqsuda Ergasheva", "+998 93 343 56 78", "@qoqon_craft", true],
  ["Shahrisabz Tarix Gidlari", "guide", "Shahrisabz", "Ilhom Safarov", "+998 94 454 67 89", "@shahrisabz_guide", false],
  ["Zomin Wellness Resort", "hotel", "Zomin", "Dilshod Rahimov", "+998 97 565 78 90", "@zomin_wellness", false],
  ["Registon Milliy Oshxona", "restaurant", "Samarqand", "Oysara Turaboeva", "+998 99 676 89 01", "@registon_osh", true],
  ["Nukus San'at Gidi", "guide", "Nukus", "Marat Jumaniyazov", "+998 90 787 90 12", "@nukus_art", false],
  ["Toshkent Biznes Transfer", "transfer", "Toshkent", "Kamron Ubaydullayev", "+998 91 898 01 23", "@tashkent_biz_transfer", true],
  ["Marg'ilon Ipak Savdo", "artisan", "Marg'ilon", "Zamira Yusupova", "+998 93 909 12 34", "@margilon_silk", false],
  ["Buxoro Tungi Sayohat", "guide", "Buxoro", "Fazliddin Rahmatov", "+998 94 010 23 45", "@buxoro_night", false],
  ["Termiz Arxeologik Ekskursiya", "guide", "Termiz", "Shahlo Ismoilova", "+998 97 111 34 56", "@termiz_arch", true],
  ["Xiva Foto Sayohat", "photographer", "Xiva", "Anvar G'ulomov", "+998 99 222 45 67", "@xiva_foto", false],
  ["Samarqand Tibbiy Turizm", "other", "Samarqand", "Lobar Nazarova", "+998 90 333 56 78", "@sam_med_tour", false],
  ["Farg'ona Gastronomik Tur", "restaurant", "Farg'ona", "Otabek Yo'ldoshev", "+998 91 444 67 89", "@fargona_gastro", false],
];

/** Takrorlanadigan tadbirlar. `packages` seed paytida PACKAGES dan yechiladi. */
const EVENTS = [
  ["navruz-bahor-festivali", "Navro'z bahor festivali", "Samarqand", 3, "18–24-mart", "festival", "Sumalak tayyorlash, dorbozlar va milliy o'yinlar — Registon maydonida.", ["samarqand-ikonik", "buyuk-ipak-yoli"], ["guide", "restaurant", "photographer"], 45],
  ["sharq-taronalari", "Sharq taronalari musiqa festivali", "Samarqand", 8, "24–30-avgust", "musiqa", "Markaziy Osiyo xonandalari va ansambllari ishtirokidagi xalqaro festival.", ["samarqand-ikonik"], ["guide", "hotel", "photographer"], 60],
  ["rishton-kulolchilik-kunlari", "Rishton kulolchilik kunlari", "Rishton", 5, "10–12-may", "hunarmandchilik", "Ustaxonalar ochiq eshiklar kuni, charxda ishlash va pishirish jarayoni.", ["rishton-kulolchilik", "fargona-hunarmand"], ["artisan", "guide"], 25],
  ["buxoro-gastro-kechasi", "Buxoro gastro kechasi", "Buxoro", 4, "har shanba", "gastro", "Labi Hovuz atrofida milliy taomlar degustatsiyasi va choy marosimi.", ["buxoro-tarixiy", "buxoro-ziyorat"], ["restaurant", "guide"], 30],
  ["ipak-yoli-yugurish", "Ipak yo'li yarim marafoni", "Xiva", 10, "5-oktabr", "sport", "Ichan Qal'a atrofida 21 km va 5 km masofalar.", ["xiva-shaharcha", "buyuk-ipak-yoli"], ["transfer", "other"], 20],
  ["aydar-kul-yurta-lageri", "Aydar-Arnasoy yurta lageri", "Nurota", 6, "iyun–sentabr", "festival", "Ko'l bo'yida yurta lager, ot minish va tungi oshxona.", ["aydarkul-yurta"], ["guide", "translator", "photographer"], 70],
  ["meros-ilmiy-forum", "Meros ilmiy forumi", "Toshkent", 11, "12–14-noyabr", "ilmiy", "Arxeologiya va restavratsiya bo'yicha xalqaro anjuman.", ["toshkent-mega"], ["hotel", "translator"], 40],
  ["zomin-ekotur-yigini", "Zomin ekotur yig'ini", "Zomin", 9, "20–22-sentabr", "sport", "Archa o'rmonida ekotur marshrutlar va qushlarni kuzatish.", ["zomin-ekotur", "chimyon-tog"], ["guide", "other"], 55],
  ["xiva-hunarmand-bozori", "Xiva hunarmandlar bozori", "Xiva", 4, "har juma", "hunarmandchilik", "Ichan Qal'a yonida yog'och o'ymakorligi, kashtachilik va gilam savdosi.", ["xiva-shaharcha"], ["artisan", "guide", "restaurant"], 22],
  ["toshkent-gastro-tur", "Toshkent gastro-tur kunlari", "Toshkent", 11, "1–3-noyabr", "gastro", "Chorsu bozoridan boshlanib, zamonaviy oshxonalar bilan yakunlanadigan tur.", ["toshkent-mega"], ["restaurant", "guide", "translator"], 35],
  ["nurota-tuya-festivali", "Nurota tuya festivali", "Nurota", 5, "12–14-may", "festival", "Tuya poygalari, yurta o'yinlari va cho'l oshxonasi.", ["aydarkul-yurta"], ["guide", "photographer", "restaurant"], 28],
  ["fargona-ipak-kunlari", "Farg'ona ipak kunlari", "Marg'ilon", 5, "18–20-aprel", "hunarmandchilik", "Atlas to'qish, tabiiy bo'yash va moda namoyishi.", ["fargona-hunarmand", "rishton-kulolchilik"], ["artisan", "guide", "photographer"], 32],
  ["termiz-buddizm-merosi", "Termiz buddizm merosi kuni", "Termiz", 12, "8-dekabr", "ilmiy", "Fayoztepa va Qirq-qiz qal'asi bo'ylab arxeologik ekskursiya.", ["shahrisabz-termiz"], ["guide", "translator", "hotel"], 30],
];

const REVIEW_TEXTS = [
  "Gid juda bilimdon, har bir obida tarixini batafsil tushuntirdi.",
  "Mehmonxona toza, nonushta boy. Tashkilotchilikka rahmat.",
  "Transfer o'z vaqtida keldi, haydovchi xushmuomala.",
  "Kulolchilik master-klassi eng yaxshi esda qolgan qism bo'ldi.",
  "Marshrut yaxshi rejalashtirilgan, charchamadik.",
  "Narxiga ko'ra juda yaxshi xizmat, oilamizga yoqdi.",
  "Fotograf suratlari kutilganidan ham chiroyli chiqdi.",
  "Restorandagi set-menyu mazali, guruh uchun qulay edi.",
  "Milly AI tavsiya qilgan paket byudjetimizga to'g'ri keldi.",
  "Tog'dagi trekking uchun jihoz va gid juda yaxshi edi.",
  "Bron qilish bir daqiqada bo'ldi, tasdiq darhol keldi.",
  "Yurta lager tajribasi unutilmas — yulduzlar ajoyib.",
  "Aeroportdan olib ketish xizmati juda qulay bo'ldi, kechikmadilar.",
  "Bot orqali buyurtma berish oson — SMS tasdiq darhol keldi.",
  "Gid bolalarga ham qiziqarli qilib aytib berdi, rahmat.",
  "Atlas ustaxonasida o'zim to'qigan ro'mol eng yaxshi suvenir bo'ldi.",
  "Registon tongi suratlari juda chiroyli — fotograf professional.",
  "Byudjetim cheklangan edi, Milly AI tejamkor variantni topdi.",
  "Zomin havosi toza, marshrutlar yaxshi belgilangan.",
  "Tarjimon kelishuv bo'yicha aniq ishladi, guruh mamnun qoldi.",
  "Shahar ichida transfer juda arzon va tez bo'ldi.",
  "Mehmonxona markazda, hamma joyda piyoda yetib bordik.",
  "Master-klassdan keyin o'zim yasagan kosa uyga yetib keldi.",
  "Hamkor bilan aloqa tez, savollarga darhol javob berdi.",
  "Tungi Buxoro sayohati kutilganidan ham ta'sirli bo'ldi.",
  "Chimyon teleferiki va tog' manzarasi ajoyib, albatta qaytamiz.",
  "Termizdagi budda merosi bo'yicha bilimli gid bilan sayohat yaxshi o'tdi.",
  "Narxlar saytdagidek, yashirin to'lovlar yo'q — ishonch qoldi.",
  "Oilaviy xona oldindan tayyorlangan, go'dak yatog'i ham bor edi.",
  "Obuna orqali hamkor panelida hisobotlarni ko'rish qulay.",
  "Xiva yurta kechasi va tandir go'shti esda qoldi.",
  "To'yimiz uchun fotograf tanlashda juda yordam berdilar.",
];

const BOT_EVENTS = [
  ["register", "main", "Yangi foydalanuvchi botda ro'yxatdan o'tdi"],
  ["booking", "main", "Tur paket uchun buyurtma yaratildi"],
  ["lead", "auth", "Hamkorlik so'rovi qabul qilindi"],
  ["login", "auth", "Telegram orqali kirish tasdiqlandi"],
  ["moderate", "stats", "Marketplace e'lon moderatsiya qilindi"],
  ["status", "stats", "Hamkor holati yangilandi"],
  ["start", "main", "/start buyrug'i qabul qilindi"],
  ["orders", "main", "/orders — buyurtmalar ro'yxati yuborildi"],
  ["plans", "main", "/plans — AI dasturlar yuborildi"],
  ["stats", "stats", "/stats — kunlik ko'rsatkichlar yuborildi"],
  ["link", "auth", "Hisob botga ulandi (link code)"],
  ["support", "main", "Yordam so'rovi operatorga uzatildi"],
  ["payment", "main", "To'lov havolasi yuborildi"],
  ["help", "main", "/help — buyruqlar ro'yxati yuborildi"],
  ["task", "auth", "Vazifa qabul qilindi (hamkor kabineti)"],
  ["payout", "stats", "Hamkor to'lovi hisoblandi"],
];

function mulberry32(seed) {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DAY = 24 * 60 * 60 * 1000;

function stamp(now, daysAgo, hour = 10) {
  const date = new Date(now - daysAgo * DAY);
  date.setHours(hour, 0, 0, 0);
  return date.getTime();
}

function isoDay(ms) {
  return new Date(ms).toISOString().slice(0, 10);
}

function reference(prefix, createdAt, rng) {
  const date = isoDay(createdAt).replaceAll("-", "");
  const code = Math.floor(rng() * 0xffffff)
    .toString(16)
    .toUpperCase()
    .padStart(6, "0");
  return `${prefix}-${date}-${code}`;
}

async function insertRecord(db, kind, data, userId, createdAt) {
  const id = randomUUID();
  await db.run(
    "INSERT INTO records (id, kind, user_id, data, created_at) VALUES (?, ?, ?, ?, ?)",
    id,
    kind,
    userId ?? null,
    JSON.stringify(data),
    createdAt,
  );
  return id;
}

async function upsertUser(db, user) {
  const email = user.email.toLowerCase();
  const existing = await db.get("SELECT * FROM users WHERE email = ?", email);
  if (existing) {
    if (user.role === "admin" && existing.role !== "admin") {
      await db.run("UPDATE users SET role = 'admin' WHERE id = ?", existing.id);
    }
    return existing.id;
  }
  const id = randomUUID();
  await db.run(
    `INSERT INTO users (id,email,name,is_anonymous,role,phone,country,language,interests,onboarded_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    email,
    user.name,
    user.role === "admin" ? 0 : 0,
    user.role || "user",
    user.phone || null,
    "UZ",
    "uz",
    JSON.stringify(user.interests || []),
    user.onboardedAt ?? Date.now(),
  );
  return id;
}

function providerEmail(businessName) {
  const slug = businessName
    .toLowerCase()
    .replaceAll("'", "")
    .replaceAll(/[^a-z0-9]+/g, ".")
    .replaceAll(/^\.|\.$/g, "");
  return `${slug}@partner.millytour.uz`;
}

async function existingCounts(db) {
  const rows = await db.all("SELECT kind, COUNT(*) AS count FROM records GROUP BY kind");
  const users = await db.get("SELECT COUNT(*) AS count FROM users");
  const counts = { users: users?.count ?? 0 };
  for (const row of rows) counts[row.kind] = row.count;
  return counts;
}

/**
 * Bazani demo ma'lumot bilan to'ldiradi.
 *
 * @param {import("sqlite").Database} db
 * @param {{ force?: boolean, adminEmail?: string, now?: number, seed?: number }} [options]
 */
export async function seedDemoData(db, options = {}) {
  const {
    force = false,
    adminEmail = DEFAULT_ADMIN_EMAIL,
    now = Date.now(),
    seed = 20260922,
  } = options;

  const before = await existingCounts(db);
  if (!force && (before.booking ?? 0) > 0) {
    return {
      seeded: false,
      reason: "Demo ma'lumot allaqachon mavjud. Qayta yozish uchun `npm run seed -- --reset`.",
      counts: before,
    };
  }

  if (force) {
    for (const kind of SEED_KINDS) {
      await db.run("DELETE FROM records WHERE kind = ?", kind);
    }
    await db.run("DELETE FROM users WHERE email LIKE '%@partner.millytour.uz' OR email LIKE '%@millytour.uz'");
    await db.run("DELETE FROM sessions WHERE user_id NOT IN (SELECT id FROM users)");
  }

  const rng = mulberry32(seed);
  const adminId = await upsertUser(db, {
    email: adminEmail,
    name: "Millytour Administrator",
    role: "admin",
  });

  // Sayohatchilar
  const touristIds = [];
  for (const [email, name, interests] of TOURISTS) {
    touristIds.push(await upsertUser(db, { email, name, interests, role: "user" }));
  }

  // Tur paketlar — `packages/list` shu yozuvlardan o'qiydi (bo'sh bo'lsa
  // frontend statik katalogga tushadi). Har bir katalog paketi uchun bitta yozuv.
  const PACKAGE_CATEGORIES = {
    Samarqand: "historical",
    Buxoro: "historical",
    Xiva: "historical",
    Toshkent: "city",
    "Farg'ona": "craft",
    "Toshkent · Samarqand · Buxoro": "historical",
    Zomin: "nature",
    Chimyon: "nature",
    Nurota: "nature",
    Rishton: "craft",
    "Shahrisabz · Termiz": "historical",
    Chatqol: "adventure",
  };
  const seededPackages = [];
  for (const [slug, title, city, days, priceFrom] of PACKAGES) {
    const createdAt = stamp(now, 150 - seededPackages.length * 4, 9);
    const rating = Number((4.4 + rng() * 0.5).toFixed(1));
    const reviews = 12 + Math.floor(rng() * 120);
    const packageId = await insertRecord(
      db,
      "package",
      {
        slug,
        title,
        summary: `${city} bo'ylab ${days} kunlik dastur — gid, transfer va turar joy kiritilgan.`,
        category: PACKAGE_CATEGORIES[city] || "historical",
        badge: seededPackages.length < 3 ? "Top tanlov" : null,
        city,
        region: city.split(" · ")[0],
        days,
        nights: Math.max(0, days - 1),
        priceFrom,
        oldPrice: seededPackages.length % 4 === 0 ? Math.round(priceFrom * 1.18) : null,
        rating,
        reviews,
        groupSize: days > 5 ? "6-16 kishi" : "2-12 kishi",
        nextDeparture: ["Har hafta", "Har seshanba va shanba", "Har kuni", "Oyning 10 va 25-kuni"][seededPackages.length % 4],
        languages: ["uz", "ru", "en"],
        includes: ["Gid xizmati", "Kirish chiptalari", "Tushlik", "Transport"],
        highlights: [`${city} merosi`, "Mahalliy oshxona", "Foto to'xtashlar"],
        image: "",
        alt: title,
        status: "published",
        featured: seededPackages.length < 3,
      },
      null,
      createdAt,
    );
    seededPackages.push({ id: packageId, slug, title, city, days, priceFrom });
  }

  // Hamkorlar + ularning foydalanuvchi hisoblari
  const providers = [];
  for (const [businessName, direction, city, status, rating, completedOrders, monthlyFee, phone, telegramUsername, experienceYears, languages, about] of PROVIDERS) {
    const email = providerEmail(businessName);
    const userId = await upsertUser(db, { email, name: businessName, phone, role: "user" });
    const createdAt = stamp(now, 90 - providers.length * 7);
    const providerId = await insertRecord(
      db,
      "provider",
      {
        userId,
        email,
        businessName,
        direction,
        city,
        phone,
        telegramUsername,
        telegramId: 500000000 + providers.length,
        about,
        experienceYears,
        languages,
        licenseNumber: direction === "guide" ? `GID-${2000 + providers.length}` : null,
        vehicle: direction === "transfer" ? { model: "Chevrolet Cobalt", seats: 4, plate: `01 A ${100 + providers.length} AA` } : null,
        rooms: direction === "hotel" ? 14 : null,
        rating,
        ratingCount: Math.round(completedOrders / 1.5),
        completedOrders,
        status,
        subscription: status === "approved" ? "active" : "trial",
        monthlyFee,
        paidUntil: status === "approved" ? stamp(now, -20) : null,
        walletBalance: status === "approved" ? Math.round(monthlyFee * rng() * 6) : 0,
        createdAt,
      },
      userId,
      createdAt,
    );
    providers.push({ id: providerId, userId, email, businessName, direction, city, monthlyFee, status, rating, completedOrders });
  }

  const approvedProviders = providers.filter((p) => p.status === "approved");

  // Buyurtmalar + to'lovlar + vazifalar
  const bookings = [];
  const payments = [];
  const assignments = [];
  const statusPlan = [
    ...Array(86).fill("completed"),
    ...Array(52).fill("confirmed"),
    ...Array(36).fill("pending"),
    ...Array(11).fill("new"),
    ...Array(21).fill("cancelled"),
  ];

  for (let index = 0; index < statusPlan.length; index += 1) {
    const status = statusPlan[index];
    const [slug, title, city, days, priceFrom] = PACKAGES[Math.floor(rng() * PACKAGES.length)];
    const guests = 1 + Math.floor(rng() * 5);
    // Sanalar shunday taqsimlanadi: pending — bugun/kecha, confirmed — so'nggi
    // 2 hafta, completed/cancelled — o'tmishga cho'zilgan. Shu tufayli admin
    // paneldagi 14 kunlik grafik "tirik" ko'rinadi.
    const daysAgo =
      status === "pending" || status === "new"
        ? Math.floor(rng() * 3)
        : status === "confirmed"
          ? 1 + Math.floor(rng() * 13)
          : status === "completed"
            ? 2 + Math.floor(rng() * 58)
            : 2 + Math.floor(rng() * 40);
    const createdAt = stamp(now, daysAgo, 9 + Math.floor(rng() * 8));
    const startDate = isoDay(createdAt + (3 + Math.floor(rng() * 25)) * DAY);
    const totalPrice = priceFrom * guests;
    const paid = status === "completed" || status === "confirmed" || (status === "pending" && rng() > 0.7);
    const reference_ = reference("MT", createdAt, rng);
    const userId = touristIds[Math.floor(rng() * touristIds.length)];
    const bookingId = await insertRecord(
      db,
      "booking",
      {
        reference: reference_,
        packageSlug: slug,
        kind: "package",
        title,
        city,
        days,
        guests,
        startDate,
        totalPrice,
        status,
        paymentStatus: paid ? "paid" : status === "cancelled" ? "refunded" : "unpaid",
        paymentMethod: paid ? ["click", "payme", "uzcard"][Math.floor(rng() * 3)] : null,
        note: "",
      },
      userId,
      createdAt,
    );
    bookings.push({ id: bookingId, userId, title, city, status, reference: reference_, totalPrice, startDate, guests, days, createdAt });

    if (paid) {
      const paymentCreatedAt = createdAt + 45 * 60 * 1000;
      const paymentRef = reference("PAY", paymentCreatedAt, rng);
      const paymentId = await insertRecord(
        db,
        "payment",
        {
          reference: paymentRef,
          bookingId,
          bookingReference: reference_,
          amount: totalPrice,
          method: ["click", "payme", "uzcard"][Math.floor(rng() * 3)],
          purpose: `Tur paketi: ${title}`,
          status: status === "cancelled" ? "refunded" : "paid",
        },
        userId,
        paymentCreatedAt,
      );
      payments.push(paymentId);
    }

    if (status !== "pending" && status !== "cancelled") {
      const provider =
        approvedProviders.find((p) => p.city === city) ||
        approvedProviders[Math.floor(rng() * approvedProviders.length)];
      const scheduled = createdAt + (5 + Math.floor(rng() * 20)) * DAY;
      const taskStatus = status === "completed" ? "done" : rng() > 0.45 ? "accepted" : "pending";
      await insertRecord(
        db,
        "assignment",
        {
          providerId: provider.id,
          providerUserId: provider.userId,
          bookingId,
          bookingReference: reference_,
          task: `${city} bo'ylab ${days} kunlik xizmat`,
          role: provider.direction,
          city,
          days,
          guests,
          amount: Math.round(totalPrice * 0.28),
          scheduledFor: scheduled,
          status: taskStatus,
          completedAt: taskStatus === "done" ? scheduled + days * DAY : null,
        },
        provider.userId,
        createdAt + 60 * 60 * 1000,
      );
    }
  }

  /** Yo'nalish bo'yicha tasdiqlangan hamkorlar. */
  const approvedByDirection = (direction) => approvedProviders.filter((p) => p.direction === direction);
  const anyApproved = () => approvedProviders[Math.floor(rng() * approvedProviders.length)];

  // Xizmat buyurtmalari (tur paketga bog'lanmagan: gid, transfer, mehmonxona...)
  const serviceStatusPlan = [
    ...Array(9).fill("completed"),
    ...Array(7).fill("confirmed"),
    ...Array(4).fill("pending"),
  ];
  for (let index = 0; index < SERVICE_ORDERS.length; index += 1) {
    const service = SERVICE_ORDERS[index];
    const status = serviceStatusPlan[index % serviceStatusPlan.length];
    const provider = approvedByDirection(service)[0] || anyApproved();
    const city = provider.city;
    const guests = 1 + Math.floor(rng() * 5);
    const days = 1 + Math.floor(rng() * 3);
    const units = Math.max(1, days - 1);
    const totalPrice = Math.round(SERVICE_RATES[service] * units * guests);
    const daysAgo =
      status === "pending" ? Math.floor(rng() * 3) : status === "confirmed" ? 1 + Math.floor(rng() * 12) : 4 + Math.floor(rng() * 40);
    const createdAt = stamp(now, daysAgo, 9 + Math.floor(rng() * 9));
    const reference_ = reference("MT", createdAt, rng);
    const userId = touristIds[Math.floor(rng() * touristIds.length)];
    const paid = status !== "pending";
    const bookingId = await insertRecord(
      db,
      "booking",
      {
        reference: reference_,
        kind: "service",
        service,
        title: `${SERVICE_LABELS[service] || "Xizmat"} — ${city}`,
        city,
        days,
        guests,
        startDate: isoDay(createdAt + (2 + Math.floor(rng() * 20)) * DAY),
        totalPrice,
        status,
        paymentStatus: paid ? "paid" : "unpaid",
        paymentMethod: paid ? ["click", "payme", "uzcard"][Math.floor(rng() * 3)] : null,
        providerId: provider.id,
        note: index % 5 === 0 ? "Guruh uchun alohida mashina kerak." : "",
      },
      userId,
      createdAt,
    );
    if (paid) {
      await insertRecord(
        db,
        "payment",
        {
          reference: reference("PAY", createdAt + 30 * 60 * 1000, rng),
          bookingId,
          bookingReference: reference_,
          amount: totalPrice,
          method: ["click", "payme", "uzcard"][Math.floor(rng() * 3)],
          purpose: `${SERVICE_LABELS[service]} · ${city}`,
          status: "paid",
        },
        userId,
        createdAt + 30 * 60 * 1000,
      );
    }

    const scheduled = createdAt + (4 + Math.floor(rng() * 18)) * DAY;
    const taskStatus = status === "completed" ? "done" : status === "confirmed" ? (rng() > 0.5 ? "accepted" : "pending") : "pending";
    await insertRecord(
      db,
      "assignment",
      {
        providerId: provider.id,
        providerUserId: provider.userId,
        bookingId,
        bookingReference: reference_,
        task: `${SERVICE_LABELS[service]} · ${city} · ${days} kun`,
        role: provider.direction,
        city,
        days,
        guests,
        amount: Math.round(totalPrice * 0.28),
        scheduledFor: scheduled,
        status: taskStatus,
        completedAt: taskStatus === "done" ? scheduled + days * DAY : null,
      },
      provider.userId,
      createdAt + 45 * 60 * 1000,
    );
  }

  // Transfer buyurtmalari — yo'nalish, mashina va masofa bilan (ikki marta aylanadi,
  // shunda transfer xizmati bo'yicha ham to'liq tarix yig'iladi).
  const transferProviders = approvedByDirection("transfer");
  for (let index = 0; index < TRANSFER_ROUTES.length * 3; index += 1) {
    const [route, routeCity, distanceKm, hours, vehicle, seats, basePrice] = TRANSFER_ROUTES[index % TRANSFER_ROUTES.length];
    const provider = transferProviders.find((p) => routeCity.startsWith(p.city)) || transferProviders[0] || anyApproved();
    const status = ["completed", "completed", "confirmed", "pending", "cancelled", "completed"][index % 6];
    const guests = Math.max(1, Math.min(seats, 1 + Math.floor(rng() * seats)));
    const extraStops = Math.floor(rng() * 3);
    const totalPrice = Math.round((basePrice + extraStops * 15) * (guests > seats / 2 ? 1.15 : 1));
    const daysAgo = status === "pending" ? Math.floor(rng() * 3) : status === "confirmed" ? 1 + Math.floor(rng() * 12) : 3 + Math.floor(rng() * 45);
    const createdAt = stamp(now, daysAgo, 8 + Math.floor(rng() * 10));
    const reference_ = reference("TR", createdAt, rng);
    const userId = touristIds[Math.floor(rng() * touristIds.length)];
    const paid = status !== "pending" && status !== "cancelled";
    const bookingId = await insertRecord(
      db,
      "booking",
      {
        reference: reference_,
        kind: "transfer",
        service: "transfer",
        title: route,
        route,
        city: routeCity,
        vehicle,
        seats,
        distanceKm,
        hours,
        guests,
        days: 1,
        extraStops,
        startDate: isoDay(createdAt + (2 + Math.floor(rng() * 25)) * DAY),
        totalPrice,
        status,
        paymentStatus: paid ? "paid" : status === "cancelled" ? "refunded" : "unpaid",
        paymentMethod: paid ? ["click", "payme", "uzcard"][Math.floor(rng() * 3)] : null,
        providerId: provider.id,
        note: guests > seats - 1 ? "Bolalar o'rindig'i kerak." : "",
      },
      userId,
      createdAt,
    );

    if (paid) {
      await insertRecord(
        db,
        "payment",
        {
          reference: reference("PAY", createdAt + 20 * 60 * 1000, rng),
          bookingId,
          bookingReference: reference_,
          amount: totalPrice,
          method: ["click", "payme", "uzcard"][Math.floor(rng() * 3)],
          purpose: `Transfer: ${route}`,
          status: status === "cancelled" ? "refunded" : "paid",
        },
        userId,
        createdAt + 20 * 60 * 1000,
      );
    }

    if (status !== "pending" && status !== "cancelled") {
      const scheduled = createdAt + (3 + Math.floor(rng() * 20)) * DAY;
      const taskStatus = status === "completed" ? "done" : rng() > 0.4 ? "accepted" : "pending";
      await insertRecord(
        db,
        "assignment",
        {
          providerId: provider.id,
          providerUserId: provider.userId,
          bookingId,
          bookingReference: reference_,
          task: `Transfer: ${route} (${vehicle})`,
          role: "transfer",
          city: routeCity,
          days: 1,
          guests,
          vehicle,
          amount: Math.round(totalPrice * 0.24),
          scheduledFor: scheduled,
          status: taskStatus,
          completedAt: taskStatus === "done" ? scheduled + DAY / 2 : null,
        },
        provider.userId,
        createdAt + 25 * 60 * 1000,
      );
    }
  }

  // Marketplace e'lonlari
  for (const [title, category, city, price, seller, status, handmadeDays] of MARKET_ITEMS) {
    const owner =
      approvedProviders.find((p) => p.businessName === seller) ||
      approvedProviders[Math.floor(rng() * approvedProviders.length)];
    const createdAt = stamp(now, Math.floor(rng() * 45), 11);
    await insertRecord(
      db,
      "market_item",
      {
        title,
        category,
        city,
        price,
        seller,
        handmadeDays,
        status,
        image: "",
        providerId: owner.id,
        moderatedAt: status === "pending" ? null : createdAt + 2 * DAY,
      },
      owner.userId,
      createdAt,
    );
  }

  // Lead'lar
  for (const [businessName, direction, city, contactName, phone, telegramUsername, handled] of LEADS) {
    const createdAt = stamp(now, Math.floor(rng() * 30), 12);
    await insertRecord(
      db,
      "lead",
      { businessName, direction, city, contactName, phone, telegramUsername, handled, source: "bot" },
      null,
      createdAt,
    );
  }

  // Sharhlar + reaksiyalar
  const reviewIds = [];
  for (let index = 0; index < 64; index += 1) {
    const [slug, title, city] = PACKAGES[Math.floor(rng() * PACKAGES.length)];
    const createdAt = stamp(now, Math.floor(rng() * 80), 15);
    const userId = touristIds[Math.floor(rng() * touristIds.length)];
    const reviewId = await insertRecord(
      db,
      "review",
      {
        packageSlug: slug,
        packageTitle: title,
        city,
        rating: rng() > 0.25 ? 5 : 4,
        text: REVIEW_TEXTS[index % REVIEW_TEXTS.length],
        authorName: TOURISTS[Math.floor(rng() * TOURISTS.length)][1],
        status: "approved",
        source: "site",
      },
      userId,
      createdAt,
    );
    reviewIds.push(reviewId);
  }
  for (const reviewId of reviewIds.slice(0, 48)) {
    await insertRecord(
      db,
      "review_reaction",
      { reviewId, kind: rng() > 0.2 ? "like" : "dislike" },
      touristIds[Math.floor(rng() * touristIds.length)],
      stamp(now, Math.floor(rng() * 20), 16),
    );
  }

  // AI rejalar (kabinet "Mening dasturlarim" bo'limi uchun)
  for (let index = 0; index < 12; index += 1) {
    const [slug, title, city, days, priceFrom] = PACKAGES[Math.floor(rng() * PACKAGES.length)];
    const travelers = 1 + Math.floor(rng() * 4);
    const total = priceFrom * travelers;
    await insertRecord(
      db,
      "plan",
      {
        title: `${city} · ${title.split(":")[0]}`.slice(0, 80),
        summary: `${days} kunlik dastur · ${travelers} kishi · ${city}`,
        packageSlug: slug,
        cities: [city],
        days: Array.from({ length: days }, (_, day) => ({
          day: day + 1,
          city,
          title: `${city} bo'ylab kun ${day + 1}`,
          lodging: index === 0 ? "4* mehmonxona" : "3* mehmonxona",
          spend: Math.round(total / days),
          items: [{ time: "09:00", title: "Shahar bo'ylab sayohat", note: "Mahalliy gid bilan", kind: "meros" }],
        })),
        estimate: {
          total,
          perPerson: Math.round(total / travelers),
          currency: "USD",
          withinBudget: true,
          breakdown: [{ label: "Turar joy va xizmatlar", amount: total }],
        },
        tips: ["Qulay oyoq kiyim kiying", "Naqd so'm olib yuring"],
        pack: ["Pasport", "Quyoshdan himoya", "Powerbank"],
      },
      touristIds[0],
      stamp(now, index * 4 + 1, 18),
    );
  }

  // Telegram bot hodisalari
  for (let index = 0; index < 96; index += 1) {
    const [kind, target, text] = BOT_EVENTS[Math.floor(rng() * BOT_EVENTS.length)];
    const failed = rng() > 0.92;
    await insertRecord(
      db,
      "telegram_event",
      {
        kind,
        target,
        text,
        chatId: 700000000 + Math.floor(rng() * 999),
        chatUsername: `user_${1000 + Math.floor(rng() * 8999)}`,
        userName: TOURISTS[Math.floor(rng() * TOURISTS.length)][1],
        command: kind === "orders" ? "/orders" : kind === "plans" ? "/plans" : kind === "stats" ? "/stats" : kind === "help" ? "/help" : null,
        status: failed ? "failed" : "delivered",
        error: failed ? "Telegram HTTP 502" : null,
      },
      null,
      stamp(now, Math.floor(rng() * 21), 8 + Math.floor(rng() * 12)),
    );
  }

  // Hamkor to'lovlari (payout) — tasdiqlangan hamkorlar uchun oylik hisob-kitob.
  for (const provider of approvedProviders) {
    for (let month = 0; month < 3; month += 1) {
      const createdAt = stamp(now, month * 30 + 4, 12);
      const gross = Math.round(provider.monthlyFee * (2 + rng() * 5));
      const commission = Math.round(gross * 0.12);
      await insertRecord(
        db,
        "payout",
        {
          reference: reference("PO", createdAt, rng),
          providerId: provider.id,
          providerName: provider.businessName,
          direction: provider.direction,
          period: isoDay(createdAt).slice(0, 7),
          gross,
          commission,
          net: gross - commission,
          status: month === 0 ? "pending" : "paid",
          paidAt: month === 0 ? null : createdAt + 2 * DAY,
          card: `8600 **** ${1000 + Math.floor(rng() * 8999)}`,
        },
        provider.userId,
        createdAt,
      );
    }
  }

  // Obuna hisob-fakturalari — oxirgi 6 oy uchun.
  for (const provider of approvedProviders) {
    for (let month = 0; month < BILLING_MONTHS; month += 1) {
      const createdAt = stamp(now, month * 30 + 1, 10);
      const unpaid = month === 0 && provider.subscription !== "active";
      await insertRecord(
        db,
        "subscription_invoice",
        {
          reference: reference("INV", createdAt, rng),
          providerId: provider.id,
          providerName: provider.businessName,
          plan: provider.monthlyFee >= 45 ? "pro" : "standard",
          amount: provider.monthlyFee,
          period: isoDay(createdAt).slice(0, 7),
          status: unpaid ? "unpaid" : "paid",
          method: unpaid ? null : ["click", "payme", "uzcard"][Math.floor(rng() * 3)],
          paidAt: unpaid ? null : createdAt + DAY,
        },
        provider.userId,
        createdAt,
      );
    }
  }

  // Foydalanuvchi bildirishnomalari — sayohatchilar kabinetining "Xabarlar" qismi.
  for (let index = 0; index < 84; index += 1) {
    const [kind, title, body] = NOTIFICATIONS[Math.floor(rng() * NOTIFICATIONS.length)];
    const userId = touristIds[Math.floor(rng() * touristIds.length)];
    await insertRecord(
      db,
      "notification",
      {
        kind,
        title,
        body,
        read: rng() > 0.45,
        channel: ["site", "telegram", "email"][Math.floor(rng() * 3)],
      },
      userId,
      stamp(now, Math.floor(rng() * 21), 7 + Math.floor(rng() * 14)),
    );
  }

  // Yordam so'rovlari (support ticket).
  for (let index = 0; index < SUPPORT_TICKETS.length; index += 1) {
    const [subject, message, status, category] = SUPPORT_TICKETS[index];
    const createdAt = stamp(now, Math.floor(rng() * 35), 9 + Math.floor(rng() * 10));
    const userId = index % 3 === 0 ? providers[index % providers.length].userId : touristIds[index % touristIds.length];
    await insertRecord(
      db,
      "support_ticket",
      {
        subject,
        message,
        status,
        category,
        priority: ["low", "normal", "high"][index % 3],
        assignee: status === "open" ? null : "Millytour qo'llab-quvvatlash",
        resolution: status === "resolved" ? "Masala hal qilindi va mijozga xabar berildi." : null,
        repliedAt: status === "open" ? null : createdAt + 6 * 60 * 60 * 1000,
      },
      userId,
      createdAt,
    );
  }

  // Hujjatlar (shartnoma, litsenziya, voucher va boshqalar).
  for (let index = 0; index < DOCUMENTS.length * 3; index += 1) {
    const [kind, title, format, sizeKb] = DOCUMENTS[index % DOCUMENTS.length];
    const provider = providers[index % providers.length];
    const createdAt = stamp(now, 5 + index * 3, 11);
    await insertRecord(
      db,
      "document",
      {
        kind,
        title,
        format,
        sizeKb,
        providerId: provider.id,
        providerName: provider.businessName,
        status: kind === "license" && provider.status !== "approved" ? "pending" : "verified",
        url: "",
      },
      provider.userId,
      createdAt,
    );
  }

  // Admin harakatlari jurnali (audit log).
  for (let index = 0; index < 64; index += 1) {
    const [action, labels] = AUDIT_ACTIONS[Math.floor(rng() * AUDIT_ACTIONS.length)];
    const target = rng() > 0.5 ? providers[Math.floor(rng() * providers.length)] : null;
    const createdAt = stamp(now, Math.floor(rng() * 30), 9 + Math.floor(rng() * 11));
    await insertRecord(
      db,
      "audit_log",
      {
        action,
        label: labels,
        actor: adminEmail,
        actorRole: "admin",
        targetType: action.split(".")[0],
        targetName: target ? target.businessName : null,
        targetId: target ? target.id : null,
        meta: { source: ["panel", "bot", "api"][Math.floor(rng() * 3)] },
      },
      null,
      createdAt,
    );
  }

  // Tadbirlar (oy bo'yicha takrorlanadi — oy yorlig'i backend'da hisoblanadi)
  for (const [slug, title, city, month, dates, kind, summary, packageSlugs, directions, price] of EVENTS) {
    const packages = packageSlugs
      .map((packageSlug) => PACKAGES.find(([candidate]) => candidate === packageSlug))
      .filter(Boolean)
      .map(([packageSlug, packageTitle, packageCity, , packagePrice]) => ({
        slug: packageSlug,
        title: packageTitle,
        city: packageCity,
        priceFrom: packagePrice,
      }));
    await insertRecord(
      db,
      "event",
      { slug, title, city, month, dates, kind, summary, directions, price, packages },
      null,
      stamp(now, 30),
    );
  }

  const after = await existingCounts(db);
  return {
    seeded: true,
    adminEmail,
    adminId,
    providers: providers.length,
    counts: after,
  };
}
