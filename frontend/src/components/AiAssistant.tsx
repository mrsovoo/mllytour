import { useEffect, useState } from "react";
import { useLocation } from "react-router";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Headset, Sparkles, X } from "lucide-react";
import { useRestQuery } from "@/api/client";
import { PlannerChat } from "@/components/planner-chat";
import { MAIN_BOT_USERNAME } from "@/data/catalog";
import { cn } from "@/lib/utils";

/**
 * Holat satri — AI modeli ulanganini ko'rsatadi. Backend javob bermasa yoki
 * kalit sozlanmagan bo'lsa "onlayn" deb yozib qo'ymaydi.
 */
function AiStatusLine({ compact }: { compact?: boolean }) {
  const status = useRestQuery("aiStatus", "status");
  const ready = status?.ready;
  const dot = ready === undefined ? "bg-white/40" : ready ? "bg-eco" : "bg-amber-400";
  const text =
    ready === undefined
      ? "Bron, to'lov va buyurtmani kuzatish bo'yicha yordam"
      : ready
        ? "Onlayn · AI modeli faol · bron va to'lov"
        : "Tezkor rejim · AI kaliti hali sozlanmagan";
  return (
    <p
      title={status?.model}
      className={cn(
        "flex items-center gap-1.5 text-white/70",
        compact ? "text-[12px]" : "text-[11px]",
      )}
    >
      <span className={cn("size-1.5 shrink-0 rounded-full", dot)} aria-hidden="true" />
      <span className="truncate">{text}</span>
    </p>
  );
}

/** Eslatma oynasida navbatma-navbat chiqadigan xabarlar. */
const NUDGE_TEXTS = [
  "Sayohatni shu yerdan boshlang",
  "Qanday yordam bera olaman?",
  "Tur dasturini bir necha savolda tuzaman",
];

/** Milly AI widgetini istalgan joydan (masalan, landing AI bo'limidan) ochish uchun global hodisa. */
export function openMillyAi() {
  window.dispatchEvent(new CustomEvent("millytour:open-milly"));
}

/**
 * Milly AI.
 *
 * - Oddiy sahifalarda: o'ng pastdagi suzuvchi tugma, bosilganda ixcham chat.
 * - Mini app rejimi (`/telegram?miniapp=1`): markazda katta panel — hech qanday
 *   suzuvchi tugma, header yoki pastki menyu yo'q, faqat AI.
 */
