import { useMemo } from "react";
import { Link, Navigate, useParams, useSearchParams } from "react-router";
import { useRestQuery } from "@/api/client";
import { motion } from "framer-motion";
import {
  ArrowLeft,
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
  Ticket,
  UserRound,
  UtensilsCrossed,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Container, PageHero } from "@/components/site";
import { ServiceOrderForm, type BookableService } from "@/components/service-order-form";
import { ServiceRequestPanel } from "@/components/service-request-panel";
import { openMillyAi } from "@/components/AiAssistant";
import { PARTNER_BOT_USERNAME, partnerBotLink, type Direction } from "@/data/catalog";
import { SERVICE_PAGES, findServicePage, type ServiceType } from "@/data/service-pages";
import { cn } from "@/lib/utils";

const ICONS: Record<Direction, React.ElementType> = {
  guide: UserRound,
  transfer: CarFront,
  hotel: BedDouble,
  restaurant: UtensilsCrossed,
  translator: Languages,
  photographer: Camera,
  other: Ticket,
  artisan: Ticket,
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
  workingHours: string | null;
  rating: number;
  ratingCount: number;
  completedOrders: number;
  rooms: number | null;
  vehicle: { model: string; seats: number } | null;
  contact: { phone: string; telegramUsername: string | null } | null;
};

/** Mutaxassis matn maydonlarida tur kalit so'zlarini qidiradi. */
function matchesType(provider: ProviderRow, type: ServiceType) {
  const haystack = [
    provider.businessName,
    provider.about ?? "",
    provider.capacity ?? "",
    provider.workingHours ?? "",
    provider.vehicle?.model ?? "",
    ...(provider.languages ?? []),
  ]
    .join(" ")
    .toLowerCase();
  return type.keywords.some((keyword) => haystack.includes(keyword.toLowerCase()));
}

