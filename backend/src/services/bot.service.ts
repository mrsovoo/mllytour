import { config } from "../config/index.js";
import { prisma } from "../db/client.js";

const partnerToken = config.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN || "";
const touristToken = config.telegramMainBotToken || process.env.TELEGRAM_MAIN_BOT_TOKEN || "";

const partnerAppUrl = config.partnerAppUrl || process.env.PARTNER_APP_URL || "https://millytour.vercel.app/partner/app";
const clientAppUrl = config.clientAppUrl || process.env.CLIENT_APP_URL || "https://millytour.vercel.app";

const DIRECTIONS: Record<string, string> = {
  guide: "🧑‍🏫 Gid / Ekskursovod",
  driver: "🚗 Haydovchi / Transfer",
  hotel: "🏨 Mehmonxona",
  guesthouse: "🏕 Guest House (Mehmon uyi)",
  restaurant: "🍽 Restoran / Choyxona",
  touroperator: "🎯 Tur operator",
  photographer: "📸 Fotograf / Videograf",
  other: "✨ Boshqa turizm xizmati",
};

async function telegramRequest(token: string, method: string, body: Record<string, unknown>): Promise<any> {
  if (!token) return null;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return (await res.json()) as any;
  } catch (err) {
    console.error(`[Telegram ${method} error]:`, err);
    return null;
  }
}

// ==========================================
// 1. TOURIST BOT (@millytour_bot)
// ==========================================

async function setupTouristBot() {
  if (!touristToken) return;
  try {
    // 1. Launch App Menu Button: "MillyTour"
    await telegramRequest(touristToken, "setChatMenuButton", {
      menu_button: {
        type: "web_app",
        text: "MillyTour",
        web_app: { url: clientAppUrl },
      },
    });

    // 2. Bot buyruqlari
    await telegramRequest(touristToken, "setMyCommands", {
      commands: [
        { command: "start", description: "MillyTour ilovasini ochish" },
        { command: "tours", description: "O'zbekiston bo'ylab turlar" },
        { command: "help", description: "Yordam va qo'llab-quvvatlash" },
      ],
    });
    console.log("✅ @millytour_bot (Turist boti) menyu va buyruqlari muvaffaqiyatli sozlandi.");
  } catch (err) {
    console.error("[Setup Tourist Bot error]:", err);
  }
}

