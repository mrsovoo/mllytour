import { useState } from "react";
import { Link } from "react-router";
import { motion } from "framer-motion";
import { ArrowRight, Clock, Globe2, Plane, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { SectionHeading } from "@/components/brand";
import { Container } from "@/components/site";
import { CategoryTabs, TourBadge } from "@/components/tour";
import {
  TOUR_CATEGORIES,
  TOUR_PACKAGES,
  type CategoryId,
  type TourPackage,
} from "@/data/catalog";
import { formatPrimary, formatSecondary } from "@/lib/currency";
import { cn } from "@/lib/utils";

const blurFade = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
};

/** Bitta paketdagi tejash summasi (chegirma bo'lmasa 0). */
function saving(tour: TourPackage): number {
  return tour.oldPrice && tour.oldPrice > tour.priceFrom ? tour.oldPrice - tour.priceFrom : 0;
}

function discountPercent(tour: TourPackage) {
  const saved = saving(tour);
  return saved > 0 ? Math.round((saved / (tour.oldPrice as number)) * 100) : 0;
}

/**
 * Haftaning takliflari.
 *
 * Chegirmali paketlar birinchi o'rinda (tejash summasi bo'yicha), keyin
 * reytingi va sharhlari yuqori turlar. Ro'yxat barcha turkumlarni qamrab
 * oladi — shu sababli turkum bo'yicha tanlanganda bo'sh natija qolmaydi.
 */
function weeklyDeals(): TourPackage[] {
  return [...TOUR_PACKAGES].sort(
    (a, b) => saving(b) - saving(a) || b.rating - a.rating || b.reviews - a.reviews,
  );
}

const DEALS = weeklyDeals();

/** Turkumlar bo'yicha takliflar soni (tugmalarda ko'rsatiladi). */
const DEAL_COUNTS: Partial<Record<CategoryId, number>> = (() => {
  const result: Partial<Record<CategoryId, number>> = { all: DEALS.length };
  for (const cat of TOUR_CATEGORIES) {
    if (cat.id === "all") {
      continue;
    }
    result[cat.id] = DEALS.filter((tour) => tour.category === cat.id).length;
  }
  return result;
})();

/**
 * "Shu haftaning eng yaxshi takliflari" — chapda promo banner, o'ngda turkum
 * bo'yicha filtrlanadigan takliflar karuseli.
 */
