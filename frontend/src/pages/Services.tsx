import { useMemo } from "react";
import { Link, Navigate, useSearchParams } from "react-router";
import { useRestQuery } from "@/api/client";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  BedDouble,
  Camera,
  CarFront,
  Languages,
  MapPin,
  Phone,
  Send,
  Sparkles,
  Star,
  Store,
  Ticket,
  UserRound,
  UtensilsCrossed,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Container, PageHero } from "@/components/site";
import { openMillyAi } from "@/components/AiAssistant";
import { ServiceOrderForm, type BookableService } from "@/components/service-order-form";
import { PARTNER_BOT_USERNAME, partnerBotLink, type Direction } from "@/data/catalog";
import { SERVICE_PAGES, slugForDirection } from "@/data/service-pages";

const ICONS: Record<Direction, React.ElementType> = {
  guide: UserRound,
  transfer: CarFront,
  hotel: BedDouble,
  restaurant: UtensilsCrossed,
  translator: Languages,
  photographer: Camera,
  other: Ticket,
  artisan: Store,
};

type ProviderRow = {
  _id: string;
  direction: Direction;
  businessName: string;
  city: string;
  about: string | null;
  languages: string[];
  experienceYears: number | null;
  capacity: string | null;
  rating: number;
  ratingCount: number;
  completedOrders: number;
  rooms: number | null;
  vehicle: { model: string; seats: number } | null;
  contact: { phone: string; telegramUsername: string | null } | null;
};

/**
 * "Xizmatlar" — barcha yo'nalishlar ko'rinishi.
 *
 * Bu sahifa umumiy ro'yxat; har bir yo'nalishning o'z to'liq sahifasi bor
 * (`/xizmatlar/mehmonxona`, `/xizmatlar/gid`, ...) — u yerda turlar, qadamlar
 * va FAQ bilan birga mutaxassislar ko'rsatiladi.
 */
