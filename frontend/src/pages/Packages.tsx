import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { motion } from "framer-motion";
import { useRestMutation } from "@/api/client";
import { toast } from "sonner";
import {
  ArrowRight,
  CalendarDays,
  Loader2,
  MapPin,
  Send,
  SlidersHorizontal,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { AuthGateDialog } from "@/components/AuthGateDialog";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { usePackages } from "@/hooks/use-packages";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHero, Container } from "@/components/site";
import { CategoryTabs, TourCard } from "@/components/tour";
import { filterByKind, kindLabel, splitByKind, type TourKind } from "@/lib/tours";
import { ForYouRow } from "@/components/for-you";
import { EventsSection } from "@/components/events";
import { AiSection } from "@/components/ai-section";
import { PriceInline } from "@/lib/currency";
import {
  CITIES,
  DURATIONS,
  PARTNER_BOT_USERNAME,
  SERVICES,
  TOUR_CATEGORIES,
  partnerBotLink,
  type CategoryId,
  type ServiceId,
} from "@/data/catalog";
import { cn } from "@/lib/utils";

const SORTS = [
  { id: "popular", label: "Ommaboplik" },
  { id: "price-asc", label: "Narx: arzon → qimmat" },
  { id: "price-desc", label: "Narx: qimmat → arzon" },
  { id: "rating", label: "Reyting" },
] as const;

const selectCls =
  "h-10 rounded-xl border bg-background px-3 text-sm font-medium outline-none focus-visible:border-primary/50 focus-visible:ring-[3px] focus-visible:ring-ring/30";

const SERVICE_META = {
  guide: { label: "Gid xizmati", unit: 60, per: "kun", perGuests: false },
  transfer: { label: "Transfer", unit: 45, per: "kun", perGuests: true },
  hotel: { label: "Mehmonxona", unit: 80, per: "kecha", perGuests: true },
  restaurant: { label: "Restoran", unit: 35, per: "kun", perGuests: true },
  translator: { label: "Tarjimon", unit: 40, per: "kun", perGuests: false },
  photographer: { label: "Fotograf", unit: 55, per: "kun", perGuests: false },
  other: { label: "Boshqa turizm xizmati", unit: 50, per: "kun", perGuests: false },
} as const;

type BookableService = keyof typeof SERVICE_META;

/**
 * Gid, transfer yoki mehmonxona uchun to'g'ridan-to'g'ri so'rov.
 * So'rov yo'nalishdagi barcha tasdiqlangan hamkorlarning botiga tushadi,
 * qabul qilingandan so'ng to'lov kabinetdan amalga oshiriladi.
 */
function ServiceRequestPanel({
  service,
  defaultCity,
  guests: defaultGuests,
}: {
  service: BookableService;
  defaultCity: string;
  guests: number;
}) {
  const meta = SERVICE_META[service];
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const request = useRestMutation("bookings", "requestService");
  const [form, setForm] = useState({
    city: defaultCity,
    startDate: "2026-10-03",
    days: 3,
    guests: defaultGuests,
    note: "",
  });
  const [sending, setSending] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);

  const units = meta.per === "kecha" ? Math.max(1, form.days - 1) : Math.max(1, form.days);
  const unitsCount = meta.perGuests ? Math.max(1, Math.ceil(form.guests / 3)) : 1;
  const estimate = Math.round(meta.unit * units * unitsCount);

  const submit = async () => {
    if (!isAuthenticated) {
      setGateOpen(true);
      return;
    }
    setSending(true);
    try {
      const result = await request({
        service,
        city: form.city,
        startDate: form.startDate,
        days: form.days,
        guests: form.guests,
        note: form.note || undefined,
      });
      toast.success(`So'rov yuborildi · ${result.reference}`);
      navigate("/dashboard?tab=orders");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "So'rov yuborilmadi");
    } finally {
      setSending(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6 rounded-2xl border border-primary/25 bg-primary/5 p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">
            {meta.label} uchun so'rov qoldiring
          </p>
          <p className="mt-1 text-[13px] leading-5 text-muted-foreground">
            So'rov {meta.label.toLowerCase()} yo'nalishidagi tasdiqlangan hamkorlarning botiga va
            paneliga tushadi. Qabul qilingach narx tasdiqlanadi.
          </p>
        </div>
        <span className="rounded-full bg-card px-3 py-1.5 text-[12px] font-semibold text-foreground shadow-xs">
          Taxminiy: <PriceInline usd={estimate} /> · {meta.unit} USD/{meta.per}
        </span>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto_auto_auto]">
        <label className="block">
          <span className="text-[11px] font-semibold text-muted-foreground">Shahar</span>
          <Input
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            className="mt-1"
          />
        </label>
        <label className="block">
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
            <CalendarDays className="size-3" aria-hidden="true" /> Sana
          </span>
          <input
            type="date"
            value={form.startDate}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            className="mt-1 h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus-visible:border-primary/50"
          />
        </label>
        <label className="block">
          <span className="text-[11px] font-semibold text-muted-foreground">Kun</span>
          <select
            value={form.days}
            onChange={(e) => setForm({ ...form, days: Number(e.target.value) })}
            className="mt-1 h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none"
          >
            {[1, 2, 3, 4, 5, 7, 10].map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
            <Users className="size-3" aria-hidden="true" /> Kishi
          </span>
          <select
            value={form.guests}
            onChange={(e) => setForm({ ...form, guests: Number(e.target.value) })}
            className="mt-1 h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none"
          >
            {[1, 2, 3, 4, 6, 8, 12].map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end">
          <Button className="w-full lg:w-auto" disabled={sending} onClick={submit}>
            {sending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <>
                <Send className="size-4" aria-hidden="true" />
                So'rash
              </>
            )}
          </Button>
        </div>
      </div>

      <AuthGateDialog
        open={gateOpen}
        onOpenChange={setGateOpen}
        returnTo={`/paketlar?service=${service}`}
        title={`${meta.label} uchun so'rov yuborish`}
        description="So'rovni yo'nalishdagi hamkorlarga yuborish va javobni kuzatish uchun hisobingiz kerak."
      />
    </motion.div>
  );
}

