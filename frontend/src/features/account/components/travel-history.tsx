import { useMemo, useState } from "react";
import {
  CalendarDays,
  ClipboardList,
  Globe2,
  Loader2,
  MapPin,
  NotebookPen,
  Stamp,
  Star,
  Trash2,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { useRestMutation, useRestQuery } from "@/shared/api/client";
import { Button } from "@/shared/components/ui/button";
import { Calendar } from "@/shared/components/ui/calendar";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  PanelCard,
  PanelEmpty,
  PanelTable,
  StatCard,
  StatusBadge,
} from "@/shared/components/workspace";
import { PriceInline } from "@/shared/lib/currency";
import { cn } from "@/shared/lib/utils";

export type Booking = {
  _id: string;
  reference: string;
  title: string;
  city: string;
  kind: string;
  startDate: string;
  days: number;
  guests: number;
  totalPrice: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  discountPercent?: number;
};

/** Kabinetdagi «Tarix» bo'limi uchun bron statistikasi (`bookings.mine` dan). */
export type BookingStats = { total?: number; spent?: number } | null;

/** Bitta bron uchun bitta taassurot — `impressions.save` shu shaklni saqlaydi. */
type Impression = {
  _id: string;
  bookingId: string;
  reference?: string | null;
  title?: string | null;
  city?: string | null;
  startDate?: string | null;
  mood: string;
  rating: number;
  text: string;
  stampedAt: number;
};

/** Kayfiyat ro'yxati — backenddagi `IMPRESSION_MOODS` bilan bir xil bo'lishi shart. */
const MOODS = [
  { id: "great", emoji: "🤩", label: "Ajoyib" },
  { id: "happy", emoji: "😊", label: "Yaxshi" },
  { id: "calm", emoji: "😌", label: "Xotirjam" },
  { id: "adventurous", emoji: "🧭", label: "Sarguzasht" },
  { id: "tired", emoji: "🥵", label: "Charchadim" },
] as const;

const MONTH_LABELS = [
  "Yan",
  "Fev",
  "Mar",
  "Apr",
  "May",
  "Iyn",
  "Iyl",
  "Avg",
  "Sen",
  "Okt",
  "Noy",
  "Dek",
];

const MONTH_FULL = [
  "Yanvar",
  "Fevral",
  "Mart",
  "Aprel",
  "May",
  "Iyun",
  "Iyul",
  "Avgust",
  "Sentabr",
  "Oktabr",
  "Noyabr",
  "Dekabr",
];

function moodOf(id: string) {
  return MOODS.find((mood) => mood.id === id) ?? MOODS[1];
}

/** `YYYY-MM-DD` ni mahalliy vaqtda Date'ga aylantiradi (vaqt mintaqasi siljishisiz). */
function parseISODate(value?: string | null): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, offset: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + offset);
}

function formatDay(date: Date) {
  return date.toLocaleDateString("uz-UZ", { day: "2-digit", month: "short", year: "numeric" });
}

/** Sayohat kunlarini bronlardan yoyadi: har bir bron o'z davrini (kunlar) belgilaydi. */
type TravelDay = {
  date: Date;
  past: boolean;
  upcoming: boolean;
  cities: string[];
  titles: string[];
};

/**
 * Kabinetning «Tarix» bo'limi.
 *
 * Uch qismdan iborat:
 *   1. Sayohat kalendari — bronlardan hisoblangan aktiv kunlar (o'tgan/yetib
 *      kelayotgan) va oy/yil bo'yicha faollik;
 *   2. Sayohat pasporti — qaysi shaharlarga necha marta borgansiz;
 *   3. Taassurotlar — har bir tugagan safar uchun «muhur» (kayfiyat + baho +
 *      matn) yozib qo'yiladi, yil davomida to'planib boradi.
 */