export default function Services() {
  const [params, setParams] = useSearchParams();
  const legacyDirection = params.get("direction") ?? "";
  const city = params.get("city") ?? "";

  const providers = useRestQuery<ProviderRow[]>("providers", "publicList", {});

  const rows = useMemo(() => {
    const list = providers ?? [];
    return city
      ? list.filter((p) => p.city.toLowerCase().includes(city.toLowerCase()))
      : list;
  }, [providers, city]);

  const cities = useMemo(
    () => Array.from(new Set((providers ?? []).map((p) => p.city))).sort(),
    [providers],
  );

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(patch)) {
      if (!value) {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    }
    setParams(next, { replace: true });
  };

  // Eski havolalar (`/xizmatlar?direction=hotel`) endi alohida sahifaga o'tadi.
  if (legacyDirection) {
    const slug = slugForDirection(legacyDirection as Direction);
    if (slug) {
      return <Navigate to={`/xizmatlar/${slug}`} replace />;
    }
  }

  return (
    <>
      <PageHero
        eyebrow="Xizmatlar"
        title="Gid, transfer, mehmonxona, restoran, tarjimon, fotograf"
        description="Har bir yo'nalishning alohida sahifasi bor: turlari, narx oralig'i, qanday bron qilinishi va tasdiqlangan hamkorlar ro'yxati."
      >
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={openMillyAi}>
            <Sparkles className="size-3.5" aria-hidden="true" />
            Milly AI bilan dastur tuzish
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-white/25 bg-white/10 text-white hover:bg-white/20 hover:text-white"
            asChild
          >
            <a href={partnerBotLink()} target="_blank" rel="noreferrer">
              Xizmat ko'rsatuvchi bo'lish
            </a>
          </Button>
        </div>
      </PageHero>

      {/* ── Yo'nalishlar ──────────────────────────────────────────────────── */}
      <Container className="py-10 lg:py-14">
        <h2 className="text-[22px] leading-7 font-bold tracking-tight text-foreground sm:text-[26px] sm:leading-8">
          Yo'nalishni tanlang
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Har bir kartochka o'sha xizmatning to'liq sahifasini ochadi — turlari, narxlari,
          bajarilish tartibi va mutaxassislar shu yerda.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICE_PAGES.map((page, index) => {
            const Icon = ICONS[page.direction];
            return (
              <motion.div
                key={page.slug}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.3) }}
              >
                <Link
                  to={`/xizmatlar/${page.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border bg-card transition-colors hover:border-primary/40"
                >
                  <div className="relative">
                    <img
                      src={page.image}
                      alt={page.title}
                      loading="lazy"
                      decoding="async"
                      className="aspect-[16/9] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-transparent" />
                    <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
                      <Icon className="size-3.5 text-gold" aria-hidden="true" />
                      {page.label}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <h3 className="text-[15px] leading-5 font-semibold text-foreground">
                      {page.label}
                    </h3>
                    <p className="mt-2 flex-1 text-[13px] leading-5 text-muted-foreground">
                      {page.desc}
                    </p>
                    <p className="mt-3 flex items-center justify-between text-[12px] font-semibold text-primary">
                      {page.types.length} xil tur
                      <ArrowRight
                        className="size-3.5 transition-transform group-hover:translate-x-0.5"
                        aria-hidden="true"
                      />
                    </p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </Container>

      {/* ── Barcha mutaxassislar ──────────────────────────────────────────── */}
      <section className="bg-muted/40 py-12">
        <Container>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-[20px] leading-6 font-bold tracking-tight text-foreground sm:text-[22px]">
                Barcha tasdiqlangan mutaxassislar
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{rows.length}</span> ta mutaxassis
              </p>
            </div>
            <label className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">Shahar</span>
              <select
                value={city}
                onChange={(e) => update({ city: e.target.value })}
                className="h-9 cursor-pointer rounded-xl border bg-background px-3 text-sm font-medium outline-none focus-visible:border-primary/50"
              >
                <option value="">Barchasi</option>
                {cities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {providers === undefined ? (
            <p className="mt-6 text-sm text-muted-foreground">Yuklanmoqda…</p>
          ) : rows.length === 0 ? (
            <Card className="mt-6 border-dashed">
              <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
                <MapPin className="size-6 text-muted-foreground" aria-hidden="true" />
                <p className="text-sm font-semibold text-foreground">
                  Hozircha tasdiqlangan mutaxassis yo'q
                </p>
                <p className="max-w-md text-sm text-muted-foreground">
                  Mutaxassislar {PARTNER_BOT_USERNAME} orqali ro'yxatdan o'tadi va administrator
                  tasdiqlagach shu ro'yxatda chiqadi.
                </p>
                <div className="mt-1 flex flex-wrap justify-center gap-2">
                  <Button asChild>
                    <a href={partnerBotLink()} target="_blank" rel="noreferrer">
                      Mutaxassis bo'lish
                    </a>
                  </Button>
                  <Button variant="outline" onClick={openMillyAi}>
                    Milly AI bilan dastur tuzish
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {rows.map((p, i) => {
                const Icon = ICONS[p.direction];
                return (
                  <motion.div
                    key={p._id}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: Math.min(i * 0.04, 0.3) }}
                    className="flex h-full flex-col rounded-2xl border bg-card p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                          <Icon className="size-3.5 text-primary" aria-hidden="true" />
                          {SERVICE_PAGES.find((s) => s.direction === p.direction)?.label ??
                            p.direction}
                        </span>
                        <h3 className="mt-1 text-[15px] leading-5 font-semibold text-foreground">
                          {p.businessName}
                        </h3>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="size-3" aria-hidden="true" />
                            {p.city}
                          </span>
                          {p.experienceYears ? <span>{p.experienceYears} yil tajriba</span> : null}
                          {p.capacity ? <span>{p.capacity}</span> : null}
                        </p>
                      </div>
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-gold/15 px-2.5 py-1 text-[12px] font-bold text-gold-ink">
                        <Star className="size-3.5 fill-gold text-gold" aria-hidden="true" />
                        {p.rating.toFixed(1)}
                      </span>
                    </div>

                    {p.about ? (
                      <p className="mt-3 line-clamp-3 text-[13px] leading-5 text-muted-foreground">
                        {p.about}
                      </p>
                    ) : null}

                    <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                      <li className="inline-flex items-center gap-1">
                        <BadgeCheck className="size-3 text-eco" aria-hidden="true" />
                        Tasdiqlangan
                      </li>
                      <li>{p.completedOrders} buyurtma</li>
                      <li>{p.ratingCount} sharh</li>
                      {p.languages.length > 0 && <li>{p.languages.join(" / ")}</li>}
                      {p.vehicle ? <li>{p.vehicle.model}</li> : null}
                      {p.rooms ? <li>{p.rooms} xona</li> : null}
                    </ul>

                    {p.contact ? (
                      <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Phone className="size-3" aria-hidden="true" />
                          {p.contact.phone}
                        </span>
                        {p.contact.telegramUsername && <span>@{p.contact.telegramUsername}</span>}
                      </p>
                    ) : null}

                    <div className="mt-auto pt-4">
                      <ServiceOrderForm
                        service={p.direction as BookableService}
                        providerName={p.businessName}
                        city={p.city}
                        returnTo="/xizmatlar"
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </Container>
      </section>

      <Container className="py-12">
        <div className="grid gap-4 rounded-2xl border bg-muted/40 p-5 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div>
            <h2 className="text-[15px] font-semibold text-foreground">
              Tur dasturi ichida mutaxassislar avtomatik biriktiriladi
            </h2>
            <p className="mt-2 max-w-3xl text-[13px] leading-6 text-muted-foreground">
              Milly AI tur dasturini tuzganda har bir yo'nalish uchun eng mos mutaxassis reyting,
              tajriba, bajarilgan buyurtmalar va shahar mosligi bo'yicha tanlanadi va unga bot
              orqali vazifa yuboriladi. Alohida xizmat faqat o'zingizga kerak bo'lsa — shu
              sahifadan bron qilinadi.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 lg:justify-end">
            <Button onClick={openMillyAi}>
              <Send className="size-4" aria-hidden="true" />
              Milly AI bilan dastur
            </Button>
            <Button variant="outline" asChild>
              <a href={partnerBotLink()} target="_blank" rel="noreferrer">
                Xizmat ko'rsatuvchi bo'lish
              </a>
            </Button>
          </div>
        </div>
      </Container>
    </>
  );
}
