import dotenv from "dotenv";
import path from "node:path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

export const config = {
  env: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 4000),
  databaseUrl: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/millytour?schema=public",
  jwtSecret: process.env.JWT_SECRET || "millytour_super_secret_jwt_key_2026",
  cookieSecret: process.env.COOKIE_SECRET || "millytour_cookie_secret_2026",
  corsOrigin: (process.env.CORS_ORIGIN || "http://localhost:5173,http://localhost:3000,https://millytour.uz,https://admin.millytour.uz")
    .split(",")
    .map((o) => o.trim()),
  click: {
    serviceId: process.env.CLICK_SERVICE_ID || "test_click_service_id",
    merchantId: process.env.CLICK_MERCHANT_ID || "test_click_merchant_id",
    secretKey: process.env.CLICK_SECRET_KEY || "test_click_secret_key",
  },
  payme: {
    merchantId: process.env.PAYME_MERCHANT_ID || "test_payme_merchant_id",
    secretKey: process.env.PAYME_SECRET_KEY || "test_payme_secret_key",
  },
  card: {
    apiKey: process.env.CARD_PAYMENT_API_KEY || "test_card_api_key",
  },
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || "",
  telegramMainBotToken: process.env.TELEGRAM_MAIN_BOT_TOKEN || "",
  partnerAppUrl: process.env.PARTNER_APP_URL || "https://millytour-frontend-sovos-projects.vercel.app/partner/app",
  clientAppUrl: process.env.CLIENT_APP_URL || "https://millytour-frontend-sovos-projects.vercel.app",
};