async function handleTouristUpdate(update: any) {
  if (!update.message?.text) return;
  const chatId = update.message.chat.id;
  const text = update.message.text.trim();
  const from = update.message.from;

  // Turistni bazada saqlash / yangilash
  try {
    if (from?.id) {
      await prisma.user.upsert({
        where: { telegramId: BigInt(from.id) },
        update: {
          telegramUsername: from.username || null,
          fullName: [from.first_name, from.last_name].filter(Boolean).join(" ") || "Sayohatchi",
        },
        create: {
          telegramId: BigInt(from.id),
          telegramUsername: from.username || null,
          fullName: [from.first_name, from.last_name].filter(Boolean).join(" ") || "Sayohatchi",
          role: "CUSTOMER",
        },
      });
    }
  } catch (err) {
    // Non-blocking
  }

  if (text === "/start") {
    const name = from?.first_name || "Sayohatchi";
    await telegramRequest(touristToken, "sendMessage", {
      chat_id: chatId,
      text: `Assalomu alaykum, ${name}! 🇺🇿✨\n\n` +
        `**MillyTour** — O'zbekiston bo'ylab sayohatlar va turizm platformasiga xush kelibsiz!\n\n` +
        `Bu yerda siz:\n` +
        `🏰 Samarqand, Buxoro, Xiva va boshqa tarixiy shaharlar turlari\n` +
        `🧑‍🏫 Professional gidlar va ekskursiyalar\n` +
        `🚗 Qulay transport va aeroport transferlari\n` +
        `🏨 Saralangan milliy mehmonxonalar va mehmon uylarini osongina bron qilishingiz mumkin.\n\n` +
        `👇 Pastdagi **MillyTour** tugmasi orqali ilovani to'liq ekranda oching:`,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "🚀 MillyTour ilovasini ochish",
              web_app: { url: clientAppUrl },
            },
          ],
          [
            {
              text: "🗺 Barcha turlar",
              web_app: { url: `${clientAppUrl}/tours` },
            },
            {
              text: "🛍 Milliy bozor",
              web_app: { url: `${clientAppUrl}/marketplace` },
            },
          ],
          [
            {
              text: "📞 Qo'llab-quvvatlash xizmati",
              url: "https://t.me/millytour_uz",
            },
          ],
        ],
      },
    });
    return;
  }

  if (text === "/tours") {
    try {
      const tours = await prisma.tour.findMany({
        where: { isActive: true },
        take: 4,
        orderBy: { featured: "desc" },
      });

      let tourMsg = "🌟 **O'zbekiston bo'ylab eng sara turlar:**\n\n";
      for (const t of tours) {
        tourMsg += `📍 **${t.title}**\n` +
          `⏳ Davomiyligi: ${t.durationDays} kun\n` +
          `💰 Narxi: ${t.basePriceUzs.toLocaleString("uz-UZ")} UZS\n\n`;
      }

      await telegramRequest(touristToken, "sendMessage", {
        chat_id: chatId,
        text: tourMsg,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "🔍 Barcha turlarni ko'rish va bron qilish",
                web_app: { url: `${clientAppUrl}/tours` },
              },
            ],
          ],
        },
      });
      return;
    } catch {
      await telegramRequest(touristToken, "sendMessage", {
        chat_id: chatId,
        text: "Turlarni ko'rish uchun quyidagi tugmani bosing:",
        reply_markup: {
          inline_keyboard: [
            [{ text: "🗺 Turlarni ochish", web_app: { url: `${clientAppUrl}/tours` } }],
          ],
        },
      });
      return;
    }
  }

  if (text === "/help") {
    await telegramRequest(touristToken, "sendMessage", {
      chat_id: chatId,
      text: `ℹ️ **MillyTour Yordam Markazi**\n\n` +
        `Savollaringiz yoki buyurtmalar bo'yicha yordam kerak bo'lsa:\n` +
        `🌐 Veb-sayt: [millytour.uz](${clientAppUrl})\n` +
        `📞 Aloqa: +998 (71) 200-00-00\n` +
        `💬 Operator: @millytour_uz\n\n` +
        `MillyTour ilovasini ochish uchun pastki chap burchakdagi **MillyTour** tugmasini bosing!`,
      parse_mode: "Markdown",
    });
    return;
  }
}

// ==========================================
// 2. PARTNER / AUTH BOT (@millyauth_bot)
// ==========================================

const partnerStates = new Map<number, {
  step: "ASK_NAME" | "ASK_PHONE" | "ASK_CITY" | "ASK_ABOUT";
  direction?: string;
  businessName?: string;
  phone?: string;
  city?: string;
}>();

async function setupPartnerBot() {
  if (!partnerToken) return;
  try {
    // 1. Launch App Menu Button: "Kirish"
    await telegramRequest(partnerToken, "setChatMenuButton", {
      menu_button: {
        type: "web_app",
        text: "Kirish",
        web_app: { url: partnerAppUrl },
      },
    });

    // 2. Bot buyruqlari
    await telegramRequest(partnerToken, "setMyCommands", {
      commands: [
        { command: "start", description: "Hamkorlik portali va ro'yxatdan o'tish" },
        { command: "status", description: "Arizangiz holatini tekshirish" },
        { command: "help", description: "Yordam va qo'llanma" },
      ],
    });
    console.log("✅ @millyauth_bot (Hamkor boti) menyu va buyruqlari muvaffaqiyatli sozlandi.");
  } catch (err) {
    console.error("[Setup Partner Bot error]:", err);
  }
}

