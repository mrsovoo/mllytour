import { useState } from "react";
import { Link } from "react-router";
import { useRestMutation, useRestQuery } from "@/api/client";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowRight,
  BadgeCheck,
  Bot,
  Camera,
  CarFront,
  Check,
  Languages,
  Loader2,
  Send,
  Store,
  Ticket,
  UserRound,
  BedDouble,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Container, PageHero } from "@/components/site";
import {
  PARTNER_BOT_USERNAME,
  PARTNER_DIRECTIONS,
  partnerBotLink,
  type Direction,
} from "@/data/catalog";
import { cn } from "@/lib/utils";

const DIRECTION_ICONS: Record<Direction, React.ElementType> = {
  guide: UserRound,
  transfer: CarFront,
  artisan: Store,
  hotel: BedDouble,
  translator: Languages,
  photographer: Camera,
  restaurant: UtensilsCrossed,
  other: Ticket,
};

const STEPS = [
  {
    title: "Auth botga o'ting",
    text: `Telegram'dagi @${PARTNER_BOT_USERNAME} (auth bot) ni oching va yo'nalishingizni tanlang.`,
  },
  {
    title: "Ma'lumotlarni kiriting",
    text: "Biznes nomi, shahar, aloqa, tajriba va hajm — bot oxirida mos tarifni tavsiya qiladi.",
  },
  {
    title: "Tasdiqlashni kuting",
    text: "Administrator hujjatlarni tekshiradi va profilni tasdiqlaydi.",
  },
  {
    title: "Panelga ulanish",
    text: "Tasdiqlangach buyurtmalar botga tushadi, saytdagi panelda esa to'liq nazorat bo'ladi.",
  },
];