export default function ServiceDetail() {
  const { service } = useParams();
  const page = findServicePage(service);
  const [params, setParams] = useSearchParams();

  const typeId = params.get("type") ?? "all";
  const city = params.get("city") ?? "";

  const providers = useRestQuery<ProviderRow[]>(
    "providers",
    "publicList",
    page ? { direction: page.direction } : {},
    Boolean(page),
  );

  const allRows = useMemo(() => providers ?? [], [providers]);
  const rows = useMemo(() => {
    return city
      ? allRows.filter((p) => p.city.toLowerCase().includes(city.toLowerCase()))
      : allRows;
  }, [allRows, city]);

  const activeType = page?.types.find((t) => t.id === typeId);
  const matched = activeType ? rows.filter((p) => matchesType(p, activeType)) : rows;

  // Tur bo'yicha mutaxassis topilmasa — barcha mutaxassislar ko'rsatiladi,
  // shunda foydalanuvchi hech qachon bo'sh ekranga tushmaydi.
  const shown = matched.length > 0 ? matched : rows;
  const fellBackToAll = Boolean(activeType) && matched.length === 0 && rows.length > 0;

  const cities = useMemo(
    () => Array.from(new Set(allRows.map((p) => p.city))).sort(),
    [allRows],
  );

  if (!page) {
    return <Navigate to="/xizmatlar" replace />;
  }

  const Icon = ICONS[page.direction];

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(patch)) {
      if (!value || value === "all") {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    }
    setParams(next, { replace: true });
  };

  const returnTo = `/xizmatlar/${page.slug}`;

  return (
    <>
      <PageHero eyebrow={`Xizmat · ${page.label}`} title={page.title} description={page.desc}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[12px] font-semibold text-white">
            <Icon className="size-3.5 text-gold" aria-hidden="true" />
            {page.types.length} xil tur
          </span>
          <Button
            size="sm"
            variant="outline"
            className="border-white/25 bg-white/10 text-white hover:bg-white/20 hover:text-white"
            onClick={openMillyAi}
          >
            <Sparkles className="size-3.5" aria-hidden="true" />
            Milly AI bilan rejalash
          </Button>
        </div>
      </PageHero>

      <Container className="pt-6">
        <Link
          to="/xizmatlar"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Barcha xizmatlar
        </Link>
      </Container>

      {/* ── Tavsif + rasm ─────────────────────────────────────────────────── */}
      <Container className="grid gap-6 py-8 lg:grid-cols-[1.2fr_1fr] lg:items-center">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <ul className="flex flex-col gap-3">
            {page.highlights.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-[14px] leading-6">
                <span className="mt-1 grid size-4.5 shrink-0 place-items-center rounded-full bg-primary/12">
                  <BadgeCheck className="size-3 text-primary" aria-hidden="true" />
                </span>
                <span className="text-foreground">{item}</span>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button asChild>
              <a href={partnerBotLink()} target="_blank" rel="noreferrer">
                {page.label} bo'yicha mutaxassis bo'lish
              </a>
            </Button>
            <Button variant="outline" onClick={openMillyAi}>
              <Send className="size-4" aria-hidden="true" />
              Tur dasturiga qo'shish
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative overflow-hidden rounded-2xl border"
        >
          <img
            src={page.image}
            alt={page.title}
            loading="lazy"
            decoding="async"
            className="aspect-[4/3] w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent" />
          <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 p-4 text-white">
            <Icon className="size-5 text-gold" aria-hidden="true" />
            <span className="text-sm font-semibold">{page.label}</span>
          </div>
        </motion.div>
      </Container>

      {/* ── Turlari ───────────────────────────────────────────────────────── */}
      <section className="bg-muted/40 py-12">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold tracking-[0.16em] text-primary uppercase">
                Turlari
              </p>
              <h2 className="mt-1.5 text-[22px] leading-7 font-bold tracking-tight text-foreground sm:text-[26px] sm:leading-8">
                {page.label} qanday turlarga bo'linadi
              </h2>
            </div>
            <button
              type="button"
              onClick={() => update({ type: null })}
              className={cn(
                "cursor-pointer rounded-full border px-3.5 py-1.5 text-[12px] font-semibold transition-colors",
                activeType
                  ? "border-border bg-background text-muted-foreground hover:text-foreground"
                  : "border-primary bg-primary/10 text-primary",
              )}
            >
              Barcha turlar
            </button>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {page.types.map((type, index) => {
              const active = type.id === typeId;
              return (
                <motion.button
                  key={type.id}
                  type="button"
                  onClick={() => update({ type: active ? null : type.id })}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.24) }}
                  className={cn(
                    "flex h-full cursor-pointer flex-col rounded-2xl border p-4 text-left transition-colors",
                    active
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:border-primary/40",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-[15px] leading-5 font-semibold text-foreground">
                      {type.label}
                    </h3>
                    {active && (
                      <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                        Tanlandi
                      </span>
                    )}
                  </div>
                  <p className="mt-2 flex-1 text-[13px] leading-5 text-muted-foreground">
                    {type.desc}
                  </p>
                  <p className="mt-3 text-[12px] font-semibold text-foreground">
                    {type.priceHint}
                  </p>
                </motion.button>
              );
            })}
          </div>
        </Container>
      </section>

      {/* ── Mutaxassislar ─────────────────────────────────────────────────── */}
      <Container className="py-12">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold tracking-[0.16em] text-primary uppercase">
              Mutaxassislar
            </p>
            <h2 className="mt-1.5 text-[22px] leading-7 font-bold tracking-tight text-foreground sm:text-[26px] sm:leading-8">
              {activeType ? `${activeType.label} — tasdiqlangan hamkorlar` : "Tasdiqlangan hamkorlar"}
            </h2>
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

        <p className="mt-3 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{shown.length}</span> ta mutaxassis
          {activeType ? ` · ${activeType.label}` : ""}
          {fellBackToAll ? " (tanlangan tur bo'yicha alohida mutaxassis hozircha yo'q)" : ""}
        </p>

        {/* Umumiy so'rov — mutaxassis tanlanmagan bo'lsa ham ishlaydi. */}
        <div className="mt-5">
          <ServiceRequestPanel
            service={page.direction as BookableService}
            label={page.label}
            returnTo={returnTo}
          />
        </div>

        {providers === undefined ? (
          <p className="mt-6 text-sm text-muted-foreground">Yuklanmoqda…</p>
        ) : shown.length === 0 ? (
          <Card className="mt-6 border-dashed">
            <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
              <MapPin className="size-6 text-muted-foreground" aria-hidden="true" />
              <p className="text-sm font-semibold text-foreground">
                Bu yo'nalishda hozircha tasdiqlangan mutaxassis yo'q
              </p>
              <p className="max-w-md text-sm text-muted-foreground">
                {page.label} bo'yicha hamkorlar {PARTNER_BOT_USERNAME} orqali ro'yxatdan o'tadi va
                administrator tasdiqlagach shu ro'yxatda chiqadi. Hoziroq so'rov qoldirsangiz,
                birinchi mos mutaxassisga yuboriladi.
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
            {shown.map((p, i) => (
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
                      {page.label}
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
                    service={page.direction as BookableService}
                    providerName={p.businessName}
                    city={p.city}
                    returnTo={returnTo}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </Container>

      {/* ── Qanday ishlaydi ───────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-ink py-14 text-white">
        <Container className="relative">
          <p className="text-[11px] font-bold tracking-[0.16em] text-gold uppercase">
            Qanday ishlaydi
          </p>
          <h2 className="mt-1.5 text-[22px] leading-7 font-bold tracking-tight sm:text-[26px] sm:leading-8">
            {page.label} xizmatini bron qilish — {page.how.length} qadam
          </h2>
          <ol className="mt-8 grid gap-5 sm:grid-cols-3">
            {page.how.map((step, index) => (
              <motion.li
                key={step.title}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                className="rounded-2xl border border-white/12 bg-white/[0.04] p-5"
              >
                <span className="grid size-8 place-items-center rounded-xl bg-gold text-[13px] font-bold text-gold-ink">
                  {index + 1}
                </span>
                <p className="mt-3.5 text-[15px] font-semibold">{step.title}</p>
                <p className="mt-2 text-[13px] leading-5 text-white/70">{step.desc}</p>
              </motion.li>
            ))}
          </ol>
        </Container>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────────── */}
      <Container className="py-12">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <p className="text-[11px] font-bold tracking-[0.16em] text-primary uppercase">
              Savol-javob
            </p>
            <h2 className="mt-1.5 text-[22px] leading-7 font-bold tracking-tight text-foreground sm:text-[26px] sm:leading-8">
              Ko'p so'raladigan savollar
            </h2>
            <p className="mt-3 text-[13px] leading-6 text-muted-foreground">
              Javob topilmasa, Milly AI yoki Telegram bot orqali so'rang — operator javob beradi.
            </p>
            <Button variant="outline" className="mt-4" onClick={openMillyAi}>
              <Sparkles className="size-4" aria-hidden="true" />
              Milly AI dan so'rash
            </Button>
          </div>
          <Accordion type="single" collapsible className="w-full">
            {page.faq.map((item, index) => (
              <AccordionItem key={item.q} value={`faq-${index}`}>
                <AccordionTrigger className="cursor-pointer text-left text-[14px] font-semibold">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-[13px] leading-6 text-muted-foreground">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </Container>

      {/* ── Boshqa xizmatlar ──────────────────────────────────────────────── */}
      <section className="bg-muted/40 py-12">
        <Container>
          <h2 className="text-[20px] leading-6 font-bold tracking-tight text-foreground sm:text-[22px]">
            Boshqa xizmatlar
          </h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICE_PAGES.filter((item) => item.slug !== page.slug).map((item) => {
              const OtherIcon = ICONS[item.direction];
              return (
                <Link
                  key={item.slug}
                  to={`/xizmatlar/${item.slug}`}
                  className="group flex items-center gap-3 rounded-2xl border bg-card px-4 py-3.5 transition-colors hover:border-primary/40"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <OtherIcon className="size-4.5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14px] font-semibold text-foreground">
                      {item.label}
                    </span>
                    <span className="block truncate text-[12px] text-muted-foreground">
                      {item.types.length} xil tur
                    </span>
                  </span>
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                </Link>
              );
            })}
          </div>
        </Container>
      </section>
    </>
  );
}