export function AiAssistant() {
  const [open, setOpen] = useState(false);
  const status = useRestQuery("aiStatus", "status");
  // Harakatga sezgir foydalanuvchilarda bezak animatsiyalari o'chiriladi.
  const reducedMotion = useReducedMotion();
  const { pathname, search } = useLocation();
  const isMiniApp = new URLSearchParams(search).get("miniapp") === "1" || (typeof window !== "undefined" && Boolean((window as any).Telegram?.WebApp?.initData));
  const hidden = isMiniApp || ["/auth", "/admin", "/partner"].some((p) => pathname.startsWith(p));

  // Eslatma (nudge) holati — 4 sekunddan keyin chiqadi, har 16 sekundda yangilanadi.
  const [nudge, setNudge] = useState(false);
  const [nudgeIndex, setNudgeIndex] = useState(0);

  useEffect(() => {
    if (open || reducedMotion) {
      setTimeout(() => setNudge(false), 0);
      return;
    }
    let hideTimer = 0;
    const show = () => {
      setNudge(true);
      window.clearTimeout(hideTimer);
      hideTimer = window.setTimeout(() => {
        setNudge(false);
        setNudgeIndex((index) => (index + 1) % NUDGE_TEXTS.length);
      }, 6500);
    };
    const firstTimer = window.setTimeout(show, 4000);
    const loop = window.setInterval(show, 16000);
    return () => {
      window.clearTimeout(firstTimer);
      window.clearTimeout(hideTimer);
      window.clearInterval(loop);
    };
  }, [open, reducedMotion]);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("millytour:open-milly", handler);
    return () => window.removeEventListener("millytour:open-milly", handler);
  }, []);

  if (isMiniApp) {
    return (
        <section
          aria-label="Milly AI yordamchisi"
          className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-2xl flex-col justify-center px-4 py-6"
        >
          <div className="glass-card flex flex-col overflow-hidden rounded-3xl">
            <header className="relative flex items-center gap-3 overflow-hidden bg-gradient-to-r from-[#0B1220] via-[#12306B] to-[#1E40AF] px-5 py-4 text-white">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/15">
              <Sparkles className="size-5 text-gold" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-semibold">Milly AI</p>
              <AiStatusLine compact />
            </div>
          </header>
          <div className="flex min-h-[65vh] flex-col p-4">
            <PlannerChat variant="page" />
          </div>
        </div>
      </section>
    );
  }

  if (hidden) {
    return null;
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.section
            key="assistant"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            aria-label="Milly AI yordamchisi"
            className="glass-card fixed right-3 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-50 flex h-[min(78vh,760px)] w-[min(94vw,420px)] flex-col overflow-hidden rounded-3xl sm:right-5 sm:bottom-24"
          >
            <header className="relative flex items-center gap-3 overflow-hidden bg-gradient-to-r from-[#0B1220] via-[#12306B] to-[#1E40AF] px-4 py-3 text-white">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/15">
                <Sparkles className="size-4 text-gold" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">Milly AI</p>
                <AiStatusLine />
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Yopish"
                className="grid size-8 place-items-center rounded-lg text-white/80 transition-colors hover:bg-white/15 hover:text-white"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </header>

            <div className="flex min-h-0 flex-1 flex-col p-3.5">
              <PlannerChat variant="widget" />
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      <div className="fixed right-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-50 flex flex-col items-end gap-2.5 sm:right-6 sm:bottom-6">
      {/*
        Qo'llab-quvvatlash — AI tugmasining ustida, chat ochiq bo'lganda yashiriladi.
        Diqqatni tortish uchun har 3 sekundda yengil tebranadi (0.9s harakat + 2.1s tanaffus).
      */}
      {!open && (
        <motion.a
          href={`https://t.me/${MAIN_BOT_USERNAME}?start=support`}
          target="_blank"
          rel="noreferrer"
          aria-label="Biz bilan bog'lanish (qo'llab-quvvatlash)"
          title="Biz bilan bog'lanish — savol va yordam"
          animate={
            reducedMotion
              ? undefined
              : { rotate: [0, -10, 9, -6, 0], scale: [1, 1.08, 1] }
          }
          transition={
            reducedMotion
              ? undefined
              : { duration: 0.9, repeat: Infinity, repeatDelay: 2.1, ease: "easeInOut" }
          }
          style={{ transformOrigin: "50% 20%" }}
          className="grid size-14 place-items-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:border-gold/50 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <Headset className="size-7" aria-hidden="true" />
        </motion.a>
      )}

      <div className="relative">
        {/*
          Har 16 sekundda navbatma-navbat chiqadigan eslatma: savol yoki taklif.
          Chat ochilganda yoki "kamaytirilgan harakat" rejimida ko'rsatilmaydi.
        */}
        <AnimatePresence>
          {nudge && !open && (
            <motion.button
              key="nudge"
              type="button"
              onClick={() => setOpen(true)}
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="press absolute right-full bottom-1 mr-3 hidden w-60 rounded-2xl rounded-br-md border border-gold/40 bg-card px-3.5 py-2.5 text-left shadow-lifted sm:block"
            >
              <span className="block text-[13.5px] leading-5 font-semibold text-foreground">
                {NUDGE_TEXTS[nudgeIndex]}
              </span>
              <span className="mt-1 block text-[11.5px] leading-4 text-muted-foreground">
                Bosib Milly AI bilan boshlang
              </span>
            </motion.button>
          )}
        </AnimatePresence>

        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          aria-label={open ? "Milly AI yordamchini yopish" : "Milly AI bilan tur dasturi tuzish"}
          className={cn(
            "press inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-[#1E40AF] to-[#12306B] text-white ring-2 ring-gold/45 transition-[transform,box-shadow] hover:scale-[1.03] hover:ring-gold/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
            open ? "size-12 justify-center px-0" : "h-13 px-5",
          )}
        >
          <span className="relative grid place-items-center">
            {open ? (
              <X className="size-5" aria-hidden="true" />
            ) : (
              <motion.span
                className="grid place-items-center"
                animate={
                  reducedMotion ? undefined : { scale: [1, 1.16, 1], rotate: [0, 10, -8, 0] }
                }
                transition={
                  reducedMotion
                    ? undefined
                    : { duration: 1.4, repeat: Infinity, repeatDelay: 2.6, ease: "easeInOut" }
                }
              >
                <Sparkles className="size-5 text-gold" aria-hidden="true" />
              </motion.span>
            )}
          </span>
          {!open && (
            <>
              <span className="text-[14.5px] font-bold whitespace-nowrap">Milly AI</span>
              {/* Holat nuqtasi: yashil — AI faol, oltin — zaxira rejim. */}
              <span
                className={cn(
                  "size-2 shrink-0 rounded-full ring-2 ring-white/20",
                  status?.ready === undefined
                    ? "bg-white/40"
                    : status.ready
                      ? "bg-eco"
                      : "bg-gold",
                )}
                aria-hidden="true"
              />
            </>
          )}
        </button>
      </div>
      </div>
    </>
  );
}
