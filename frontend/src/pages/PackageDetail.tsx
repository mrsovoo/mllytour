import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router";
import { motion } from "framer-motion";
import { useRestMutation } from "@/api/client";
import { toast } from "sonner";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  Check,
  Clock,
  CreditCard,
  Globe,
  Loader2,
  MapPin,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { Price, PriceInline } from "@/lib/currency";
import { openMillyAi } from "@/components/AiAssistant";
import { AuthGateDialog } from "@/components/AuthGateDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Container } from "@/components/site";
import { Rating } from "@/components/brand";
import { TourCard } from "@/components/tour";
import { CITY_SPOTS, TOUR_PACKAGES, findTour, type TourPackage } from "@/data/catalog";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const ADDONS = [
  { id: "guide", label: "Shaxsiy gid", price: 45, note: "kunlik" },
  { id: "transfer", label: "Aeroport transferi", price: 35, note: "bir tomonlama" },
  { id: "hotel", label: "Mexmonxona yangilash (4*)", price: 60, note: "kecha uchun" },
] as const;

const PAYMENTS = [
  { id: "click", label: "Click" },
  { id: "payme", label: "Payme" },
  { id: "visa", label: "Visa" },
  { id: "mastercard", label: "Mastercard" },
] as const;

function itineraryFor(tour: TourPackage) {
  const cityKey = tour.city.split("·")[0].trim();
  const spotPool = CITY_SPOTS[cityKey] ?? [];
  return Array.from({ length: tour.days }, (_, index) => {
    const fromSpots = spotPool.slice((index * 3) % Math.max(spotPool.length, 1), (index * 3) % Math.max(spotPool.length, 1) + 3);
    const items = (fromSpots.length > 0 ? fromSpots : []).map((spot) => ({
      time: spot.hours.split("·")[0]?.trim() ?? "10:00",
      title: spot.name,
      note: spot.note,
    }));
    const fallback = tour.highlights.slice(index, index + 2).map((h, i) => ({
      time: i === 0 ? "10:00" : "15:00",
      title: h,
      note: "Gid bilan birga tashrif",
    }));
    return {
      day: index + 1,
      city: cityKey,
      title: index === 0 ? "Tanishuv kuni" : `${cityKey} — ${tour.highlights[index % tour.highlights.length] ?? "erkin vaqt"}`,
      items: items.length > 0 ? items : fallback,
    };
  });
}