async function handlePartnerUpdate(update: any) {
  // Callback query (yo'nalish tanlanganda)
  if (update.callback_query) {
    const query = update.callback_query;
    const chatId = query.message.chat.id;
    const data = query.data;

    await telegramRequest(partnerToken, "answerCallbackQuery", { callback_query_id: query.id });

    if (data.startsWith("dir_")) {
      const direction = data.replace("dir_", "");
      const dirTitle = DIRECTIONS[direction] || direction;
      partnerStates.set(chatId, { step: "ASK_NAME", direction });

      await telegramRequest(partnerToken, "sendMessage", {
        chat_id: chatId,
        text: `Siz **${dirTitle}** yo'nalishini tanladingiz.\n\n` +
          `1️⃣ Iltimos, **Ismingiz** yoki **Tashkilotingiz (Brend/Kompaniya)** nomini kiriting:`,
        parse_mode: "Markdown",
      });
      return;
    }
  }

  if (update.message?.text) {
    const chatId = update.message.chat.id;
    const text = update.message.text.trim();
    const from = update.message.from;

    if (text === "/start") {
      try {
        const partner = await prisma.partner.findFirst({
          where: { telegramId: BigInt(chatId) },
        });

        if (partner) {
          const dirTitle = DIRECTIONS[partner.direction] || partner.direction;
          if (partner.status === "APPROVED") {
            await telegramRequest(partnerToken, "sendMessage", {
              chat_id: chatId,
              text: `Assalomu alaykum, **${partner.businessName}**!\n\n` +
                `✅ Siz **MillyTour** tasdiqlangan rasmiy hamkorisiz.\n` +
                `🔹 Yo'nalishingiz: ${dirTitle}\n` +
                `📍 Shahar: ${partner.city}\n\n` +
                `Shaxsiy kabinetingizga kirish va buyurtmalarni boshqarish uchun pastdagi **Kirish** tugmasini bosing:`,
              parse_mode: "Markdown",
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: "🚀 Kirish (Hamkor Boshqaruv Paneli)",
                      web_app: { url: partnerAppUrl },
                    },
                  ],
                ],
              },
            });
            return;
          }

          if (partner.status === "PENDING") {
            await telegramRequest(partnerToken, "sendMessage", {
              chat_id: chatId,
              text: `⏳ Hurmatli **${partner.businessName}**!\n\n` +
                `Sizning hamkorlik arizangiz ma'muriyat tomonidan ko'rib chiqilmoqda.\n\n` +
                `📋 **Ariza ma'lumotlari:**\n` +
                `• Yo'nalish: ${dirTitle}\n` +
                `• Shahar: ${partner.city}\n` +
                `• Telefon: ${partner.phone}\n` +
                `• Holat: ⏳ Kutilmoqda (PENDING)\n\n` +
                `Ariza tasdiqlanishi bilan Telegram orqali xabar olasiz. Holatni Mini App orqali ham kuzatishingiz mumkin:`,
              parse_mode: "Markdown",
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: "🚀 Ariza Holatini Ko'rish (Mini App)",
                      web_app: { url: partnerAppUrl },
                    },
                  ],
                ],
              },
            });
            return;
          }
        }
      } catch (err) {
        console.error("[Partner bot /start check error]:", err);
      }

      // Yangi hamkor uchun xush kelibsiz xabari
      await telegramRequest(partnerToken, "sendMessage", {
        chat_id: chatId,
        text: `🤝 **MillyTour Hamkorlik Portali**\n\n` +
          `Assalomu alaykum! Siz O'zbekistonda turizm xizmati ko'rsatasizmi?\n\n` +
          `Biz quyidagi barcha yo'nalishlar bilan faol hamkorlik qilamiz:\n` +
          `• 🧑‍🏫 **Gidlar va ekskursovodlar**\n` +
          `• 🚗 **Haydovchilar va transfer xizmati**\n` +
          `• 🏨 **Mehmonxonalar va xostellar**\n` +
          `• 🏕 **Guest House (Mehmon uylari)**\n` +
          `• 🍽 **Restoranlar va milliy oshxonalar**\n` +
          `• 🎯 **Tur operatorlar va agentliklar**\n` +
          `• 📸 **Fotograflar va videograflar**\n\n` +
          `MillyTour orqali yangi mijozlar oqimi va kafolatlangan daromadga ega bo'ling!\n\n` +
          `👇 Ro'yxatdan o'tish uchun quyidagi yo'nalishingizni tanlang yoki pastki chap burchakdagi **Kirish** tugmasini bosing:`,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "🚀 Kirish (Hamkor Mini App)",
                web_app: { url: partnerAppUrl },
              },
            ],
            [
              { text: "🧑‍🏫 Gid", callback_data: "dir_guide" },
              { text: "🚗 Haydovchi", callback_data: "dir_driver" },
            ],
            [
              { text: "🏨 Mehmonxona", callback_data: "dir_hotel" },
              { text: "🏕 Guest House", callback_data: "dir_guesthouse" },
            ],
            [
              { text: "🍽 Restoran", callback_data: "dir_restaurant" },
              { text: "🎯 Tur operator", callback_data: "dir_touroperator" },
            ],
            [
              { text: "📸 Fotograf", callback_data: "dir_photographer" },
              { text: "✨ Boshqa xizmat", callback_data: "dir_other" },
            ],
          ],
        },
      });
      return;
    }

    if (text === "/status") {
      try {
        const partner = await prisma.partner.findFirst({
          where: { telegramId: BigInt(chatId) },
        });

        if (!partner) {
          await telegramRequest(partnerToken, "sendMessage", {
            chat_id: chatId,
            text: "Siz hali ro'yxatdan o'tmagansiz. Hamkorlik arizasini topshirish uchun /start buyrug'ini yuboring.",
          });
          return;
        }

        const dirTitle = DIRECTIONS[partner.direction] || partner.direction;
        const statusUz =
          partner.status === "APPROVED"
            ? "✅ Tasdiqlangan (Faol)"
            : partner.status === "PENDING"
            ? "⏳ Ko'rib chiqilmoqda"
            : partner.status === "REJECTED"
            ? `❌ Rad etilgan (${partner.rejectionReason || "Sabab ko'rsatilmadi"})`
            : "⚠️ To'xtatilgan";

        await telegramRequest(partnerToken, "sendMessage", {
          chat_id: chatId,
          text: `📊 **Hamkorlik arizangiz holati:**\n\n` +
            `• **Tashkilot/Ism:** ${partner.businessName}\n` +
            `• **Yo'nalish:** ${dirTitle}\n` +
            `• **Shahar:** ${partner.city}\n` +
            `• **Telefon:** ${partner.phone}\n` +
            `• **Holat:** ${statusUz}\n\n` +
            `Boshqaruv paneliga kirish uchun pastdagi **Kirish** tugmasini bosing:`,
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [{ text: "🚀 Hamkor Portali (Mini App)", web_app: { url: partnerAppUrl } }],
            ],
          },
        });
        return;
      } catch (err: any) {
        await telegramRequest(partnerToken, "sendMessage", {
          chat_id: chatId,
          text: `Arizani tekshirishda xatolik: ${err.message}`,
        });
        return;
      }
    }

    if (text === "/help") {
      await telegramRequest(partnerToken, "sendMessage", {
        chat_id: chatId,
        text: `🤝 **MillyTour Hamkorlar Qo'llab-quvvatlash Xizmati**\n\n` +
          `• Hamkorlik shartlari: Komissiya atigi 5-10%\n` +
          `• Ariza holatini tekshirish: /status\n` +
          `• Yangi ariza topshirish: /start\n` +
          `• Hamkorlik bo'yicha mas'ul: @millytour_admin\n` +
          `• Telefon: +998 (71) 200-00-00\n\n` +
          `Har doim chap pastki burchakdagi **Kirish** tugmasi orqali shaxsiy kabinetingizga kirishingiz mumkin!`,
        parse_mode: "Markdown",
      });
      return;
    }

    // Ro'yxatdan o'tish qadamlari (Wizard)
    const state = partnerStates.get(chatId);
    if (!state) return;

    if (state.step === "ASK_NAME") {
      state.businessName = text;
      state.step = "ASK_PHONE";
      await telegramRequest(partnerToken, "sendMessage", {
        chat_id: chatId,
        text: `2️⃣ Aloqa uchun **telefon raqamingizni** kiriting (+998901234567):`,
        parse_mode: "Markdown",
      });
      return;
    }

    if (state.step === "ASK_PHONE") {
      state.phone = text;
      state.step = "ASK_CITY";
      await telegramRequest(partnerToken, "sendMessage", {
        chat_id: chatId,
        text: `3️⃣ Qaysi **shahar yoki hududda** faoliyat yuritasiz?\n(masalan: Samarqand, Toshkent, Buxoro, Xiva):`,
        parse_mode: "Markdown",
      });
      return;
    }

    if (state.step === "ASK_CITY") {
      state.city = text;
      state.step = "ASK_ABOUT";
      await telegramRequest(partnerToken, "sendMessage", {
        chat_id: chatId,
        text: `4️⃣ Xizmatingiz haqida **qisqacha ma'lumot** bering\n(tajribangiz, tillar, mashina modeli, narxlar oralig'i):`,
        parse_mode: "Markdown",
      });
      return;
    }

    if (state.step === "ASK_ABOUT") {
      const about = text;
      partnerStates.delete(chatId);

      const dirTitle = DIRECTIONS[state.direction || "other"] || state.direction || "Xizmat";

      try {
        await prisma.partner.upsert({
          where: { telegramId: BigInt(chatId) },
          update: {
            businessName: state.businessName || "Hamkor",
            contactName: from?.first_name || state.businessName || "Hamkor",
            phone: state.phone || "+998",
            city: state.city || "O'zbekiston",
            direction: state.direction || "other",
            about,
            telegramUsername: from?.username || null,
            status: "PENDING",
          },
          create: {
            businessName: state.businessName || "Hamkor",
            contactName: from?.first_name || state.businessName || "Hamkor",
            phone: state.phone || "+998",
            city: state.city || "O'zbekiston",
            direction: state.direction || "other",
            about,
            telegramId: BigInt(chatId),
            telegramUsername: from?.username || null,
            status: "PENDING",
          },
        });

        // Audit log
        await prisma.auditLog.create({
          data: {
            action: "PARTNER_REGISTERED",
            targetType: "Partner",
            details: `Telegram orqali yangi hamkor ro'yxatdan o'tdi: ${state.businessName} (${dirTitle}, ${state.city})`,
          },
        });
      } catch (e) {
        console.error("[Bot save partner error]:", e);
      }

      await telegramRequest(partnerToken, "sendMessage", {
        chat_id: chatId,
        text: `🎉 **Tabriklaymiz, arizangiz muvaffaqiyatli qabul qilindi!**\n\n` +
          `📋 **Sizning ma'lumotlaringiz:**\n` +
          `• **Tashkilot/Ism:** ${state.businessName}\n` +
          `• **Yo'nalish:** ${dirTitle}\n` +
          `• **Shahar:** ${state.city}\n` +
          `• **Telefon:** ${state.phone}\n` +
          `• **Holat:** ⏳ Tekshirilmoqda (PENDING)\n\n` +
          `MillyTour ma'muriyati tez orada arizangizni ko'rib chiqadi va tasdiqlaydi.\n\n` +
          `Holatni tekshirish uchun /status buyrug'ini yuborishingiz yoki pastdagi **Kirish** tugmasi orqali Hamkor Mini App-ga kirishingiz mumkin!`,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "🚀 Kirish (Hamkor Portali)",
                web_app: { url: partnerAppUrl },
              },
            ],
          ],
        },
      });
      return;
    }
  }
}

