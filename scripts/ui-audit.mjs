/**
 * Responsive (UI) audit.
 *
 * Saytni headless Chrome'da telefonga o'xshatib ochib, gorizontal skroll
 * (overflow) bor-yo'qligini va uni keltirib chiqargan elementlarni topadi.
 *
 * Ishlatish:
 *   npm run dev          # boshqa terminalda Vite ishlab turishi kerak
 *   node scripts/ui-audit.mjs [--base=http://127.0.0.1:5173]
 */

import { spawn } from "node:child_process";

const BASE = process.argv.find((a) => a.startsWith("--base="))?.slice(7) ?? "http://127.0.0.1:5173";
/** `--admin`: faqat admin panel oqimini tekshiradi (npm run audit:admin). */
const ADMIN_MODE = process.argv.includes("--admin");
/** `--tourist`: turist kabineti oqimini tekshiradi (npm run audit:tourist). */
const TOURIST_MODE = process.argv.includes("--tourist");
const PORT = 9333;
const CHROME = process.env.CHROME_PATH || "google-chrome";

const ROUTES = [
  "/",
  "/paketlar",
  "/paketlar/samarqand-ikonik",
  "/shaharlar",
  "/shaharlar/samarqand",
  "/takliflar",
  "/xizmatlar",
  "/xizmatlar/mehmonxona",
  "/hunarmandlar",
  "/hamkorlar",
  "/hujjatlar",
  "/auth",
  "/nope",
];

const VIEWPORTS = [
  { name: "mobile", width: 390, height: 844, mobile: true },
  { name: "tablet", width: 768, height: 1024, mobile: true },
  { name: "desktop", width: 1440, height: 900, mobile: false },
];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const OVERFLOW_PROBE = `(() => {
  const vw = window.innerWidth;
  const offenders = [];
  for (const el of document.querySelectorAll("body *")) {
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) continue;
    const style = getComputedStyle(el);
    if (style.position === "fixed" && rect.left < -1) continue;
    if (rect.right > vw + 1 || rect.left < -1) {
      offenders.push({
        label:
          el.tagName.toLowerCase() +
          (el.className && typeof el.className === "string" ? "." + el.className.trim().split(/\\s+/).slice(0, 4).join(".") : ""),
        left: Math.round(rect.left),
        right: Math.round(rect.right),
      });
    }
  }
  // Eng o'ngga chiqib ketgan elementlar birinchi ko'rsatiladi.
  offenders.sort((a, b) => b.right - a.right);
  return {
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: vw,
    overflow: document.documentElement.scrollWidth > vw + 1,
    offenders: offenders
      .slice(0, 8)
      .map((o) => o.label + " [" + o.left + ".." + o.right + "]"),
  };
})()`;

/**
 * Admin panel auditi (`--admin`, `npm run dev:admin` yoniq bo'lishi kerak).
 *
 * Tekshiriladi: kirilmagan holatda `/admin` → `/auth`, admin-only rejimda
 * boshqa sahifalar `/admin` ga yo'naltirilishi, email OTP bilan kirish va
 * super admin huquqini berish ("Administrator bo'lish") oqimi.
 */
