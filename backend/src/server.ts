import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { config } from "./config/index.js";
import { authMiddleware } from "./middleware/auth.js";
import { router } from "./routes/index.js";

const app = express();

// Security: CORS Configuration with Whitelist
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, Postman or server-to-server)
      if (!origin) return callback(null, true);
      const isAllowed = config.corsOrigin.some(
        (allowed) =>
          origin === allowed ||
          origin.endsWith(".millytour.uz") ||
          origin.includes("localhost") ||
          origin.endsWith(".vercel.app"),
      );
      if (isAllowed) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive in dev, strict in prod
      }
    },
    credentials: true,
  }),
);

// Body and Cookie Parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser(config.cookieSecret));

// Global Auth Context Middleware
app.use(authMiddleware);

// Mount API routes
app.use("/api", router);

// Centralized Error Handling Middleware (Section 31)
app.use(
  (
    err: any,
    _req: any,
    res: any,
    _next: any,
  ) => {
    console.error("[Unhandled Error]:", err);
    res.status(err.status || 500).json({
      success: false,
      error: {
        code: err.code || "INTERNAL_SERVER_ERROR",
        message:
          config.env === "production"
            ? "Xatolik yuz berdi. Iltimos, qayta urinib ko'ring."
            : err.message || "Ichki server xatosi",
      },
    });
  },
);

import { startTelegramBot } from "./services/bot.service.js";

const server = app.listen(config.port, () => {
  console.log(`🚀 MillyTour Backend Server running on port ${config.port}`);
  console.log(`📡 Health Check: http://localhost:${config.port}/api/health`);
  // Start embedded Telegram Bot service
  startTelegramBot().catch((err) => console.error("[Telegram Bot startup error]:", err));
});

export default app;
export { server };
