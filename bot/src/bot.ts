import dotenv from "dotenv";
import path from "node:path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const token = process.env.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_MAIN_BOT_TOKEN || "";
const apiBase = process.env.API_URL || "http://localhost:4000";

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

// User state store
const userStates = new Map<number, {
  step: string;
  direction?: string;
  businessName?: string;
  phone?: string;
  city?: string;
}>();

async function handleUpdate(update: any) {
  // Callback query (Inline button clicked)
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

    if (data.startsWith("order_accept_")) {
      const orderId = data.replace("order_accept_", "");
      await telegramRequest("editMessageText", {
        chat_id: chatId,
        message_id: query.message.message_id,
        text: `✅ Buyurtma (#${orderId}) qabul qilindi. Tez orada mijoz bilan bog'laning.`,
      });
      return;
    }

    if (data.startsWith("order_reject_")) {
      const orderId = data.replace("order_reject_", "");
      await telegramRequest("editMessageText", {
        chat_id: chatId,
        message_id: query.message.message_id,
        text: `❌ Buyurtma (#${orderId}) rad etildi.`,
      });
      return;
    }
  }

  // Text messages
  if (update.message) {
    const msg = update.message;
    const chatId = msg.chat.id;
    const text = msg.text || "";
    const username = msg.from?.username || "";

    if (text === "/start") {
      userStates.delete(chatId);

      // Backend'dan hamkor holatini tekshirish
      try {
        const res = await fetch(`${apiBase}/api/partners/me?telegramId=${chatId}`);
        if (res.ok) {
          const json = (await res.json()) as any;
          if (json.data?.status === "APPROVED") {
            await telegramRequest("sendMessage", {
              chat_id: chatId,
              text: `Assalomu alaykum, ${json.data.businessName}!\n\n🏠 MillyTour Hamkorlar Bosh Menyu:`,
              reply_markup: {
                keyboard: [
                  [{ text: "👤 Profilim" }, { text: "🛎 Xizmatlarim" }],
                  [{ text: "📋 Buyurtmalar" }, { text: "💰 Daromad" }],
                  [{ text: "⭐ Reyting" }, { text: "⚙️ Sozlamalar" }],
                ],
                resize_keyboard: true,
              },
            });
            return;
          } else if (json.data?.status === "PENDING") {
            await telegramRequest("sendMessage", {
              chat_id: chatId,
              text: "⏳ Sizning hamkorlik arizangiz ko'rib chiqilmoqda.\n\nAdmin tasdiqlashi bilan barcha imkoniyatlar ochiladi.",
            });
            return;
          }
        }
      } catch {
        // Backend offline bo'lsa yangi ro'yxatdan o'tishga yo'naltiriladi
      }

      await telegramRequest("sendMessage", {
        chat_id: chatId,
        text: "Assalomu alaykum!\n\nMillyTour hamkorlar platformasiga xush kelibsiz.\nSiz qanday xizmat ko'rsatasiz?",
        reply_markup: {
          inline_keyboard: [
            [{ text: "🧑‍🏫 Gid", callback_data: "dir_guide" }, { text: "🚗 Haydovchi", callback_data: "dir_driver" }],
            [{ text: "🏨 Mehmonxona", callback_data: "dir_hotel" }, { text: "🍽 Restoran", callback_data: "dir_restaurant" }],
            [{ text: "🏕 Guest House", callback_data: "dir_guesthouse" }, { text: "🎯 Tur Operator", callback_data: "dir_touroperator" }],
            [{ text: "🛠 Boshqa xizmat", callback_data: "dir_other" }],
          ],
        },
      });
      return;
    }

    if (text === "👤 Profilim") {
      await telegramRequest("sendMessage", {
        chat_id: chatId,
        text: "👤 Sizning profilingiz: MillyTour Tasdiqlangan Hamkori (APPROVED)\nStatus: Faol",
      });
      return;
    }

    if (text === "📋 Buyurtmalar") {
      await telegramRequest("sendMessage", {
        chat_id: chatId,
        text: "📋 Hozircha sizga biriktirilgan yangi buyurtmalar mavjud emas.",
      });
      return;
    }

    if (text === "💰 Daromad") {
      await telegramRequest("sendMessage", {
        chat_id: chatId,
        text: "💰 Sizning hisobingiz:\n\nJami daromad: 0 UZS\nPlatforma komissiyasi (10%): 0 UZS\nYechib olishga tayyor: 0 UZS",
      });
      return;
    }

    if (text === "⭐ Reyting") {
      await telegramRequest("sendMessage", {
        chat_id: chatId,
        text: "⭐ Sizning reytingingiz: 5.0 (Yangi hamkor)",
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
        text: "Telefon raqamingizni kiriting (masalan: +998901234567) yoki 'Raqamni yuborish' tugmasini bosing:",
        reply_markup: {
          keyboard: [[{ text: "📱 Raqamni yuborish", request_contact: true }]],
          resize_keyboard: true,
          one_time_keyboard: true,
        },
      });
      return;
    }

    if (state.step === "ASK_PHONE") {
      state.phone = msg.contact?.phone_number || text;
      state.step = "ASK_CITY";
      await telegramRequest("sendMessage", {
        chat_id: chatId,
        text: "Qaysi shahar / viloyatda xizmat ko'rsatasiz? (masalan: Samarqand, Toshkent, Buxoro, Xiva)",
        reply_markup: { remove_keyboard: true },
      });
      return;
    }

    if (state.step === "ASK_CITY") {
      state.city = text;

      // Backend API ga arizani yuborish
      try {
        await fetch(`${apiBase}/api/partners/apply`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            businessName: state.businessName,
            phone: state.phone,
            direction: state.direction,
            city: state.city,
            telegramId: chatId.toString(),
            telegramUsername: username,
          }),
        });
      } catch (err) {
        console.error("Partner apply API error:", err);
      }

      userStates.delete(chatId);

      await telegramRequest("sendMessage", {
        chat_id: chatId,
        text: "🎉 Arizangiz qabul qilindi!\n\nMillyTour jamoasi ma'lumotlaringizni tekshiradi. Arizangiz admin tomonidan tasdiqlangach bu yerda xabar olasiz.",
        reply_markup: { remove_keyboard: true },
      });
      return;
    }
  }
}

// Long-polling updates loop
let offset = 0;
async function startPolling() {
  if (!token) {
    console.log("ℹ️ TELEGRAM_BOT_TOKEN kiritilmagan. Partner Bot kutish rejimida.");
    return;
  }

  console.log("🤖 MillyTour Partner Telegram Bot ishga tushdi (Polling)...");

  while (true) {
    try {
      const res = await telegramRequest("getUpdates", {
        offset,
        timeout: 30,
      });

      if (res?.ok && Array.isArray(res.result)) {
        for (const update of res.result) {
          offset = update.update_id + 1;
          await handleUpdate(update);
        }
      }
    } catch (err) {
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
}

startPolling();

export { handleUpdate };
