import { useEffect, useState } from "react";
import { Link } from "react-router";
import { motion } from "framer-motion";
import { ArrowUpRight, Clock } from "lucide-react";
import { Price } from "@/lib/currency";
import { topTours } from "@/lib/ai-recommend";

/**
 * Hero karuseli.
 *
 * - Markazda katta asosiy kartochka, o'ng va chap tomonida bittadan kichikroq
 *   kartochka "orqada turgandek" turadi.
 * - Har 3.8 soniyada bir qadam suriladi: o'ngdagi oldiga chiqadi, markazdagi
 *   chapga o'tib orqaga tushadi. Aylanish cheksiz.
 * - Ro'yxat `topTours()` orqali tanlanadi — hozirda eng yaxshi ketayotgan
 *   (reyting, sharhlar va nishonlar bo'yicha) turlar.
 */

const CARDS = topTours(5);
/** Asosiy (oldindagi) kartochka o'lchami — kengroq, shuning uchun yaxshi ko'rinadi. */
const CARD_WIDTH = 290;
const CARD_HEIGHT = 400;
/** Yon kartochkalar markazdan surilishi — yig'indi eni o'zgarmaydi. */
const SIDE_OFFSET = 118;
const SIDE_SCALE = 0.66;

type Slot = {
  x: number;
  scale: number;
  opacity: number;
  rotateY: number;
  z: number;
  blur: number;
};

/** Faqat 3 slot ko'rinadi: markaz + chapda/o'ngda bittadan kichikroq. */
const SLOTS: Record<number, Slot> = {
  [-1]: { x: -SIDE_OFFSET, scale: SIDE_SCALE, opacity: 0.6, rotateY: 16, z: 1, blur: 1.5 },
  [0]: { x: 0, scale: 1, opacity: 1, rotateY: 0, z: 3, blur: 0 },
  [1]: { x: SIDE_OFFSET, scale: SIDE_SCALE, opacity: 0.6, rotateY: -16, z: 2, blur: 1.5 },
};

/** Navbatdagi kartochkalar markaz ortida yashirin turadi. */
const HIDDEN: Slot = { x: 0, scale: SIDE_SCALE, opacity: 0, rotateY: 0, z: 0, blur: 2 };

/** Kartochka markazdan qanchalik uzoqda turgani (-2…+2). */
function offsetOf(index: number, active: number, total: number): number {
  let offset = (index - active + total) % total;
  if (offset > total / 2) offset -= total;
  return offset;
}

export function HeroCards({ className }: { className?: string }) {
  const total = CARDS.length;
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    // Harakatga sezgir foydalanuvchilarda avto-aylanish o'chiriladi.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setActive((prev) => (prev + 1) % total), 3800);
    return () => window.clearInterval(timer);
  }, [paused, total]);

  return (
    <div
      className={className}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div
        className="relative"
        style={{ width: CARD_WIDTH + 252, height: CARD_HEIGHT + 30, perspective: "1500px" }}
        role="list"
        aria-label="Eng mashhur tur paketlar"
      >
        {/* Orqadagi yumshoq nur */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-1/2 size-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl"
        />

        {CARDS.map((tour, index) => {
          const offset = offsetOf(index, active, total);
          const slot = SLOTS[offset] ?? HIDDEN;
          const isFront = offset === 0;
          return (
            <motion.div
              key={tour.slug}
              role="listitem"
              initial={false}
              animate={{
                x: slot.x,
                scale: slot.scale,
                opacity: slot.opacity,
                rotateY: slot.rotateY,
                filter: `blur(${slot.blur}px)`,
              }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              style={{
                zIndex: slot.z,
                width: CARD_WIDTH,
                height: CARD_HEIGHT,
                marginLeft: -CARD_WIDTH / 2,
                transformStyle: "preserve-3d",
              }}
              className="absolute top-0 left-1/2"
              aria-hidden={!isFront}
            >
              <Link
                to={`/paketlar/${tour.slug}`}
                tabIndex={isFront ? 0 : -1}
                className={
                  isFront
                    ? "group relative block size-full overflow-hidden rounded-[28px] border border-border bg-card shadow-[0_26px_55px_-20px_rgba(15,23,42,0.35)] ring-1 ring-gold/40"
                    : "group relative block size-full overflow-hidden rounded-[24px] border border-border/70 bg-card shadow-[0_16px_36px_-22px_rgba(15,23,42,0.28)]"
                }
              >
                <img
                  src={tour.image}
                  alt={tour.alt}
                  loading="lazy"
                  decoding="async"
                  className="size-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B1220]/95 via-[#0B1220]/30 to-transparent" />

                {tour.badge && isFront && (
                  <span className="absolute top-4 left-4 rounded-full bg-gold px-2.5 py-1 text-[10px] font-bold tracking-wide text-gold-ink uppercase">
                    {tour.badge}
                  </span>
                )}

                <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                  <h3 className="line-clamp-2 text-[15px] leading-5 font-bold">{tour.title}</h3>
                  <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-white/75">
                    <Clock className="size-3.5 text-gold" aria-hidden="true" />
                    {tour.days} kun / {tour.nights} kecha · ★ {tour.rating.toFixed(1)}
                  </p>
                  <div className="mt-3 flex items-end justify-between border-t border-white/20 pt-3">
                    <Price
                      usd={tour.priceFrom}
                      suffix="dan"
                      className="text-[18px] text-white"
                      secondaryClassName="text-white/65"
                    />
                    <span className="grid size-8 place-items-center rounded-full bg-white/15 text-white transition-colors group-hover:bg-white group-hover:text-[#0B1220]">
                      <ArrowUpRight className="size-4" aria-hidden="true" />
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
