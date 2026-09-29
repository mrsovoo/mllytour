import { motion } from "framer-motion";
import { useParams } from "react-router";
import { Link } from "react-router";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Camera,
  Check,
  Compass,
  Languages,
  MapPin,
  Mountain,
  Palette,
  Sparkles,
  Star,
  Store,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { Container } from "@/components/site";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/brand";
import { TourCard } from "@/components/tour";
import { openMillyAi } from "@/components/AiAssistant";
import {
  DESTINATIONS,
  destinationPricing,
  findDestination,
  packagesFor,
  spotsFor,
} from "@/data/destinations";
import type { CitySpot } from "@/data/catalog";
import { formatPrimary, formatSecondary } from "@/lib/currency";
import { cn } from "@/lib/utils";
import NotFound from "./NotFound";

/** Diqqatga sazovor joy turkumlari — nom, ikonka va rang. */
const SPOT_KINDS: Record<CitySpot["kind"], { label: string; icon: LucideIcon; tone: string }> = {
  meros: { label: "Meros", icon: Compass, tone: "bg-primary/10 text-primary" },
  madaniyat: { label: "Madaniyat", icon: Palette, tone: "bg-fuchsia-500/10 text-fuchsia-600" },
  tabiat: { label: "Tabiat", icon: Mountain, tone: "bg-eco/10 text-eco" },
  gastro: { label: "Gastronomiya", icon: UtensilsCrossed, tone: "bg-orange-500/10 text-orange-600" },
  bozor: { label: "Bozor", icon: Store, tone: "bg-gold/15 text-gold-ink" },
  hunarmand: { label: "Hunarmand", icon: Palette, tone: "bg-teal-500/10 text-teal-600" },
  ziyorat: { label: "Ziyorat", icon: Star, tone: "bg-sky-500/10 text-sky-600" },
};

