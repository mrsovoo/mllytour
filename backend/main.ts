import { Hono } from "hono";
import { serveStatic } from "hono/deno";

const app = new Hono();

// Frontend build chiqishi repo ildizidagi `frontend/dist` da. Yo'l shu faylga
// nisbatan hisoblanadi, shuning uchun buyruq qaysi papkadan berilsa ham ishlaydi.
const distDir = decodeURIComponent(new URL("../frontend/dist", import.meta.url).pathname);

// 1) Serve anything in /assets/**
app.use("/assets/*", serveStatic({ root: `${distDir}/assets` }));

// 2) Catch *all* other files in dist (CSS, JS, images, etc.)
app.use("*", serveStatic({ root: distDir }));

// 3) Fallback to index.html for the SPA
app.get("*", serveStatic({ path: `${distDir}/index.html` }));

Deno.serve(app.fetch);
