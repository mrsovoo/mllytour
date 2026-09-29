import { Link } from "react-router";
import { useRestQuery } from "@/api/client";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { CalendarClock, MapPin, Sparkles, Star, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Price } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { TOUR_PACKAGES, type TourPackage } from "@/data/catalog";
import { useAuth } from "@/hooks/use-auth";

type RecommendedRow = Omit<TourPackage, "id"> & { reason?: string };

type SavedPlan = {
  _id: string;
  createdAt: number;
  chosenIndex?: number;
  options?: unknown[];
  plan?: { title?: string; cities?: string[]; days?: unknown[]; estimate?: { total?: number } };
};

/** Mehmonlar (tizimga kirmaganlar) uchun statik tavsiya: O'zbekiston bo'yicha top turlar. */
const GUEST_ROWS: RecommendedRow[] = [...TOUR_PACKAGES]
  .sort((a, b) => b.rating * b.reviews - a.rating * a.reviews)
  .slice(0, 8)
  .map((t) => ({
    ...t,
    reason: t.badge
      ? `${t.badge} · O'zbekiston bo'yicha eng ko'p tanlangan yo'nalish`
      : `O'zbekiston bo'yicha eng yuqori baholangan turlardan biri (${t.city})`,
  }));

/**
 * Milly AI tahlili — bronlar va qiziqishlar asosida "Aynan siz uchun" turlar.
 * Kartochkalar avtomatik yon tomonga siljib turadi (hover/dochda to'xtaydi).
 */
export function ForYouRow({ className }: { className?: string }) {
  const { isAuthenticated } = useAuth();
  const recommended = useRestQuery<RecommendedRow[]>("packages", "recommended", { limit: 8 });
  const plans = useRestQuery<SavedPlan[]>("plans", "mine");

  const rows = recommended && recommended.length > 0 ? recommended : GUEST_ROWS;
  const reasonOf = (row: RecommendedRow) => (isAuthenticated ? row.reason : undefined);
  const showPlans = Boolean(plans && plans.length > 0);

  return (
    <section className={cn("mt-10", className)} aria-label="Aynan siz uchun">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold tracking-wide text-primary uppercase">
            <Sparkles className="size-3.5" aria-hidden="true" />
            Milly AI tahlili
          </span>
          <h2 className="mt-2 text-xl leading-7 font-bold tracking-tight text-foreground sm:text-2xl">
            {showPlans ? "Aynan siz uchun" : "Siz uchun tavsiyalar"}
          </h2>
          <p className="mt-1 max-w-2xl text-[13px] leading-5 text-muted-foreground">
            {showPlans
              ? "Oldingi bronlaringiz va qiziqishlaringiz asosida tanlab berilgan turlar. Kartochkalar avtomatik siljiydi — ustiga sichqoncha olib borsangiz to'xtaydi."
              : "O'zbekiston bo'yicha eng yuqori baholangan va eng ko'p tanlangan turlar — ro'yxatdan o'tsangiz, tavsiyalar bronlaringiz asosida yanada aniq bo'ladi."}
          </p>
        </div>
      </div>

      <AutoScrollRow className="mt-5">
        {showPlans &&
          plans?.slice(0, 3).map((plan) => {
            const options = (plan.options ?? []) as NonNullable<SavedPlan["plan"]>[];
            const chosen = options[plan.chosenIndex ?? 0] ?? plan.plan ?? options[0];
            if (!chosen) {
              return null;
            }
            return (
              <motion.article
                key={plan._id}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35 }}
                className="flex w-[268px] shrink-0 snap-start flex-col rounded-2xl border border-primary/25 bg-primary/5 p-4"
              >
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-wide text-primary uppercase">
                  <Sparkles className="size-3" aria-hidden="true" />
                  Sizning AI dasturingiz
                </span>
                <h3 className="mt-1.5 line-clamp-2 min-h-10 text-[14px] leading-5 font-semibold text-foreground">
                  {chosen.title ?? "Shaxsiy tur dasturi"}
                </h3>
                <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <CalendarClock className="size-3" aria-hidden="true" />
                    {Array.isArray(chosen.days) ? chosen.days.length : 0} kun
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Wallet className="size-3" aria-hidden="true" />
                    <Price usd={chosen.estimate?.total ?? 0} hideSecondary />
                  </span>
                </p>
                <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-muted-foreground">
                  {(chosen.cities ?? []).join(" · ")}
                </p>
                <Button size="sm" variant="outline" className="mt-auto w-full" asChild>
                  <Link to="/dashboard?tab=plans">Dasturni ochish</Link>
                </Button>
              </motion.article>
            );
          })}

        {rows.map((row) => {
          const tour = { ...row, id: row.slug } as TourPackage;
          const reason = reasonOf(row);
          return (
            <motion.article
              key={row.slug}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35 }}
              className="flex w-[268px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border bg-card"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                <img
                  src={tour.image}
                  alt={tour.alt}
                  loading="lazy"
                  decoding="async"
                  className="size-full object-cover"
                />
                {tour.badge && (
                  <Badge className="absolute top-2.5 left-2.5 border-0 bg-gold text-gold-foreground">
                    {tour.badge}
                  </Badge>
                )}
              </div>
              <div className="flex flex-1 flex-col p-3.5">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                  <MapPin className="size-3" aria-hidden="true" />
                  {tour.city}
                </span>
                <h3 className="mt-1 line-clamp-2 min-h-10 text-[14px] leading-5 font-semibold text-foreground">
                  {tour.title}
                </h3>
                <p className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <CalendarClock className="size-3" aria-hidden="true" />
                    {tour.days} kun
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Star className="size-3 text-gold" aria-hidden="true" />
                    {tour.rating.toFixed(1)}
                  </span>
                </p>
                {reason && (
                  <p className="mt-1.5 line-clamp-2 text-[11px] leading-4 text-primary">{reason}</p>
                )}
                <div className="mt-auto flex items-center justify-between gap-2 pt-3">
                  <Price usd={tour.priceFrom} suffix="dan" />
                  <Button size="sm" variant="outline" asChild>
                    <Link to={`/paketlar/${tour.slug}`}>Batafsil</Link>
                  </Button>
                </div>
              </div>
            </motion.article>
          );
        })}
      </AutoScrollRow>
    </section>
  );
}

/**
 * Avto-scroll qatori: kontent chapdan o'ngga sekin siljib turadi,
 * sichqoncha/doch ustida bo'lsa to'xtaydi. Kontent yetarli bo'lmasa oddiy scroll.
 */
export function AutoScrollRow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || paused) {
      return;
    }
    const frame = window.setInterval(() => {
      if (!el || el.scrollWidth <= el.clientWidth + 4) {
        return;
      }
      const next = el.scrollLeft + 0.6;
      el.scrollLeft = next >= el.scrollWidth - el.clientWidth ? 0 : next;
    }, 24);
    return () => window.clearInterval(frame);
  }, [paused]);

  return (
    <div
      ref={ref}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      className={cn(
        "no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0",
        className,
      )}
    >
      {children}
    </div>
  );
}


