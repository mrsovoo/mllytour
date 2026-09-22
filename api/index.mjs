// Vercel serverless entry.
//
// Vercel faqat repo ildizidagi `api/` papkasini funksiya sifatida oladi, shuning
// uchun haqiqiy Express ilovasi `backend/` ichida tursa ham shu yupqa qobiq
// orqali ulaymiz (`vercel.json` dagi `/api/:path*` rewrite shu faylga keladi).
import app from "../backend/server/index.mjs";

export default app;