export default function DestinationDetail() {
  const { slug } = useParams();
  const destination = findDestination(slug);

  if (!destination) {
    return <NotFound />;
  }

  const pricing = destinationPricing(destination);
  const packages = packagesFor(destination);
  const spots = spotsFor(destination);
  const others = DESTINATIONS.filter((item) => item.slug !== destination.slug).slice(0, 4);

  return (
    <>
      {/* ------------------------------- hero ------------------------------- */}
      <section className="relative isolate overflow-hidden bg-[#0B1220] text-white">
        <img
          src={destination.image}
          alt={destination.alt}
          className="absolute inset-0 size-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050B19]/94 via-[#050B19]/78 to-[#050B19]/40" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#050B19]/85 to-transparent" />

        <Container className="relative py-10 lg:py-16">
          <nav className="flex items-center gap-2 text-[12px] text-white/60">
            <Link to="/" className="transition-colors hover:text-white">
              Bosh sahifa
            </Link>
            <span aria-hidden="true">/</span>
            <Link to="/shaharlar" className="transition-colors hover:text-white">
              Yo'nalishlar
            </Link>
            <span aria-hidden="true">/</span>
            <span className="font-medium text-white/90">{destination.name}</span>
          </nav>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 max-w-3xl"
          >
            <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold tracking-[0.16em] uppercase">
              <MapPin className="size-3.5 text-gold" aria-hidden="true" />
              {destination.region}
            </p>
            <h1 className="mt-4 text-[32px] leading-10 font-extrabold tracking-tight sm:text-[46px] sm:leading-[52px]">
              {destination.name}
            </h1>
            <p className="mt-3 text-[15px] leading-7 text-white/80 sm:text-base">
              {destination.description}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              {pricing.rating > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-[12.5px] font-semibold">
                  <Star className="size-3.5 fill-gold text-gold" aria-hidden="true" />
                  {pricing.rating.toFixed(1)}
                  <span className="font-normal text-white/60">({pricing.reviews} sharh)</span>
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-[12.5px] font-semibold">
                <Compass className="size-3.5 text-gold" aria-hidden="true" />
                {pricing.packageCount} tur paket
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-[12.5px] font-semibold">
                <CalendarDays className="size-3.5 text-gold" aria-hidden="true" />
                {destination.bestSeason}
              </span>
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              {pricing.priceFrom > 0 && (
                <div className="flex items-end gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5 backdrop-blur-sm">
                  <span className="text-[11px] text-white/65">dan</span>
                  <span className="text-[22px] leading-7 font-extrabold">
                    {formatPrimary(pricing.priceFrom)}
                  </span>
                  {pricing.oldPrice > pricing.priceFrom && (
                    <span className="pb-0.5 text-[12px] text-white/55 line-through">
                      {formatPrimary(pricing.oldPrice)}
                    </span>
                  )}
                  <span className="pb-1 text-[11px] text-white/60">
                    {formatSecondary(pricing.priceFrom)}
                  </span>
                </div>
              )}
              <Button size="lg" asChild>
                <a href="#turlar">
                  Tur paketlarni ko'rish
                  <ArrowRight className="size-4" aria-hidden="true" />
                </a>
              </Button>
              <Button size="lg" variant="secondary" onClick={openMillyAi}>
                <Sparkles className="size-4" aria-hidden="true" />
                Milly AI bilan rejalash
              </Button>
            </div>
          </motion.div>
        </Container>
      </section>

      {/* ------------------------------ content ----------------------------- */}
      <Container className="py-12 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0">
            {/* Diqqatga sazovor joylar */}
            {spots.length > 0 && (
              <section aria-labelledby="joylar">
                <SectionHeading
                  eyebrow="Nima ko'rish kerak"
                  title={`${destination.name} bo'ylab asosiy manzillar`}
                  description="Kunlik marshrutga qo'shish uchun eng ko'p tanlanadigan joylar — vaqt va qisqa izoh bilan."
                />
                <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                  {spots.map((spot, index) => {
                    const kind = SPOT_KINDS[spot.kind];
                    const Icon = kind.icon;
                    return (
                      <motion.li
                        key={spot.name}
                        initial={{ opacity: 0, y: 14 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-60px" }}
                        transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.25) }}
                        className="rounded-2xl border border-border/70 bg-card p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_14px_34px_rgba(31,91,255,0.12)]"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold",
                              kind.tone,
                            )}
                          >
                            <Icon className="size-3.5" aria-hidden="true" />
                            {kind.label}
                          </span>
                          <span className="text-[11.5px] font-semibold text-muted-foreground">
                            {spot.hours}
                          </span>
                        </div>
                        <h3 className="mt-2.5 text-[15px] font-semibold text-foreground">
                          {spot.name}
                        </h3>
                        <p className="mt-1 text-[12.5px] leading-5 text-muted-foreground">
                          {spot.note}
                        </p>
                      </motion.li>
                    );
                  })}
                </ul>
              </section>
            )}

            {/* Tur paketlar */}
            <section id="turlar" aria-labelledby="turlar" className="mt-14 scroll-mt-24">
              <SectionHeading
                eyebrow="Tur paketlar"
                title={`${destination.name} uchun tayyor paketlar`}
                description="Narx, davomiylik va guruh hajmi bo'yicha eng mos variantlarni tanlang."
              />
              {packages.length > 0 ? (
                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  {packages.map((tour) => (
                    <TourCard key={tour.slug} tour={tour} />
                  ))}
                </div>
              ) : (
                <div className="mt-6 rounded-3xl border border-dashed bg-muted/40 p-8 text-center">
                  <p className="text-[15px] font-semibold text-foreground">
                    Bu yo'nalish uchun paket hozircha tayyorlanmoqda
                  </p>
                  <p className="mx-auto mt-1.5 max-w-md text-[13px] text-muted-foreground">
                    Milly AI orqali kunlaringiz va byudjetingizga qarab shaxsiy marshrut tuzib
                    beramiz.
                  </p>
                  <Button className="mt-4" onClick={openMillyAi}>
                    <Sparkles className="size-4" aria-hidden="true" />
                    Milly AI bilan tuzish
                  </Button>
                </div>
              )}
            </section>
          </div>

          {/* ------------------------------ sidebar ---------------------------- */}
          <aside className="lg:sticky lg:top-24 lg:h-fit">
            <div className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-[0_14px_40px_rgba(15,23,42,0.07)]">
              <div className="border-b bg-muted/40 px-5 py-4">
                <p className="text-[11px] font-semibold tracking-[0.16em] text-accent uppercase">
                  Rejalashtirish
                </p>
                <p className="mt-1 text-[15px] font-bold text-foreground">
                  {destination.name} haqida
                </p>
              </div>

              <dl className="divide-y">
                {destination.facts.map((fact) => (
                  <div key={fact.label} className="flex items-center justify-between gap-3 px-5 py-3">
                    <dt className="text-[12.5px] text-muted-foreground">{fact.label}</dt>
                    <dd className="text-[12.5px] font-semibold text-foreground">{fact.value}</dd>
                  </div>
                ))}
                <div className="flex items-center justify-between gap-3 px-5 py-3">
                  <dt className="inline-flex items-center gap-1.5 text-[12.5px] text-muted-foreground">
                    <Languages className="size-3.5" aria-hidden="true" />
                    Tillar
                  </dt>
                  <dd className="text-[12.5px] font-semibold text-foreground uppercase">
                    {destination.languages.join(" · ")}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3 px-5 py-3">
                  <dt className="inline-flex items-center gap-1.5 text-[12.5px] text-muted-foreground">
                    <CalendarDays className="size-3.5" aria-hidden="true" />
                    Mavsum
                  </dt>
                  <dd className="text-right text-[12.5px] font-semibold text-foreground">
                    {destination.bestSeason}
                  </dd>
                </div>
              </dl>

              <div className="border-t px-5 py-4">
                <div className="flex items-end justify-between gap-2">
                  <div>
                    <p className="text-[11px] text-muted-foreground">Boshlang'ich narx</p>
                    <p className="text-[22px] leading-7 font-extrabold text-foreground">
                      {formatPrimary(pricing.priceFrom)}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {formatSecondary(pricing.priceFrom)}
                    </p>
                  </div>
                  {pricing.discount > 0 && (
                    <span className="rounded-full bg-coral px-2.5 py-1 text-[11px] font-bold text-coral-foreground">
                      −{pricing.discount}%
                    </span>
                  )}
                </div>

                <ul className="mt-4 space-y-1.5">
                  {["Barcha kirish chiptalari", "Litsenziyali gid", "Transferlar kiritilgan"].map(
                    (item) => (
                      <li key={item} className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
                        <Check className="size-3.5 text-eco" aria-hidden="true" />
                        {item}
                      </li>
                    ),
                  )}
                </ul>

                <div className="mt-4 flex flex-col gap-2">
                  <Button asChild>
                    <Link to={`/paketlar?city=${encodeURIComponent(destination.cities[0])}`}>
                      Paketlarni ko'rish
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </Link>
                  </Button>
                  <Button variant="outline" onClick={openMillyAi}>
                    <Sparkles className="size-4" aria-hidden="true" />
                    Milly AI
                  </Button>
                </div>
              </div>
            </div>

            {/* Boshqa yo'nalishlar */}
            <div className="mt-6 rounded-3xl border border-border/70 bg-card p-5">
              <p className="inline-flex items-center gap-2 text-[13px] font-bold text-foreground">
                <Camera className="size-4 text-primary" aria-hidden="true" />
                Boshqa yo'nalishlar
              </p>
              <ul className="mt-3 space-y-1.5">
                {others.map((item) => (
                  <li key={item.slug}>
                    <Link
                      to={`/shaharlar/${item.slug}`}
                      className="flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                    >
                      {item.name}
                      <ArrowRight className="size-3.5" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                to="/shaharlar"
                className="mt-2 inline-flex items-center gap-1.5 px-3 text-[12.5px] font-semibold text-primary hover:underline"
              >
                <ArrowLeft className="size-3.5 rotate-180" aria-hidden="true" />
                Barcha yo'nalishlar
              </Link>
            </div>
          </aside>
        </div>
      </Container>
    </>
  );
}