export function TopDealsBand({
  className,
  hideHeading,
}: {
  className?: string;
  /** Sahifada `PageHero` sarlavhasi bo'lsa — ichki sarlavha yashiriladi. */
  hideHeading?: boolean;
}) {
  const [category, setCategory] = useState<CategoryId>("all");
  const deals = category === "all" ? DEALS : DEALS.filter((tour) => tour.category === category);
  const maxDiscount = deals.length ? Math.max(...deals.map(discountPercent)) : 0;
  const packagesLink = category === "all" ? "/paketlar" : `/paketlar?category=${category}`;

  return (
    <section
      className={cn("scroll-mt-24 py-14 lg:py-20", className)}
      aria-label="Shu haftaning top takliflari"
    >
      <Container>
        {hideHeading ? null : (
          <motion.div {...blurFade}>
            <SectionHeading
              eyebrow="Top takliflar"
              title="Shu haftaning eng yaxshi takliflari"
              description="Chegirmali paketlar birinchi o'rinda — turkum bo'yicha tanlab, aynan o'zingizga mos taklifni toping."
            />
          </motion.div>
        )}

        <motion.div {...blurFade} className={hideHeading ? "mt-0" : "mt-8"}>
          <CategoryTabs value={category} onChange={setCategory} counts={DEAL_COUNTS} />
        </motion.div>

        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          {/* -------------------------- promo banner -------------------------- */}
          <motion.div {...blurFade} className="lg:col-span-1">
            <div className="relative h-full min-h-[300px] overflow-hidden rounded-[26px] bg-[#0B1220] p-6 text-white sm:p-7">
              <div className="absolute inset-0 bg-gradient-to-br from-[#0B1220] via-[#12306B] to-[#1E40AF]" />
              <div className="absolute -right-8 -bottom-10 opacity-[0.16]" aria-hidden="true">
                <Globe2 className="size-52" strokeWidth={1.1} />
              </div>
              <div className="absolute top-6 right-6 hidden opacity-25 sm:block" aria-hidden="true">
                <Plane className="size-14 -rotate-12" strokeWidth={1.3} />
              </div>

              <div className="relative flex h-full flex-col">
                <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-gold px-3 py-1 text-[11px] font-bold tracking-wide text-gold-ink uppercase">
                  <Tag className="size-3.5" aria-hidden="true" />
                  {maxDiscount > 0 ? `−${maxDiscount}% gacha chegirma` : "Chegirmalar"}
                </span>

                <h3 className="mt-4 text-[24px] leading-8 font-extrabold tracking-tight">
                  Shu haftaning top takliflari
                </h3>
                <p className="mt-3 text-[13.5px] leading-6 text-white/75">
                  O'zbekiston bo'ylab tayyor turlar. Joylar soni chegaralangan — ulgurib qoling!
                </p>

                <div className="mt-auto flex flex-col gap-3 pt-6">
                  <Button size="lg" className="w-full bg-white text-[#0B1220] hover:bg-white/90" asChild>
                    <Link to={packagesLink}>
                      Takliflarni olish
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </Link>
                  </Button>
                  <span className="text-[12.5px] text-white/65">
                    {deals.length} ta taklif · cheklangan muddat
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* --------------------------- deal cards --------------------------- */}
          {/* `min-w-0` — grid ustunida karusel butun kenglikni egallab ketmasligi uchun */}
          <div className="min-w-0 lg:col-span-2">
            <Carousel key={category} className="w-full">
              <CarouselContent className="-ml-4">
                {deals.length === 0 ? (
                  <CarouselItem className="basis-full pl-4">
                    <p className="rounded-2xl border border-dashed bg-muted/40 px-5 py-8 text-center text-[13px] text-muted-foreground">
                      Bu turkumda hozircha taklif yo'q — boshqa turkumni tanlang.
                    </p>
                  </CarouselItem>
                ) : null}
                {deals.map((tour, index) => {
                  const percent = discountPercent(tour);
                  return (
                    <CarouselItem key={tour.slug} className="basis-full pl-4 sm:basis-1/2">
                      <motion.article
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-60px" }}
                        transition={{ duration: 0.45, delay: 0.06 * (index % 4) }}
                        data-category={tour.category}
                        className="group flex h-full gap-3.5 overflow-hidden rounded-[22px] border border-border/70 bg-card p-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_16px_38px_rgba(31,91,255,0.13)]"
                      >
                        <Link
                          to={`/paketlar/${tour.slug}`}
                          className="relative size-[92px] shrink-0 overflow-hidden rounded-2xl bg-muted"
                          tabIndex={-1}
                          aria-hidden="true"
                        >
                          <img
                            src={tour.image}
                            alt={tour.alt}
                            loading="lazy"
                            decoding="async"
                            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          {percent > 0 && (
                            <span className="absolute top-1.5 left-1.5 rounded-full bg-coral px-1.5 py-0.5 text-[10px] font-bold text-coral-foreground shadow-sm">
                              −{percent}%
                            </span>
                          )}
                        </Link>

                        <div className="flex min-w-0 flex-1 flex-col">
                          <div className="flex items-center gap-1.5">
                            <TourBadge badge={tour.badge} />
                          </div>
                          <h3 className="mt-1.5 line-clamp-2 text-[13.5px] leading-5 font-semibold text-foreground">
                            <Link to={`/paketlar/${tour.slug}`} className="hover:text-primary">
                              {tour.title}
                            </Link>
                          </h3>
                          <p className="mt-1 inline-flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
                            <Clock className="size-3.5" aria-hidden="true" />
                            {tour.days} kun / {tour.nights} kecha
                          </p>

                          <div className="mt-auto flex flex-wrap items-end justify-between gap-x-2 pt-2">
                            <div className="flex items-end gap-1.5">
                              {tour.oldPrice ? (
                                <span className="pb-0.5 text-[11.5px] text-muted-foreground line-through">
                                  {formatPrimary(tour.oldPrice)}
                                </span>
                              ) : null}
                              <span className="text-[16px] leading-5 font-extrabold text-foreground">
                                {formatPrimary(tour.priceFrom)}
                              </span>
                              <span className="pb-0.5 text-[10.5px] text-muted-foreground">
                                {formatSecondary(tour.priceFrom)}
                              </span>
                            </div>
                            <Link
                              to={`/paketlar/${tour.slug}`}
                              className="inline-flex items-center gap-1 text-[12px] font-semibold text-primary hover:underline"
                            >
                              Batafsil
                              <ArrowRight className="size-3.5" aria-hidden="true" />
                            </Link>
                          </div>
                        </div>
                      </motion.article>
                    </CarouselItem>
                  );
                })}
              </CarouselContent>
              <div className="mt-5 flex justify-center gap-2 sm:justify-end">
                <CarouselPrevious className="static size-11 left-auto translate-y-0 rounded-xl" />
                <CarouselNext className="static size-11 right-auto translate-y-0 rounded-xl" />
              </div>
            </Carousel>
          </div>
        </div>
      </Container>
    </section>
  );
}