export default function Packages() {
  const [params, setParams] = useSearchParams();
  const category = (params.get("category") ?? "all") as CategoryId;
  const city = params.get("city") ?? "";
  const days = params.get("days") ?? "";
  const guests = params.get("guests") ?? "2";
  const service = (params.get("service") ?? "") as ServiceId | "";
  const kind = (params.get("kind") ?? "") as TourKind | "";
  const sort = (params.get("sort") ?? "popular") as (typeof SORTS)[number]["id"];

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(patch)) {
      if (value === null || value === "") {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    }
    setParams(next, { replace: true });
  };

  const { packages } = usePackages();

  // Tur turi: bitta shaharli paketlar va 2-3 shaharli yo'nalishlar.
  const kindCounts = useMemo(() => {
    const { packages: single, directions } = splitByKind(packages);
    return { package: single.length, direction: directions.length };
  }, [packages]);

  const counts = useMemo(() => {
    const scoped = filterByKind(packages, kind);
    const result: Partial<Record<CategoryId, number>> = { all: scoped.length };
    for (const cat of TOUR_CATEGORIES) {
      if (cat.id === "all") {
        continue;
      }
      result[cat.id] = scoped.filter((t) => t.category === cat.id).length;
    }
    return result;
  }, [packages, kind]);

  const tours = useMemo(() => {
    let list = filterByKind(
      packages.filter((t) => (category === "all" ? true : t.category === category)),
      kind,
    );
    if (city) {
      list = list.filter((t) => t.city.includes(city) || t.region.includes(city));
    }
    if (days === DURATIONS[0]) {
      list = list.filter((t) => t.days <= 2);
    } else if (days === DURATIONS[1]) {
      list = list.filter((t) => t.days >= 3 && t.days <= 5);
    } else if (days === DURATIONS[2]) {
      list = list.filter((t) => t.days >= 6);
    }
    switch (sort) {
      case "price-asc":
        return [...list].sort((a, b) => a.priceFrom - b.priceFrom);
      case "price-desc":
        return [...list].sort((a, b) => b.priceFrom - a.priceFrom);
      case "rating":
        return [...list].sort((a, b) => b.rating - a.rating);
      default:
        return [...list].sort((a, b) => b.reviews - a.reviews);
    }
  }, [packages, category, city, days, kind, sort]);

  const activeFilters = [
    kind ? { label: `Turi: ${kindLabel(kind)}`, clear: () => update({ kind: null }) } : null,
    city ? { label: `Shahar: ${city}`, clear: () => update({ city: null }) } : null,
    days ? { label: `Davomiylik: ${days}`, clear: () => update({ days: null }) } : null,
    service
      ? {
          label: `Xizmat: ${SERVICES.find((s) => s.id === service)?.label ?? service}`,
          clear: () => update({ service: null }),
        }
      : null,
  ].filter((f): f is { label: string; clear: () => void } => Boolean(f));

  return (
    <>
      <PageHero
        eyebrow="Tur paketlar va yo'nalishlar"
        title="Barcha turlar — turi va turkumi bo'yicha tanlang"
        description="Tur paketi — bitta shahar yoki hududga qaratilgan dastur. Yo'nalish — 2-3 shaharni birlashtirgan katta tur. Har bir kartochkada manzil, kunlar, reyting va narx ko'rsatilgan."
      >
        <div className="flex flex-wrap gap-2">
          {TOUR_CATEGORIES.slice(1).map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => update({ category: cat.id })}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
                category === cat.id
                  ? "border-transparent bg-white text-foreground"
                  : "border-white/20 bg-white/10 text-white/85 hover:bg-white/20",
              )}
            >
              {cat.label} · {counts[cat.id]}
            </button>
          ))}
        </div>
      </PageHero>

      <Container className="py-10 lg:py-14">
        <div className="rounded-2xl border bg-card p-4 shadow-xs">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <SlidersHorizontal className="size-4 text-primary" aria-hidden="true" />
            Filtrlar
          </div>

          <div className="mt-3">
            <CategoryTabs
              value={category}
              onChange={(id) => update({ category: id === "all" ? null : id })}
              counts={counts}
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-4">
            <label className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">Turi</span>
              <select
                value={kind}
                onChange={(e) => update({ kind: e.target.value })}
                className={selectCls}
              >
                <option value="">Barchasi ({packages.length})</option>
                <option value="package">Tur paket · bitta shahar ({kindCounts.package})</option>
                <option value="direction">Yo'nalish · 2-3 shahar ({kindCounts.direction})</option>
              </select>
            </label>

            <label className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">Shahar</span>
              <select
                value={city}
                onChange={(e) => update({ city: e.target.value })}
                className={selectCls}
              >
                <option value="">Barchasi</option>
                {CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">Davomiylik</span>
              <select
                value={days}
                onChange={(e) => update({ days: e.target.value })}
                className={selectCls}
              >
                <option value="">Farqi yo'q</option>
                {DURATIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">Xizmat</span>
              <select
                value={service}
                onChange={(e) => update({ service: e.target.value })}
                className={selectCls}
              >
                <option value="">Faqat tur paketlar</option>
                {SERVICES.map((s) => (
                  <option key={s.id} value={s.id}>
                    + {s.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">Saralash</span>
              <select
                value={sort}
                onChange={(e) => update({ sort: e.target.value })}
                className={selectCls}
              >
                {SORTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>

            {activeFilters.length > 0 && (
              <div className="ml-auto flex flex-wrap items-center gap-2">
                {activeFilters.map((f) => (
                  <button
                    key={f.label}
                    type="button"
                    onClick={f.clear}
                    className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {f.label}
                    <X className="size-3" aria-hidden="true" />
                  </button>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setParams(new URLSearchParams(), { replace: true })}
                >
                  Tozalash
                </Button>
              </div>
            )}
          </div>
        </div>

        {service && service !== "artisan" && (
          <ServiceRequestPanel
            service={service as BookableService}
            defaultCity={city || "Samarqand"}
            guests={Number(guests) || 2}
          />
        )}

        <p className="mt-6 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{tours.length}</span> ta paket topildi
          {guests ? ` · ${guests} kishi uchun narxlar ko'rsatilgan` : ""}
        </p>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div>
            {tours.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
                  <MapPin className="size-6 text-muted-foreground" aria-hidden="true" />
                  <p className="text-sm font-semibold text-foreground">
                    Bu filtrlar bo'yicha paket topilmadi
                  </p>
                  <p className="max-w-sm text-sm text-muted-foreground">
                    Filtrlarni kengaytirib ko'ring yoki AI Planner bilan o'zingizga mos marshrut
                    tuzing.
                  </p>
                  <div className="mt-2 flex gap-2">
                    <Button variant="outline" onClick={() => setParams(new URLSearchParams())}>
                      Filtrlarni tozalash
                    </Button>
                    <Button asChild>
                      <a href="#milly-ai">Milly AI (pastda)</a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {tours.map((tour, i) => (
                  <motion.div
                    key={tour.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: Math.min(i * 0.05, 0.3) }}
                  >
                    <TourCard tour={tour} />
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          <aside className="flex flex-col gap-4">
            <Card className="border-border/70">
              <CardContent className="flex flex-col gap-3 py-6">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-primary uppercase">
                  <Sparkles className="size-3.5" aria-hidden="true" />
                  Alohida xizmat kerakmi?
                </span>
                <h3 className="text-[15px] leading-6 font-semibold text-foreground">
                  Xizmatlarni alohida bron qiling
                </h3>
                <p className="text-sm leading-6 text-muted-foreground">
                  Mehmonxona, restoran, gid, transfer, tarjimon, fotograf va boshqa turizm
                  xizmatlari — har birining reytingi va tajribasi bilan. Tur dasturidan tashqari
                  o'zingizga kerakli xizmatni shu yerdan olasiz.
                </p>
                <Button className="self-start" asChild>
                  <Link to="/xizmatlar">
                    Xizmatlarni ko'rish
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border/70">
              <CardContent className="flex flex-col gap-2 py-6">
                <h3 className="text-sm font-semibold text-foreground">
                  Xizmat ko'rsatuvchimisiz?
                </h3>
                <p className="text-sm leading-6 text-muted-foreground">
                  Gid, transfer, restoran, tarjimon, fotograf, hunarmand, mehmonxona yoki boshqa
                  turizm xizmati egasi bo'lsangiz — {PARTNER_BOT_USERNAME} orqali ro'yxatdan o'tib,
                  o'z
                  boshqaruv panelingizni oling.
                </p>
                <Button variant="outline" className="mt-1 self-start" asChild>
                  <a href={partnerBotLink()} target="_blank" rel="noreferrer">
                    Hamkor bo'lish
                  </a>
                </Button>
              </CardContent>
            </Card>
          </aside>
        </div>

        <ForYouRow />
      </Container>

      <EventsSection />
      <AiSection />
    </>
  );
}