export default function Partners() {
  const [direction, setDirection] = useState<Direction>("guide");
  const config = useRestQuery("telegram", "config");
  const menuPreview = useRestQuery("telegram", "menuPreview", { direction });
  const questionSet = useRestQuery<{ direction: Direction; questions: string[]; aiIntro: string }>(
    "providers",
    "questions",
    { direction },
  );
  const submitLead = useRestMutation("providers", "submitLead");

  const [form, setForm] = useState({
    businessName: "",
    contactName: "",
    phone: "",
    city: "",
    telegramUsername: "",
    note: "",
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [directionAnswers, setDirectionAnswers] = useState<Record<string, string>>({});

  const active = PARTNER_DIRECTIONS.find((d) => d.id === direction)!;
  const botLink = config?.authDeepLink ?? partnerBotLink();

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSending(true);
    try {
      await submitLead({ direction, ...form, directionAnswers });
      setSent(true);
      toast.success("So'rov yuborildi — 1 ish kuni ichida bog'lanamiz");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "So'rov yuborilmadi");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <PageHero
        eyebrow="Hamkorlik"
        title="Millytour hamkori bo'ling — yo'nalishingizga mos boshqaruv paneli bilan"
        description={`Gid, transfer, tarjimon, fotograf, hunarmand yoki mehmonxona egasimisiz? @${PARTNER_BOT_USERNAME} (auth bot) orqali ro'yxatdan o'ting va buyurtmalarni o'z bot hamda panelingizda boshqaring.`}
      >
        <div className="flex flex-wrap gap-3">
          <Button size="lg" className="bg-gold text-gold-foreground hover:bg-gold/90" asChild>
            <a href={botLink} target="_blank" rel="noreferrer">
              <Send className="size-4" aria-hidden="true" />
              Auth bot orqali ro'yxatdan o'tish
            </a>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
            asChild
          >
            <Link to="/partner">Panelni ko'rish</Link>
          </Button>
        </div>
      </PageHero>

      <Container className="py-12 lg:py-16">
        {/* ------------------------------ yo'nalishlar ------------------------------ */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PARTNER_DIRECTIONS.map((item) => {
            const Icon = DIRECTION_ICONS[item.id];
            const isActive = item.id === direction;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setDirection(item.id);
                  setDirectionAnswers({});
                }}
                className={cn(
                  "flex h-full flex-col rounded-2xl border bg-card p-5 text-left transition-all",
                  isActive
                    ? "border-primary shadow-soft"
                    : "hover:-translate-y-0.5 hover:shadow-xs",
                )}
              >
                <span
                  className={cn(
                    "grid size-11 place-items-center rounded-xl",
                    isActive ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary",
                  )}
                >
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <h2 className="mt-4 text-[15px] font-semibold text-foreground">{item.label}</h2>
                <p className="mt-1 flex-1 text-[13px] leading-5 text-muted-foreground">
                  {item.summary}
                </p>
                <p className="mt-3 text-sm font-bold text-foreground">
                  ${item.monthlyFee}
                  <span className="ml-1 text-[11px] font-normal text-muted-foreground">/ oy</span>
                </p>
              </button>
            );
          })}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          {/* ------------------------------- afzalliklar ------------------------------ */}
          <Card className="border-border/70">
            <CardContent className="py-6">
              <div className="flex items-center gap-2">
                <BadgeCheck className="size-5 text-primary" aria-hidden="true" />
                <h2 className="text-[15px] font-semibold text-foreground">
                  {active.label} panelida nimalar bor
                </h2>
              </div>
              <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
                {active.perks.map((perk) => (
                  <li key={perk} className="flex items-start gap-2 text-[13px] text-foreground">
                    <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-eco/15">
                      <Check className="size-2.5 text-eco" aria-hidden="true" />
                    </span>
                    {perk}
                  </li>
                ))}
              </ul>

              {config && !config.configured.auth && (
                <div className="mt-5 rounded-xl border border-dashed bg-muted/50 p-4">
                  <p className="inline-flex items-center gap-2 text-[13px] font-semibold text-foreground">
                    <Bot className="size-4 text-primary" aria-hidden="true" />
                    Bot tokenlari hali ulanmagan
                  </p>
                  <p className="mt-1 text-[12px] leading-5 text-muted-foreground">
                    Platforma administratori <code>{config.envKeys.main}</code> va{" "}
                    <code>{config.envKeys.auth}</code> kalitlarini qo'shgach, bot avtomatik ishga
                    tushadi va webhook ro'yxatdan o'tadi.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* --------------------------------- bot menyu ------------------------------- */}
          <Card className="relative overflow-hidden border-border/70">
            <CardContent className="relative py-6">
              <div className="flex items-center gap-2">
                <Bot className="size-5 text-primary" aria-hidden="true" />
                <h2 className="text-[15px] font-semibold text-foreground">
                  {active.label} uchun bot funksiyalari
                </h2>
              </div>
              <p className="mt-1 text-[13px] leading-5 text-muted-foreground">
                Bot menyusi yo'nalishga moslab avtomatik tuziladi — saytdagi panel bilan bir xil
                ma'lumotdan.
              </p>
              <ul className="mt-4 flex flex-col gap-2">
                {(menuPreview?.screens ?? []).map((screen) => (
                  <li
                    key={screen.key}
                    className="rounded-xl border bg-background px-3.5 py-2.5 text-[13px]"
                  >
                    <p className="font-semibold text-foreground">{screen.title}</p>
                    <p className="mt-0.5 text-[12px] leading-5 text-muted-foreground">
                      {screen.body}
                    </p>
                  </li>
                ))}
                {!menuPreview && (
                  <li className="text-[13px] text-muted-foreground">Yuklanmoqda…</li>
                )}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* ---------------------------------- qadamlar -------------------------------- */}
        <div className="mt-12">
          <h2 className="text-lg font-semibold text-foreground">Ro'yxatdan o'tish qanday kechadi</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                className="rounded-2xl border bg-card p-5"
              >
                <span className="grid size-8 place-items-center rounded-full bg-gold text-[13px] font-bold text-gold-foreground">
                  {i + 1}
                </span>
                <p className="mt-3 text-sm font-semibold text-foreground">{step.title}</p>
                <p className="mt-1 text-[13px] leading-5 text-muted-foreground">{step.text}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ---------------------------------- so'rov ---------------------------------- */}
        <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Bot orqali o'tolmadimi? So'rov qoldiring
            </h2>
            <p className="mt-2 max-w-lg text-[15px] leading-6 text-muted-foreground">
              Formani to'ldiring — hamkorlik bo'limi siz bilan bog'lanadi, hujjatlarni tekshiradi
              va botga ulanish havolasini yuboradi. Turistlar uchun esa saytdan ro'yxatdan o'tish
              yetarli.
            </p>
            <ul className="mt-5 flex flex-col gap-3 text-[13px] text-foreground">
              <li className="flex items-center gap-2">
                <Wallet className="size-4 text-primary" aria-hidden="true" />
                Oylik obuna: gid $29 · transfer $39 · hunarmand $19 · mehmonxona $49
              </li>
              <li className="flex items-center gap-2">
                <Bot className="size-4 text-primary" aria-hidden="true" />
                Buyurtmalar botga va panelga bir vaqtda tushadi
              </li>
              <li className="flex items-center gap-2">
                <BadgeCheck className="size-4 text-primary" aria-hidden="true" />
                Komissiya faqat bajarilgan buyurtmadan olinadi (12%)
              </li>
            </ul>

            <div className="mt-6 rounded-2xl border border-dashed p-4">
              <p className="text-[13px] font-semibold text-foreground">
                Saytdan faqat turistlar ro'yxatdan o'tadi
              </p>
              <p className="mt-1 text-[13px] leading-5 text-muted-foreground">
                Turist hisobi orqali buyurtmalar, vaucherlar va AI dasturlar saqlanadi.
              </p>
              <Button variant="outline" size="sm" className="mt-3" asChild>
                <Link to="/auth?returnTo=%2Fdashboard">
                  Turist sifatida ro'yxatdan o'tish
                  <ArrowRight className="size-3.5" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>

          <Card className="border-border/70">
            <CardContent className="py-6">
              {sent ? (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <span className="grid size-12 place-items-center rounded-full bg-eco/15">
                    <Check className="size-6 text-eco" aria-hidden="true" />
                  </span>
                  <p className="text-sm font-semibold text-foreground">
                    So'rovingiz qabul qilindi
                  </p>
                  <p className="max-w-sm text-[13px] leading-5 text-muted-foreground">
                    Mutaxassis 1 ish kuni ichida bog'lanadi. Tezroq boshlash uchun
                    @{PARTNER_BOT_USERNAME} da ro'yxatdan o'ting.
                  </p>
                  <Button asChild>
                    <a href={botLink} target="_blank" rel="noreferrer">
                      <Send className="size-4" aria-hidden="true" />
                      Auth botni ochish
                    </a>
                  </Button>
                </div>
              ) : (
                <form onSubmit={submit} className="flex flex-col gap-3">
                  {questionSet && (
                    <div className="rounded-2xl border border-primary/15 bg-primary/[0.035] p-4">
                      <p className="text-sm font-semibold text-foreground">AI yo'nalish savollari</p>
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
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="text-xs font-semibold text-muted-foreground">
                        Biznes / ustaxona nomi
                      </span>
                      <Input
                        required
                        value={form.businessName}
                        onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                        placeholder="Zarafshon Transfer"
                        className="mt-1.5"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-semibold text-muted-foreground">
                        Mas'ul shaxs
                      </span>
                      <Input
                        required
                        value={form.contactName}
                        onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                        placeholder="Aziz Karimov"
                        className="mt-1.5"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-semibold text-muted-foreground">
                        Telefon raqami
                      </span>
                      <Input
                        required
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="+998 90 123 45 67"
                        className="mt-1.5"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-semibold text-muted-foreground">Shahar</span>
                      <Input
                        required
                        value={form.city}
                        onChange={(e) => setForm({ ...form, city: e.target.value })}
                        placeholder="Buxoro"
                        className="mt-1.5"
                      />
                    </label>
                    <label className="block sm:col-span-2">
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
                    <label className="block sm:col-span-2">
                      <span className="text-xs font-semibold text-muted-foreground">
                        Qo'shimcha izoh
                      </span>
                      <textarea
                        value={form.note}
                        onChange={(e) => setForm({ ...form, note: e.target.value })}
                        rows={3}
                        placeholder="Xizmat turlari, tillar, mashina yoki xona fondi haqida"
                        className="mt-1.5 w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus-visible:border-primary/50 focus-visible:ring-[3px] focus-visible:ring-ring/30"
                      />
                    </label>
                  </div>
                  <input type="hidden" value={direction} readOnly />
                  <p className="text-[12px] text-muted-foreground">
                    Tanlangan yo'nalish:{" "}
                    <span className="font-semibold text-foreground">{active.label}</span>
                  </p>
                  <Button type="submit" size="lg" disabled={sending}>
                    {sending ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <>
                        So'rov yuborish
                        <ArrowRight className="size-4" aria-hidden="true" />
                      </>
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </Container>
    </>
  );
}
