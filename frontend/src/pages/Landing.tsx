import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router";
import {
  ArrowRight,
  BadgeCheck,
  BedDouble,
  Camera,
  CarFront,
  Check,
  Clock,
  Languages,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Store,
  Ticket,
  UserRound,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { SectionHeading } from "@/components/brand";
import { HeroCards } from "@/components/hero-cards";
import { DealsTeaser } from "@/components/top-deals";
import { AdvantagesBand } from "@/components/advantages";
import { TourCard, TourKindTabs } from "@/components/tour";
import { Container } from "@/components/site";
import { Price } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { TOUR_KINDS, filterByKind, splitByKind, type TourKind } from "@/lib/tours";
import { AiSection } from "@/components/ai-section";
import {
  CITIES,
  DURATIONS,
  PRODUCTS,
  TOUR_CATEGORIES,
  TOUR_PACKAGES,
  PARTNER_BOT_USERNAME,
  partnerBotLink,
  type CategoryId,
} from "@/data/catalog";

const blurFade = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
};

/* ----------------------------------- hero ---------------------------------- */

function Hero() {
  return (
    <section className="relative min-h-[600px] overflow-hidden bg-background text-foreground">
      <Container className="relative flex min-h-[600px] items-center pb-36 pt-16 sm:pt-20 lg:pb-44">
        <div className="flex max-w-xl flex-col items-start text-left">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-4 py-1.5 text-xs font-semibold tracking-wide text-primary">
              <span className="relative flex size-2" aria-hidden="true">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-gold opacity-70" />
                <span className="relative inline-flex size-2 rounded-full bg-gold" />
              </span>
              O'zbekiston — Buyuk Ipak yo'lining yuragi
            </span>
            <h1 className="mt-6 max-w-2xl text-[38px] leading-[42px] font-extrabold tracking-tight sm:text-[58px] sm:leading-[60px]">
              O'zbekistonni kashf eting,
              <span className="block script-accent text-3xl font-normal italic sm:text-5xl"> xotiralar yarating</span>
            </h1>
            <p className="mt-5 max-w-lg text-base leading-6 text-muted-foreground sm:text-lg sm:leading-7">
              Tasdiqlangan tur paketlar, Milly AI tuzgan shaxsiy dastur va mahalliy mutaxassislar
              (gid, transfer, mehmonxona, tarjimon, fotograf) — bitta joyda.
            </p>
            <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Button size="lg" className="bg-primary hover:bg-primary/90" asChild>
                <Link to="/paketlar">
                  Tur paketlarni ko'rish
                  <ArrowRight className="size-4 ml-1.5" aria-hidden="true" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/xizmatlar">
                  Xizmatlarni ko'rish
                  <ArrowRight className="size-4 ml-1.5" aria-hidden="true" />
                </Link>
              </Button>
            </div>
            <ul className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-muted-foreground">
              {["Tasdiqlangan hamkorlar", "Aniq narx", "Xavfsiz to'lov"].map((item) => (
                <li key={item} className="inline-flex items-center gap-1.5">
                  <Check className="size-3.5 text-gold" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>

            <dl className="mt-9 grid w-full max-w-md grid-cols-3 gap-3 border-t pt-6">
              {[
                { value: "120+", label: "Tur paket" },
                { value: "12 400", label: "Sayohatchi" },
                { value: "4.9", label: "O'rtacha baho" },
              ].map((stat) => (
                <div key={stat.label}>
                  <dt className="text-[22px] leading-7 font-extrabold text-foreground sm:text-[26px]">
                    {stat.value}
                  </dt>
                  <dd className="mt-0.5 text-[11.5px] tracking-wide text-muted-foreground uppercase">
                    {stat.label}
                  </dd>
                </div>
              ))}
            </dl>
          </motion.div>
        </div>

        {/* Avtomatik aylanadigan kartochkalar — o'ng/chapdagilari orqada turadi */}
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="absolute top-1/2 right-0 hidden -translate-y-1/2 xl:block"
        >
          <HeroCards />
        </motion.div>
      </Container>
    </section>
  );
}

/* ------------------------------ qidiruv paneli ------------------------------ */

function SearchField({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <label className="block rounded-lg bg-muted/60 px-2.5 py-1.5 transition-shadow focus-within:bg-card focus-within:ring-[3px] focus-within:ring-ring/40">
      <span className="flex items-center gap-1.5 text-[10.5px] font-semibold tracking-wide text-muted-foreground uppercase">
        <Icon className="size-3" aria-hidden="true" />
        {label}
      </span>
      {children}
    </label>
  );
}

const selectCls =
  "w-full border-0 bg-transparent p-0 pt-0.5 text-[13.5px] font-semibold text-foreground outline-none";

/** Turkumlar bo'yicha paketlar soni — qidiruvdagi tugmalarda ko'rsatiladi. */
const CATEGORY_COUNTS: Partial<Record<CategoryId, number>> = (() => {
  const result: Partial<Record<CategoryId, number>> = { all: TOUR_PACKAGES.length };
  for (const cat of TOUR_CATEGORIES) {
    if (cat.id === "all") {
      continue;
    }
    result[cat.id] = TOUR_PACKAGES.filter((tour) => tour.category === cat.id).length;
  }
  return result;
})();

/**
 * Ixcham qidiruv: turkum tugmalari ustida, ostida shahar / kunlar / odam.
 *
 * Turkum — tur paketlarning asosiy bo'linishi (tarixiy shaharlar, ekoturizm va
 * tabiat, hunarmandchilik, ziyorat, sarguzasht). "Barchasi" tanlansa `category`
 * parametri yuborilmaydi va /paketlar barcha paketlarni ko'rsatadi.
 */
function SearchPanel() {
  const navigate = useNavigate();
  const [city, setCity] = useState<string>(CITIES[1]);
  const [category, setCategory] = useState<CategoryId>("all");
  const [days, setDays] = useState<string>(DURATIONS[1]);
  const [guests, setGuests] = useState<string>("2");

  return (
    <section id="qidiruv" aria-label="Sayohat qidiruvi">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const params = new URLSearchParams();
          if (city) {
            params.set("city", city);
          }
          if (category !== "all") {
            params.set("category", category);
          }
          if (days) {
            params.set("days", days);
          }
          if (guests) {
            params.set("guests", guests);
          }
          navigate(`/paketlar?${params.toString()}`);
        }}
        className="rounded-2xl border bg-card p-2 shadow-lifted sm:p-2.5"
      >
        {/* Turkum tugmalari — maydonlar ustida, tanlov bir bosishda o'zgaradi */}
        <div
          role="group"
          aria-label="Turkum tanlash"
          className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1.5"
        >
          {TOUR_CATEGORIES.map((cat) => {
            const active = cat.id === category;
            return (
              <button
                key={cat.id}
                type="button"
                aria-pressed={active}
                onClick={() => setCategory(cat.id)}
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-colors",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground",
                )}
              >
                {cat.short}
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10.5px] font-bold",
                    active ? "bg-white/20 text-white" : "bg-muted text-muted-foreground",
                  )}
                >
                  {CATEGORY_COUNTS[cat.id] ?? 0}
                </span>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_auto]">
          <SearchField label="Shahar" icon={MapPin}>
            <select name="city" value={city} onChange={(e) => setCity(e.target.value)} className={selectCls}>
              {CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </SearchField>
          <SearchField label="Kunlar" icon={Clock}>
            <select name="days" value={days} onChange={(e) => setDays(e.target.value)} className={selectCls}>
              {DURATIONS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </SearchField>
          <SearchField label="Odam" icon={Users}>
            <select name="guests" value={guests} onChange={(e) => setGuests(e.target.value)} className={selectCls}>
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n} kishi
                </option>
              ))}
            </select>
          </SearchField>
          <Button type="submit" size="lg" className="h-full px-6">
            <Search className="size-4" aria-hidden="true" />
            Qidirish
          </Button>
        </div>
      </form>
    </section>
  );
}

