import { Fragment, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { useRestMutation, useRestQuery } from "@/shared/api/client";
import { toast } from "sonner";
import {
  CalendarDays,
  ChevronDown,
  ClipboardList,
  CreditCard,
  Globe2,
  LifeBuoy,
  Loader2,
  MapPin,
  Plus,
  Send,
  Sparkles,
  Star,
  Trash2,
  UserRound,
} from "lucide-react";
import { openMillyAi } from "@/features/ai/components/ai-assistant";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { PanelCard, PanelEmpty, PanelShell, PanelTable, StatusBadge } from "@/shared/components/workspace";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { TravelHistory, type Booking } from "@/features/account/components/travel-history";
import type { Plan as AiPlan } from "@/features/ai/lib/planner";
import { cn } from "@/shared/lib/utils";

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
  { id: "orders", label: "Buyurtmalar", icon: ClipboardList },
  { id: "history", label: "Tarix", icon: Globe2 },
  { id: "plans", label: "Reja", icon: CalendarDays },
  { id: "profile", label: "Profil", icon: UserRound },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const [params] = useSearchParams();
  const tab = (params.get("tab") ?? "orders") as TabId;
  const [openBooking, setOpenBooking] = useState<string | null>(null);
  const data = useRestQuery("bookings", "mine");
  const plans = useRestQuery("plans", "mine");
  const myReviews = (useRestQuery<{ rating: number }[]>("reviews", "mine") ?? []) as { rating: number }[];
  const setStatus = useRestMutation("bookings", "setStatus");
  const createLink = useRestMutation("telegram", "linkCode");
  const [linking, setLinking] = useState(false);

  const bookings = (data?.bookings ?? []) as unknown as Booking[];
  const stats = data?.stats ?? null;

  if (isLoading) {
    return null;
  }

  // Kabinet — turist uchun. Bu yerdan operator bo'limlariga avtomatik o'tilmaydi;
  // admin/hamkor o'z paneliga menyu orqali o'tadi.

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
      subtitle="Buyurtmalar, reja va profilingiz — bitta joyda."
      nav={TABS.map((t) => ({
        icon: t.icon,
        label: t.label,
        to: `/kabinet?tab=${t.id}`,
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
        <TravelHistory bookings={bookings} stats={stats} ratings={myReviews} />
      )}

      {tab === "plans" && (
        <div className="flex flex-col gap-6">
        <TripPlanner />
        <PanelCard
          title="Saqlangan AI dasturlar"
          description="Milly AI tuzgan marshrutlar"
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
                  Telegram bot orqali yordam
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

type TripPlan = {
  _id: string;
  title: string;
  city?: string;
  startDate?: string | null;
  endDate?: string | null;
  notes?: string;
  createdAt: number;
};

/**
 * Shaxsiy reja — turist kelgusi sayohatini o'zi yozib qo'yadi (joy, sana, izoh).
 * `tripPlans` REST moduli orqali saqlanadi; har o'zgarishdan keyin ro'yxat yangilanadi.
 */
function TripPlanner() {
  const [nonce, setNonce] = useState(0);
  const plans = useRestQuery<TripPlan[]>("tripPlans", "mine", { _t: nonce });
  const create = useRestMutation("tripPlans", "create");
  const remove = useRestMutation("tripPlans", "remove");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", city: "", startDate: "", notes: "" });

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.title.trim()) {
      toast.error("Reja nomini kiriting");
      return;
    }
    setSaving(true);
    try {
      await create(form);
      toast.success("Reja saqlandi");
      setForm({ title: "", city: "", startDate: "", notes: "" });
      setOpen(false);
      setNonce((value) => value + 1);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Saqlanmadi");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PanelCard
      title="Kelgusi sayohatlar rejasi"
      description="Kelasi safaringizni yozib qo'ying — joy, sana va izohlar"
      action={
        <Button size="sm" variant={open ? "outline" : "default"} onClick={() => setOpen((v) => !v)}>
          {open ? (
            "Bekor qilish"
          ) : (
            <>
              <Plus className="size-4" aria-hidden="true" />
              Reja qo'shish
            </>
          )}
        </Button>
      }
    >
      {open && (
        <form
          onSubmit={submit}
          className="mb-5 grid gap-3 rounded-2xl border border-dashed bg-muted/40 p-4 sm:grid-cols-2"
        >
          <label className="block sm:col-span-2">
            <span className="text-xs font-semibold text-muted-foreground">Reja nomi</span>
            <Input
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              placeholder="Masalan: Samarqand dam olish"
              className="mt-1.5"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-muted-foreground">Joy / shahar</span>
            <Input
              value={form.city}
              onChange={(event) => setForm({ ...form, city: event.target.value })}
              placeholder="Samarqand"
              className="mt-1.5"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-muted-foreground">Boshlanish sanasi</span>
            <Input
              type="date"
              value={form.startDate}
              onChange={(event) => setForm({ ...form, startDate: event.target.value })}
              className="mt-1.5"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs font-semibold text-muted-foreground">Izoh</span>
            <Textarea
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
              rows={2}
              placeholder="Guruh, byudjet, rejalar…"
              className="mt-1.5"
            />
          </label>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : "Saqlash"}
            </Button>
          </div>
        </form>
      )}

      {plans === undefined ? null : plans.length === 0 ? (
        <PanelEmpty
          icon={CalendarDays}
          title="Hali reja yo'q"
          description="Kelgusi safaringizni yozib qo'ying — eslatma bo'lib qoladi."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {plans.map((plan) => (
            <li
              key={plan._id}
              className="flex flex-wrap items-start justify-between gap-3 rounded-xl border bg-background p-3.5"
            >
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-foreground">{plan.title}</p>
                <p className="mt-0.5 text-[12px] text-muted-foreground">
                  {[plan.city, plan.startDate].filter(Boolean).join(" · ") || "Sana belgilanmagan"}
                </p>
                {plan.notes && (
                  <p className="mt-1 text-[12px] leading-5 text-muted-foreground">{plan.notes}</p>
                )}
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                aria-label="Rejani o'chirish"
                onClick={async () => {
                  try {
                    await remove({ planId: plan._id });
                    setNonce((value) => value + 1);
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : "O'chirilmadi");
                  }
                }}
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </PanelCard>
  );
}