export function TravelHistory({
  bookings,
  stats,
  ratings,
}: {
  bookings: Booking[];
  stats: BookingStats;
  ratings: { rating: number }[];
}) {
  const [month, setMonth] = useState(() => startOfDay(new Date()));
  const [nonce, setNonce] = useState(0);
  const impressions = useRestQuery<Impression[]>("impressions", "mine", { _t: nonce });
  const saveImpression = useRestMutation("impressions", "save");
  const removeImpression = useRestMutation("impressions", "remove");
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ mood: string; rating: number; text: string }>({
    mood: "happy",
    rating: 5,
    text: "",
  });
  const [saving, setSaving] = useState(false);

  /** Bekor qilingan bronlar tarixga kirmaydi. */
  const activeBookings = useMemo(
    () => bookings.filter((booking) => booking.status !== "cancelled" && parseISODate(booking.startDate)),
    [bookings],
  );

  const travelDays = useMemo<TravelDay[]>(() => {
    const today = startOfDay(new Date());
    const map = new Map<string, TravelDay>();
    for (const booking of activeBookings) {
      const start = parseISODate(booking.startDate);
      if (!start) continue;
      // Juda uzun davrlar kalendarni to'ldirib yubormasligi uchun chegara.
      const span = Math.min(60, Math.max(1, Math.round(Number(booking.days) || 1)));
      for (let offset = 0; offset < span; offset += 1) {
        const date = addDays(start, offset);
        const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        const entry =
          map.get(key) ??
          ({ date, past: false, upcoming: false, cities: [], titles: [] } satisfies TravelDay);
        if (date.getTime() < today.getTime()) entry.past = true;
        else entry.upcoming = true;
        for (const part of String(booking.city || "").split("·")) {
          const city = part.trim();
          if (city && !entry.cities.includes(city)) entry.cities.push(city);
        }
        if (booking.title && !entry.titles.includes(booking.title)) entry.titles.push(booking.title);
        map.set(key, entry);
      }
    }
    return Array.from(map.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [activeBookings]);

  const pastDays = useMemo(() => travelDays.filter((day) => day.past).map((day) => day.date), [travelDays]);
  const upcomingDays = useMemo(
    () => travelDays.filter((day) => day.upcoming).map((day) => day.date),
    [travelDays],
  );

  const year = month.getFullYear();

  /** Yil bo'yicha oylik faollik: nechta safar boshlangan va nechta kun yo'lda. */
  const yearMonths = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, index) => ({ index, trips: 0, days: 0 }));
    for (const booking of activeBookings) {
      const start = parseISODate(booking.startDate);
      if (start && start.getFullYear() === year) months[start.getMonth()].trips += 1;
    }
    for (const day of travelDays) {
      if (day.date.getFullYear() === year) months[day.date.getMonth()].days += 1;
    }
    return months;
  }, [activeBookings, travelDays, year]);

  const yearTotals = useMemo(
    () => ({
      trips: yearMonths.reduce((sum, item) => sum + item.trips, 0),
      days: yearMonths.reduce((sum, item) => sum + item.days, 0),
      activeMonths: yearMonths.filter((item) => item.trips > 0).length,
    }),
    [yearMonths],
  );

  /** Sayohat pasporti: shahar bo'yicha tashriflar va oxirgi sana. */
  const travelPlaces = useMemo(() => {
    const map = new Map<string, { visits: number; lastDate: string }>();
    for (const booking of activeBookings) {
      for (const part of String(booking.city || "").split("·")) {
        const city = part.trim() || "—";
        const current = map.get(city);
        if (!current) {
          map.set(city, { visits: 1, lastDate: booking.startDate });
        } else {
          current.visits += 1;
          if (booking.startDate > current.lastDate) current.lastDate = booking.startDate;
        }
      }
    }
    return Array.from(map.entries())
      .map(([city, value]) => ({ city, ...value }))
      .sort((a, b) => b.visits - a.visits);
  }, [activeBookings]);

  const impressionByBooking = useMemo(() => {
    const map = new Map<string, Impression>();
    for (const row of impressions ?? []) map.set(row.bookingId, row);
    return map;
  }, [impressions]);

  /** Taassurot yozish mumkin bo'lgan safarlar — boshlanib bo'lganlar, eng yangisi birinchi. */
  const pastTrips = useMemo(() => {
    // `startOfDay(new Date())` — impure chaqiruvni render ichida ochiq yozmaslik
    // uchun `travelDays` bilan bir xil yo'l ishlatiladi.
    const now = startOfDay(new Date()).getTime();
    return activeBookings
      .filter((booking) => (parseISODate(booking.startDate)?.getTime() ?? Number.POSITIVE_INFINITY) <= now)
      .sort((a, b) => b.startDate.localeCompare(a.startDate));
  }, [activeBookings]);

  const averageRating =
    ratings.length === 0 ? 0 : ratings.reduce((sum, row) => sum + row.rating, 0) / ratings.length;

  const openEditor = (booking: Booking) => {
    const existing = impressionByBooking.get(booking._id);
    setDraft({
      mood: existing?.mood ?? "happy",
      rating: existing?.rating ?? 5,
      text: existing?.text ?? "",
    });
    setEditing(booking._id);
  };

  const submitImpression = async (bookingId: string) => {
    if (!draft.text.trim()) {
      toast.error("Taassurot matnini kiriting");
      return;
    }
    setSaving(true);
    try {
      await saveImpression({
        bookingId,
        mood: draft.mood,
        rating: draft.rating,
        text: draft.text,
      });
      toast.success("Taassurot muhurlandi");
      setEditing(null);
      setNonce((value) => value + 1);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Saqlanmadi");
    } finally {
      setSaving(false);
    }
  };

  const deleteImpression = async (impressionId: string) => {
    try {
      await removeImpression({ impressionId });
      toast.success("Taassurot o'chirildi");
      setNonce((value) => value + 1);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "O'chirilmadi");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={ClipboardList} label="Sayohatlar" value={stats?.total ?? 0} hint="Jami buyurtmalar" />
        <StatCard
          icon={Globe2}
          label="Ko'rilgan joylar"
          value={travelPlaces.length}
          hint="Shahar va yo'nalishlar"
          tone="gold"
        />
        <StatCard
          icon={Wallet}
          label="Sarflangan"
          value={<PriceInline usd={stats?.spent ?? 0} />}
          hint="To'langan buyurtmalar"
          tone="eco"
        />
        <StatCard
          icon={Star}
          label="Sizning bahoyingiz"
          value={averageRating ? averageRating.toFixed(1) : "—"}
          hint={`${ratings.length} ta sharh qoldirdingiz`}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <PanelCard
          title="Sayohat kalendari"
          description="Sayohat qilgan kunlaringiz — o'tgan safarlar yashil, kelgusi safarlar oltin rangda"
        >
          <div className="flex flex-wrap items-center gap-3 text-[12px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-primary/70" aria-hidden="true" />
              O'tgan safar · {pastDays.length} kun
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-gold/80" aria-hidden="true" />
              Kelgusi safar · {upcomingDays.length} kun
            </span>
          </div>

          <div className="mt-3 flex justify-center">
            <Calendar
              month={month}
              onMonthChange={setMonth}
              modifiers={{ traveled: pastDays, planned: upcomingDays }}
              modifiersClassNames={{
                traveled:
                  "[&>button]:bg-primary/15 [&>button]:font-semibold [&>button]:text-primary [&>button]:ring-1 [&>button]:ring-primary/35",
                planned:
                  "[&>button]:bg-gold/20 [&>button]:font-semibold [&>button]:text-gold-ink [&>button]:ring-1 [&>button]:ring-gold/45",
              }}
            />
          </div>

          <div className="mt-4 border-t pt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[13px] font-semibold text-foreground">{year}-yil faolligi</p>
              <p className="text-[12px] text-muted-foreground">
                {yearTotals.trips} safar · {yearTotals.days} kun · {yearTotals.activeMonths} oy
              </p>
            </div>
            <div className="mt-3 grid grid-cols-6 gap-1.5 sm:grid-cols-12">
              {yearMonths.map((item) => {
                const isCurrent = month.getMonth() === item.index;
                return (
                  <button
                    key={item.index}
                    type="button"
                    onClick={() => setMonth(new Date(year, item.index, 1))}
                    title={`${MONTH_FULL[item.index]}: ${item.trips} safar, ${item.days} kun`}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-lg border px-1 py-2 text-[11px] font-semibold transition-colors",
                      item.trips > 0
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : "border-border bg-muted/40 text-muted-foreground",
                      isCurrent && "ring-2 ring-primary/60",
                    )}
                  >
                    <span>{MONTH_LABELS[item.index]}</span>
                    <span className="text-[10px] font-normal tabular-nums opacity-80">
                      {item.days || "—"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </PanelCard>

        <PanelCard
          title="Sayohat pasporti"
          description="Safar qilgan shaharlaringiz — MillyTour hisobingizdagi tarix"
        >
          {travelPlaces.length === 0 ? (
            <PanelEmpty icon={MapPin} title="Hali sayohat yo'q" />
          ) : (
            <ul className="flex flex-wrap gap-2">
              {travelPlaces.map((place) => (
                <li
                  key={place.city}
                  className="rounded-xl border bg-background px-3 py-2 text-[13px] font-semibold text-foreground"
                >
                  {place.city}
                  <span className="ml-2 text-[11px] font-normal text-muted-foreground">
                    {place.visits} marta · oxirgi: {place.lastDate}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </PanelCard>
      </div>

      <PanelCard
        title="Sayohat taassurotlari"
        description="Har bir safar uchun kichik taassurot muhurlang — yil davomida to'planib boradi"
      >
        {pastTrips.length === 0 ? (
          <PanelEmpty
            icon={NotebookPen}
            title="Hali muhurlanadigan safar yo'q"
            description="Safar tugagach, shu yerda kayfiyat, baho va qisqa xotira yozib qo'yishingiz mumkin."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {pastTrips.map((booking) => {
              const impression = impressionByBooking.get(booking._id);
              const isEditing = editing === booking._id;
              const start = parseISODate(booking.startDate);
              return (
                <div key={booking._id} className="rounded-2xl border bg-background p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-foreground">{booking.title}</p>
                      <p className="mt-0.5 text-[12px] text-muted-foreground">
                        {[booking.city, start ? formatDay(start) : null].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    {impression && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                        <span aria-hidden="true">{moodOf(impression.mood).emoji}</span>
                        {moodOf(impression.mood).label}
                      </span>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="mt-4 flex flex-col gap-3">
                      <div className="flex flex-wrap gap-1.5">
                        {MOODS.map((mood) => (
                          <button
                            key={mood.id}
                            type="button"
                            onClick={() => setDraft({ ...draft, mood: mood.id })}
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors",
                              draft.mood === mood.id
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border text-muted-foreground hover:border-primary/40",
                            )}
                          >
                            <span aria-hidden="true">{mood.emoji}</span>
                            {mood.label}
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((value) => (
                          <button
                            key={value}
                            type="button"
                            aria-label={`${value} yulduz`}
                            onClick={() => setDraft({ ...draft, rating: value })}
                          >
                            <Star
                              className={cn(
                                "size-5",
                                value <= draft.rating ? "fill-gold text-gold" : "text-muted-foreground",
                              )}
                            />
                          </button>
                        ))}
                      </div>

                      <Textarea
                        value={draft.text}
                        onChange={(event) => setDraft({ ...draft, text: event.target.value })}
                        rows={3}
                        maxLength={1200}
                        placeholder="Eng esda qolgan narsa? Gid, taom, manzara…"
                      />

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          disabled={saving}
                          onClick={() => submitImpression(booking._id)}
                        >
                          {saving ? (
                            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                          ) : (
                            "Muhurlash"
                          )}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                          Bekor qilish
                        </Button>
                      </div>
                    </div>
                  ) : impression ? (
                    <div className="mt-4 rounded-xl border border-dashed border-primary/40 bg-primary/5 p-3">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((value) => (
                          <Star
                            key={value}
                            className={cn(
                              "size-3.5",
                              value <= impression.rating ? "fill-gold text-gold" : "text-muted-foreground/50",
                            )}
                            aria-hidden="true"
                          />
                        ))}
                        <span className="ml-2 text-[11px] text-muted-foreground">
                          {new Date(impression.stampedAt).toLocaleDateString("uz-UZ")}
                        </span>
                      </div>
                      <p className="mt-2 text-[12px] leading-5 text-foreground">{impression.text}</p>
                      <div className="mt-2 flex items-center gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEditor(booking)}>
                          <Stamp className="size-3.5" aria-hidden="true" />
                          Tahrirlash
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => deleteImpression(impression._id)}
                        >
                          <Trash2 className="size-3.5" aria-hidden="true" />
                          O'chirish
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-4"
                      onClick={() => openEditor(booking)}
                    >
                      <Stamp className="size-4" aria-hidden="true" />
                      Taassurot muhurlash
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </PanelCard>

      <PanelCard
        title="Buyurtmalar tarixi"
        description="Barcha so'rov va bronlar — kalendardagi kunlar shu ro'yxatdan hisoblanadi"
      >
        {bookings.length === 0 ? (
          <PanelEmpty icon={CalendarDays} title="Buyurtma yo'q" />
        ) : (
          <PanelTable head={["Buyurtma", "Shahar", "Sana", "Kun", "Summa", "Holat", "To'lov"]}>
            {bookings.map((booking) => (
              <tr key={booking._id}>
                <td className="py-3">
                  <p className="text-[13px] font-semibold text-foreground">{booking.title}</p>
                  <p className="text-[11px] text-muted-foreground">{booking.reference}</p>
                </td>
                <td className="py-3 text-[12px] text-muted-foreground">{booking.city}</td>
                <td className="py-3 text-[12px] text-muted-foreground">{booking.startDate}</td>
                <td className="py-3 text-[12px] text-muted-foreground tabular-nums">
                  {booking.days} kun
                </td>
                <td className="py-3 text-[13px] font-semibold text-foreground">
                  <PriceInline usd={booking.totalPrice} />
                  {booking.discountPercent ? (
                    <span className="ml-1.5 text-[11px] font-normal text-emerald-600 dark:text-emerald-400">
                      −{booking.discountPercent}%
                    </span>
                  ) : null}
                </td>
                <td className="py-3">
                  <StatusBadge status={booking.status} />
                </td>
                <td className="py-3">
                  <StatusBadge status={booking.paymentStatus === "paid" ? "active" : "pending"} />
                </td>
              </tr>
            ))}
          </PanelTable>
        )}
      </PanelCard>
    </div>
  );
}
