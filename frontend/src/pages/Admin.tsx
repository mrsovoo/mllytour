import { useState } from "react";
import { Navigate, useSearchParams } from "react-router";
import { useRestAction, useRestMutation, useRestQuery } from "@/api/client";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import {
  BadgeCheck,
  BarChart3,
  Bot,
  ClipboardList,
  CreditCard,
  Database,
  Inbox,
  LayoutDashboard,
  Loader2,
  Package,
  RefreshCw,
  Send,
  ShieldCheck,
  Store,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  PanelCard,
  PanelEmpty,
  PanelShell,
  PanelTable,
  StatCard,
  StatusBadge,
} from "@/components/workspace";
import { useAuth } from "@/hooks/use-auth";
import { PARTNER_DIRECTIONS, TOUR_CATEGORIES, TOUR_PACKAGES } from "@/data/catalog";

const TABS = [
  { id: "overview", label: "Umumiy ko'rsatkichlar", icon: LayoutDashboard },
  { id: "providers", label: "Hamkorlar", icon: Store },
  { id: "bookings", label: "Buyurtmalar", icon: ClipboardList },
  { id: "payments", label: "To'lovlar", icon: CreditCard },
  { id: "market", label: "Marketplace moderatsiyasi", icon: Package },
  { id: "leads", label: "Hamkorlik so'rovlari", icon: Inbox },
  { id: "catalog", label: "Tur paketlar tahlili", icon: BarChart3 },
  { id: "bot", label: "Bot sozlamalari", icon: Bot },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function Admin() {
  const { isLoading } = useAuth();
  const status = useRestQuery("admin", "status");
  const claimAdmin = useRestMutation("admin", "claimAdmin");
  const [claiming, setClaiming] = useState(false);

  if (isLoading || status === undefined) {
    return null;
  }

  if (!status.isSignedIn) {
    return <Navigate to="/auth?returnTo=%2Fadmin" replace />;
  }

  if (!status.isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
              <ShieldCheck className="size-6" aria-hidden="true" />
            </span>
            <h1 className="text-lg font-semibold text-foreground">
              {status.adminCount === 0
                ? "Birinchi administratorni tayinlash"
                : "Administrator huquqi kerak"}
            </h1>
            <p className="text-[13px] leading-5 text-muted-foreground">
              {status.adminCount === 0
                ? "Tizimda hali administrator yo'q. Hisobingizni Millytour administratori sifatida belgilashingiz mumkin."
                : "Bu bo'lim faqat Millytour administratorlari uchun. Kirish huquqini administrator panelidan so'rang."}
            </p>
            {status.adminCount === 0 && (
              <Button
                disabled={claiming}
                onClick={async () => {
                  setClaiming(true);
                  try {
                    await claimAdmin();
                    toast.success("Administrator huquqi berildi");
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : "Xatolik");
                  } finally {
                    setClaiming(false);
                  }
                }}
              >
                {claiming ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  "Administrator bo'lish"
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return <AdminPanel />;
}

function AdminPanel() {
  // Bo'limlar URL'dan o'qiladi — yon menyu bosilganda kontent almashadi.
  const [params] = useSearchParams();
  const tabParam = params.get("tab");
  const tab: TabId = TABS.find((t) => t.id === tabParam)?.id ?? "overview";
  const [providerFilter, setProviderFilter] = useState<"all" | "pending" | "approved">("all");

  const overview = useRestQuery("admin", "overview");
  const providers = useRestQuery("providers", "list", {});
  const bookings = useRestQuery("bookings", "adminList", {});
  const payments = useRestQuery("payments", "adminList", {});
  const pendingItems = useRestQuery("market", "pending");
  const leads = useRestQuery("providers", "listLeads");
  const botConfig = useRestQuery("telegram", "config");
  const events = useRestQuery("telegram", "events", { limit: 15 });

  const seedDemo = useRestMutation("admin", "seedDemo");
  const setProviderStatus = useRestMutation("providers", "setStatus");
  const setSubscription = useRestMutation("providers", "setSubscription");
  const setBookingStatus = useRestMutation("bookings", "setStatus");
  const moderate = useRestMutation("market", "moderate");
  const handleLead = useRestMutation("providers", "handleLead");
  const confirmPayment = useRestMutation("payments", "confirm");
  const refundPayment = useRestMutation("payments", "refund");
  const saveBotTokens = useRestMutation("telegram", "saveBotTokens");
  const registerWebhooks = useRestAction("telegram", "registerWebhooks");
  const pollBotUpdates = useRestAction("telegram", "pollUpdates");

  const [tokens, setTokens] = useState({ main: "", auth: "" });
  const [busy, setBusy] = useState<string | null>(null);
  const [webhookResult, setWebhookResult] = useState<string | null>(null);

  const totals = overview?.totals;
  const filteredProviders = (providers ?? []).filter((p) =>
    providerFilter === "all" ? true : p.status === providerFilter,
  );

  return (
    <PanelShell
      variant="admin"
      title="Millytour boshqaruv markazi"
      subtitle="Platformaning barcha tomonlari: hamkorlar, buyurtmalar, marketplace, tur paketlar tahlili va Telegram botlari."
      nav={TABS.map((t) => ({
        icon: t.icon,
        label: t.label,
        to: `/admin?tab=${t.id}`,
        active: tab === t.id,
        badge:
          t.id === "providers"
            ? totals?.pendingProviders || undefined
            : t.id === "market"
              ? totals?.pendingItems || undefined
              : t.id === "leads"
                ? leads?.filter((l) => !l.handled).length || undefined
                : t.id === "payments"
                  ? payments?.filter((p) => p.status === "pending").length || undefined
                  : undefined,
      }))}
      actions={
        <>
          <Button
            variant="outline"
            disabled={busy === "seed"}
            onClick={async () => {
              setBusy("seed");
              try {
                const result = await seedDemo();
                toast[result.seeded ? "success" : "info"](
                  result.seeded ? "Demo ma'lumotlar yuklandi" : result.reason ?? "Bajarildi",
                );
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Xatolik");
              } finally {
                setBusy(null);
              }
            }}
          >
            {busy === "seed" ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Database className="size-4" aria-hidden="true" />
            )}
            Demo ma'lumotlar
          </Button>
          <Button
            variant="outline"
            disabled={busy === "webhook"}
            onClick={async () => {
              setBusy("webhook");
              try {
                const result = await registerWebhooks();
                setWebhookResult(
                  Object.entries(result.results)
                    .map(([bot, message]) => `${bot}: ${message}`)
                    .join(" · "),
                );
                toast.success("Webhook holati yangilandi");
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Xatolik");
              } finally {
                setBusy(null);
              }
            }}
          >
            {busy === "webhook" ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <RefreshCw className="size-4" aria-hidden="true" />
            )}
            Webhook'larni ulash
          </Button>
          <Button
            variant="outline"
            disabled={busy === "poll"}
            title="Webhook o'rnatilmagan muhitda bot xabarlarini qo'lda oladi"
            onClick={async () => {
              setBusy("poll");
              try {
                const lines: string[] = [];
                for (const bot of ["auth", "main"] as const) {
                  const result = await pollBotUpdates({ bot });
                  lines.push(`${bot}: ${result.message}`);
                }
                setWebhookResult(lines.join(" · "));
                toast.success("Bot xabarlari tekshirildi");
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Xatolik");
              } finally {
                setBusy(null);
              }
            }}
          >
            {busy === "poll" ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Inbox className="size-4" aria-hidden="true" />
            )}
            Xabarlarni olish
          </Button>
        </>
      }
    >
      {tab === "overview" && (
        <div className="flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={Users}
              label="Foydalanuvchilar"
              value={totals?.users ?? 0}
              hint={`${totals?.tourists ?? 0} turist hisobi`}
            />
            <StatCard
              icon={Store}
              label="Hamkorlar"
              value={totals?.providers ?? 0}
              hint={`${totals?.pendingProviders ?? 0} tasdiq kutilmoqda`}
              tone="gold"
            />
            <StatCard
              icon={ClipboardList}
              label="Buyurtmalar"
              value={totals?.bookings ?? 0}
              hint={`${totals?.openBookings ?? 0} yangi buyurtma`}
            />
            <StatCard
              icon={BadgeCheck}
              label="Aylanma"
              value={`$${totals?.gross ?? 0}`}
              hint={`Komissiya $${totals?.commission ?? 0}`}
              tone="eco"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              icon={WalletIcon}
              label="Oylik obuna daromadi"
              value={`$${totals?.subscriptionRevenue ?? 0}`}
              hint="Faol hamkorlar bo'yicha"
              tone="gold"
            />
            <StatCard
              icon={Package}
              label="Moderatsiya kutayotgan mahsulot"
              value={totals?.pendingItems ?? 0}
            />
            <StatCard
              icon={Bot}
              label="Bot hodisalari"
              value={totals?.botEvents ?? 0}
              hint="Ro'yxatdan o'tish va panel amallari"
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
            <PanelCard
              title="Oxirgi 14 kun: buyurtmalar va tushum"
              description="Kunlik bronlar va ularning summasi"
            >
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={overview?.series ?? []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis dataKey="day" fontSize={11} stroke="#6B7280" />
                    <YAxis fontSize={11} stroke="#6B7280" />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid #E5E7EB",
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="revenue" fill="#c65d3a" radius={[6, 6, 0, 0]} name="Tushum $" />
                    <Bar dataKey="bookings" fill="#F59E0B" radius={[6, 6, 0, 0]} name="Buyurtma" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </PanelCard>

            <PanelCard title="Yo'nalishlar bo'yicha hamkorlar" description="Obuna va tasdiqlash holati">
              <ul className="flex flex-col gap-3">
                {(overview?.byDirection ?? []).map((row) => {
                  const meta = PARTNER_DIRECTIONS.find((d) => d.id === row.direction);
                  return (
                    <li key={row.direction} className="rounded-xl border bg-background p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-[13px] font-semibold text-foreground">{meta?.label}</p>
                        <span className="text-[13px] font-bold text-foreground">${row.mrr}/oy</span>
                      </div>
                      <p className="mt-1 text-[12px] text-muted-foreground">
                        {row.total} hamkor · {row.approved} tasdiqlangan · {row.pending} kutayotgan
                      </p>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{
                            width: `${row.total === 0 ? 0 : Math.round((row.approved / row.total) * 100)}%`,
                          }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </PanelCard>
          </div>

          <PanelCard title="Oxirgi buyurtmalar" description="Platforma bo'ylab eng yangi bronlar">
            {(overview?.recentBookings.length ?? 0) === 0 ? (
              <PanelEmpty
                icon={ClipboardList}
                title="Buyurtma yo'q"
                description="Demo ma'lumotlarni yuklab panellarni to'ldirishingiz mumkin."
              />
            ) : (
              <PanelTable head={["Kod", "Buyurtma", "Turi", "Summa", "Holat"]}>
                {overview?.recentBookings.map((booking) => (
                  <tr key={booking._id}>
                    <td className="py-3 text-[12px] font-semibold text-muted-foreground">
                      {booking.reference}
                    </td>
                    <td className="max-w-[320px] py-3">
                      <p className="truncate text-[13px] font-semibold text-foreground">
                        {booking.title}
                      </p>
                      <p className="text-[12px] text-muted-foreground">{booking.city}</p>
                    </td>
                    <td className="py-3 text-[12px] text-muted-foreground">{booking.kind}</td>
                    <td className="py-3 text-[13px] font-semibold text-foreground">
                      ${booking.totalPrice}
                    </td>
                    <td className="py-3">
                      <StatusBadge status={booking.status} />
                    </td>
                  </tr>
                ))}
              </PanelTable>
            )}
          </PanelCard>
        </div>
      )}

      {tab === "providers" && (
        <PanelCard
          title="Hamkorlar"
          description="Tasdiqlash, obuna va bot ulanishini boshqarish"
          action={
            <div className="flex gap-2">
              {(["all", "pending", "approved"] as const).map((filter) => (
                <Button
                  key={filter}
                  size="sm"
                  variant={providerFilter === filter ? "default" : "outline"}
                  onClick={() => setProviderFilter(filter)}
                >
                  {filter === "all" ? "Barchasi" : filter === "pending" ? "Kutayotgan" : "Faol"}
                </Button>
              ))}
            </div>
          }
        >
          {filteredProviders.length === 0 ? (
            <PanelEmpty
              icon={Store}
              title="Hamkor topilmadi"
              description="Demo ma'lumotlarni yuklang yoki hamkorlarning bot orqali ro'yxatdan o'tishini kuting."
            />
          ) : (
            <PanelTable
              head={["Hamkor", "Yo'nalish", "Shahar", "Obuna", "Reyting", "Holat", "Amallar"]}
            >
              {filteredProviders.map((provider) => (
                <tr key={provider._id}>
                  <td className="max-w-[260px] py-3">
                    <p className="truncate text-[13px] font-semibold text-foreground">
                      {provider.businessName}
                    </p>
                    <p className="text-[12px] text-muted-foreground">
                      {provider.phone} ·{" "}
                      {provider.telegramUsername ? `@${provider.telegramUsername}` : "telegram yo'q"}
                    </p>
                  </td>
                  <td className="py-3 text-[12px] text-muted-foreground">
                    {PARTNER_DIRECTIONS.find((d) => d.id === provider.direction)?.label}
                  </td>
                  <td className="py-3 text-[12px] text-muted-foreground">{provider.city}</td>
                  <td className="py-3">
                    <StatusBadge status={provider.subscription} />
                    <p className="mt-1 text-[11px] text-muted-foreground">${provider.monthlyFee}/oy</p>
                  </td>
                  <td className="py-3 text-[12px] text-muted-foreground">
                    {provider.rating > 0 ? provider.rating.toFixed(1) : "—"}
                  </td>
                  <td className="py-3">
                    <StatusBadge status={provider.status} />
                  </td>
                  <td className="py-3">
                    <div className="flex flex-wrap justify-end gap-1.5">
                      {provider.status !== "approved" ? (
                        <Button
                          size="sm"
                          onClick={async () => {
                            try {
                              await setProviderStatus({ providerId: provider._id, status: "approved" });
                              toast.success("Hamkor tasdiqlandi");
                            } catch (error) {
                              toast.error(error instanceof Error ? error.message : "Xatolik");
                            }
                          }}
                        >
                          Tasdiqlash
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            try {
                              await setProviderStatus({ providerId: provider._id, status: "paused" });
                              toast.success("Hamkor to'xtatildi");
                            } catch (error) {
                              toast.error(error instanceof Error ? error.message : "Xatolik");
                            }
                          }}
                        >
                          To'xtatish
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          try {
                            await setSubscription({
                              providerId: provider._id,
                              subscription: "active",
                              months: 1,
                            });
                            toast.success("Obuna 1 oyga faollashtirildi");
                          } catch (error) {
                            toast.error(error instanceof Error ? error.message : "Xatolik");
                          }
                        }}
                      >
                        Obuna
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </PanelTable>
          )}
        </PanelCard>
      )}

      {tab === "bookings" && (
        <PanelCard title="Barcha buyurtmalar" description="Holat va to'lovlarni boshqarish">
          {(bookings?.length ?? 0) === 0 ? (
            <PanelEmpty icon={ClipboardList} title="Buyurtma yo'q" />
          ) : (
            <PanelTable head={["Kod", "Buyurtma", "Turi", "Sana", "Summa", "To'lov", "Holat", ""]}>
              {bookings?.map((booking) => (
                <tr key={booking._id}>
                  <td className="py-3 text-[12px] font-semibold text-muted-foreground">
                    {booking.reference}
                  </td>
                  <td className="max-w-[280px] py-3">
                    <p className="truncate text-[13px] font-semibold text-foreground">
                      {booking.title}
                    </p>
                    <p className="text-[12px] text-muted-foreground">{booking.city}</p>
                  </td>
                  <td className="py-3 text-[12px] text-muted-foreground">{booking.kind}</td>
                  <td className="py-3 text-[12px] text-muted-foreground">{booking.startDate}</td>
                  <td className="py-3 text-[13px] font-semibold text-foreground">
                    ${booking.totalPrice}
                  </td>
                  <td className="py-3">
                    <StatusBadge status={booking.paymentStatus} />
                  </td>
                  <td className="py-3">
                    <StatusBadge status={booking.status} />
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex justify-end gap-1.5">
                      {booking.status !== "completed" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            try {
                              await setBookingStatus({ bookingId: booking._id, status: "completed" });
                              toast.success("Bajarilgan deb belgilandi");
                            } catch (error) {
                              toast.error(error instanceof Error ? error.message : "Xatolik");
                            }
                          }}
                        >
                          Yakunlash
                        </Button>
                      )}
                      {booking.status !== "cancelled" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={async () => {
                            try {
                              await setBookingStatus({ bookingId: booking._id, status: "cancelled" });
                              toast.success("Buyurtma bekor qilindi");
                            } catch (error) {
                              toast.error(error instanceof Error ? error.message : "Xatolik");
                            }
                          }}
                        >
                          Bekor
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </PanelTable>
          )}
        </PanelCard>
      )}

      {tab === "payments" && (
        <PanelCard
          title="To'lovlar"
          description="Shlyuz webhook'i yoki administrator tasdig'i orqali to'lovni yoping"
        >
          {(payments ?? []).length === 0 ? (
            <PanelEmpty
              icon={CreditCard}
              title="To'lov yo'q"
              description="Bron yoki AI dastur tasdiqlanganda to'lov yozuvi shu yerga tushadi."
            />
          ) : (
            <PanelTable head={["Kod", "Maqsad", "Summa", "Usul", "Sana", "Holat", ""]}>
              {(payments ?? []).map((payment) => (
                <tr key={payment._id}>
                  <td className="py-3 text-[12px] font-semibold text-muted-foreground">
                    {payment.reference}
                  </td>
                  <td className="py-3 text-[13px] text-muted-foreground">{payment.purpose}</td>
                  <td className="py-3 text-[13px] font-semibold text-foreground">
                    ${payment.amount}
                  </td>
                  <td className="py-3 text-[13px] text-muted-foreground">{payment.method}</td>
                  <td className="py-3 text-[12px] text-muted-foreground">
                    {new Date(payment.createdAt).toLocaleDateString("uz-UZ")}
                  </td>
                  <td className="py-3">
                    <StatusBadge status={payment.status} />
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex justify-end gap-2">
                      {payment.status === "pending" && (
                        <Button
                          size="sm"
                          onClick={async () => {
                            try {
                              await confirmPayment({ paymentId: payment._id });
                              toast.success("To'lov tasdiqlandi");
                            } catch (error) {
                              toast.error(error instanceof Error ? error.message : "Xatolik");
                            }
                          }}
                        >
                          Tasdiqlash
                        </Button>
                      )}
                      {payment.status === "paid" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            try {
                              await refundPayment({ paymentId: payment._id });
                              toast.success("To'lov qaytarildi");
                            } catch (error) {
                              toast.error(error instanceof Error ? error.message : "Xatolik");
                            }
                          }}
                        >
                          Qaytarish
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </PanelTable>
          )}
        </PanelCard>
      )}

      {tab === "market" && (
        <PanelCard
          title="Marketplace moderatsiyasi"
          description="Hunarmandlar bot yoki panel orqali yuborgan mahsulotlar"
        >
          {(pendingItems?.length ?? 0) === 0 ? (
            <PanelEmpty
              icon={Package}
              title="Moderatsiya kutayotgan mahsulot yo'q"
              description="Yangi mahsulot kelganda bot administratorga xabar yuboradi."
            />
          ) : (
            <PanelTable head={["Mahsulot", "Hunarmand", "Kategoriya", "Narx", "Manba", ""]}>
              {pendingItems?.map((item) => (
                <tr key={item._id}>
                  <td className="py-3 text-[13px] font-semibold text-foreground">{item.title}</td>
                  <td className="py-3 text-[12px] text-muted-foreground">
                    {item.seller} · {item.city}
                  </td>
                  <td className="py-3 text-[12px] text-muted-foreground">{item.category}</td>
                  <td className="py-3 text-[13px] font-semibold text-foreground">${item.price}</td>
                  <td className="py-3 text-[12px] text-muted-foreground">{item.source}</td>
                  <td className="py-3 text-right">
                    <div className="flex justify-end gap-1.5">
                      <Button
                        size="sm"
                        onClick={async () => {
                          try {
                            await moderate({ itemId: item._id, status: "approved" });
                            toast.success("Mahsulot tasdiqlandi");
                          } catch (error) {
                            toast.error(error instanceof Error ? error.message : "Xatolik");
                          }
                        }}
                      >
                        Tasdiqlash
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          try {
                            await moderate({ itemId: item._id, status: "rejected" });
                            toast.success("Rad etildi");
                          } catch (error) {
                            toast.error(error instanceof Error ? error.message : "Xatolik");
                          }
                        }}
                      >
                        Rad etish
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </PanelTable>
          )}
        </PanelCard>
      )}

      {tab === "leads" && (
        <PanelCard
          title="Hamkorlik so'rovlari"
          description="Saytdagi formadan kelgan so'rovlar — botga taklif yuboring"
        >
          {(leads?.length ?? 0) === 0 ? (
            <PanelEmpty icon={Inbox} title="So'rov yo'q" description="Yangi so'rovlar shu yerda chiqadi." />
          ) : (
            <PanelTable head={["Biznes", "Yo'nalish", "Aloqa", "Shahar", "Holat", ""]}>
              {leads?.map((lead) => (
                <tr key={lead._id}>
                  <td className="max-w-[240px] py-3">
                    <p className="truncate text-[13px] font-semibold text-foreground">
                      {lead.businessName}
                    </p>
                    <p className="text-[12px] text-muted-foreground">{lead.contactName}</p>
                  </td>
                  <td className="py-3 text-[12px] text-muted-foreground">
                    {PARTNER_DIRECTIONS.find((d) => d.id === lead.direction)?.label}
                  </td>
                  <td className="py-3 text-[12px] text-muted-foreground">
                    {lead.phone}
                    {lead.telegramUsername ? ` · ${lead.telegramUsername}` : ""}
                  </td>
                  <td className="py-3 text-[12px] text-muted-foreground">{lead.city}</td>
                  <td className="py-3">
                    <StatusBadge status={lead.handled ? "approved" : "pending"} />
                  </td>
                  <td className="py-3 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        try {
                          await handleLead({ leadId: lead._id, handled: !lead.handled });
                          toast.success("Holat yangilandi");
                        } catch (error) {
                          toast.error(error instanceof Error ? error.message : "Xatolik");
                        }
                      }}
                    >
                      {lead.handled ? "Qayta ochish" : "Ko'rib chiqildi"}
                    </Button>
                  </td>
                </tr>
              ))}
            </PanelTable>
          )}
        </PanelCard>
      )}

      {tab === "catalog" && (
        <div className="flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={Package} label="Tur paketlar" value={TOUR_PACKAGES.length} />
            <StatCard
              icon={BarChart3}
              label="O'rtacha narx"
              value={`$${Math.round(
                TOUR_PACKAGES.reduce((sum, t) => sum + t.priceFrom, 0) / TOUR_PACKAGES.length,
              )}`}
              tone="gold"
            />
            <StatCard
              icon={BadgeCheck}
              label="O'rtacha reyting"
              value={(
                TOUR_PACKAGES.reduce((sum, t) => sum + t.rating, 0) / TOUR_PACKAGES.length
              ).toFixed(2)}
              tone="eco"
            />
            <StatCard
              icon={Users}
              label="Sharhlar"
              value={TOUR_PACKAGES.reduce((sum, t) => sum + t.reviews, 0)}
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <PanelCard title="Turkumlar bo'yicha taqsimot" description="Har bir yo'nalishdagi paketlar">
              <ul className="flex flex-col gap-3">
                {TOUR_CATEGORIES.filter((c) => c.id !== "all").map((cat) => {
                  const rows = TOUR_PACKAGES.filter((t) => t.category === cat.id);
                  const share = Math.round((rows.length / TOUR_PACKAGES.length) * 100);
                  return (
                    <li key={cat.id}>
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="font-semibold text-foreground">{cat.label}</span>
                        <span className="text-muted-foreground">
                          {rows.length} paket · {share}%
                        </span>
                      </div>
                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${share}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </PanelCard>

            <PanelCard title="Eng samarali paketlar" description="Reyting va sharhlar bo'yicha">
              <PanelTable head={["Paket", "Turkum", "Narx", "Reyting"]}>
                {[...TOUR_PACKAGES]
                  .sort((a, b) => b.rating * b.reviews - a.rating * a.reviews)
                  .slice(0, 6)
                  .map((tour) => (
                    <tr key={tour.id}>
                      <td className="max-w-[280px] py-3">
                        <p className="truncate text-[13px] font-semibold text-foreground">
                          {tour.title}
                        </p>
                        <p className="text-[12px] text-muted-foreground">{tour.city}</p>
                      </td>
                      <td className="py-3 text-[12px] text-muted-foreground">
                        {TOUR_CATEGORIES.find((c) => c.id === tour.category)?.short}
                      </td>
                      <td className="py-3 text-[13px] font-semibold text-foreground">
                        ${tour.priceFrom}
                      </td>
                      <td className="py-3 text-[12px] text-muted-foreground">
                        {tour.rating.toFixed(1)} · {tour.reviews}
                      </td>
                    </tr>
                  ))}
              </PanelTable>
            </PanelCard>
          </div>
        </div>
      )}

      {tab === "bot" && (
        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <PanelCard
            title="Bot tokenlari"
            description="Asosiy bot turistlarga, auth bot hamkorlarga xizmat qiladi"
          >
            <div className="flex flex-col gap-3">
              <label className="block">
                <span className="text-xs font-semibold text-muted-foreground">
                  Asosiy bot tokeni ({botConfig?.envKeys.main})
                </span>
                <Input
                  value={tokens.main}
                  onChange={(e) => setTokens({ ...tokens, main: e.target.value })}
                  placeholder={botConfig?.masked.main ?? "123456:AAG..."}
                  className="mt-1.5 font-mono text-[12px]"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-muted-foreground">
                  Auth bot tokeni ({botConfig?.envKeys.auth})
                </span>
                <Input
                  value={tokens.auth}
                  onChange={(e) => setTokens({ ...tokens, auth: e.target.value })}
                  placeholder={botConfig?.masked.auth ?? "123456:AAH..."}
                  className="mt-1.5 font-mono text-[12px]"
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <Button
                  disabled={!tokens.main && !tokens.auth}
                  onClick={async () => {
                    try {
                      await saveBotTokens({
                        main: tokens.main || undefined,
                        auth: tokens.auth || undefined,
                      });
                      toast.success("Tokenlar saqlandi");
                      setTokens({ main: "", auth: "" });
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "Xatolik");
                    }
                  }}
                >
                  <ShieldCheck className="size-4" aria-hidden="true" />
                  Tokenlarni saqlash
                </Button>
              </div>
              <p className="rounded-xl border border-dashed p-3 text-[12px] leading-5 text-muted-foreground">
                Tokenlarni loyiha kalitlari bo'limida <code>{botConfig?.envKeys.main}</code> va{" "}
                <code>{botConfig?.envKeys.auth}</code> nomlari bilan ham qo'shish mumkin. Webhook
                manzillari: <code>/telegram/main</code> va <code>/telegram/auth</code>.
              </p>
            </div>
          </PanelCard>

          <div className="flex flex-col gap-6">
            <PanelCard title="Bot holati" description="Sozlash va ulanish">
              <ul className="flex flex-col gap-2 text-[13px]">
                <li className="flex items-center justify-between">
                  <span className="text-muted-foreground">Asosiy bot</span>
                  <StatusBadge status={botConfig?.configured.main ? "active" : "pending"} />
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-muted-foreground">Auth bot</span>
                  <StatusBadge status={botConfig?.configured.auth ? "active" : "pending"} />
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-muted-foreground">Username</span>
                  <span className="font-semibold text-foreground">
                    {botConfig?.usernames.main ? `@${botConfig.usernames.main}` : "—"}
                    {botConfig?.usernames.auth ? ` · @${botConfig.usernames.auth}` : ""}
                  </span>
                </li>
              </ul>
              <div className="mt-4 rounded-xl border border-dashed p-3 text-[12px] leading-5 text-muted-foreground">
                Ochiq HTTPS manzil bo'lsa — <b>Webhook'larni ulash</b>; lokal muhitda esa{" "}
                <b>Xabarlarni olish</b> tugmasi bot xabarlarini qo'lda oladi (ro'yxatdan o'tish,
                buyurtma va vazifalar javoblari shu bilan qayta ishlanadi).
              </div>
              {webhookResult && (
                <p className="mt-2 rounded-xl bg-muted px-3 py-2 text-[12px] leading-5 text-muted-foreground">
                  {webhookResult}
                </p>
              )}
              {botConfig && botConfig.configured.auth && (
                <Button className="mt-4" variant="outline" asChild>
                  <a href={botConfig.authDeepLink} target="_blank" rel="noreferrer">
                    <Send className="size-4" aria-hidden="true" />
                    Auth botni sinash
                  </a>
                </Button>
              )}
            </PanelCard>

            <PanelCard title="Bot jurnali" description="Oxirgi hodisalar">
              {!events || events.length === 0 ? (
                <PanelEmpty icon={Bot} title="Hodisa yo'q" />
              ) : (
                <ul className="flex max-h-80 flex-col gap-2 overflow-y-auto">
                  {events.map((event) => (
                    <li
                      key={event._id}
                      className="flex items-start justify-between gap-3 rounded-xl border bg-background px-3.5 py-2.5"
                    >
                      <div>
                        <p className="text-[12px] font-semibold text-foreground">
                          {event.bot} · {event.kind}
                        </p>
                        <p className="mt-0.5 text-[12px] leading-5 text-muted-foreground">
                          {event.text}
                        </p>
                      </div>
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {new Date(event.createdAt).toLocaleDateString("uz-UZ")}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </PanelCard>
          </div>
        </div>
      )}
    </PanelShell>
  );
}

function WalletIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="2.5" y="5.5" width="19" height="13" rx="3" />
      <path d="M2.5 10h19M16 14.5h2.5" />
    </svg>
  );
}