async function runAdminFlow(call) {
  let problems = 0;

  const evaluate = async (expression) => {
    const response = await call("Runtime.evaluate", {
      returnByValue: true,
      awaitPromise: true,
      expression,
    });
    return response?.result?.result?.value ?? {};
  };
  const goto = async (path, ms = 1900) => {
    await call("Page.navigate", { url: `${BASE}${path}` });
    await wait(ms);
  };

  // Panel yon menyusi faqat katta ekranda ko'rinadi — desktop o'lchamini o'rnatamiz.
  await call("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });

  console.log(`\nAdmin panel auditi: ${BASE}/admin\n`);

  // 1. Kirilmagan holatda himoya: /admin → /auth?returnTo=/admin
  await goto("/admin");
  const guard = await evaluate(`({
    path: location.pathname,
    search: location.search,
    hasForm: Boolean(document.querySelector("form")),
  })`);
  const guardOk = guard.path === "/auth" && String(guard.search).includes("returnTo");
  if (!guardOk) problems += 1;
  console.log(
    `Kirilmagan holat: /admin → ${guard.path}${guard.search ?? ""} → ` +
      `${guardOk ? "kirish sahifasiga yo'naltirildi ✅" : "xato ❌"}`,
  );

  // 2. Admin-only rejim: boshqa marshrutlar panel ichida qoladi (public sayt ko'rinmaydi)
  await goto("/paketlar", 1800);
  const adminOnly = await evaluate(`({
    path: location.pathname,
    publicSiteVisible: Boolean(document.querySelector("#qidiruv")) || Boolean(document.querySelector("#turlar")),
  })`);
  const adminOnlyOk =
    ["/admin", "/auth"].includes(adminOnly.path) && adminOnly.publicSiteVisible === false;
  if (!adminOnlyOk) problems += 1;
  console.log(
    `Admin-only rejim: /paketlar → ${adminOnly.path} (public sayt ko'rinadi=${adminOnly.publicSiteVisible}) → ` +
      `${adminOnlyOk ? "faqat panel ko'rinadi ✅" : "xato ❌"}`,
  );

  // 3. Email OTP bilan kirish (dev rejimida kod javobda keladi)
  await goto("/auth?returnTo=%2Fadmin", 1600);
  const signin = await evaluate(`(async () => {
    // Seed qilingan super admin emaili bilan kiriladi (bo'sh bazada hali admin
    // yo'q — o'shanda "Administrator bo'lish" oqimi sinaladi).
    const email = ${JSON.stringify(process.env.SEED_ADMIN_EMAIL || "admin@millytour.uz")};
    const request = await fetch("/api/auth/email/request", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email }),
    }).then((r) => r.json());
    if (!request.devCode) return { error: "devCode qaytmadi (SHOW_DEV_OTP=true kerak)" };
    const verify = await fetch("/api/auth/email/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ challengeId: request.challengeId, code: request.devCode }),
    }).then((r) => r.json());
    return { ok: Boolean(verify.ok), email: verify.user?.email ?? null };
  })()`);
  const signinOk = signin.ok === true;
  if (!signinOk) problems += 1;
  console.log(
    `Email OTP bilan kirish: ${signin.email ?? signin.error ?? "—"} → ` +
      `${signinOk ? "seans ochildi ✅" : "xato ❌"}`,
  );

  // 4. Panelni ochib, super admin huquqini berish oqimi
  await goto("/admin", 2100);
  const claim = await evaluate(`(async () => {
    const wrongPassword = document.body.innerText.includes("Administrator huquqi kerak");
    const button = [...document.querySelectorAll("button")].find((b) =>
      b.textContent.includes("Administrator bo'lish"),
    );
    if (!button) {
      return {
        claimButton: false,
        panel: document.body.innerText.includes("Umumiy ko'rsatkichlar"),
        blocked: wrongPassword,
      };
    }
    button.click();
    await new Promise((r) => setTimeout(r, 1700));
    return {
      claimButton: true,
      panel: document.body.innerText.includes("Umumiy ko'rsatkichlar"),
      blocked: false,
    };
  })()`);

  // 5. Yangilangandan keyin panel va admin statusi
  await goto("/admin", 2100);
  const panel = await evaluate(`(async () => {
    const response = await fetch("/api/rest/admin/status", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    }).then((r) => r.json());
    const text = document.body.innerText;
    const tabs = ["Umumiy ko'rsatkichlar", "Hamkorlar", "Buyurtmalar", "To'lovlar", "Bot sozlamalari"];
    return {
      isAdmin: Boolean(response.data?.isAdmin),
      tabs: tabs.filter((tab) => text.includes(tab)).length,
      path: location.pathname,
      preview: text.replace(/\\s+/g, " ").slice(0, 220),
    };
  })()`);
  const adminOk = panel.isAdmin === true && (panel.tabs ?? 0) >= 4 && panel.path === "/admin";
  if (!adminOk) problems += 1;
  console.log(
    `Administrator huquqi: ${claim.claimButton ? "\"Administrator bo'lish\" bosildi" : "tugma chiqmadi (allaqachon admin)"}`,
  );
  console.log(
    `Super admin paneli: /admin, bo'limlar=${panel.tabs}/5, isAdmin=${panel.isAdmin} → ` +
      `${adminOk ? "to'liq panel ochildi ✅" : "panel ochilmadi ❌"}`,
  );
  if (!adminOk) {
    console.log(`  ekranda: ${panel.preview || "(bo'sh)"}`);
  }

  return problems;
}

/**
 * Turist oqimi auditi (`--tourist`, `npm run dev` yoniq bo'lishi kerak).
 *
 * Tekshiriladi: kirilmagan holatda `/kabinet` → `/auth`, eski `/dashboard`
 * manzilining `/kabinet` orqali kirishga o'tishi, email OTP bilan kirish,
 * turist kabineti bo'limlari ko'rinishi va turistga operator (`/admin`)
 * bo'limining yopiqligi.
 */
async function runTouristFlow(call) {
  let problems = 0;

  const evaluate = async (expression) => {
    const response = await call("Runtime.evaluate", {
      returnByValue: true,
      awaitPromise: true,
      expression,
    });
    return response?.result?.result?.value ?? {};
  };
  const goto = async (path, ms = 2200) => {
    await call("Page.navigate", { url: `${BASE}${path}` });
    await wait(ms);
  };

  await call("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });

  console.log(`\nTurist oqimi auditi: ${BASE}/kabinet\n`);

  // 1. Kirilmagan holatda himoya: /kabinet → /auth?returnTo=/kabinet
  await goto("/kabinet");
  const guard = await evaluate(`({ path: location.pathname, search: location.search })`);
  const guardOk = guard.path === "/auth" && String(guard.search).includes("kabinet");
  if (!guardOk) problems += 1;
  console.log(
    `Kirilmagan holat: /kabinet → ${guard.path}${guard.search ?? ""} → ` +
      `${guardOk ? "kirish sahifasiga yo'naltirildi ✅" : "xato ❌"}`,
  );

  // 2. Eski /dashboard manzili kabinetga yo'naltiradi.
  await goto("/dashboard");
  const legacy = await evaluate(`({ path: location.pathname, search: location.search })`);
  const legacyOk = legacy.path === "/auth" && String(legacy.search).includes("kabinet");
  if (!legacyOk) problems += 1;
  console.log(
    `Eski manzil: /dashboard → ${legacy.path}${legacy.search ?? ""} → ` +
      `${legacyOk ? "/kabinet orqali kirishga o'tdi ✅" : "xato ❌"}`,
  );

  // 3. Email OTP bilan kirish (dev rejimida kod javobda keladi).
  await goto("/auth?returnTo=%2Fkabinet");
  const signin = await evaluate(`(async () => {
    const email = "tourist-audit@millytour.uz";
    const request = await fetch("/api/auth/email/request", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email }),
    }).then((r) => r.json());
    if (!request.devCode) return { error: "devCode qaytmadi (SHOW_DEV_OTP=true kerak)" };
    const verify = await fetch("/api/auth/email/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ challengeId: request.challengeId, code: request.devCode }),
    }).then((r) => r.json());
    return { ok: Boolean(verify.ok), email: verify.user?.email ?? null };
  })()`);
  const signinOk = signin.ok === true;
  if (!signinOk) problems += 1;
  console.log(
    `Email OTP bilan kirish: ${signin.email ?? signin.error ?? "—"} → ` +
      `${signinOk ? "seans ochildi ✅" : "xato ❌"}`,
  );

  // 4. Turist kabineti bo'limlari ochiladi.
  await goto("/kabinet");
  const cabinet = await evaluate(`(async () => {
    const text = document.body.innerText;
    const tabs = ["Buyurtmalar", "Tarix", "Reja", "Profil"];
    return {
      path: location.pathname,
      isTourist: text.toLowerCase().includes("sayohatchi profili"),
      tabs: tabs.filter((tab) => text.includes(tab)).length,
    };
  })()`);
  const cabinetOk = cabinet.path === "/kabinet" && cabinet.isTourist && (cabinet.tabs ?? 0) >= 4;
  if (!cabinetOk) problems += 1;
  console.log(
    `Turist kabineti: /kabinet, turist paneli=${cabinet.isTourist}, bo'limlar=${cabinet.tabs}/4 → ` +
      `${cabinetOk ? "ochildi ✅" : "ochilmadi ❌"}`,
  );

  // 4b. Qo'llab-quvvatlash chat oynasi ochiladi.
  const support = await evaluate(`(async () => {
    const trigger = [...document.querySelectorAll("button, a")].find((el) =>
      (el.getAttribute("aria-label") || "").includes("bog'lanish"),
    );
    if (!trigger) return { found: false };
    trigger.click();
    await new Promise((r) => setTimeout(r, 800));
    const panel = [...document.querySelectorAll("section")].find((el) =>
      (el.getAttribute("aria-label") || "").toLowerCase().includes("quvvatlash"),
    );
    return {
      found: true,
      open: Boolean(panel),
      hasInput: Boolean(panel && panel.querySelector("textarea")),
    };
  })()`);
  const supportOk = support.found && support.open && support.hasInput;
  if (!supportOk) problems += 1;
  console.log(
    `Support chat: tugma=${support.found}, oyna=${support.open}, matn maydoni=${support.hasInput} → ` +
      `${supportOk ? "ochildi ✅" : "ochilmadi ❌"}`,
  );

  // 4c. Xabar yuboriladi va avtomatik javob qaytadi.
  const supportSend = await evaluate(`(async () => {
    const sendResponse = await fetch("/api/support/send", {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: "Audit: yordam kerak" }),
    }).then((r) => r.json());
    const thread = await fetch("/api/support/thread", { credentials: "include" }).then((r) =>
      r.json(),
    );
    const messages = thread.messages || [];
    return {
      ok: Boolean(sendResponse.ok),
      count: messages.length,
      hasSupport: messages.some((m) => m.role === "support"),
    };
  })()`);
  const supportSendOk = supportSend.ok && (supportSend.count ?? 0) >= 2 && supportSend.hasSupport;
  if (!supportSendOk) problems += 1;
  console.log(
    `Support suhbat: xabar yuborildi=${supportSend.ok}, xabarlar=${supportSend.count}, javob=${supportSend.hasSupport} → ` +
      `${supportSendOk ? "ishlayapti ✅" : "xato ❌"}`,
  );

  // 5. Turist operator bo'limiga kira olmaydi: /admin panel ochilmaydi.
  await goto("/admin");
  const operator = await evaluate(`(async () => {
    const text = document.body.innerText;
    return {
      path: location.pathname,
      panelOpen: text.includes("Umumiy ko'rsatkichlar") && text.includes("Bot sozlamalari"),
    };
  })()`);
  const operatorOk = operator.panelOpen === false;
  if (!operatorOk) problems += 1;
  console.log(
    `Operator bo'limi himoyasi: /admin → ${operator.path}, panel ochildi=${operator.panelOpen} → ` +
      `${operatorOk ? "turistga yopiq ✅" : "OCHIQ ❌"}`,
  );

  return problems;
}

async function main() {
  const chrome = spawn(
    CHROME,
    [
      "--headless=new",
      `--remote-debugging-port=${PORT}`,
      "--no-sandbox",
      "--disable-gpu",
      "--hide-scrollbars",
      "about:blank",
    ],
    { stdio: "ignore" },
  );

  const cleanup = () => {
    try {
      chrome.kill();
    } catch {
      /* already gone */
    }
  };
  process.on("exit", cleanup);

  // DevTools endpoint tayyor bo'lishini kutamiz.
  let targets = null;
  for (let attempt = 0; attempt < 20 && !targets; attempt += 1) {
    await wait(400);
    try {
      const response = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      targets = await response.json();
    } catch {
      targets = null;
    }
  }
  if (!targets) {
    console.error("Chrome DevTools ochilmadi — chrome o'rnatilganini tekshiring.");
    process.exit(1);
  }

  const page = targets.find((t) => t.type === "page");
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  let nextId = 0;
  const pending = new Map();
  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      pending.get(message.id)(message);
      pending.delete(message.id);
    }
  };
  const call = (method, params = {}) =>
    new Promise((resolve) => {
      const id = (nextId += 1);
      pending.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });

  await call("Page.enable");
  await call("Runtime.enable");

  if (ADMIN_MODE) {
    const adminProblems = await runAdminFlow(call);
    ws.close();
    cleanup();
    console.log(
      adminProblems === 0 ? "\nAdmin oqimi toza ✅" : `\n${adminProblems} ta muammo topildi ❌`,
    );
    process.exit(adminProblems === 0 ? 0 : 1);
  }

  if (TOURIST_MODE) {
    const touristProblems = await runTouristFlow(call);
    ws.close();
    cleanup();
    console.log(
      touristProblems === 0 ? "\nTurist oqimi toza ✅" : `\n${touristProblems} ta muammo topildi ❌`,
    );
    process.exit(touristProblems === 0 ? 0 : 1);
  }

  let problems = 0;
  for (const viewport of VIEWPORTS) {
    await call("Emulation.setDeviceMetricsOverride", {
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: 1,
      mobile: viewport.mobile,
    });

    for (const route of ROUTES) {
      await call("Page.navigate", { url: `${BASE}${route}` });
      await wait(1600);
      const response = await call("Runtime.evaluate", {
        returnByValue: true,
        expression: OVERFLOW_PROBE,
      });
      const data = response?.result?.result?.value ?? {};
      const bad = Boolean(data.overflow);
      if (bad) problems += 1;
      const tag = bad ? "OVERFLOW" : "ok";
      console.log(
        `${viewport.name.padEnd(7)} ${String(viewport.width).padStart(4)}px ${route.padEnd(28)} scrollWidth=${data.scrollWidth} vw=${data.innerWidth} → ${tag}`,
      );
      if (bad && data.offenders?.length) {
        for (const offender of data.offenders) console.log(`          ↳ ${offender}`);
      }
    }
  }

  // Milly AI chat oynasi o'lchamini ham tekshiramiz (faqat desktopda).
  await call("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await call("Page.navigate", { url: `${BASE}/` });
  await wait(1600);
  const chatProbe = await call("Runtime.evaluate", {
    returnByValue: true,
    awaitPromise: true,
    expression: `(async () => {
      const trigger = document.querySelector('button[aria-label*="Milly AI bilan"]');
      if (!trigger) return { error: "Milly AI tugmasi topilmadi" };
      trigger.click();
      await new Promise((r) => setTimeout(r, 900));
      const panel = document.querySelector('[aria-label="Milly AI yordamchisi"]');
      if (!panel) return { error: "Chat paneli ochilmadi" };
      const rect = panel.getBoundingClientRect();
      return {
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        top: Math.round(rect.top),
        bottomGap: Math.round(window.innerHeight - rect.bottom),
        viewportHeight: window.innerHeight,
      };
    })()`,
  });
  const chat = chatProbe?.result?.result?.value ?? {};
  if (chat.error) {
    problems += 1;
    console.log(`\nMilly AI chat: ${chat.error} ❌`);
  } else {
    console.log(
      `\nMilly AI chat: ${chat.width}×${chat.height}px, yuqoridan ${chat.top}px, pastdan ${chat.bottomGap}px (ekran ${chat.viewportHeight}px)`,
    );
  }

  // Qidiruv paneli: ixcham, ustida turkum tugmalari, ostida shahar / kun / odam bo'lishi kerak.
  const searchProbe = await call("Runtime.evaluate", {
    returnByValue: true,
    awaitPromise: true,
    expression: `(async () => {
      const form = document.querySelector("#qidiruv form");
      if (!form) return { error: "qidiruv paneli topilmadi" };
      const rect = form.getBoundingClientRect();
      const labels = [...form.querySelectorAll("label > span")].map((s) => s.textContent.trim());
      const chips = [...form.querySelectorAll('[aria-label="Turkum tanlash"] button')];
      const chipLabels = chips.map((b) => b.textContent.trim());
      const shape = {
        height: Math.round(rect.height),
        width: Math.round(rect.width),
        labels,
        selects: form.querySelectorAll("select").length,
        dateInputs: form.querySelectorAll('input[type="date"]').length,
        tabs: form.querySelectorAll('[role="tab"]').length,
        chipLabels,
      };
      // "Tarixiy shaharlar" tugmasini bosamiz — submitda category yuborilishi kerak.
      chips.find((b) => b.textContent.includes("Tarixiy"))?.click();
      await new Promise((r) => setTimeout(r, 120));
      form.querySelector('button[type="submit"]')?.click();
      await new Promise((r) => setTimeout(r, 1300));
      const params = new URLSearchParams(location.search);
      return {
        ...shape,
        path: location.pathname,
        query: {
          city: params.get("city"),
          category: params.get("category"),
          days: params.get("days"),
          guests: params.get("guests"),
        },
      };
    })()`,
  });
  const search = searchProbe?.result?.result?.value ?? {};
  if (search.error) {
    problems += 1;
    console.log(`\nQidiruv paneli: ${search.error} ❌`);
  } else {
    const expected = ["Shahar", "Kunlar", "Odam"];
    const chips = search.chipLabels ?? [];
    const chipsOk =
      chips.length === 6 &&
      chips.some((text) => text.includes("Tarixiy shaharlar")) &&
      chips.some((text) => text.includes("Ekoturizm")) &&
      chips.some((text) => text.includes("Hunarmandchilik")) &&
      chips.some((text) => text.includes("Ziyorat")) &&
      chips.some((text) => text.includes("Sarguzasht"));
    const compactOk =
      JSON.stringify(search.labels) === JSON.stringify(expected) &&
      search.selects === 3 &&
      search.dateInputs === 0 &&
      search.tabs === 0 &&
      chipsOk &&
      search.height <= 130;
    const submitOk =
      search.path === "/paketlar" &&
      Boolean(search.query?.city) &&
      Boolean(search.query?.guests) &&
      search.query?.category === "historical";
    if (!compactOk || !submitOk) problems += 1;
    console.log(
      `\nQidiruv paneli: ${search.width}×${search.height}px, maydonlar=[${search.labels.join(", ")}], ` +
        `select=${search.selects}, sana=${search.dateInputs}, tablar=${search.tabs} → ${compactOk ? "ixcham ✅" : "xato ❌"}`,
    );
    console.log(`Qidiruv turkum tugmalari: [${chips.join(", ")}] → ${chipsOk ? "to'g'ri ✅" : "xato ❌"}`);
    console.log(
      `Qidiruv yuborilishi: ${search.path}?city=${search.query?.city}&category=${search.query?.category}&days=${search.query?.days}&guests=${search.query?.guests} → ` +
        `${submitOk ? "ishlayapti ✅" : "xato ❌"}`,
    );
  }

  // Fon rasmlari, yo'q qilingan bo'limlar va "tur turi" ajratilishini tekshiramiz.
  await call("Page.navigate", { url: `${BASE}/` });
  await wait(1800);
  const layoutProbe = await call("Runtime.evaluate", {
    returnByValue: true,
    awaitPromise: true,
    expression: `(async () => {
      const wait = (ms) => new Promise((r) => setTimeout(r, ms));
      const withBgImage = [...document.querySelectorAll("body *")]
        .filter((el) => {
          const bg = getComputedStyle(el).backgroundImage;
          return bg && bg !== "none" && bg.includes("url(");
        })
        .map((el) => el.tagName.toLowerCase() + "." + String(el.className).split(/\\s+/).slice(0, 2).join("."));
      const kindList = document.querySelector('[aria-label="Tur turi"]');
      const tabs = kindList ? [...kindList.querySelectorAll('[role="tab"]')] : [];
      const section = document.querySelector("#turlar");
      const packageView = {
        cards: section ? section.querySelectorAll("article").length : 0,
        addresses: section
          ? [...section.querySelectorAll("article p")]
              .map((p) => p.textContent.trim())
              .filter((text) => text.includes("·"))
              .slice(0, 2)
          : [],
      };
      let directionView = null;
      const directionTab = tabs.find((tab) => tab.textContent.includes("Yo'nalish"));
      if (directionTab) {
        directionTab.click();
        await wait(1000);
        const panels = [...(section ? section.querySelectorAll("article") : [])];
        directionView = {
          cards: panels.length,
          chips: panels.filter((card) => card.textContent.includes("Yo'nalish ·")).length,
          addresses: panels
            .map((card) => card.querySelector("p")?.textContent.trim() ?? "")
            .filter((text) => text.includes("·"))
            .slice(0, 2),
        };
      }
      // Top takliflar banneri: yonida kartochka turmaydi, bosilganda /takliflar ochiladi.
      const dealsBand = document.querySelector('section[aria-label="Shu haftaning top takliflari"]');
      const dealsView = {
        heading: dealsBand?.querySelector("h2")?.textContent.trim() ?? "",
        teaserLink: dealsBand?.querySelector('a[href="/takliflar"]') ? "/takliflar" : "",
        cards: dealsBand ? dealsBand.querySelectorAll("article").length : 0,
      };

      // Bo'limlar tartibi va fon ritmi (ketma-ket ikkita "muted" bo'lmasin).
      const sections = [...document.querySelectorAll("main section")];
      let adjacentMuted = 0;
      for (let i = 1; i < sections.length; i += 1) {
        const prev = String(sections[i - 1].className).includes("bg-muted");
        const next = String(sections[i].className).includes("bg-muted");
        if (prev && next) adjacentMuted += 1;
      }
      return {
        withBgImage,
        bodyBackgroundImage: getComputedStyle(document.body).backgroundImage,
        testimonialsRemoved: !document.body.textContent.includes("Safaringizni biz bilan boshlaganlar"),
        destinationsBandRemoved: !document.querySelector("#yonalishlar"),
        eventsRemoved: !document.querySelector('section[aria-label="Tadbirlar"]'),
        categoryTablists: document.querySelectorAll('#turlar [aria-label="Tur turkumlari"]').length,
        // Navbar: tur paketlar va yo'nalishlar bitta menyuda bo'lishi kerak.
        navTriggers: [...document.querySelectorAll("header nav button")].map((b) =>
          b.textContent.trim(),
        ),
        navLinks: [...document.querySelectorAll("header nav a")].map((a) =>
          a.textContent.trim(),
        ),
        // "Tur paketlar" trigger'i ustiga borilganda 3 ta band chiqishi kerak.
        tourMenu: await (async () => {
          const trigger = [...document.querySelectorAll("header nav button")][0];
          if (!trigger) return [];
          trigger.dispatchEvent(
            new PointerEvent("pointerdown", {
              bubbles: true,
              cancelable: true,
              button: 0,
              pointerType: "mouse",
            }),
          );
          trigger.click();
          await new Promise((r) => setTimeout(r, 450));
          const items = [
            ...document.querySelectorAll('[role="menu"] a, [role="menu"] [role="menuitem"]'),
          ].map((el) => el.textContent.trim());
          document.body.dispatchEvent(
            new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
          );
          return items;
        })(),
        dealsView,
        headings: [...document.querySelectorAll("main h2")].map((h) => h.textContent.trim()),
        sections: sections.length,
        adjacentMuted,
        tabs: tabs.map((tab) => tab.textContent.trim()),
        packageView,
        directionView,
      };
    })()`,
  });
  const layout = layoutProbe?.result?.result?.value ?? {};
  if (layout.withBgImage === undefined) {
    problems += 1;
    console.log(`\nFon tekshiruvi: ma'lumot olinmadi ❌`);
  } else {
    const cleanBg = layout.withBgImage.length === 0 && layout.bodyBackgroundImage === "none";
    const removed =
      layout.testimonialsRemoved && layout.destinationsBandRemoved && layout.eventsRemoved;
    const kindsOk = (layout.tabs?.length ?? 0) === 2;
    // Turkum tanlash tur bo'limida takrorlanmasin (qidiruv va takliflarda bo'ladi).
    const categoryTabsGone = (layout.categoryTablists ?? 0) === 0;
    // Top takliflar: bosh sahifada faqat bosiladigan banner (kartochkalar yo'q).
    // Navbar: "Tur paketlar" menyusi (yo'nalishlar ichida), "Yo'nalishlar" alohida havola emas.
    const tourMenu = layout.tourMenu ?? [];
    const navOk =
      layout.navTriggers?.[0] === "Tur paketlar" &&
      layout.navTriggers?.length === 2 &&
      layout.navLinks?.includes("Takliflar") &&
      tourMenu.length === 3 &&
      tourMenu[0].includes("Yo'nalishlar") &&
      tourMenu[1].includes("Tur paketlar") &&
      tourMenu[2].includes("Hafta tur paketlari");
    const dealsOk =
      layout.dealsView?.teaserLink === "/takliflar" &&
      layout.dealsView?.cards === 0 &&
      layout.dealsView?.heading === "Shu haftaning eng yaxshi takliflari";
    // Tartib: qidiruv → "3 qadam" → tur paketlar → takliflar → ...
    const orderOk =
      layout.headings?.length === 7 &&
      layout.headings[0] === "Uch qadamda sayohatga tayyor" &&
      layout.headings[1] === "Tur paketlar va yo'nalishlar" &&
      layout.headings[2] === "Shu haftaning eng yaxshi takliflari" &&
      layout.adjacentMuted === 0;
    const directionsOk =
      layout.directionView &&
      layout.directionView.cards > 0 &&
      layout.directionView.chips === layout.directionView.cards &&
      layout.directionView.addresses.some((text) => text.split("·").length > 2);
    if (
      !cleanBg ||
      !removed ||
      !kindsOk ||
      !categoryTabsGone ||
      !directionsOk ||
      !orderOk ||
      !dealsOk ||
      !navOk
    ) {
      problems += 1;
    }
    console.log(
      `\nFon: background-image=${layout.bodyBackgroundImage}, rasmli elementlar=${layout.withBgImage.length} → ` +
        `${cleanBg ? "rasm yo'q, fon toza ✅" : "fon rasmi qolgan ❌ " + layout.withBgImage.join(", ")}`,
    );
    console.log(
      `Olib tashlangan bo'limlar: mijozlar fikri=${layout.testimonialsRemoved ? "yo'q ✅" : "qolgan ❌"}, ` +
        `yo'nalishlar karuseli=${layout.destinationsBandRemoved ? "yo'q ✅" : "qolgan ❌"}, ` +
        `tadbirlar=${layout.eventsRemoved ? "yo'q ✅" : "qolgan ❌"}`,
    );
    console.log(
      `Bo'limlar tartibi (${layout.sections} blok, ${layout.headings?.length ?? 0} sarlavha, ketma-ket muted=${layout.adjacentMuted}):\n  ` +
        (layout.headings ?? []).map((title, index) => `${index + 1}. ${title}`).join("\n  ") +
        `\n  → ${orderOk ? "tartib va fon ritmi to'g'ri ✅" : "tartib xato ❌"}`,
    );
    console.log(
      `Tur turi tablari: [${layout.tabs?.join(" | ") ?? ""}] → ${kindsOk ? "2 ta ✅" : "xato ❌"}`,
    );
    console.log(
      `Turkum tanlash: tur bo'limidagi turkum tablari=${layout.categoryTablists ?? 0} → ` +
        `${categoryTabsGone ? "takrorlanish yo'q ✅" : "takrorlanmoqda ❌"}`,
    );
    console.log(
      `Navbar: menyular=[${(layout.navTriggers ?? []).join(", ")}], havolalar=[${(layout.navLinks ?? []).join(", ")}], ` +
        `"Tur paketlar" menyusi=[${tourMenu.join(" | ")}] → ` +
        `${navOk ? "3 ta band: yo'nalishlar, tur paketlar, hafta takliflari ✅" : "menyu xato ❌"}`,
    );
    console.log(
      `Top takliflar banneri: sarlavha="${layout.dealsView?.heading ?? ""}", ` +
        `havola=${layout.dealsView?.teaserLink || "—"}, yonidagi kartochkalar=${layout.dealsView?.cards ?? 0} → ` +
        `${dealsOk ? "faqat banner, bosilganda /takliflar ✅" : "xato ❌"}`,
    );
    console.log(
      `Tur paketlar ko'rinishi: ${layout.packageView?.cards ?? 0} kartochka, manzil: ${(layout.packageView?.addresses ?? []).join(" / ") || "—"}`,
    );
    console.log(
      `Yo'nalishlar ko'rinishi: ${layout.directionView?.cards ?? 0} kartochka, "Yo'nalish" nishoni=${layout.directionView?.chips ?? 0}, ` +
        `manzillar: ${(layout.directionView?.addresses ?? []).join(" / ") || "—"} → ${directionsOk ? "ko'p shaharli turlar ✅" : "xato ❌"}`,
    );
  }

  // Takliflar sahifasi: banner yonida turkum bo'yicha filtrlanadigan kartochkalar.
  await call("Page.navigate", { url: `${BASE}/takliflar` });
  await wait(1900);
  const dealsProbe = await call("Runtime.evaluate", {
    returnByValue: true,
    awaitPromise: true,
    expression: `(async () => {
      const band = document.querySelector('section[aria-label="Shu haftaning top takliflari"]');
      if (!band) return { error: "takliflar bo'limi topilmadi" };
      const chips = [...band.querySelectorAll('[aria-label="Tur turkumlari"] button')];
      const before = {
        chips: chips.length,
        cards: band.querySelectorAll("article").length,
        eco: band.querySelectorAll('article[data-category="eco"]').length,
      };
      chips.find((chip) => chip.textContent.includes("Ekoturizm"))?.click();
      await new Promise((r) => setTimeout(r, 800));
      return {
        ...before,
        cardsAfterFilter: band.querySelectorAll("article").length,
        path: location.pathname,
      };
    })()`,
  });
  const dealsPage = dealsProbe?.result?.result?.value ?? {};
  if (dealsPage.error) {
    problems += 1;
    console.log(`\nTakliflar sahifasi: ${dealsPage.error} ❌`);
  } else {
    const dealsPageOk =
      dealsPage.path === "/takliflar" &&
      dealsPage.chips === 6 &&
      dealsPage.cards >= 6 &&
      dealsPage.eco > 0 &&
      dealsPage.cardsAfterFilter === dealsPage.eco;
    if (!dealsPageOk) problems += 1;
    console.log(
      `\nTakliflar sahifasi (/takliflar): turkum tugmalari=${dealsPage.chips}, ` +
        `karuselda ${dealsPage.cards} ta taklif, "Ekoturizm" tanlanganda ${dealsPage.cardsAfterFilter} ta qoldi → ` +
        `${dealsPageOk ? "turkum bo'yicha filtr ishlayapti ✅" : "xato ❌"}`,
    );
  }

  // Footer ustunlari va yuridik havolalar ("#bo'lim" skroli) ishlashini tekshiramiz.
  await call("Page.navigate", { url: `${BASE}/` });
  await wait(1800);
  const footerProbe = await call("Runtime.evaluate", {
    returnByValue: true,
    awaitPromise: true,
    expression: `(async () => {
      const footer = document.querySelector("footer");
      if (!footer) return { error: "footer topilmadi" };
      const columns = [...footer.querySelectorAll("h3")].map((h) => h.textContent.trim());
      const totalLinks = footer.querySelectorAll("a").length;
      const target = [...footer.querySelectorAll('a[href^="/hujjatlar"]')].find((a) =>
        a.textContent.includes("Maxfiylik"),
      );
      if (!target) return { error: "yuridik havola topilmadi", columns, totalLinks };
      target.click();
      await new Promise((r) => setTimeout(r, 1700));
      const section = document.getElementById("maxfiylik");
      const rect = section ? section.getBoundingClientRect() : null;
      return {
        columns,
        totalLinks,
        path: location.pathname,
        hash: location.hash,
        scrollY: Math.round(window.scrollY),
        sectionTop: rect ? Math.round(rect.top) : null,
      };
    })()`,
  });
  const footer = footerProbe?.result?.result?.value ?? {};
  if (footer.error) {
    problems += 1;
    console.log(`\nFooter: ${footer.error} ❌`);
  } else {
    const expected = ["Sayohat", "Yo'nalishlar", "Xizmatlar", "Hamkorlarga", "Aloqa"];
    const columnsOk = expected.every((column) => footer.columns.includes(column));
    const hashOk =
      footer.path === "/hujjatlar" &&
      footer.hash === "#maxfiylik" &&
      footer.scrollY > 0 &&
      footer.sectionTop !== null &&
      Math.abs(footer.sectionTop) <= 160;
    if (!columnsOk || !hashOk) problems += 1;
    console.log(
      `\nFooter: ustunlar=[${footer.columns.join(", ")}] (${footer.totalLinks} havola) → ${columnsOk ? "ustunlar to'g'ri ✅" : "ustun yetishmayapti ❌"}`,
    );
    console.log(
      `Yuridik havola: ${footer.path}${footer.hash}, scrollY=${footer.scrollY}, bo'lim yuqoridan ${footer.sectionTop}px → ` +
        `${hashOk ? "#bo'limga surish ishlayapti ✅" : "#bo'lim skroli ishlamayapti ❌"}`,
    );
  }

  ws.close();
  cleanup();
  console.log(problems === 0 ? "\nBarcha tekshiruvlar toza ✅" : `\n${problems} ta muammo topildi ❌`);
  process.exit(problems === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
