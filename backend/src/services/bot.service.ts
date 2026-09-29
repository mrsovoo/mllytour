import { config } from "../config/index.js";
import { prisma } from "../db/client.js";

const token = config.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN || "";
const partnerAppUrl = process.env.PARTNER_APP_URL || "https://millytour.vercel.app/partner/app";
const TELEGRAM_API = `https://api.telegram.org/bot${token}`;

async function telegramRequest(method: string, body: Record<string, unknown>): Promise<any> {
  if (!token) return null;
  try {
    const res = await fetch(`${TELEGRAM_API}/${method}`, {
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

const userStates = new Map<number, {
  step: string;
  direction?: string;
  businessName?: string;
  phone?: string;
  city?: string;
}>();

async function handleUpdate(update: any) {
  if (update.callback_query) {
    const query = update.callback_query;
    const chatId = query.message.chat.id;
    const data = query.data;

    await telegramRequest("answerCallbackQuery", { callback_query_id: query.id });

    if (data.startsWith("dir_")) {
      const direction = data.replace("dir_", "");
      userStates.set(chatId, { step: "ASK_NAME", direction });

      await telegramRequest("sendMessage", {
        chat_id: chatId,
        text: "Iltimos, Ismingiz yoki Tashkilotingiz (Firma) nomini kiriting:",
      });
      return;
    }
  }

  if (update.message?.text) {
    const chatId = update.message.chat.id;
    const text = update.message.text.trim();

    if (text === "/start") {
      try {
        const partner = await prisma.partner.findFirst({
          where: { telegramId: BigInt(chatId) },
        });

        if (partner) {
          if (partner.status === "APPROVED") {
            await telegramRequest("sendMessage", {
              chat_id: chatId,
              text: `Assalomu alaykum, ${partner.businessName}!\n\n🏠 MillyTour Hamkorlar Boshqaruv Portali:`,
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: "🚀 Boshqaruv Panelini Ochish (Mini App)",
                      web_app: { url: partnerAppUrl },
                    },
                  ],
                ],
              },
            });
            return;
          }
          if (partner.status === "PENDING") {
            await telegramRequest("sendMessage", {
              chat_id: chatId,
              text: "⏳ Sizning hamkorlik arizangiz ko'rib chiqilmoqda.\n\nAdmin tasdiqlashi bilan barcha imkoniyatlar ochiladi.",
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
        console.error("[Bot /start error]:", err);
      }

      await telegramRequest("sendMessage", {
        chat_id: chatId,
        text: "🤝 MillyTour Hamkor\n\nAssalomu alaykum!\nMillyTour hamkorlar va xizmat ko'rsatuvchilar platformasiga xush kelibsiz.\n\nAriza topshirish, xizmatlaringizni qo'shish va buyurtmalarni qabul qilish uchun quyidagi tugmani bosing:",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "🚀 Launch App (Hamkor Portali)",
                web_app: { url: partnerAppUrl },
              },
            ],
            [
              { text: "🧑‍🏫 Gid", callback_data: "dir_guide" },
              { text: "🚗 Haydovchi", callback_data: "dir_driver" },
            ],
            [
              { text: "🏨 Mehmonxona", callback_data: "dir_hotel" },
              { text: "🍽 Restoran", callback_data: "dir_restaurant" },
            ],
          ],
        },
      });
      return;
    }

    const state = userStates.get(chatId);
    if (!state) return;

    if (state.step === "ASK_NAME") {
      state.businessName = text;
      state.step = "ASK_PHONE";
      await telegramRequest("sendMessage", {
        chat_id: chatId,
        text: "Telefon raqamingizni kiriting (+998901234567):",
      });
      return;
    }

    if (state.step === "ASK_PHONE") {
      state.phone = text;
      state.step = "ASK_CITY";
      await telegramRequest("sendMessage", {
        chat_id: chatId,
        text: "Qaysi shaharda faoliyat yuritishingizni kiriting (masalan: Samarqand, Toshkent, Buxoro):",
      });
      return;
    }

    if (state.step === "ASK_CITY") {
      state.city = text;
      userStates.delete(chatId);

      try {
        await prisma.partner.create({
          data: {
            businessName: state.businessName || "Hamkor",
            phone: state.phone || "+998",
            city: state.city,
            direction: state.direction || "other",
            telegramId: BigInt(chatId),
            telegramUsername: update.message.from?.username || null,
            status: "PENDING",
          },
        });
      } catch (e) {
        console.error("[Bot save partner error]:", e);
      }

      await telegramRequest("sendMessage", {
        chat_id: chatId,
        text: "🎉 Arizangiz qabul qilindi!\n\nMillyTour ma'muriyati ma'lumotlaringizni tekshirib, tez orada tasdiqlaydi.",
      });
      return;
    }
  }
}

let offset = 0;
export async function startTelegramBot() {
  if (!token) {
    console.log("ℹ️ TELEGRAM_BOT_TOKEN sozlanmagan, bot faollashtirilmadi.");
    return;
  }

  console.log("🤖 MillyTour Telegram Bot muvaffaqiyatli ishga tushdi (Polling)...");

  while (true) {
    try {
      const res = await telegramRequest("getUpdates", {
        offset,
        timeout: 25,
      });

      if (res?.ok && Array.isArray(res.result)) {
        for (const update of res.result) {
          offset = update.update_id + 1;
          await handleUpdate(update);
        }
      }
    } catch {
      await new Promise((r) => setTimeout(r, 4000));
    }
  }
}
