import { Fragment, useMemo, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router";
import { useRestMutation, useRestQuery } from "@/api/client";
import { toast } from "sonner";
import {
  BadgeCheck,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  Compass,
  CreditCard,
  Globe2,
  LayoutDashboard,
  LifeBuoy,
  MapPin,
  Send,
  Sparkles,
  Star,
  Ticket,
  UserRound,
  Wallet,
} from "lucide-react";
import { openMillyAi } from "@/components/AiAssistant";
import { Button } from "@/components/ui/button";
import { PanelCard, PanelEmpty, PanelShell, PanelTable, StatCard, StatusBadge } from "@/components/workspace";
import { PriceInline } from "@/lib/currency";
import { TourCard } from "@/components/tour";
import { useAuth } from "@/hooks/use-auth";
import { TOUR_PACKAGES, TOUR_CATEGORIES, type TourPackage } from "@/data/catalog";
import type { Plan as AiPlan } from "@/lib/planner";
import { cn } from "@/lib/utils";

type AssignmentRow = {
  _id: string;
  role: string;
  task: string;
  city: string;
  scheduledFor: string;
  amount: number;
  status: string;
  provider: {
    businessName: string;
    contactName: string | null;
    phone: string;
    rating: number;
    ratingCount: number;
    completedOrders: number;
    experienceYears: number;
    languages: string[];
    telegramUsername: string | null;
  } | null;
};

/**
 * Bron ostidagi "Mutaxassislar" paneli: Milly AI biriktirgan gid, transfer,
 * mehmonxona, tarjimon va fotograf ma'lumotlari (ism, tajriba, reyting, vazifa).
 */
function BookingSpecialists({ bookingId }: { bookingId: string }) {
  const rows = useRestQuery<AssignmentRow[]>("assignments", "forBooking", { bookingId });

  if (rows === undefined) {
    return <p className="px-1 text-[12px] text-muted-foreground">Yuklanmoqda…</p>;
  }

  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-dashed p-3 text-[12px] leading-5 text-muted-foreground">
        Bu bron uchun mutaxassis hali biriktirilmagan. AI Planner dasturini tasdiqlasangiz,
        mehmonxona, gid, transfer, tarjimon va fotograf avtomatik biriktiriladi.
      </p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {rows.map((row) => (
        <div key={row._id} className="rounded-xl border bg-background p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[13px] font-semibold text-foreground">
              {row.role} · {row.provider?.businessName ?? "—"}
            </p>
            <StatusBadge status={row.status} />
          </div>
          <p className="mt-1 text-[11px] leading-4 text-muted-foreground">
            {row.scheduledFor} · {row.city} · To'lov: ${row.amount}
          </p>
          <p className="mt-1 text-[11px] leading-4 text-foreground">{row.task}</p>
          {row.provider && (
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Star className="size-3 text-gold" aria-hidden="true" />
                {row.provider.rating.toFixed(1)} ({row.provider.ratingCount})
              </span>
              <span>{row.provider.experienceYears} yil tajriba</span>
              <span>{row.provider.completedOrders} buyurtma</span>
              <span>{row.provider.phone}</span>
              {row.provider.telegramUsername && <span>@{row.provider.telegramUsername}</span>}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

const TABS = [
  { id: "overview", label: "Umumiy ko'rinish", icon: LayoutDashboard },
  { id: "orders", label: "Buyurtmalarim", icon: ClipboardList },
  { id: "history", label: "Tarix va pasport", icon: Globe2 },
  { id: "plans", label: "AI dasturlar", icon: Sparkles },
  { id: "recommendations", label: "Tavsiyalar", icon: Compass },
  { id: "profile", label: "Profil", icon: UserRound },
] as const;

type TabId = (typeof TABS)[number]["id"];

type Booking = {
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

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const [params] = useSearchParams();
  const tab = (params.get("tab") ?? "overview") as TabId;
  const [openBooking, setOpenBooking] = useState<string | null>(null);
  const data = useRestQuery("bookings", "mine");
  const plans = useRestQuery("plans", "mine");
  const myReviews = (useRestQuery<{ rating: number }[]>("reviews", "mine") ?? []) as { rating: number }[];
  const setStatus = useRestMutation("bookings", "setStatus");
  const createLink = useRestMutation("telegram", "linkCode");
  const [linking, setLinking] = useState(false);

  const bookings = (data?.bookings ?? []) as unknown as Booking[];
  const stats = data?.stats ?? null;

  const recommendations = useMemo(() => {
    const visited = new Set(
      bookings.map((b) => b.city.split("·")[0].trim().toLowerCase()),
    );
    return TOUR_PACKAGES.map((tour: TourPackage) => {
      const cityKey = tour.city.split("·")[0].trim().toLowerCase();
      const visitedMatch = visited.has(cityKey);
      const score =
        tour.rating * 2 + Math.min(tour.reviews / 100, 3) + (visitedMatch ? 3 : 0);
      const reason = visitedMatch
        ? `${tour.city} yo'nalishida bo'lgansiz — mavsumiy chegirma mavjud`
        : bookings.length === 0
          ? "Yangi sayohatchilar uchun eng yuqori bahoga ega"
          : `${TOUR_CATEGORIES.find((c) => c.id === tour.category)?.label ?? "Tur"} turkumida eng ko'p tanlangan`;
      return { tour, score, reason };
    })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [bookings]);

  /** Sayohat pasporti: shahar bo'yicha tashriflar va oxirgi sana. */
  const travelPlaces = useMemo(() => {
    const map = new Map<string, { visits: number; lastDate: string }>();
    for (const b of bookings) {
      const city = b.city.split("·")[0].trim() || "—";
      const current = map.get(city);
      if (!current) {
        map.set(city, { visits: 1, lastDate: b.startDate });
      } else {
        current.visits += 1;
        if (b.startDate > current.lastDate) {
          current.lastDate = b.startDate;
        }
      }
    }
    return Array.from(map.entries())
      .map(([city, v]) => ({ city, ...v }))
      .sort((a, b) => b.visits - a.visits);
  }, [bookings]);

  const averageRating =
    myReviews.length === 0
      ? 0
      : myReviews.reduce((sum, r) => sum + r.rating, 0) / myReviews.length;

  if (isLoading) {
    return null;
  }

  if (user?.role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  const cancel = async (id: string) => {
    try {
      await setStatus({ bookingId: id as never, status: "cancelled" });
      toast.success("Buyurtma bekor qilindi — to'lov 3 ish kunida qaytariladi");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Amal bajarilmadi");
    }
  };

  const startTelegramLink = async () => {
    setLinking(true);
    try {
      const result = await createLink();
      toast.success("Telegram havolasi yaratildi — botda tasdiqlang");
      window.open(result.mainDeepLink, "_blank", "noreferrer");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Havola yaratilmadi");
    } finally {
      setLinking(false);
    }
  };

  return (
    <PanelShell
      variant="tourist"
      title={user?.name ? `Salom, ${user.name}` : "Sayohatchi kabineti"}
      subtitle="Buyurtmalaringiz, saqlangan AI dasturlari va sizga mos turlar — barchasi bitta joyda."
      nav={TABS.map((t) => ({
        icon: t.icon,
        label: t.label,
        to: `/dashboard?tab=${t.id}`,
        active: tab === t.id,
        badge:
          t.id === "orders"
            ? bookings.length || undefined
            : t.id === "plans"
              ? plans?.length || undefined
              : undefined,
      }))}
      actions={
        <>
          <Button variant="outline" asChild>
            <Link to="/paketlar">
              <MapPin className="size-4" aria-hidden="true" />
              Tur paketlar
            </Link>
          </Button>
          <Button asChild>
            <Link to="/xizmatlar">
              <Sparkles className="size-4" aria-hidden="true" />
              Xizmatlar
            </Link>
          </Button>
        </>
      }
    >
      {tab === "overview" && (
        <div className="flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={ClipboardList}
              label="Buyurtmalar"
              value={stats?.total ?? 0}
              hint={`${stats?.upcoming ?? 0} ta faol`}
            />
            <StatCard
              icon={Wallet}
              label="Sarflangan"
              value={`$${stats?.spent ?? 0}`}
              hint="To'langan buyurtmalar bo'yicha"
              tone="gold"
            />
            <StatCard
              icon={BadgeCheck}
              label="Bajarilgan safar"
              value={stats?.completed ?? 0}
              hint="Sharh qoldirish mumkin"
              tone="eco"
            />
            <StatCard
              icon={Ticket}
              label="Loyalty ballari"
              value={stats?.loyaltyPoints ?? 0}
              hint="Har $1 uchun 2 ball"
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
            <PanelCard
              title="Yaqin buyurtmalar"
              description="Eng so'nggi bronlar va ularning holati"
              action={
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/dashboard?tab=orders">Barchasi</Link>
                </Button>
              }
            >
              {bookings.length === 0 ? (
                <PanelEmpty
                  icon={CalendarDays}
                  title="Hali buyurtma yo'q"
                  description="AI Planner bilan dastur tuzing yoki tur paketni tanlab band qiling."
                  action={
                    <Button asChild>
                      <Link to="/paketlar">Tur paketlarni ko'rish</Link>
                    </Button>
                  }
                />
              ) : (
                <ul className="flex flex-col gap-3">
                  {bookings.slice(0, 4).map((booking) => (
                    <li
                      key={booking._id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-background px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold text-foreground">
                          {booking.title}
                        </p>
                        <p className="mt-0.5 text-[12px] text-muted-foreground">
                          {booking.reference} · {booking.startDate} · {booking.guests} kishi
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-foreground">
                          ${booking.totalPrice}
                        </span>
                        <StatusBadge status={booking.status} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </PanelCard>

            <PanelCard
              title="Siz uchun tavsiyalar"
              description="Oldingi sayohatlaringiz asosida"
              action={
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/dashboard?tab=recommendations">Ko'proq</Link>
                </Button>
              }
            >
              <ul className="flex flex-col gap-3">
                {recommendations.map((row) => (
                  <li key={row.tour.id} className="rounded-xl border bg-background p-3">
                    <p className="text-[13px] font-semibold text-foreground">{row.tour.title}</p>
                    <p className="mt-0.5 text-[12px] text-muted-foreground">{row.reason}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[13px] font-bold text-foreground">
                        ${row.tour.priceFrom} dan
                      </span>
                      <Button size="sm" variant="outline" asChild>
                        <Link to={`/paketlar/${row.tour.slug}`}>Batafsil</Link>
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </PanelCard>
          </div>
        </div>
      )}

      {tab === "orders" && (
        <PanelCard
          title="Mening buyurtmalarim"
          description="Tur paketlar, gid, transfer, mehmonxona va hunarmandchilik buyurtmalari"
        >
          {bookings.length === 0 ? (
            <PanelEmpty
              icon={ClipboardList}
              title="Buyurtmalar ro'yxati bo'sh"
              description="Tur paketni band qilganingizdan so'ng bu yerda vaucher, to'lov holati va holat o'zgarishlari ko'rinadi."
              action={
                <Button asChild>
                  <Link to="/paketlar">Tur paketlarni ko'rish</Link>
                </Button>
              }
            />
          ) : (
            <PanelTable
              head={["Kod", "Buyurtma", "Sana", "Kishi", "Summa", "To'lov", "Holat", ""]}
            >
              {bookings.map((booking) => (
                <Fragment key={booking._id}>
                <tr className="align-middle">
                  <td className="py-3 text-[12px] font-semibold text-muted-foreground">
                    {booking.reference}
                  </td>
                  <td className="max-w-[280px] py-3">
                    <p className="truncate text-[13px] font-semibold text-foreground">
                      {booking.title}
                    </p>
                    <p className="text-[12px] text-muted-foreground">{booking.city}</p>
                  </td>
                  <td className="py-3 text-[13px] text-muted-foreground">{booking.startDate}</td>
                  <td className="py-3 text-[13px] text-muted-foreground">{booking.guests}</td>
                  <td className="py-3 text-[13px] font-semibold text-foreground">
                    ${booking.totalPrice}
                  </td>
                  <td className="py-3">
                    <span className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground">
                      <CreditCard className="size-3.5" aria-hidden="true" />
                      {booking.paymentMethod}
                    </span>
                  </td>
                  <td className="py-3">
                    <StatusBadge status={booking.status} />
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setOpenBooking(openBooking === booking._id ? null : booking._id)
                        }
                      >
                        Mutaxassislar
                        <ChevronDown
                          className={cn(
                            "size-3.5 transition-transform",
                            openBooking === booking._id && "rotate-180",
                          )}
                          aria-hidden="true"
                        />
                      </Button>
                      {booking.status === "new" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => cancel(booking._id)}
                          className={cn("text-destructive hover:text-destructive")}
                        >
                          Bekor qilish
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
                {openBooking === booking._id && (
                  <tr>
                    <td colSpan={8} className="pb-4">
                      <BookingSpecialists bookingId={booking._id} />
                    </td>
                  </tr>
                )}
                </Fragment>
              ))}
            </PanelTable>
          )}
        </PanelCard>
      )}

      {tab === "history" && (
        <div className="flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={ClipboardList}
              label="Sayohatlar"
              value={stats?.total ?? 0}
              hint="Jami buyurtmalar"
            />
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
              value={
                <PriceInline usd={stats?.spent ?? 0} />
              }
              hint="To'langan buyurtmalar"
              tone="eco"
            />
            <StatCard
              icon={Star}
              label="Sizning bahoyingiz"
              value={averageRating ? averageRating.toFixed(1) : "—"}
              hint={`${myReviews.length} ta sharh qoldirdingiz`}
            />
          </div>

          <PanelCard
            title="Sayohat pasporti"
            description="Safar qilgan shaharlaringiz — millytour hisobingizdagi tarix"
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

          <PanelCard title="Buyurtmalar tarixi" description="Barcha so'rov va bronlar">
            {bookings.length === 0 ? (
              <PanelEmpty icon={ClipboardList} title="Buyurtma yo'q" />
            ) : (
              <PanelTable head={["Buyurtma", "Shahar", "Sana", "Summa", "Holat", "To'lov"]}>
                <>
                  {bookings.map((b) => (
                    <tr key={b._id}>
                      <td className="py-3">
                        <p className="text-[13px] font-semibold text-foreground">{b.title}</p>
                        <p className="text-[11px] text-muted-foreground">{b.reference}</p>
                      </td>
                      <td className="py-3 text-[12px] text-muted-foreground">{b.city}</td>
                      <td className="py-3 text-[12px] text-muted-foreground">{b.startDate}</td>
                      <td className="py-3 text-[13px] font-semibold text-foreground">
                        <PriceInline usd={b.totalPrice} />
                        {b.discountPercent ? (
                          <span className="ml-1.5 text-[11px] font-normal text-emerald-600 dark:text-emerald-400">
                            −{b.discountPercent}%
                          </span>
                        ) : null}
                      </td>
                      <td className="py-3">
                        <StatusBadge status={b.status} />
                      </td>
                      <td className="py-3">
                        <StatusBadge
                          status={b.paymentStatus === "paid" ? "active" : "pending"}
                        />
                      </td>
                    </tr>
                  ))}
                </>
              </PanelTable>
            )}
          </PanelCard>
        </div>
      )}

      {tab === "plans" && (
        <PanelCard
          title="Saqlangan AI dasturlar"
          description="AI Planner tuzgan marshrutlar — sayohatdan oldin tahrirlash mumkin"
        >
          {!plans || plans.length === 0 ? (
            <PanelEmpty
              icon={Sparkles}
              title="Hali saqlangan dastur yo'q"
              description="AI Planner savollarga javob beradi va kunma-kun dasturni shu yerda saqlaydi."
              action={
                <Button onClick={openMillyAi}>
                  <Sparkles className="size-4" aria-hidden="true" />
                  Milly AI bilan dastur tuzish
                </Button>
              }
            />
          ) : (
            <div className="flex flex-col gap-4">
              {plans.map((row) => {
                const options = (row.options ?? undefined) as unknown as AiPlan[] | undefined;
                const plan = (options?.[row.chosenIndex ?? 0] ?? row.plan) as AiPlan;
                return (
                  <details
                    key={row._id}
                    className="group rounded-2xl border bg-background p-4 open:shadow-xs"
                  >
                    <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3 list-none">
                      <div>
                        <p className="text-[13px] font-semibold text-foreground">{plan.title}</p>
                        <p className="mt-0.5 text-[12px] text-muted-foreground">
                          {row.engine === "ai" ? "AI Planner" : "Tezkor rejim"} · ~$
                          {plan.estimate?.total} ·{" "}
                          {new Date(row.createdAt).toLocaleDateString("uz-UZ")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-semibold text-muted-foreground group-open:hidden">
                          Ochish
                        </span>
                        {plan.pack?.[0] && (
                          <Button size="sm" variant="outline" asChild>
                            <Link to={`/paketlar/${plan.pack[0]}`}>Paketni band qilish</Link>
                          </Button>
                        )}
                      </div>
                    </summary>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {plan.days?.map((day) => (
                        <div key={day.day} className="rounded-xl border bg-card p-3">
                          <p className="text-[12px] font-semibold text-foreground">
                            {day.day}-kun · {day.city}
                          </p>
                          <ul className="mt-2 flex flex-col gap-1">
                            {day.items.map((item) => (
                              <li
                                key={`${day.day}-${item.time}-${item.title}`}
                                className="flex gap-2 text-[12px] text-muted-foreground"
                              >
                                <span className="w-10 shrink-0 font-semibold text-primary">
                                  {item.time}
                                </span>
                                {item.title}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </details>
                );
              })}
            </div>
          )}
        </PanelCard>
      )}

      {tab === "recommendations" && (
        <div className="flex flex-col gap-6">
          <PanelCard
            title="Sizga mos tur paketlar"
            description="Tavsiyalar oldingi buyurtmalaringiz, yo'nalishlar va reyting asosida saralanadi"
          >
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {recommendations.map((row) => (
                <div key={row.tour.id} className="flex flex-col gap-2">
                  <TourCard tour={row.tour} />
                  <p className="text-[12px] leading-5 text-muted-foreground">{row.reason}</p>
                </div>
              ))}
            </div>
          </PanelCard>

          <PanelCard
            title="Yo'nalish bo'yicha qidirish"
            description="Turkumni tanlab, shu yo'nalishdagi barcha paketlarni ko'ring"
          >
            <div className="flex flex-wrap gap-2">
              {TOUR_CATEGORIES.slice(1).map((cat) => (
                <Button key={cat.id} variant="outline" size="sm" asChild>
                  <Link to={`/paketlar?category=${cat.id}`}>{cat.label}</Link>
                </Button>
              ))}
            </div>
          </PanelCard>
        </div>
      )}

      {tab === "profile" && (
        <div className="grid gap-6 xl:grid-cols-2">
          <PanelCard title="Hisob ma'lumotlari" description="Turist hisobi">
            <dl className="flex flex-col gap-3 text-sm">
              <div className="flex items-center justify-between border-b pb-2">
                <dt className="text-muted-foreground">Ism</dt>
                <dd className="font-semibold text-foreground">{user?.name ?? "—"}</dd>
              </div>
              <div className="flex items-center justify-between border-b pb-2">
                <dt className="text-muted-foreground">Email</dt>
                <dd className="font-semibold text-foreground">{user?.email ?? "—"}</dd>
              </div>
              <div className="flex items-center justify-between border-b pb-2">
                <dt className="text-muted-foreground">Telegram</dt>
                <dd className="font-semibold text-foreground">
                  {user?.telegramId ? "Ulangan" : "Ulanmagan"}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Til</dt>
                <dd className="font-semibold text-foreground">
                  {(user?.language ?? "UZ").toUpperCase()}
                </dd>
              </div>
            </dl>
            <Button
              className="mt-5 w-full"
              onClick={startTelegramLink}
              disabled={linking}
              variant="outline"
            >
              <Send className="size-4" aria-hidden="true" />
              Telegram botni ulash
            </Button>
            <p className="mt-2 text-[12px] leading-5 text-muted-foreground">
              Bot orqali buyurtma holati, vaucher va yangi tur tavsiyalari keladi. Saytga mini app
              sifatida ham kirish mumkin.
            </p>
          </PanelCard>

          <div className="flex flex-col gap-6">
            <PanelCard title="Yordam" description="Savollaringizga 24/7 javob">
              <ul className="flex flex-col gap-2 text-[13px] text-muted-foreground">
                <li className="flex items-center gap-2">
                  <LifeBuoy className="size-4 text-primary" aria-hidden="true" />
                  Saytning pastki o'ng burchagidagi AI yordamchi
                </li>
                <li className="flex items-center gap-2">
                  <Send className="size-4 text-primary" aria-hidden="true" />
                  Telegram: @millytour_bot
                </li>
                <li className="flex items-center gap-2">
                  <CalendarDays className="size-4 text-primary" aria-hidden="true" />
                  +998 71 200 70 70
                </li>
              </ul>
            </PanelCard>
          </div>
        </div>
      )}
    </PanelShell>
  );
}