// ==========================================
// 3. POLLING CONTROLLERS
// ==========================================

let touristOffset = 0;
async function pollTouristBot() {
  if (!touristToken) return;
  console.log("🤖 @millytour_bot (Turist boti) polling boshlandi...");

  while (true) {
    try {
      const res = await telegramRequest(touristToken, "getUpdates", {
        offset: touristOffset,
        timeout: 25,
      });

      if (res?.ok && Array.isArray(res.result)) {
        for (const update of res.result) {
          touristOffset = update.update_id + 1;
          await handleTouristUpdate(update);
        }
      }
    } catch {
      await new Promise((r) => setTimeout(r, 4000));
    }
  }
}

let partnerOffset = 0;
async function pollPartnerBot() {
  if (!partnerToken) return;
  console.log("🤖 @millyauth_bot (Hamkor boti) polling boshlandi...");

  while (true) {
    try {
      const res = await telegramRequest(partnerToken, "getUpdates", {
        offset: partnerOffset,
        timeout: 25,
      });

      if (res?.ok && Array.isArray(res.result)) {
        for (const update of res.result) {
          partnerOffset = update.update_id + 1;
          await handlePartnerUpdate(update);
        }
      }
    } catch {
      await new Promise((r) => setTimeout(r, 4000));
    }
  }
}

export async function startTelegramBot() {
  // 1. Menu va buyruqlarni sozlash
  await Promise.allSettled([setupTouristBot(), setupPartnerBot()]);

  // 2. Ikkala botni mustaqil parallel polling'ga qo'yish
  if (touristToken) {
    pollTouristBot().catch((err) => console.error("[Tourist Bot loop error]:", err));
  } else {
    console.log("ℹ️ TELEGRAM_MAIN_BOT_TOKEN topilmadi, turist boti faol emas.");
  }

  if (partnerToken) {
    pollPartnerBot().catch((err) => console.error("[Partner Bot loop error]:", err));
  } else {
    console.log("ℹ️ TELEGRAM_BOT_TOKEN topilmadi, hamkor boti faol emas.");
  }
}
