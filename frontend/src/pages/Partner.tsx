import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import { useRestMutation, useRestQuery } from "@/api/client";
import { toast } from "sonner";
import {
  BadgeCheck,
  Bot,
  Check,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  Loader2,
  Package,
  Plus,
  Send,
  Star,
  Store,
  UserRound,
  Wallet,
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
import {
  PARTNER_BOT_USERNAME,
  PARTNER_DIRECTIONS,
  partnerBotLink,
  type Direction,
} from "@/data/catalog";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "overview", label: "Umumiy", icon: LayoutDashboard },
  { id: "orders", label: "Buyurtmalar", icon: ClipboardList },
  { id: "bot", label: "Bot paneli", icon: Bot },
  { id: "profile", label: "Profil va sozlamalar", icon: UserRound },
  { id: "billing", label: "To'lov va obuna", icon: Wallet },
] as const;

type TabId = (typeof TABS)[number]["id"] | "products";

const VEHICLE_LABELS: Record<string, string> = {
  ok: "Yaxshi holatda",
  service: "Texnik xizmat kerak",
  repair: "Ta'mirda",
};

export default function Partner() {
  const { isLoading } = useAuth();
  const me = useRestQuery("providers", "me");
  const metrics = useRestQuery("providers", "metrics");
  const register = useRestMutation("providers", "register");

  // Bo'limlar URL'dan o'qiladi — yon menyu bosilganda kontent ham almashadi.
  const [params] = useSearchParams();
  const tabParam = params.get("tab");
  const tab: TabId =
    (["overview", "orders", "bot", "profile", "billing", "products"] as TabId[]).find(
      (id) => id === tabParam,
    ) ?? "overview";
  const [registering, setRegistering] = useState(false);
  const [directionAnswers, setDirectionAnswers] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    direction: "guide" as Direction,
    businessName: "",
    city: "Samarqand",
    phone: "",
    telegramUsername: "",
    about: "",
    experienceYears: "3",
  });

  const provider = me?.provider ?? null;
  const questionSet = useRestQuery<{ direction: Direction; questions: string[]; aiIntro: string }>(
    "providers",
    "questions",
    { direction: form.direction },
  );

  const menuPreview = useRestQuery("telegram", "menuPreview", provider ? { direction: provider.direction } : {});
  const events = useRestQuery("telegram", "events", { limit: 12 });
  const items = useRestQuery("market", "myItems");
  const botConfig = useRestQuery("telegram", "config");
  const myTasks = useRestQuery("assignments", "mine");
  const setAssignmentStatus = useRestMutation("bookings", "setAssignmentStatus");

  const linkCode = useRestMutation("telegram", "linkCode");
  const updateProfile = useRestMutation("providers", "updateProfile");
  const reportVehicle = useRestMutation("providers", "reportVehicle");
  const addItem = useRestMutation("market", "addItem");
  const claim = useRestMutation("bookings", "claim");
  const setStatus = useRestMutation("bookings", "setStatus");

  const [newItem, setNewItem] = useState({ title: "", category: "Kulolchilik", price: "" });
  const [savingProfile, setSavingProfile] = useState(false);

  if (isLoading) {
    return null;
  }

  /* ------------------------------ ro'yxatdan o'tish ----------------------------- */
  if (!provider) {
    return (
      <PanelShell
        variant="partner"
        title="Hamkor bo'lish"
        subtitle="Ro'yxatdan o'tish sayt orqali ham mumkin — asosiy yo'l Telegram auth bot, ammo profil shu yerda ham yaratiladi va administrator tasdiqlaydi."
        nav={[]}
        actions={
          <Button variant="outline" asChild>
            <Link to="/hamkorlar">Hamkorlik shartlari</Link>
          </Button>
        }
      >
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <PanelCard
            title="Hamkor profilini yaratish"
            description="Yo'nalishni tanlang — panel va bot funksiyalari shunga moslanadi."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {PARTNER_DIRECTIONS.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => {
                    setForm({ ...form, direction: d.id });
                    setDirectionAnswers({});
                  }}
                  className={cn(
                    "rounded-xl border p-3 text-left transition-colors",
                    form.direction === d.id
                      ? "border-primary bg-primary/5"
                      : "hover:border-primary/30",
                  )}
                >
                  <p className="text-[13px] font-semibold text-foreground">
                    {d.label} · ${d.monthlyFee}/oy
                  </p>
                  <p className="mt-0.5 text-[12px] leading-5 text-muted-foreground">{d.summary}</p>
                </button>
              ))}
            </div>

            {questionSet && (
              <div className="mt-5 rounded-2xl border border-primary/15 bg-primary/[0.035] p-4">
                <p className="text-sm font-semibold text-foreground">AI savollari</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{questionSet.aiIntro}</p>
                <div className="mt-3 grid gap-3">
                  {questionSet.questions.map((question, index) => (
                    <label key={question} className="block">
                      <span className="text-xs font-semibold text-muted-foreground">{question}</span>
                      <Input
                        value={directionAnswers[String(index)] ?? ""}
                        onChange={(event) => setDirectionAnswers((current) => ({ ...current, [String(index)]: event.target.value }))}
                        className="mt-1.5"
                      />
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-semibold text-muted-foreground">
                  Biznes / ustaxona nomi
                </span>
                <Input
                  value={form.businessName}
                  onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                  placeholder="Dilshod gidlar jamoasi"
                  className="mt-1.5"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-muted-foreground">Shahar</span>
                <Input
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="mt-1.5"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-muted-foreground">
                  Telefon raqami
                </span>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+998 90 123 45 67"
                  className="mt-1.5"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-muted-foreground">
                  Telegram username
                </span>
                <Input
                  value={form.telegramUsername}
                  onChange={(e) => setForm({ ...form, telegramUsername: e.target.value })}
                  placeholder="@username"
                  className="mt-1.5"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-muted-foreground">
                  Tajriba (yil)
                </span>
                <Input
                  type="number"
                  min={0}
                  value={form.experienceYears}
                  onChange={(e) => setForm({ ...form, experienceYears: e.target.value })}
                  placeholder="3"
                  className="mt-1.5"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-xs font-semibold text-muted-foreground">
                  Faoliyat haqida
                </span>
                <textarea
                  value={form.about}
                  onChange={(e) => setForm({ ...form, about: e.target.value })}
                  rows={3}
                  className="mt-1.5 w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus-visible:border-primary/50 focus-visible:ring-[3px] focus-visible:ring-ring/30"
                  placeholder="Xizmat turlari, tillar, mashina yoki xona fondi"
                />
              </label>
            </div>

            <Button
              className="mt-4"
              size="lg"
              disabled={registering || !form.businessName || !form.phone}
              onClick={async () => {
                setRegistering(true);
                try {
                  await register({
                    direction: form.direction,
                    businessName: form.businessName,
                    city: form.city,
                    phone: form.phone,
                    telegramUsername: form.telegramUsername || undefined,
                    about: form.about || undefined,
                    languages: ["UZ", "RU"],
                    experienceYears: Number(form.experienceYears) || undefined,
                    directionAnswers,
                  });
                  toast.success("Profil yaratildi — tasdiqlash kutilmoqda");
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Xatolik yuz berdi");
                } finally {
                  setRegistering(false);
                }
              }}
            >
              {registering ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <>
                  <Plus className="size-4" aria-hidden="true" />
                  Profilni yaratish
                </>
              )}
            </Button>
          </PanelCard>

          <div className="flex flex-col gap-4">
            <Card className="relative overflow-hidden border-border/70">
              <CardContent className="py-6">
                <p className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Send className="size-4 text-primary" aria-hidden="true" />
                  Auth bot orqali tezroq
                </p>
                <p className="mt-2 text-[13px] leading-5 text-muted-foreground">
                  Bot 4 qadamda ro'yxatdan o'tkazadi va yo'nalishingizga mos menyuni darhol
                  ochadi: buyurtmalar, kalendar, reyting, to'lovlar.
                </p>
                <Button className="mt-4" asChild>
                  <a
                    href={botConfig?.authDeepLink ?? partnerBotLink()}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Bot className="size-4" aria-hidden="true" />
                    {PARTNER_BOT_USERNAME} ni ochish
                  </a>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border/70">
              <CardContent className="py-6">
                <p className="text-sm font-semibold text-foreground">
                  {PARTNER_DIRECTIONS.find((d) => d.id === form.direction)?.label} uchun oylik
                  obuna
                </p>
                <p className="mt-2 text-[13px] leading-5 text-muted-foreground">
                  Obuna sinov davri bilan boshlanadi. Buyurtma bajarilganda komissiya 12% ni
                  tashkil qiladi, qolgan summa hisobingizga o'tadi.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </PanelShell>
    );
  }

  /* --------------------------------- asosiy panel -------------------------------- */

  const pending = provider.status !== "approved";
  const isTransfer = provider.direction === "transfer";
  const vehicle = provider.vehicle;

  return (
    <PanelShell
      variant="partner"
      title={provider.businessName}
      subtitle={`${PARTNER_DIRECTIONS.find((d) => d.id === provider.direction)?.label} yo'nalishi · ${provider.city}`}
      nav={[
        ...TABS.map((t) => ({
          icon: t.icon,
          label: t.label,
          to: `/partner?tab=${t.id}`,
          active: tab === t.id,
          badge:
            t.id === "orders"
              ? (metrics?.open.length ?? 0) + (metrics?.assigned.length ?? 0) || undefined
              : undefined,
        })),
        ...(provider.direction === "artisan"
          ? [
              {
                icon: Package,
                label: "Mahsulotlarim",
                to: "/partner?tab=products",
                active: tab === "products",
                badge: items?.length || undefined,
              },
            ]
          : []),
      ]}
      actions={
        <>
          <StatusBadge status={provider.status} />
          <StatusBadge status={provider.subscription} />
        </>
      }
    >
      {pending && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gold/40 bg-gold/10 px-4 py-3">
          <p className="text-[13px] font-semibold text-foreground">
            Profilingiz tasdiqlashni kutmoqda — panel sinov rejimida ishlaydi.
          </p>
          <span className="text-[12px] text-muted-foreground">
            Tasdiqlangach buyurtmalar botga va shu panelga tusha boshlaydi.
          </span>
        </div>
      )}

      {tab === "overview" && (
        <div className="flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={ClipboardList}
              label="Ochiq so'rovlar"
              value={metrics?.open.length ?? 0}
              hint="Qabul qilish kutilmoqda"
            />
            <StatCard
              icon={BadgeCheck}
              label="Bajarilgan"
              value={provider.completedOrders}
              hint={`${metrics?.assigned.length ?? 0} ta faol buyurtma`}
              tone="eco"
            />
            <StatCard
              icon={Star}
              label="Reyting"
              value={provider.rating > 0 ? provider.rating.toFixed(1) : "—"}
              hint={`${provider.ratingCount} ta sharh`}
              tone="gold"
            />
            <StatCard
              icon={Wallet}
              label="Daromad"
              value={`$${metrics?.payout ?? 0}`}
              hint={`Komissiya $${metrics?.commission ?? 0}`}
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
            <PanelCard
              title="Yangi so'rovlar"
              description="Yo'nalishingizga mos buyurtmalar — qabul qilsangiz mijozga tasdiq yuboriladi"
              action={
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/partner?tab=orders">Barchasi</Link>
                </Button>
              }
            >
              {(metrics?.open.length ?? 0) === 0 ? (
                <PanelEmpty
                  icon={ClipboardList}
                  title="Hozircha yangi so'rov yo'q"
                  description="Yangi so'rov tushganda bot xabar yuboradi va shu ro'yxat yangilanadi."
                />
              ) : (
                <ul className="flex flex-col gap-3">
                  {metrics?.open.slice(0, 4).map((booking) => (
                    <li
                      key={booking._id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-background px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold text-foreground">
                          {booking.title}
                        </p>
                        <p className="mt-0.5 text-[12px] text-muted-foreground">
                          {booking.startDate} · {booking.guests} kishi · {booking.city}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-foreground">
                          ${booking.totalPrice}
                        </span>
                        <Button
                          size="sm"
                          onClick={async () => {
                            try {
                              await claim({ bookingId: booking._id });
                              toast.success("Buyurtma qabul qilindi");
                            } catch (error) {
                              toast.error(
                                error instanceof Error ? error.message : "Amal bajarilmadi",
                              );
                            }
                          }}
                        >
                          Qabul qilish
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </PanelCard>

            <div className="flex flex-col gap-6">
              {isTransfer && (
                <PanelCard
                  title="Mashina holati"
                  description="Bot har kuni ertalab holatni so'raydi"
                >
                  <div className="rounded-xl border bg-background p-3">
                    <p className="text-[13px] font-semibold text-foreground">
                      {vehicle?.model ?? "Ko'rsatilmagan"} · {vehicle?.plate ?? "—"}
                    </p>
                    <p className="mt-0.5 text-[12px] text-muted-foreground">
                      {vehicle?.year ?? "—"} · {vehicle?.seats ?? "—"} o'rinli
                    </p>
                    <p className="mt-2 text-[12px] text-muted-foreground">
                      Oxirgi tekshiruv:{" "}
                      {vehicle?.conditionCheckedAt
                        ? new Date(vehicle.conditionCheckedAt).toLocaleString("uz-UZ")
                        : "hali yo'q"}
                    </p>
                    <p className="mt-1 text-[12px] font-semibold text-foreground">
                      Holat: {VEHICLE_LABELS[vehicle?.condition ?? "ok"]}
                    </p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(["ok", "service", "repair"] as const).map((state) => (
                      <Button
                        key={state}
                        size="sm"
                        variant={vehicle?.condition === state ? "default" : "outline"}
                        onClick={async () => {
                          try {
                            await reportVehicle({ condition: state });
                            toast.success("Mashina holati yangilandi");
                          } catch (error) {
                            toast.error(error instanceof Error ? error.message : "Xatolik");
                          }
                        }}
                      >
                        {VEHICLE_LABELS[state]}
                      </Button>
                    ))}
                  </div>
                </PanelCard>
              )}

              <PanelCard title="Bot ulanishi" description="Telegram akkauntni profilga bog'lang">
                <p className="text-[13px] leading-5 text-muted-foreground">
                  {provider.telegramId
                    ? `Ulangan: @${provider.telegramUsername ?? provider.telegramId}`
                    : "Hali ulanmagan — havolani ochib botda tasdiqlang."}
                </p>
                <Button
                  variant="outline"
                  className="mt-3"
                  onClick={async () => {
                    try {
                      const result = await linkCode();
                      window.open(result.deepLink, "_blank", "noreferrer");
                      toast.success("Havola yaratildi");
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "Xatolik");
                    }
                  }}
                >
                  <Bot className="size-4" aria-hidden="true" />
                  Botga ulanish havolasi
                </Button>
              </PanelCard>

              {provider.direction === "artisan" && (
                <PanelCard title="Mahsulot statistikasi" description="Do'kondagi holat">
                  <ul className="flex flex-col gap-2 text-[13px] text-muted-foreground">
                    <li className="flex items-center justify-between">
                      <span>Faol mahsulotlar</span>
                      <span className="font-semibold text-foreground">
                        {items?.filter((i) => i.status === "approved").length ?? 0}
                      </span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Moderatsiyada</span>
                      <span className="font-semibold text-foreground">
                        {items?.filter((i) => i.status === "pending").length ?? 0}
                      </span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Oylik obuna</span>
                      <span className="font-semibold text-foreground">${provider.monthlyFee}</span>
                    </li>
                  </ul>
                </PanelCard>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === "orders" && (
        <div className="flex flex-col gap-6">
          <PanelCard
            title="Milly AI biriktirgan vazifalar"
            description="Tur dasturi bo'yicha sizga tushgan aniq topshiriqlar — bot ham shu ro'yxatni yuboradi"
          >
            {(myTasks ?? []).length === 0 ? (
              <PanelEmpty
                icon={Bot}
                title="Hozircha vazifa yo'q"
                description="Mijoz AI dasturini tasdiqlaganda mehmonxona, gid, transfer, tarjimon va fotograf vazifalari avtomatik taqsimlanadi."
              />
            ) : (
              <ul className="flex flex-col gap-3">
                {(myTasks ?? []).map((task) => (
                  <li
                    key={task._id}
                    className="flex flex-wrap items-start justify-between gap-3 rounded-xl border bg-background p-3.5"
                  >
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-foreground">
                        {task.role} · {task.scheduledFor} · {task.city}
                      </p>
                      <p className="mt-1 text-[12px] leading-5 text-muted-foreground">
                        {task.task}
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        Bron: {task.bookingReference} · {task.guests} kishi · {task.days} kun ·
                        To'lov: ${task.amount}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <StatusBadge status={task.status} />
                      <div className="flex gap-2">
                        {task.status === "assigned" || task.status === "notified" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              try {
                                await setAssignmentStatus({
                                  assignmentId: task._id,
                                  status: "accepted",
                                });
                                toast.success("Vazifa qabul qilindi");
                              } catch (error) {
                                toast.error(error instanceof Error ? error.message : "Xatolik");
                              }
                            }}
                          >
                            <Check className="size-3.5" aria-hidden="true" />
                            Qabul qilish
                          </Button>
                        ) : null}
                        {task.status !== "done" && task.status !== "declined" && (
                          <Button
                            size="sm"
                            onClick={async () => {
                              try {
                                await setAssignmentStatus({
                                  assignmentId: task._id,
                                  status: "done",
                                });
                                toast.success("Vazifa bajarildi deb belgilandi");
                              } catch (error) {
                                toast.error(error instanceof Error ? error.message : "Xatolik");
                              }
                            }}
                          >
                            Bajardim
                          </Button>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </PanelCard>

          <PanelCard
            title="Menga biriktirilgan buyurtmalar"
            description="Qabul qilingan va bajarilgan ishlar"
          >
            {(metrics?.assigned.length ?? 0) === 0 ? (
              <PanelEmpty
                icon={ClipboardList}
                title="Biriktirilgan buyurtma yo'q"
                description="Yangi so'rovlardan birini qabul qiling — shu yerga o'tadi."
              />
            ) : (
              <PanelTable head={["Kod", "Buyurtma", "Sana", "Kishi", "Summa", "Holat", ""]}>
                {metrics?.assigned.map((booking) => (
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
                    <td className="py-3 text-[13px] text-muted-foreground">{booking.startDate}</td>
                    <td className="py-3 text-[13px] text-muted-foreground">{booking.guests}</td>
                    <td className="py-3 text-[13px] font-semibold text-foreground">
                      ${booking.totalPrice}
                    </td>
                    <td className="py-3">
                      <StatusBadge status={booking.status} />
                    </td>
                    <td className="py-3 text-right">
                      {booking.status !== "completed" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            try {
                              await setStatus({ bookingId: booking._id, status: "completed" });
                              toast.success("Buyurtma bajarildi deb belgilandi");
                            } catch (error) {
                              toast.error(error instanceof Error ? error.message : "Xatolik");
                            }
                          }}
                        >
                          Bajardim
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </PanelTable>
            )}
          </PanelCard>

          <PanelCard title="Ochiq so'rovlar" description="Yo'nalishingiz bo'yicha kutayotgan so'rovlar">
            {(metrics?.open.length ?? 0) === 0 ? (
              <PanelEmpty icon={ClipboardList} title="Ochiq so'rov yo'q" />
            ) : (
              <PanelTable head={["Kod", "So'rov", "Sana", "Kishi", "Summa", ""]}>
                {metrics?.open.map((booking) => (
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
                    <td className="py-3 text-[13px] text-muted-foreground">{booking.startDate}</td>
                    <td className="py-3 text-[13px] text-muted-foreground">{booking.guests}</td>
                    <td className="py-3 text-[13px] font-semibold text-foreground">
                      ${booking.totalPrice}
                    </td>
                    <td className="py-3 text-right">
                      <Button
                        size="sm"
                        onClick={async () => {
                          try {
                            await claim({ bookingId: booking._id });
                            toast.success("Buyurtma qabul qilindi");
                          } catch (error) {
                            toast.error(error instanceof Error ? error.message : "Xatolik");
                          }
                        }}
                      >
                        Qabul qilish
                      </Button>
                    </td>
                  </tr>
                ))}
              </PanelTable>
            )}
          </PanelCard>
        </div>
      )}

      {tab === "bot" && (
        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <PanelCard
            title="Bot menyusi"
            description="Yo'nalishingizga moslab tuzilgan funksiyalar — botda ham xuddi shunday"
          >
            <ul className="flex flex-col gap-2">
              {(menuPreview?.screens ?? []).map((screen) => (
                <li key={screen.key} className="rounded-xl border bg-background p-3">
                  <p className="text-[13px] font-semibold text-foreground">{screen.title}</p>
                  <p className="mt-0.5 text-[12px] leading-5 text-muted-foreground">
                    {screen.body}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {screen.buttons.map((b) => (
                      <span
                        key={b.action}
                        className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground"
                      >
                        {b.label}
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </PanelCard>

          <div className="flex flex-col gap-6">
            <PanelCard title="Bot holati" description="Tokenlar va webhook">
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
                  <span className="text-muted-foreground">Ulangan akkaunt</span>
                  <span className="font-semibold text-foreground">
                    {provider.telegramId ? `@${provider.telegramUsername ?? provider.telegramId}` : "—"}
                  </span>
                </li>
              </ul>
              <p className="mt-3 text-[12px] leading-5 text-muted-foreground">
                Tokenlar administrator panelidan yoki <code>{botConfig?.envKeys.auth}</code> kaliti
                orqali sozlanadi.
              </p>
            </PanelCard>

            <PanelCard title="Bot jurnali" description="Bot orqali bajarilgan oxirgi amallar">
              {!events || events.length === 0 ? (
                <PanelEmpty
                  icon={Bot}
                  title="Hodisalar yo'q"
                  description="Bot ulangach, buyurtmalar va holat o'zgarishlari shu yerda qayd etiladi."
                />
              ) : (
                <ul className="flex flex-col gap-2">
                  {events.map((event) => (
                    <li
                      key={event._id}
                      className="flex items-start justify-between gap-3 rounded-xl border bg-background px-3.5 py-2.5"
                    >
                      <div>
                        <p className="text-[12px] font-semibold text-foreground">{event.kind}</p>
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

      {tab === "products" && provider.direction === "artisan" && (
        <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
          <PanelCard title="Yangi mahsulot" description="Moderatsiyadan so'ng do'konda chiqadi">
            <div className="flex flex-col gap-3">
              <label className="block">
                <span className="text-xs font-semibold text-muted-foreground">Nomi</span>
                <Input
                  value={newItem.title}
                  onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                  placeholder="Rishton likopchasi — lakabi naqsh"
                  className="mt-1.5"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-muted-foreground">Kategoriya</span>
                <select
                  value={newItem.category}
                  onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                  className="mt-1.5 h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none"
                >
                  {["Kulolchilik", "To'qimachilik", "Zargarlik", "Yog'och", "Gilam"].map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-muted-foreground">Narx (USD)</span>
                <Input
                  type="number"
                  value={newItem.price}
                  onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                  placeholder="48"
                  className="mt-1.5"
                />
              </label>
              <Button
                onClick={async () => {
                  const price = Number(newItem.price);
                  if (!newItem.title || !price) {
                    toast.error("Nom va narxni kiriting");
                    return;
                  }
                  try {
                    await addItem({ title: newItem.title, category: newItem.category, price });
                    setNewItem({ title: "", category: newItem.category, price: "" });
                    toast.success("Mahsulot moderatsiyaga yuborildi");
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : "Xatolik");
                  }
                }}
              >
                <Plus className="size-4" aria-hidden="true" />
                Mahsulot qo'shish
              </Button>
            </div>
          </PanelCard>

          <PanelCard title="Mahsulotlarim" description="Holat va narxlar">
            {!items || items.length === 0 ? (
              <PanelEmpty
                icon={Package}
                title="Mahsulot qo'shilmagan"
                description="Botga «nomi | narxi | kategoriya» ko'rinishida yuborishingiz ham mumkin."
              />
            ) : (
              <PanelTable head={["Mahsulot", "Kategoriya", "Narx", "Holat"]}>
                {items.map((item) => (
                  <tr key={item._id}>
                    <td className="py-3 text-[13px] font-semibold text-foreground">{item.title}</td>
                    <td className="py-3 text-[13px] text-muted-foreground">{item.category}</td>
                    <td className="py-3 text-[13px] font-semibold text-foreground">
                      ${item.price}
                    </td>
                    <td className="py-3">
                      <StatusBadge status={item.status} />
                    </td>
                  </tr>
                ))}
              </PanelTable>
            )}
          </PanelCard>
        </div>
      )}

      {tab === "profile" && (
        <div className="grid gap-6 xl:grid-cols-2">
          <PanelCard title="Profil ma'lumotlari" description="Mijozlar shu ma'lumotni ko'radi">
            <ProfileForm
              initial={{
                businessName: provider.businessName,
                city: provider.city,
                phone: provider.phone,
                about: provider.about ?? "",
                telegramUsername: provider.telegramUsername ?? "",
              }}
              saving={savingProfile}
              onSave={async (values) => {
                setSavingProfile(true);
                try {
                  await updateProfile(values);
                  toast.success("Profil saqlandi");
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Xatolik");
                } finally {
                  setSavingProfile(false);
                }
              }}
            />
          </PanelCard>

          <div className="flex flex-col gap-6">
            <PanelCard
              title="Yo'nalish ma'lumotlari"
              description={PARTNER_DIRECTIONS.find((d) => d.id === provider.direction)?.summary}
            >
              <ul className="flex flex-col gap-2 text-[13px]">
                <li className="flex items-center justify-between">
                  <span className="text-muted-foreground">Yo'nalish</span>
                  <span className="font-semibold text-foreground">
                    {PARTNER_DIRECTIONS.find((d) => d.id === provider.direction)?.label}
                  </span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tillar</span>
                  <span className="font-semibold text-foreground">
                    {(provider.languages ?? ["UZ"]).join(" · ")}
                  </span>
                </li>
                {provider.licenseNumber && (
                  <li className="flex items-center justify-between">
                    <span className="text-muted-foreground">Litsenziya</span>
                    <span className="font-semibold text-foreground">{provider.licenseNumber}</span>
                  </li>
                )}
                {isTransfer && (
                  <li className="flex items-center justify-between">
                    <span className="text-muted-foreground">Mashina</span>
                    <span className="font-semibold text-foreground">
                      {vehicle?.model} · {vehicle?.plate}
                    </span>
                  </li>
                )}
                {provider.direction === "hotel" && (
                  <li className="flex items-center justify-between">
                    <span className="text-muted-foreground">Xonalar</span>
                    <span className="font-semibold text-foreground">{provider.rooms ?? "—"}</span>
                  </li>
                )}
                <li className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tajriba</span>
                  <span className="font-semibold text-foreground">
                    {provider.experienceYears ? `${provider.experienceYears} yil` : "—"}
                  </span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-muted-foreground">Millytour reytingi</span>
                  <span className="font-semibold text-foreground">
                    {provider.rating.toFixed(1)} · {provider.ratingCount} baho
                  </span>
                </li>
              </ul>
              <p className="mt-4 rounded-xl border border-dashed p-3 text-[12px] leading-5 text-muted-foreground">
                {provider.direction === "guide" &&
                  "Kalendar va tillar bo'yicha so'rovlar shu ma'lumot asosida taqsimlanadi."}
                {isTransfer &&
                  "Mashina holati har kuni yangilanadi — ta'mirda bo'lsa yangi buyurtma kelmaydi."}
                {provider.direction === "artisan" &&
                  "Mahsulotlar moderatsiyadan so'ng marketplace'da chiqadi; eksport hujjatlari panel orqali yuboriladi."}
                {provider.direction === "hotel" &&
                  "Xona fondi va narxlar saytga real vaqtda uzatiladi."}
              </p>
            </PanelCard>

            <PanelCard title="Obuna holati" description="Oylik to'lov ma'lumotlari">
              <ul className="flex flex-col gap-2 text-[13px]">
                <li className="flex items-center justify-between">
                  <span className="text-muted-foreground">Oylik to'lov</span>
                  <span className="font-semibold text-foreground">${provider.monthlyFee}</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-muted-foreground">Holat</span>
                  <StatusBadge status={provider.subscription} />
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-muted-foreground">Amal qiladi</span>
                  <span className="font-semibold text-foreground">
                    {provider.paidUntil
                      ? new Date(provider.paidUntil).toLocaleDateString("uz-UZ")
                      : "—"}
                  </span>
                </li>
              </ul>
            </PanelCard>
          </div>
        </div>
      )}

      {tab === "billing" && (
        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <PanelCard title="Hisob-kitob" description="Bajarilgan buyurtmalar bo'yicha">
            <div className="grid gap-4 sm:grid-cols-2">
              <StatCard
                icon={Wallet}
                label="Daromad"
                value={`$${metrics?.revenue ?? 0}`}
                hint="Bajarilgan buyurtmalar"
              />
              <StatCard
                icon={CreditCard}
                label="Komissiya (12%)"
                value={`$${metrics?.commission ?? 0}`}
                tone="gold"
                hint="Platforma ulushi"
              />
              <StatCard
                icon={TrendingUpIcon}
                label="To'lanadigan"
                value={`$${metrics?.payout ?? 0}`}
                tone="eco"
                hint="Hisobingizga o'tadi"
              />
              <StatCard
                icon={Store}
                label="Oylik obuna"
                value={`$${provider.monthlyFee}`}
                hint="Click / Payme orqali"
              />
            </div>
            <div className="mt-5 rounded-xl border border-dashed p-4 text-[12px] leading-5 text-muted-foreground">
              To'lovlar har oyning 5-sanasida amalga oshiriladi. Obuna Click, Payme yoki karta
              orqali to'lanishi mumkin; obuna faol bo'lmasa yangi buyurtmalar to'xtatiladi.
            </div>
          </PanelCard>

          <PanelCard title="Tariflar" description="Obuna turini tanlash">
            <ul className="flex flex-col gap-3">
              {[
                { name: "Start", price: provider.monthlyFee, perms: ["Buyurtmalar oqimi", "Bot paneli"] },
                {
                  name: "Pro",
                  price: provider.monthlyFee * 2,
                  perms: ["Ustuvor reyting", "Statistika hisobotlari", "Komissiya 10%"],
                },
                {
                  name: "Business",
                  price: provider.monthlyFee * 4,
                  perms: ["Jamoa akkauntlari", "API integratsiya", "Komissiya 8%"],
                },
              ].map((plan) => (
                <li
                  key={plan.name}
                  className={cn(
                    "rounded-xl border p-4",
                    plan.name === "Start" && "border-primary bg-primary/5",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[13px] font-semibold text-foreground">{plan.name}</p>
                    <p className="text-[13px] font-bold text-foreground">${plan.price}/oy</p>
                  </div>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {plan.perms.map((perm) => (
                      <li
                        key={perm}
                        className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground"
                      >
                        {perm}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </PanelCard>
        </div>
      )}
    </PanelShell>
  );
}

function TrendingUpIcon({ className }: { className?: string }) {
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
      <path d="M3 17l6-6 4 4 8-8" />
      <path d="M15 7h6v6" />
    </svg>
  );
}

function ProfileForm({
  initial,
  saving,
  onSave,
}: {
  initial: {
    businessName: string;
    city: string;
    phone: string;
    about: string;
    telegramUsername: string;
  };
  saving: boolean;
  onSave: (values: {
    businessName: string;
    city: string;
    phone: string;
    about?: string;
    telegramUsername?: string;
  }) => Promise<void>;
}) {
  const [values, setValues] = useState(initial);

  return (
    <div className="flex flex-col gap-3">
      <label className="block">
        <span className="text-xs font-semibold text-muted-foreground">Biznes nomi</span>
        <Input
          value={values.businessName}
          onChange={(e) => setValues({ ...values, businessName: e.target.value })}
          className="mt-1.5"
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-semibold text-muted-foreground">Shahar</span>
          <Input
            value={values.city}
            onChange={(e) => setValues({ ...values, city: e.target.value })}
            className="mt-1.5"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-muted-foreground">Telefon</span>
          <Input
            value={values.phone}
            onChange={(e) => setValues({ ...values, phone: e.target.value })}
            className="mt-1.5"
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-xs font-semibold text-muted-foreground">Telegram username</span>
          <Input
            value={values.telegramUsername}
            onChange={(e) => setValues({ ...values, telegramUsername: e.target.value })}
            className="mt-1.5"
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-xs font-semibold text-muted-foreground">Faoliyat haqida</span>
          <textarea
            value={values.about}
            onChange={(e) => setValues({ ...values, about: e.target.value })}
            rows={3}
            className="mt-1.5 w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus-visible:border-primary/50 focus-visible:ring-[3px] focus-visible:ring-ring/30"
          />
        </label>
      </div>
      <Button
        className="self-start"
        disabled={saving}
        onClick={() =>
          onSave({
            businessName: values.businessName,
            city: values.city,
            phone: values.phone,
            about: values.about || undefined,
            telegramUsername: values.telegramUsername || undefined,
          })
        }
      >
        {saving ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : "Saqlash"}
      </Button>
    </div>
  );
}