/* ------------------------------ qanday ishlaydi ------------------------------ */

const STEPS = [
  {
    icon: Search,
    title: "Tanlang",
    text: "Shahar, sana va byudjetni belgilang — tasdiqlangan paketlar va mahalliy mutaxassislar orasidan.",
  },
  {
    icon: Sparkles,
    title: "Rejalashtiring",
    text: "Milly AI savollaringizga qarab 30 soniyada ikki xil tur dasturini tuzadi, tasdiqlaganingizda mutaxassislarni biriktiradi.",
  },
  {
    icon: ShieldCheck,
    title: "Band qiling",
    text: "Click, Payme yoki Visa/Mastercard bilan xavfsiz to'lang — elektron vaucher va QR chipta darhol qo'lingizda.",
  },
];

function HowItWorks() {
  return (
    <section className="relative overflow-hidden py-14 lg:py-20">
      <Container className="relative">
        <motion.div {...blurFade}>
          <SectionHeading
            align="center"
            eyebrow="Qanday ishlaydi"
            title="Uch qadamda sayohatga tayyor"
            description="Murakkab rejalarni bizga qoldiring — sizga tanlashgina qoladi."
          />
        </motion.div>
        <div className="relative mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
          <div
            aria-hidden="true"
            className="absolute top-9 right-[16%] left-[16%] hidden border-t-2 border-dashed md:block"
          />
          {STEPS.map((s, i) => (
            <motion.div
              key={s.title}
              {...blurFade}
              transition={{ ...blurFade.transition, delay: i * 0.12 }}
              className="relative flex flex-col items-center text-center"
            >
              <div className="relative">
                <span className="grid size-[72px] place-items-center rounded-2xl border border-primary/15 bg-card shadow-xs">
                  <s.icon className="size-7 text-primary" aria-hidden="true" />
                </span>
                <span className="absolute -top-2 -right-2 grid size-7 place-items-center rounded-full bg-gold text-[11px] font-bold text-gold-foreground">
                  {i + 1}
                </span>
              </div>
              <h3 className="mt-5 text-lg font-semibold text-foreground">{s.title}</h3>
              <p className="mt-2 max-w-xs text-[15px] leading-6 text-muted-foreground">{s.text}</p>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------- tur paketlar ------------------------------- */

/**
 * Tur paketlar va yo'nalishlar karuseli.
 *
 * Turkum bu yerda tanlanmaydi — turkum yuqoridagi qidiruv panelidagi tugmalar
 * orqali tanlanadi. Bo'limda faqat tur turi (tur paket / yo'nalish) qoladi.
 */
function PopularTours() {
  const [kind, setKind] = useState<TourKind>("package");

  const kindCounts = useMemo(() => {
    const { packages, directions } = splitByKind(TOUR_PACKAGES);
    return { package: packages.length, direction: directions.length };
  }, []);

  const tours = useMemo(() => filterByKind(TOUR_PACKAGES, kind).slice(0, 6), [kind]);

  const activeKind = TOUR_KINDS.find((item) => item.id === kind);

  return (
    <section id="turlar" className="scroll-mt-24 py-14 lg:py-20">
      <Container>
        <motion.div {...blurFade} className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            eyebrow="Turlar"
            title="Tur paketlar va yo'nalishlar"
            description="Tur paketi — bitta shahar yoki hududga qaratilgan tayyor dastur. Yo'nalish — 2-3 shaharni birlashtirgan katta tur: barcha manzillar, kunlar va narx kartochkada ko'rsatilgan."
          />
          <Button variant="outline" className="shrink-0" asChild>
            <Link to="/paketlar">
              Barcha paketlar
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        </motion.div>

        <motion.div {...blurFade} className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-3">
          <TourKindTabs value={kind} onChange={setKind} counts={kindCounts} />
          <p className="text-[12.5px] text-muted-foreground">{activeKind?.hint}</p>
        </motion.div>

        <motion.p {...blurFade} className="mt-3 text-[12.5px] text-muted-foreground">
          Turkum (tarixiy shaharlar, ekoturizm va tabiat, hunarmandchilik va boshqalar) yuqoridagi
          qidiruv panelidan tanlanadi — shu yerda takrorlanmaydi.
        </motion.p>

        <Carousel key={kind} className="mt-8 w-full">
          <CarouselContent className="-ml-4 lg:-ml-6">
            {tours.length === 0 ? (
              <CarouselItem className="basis-full pl-4 lg:pl-6">
                <p className="rounded-2xl border border-dashed bg-muted/40 px-5 py-8 text-center text-[13px] text-muted-foreground">
                  Bu turda hozircha paket yo'q — boshqa turni tanlang.
                </p>
              </CarouselItem>
            ) : null}
            {tours.map((tour) => (
              <CarouselItem
                key={tour.id}
                className="basis-full pl-4 sm:basis-1/2 lg:basis-1/3 lg:pl-6"
              >
                <TourCard tour={tour} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="mt-6 flex justify-center gap-2 sm:justify-end">
            <CarouselPrevious className="static size-11 left-auto translate-y-0 rounded-xl" />
            <CarouselNext className="static size-11 right-auto translate-y-0 rounded-xl" />
          </div>
        </Carousel>
      </Container>
    </section>
  );
}

/* ---------------------------------- xizmatlar ------------------------------- */

const SERVICES = [
  {
    icon: BedDouble,
    title: "Mehmonxona",
    text: "3* dan butik mehmonxonalargacha — bronlar to'g'ridan-to'g'ri egasidan.",
    chip: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
    ink: "text-indigo-600 dark:text-indigo-400",
    to: "/xizmatlar?direction=hotel",
  },
  {
    icon: UtensilsCrossed,
    title: "Restoran",
    text: "Milliy taomlar, guruh uchun stol va gastronomik kechalar.",
    chip: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    ink: "text-orange-600 dark:text-orange-400",
    to: "/xizmatlar?direction=restaurant",
  },
  {
    icon: UserRound,
    title: "Gid",
    text: "Litsenziyali, tillarni biladigan gidlar — kunlik yoki marshrut bo'yicha.",
    chip: "bg-primary/10 text-primary",
    ink: "text-primary",
    to: "/xizmatlar?direction=guide",
  },
  {
    icon: CarFront,
    title: "Transfer",
    text: "Aeroport, shaharlararo va shahar ichida tashish. Mashina holati kunlik nazoratda.",
    chip: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    ink: "text-emerald-600 dark:text-emerald-400",
    to: "/xizmatlar?direction=transfer",
  },
  {
    icon: Languages,
    title: "Tarjimon",
    text: "Guruh tili bo'yicha tarjimon — kunma-kun vazifa va aniq mas'ul mutaxassis.",
    chip: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    ink: "text-sky-600 dark:text-sky-400",
    to: "/xizmatlar?direction=translator",
  },
  {
    icon: Camera,
    title: "Fotograf",
    text: "Professional fotosessiya: lokatsiya, vaqt va tayyor suratlar paketi.",
    chip: "bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400",
    ink: "text-fuchsia-600 dark:text-fuchsia-400",
    to: "/xizmatlar?direction=photographer",
  },
  {
    icon: Ticket,
    title: "Boshqa xizmatlar",
    text: "Sug'urta, chipta, konsulxizmat va turizm sohasidagi boshqa xizmatlar.",
    chip: "bg-slate-500/10 text-slate-600 dark:text-slate-300",
    ink: "text-slate-600 dark:text-slate-300",
    to: "/xizmatlar?direction=other",
  },
  {
    icon: Store,
    title: "Hunarmandlar bozori",
    text: "Kulolchilik, atlas va zargarlik buyumlari — ustaxonadan to'g'ridan-to'g'ri.",
    chip: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
    ink: "text-teal-600 dark:text-teal-400",
    to: "/hunarmandlar",
  },
];

function ServicesBand() {
  return (
    <section className="py-14 lg:py-20" aria-label="Xizmat ko'rsatuvchilar">
      <Container>
        <motion.div {...blurFade} className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            eyebrow="Xizmatlar"
            title="Sayohatni to'liq jamoa bilan yakunlang"
            description="Mehmonxona, restoran, gid, transfer, tarjimon, fotograf va boshqa turizm xizmatlari — har biri o'z reytingi va tajribasi bilan alohida ko'rsatilgan. Tur dasturiga qo'shish ham, alohida bron qilish ham mumkin."
          />
          <Button variant="outline" className="shrink-0" asChild>
            <Link to="/xizmatlar">
              Barcha mutaxassislar
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        </motion.div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {SERVICES.map((s, i) => (
            <motion.div
              key={s.title}
              {...blurFade}
              transition={{ ...blurFade.transition, delay: i * 0.07 }}
            >
              <Link
                to={s.to}
                className="group flex h-full flex-col rounded-2xl border bg-card p-5 transition-all hover:-translate-y-1 hover:shadow-soft"
              >
                <span
                  className={`grid size-11 place-items-center rounded-xl ${s.chip}`}
                >
                  <s.icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-[15px] font-semibold text-foreground">{s.title}</h3>
                <p className="mt-2 flex-1 text-[13px] leading-5 text-muted-foreground">{s.text}</p>
                <span
                  className={`mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold ${s.ink}`}
                >
                  Ko'rish
                  <ArrowRight
                    className="size-3.5 transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* -------------------------------- hunarmandlar ------------------------------- */

function ArtisansTeaser() {
  return (
    <section id="hunarmandlar" className="scroll-mt-24 border-y bg-muted/40 py-14 lg:py-20">
      <Container>
        <motion.div {...blurFade} className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            eyebrow="Hunarmandlar bozori"
            title="Ustaxonadan to'g'ridan-to'g'ri sizga"
            description="Rishton likopchasidan Marg'ilon atlasigacha — har bir buyum muallifi ma'lum va eksport hujjatlari bilan yuboriladi."
          />
          <Button variant="outline" className="shrink-0" asChild>
            <Link to="/hunarmandlar">
              Barchasini ko'rish
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        </motion.div>
        <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
          {PRODUCTS.slice(0, 4).map((p, i) => (
            <motion.div
              key={p.id}
              {...blurFade}
              transition={{ ...blurFade.transition, delay: i * 0.08 }}
            >
              <Link
                to="/hunarmandlar"
                className="group flex h-full flex-col overflow-hidden rounded-2xl border bg-card transition-shadow hover:shadow-soft"
              >
                <div className="aspect-square overflow-hidden bg-muted">
                  <img
                    src={p.image}
                    alt={p.alt}
                    loading="lazy"
                    decoding="async"
                    className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <p className="text-[11px] font-semibold tracking-wider text-gold uppercase">
                    {p.category}
                  </p>
                  <h3 className="mt-1 line-clamp-2 min-h-10 text-sm leading-5 font-semibold">
                    {p.title}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {p.seller} · {p.city}
                  </p>
                  <div className="mt-auto pt-2.5">
                    <Price usd={p.price} className="text-[15px]" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------- hamkor CTA ------------------------------- */

const PARTNER_PERKS = [
  `${PARTNER_BOT_USERNAME} orqali 5 daqiqada ro'yxatdan o'tish`,
  "Buyurtmalar yo'nalishingizga moslab botga tushadi",
  "Reyting, kalendar va to'lovlar bitta panelda",
  "Oylik obuna: $19 dan boshlab",
];

function PartnerCta() {
  return (
    <section className="py-14 lg:py-20">
      <Container>
        <motion.div
          {...blurFade}
          className="relative overflow-hidden rounded-3xl border bg-primary px-6 py-10 text-white sm:px-10"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-[#2563EB] to-[#1F5BFF]" />
          <div className="absolute inset-0 bg-[radial-gradient(60%_70%_at_85%_0%,rgba(255,106,26,0.3),transparent_60%)]" />
          <div className="relative grid items-center gap-10 lg:grid-cols-[1.3fr_1fr]">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold">
                <BadgeCheck className="size-3.5 text-gold" aria-hidden="true" />
                Gid · Transfer · Tarjimon · Fotograf · Hunarmand · Mehmonxona
              </span>
              <h2 className="mt-5 text-[26px] leading-9 font-bold tracking-tight sm:text-[32px] sm:leading-10">
                Xizmat ko'rsatuvchimisiz? O'z boshqaruv panelingizni oling
              </h2>
              <p className="mt-4 max-w-xl text-[15px] leading-6 text-white/75">
                Millytour hamkorlari {PARTNER_BOT_USERNAME} orqali ro'yxatdan o'tadi va yo'nalishiga
                mos bot
                paneliga ega bo'ladi: buyurtmalar, Milly AI biriktirgan vazifalar, kalendar, reyting
                va to'lovlar — hammasi bitta joyda.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button size="lg" className="bg-gold text-gold-foreground hover:bg-gold/90" asChild>
                  <a href={partnerBotLink()} target="_blank" rel="noreferrer">
                    Hamkor bo'lish
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </a>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                  asChild
                >
                  <Link to="/partner">Hamkor paneli</Link>
                </Button>
              </div>
            </div>
            <ul className="flex flex-col gap-3">
              {PARTNER_PERKS.map((p) => (
                <li
                  key={p}
                  className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3.5 text-sm"
                >
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-eco/20">
                    <Check className="size-3 text-eco" aria-hidden="true" />
                  </span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}

/* ----------------------------------- page ---------------------------------- */

/**
 * Bosh sahifa tartibi (soddalashtirilgan):
 *
 *   1. Hero + qidiruv paneli
 *   2. Qanday ishlaydi                — qidiruvdan keyin darhol (3 qadam)
 *   3. Tur paketlar va yo'nalishlar   — asosiy kontent
 *   4. Top takliflar                  — chegirmalar (konversiya)
 *   5. Milly AI                       — asosiy farq qiluvchi xususiyat
 *   6. Xizmatlar                      — gid, transfer, mehmonxona va h.k.
 *   7. Hunarmandlar                   — mahalliy bozor
 *   8. Afzalliklar                    — kafolatlar
 *   9. Hamkorlik CTA
 *
 * Olib tashlangan:
 * - shaharlar "ishonch qatori" — hero statistikasi bilan takrorlanardi;
 * - "Aynan siz uchun" qatori (`ForYouRow`) — tur kartochkalarini takrorlardi va
 *   `/paketlar` sahifasida qolgan;
 * - `EventsSection` — server `events.list` bo'sh massiv qaytargani uchun u har
 *   holda ko'rinmasdi (tadbirlar bazaga to'lganda qayta qo'shiladi).
 */
export default function Landing() {
  return (
    <>
      <Hero />

      {/* Qidiruv paneli hero bilan ustma-ust turadi */}
      <div className="relative z-20 mx-auto -mt-24 w-full max-w-6xl px-4 sm:px-6">
        <SearchPanel />
      </div>
      <div className="h-10 lg:h-14" aria-hidden="true" />

      {/* Qidiruvdan keyin darhol: sayohat qanday rejalashtiriladi (3 qadam) */}
      <HowItWorks />
      <PopularTours />
      <DealsTeaser />
      <AiSection />
      <ServicesBand />
      <ArtisansTeaser />
      <AdvantagesBand />
      <PartnerCta />
    </>
  );
}