export default function PackageDetail() {
  const { slug } = useParams();
  const tour = slug ? findTour(slug) : undefined;
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const createBooking = useRestMutation("bookings", "create");

  const [startDate, setStartDate] = useState("2026-10-03");
  const [guests, setGuests] = useState(2);
  const [addons, setAddons] = useState<string[]>([]);
  const [payment, setPayment] = useState<(typeof PAYMENTS)[number]["id"]>("payme");
  const [submitting, setSubmitting] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);

  const itinerary = useMemo(() => (tour ? itineraryFor(tour) : []), [tour]);
  const similar = useMemo(
    () =>
      tour
        ? TOUR_PACKAGES.filter((t) => t.slug !== tour.slug && t.category === tour.category)
            .concat(TOUR_PACKAGES.filter((t) => t.slug !== tour.slug && t.category !== tour.category))
            .slice(0, 3)
        : [],
    [tour],
  );

  if (!tour) {
    return <Navigate to="/paketlar" replace />;
  }

  const addonTotal = addons.reduce((sum, id) => {
    const addon = ADDONS.find((a) => a.id === id);
    if (!addon) {
      return sum;
    }
    if (addon.id === "guide") {
      return sum + addon.price * tour.days;
    }
    if (addon.id === "hotel") {
      return sum + addon.price * Math.max(1, tour.nights);
    }
    return sum + addon.price;
  }, 0);
  const total = tour.priceFrom * guests + addonTotal;

  const submit = async () => {
    // Ro'yxatdan o'tmagan foydalanuvchi uchun ekran qorayib kirish kartochkasi
    // chiqadi (jalb qiluvchi modal), sahifa almashmaydi.
    if (!isAuthenticated) {
      setGateOpen(true);
      return;
    }
    setSubmitting(true);
    try {
      const result = await createBooking({
        kind: "package",
        title: tour.title,
        city: tour.city,
        startDate,
        days: tour.days,
        guests,
        totalPrice: total,
        paymentMethod: payment,
        packageSlug: tour.slug,
        customerName: user?.name ?? undefined,
        note: addons.length > 0 ? `Qo'shimcha: ${addons.join(", ")}` : undefined,
      });
      toast.success(`Buyurtma qabul qilindi · ${result.reference}`);
      navigate("/dashboard");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Buyurtmani yaratishda xatolik yuz berdi.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Container className="py-6">
        <Link
          to="/paketlar"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Barcha tur paketlar
        </Link>
      </Container>

      <Container className="grid gap-8 pb-16 lg:grid-cols-[1.6fr_1fr] lg:gap-10">
        <div>
          <div className="relative overflow-hidden rounded-2xl border">
            <img
              src={tour.image}
              alt={tour.alt}
              className="aspect-[16/9] w-full object-cover"
              loading="eager"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5 text-white">
              <div className="flex flex-wrap items-center gap-2">
                {tour.badge && (
                  <Badge className="border-0 bg-gold text-gold-foreground">{tour.badge}</Badge>
                )}
                <span className="rounded-full border border-white/25 bg-white/10 px-2.5 py-1 text-[11px] font-semibold">
                  {tour.region}
                </span>
              </div>
              <h1 className="mt-3 text-[24px] leading-8 font-bold tracking-tight sm:text-[30px] sm:leading-9">
                {tour.title}
              </h1>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-4" aria-hidden="true" />
              {tour.city}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-4" aria-hidden="true" />
              {tour.days} kun / {tour.nights} kecha
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users className="size-4" aria-hidden="true" />
              {tour.groupSize}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Globe className="size-4" aria-hidden="true" />
              {tour.languages.join(" · ")}
            </span>
            <Rating value={tour.rating} reviews={tour.reviews} />
          </div>

          <p className="mt-5 text-[15px] leading-6 text-foreground">{tour.summary}</p>

          <section className="mt-8">
            <h2 className="text-lg font-semibold text-foreground">Kunma-kun dastur</h2>
            <div className="mt-4 flex flex-col gap-3">
              {itinerary.map((day, i) => (
                <motion.div
                  key={day.day}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  className="rounded-2xl border bg-card p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-foreground">
                      {day.day}-kun · {day.title}
                    </p>
                    <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                      {day.city}
                    </span>
                  </div>
                  <ul className="mt-3 flex flex-col gap-2">
                    {day.items.map((item) => (
                      <li key={`${day.day}-${item.time}-${item.title}`} className="flex gap-3">
                        <span className="w-12 shrink-0 text-[12px] font-semibold text-primary">
                          {item.time}
                        </span>
                        <span className="text-[13px] leading-5 text-foreground">
                          {item.title}
                          <span className="block text-[12px] text-muted-foreground">
                            {item.note}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </section>

          <section className="mt-8 grid gap-4 sm:grid-cols-2">
            <Card className="border-border/70">
              <CardContent className="py-5">
                <h3 className="text-sm font-semibold text-foreground">Paketga kiradi</h3>
                <ul className="mt-3 flex flex-col gap-2">
                  {tour.includes.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-[13px] text-foreground">
                      <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-eco/15">
                        <Check className="size-2.5 text-eco" aria-hidden="true" />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card className="border-border/70">
              <CardContent className="py-5">
                <h3 className="text-sm font-semibold text-foreground">Asosiy nuqtalar</h3>
                <ul className="mt-3 flex flex-col gap-2">
                  {tour.highlights.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-[13px] text-foreground">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-gold" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </section>

          <section className="mt-8 rounded-2xl border bg-muted/40 p-5">
            <div className="flex flex-wrap items-center gap-3">
              <ShieldCheck className="size-5 text-primary" aria-hidden="true" />
              <p className="text-sm font-semibold text-foreground">
                Bepul bekor qilish — sayohatdan 24 soat oldin
              </p>
            </div>
            <p className="mt-2 text-[13px] leading-5 text-muted-foreground">
              To'lov Click yoki Payme orqali amalga oshiriladi, karta ma'lumotlari 3D Secure bilan
              himoyalangan. Turlar hamkorlar tomonidan bajariladi va Millytour tomonidan
              nazorat qilinadi.
            </p>
          </section>
        </div>

        {/* -------------------------------- booking -------------------------------- */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Card className="relative overflow-hidden border-primary/15 shadow-lifted">
            <CardContent className="relative py-6">
              <div className="flex items-baseline justify-between">
                <div>
                  <Price usd={tour.priceFrom} className="text-2xl" />
                  <span className="ml-1 text-sm text-muted-foreground">/ kishi</span>
                  {tour.oldPrice && (
                    <span className="ml-2 text-sm text-muted-foreground line-through">
                      {tour.oldPrice} USD
                    </span>
                  )}
                </div>
                <Badge className="border-0 bg-primary/10 text-primary">
                  {tour.nextDeparture}
                </Badge>
              </div>

              <div className="mt-5 flex flex-col gap-3">
                <label className="block">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    <CalendarDays className="size-3.5" aria-hidden="true" />
                    Boshlanish sanasi
                  </span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1.5 h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus-visible:border-primary/50 focus-visible:ring-[3px] focus-visible:ring-ring/30"
                  />
                </label>

                <label className="block">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    <Users className="size-3.5" aria-hidden="true" />
                    Necha kishi
                  </span>
                  <select
                    value={guests}
                    onChange={(e) => setGuests(Number(e.target.value))}
                    className="mt-1.5 h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus-visible:border-primary/50"
                  >
                    {[1, 2, 3, 4, 5, 6, 8].map((n) => (
                      <option key={n} value={n}>
                        {n} kishi
                      </option>
                    ))}
                  </select>
                </label>

                <fieldset className="rounded-xl border p-3">
                  <legend className="px-1 text-xs font-semibold text-muted-foreground">
                    Qo'shimcha xizmatlar
                  </legend>
                  <div className="flex flex-col gap-2">
                    {ADDONS.map((addon) => {
                      const checked = addons.includes(addon.id);
                      return (
                        <label
                          key={addon.id}
                          className="flex cursor-pointer items-center justify-between gap-3 text-[13px]"
                        >
                          <span className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() =>
                                setAddons((prev) =>
                                  prev.includes(addon.id)
                                    ? prev.filter((id) => id !== addon.id)
                                    : [...prev, addon.id],
                                )
                              }
                              className="size-4 rounded border-border accent-primary"
                            />
                            {addon.label}
                          </span>
                          <span className="font-semibold text-foreground">
                            +{addon.price} USD
                            <span className="ml-1 text-[11px] font-normal text-muted-foreground">
                              /{addon.note}
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>

                <fieldset className="rounded-xl border p-3">
                  <legend className="px-1 text-xs font-semibold text-muted-foreground">
                    To'lov usuli
                  </legend>
                  <div className="grid grid-cols-2 gap-2">
                    {PAYMENTS.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setPayment(option.id)}
                        className={cn(
                          "flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-[13px] font-semibold transition-colors",
                          payment === option.id
                            ? "border-primary bg-primary/5 text-primary"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        <CreditCard className="size-3.5" aria-hidden="true" />
                        {option.label}
                      </button>
                    ))}
                  </div>
                </fieldset>
              </div>

              <dl className="mt-5 flex flex-col gap-2 border-t pt-4 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">
                    {tour.priceFrom} × {guests} kishi
                  </dt>
                  <dd className="font-semibold text-foreground">
                    <PriceInline usd={tour.priceFrom * guests} />
                  </dd>
                </div>
                {addonTotal > 0 && (
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Qo'shimcha xizmatlar</dt>
                    <dd className="font-semibold text-foreground">
                      <PriceInline usd={addonTotal} />
                    </dd>
                  </div>
                )}
                <div className="flex items-center justify-between border-t pt-2">
                  <dt className="font-semibold text-foreground">Jami</dt>
                  <dd className="text-lg font-bold text-foreground">
                    <PriceInline usd={total} />
                  </dd>
                </div>
              </dl>

              <Button size="lg" className="mt-5 w-full" onClick={submit} disabled={submitting}>
                {submitting ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <>
                    <BadgeCheck className="size-4" aria-hidden="true" />
                    Band qilish
                  </>
                )}
              </Button>
              <Button variant="outline" size="lg" className="mt-2 w-full" onClick={openMillyAi}>
                <Sparkles className="size-4" aria-hidden="true" />
                AI bilan moslashtirish
              </Button>
              <p className="mt-3 text-center text-[11px] leading-4 text-muted-foreground">
                {isAuthenticated
                  ? "Buyurtma kabinetingizda kuzatiladi"
                  : "Band qilish uchun hisobingizga kiring — 30 soniya kifoya"}
              </p>
            </CardContent>
          </Card>
        </aside>
      </Container>

      <Container className="pb-20">
        <h2 className="text-lg font-semibold text-foreground">O'xshash tur paketlar</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {similar.map((item) => (
            <TourCard key={item.id} tour={item} />
          ))}
        </div>
      </Container>

      <AuthGateDialog
        open={gateOpen}
        onOpenChange={setGateOpen}
        returnTo={`/paketlar/${tour.slug}`}
        title={`${tour.title} uchun bron qilish`}
        description="Buyurtmani tasdiqlash, vaucher va to'lovlar tarixini saqlash uchun hisobingiz kerak."
      />
    </>
  );
}
