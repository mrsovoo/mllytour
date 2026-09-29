import { prisma } from "./client.js";
import { hashPassword } from "../utils/security.js";

export async function seed() {
  console.log("🌱 Seeding MillyTour Database...");

  // 1. Platform Settings
  await prisma.setting.upsert({
    where: { key: "platform_commission_percent" },
    update: { value: "10" },
    create: {
      key: "platform_commission_percent",
      value: "10",
      description: "Platformaning har bir buyurtmadan oladigan foizi (%)",
    },
  });

  // 2. Default Super Admin
  const adminPassword = hashPassword("admin123");
  await prisma.adminUser.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      passwordHash: adminPassword,
      fullName: "Super Admin",
      role: "SUPER_ADMIN",
    },
  });

  // 3. Initial Tours
  const tours = [
    {
      title: "Samarqand & Buxoro Klassik Sayohatchi Turi",
      slug: "samarqand-buxoro-klassik",
      description: "Amir Temur poytaxti Samarqand va afsonaviy Buxoroi Sharif bo'ylab 3 kunlik unutilmas sayohat.",
      location: "Samarqand - Buxoro",
      durationDays: 3,
      basePriceUzs: 1800000,
      basePriceUsd: 140,
      basePriceEur: 130,
      category: "classic",
      featured: true,
      maxPeople: 15,
      images: {
        create: [
          {
            url: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1200&q=80",
            isPrimary: true,
            orderIndex: 0,
          },
        ],
      },
      days: {
        create: [
          { dayNumber: 1, title: "Registon va Go'ri Amir", description: "Samarqandga kelish, mehmonxonaga joylashish va Registon maydoni ziyorati." },
          { dayNumber: 2, title: "Bibixonim va Shohi Zinda", description: "Tarixiy obidalar va Siyob bozorida milliy shirinliklar xaridi." },
          { dayNumber: 3, title: "Qadimiy Buxoroga sayohat", description: "Afrosiyob poyezdida Buxoroga yo'l olish, Poi Kalon va Ark qal'asini ziyorat qilish." },
        ],
      },
    },
    {
      title: "Xiva & Qoraqalpog'iston Orol Sayohati",
      slug: "xiva-orol-ekspeditsiya",
      description: "Ichan Qal'a muzey shahri va Orol dengizi bo'ylab 4 kunlik eksklyuziv jip ekspeditsiyasi.",
      location: "Xiva - Mo'ynoq",
      durationDays: 4,
      basePriceUzs: 2900000,
      basePriceUsd: 230,
      basePriceEur: 215,
      category: "adventure",
      featured: true,
      maxPeople: 8,
      images: {
        create: [
          {
            url: "https://images.unsplash.com/photo-1569154941061-e231b4725ef1?auto=format&fit=crop&w=1200&q=80",
            isPrimary: true,
            orderIndex: 0,
          },
        ],
      },
      days: {
        create: [
          { dayNumber: 1, title: "Ichan Qal'aga xush kelibsiz", description: "Xiva shahriga yetib kelish, xonlar saroyi va minoralarni ko'rish." },
          { dayNumber: 2, title: "Qal'alar safari", description: "Qadimiy Tuproqqal'a va Ayozqal'a obidalarini o'rganish." },
          { dayNumber: 3, title: "Mo'ynoq kemalar qabristoni", description: "Orol fojiasi tarixi muzeyi va kemalar qabristoni." },
          { dayNumber: 4, title: "Orol dengizi qirg'oqlari", description: "Yurtalarda tunash va quyosh chiqishini kutib olish." },
        ],
      },
    },
  ];

  for (const tour of tours) {
    await prisma.tour.upsert({
      where: { slug: tour.slug },
      update: {},
      create: tour,
    });
  }

  console.log("✅ Database seeded successfully!");
}

if (process.argv[1].endsWith("seed.ts")) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