/**
 * Bosh sahifadagi qisqa banner.
 *
 * Bu yerda taklif kartochkalari yonma-yon turmaydi — banner bosilganda
 * barcha takliflar `/takliflar` sahifasida ochiladi (o'sha yerda banner
 * yonida turkum bo'yicha filtrlanadigan kartochkalar ko'rsatiladi).
 */
export function DealsTeaser({ className }: { className?: string }) {
  const maxDiscount = DEALS.length ? Math.max(...DEALS.map(discountPercent)) : 0;

  return (
    <section
      className={cn("scroll-mt-24 py-8 lg:py-10", className)}
      aria-label="Shu haftaning top takliflari"
    >
      <Container>
        <motion.div {...blurFade}>
          <Link
            to="/takliflar"
            aria-label="Barcha takliflarni ochish"
            className="group relative flex min-h-[230px] flex-col justify-between overflow-hidden rounded-[28px] bg-[#0B1220] p-7 text-white transition-transform duration-300 hover:-translate-y-0.5 sm:p-10"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#0B1220] via-[#12306B] to-[#1E40AF]" />
            <div className="absolute -right-6 -bottom-10 opacity-[0.16]" aria-hidden="true">
              <Globe2 className="size-56" strokeWidth={1.1} />
            </div>
            <div className="absolute top-8 right-10 hidden opacity-25 sm:block" aria-hidden="true">
              <Plane className="size-16 -rotate-12" strokeWidth={1.3} />
            </div>

            <div className="relative">
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-gold px-3 py-1 text-[11px] font-bold tracking-wide text-gold-ink uppercase">
                <Tag className="size-3.5" aria-hidden="true" />
                {maxDiscount > 0 ? `−${maxDiscount}% gacha chegirma` : "Chegirmalar"}
              </span>
              <h2 className="mt-5 max-w-2xl text-[26px] leading-9 font-extrabold tracking-tight sm:text-[34px] sm:leading-10">
                Shu haftaning eng yaxshi takliflari
              </h2>
              <p className="mt-3 max-w-xl text-[14px] leading-6 text-white/75">
                Chegirmali tur paketlar va hafta tanlovi: tarixiy shaharlar, ekoturizm va tabiat,
                hunarmandchilik, ziyorat va sarguzasht yo'nalishlari bo'yicha.
              </p>
            </div>

            <div className="relative mt-7 flex flex-wrap items-center gap-x-4 gap-y-3">
              <span className="inline-flex h-11 items-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-[#0B1220] transition-colors group-hover:bg-white/90">
                Takliflarni ochish
                <ArrowRight className="size-4" aria-hidden="true" />
              </span>
              <span className="text-[12.5px] text-white/65">
                {DEALS.length} ta taklif · {TOUR_CATEGORIES.length - 1} turkum · cheklangan muddat
              </span>
            </div>
          </Link>
        </motion.div>
      </Container>
    </section>
  );
}
