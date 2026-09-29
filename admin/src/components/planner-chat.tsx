import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { useRestAction, useRestMutation } from "@/api/client";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  Check,
  CreditCard,
  ExternalLink,
  Loader2,
  Phone,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CITIES, TOUR_PACKAGES } from "@/data/catalog";
import {
  INTEREST_OPTIONS,
  PLAN_QUESTIONS,
  PLAN_VARIANT_META,
  type InterestId,
  type Plan,
  type PlannerAnswers,
} from "@/lib/planner";
import { useAuth } from "@/hooks/use-auth";
import {
  recommendFromAnswers,
  recommendationReply,
  toRecommendationContext,
  type PackageRecommendation,
} from "@/lib/ai-recommend";
import { formatPrimary, Price, PriceInline } from "@/lib/currency";
import { cn } from "@/lib/utils";

type Specialist = {
  assignmentId: string;
  providerId: string;
  direction: string;
  role: string;
  task: string;
  amount: number;
  businessName: string;
  contactName?: string;
  phone: string;
  city: string;
  rating: number;
  ratingCount: number;
  completedOrders: number;
  experienceYears: number;
  languages: string[];
  about?: string;
  telegramUsername?: string;
  notified: boolean;
};

type BookResult = {
  bookingId: string;
  reference: string;
  paymentId: string;
  paymentReference: string;
  totalPrice: number;
  startDate: string;
  days: number;
  guests: number;
  specialists: Specialist[];
};

type ChatMessage =
  | { id: string; role: "bot"; text: string }
  | { id: string; role: "user"; text: string }
  | {
      id: string;
      role: "options";
      options: Plan[];
      engine: "ai" | "rule-based";
      chosenIndex: number | null;
    }
  | { id: string; role: "chosen"; plan: Plan; index: number; engine: "ai" | "rule-based" }
  | { id: string; role: "booked"; result: BookResult }
  | { id: string; role: "packages"; recommendations: PackageRecommendation[] }
  | { id: string; role: "offer"; offer: OfferPayload };

type Phase = "questions" | "options" | "feedback" | "booking" | "done";

/**
 * Milly AI tavsiyasi — faqat katalogdagi mavjud tur paketlar, narx bo'yicha
 * saralangan. Tashqi AI modeli bu ro'yxatni o'zgartirmaydi, u faqat matn yozadi.
 */
function RecommendedPackages({
  recommendations,
}: {
  recommendations: PackageRecommendation[];
}) {
  if (recommendations.length === 0) return null;
  return (
    <div className="space-y-2">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        <Sparkles className="size-3.5 text-primary" aria-hidden="true" />
        Katalogdagi mavjud paketlar · narx bo'yicha
      </p>
      {recommendations.map(({ tour, perPerson, total, reason }) => (
        <Link
          key={tour.slug}
          to={`/paketlar/${tour.slug}`}
          className="flex gap-3 rounded-2xl border bg-card p-2.5 transition-colors hover:border-primary/40 hover:bg-primary/5"
        >
          <img
            src={tour.image}
            alt={tour.alt}
            loading="lazy"
            decoding="async"
            className="size-16 shrink-0 rounded-xl object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="line-clamp-1 text-[13px] font-semibold text-foreground">{tour.title}</p>
            <p className="text-[11px] text-muted-foreground">
              {tour.city} · {tour.days} kun / {tour.nights} kecha
            </p>
            <p className="mt-0.5 text-[11px] leading-4 text-primary">{reason}</p>
            <div className="mt-1 flex flex-wrap items-end gap-x-3 gap-y-0.5">
              <Price usd={perPerson} suffix="/kishi" className="text-[13px]" />
              <span className="text-[11px] text-muted-foreground">jami {formatPrimary(total)}</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

const PAY_OPTIONS = [
  { id: "payme", label: "Payme" },
  { id: "click", label: "Click" },
  { id: "visa", label: "Visa" },
  { id: "mastercard", label: "Mastercard" },
] as const;

/** Milly AI taklif qilgan dastur: byudjet ichidagi xizmatlar ro'yxati. */
type OfferPayload = {
  city: string;
  startDate: string;
  days: number;
  guests: number;
  services: { direction: string; label: string; emoji: string; amount: number; on: boolean }[];
  total: number;
  summary: string;
  planId?: string;
  planTitle?: string;
  planSummary?: string;
};

/** Byudjet taqsimoti: tanlangan xizmatlarga ko'ra miqdorlar. */
function offerFromPlan(plan: Plan): OfferPayload {
  const days = plan.days.length;
  const has = (kw: string[]) =>
    plan.days.some((d) => d.items.some((i) => kw.some((k) => i.title.toLowerCase().includes(k))));
  const mention = (kw: string[]) =>
    plan.summary.toLowerCase().includes(kw[0]) ||
    plan.days.some((d) => kw.some((k) => d.title.toLowerCase().includes(k)));
  const share = (p: number) => Math.round(plan.estimate.total * p);
  const services: OfferPayload["services"] = [
    {
      direction: "hotel",
      label: "Mehmonxona",
      emoji: "🏨",
      amount: share(0.3),
      on: true,
    },
    {
      direction: "guide",
      label: "Gid",
      emoji: "🧭",
      amount: share(0.12),
      on: true,
    },
    {
      direction: "transfer",
      label: "Transfer",
      emoji: "🚐",
      amount: share(0.08),
      on: true,
    },
    {
      direction: "restaurant",
      label: "Ovqatlanish (restoran)",
      emoji: "🍽️",
      amount: share(0.1),
      on: mention(["taom", "osh", "restoran"]) || has(["choyxona", "restoran", "ovqat"]),
    },
    {
      direction: "translator",
      label: "Tarjimon",
      emoji: "🗣️",
      amount: share(0.06),
      on: false,
    },
    {
      direction: "photographer",
      label: "Fotograf",
      emoji: "📷",
      amount: share(0.06),
      on: has(["foto", "surat"]),
    },
  ];
  return {
    city: plan.cities[0] ?? "Samarqand",
    startDate: defaultStartDate(),
    days,
    guests: 2,
    services,
    total: plan.estimate.total,
    summary: plan.summary,
    planTitle: plan.title,
    planSummary: plan.summary,
  };
}

function newId() {
  return Math.random().toString(36).slice(2);
}

function readSessionKey() {
  if (typeof window === "undefined") {
    return "server";
  }
  const existing = window.sessionStorage.getItem("millytour.plan.session");
  if (existing) {
    return existing;
  }
  const created = `s-${newId()}${newId()}`;
  window.sessionStorage.setItem("millytour.plan.session", created);
  return created;
}

function defaultStartDate() {
  return new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().slice(0, 10);
}

export function answerLabel(id: keyof PlannerAnswers, value: unknown) {
  if (id === "interests") {
    const list = value as InterestId[];
    return list.map((i) => INTEREST_OPTIONS.find((o) => o.id === i)?.label ?? i).join(", ");
  }
  if (id === "city") {
    return String(value);
  }
  if (id === "budget") {
    return `$${value}`;
  }
  if (id === "days") {
    return `${value} kun`;
  }
  if (id === "travelers") {
    return `${value} kishi`;
  }
  if (id === "pace") {
    return value === "relaxed"
      ? "Sokin sur'at"
      : value === "intense"
        ? "To'yingan sur'at"
        : "Muvozanatli sur'at";
  }
  return String(value);
}

/**
 * Milly AI chat oqimi:
 *   1) savollar → 2) 2 xil dastur varianti → 3) variant tanlash →
 *   4) "to'liq maqulmi / kamchilik bormi?" → 5) tasdiqlash → bron + to'lov,
 *   mutaxassislar (mehmonxona, gid, transfer, tarjimon, fotograf) biriktiriladi.
 */
export function PlannerChat({ variant }: { variant: "widget" | "page" }) {
  const generate = useRestAction("aiPlanner", "generate");
  const freeChat = useRestAction("millyChat", "chat");
  const bookTour = useRestAction("millyChat", "bookTour");
  const rateReply = useRestMutation("aiMemory", "rateReply");
  const createFromPlan = useRestMutation("bookings", "createFromPlan");
  const startPayment = useRestMutation("payments", "start");
  const createCheckout = useRestAction("paymentGateway", "createCheckout");
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [key] = useState(readSessionKey);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<PlannerAnswers>>({});
  const [interestPick, setInterestPick] = useState<InterestId[]>([]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [phase, setPhase] = useState<Phase>("questions");
  const [options, setOptions] = useState<Plan[]>([]);
  const [planId, setPlanId] = useState<string | null>(null);
  const [engine, setEngine] = useState<"ai" | "rule-based">("rule-based");
  const [chosenIndex, setChosenIndex] = useState<number | null>(null);
  const [bookingForm, setBookingForm] = useState({
    startDate: defaultStartDate(),
    method: "payme" as (typeof PAY_OPTIONS)[number]["id"],
    phone: "",
  });
  const [booking, setBooking] = useState(false);
  const [bookResult, setBookResult] = useState<BookResult | null>(null);
  const [gatewayMessage, setGatewayMessage] = useState<string | null>(null);
  const [offer, setOffer] = useState<OfferPayload | null>(null);
  const [pendingMode, setPendingMode] = useState<"plan" | "chat">("plan");
  const historyRef = useRef<Array<{ role: "user" | "assistant"; content: string }>>([]);

  /** Initial state from "AI bilan qidirish" — stores search params in sessionStorage. */
  const [initialSearch] = useState<{ city: string; days: string; guests: string } | null>(() => {
    try {
      const raw = sessionStorage.getItem("millytour.ai.search");
      if (raw) {
        sessionStorage.removeItem("millytour.ai.search");
        return JSON.parse(raw);
      }
    } catch {
      // ignore
    }
    return null;
  });

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: newId(),
      role: "bot",
      text: initialSearch
        ? `${initialSearch.city} · ${initialSearch.days} kun · ${initialSearch.guests} kishi — Milly AI siz uchun dastur tuzmoqda...\n\nBir nechta savol beraman, so'ng 2 xil tayyor dastur taklif qilaman.`
        : "Assalomu alaykum! Men Milly AI — sayohat dasturingizni tuzaman.\n\nBir necha savol beraman, so'ng sizga 2 xil tayyor dastur taklif qilaman. Qaysi shahardan boshlaymiz?",
    },
  ]);

  const question = PLAN_QUESTIONS[step];
  const done = step >= PLAN_QUESTIONS.length;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pending, phase]);

  const push = (message: ChatMessage) => setMessages((prev) => [...prev, message]);

  const runGenerate = async (payload: Partial<PlannerAnswers>, fromFeedback = false) => {
    setPending(true);
    setPhase("options");
    try {
      const result = await generate({ sessionKey: key, answers: payload });
      const plans = (result.options ?? []) as Plan[];
      setOptions(plans);
      setPlanId(result.planId as string);
      setEngine(result.engine);
      setChosenIndex(null);
      push({
        id: newId(),
        role: "options",
        options: plans,
        engine: result.engine,
        chosenIndex: null,
      });
      push({
        id: newId(),
        role: "bot",
        text: fromFeedback
          ? "Istaklaringizga moslab qayta tuzdim 👇 Qaysi variantni tanlaysiz?"
          : "Mana 2 xil dastur varianti 👇\n\n" +
              "1-variant — komfort (yaxshiroq mehmonxona, sokin sur'at).\n" +
              "2-variant — tejamkor (ko'proq shahar va nuqta, arzon turar joy).\n\n" +
              "Qaysi birini ma'qul ko'rasiz? Variantni tanlang yoki istaklaringizni yozing.",
      });
      // Katalogdagi mavjud paketlar — narxga qarab tavsiya (AI kaliti kerak emas).
      const recommendations = recommendFromAnswers(payload, { limit: 3 });
      if (recommendations.length > 0) {
        push({ id: newId(), role: "packages", recommendations });
        push({
          id: newId(),
          role: "bot",
          text: recommendationReply(recommendations, payload),
        });
      }
    } catch (error) {
      console.warn(error);
      // Muhim: savollar bosqichiga qaytish — aks holda input abadiy bloklanadi.
      setStep(0);
      setPhase("questions");
      push({
        id: newId(),
        role: "bot",
        text:
          "Kechirasiz, dasturni tuzishda xatolik yuz berdi. Qaytadan boshlaymiz — qaysi shahardan sayohatni boshlaysiz?",
      });
    } finally {
      setPending(false);
    }
  };

  const answer = async (id: keyof PlannerAnswers, value: unknown, label: string) => {
    const next = { ...answers, [id]: value } as Partial<PlannerAnswers>;
    setAnswers(next);
    push({ id: newId(), role: "user", text: label });
    const nextStep = step + 1;
    setStep(nextStep);

    if (nextStep < PLAN_QUESTIONS.length) {
      const upcoming = PLAN_QUESTIONS[nextStep];
      push({
        id: newId(),
        role: "bot",
        text: upcoming.hint ? `${upcoming.prompt}\n${upcoming.hint}` : upcoming.prompt,
      });
      return;
    }
    await runGenerate(next);
  };

  const chooseOption = (index: number) => {
    const plan = options[index];
    if (!plan) {
      return;
    }
    setChosenIndex(index);
    setPhase("feedback");
    push({ id: newId(), role: "user", text: `${PLAN_VARIANT_META[index]?.label ?? index + 1} ni tanladim` });
    push({ id: newId(), role: "chosen", plan, index, engine });
    push({
      id: newId(),
      role: "bot",
      text:
        `Yaxshi tanlov! ${plan.title}\n\n` +
        "Dastur to'liq sizga ma'qul keldimi yoki kamchiliklari bormi? " +
        "Agar biror narsani o'zgartirmoqchi bo'lsangiz, xohishingizni yozib yuboring — dasturni qayta tuzaman.",
    });
    // Bron panelida ko'rinadigan xizmat taqsimoti (mehmonxona, gid, transfer...).
    setOffer({
      ...offerFromPlan(plan),
      planId: planId ?? undefined,
      planTitle: plan.title,
      planSummary: plan.summary,
    });
  };

  const submitFeedback = async (text: string) => {
    push({ id: newId(), role: "user", text: text });
    const next = { ...answers, feedback: text };
    setAnswers(next);
    await runGenerate(next, true);
  };

  const startBooking = () => {
    if (!planId || chosenIndex === null) {
      return;
    }
    setPhase("booking");
    push({
      id: newId(),
      role: "bot",
      text: "Ajoyib! Bron ma'lumotlarini to'ldiring — sanani va to'lov usulini tanlang, so'ng «Bron qilish» tugmasini bosing.",
    });
  };

  const submitBooking = async () => {
    if (!planId || chosenIndex === null) {
      return;
    }
    if (!isAuthenticated) {
      navigate(`/auth?returnTo=${encodeURIComponent(location.pathname + location.search)}`);
      return;
    }
    const startDate = bookingForm.startDate || defaultStartDate();
    setBooking(true);
    try {
      const result = (await createFromPlan({
        planId: planId as never,
        optionIndex: chosenIndex,
        startDate,
        paymentMethod: bookingForm.method,
        customerPhone: bookingForm.phone || undefined,
        specialRequests: answers.feedback,
      })) as unknown as BookResult;

      setBookResult(result);
      setPhase("done");
      push({ id: newId(), role: "booked", result });
      push({
        id: newId(),
        role: "bot",
        text:
          `Bron tayyor: ${result.reference} ✅\n\n` +
          `Mutaxassislar biriktirildi va ularga bot orqali vazifa yuborildi. ` +
          `To'lov: ${result.totalPrice} USD (${result.paymentReference}).\n\n` +
          `Buyurtma «Kabinet → Tarix» bo'limiga tushdi — u yerdan holat, mutaxassislar va sayohat pasportini kuzatishingiz mumkin.`,
      });
      toast.success(`Bron qabul qilindi · ${result.reference}`);
      void openCheckout(result.paymentId);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Bron qilinmadi");
      push({
        id: newId(),
        role: "bot",
        text: `Bron qilishda xatolik: ${error instanceof Error ? error.message : "noma'lum xato"}`,
      });
    } finally {
      setBooking(false);
    }
  };

  const openCheckout = async (paymentId: string) => {
    try {
      const result = await createCheckout({ paymentId: paymentId as never });
      setGatewayMessage(result.message);
      if (result.url) {
        window.open(result.url, "_blank", "noreferrer");
        toast.success("To'lov sahifasi yangi oynada ochildi");
      }
    } catch (error) {
      setGatewayMessage(
        error instanceof Error ? error.message : "To'lov sahifasini ochishda xatolik",
      );
    }
  };

  const retryPayment = async () => {
    if (!bookResult) {
      return;
    }
    try {
      const result = await startPayment({
        bookingId: bookResult.bookingId as never,
        method: bookingForm.method,
      });
      if (result.paymentId) {
        await openCheckout(result.paymentId as unknown as string);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "To'lovni boshlashda xatolik");
    }
  };

  /** Offer kartadagi «Bron qilish» — sessiyadagi eng so'nggi taklifni yuboradi. */
  const startOfferBooking = () => {
    if (!offer) {
      return;
    }
    setPhase("booking");
    push({
      id: newId(),
      role: "bot",
      text: "Sana va to'lov usulini tanlang — so'ng «Bron qilish va to'lovga o'tish»ni bosing.",
    });
  };

  /** Offer kartasidan bron — tanlangan xizmatlar bilan to'g'ridan-to'g'ri buyurtma. */
  const submitOfferBooking = async () => {
    if (!offer) {
      return;
    }
    if (!isAuthenticated) {
      navigate(`/auth?returnTo=${encodeURIComponent(location.pathname + location.search)}`);
      return;
    }
    const picked = offer.services.filter((s) => s.on);
    if (picked.length === 0) {
      toast.error("Kamida bitta xizmat tanlang");
      return;
    }
    setBooking(true);
    try {
      const result = (await bookTour({
        city: offer.city,
        startDate: offer.startDate || defaultStartDate(),
        days: offer.days,
        guests: offer.guests,
        services: picked.map((s) => ({ direction: s.direction, label: s.label })),
        totalPrice: offer.total,
        paymentMethod: bookingForm.method,
        customerPhone: bookingForm.phone || undefined,
        specialRequests: answers.feedback,
        planId: offer.planId as never,
        planTitle: offer.planTitle,
        planSummary: offer.planSummary,
      })) as unknown as BookResult;

      setBookResult(result);
      setPhase("done");
      push({ id: newId(), role: "booked", result });
      push({
        id: newId(),
        role: "bot",
        text:
          `Bron tayyor: ${result.reference} ✅\n\n` +
          `Tanlangan xizmatlar bo'yicha mutaxassislar biriktirildi — vazifalar bot orqali ularga yuborildi. ` +
          `To'lov: $${result.totalPrice} (${result.paymentReference}).\n\n` +
          `Kabinetda (/dashboard) holat va to'lovni kuzatishingiz mumkin.`,
      });
      toast.success(`Bron qabul qilindi · ${result.reference}`);
      void openCheckout(result.paymentId);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Bron qilinmadi");
      push({
        id: newId(),
        role: "bot",
        text: `Bron qilishda xatolik: ${error instanceof Error ? error.message : "noma'lum xato"}`,
      });
    } finally {
      setBooking(false);
    }
  };

  const reset = () => {
    setStep(0);
    setAnswers({});
    setInterestPick([]);
    setDraft("");
    setOptions([]);
    setPlanId(null);
    setChosenIndex(null);
    setBookResult(null);
    setGatewayMessage(null);
    setOffer(null);
    setPhase("questions");
    setMessages([
      {
        id: newId(),
        role: "bot",
        text: "Yangi dastur tuzamiz. Qaysi shahardan boshlaymiz?",
      },
    ]);
  };

  /**
   * Erkin chat: tur tanlashdan tashqari istalgan savol. Xabar tili avtomatik
   * aniqlanadi va javob shu tilda qaytadi (AI javob bermasa — yo'naltiruvchi
   * zaxira javob). Chat hech qachon qotib qolmaydi.
   */
  const sendFreeChat = async (text: string) => {
    push({ id: newId(), role: "user", text });
    historyRef.current = [
      ...historyRef.current,
      { role: "user" as const, content: text },
    ].slice(-8);
    setPendingMode("chat");
    setPending(true);
    try {
      const result = await freeChat({
        message: text,
        sessionKey: key,
        // AI modeli faqat shu ro'yxatdagi paketlarni tavsiya qilishi mumkin —
        // o'zidan yangi tur yoki narx o'ylab topmaydi.
        catalog: toRecommendationContext(recommendFromAnswers(answers, { limit: 5 })),
        history: historyRef.current.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      });
      const reply = result.reply || "Kechirasiz, javob topilmadi — boshqacha so'rab ko'ring.";
      push({ id: newId(), role: "bot", text: reply });
      historyRef.current = [
        ...historyRef.current,
        { role: "assistant" as const, content: reply },
      ].slice(-8);
      // AI dastur kontekstini aniqladi — to'g'ridan-to'g'ri bron paneliga o'tamiz.
      if (result.offer && !bookResult) {
        const nextOffer: OfferPayload = {
          ...result.offer,
          services: result.offer.services.map((s) => ({ ...s, on: true })),
          planId: planId ?? undefined,
          planTitle: options[chosenIndex ?? 0]?.title ?? result.offer.summary.slice(0, 60),
          planSummary: result.offer.summary,
        };
        setOffer(nextOffer);
        setPhase("booking");
        push({
          id: newId(),
          role: "bot",
          text:
            "Dastur tayyor! 👇 Quyida xizmatlarni ko'rasiz — keraklisini belgilab, " +
            "sana va to'lov usulini tanlab «Bron qilish»ni bosing. Mutaxassislar " +
            "biriktiriladi va ularga vazifa bot orqali yuboriladi.",
        });
      }
    } catch {
      push({
        id: newId(),
        role: "bot",
        text: "Aloqada muammo bo'ldi. Qaytadan yozing — yoki tur dasturi uchun savollarga javob bering.",
      });
    } finally {
      setPending(false);
    }
  };

  /** Joriy savolga berilgan matn javob bo'la oladimi (aks holda erkin chat). */
  const matchCurrentQuestion = (text: string): { ok: true; id: keyof PlannerAnswers; value: unknown; label: string } | { ok: false } => {
    if (!question) {
      return { ok: false };
    }
    const lower = text.toLowerCase();
    if (question.type === "city") {
      const city = CITIES.find((c) => c.toLowerCase() === lower || lower.includes(c.toLowerCase()));
      return city ? { ok: true, id: "city", value: city, label: city } : { ok: false };
    }
    if (question.type === "days" || question.type === "travelers" || question.type === "budget") {
      const numeric = Number(text.replace(/[^0-9]/g, ""));
      if (!numeric || numeric <= 0) {
        return { ok: false };
      }
      return { ok: true, id: question.id, value: numeric, label: answerLabel(question.id, numeric) };
    }
    if (question.type === "pace") {
      const option = question.options?.find(
        (o) => o.label.toLowerCase() === lower || o.value === lower,
      );
      if (option) {
        return { ok: true, id: "pace", value: option.value, label: option.label };
      }
      if (/sokin|relaxed/.test(lower)) {
        return { ok: true, id: "pace", value: "relaxed", label: "Sokin sur'at" };
      }
      if (/to'yingan|intense|toyin/.test(lower)) {
        return { ok: true, id: "pace", value: "intense", label: "To'yingan sur'at" };
      }
      if (/muvozanat|balanced/.test(lower)) {
        return { ok: true, id: "pace", value: "balanced", label: "Muvozanatli sur'at" };
      }
      return { ok: false };
    }
    if (question.type === "interests") {
      const picked = INTEREST_OPTIONS.filter((o) => lower.includes(o.label.toLowerCase().slice(0, 6)));
      if (picked.length === 0) {
        return { ok: false };
      }
      const ids = picked.map((p) => p.id);
      return { ok: true, id: "interests", value: ids, label: answerLabel("interests", ids) };
    }
    return { ok: true, id: question.id, value: text, label: text };
  };

  /** Kichik suhbat (salom, rahmat…) — dasturni buzmasdan erkin chatga yuboriladi. */
  const isSmallTalk = (text: string) =>
    /^(salom|assalom|hello|hi|hey|rahmat|tashakkur|спасибо|thank|ok|okay|katta rahmat)\b/i.test(
      text.trim(),
    ) || text.trim().split(/\s+/).length === 1 && !/\d/.test(text);

  const submitDraft = () => {
    const text = draft.trim();
    if (!text || pending) {
      return;
    }

    // Bron/booking va yakunlangan holatda ham chat ishlaydi (erkin savollar).
    if (phase === "booking" || phase === "done" || bookResult) {
      setDraft("");
      void sendFreeChat(text);
      return;
    }

    if (phase === "feedback" || phase === "options") {
      setDraft("");
      if (isSmallTalk(text)) {
        void sendFreeChat(text);
        return;
      }
      void submitFeedback(text);
      return;
    }

    // Savollar bosqichi: javob savolga mos bo'lmasa — erkin chat.
    const matched = matchCurrentQuestion(text);
    if (!matched.ok) {
      setDraft("");
      void sendFreeChat(text);
      return;
    }
    setDraft("");
    if (matched.id === "city") {
      void answer("city", matched.value, matched.label);
    } else if (matched.id === "interests") {
      setInterestPick(matched.value as InterestId[]);
      void answer("interests", matched.value, matched.label);
    } else {
      void answer(matched.id, matched.value, matched.label);
    }
  };

  const inputDisabled = pending || phase === "booking";
  const chatPlaceholder = bookResult
    ? "Savolingizni yozing — Milly AI javob beradi…"
    : phase === "booking"
      ? "Savol yozishingiz ham mumkin — bron formasi yuqorida"
      : phase === "feedback" || phase === "options"
        ? "Istaklaringizni yozing (masalan: arzonroq mehmonxona)…"
        : "Javobingizni yozing yoki variantni tanlang…";

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        ref={scrollRef}
        className={cn(
          "scroll-soft flex-1 space-y-3 overflow-y-auto pr-1",
          variant === "page" ? "max-h-[60vh]" : "max-h-none",
        )}
      >
        {messages.map((message) => {
          if (message.role === "options") {
            return (
              <PlanOptions
                key={message.id}
                options={message.options}
                engine={message.engine}
                chosenIndex={chosenIndex}
                onChoose={chooseOption}
                compact={variant === "widget"}
              />
            );
          }
          if (message.role === "packages") {
            return (
              <RecommendedPackages key={message.id} recommendations={message.recommendations} />
            );
          }
          if (message.role === "chosen") {
            return (
              <PlanResult
                key={message.id}
                plan={message.plan}
                engine={message.engine}
                isAuthenticated={isAuthenticated}
                onReset={reset}
                variant={variant}
              />
            );
          }
          if (message.role === "booked") {
            return (
              <BookingResultCard
                key={message.id}
                result={message.result}
                gatewayMessage={gatewayMessage}
                onPay={retryPayment}
              />
            );
          }
          if (message.role === "offer") {
            return (
              <OfferCard
                key={message.id}
                offer={message.offer}
                onToggle={(direction) =>
                  setOffer((prev) =>
                    prev
                      ? {
                          ...prev,
                          services: prev.services.map((s) =>
                            s.direction === direction ? { ...s, on: !s.on } : s,
                          ),
                        }
                      : prev,
                  )
                }
                onBook={startOfferBooking}
                booking={booking}
              />
            );
          }
          const isUser = message.role === "user";
          return (
            <div key={message.id} className={cn("flex", isUser ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[85%]", !isUser && "space-y-1")}>
                {!isUser && (
                  <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-eco/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-eco">
                    <Sparkles className="size-3" aria-hidden="true" />
                    Milly AI
                  </span>
                )}
                <p
                  className={cn(
                    "rounded-2xl px-3.5 py-2.5 text-[13px] leading-5 whitespace-pre-line",
                    isUser
                      ? "rounded-br-sm bg-primary text-primary-foreground"
                      : "rounded-bl-sm border bg-card text-foreground",
                  )}
                >
                  {message.text}
                </p>
                {!isUser && (
                  <div className="flex gap-1 opacity-40 transition-opacity hover:opacity-100">
                    <button
                      type="button"
                      aria-label="Javob yoqdi"
                      onClick={() =>
                        void rateReply({ sessionKey: key, score: 1 }).catch(() => {})
                      }
                      className="rounded-full px-1.5 py-0.5 text-[11px] hover:bg-muted"
                    >
                      👍
                    </button>
                    <button
                      type="button"
                      aria-label="Javob yoqmadi"
                      onClick={() =>
                        void rateReply({ sessionKey: key, score: -1 }).catch(() => {})
                      }
                      className="rounded-full px-1.5 py-0.5 text-[11px] hover:bg-muted"
                    >
                      👎
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {pending && (
          <div className="flex items-center gap-2.5 rounded-2xl border bg-card px-3.5 py-2.5 text-[13px] text-muted-foreground">
            <Loader2 className="size-4 shrink-0 animate-spin text-primary" aria-hidden="true" />
            <span className="flex items-center gap-1.5">
              {pendingMode === "chat" ? "Milly AI yozmoqda" : "Milly AI 2 xil dastur tuzmoqda"}
              {[0, 150, 300].map((delay) => (
                <span
                  key={delay}
                  className="size-1 animate-bounce rounded-full bg-primary"
                  style={{ animationDelay: `${delay}ms` }}
                  aria-hidden="true"
                />
              ))}
            </span>
          </div>
        )}

        {phase === "questions" && !done && !pending && question && (
          <div className="space-y-2">
            {(question.type === "interests"
              ? INTEREST_OPTIONS.map((o) => ({ value: o.id, label: o.label }))
              : question.type === "city"
                ? CITIES.map((c) => ({ value: c, label: c }))
                : (question.options ?? [])
            ).map((option) => {
              const picked = interestPick.includes(option.value as InterestId);
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    if (question.type === "interests") {
                      setInterestPick((prev) =>
                        prev.includes(option.value as InterestId)
                          ? prev.filter((i) => i !== option.value)
                          : [...prev, option.value as InterestId],
                      );
                      return;
                    }
                    if (question.type === "city") {
                      void answer("city", option.value, option.label);
                      return;
                    }
                    const numeric =
                      question.type === "days" ||
                      question.type === "travelers" ||
                      question.type === "budget";
                    void answer(
                      question.id,
                      numeric ? Number(option.value) : option.value,
                      option.label,
                    );
                  }}
                  className={cn(
                    "mr-1.5 mb-1.5 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-colors",
                    picked
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
                  )}
                >
                  {picked && <Check className="size-3" aria-hidden="true" />}
                  {option.label}
                </button>
              );
            })}

            {question.type === "interests" && (
              <div className="pt-1">
                <Button
                  size="sm"
                  disabled={interestPick.length === 0}
                  onClick={() =>
                    void answer("interests", interestPick, answerLabel("interests", interestPick))
                  }
                >
                  Davom etish
                  <ArrowRight className="size-3.5" aria-hidden="true" />
                </Button>
              </div>
            )}
          </div>
        )}

        {phase === "feedback" && chosenIndex !== null && (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={startBooking}>
              <BadgeCheck className="size-3.5" aria-hidden="true" />
              Tur to'liq ma'qul — bron qilishga o'tamiz
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => {
                setPhase("options");
                push({
                  id: newId(),
                  role: "bot",
                  text: "Mayli, kamchilikni aytib bering — masalan «arzonroq mehmonxona», «Samarqandga 1 kun qo'shing», «temp tezroq bo'lsin».",
                });
              }}
            >
              ✏️ Kamchilik bor — tuzatamiz
            </Button>
          </div>
        )}

        {phase === "booking" && (
          <div className="rounded-2xl border border-primary/25 bg-primary/5 p-3.5">
            <p className="text-[13px] font-semibold text-foreground">
              Bron ma'lumotlari
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <label className="block">
                <span className="text-[11px] font-semibold text-muted-foreground">Boshlanish sanasi</span>
                <input
                  type="date"
                  value={bookingForm.startDate}
                  onChange={(e) => setBookingForm({ ...bookingForm, startDate: e.target.value })}
                  className="mt-1 h-9 w-full rounded-lg border bg-background px-2.5 text-[13px] outline-none focus-visible:border-primary/50"
                />
              </label>
              <label className="block">
                <span className="text-[11px] font-semibold text-muted-foreground">
                  Telefon (ixtiyoriy)
                </span>
                <input
                  value={bookingForm.phone}
                  onChange={(e) => setBookingForm({ ...bookingForm, phone: e.target.value })}
                  placeholder="+998 90 123 45 67"
                  className="mt-1 h-9 w-full rounded-lg border bg-background px-2.5 text-[13px] outline-none focus-visible:border-primary/50"
                />
              </label>
            </div>
            <p className="mt-3 text-[11px] font-semibold text-muted-foreground">To'lov usuli</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {PAY_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setBookingForm({ ...bookingForm, method: option.id })}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-colors",
                    bookingForm.method === option.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  <CreditCard className="size-3" aria-hidden="true" />
                  {option.label}
                </button>
              ))}
            </div>
            <Button
              className="mt-3 w-full bg-eco hover:bg-eco/90 text-white"
              onClick={offer ? submitOfferBooking : submitBooking}
              disabled={booking}
            >
              {booking ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <>
                  <ShieldCheck className="size-4" aria-hidden="true" />
                  Bron qilish va to'lovga o'tish
                </>
              )}
            </Button>
            <p className="mt-2 text-[11px] leading-4 text-muted-foreground">
              {isAuthenticated
                ? `Hisob: ${user?.email ?? user?.name ?? "millytour"}`
                : "Bron qilish uchun hisobingizga kirasiz — 30 soniya kifoya."}
            </p>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2 border-t pt-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submitDraft();
            }
          }}
          disabled={inputDisabled}
          placeholder={chatPlaceholder}
          className="h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus-visible:border-primary/50 focus-visible:ring-[3px] focus-visible:ring-ring/30 disabled:opacity-60"
          aria-label="Xabar"
        />
        <Button
          size="icon"
          onClick={submitDraft}
          disabled={inputDisabled || draft.trim().length === 0}
          aria-label="Yuborish"
        >
          <Send className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}

/** Ikki xil variantni yonma-yon taqqoslash kartochkalari. */
function PlanOptions({
  options,
  engine,
  chosenIndex,
  onChoose,
  compact,
}: {
  options: Plan[];
  engine: "ai" | "rule-based";
  chosenIndex: number | null;
  onChoose: (index: number) => void;
  compact: boolean;
}) {
  return (
    <div className={cn("grid gap-2.5", compact ? "grid-cols-1" : "sm:grid-cols-2")}>
      {options.map((plan, index) => {
        const meta = PLAN_VARIANT_META[index] ?? PLAN_VARIANT_META[0];
        const active = chosenIndex === index;
        return (
          <div
            key={`${meta.id}-${index}`}
            className={cn(
              "flex flex-col rounded-2xl border bg-card p-3.5 transition-colors",
              active ? "border-primary" : "border-border/70",
            )}
          >
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-primary uppercase">
              <span aria-hidden="true">{meta.emoji}</span>
              {meta.label} · {engine === "ai" ? "AI" : "tezkor"} rejim
            </span>
            <p className="mt-1 text-[13px] leading-5 font-semibold text-foreground">{plan.title}</p>
            <p className="mt-1 text-[11px] leading-4 text-muted-foreground">{meta.tagline}</p>
            <ul className="mt-2 space-y-1 text-[12px] text-muted-foreground">
              <li className="flex items-center gap-1.5">
                <CalendarClock className="size-3.5" aria-hidden="true" />
                {plan.days.length} kun · {plan.cities.join(", ")}
              </li>
              <li className="flex items-center gap-1.5">
                <Wallet className="size-3.5" aria-hidden="true" />
                Jami <PriceInline usd={plan.estimate.total} /> · <PriceInline usd={plan.estimate.perPerson} />/kishi
              </li>
              <li className="flex items-center gap-1.5">
                <Users className="size-3.5" aria-hidden="true" />
                {plan.days[0]?.lodging ?? "Mehmonxona"}
              </li>
            </ul>
            <div className="mt-3 flex flex-wrap gap-1">
              {plan.days.slice(0, 2).map((day) => (
                <span
                  key={`${day.day}-${day.title}`}
                  className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground"
                >
                  {day.day}-kun: {day.items[0]?.title ?? day.city}
                </span>
              ))}
            </div>
            <Button
              size="sm"
              className="mt-3 w-full"
              variant={active ? "default" : "secondary"}
              onClick={() => onChoose(index)}
            >
              {active ? (
                <><Check className="size-3.5" aria-hidden="true" /> Tanlangan</>
              ) : (
                "Shu variantni tanlash"
              )}
            </Button>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Milly AI taklifi: dasturdagi xizmatlar (mehmonxona, gid, transfer...) —
 * belgilab bo'linadi va byudjet ichidagi jami summa ko'rinadi.
 */
function OfferCard({
  offer,
  onToggle,
  onBook,
  booking,
}: {
  offer: OfferPayload;
  onToggle: (direction: string) => void;
  onBook: () => void;
  booking: boolean;
}) {
  const active = offer.services.filter((s) => s.on);
  const pickedTotal = active.reduce((sum, s) => sum + s.amount, 0);
  return (
    <div className="rounded-2xl border border-primary/25 bg-primary/5 p-3.5">
      <p className="text-[12px] font-semibold tracking-wide text-primary uppercase">
        ✨ Milly AI dasturi — {offer.city}, {offer.days} kun
      </p>
      <p className="mt-1 text-[11px] leading-4 text-muted-foreground">
        Xizmatlarni belgilang — narx byudjetingizga moslab hisoblanadi.
      </p>
      <div className="mt-2 space-y-1.5">
        {offer.services.map((service) => (
          <button
            key={service.direction}
            type="button"
            onClick={() => onToggle(service.direction)}
            className={cn(
              "flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left transition-colors",
              service.on
                ? "border-primary/50 bg-background"
                : "border-border/60 bg-background/50 opacity-60",
            )}
          >
            <span className="flex items-center gap-2 text-[13px] font-medium text-foreground">
              <span aria-hidden="true">{service.emoji}</span>
              {service.label}
            </span>
            <span className="flex items-center gap-2 text-[12px] font-semibold">
              {service.on ? (
                <Check className="size-3.5 text-eco" aria-hidden="true" />
              ) : (
                <span className="size-3.5 rounded-full border" aria-hidden="true" />
              )}
              <span className={service.on ? "text-foreground" : "text-muted-foreground line-through"}>
                ${service.amount}
              </span>
            </span>
          </button>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between border-t pt-2.5">
        <span className="text-[12px] text-muted-foreground">
          {active.length} xizmat · byudjet ${offer.total}
        </span>
        <span className="text-[15px] font-bold text-foreground">${pickedTotal}</span>
      </div>
            <Button className="mt-2.5 w-full" variant="eco" onClick={onBook} disabled={booking || active.length === 0}>
              {booking ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <>
                  <BadgeCheck className="size-4" aria-hidden="true" />
                  Bron qilishga o'tish
                </>
              )}
            </Button>
    </div>
  );
}

/** Bron natijasi: biriktirilgan mutaxassislar + to'lov holati. */
function BookingResultCard({
  result,
  gatewayMessage,
  onPay,
}: {
  result: BookResult;
  gatewayMessage: string | null;
  onPay: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-2xl border bg-card"
    >
      <div className="relative space-y-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-eco uppercase">
            <BadgeCheck className="size-3.5" aria-hidden="true" />
            Bron tasdiqlandi · {result.reference}
          </span>                  <Badge className="border-0 bg-gold/20 text-gold-ink">
                    To'lov: <PriceInline usd={result.totalPrice} />
                  </Badge>
        </div>
        <p className="text-[13px] leading-5 text-muted-foreground">
          {result.startDate} · {result.days} kun · {result.guests} kishi. Mutaxassislar
          biriktirildi va ularga bot orqali topshiriq yuborildi.
        </p>

        <div className="space-y-2">
          <p className="text-[12px] font-semibold text-foreground">
            Dasturingizga biriktirilgan mutaxassislar
          </p>
          {result.specialists.length === 0 ? (
            <p className="rounded-xl border border-dashed p-3 text-[12px] text-muted-foreground">
              Hozircha bu yo'nalishlarda tasdiqlangan hamkor yo'q. Administrator hamkor
              qo'shgach mutaxassislar avtomatik biriktiriladi.
            </p>
          ) : (
            result.specialists.map((specialist) => (
              <div key={specialist.assignmentId} className="rounded-xl border bg-background p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[12px] font-semibold text-foreground">
                    {specialist.role} · {specialist.businessName}
                  </p>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-foreground">
                    <Star className="size-3.5 text-gold" aria-hidden="true" />
                    {specialist.rating.toFixed(1)} ({specialist.ratingCount})
                  </span>
                </div>
                <p className="mt-1 text-[11px] leading-4 text-muted-foreground">
                  {specialist.contactName ? `${specialist.contactName} · ` : ""}
                  {specialist.city} · {specialist.experienceYears} yil tajriba ·{" "}
                  {specialist.completedOrders} bajarilgan buyurtma
                  {specialist.languages.length > 0
                    ? ` · ${specialist.languages.join("/")}`
                    : ""}
                </p>
                <p className="mt-1 text-[11px] leading-4 text-foreground">{specialist.task}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Phone className="size-3" aria-hidden="true" />
                    {specialist.phone}
                  </span>
                  {specialist.telegramUsername && <span>@{specialist.telegramUsername}</span>}
                  <span className="font-semibold text-foreground">
                    To'lov: <PriceInline usd={specialist.amount} />
                  </span>
                  <span className={cn(specialist.notified ? "text-eco" : "text-muted-foreground")}>
                    {specialist.notified ? "Vazifa botga yuborildi" : "Bot hali ulanmagan"}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="eco" onClick={onPay}>
            <CreditCard className="size-3.5" aria-hidden="true" />
            To'lovni yakunlash
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link to="/dashboard?tab=history">
              Buyurtmalar tarixiga o'tish
              <ExternalLink className="size-3.5" aria-hidden="true" />
            </Link>
          </Button>
        </div>

        {gatewayMessage && (
          <p className="rounded-xl border border-dashed p-2.5 text-[11px] leading-4 text-muted-foreground">
            {gatewayMessage}
          </p>
        )}
        <p className="text-[11px] leading-4 text-muted-foreground">
          To'lov: {result.paymentReference}. Shlyuz tasdiqlagach bron «to'langan» holatiga
          o'tadi va mutaxassislarga yakuniy tasdiq yuboriladi.
        </p>
      </div>
    </motion.div>
  );
}

/** Bitta dasturni batafsil ko'rsatish. */
export function PlanResult({
  plan,
  engine,
  isAuthenticated,
  onReset,
  variant = "widget",
}: {
  plan: Plan;
  engine: "ai" | "rule-based";
  isAuthenticated: boolean;
  onReset?: () => void;
  variant?: "widget" | "page";
}) {
  const packs = plan.pack
    .map((slug) => TOUR_PACKAGES.find((t) => t.slug === slug))
    .filter((t): t is (typeof TOUR_PACKAGES)[number] => Boolean(t))
    .slice(0, variant === "page" ? 3 : 2);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-2xl border bg-card"
    >
      <div className="relative">
        <div className="flex items-start justify-between gap-3 border-b bg-primary/5 px-4 py-3">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-primary uppercase">
              <Sparkles className="size-3.5" aria-hidden="true" />
              {engine === "ai" ? "Milly AI dasturi" : "Tezkor rejim dasturi"}
            </span>
            <h3 className="mt-1 text-[15px] leading-6 font-semibold text-foreground">
              {plan.title}
            </h3>
          </div>
          {onReset && (
            <Button variant="ghost" size="icon" onClick={onReset} aria-label="Yangi dastur">
              <RefreshCw className="size-4" aria-hidden="true" />
            </Button>
          )}
        </div>

        <div className="space-y-3 px-4 py-3">
          <p className="text-[13px] leading-5 text-muted-foreground">{plan.summary}</p>

          <div className="rounded-xl border bg-background p-3">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-foreground">
                <Wallet className="size-4 text-primary" aria-hidden="true" />
                Taxminiy byudjet
              </span>
              <Badge
                className={cn(
                  "border-0",
                  plan.estimate.withinBudget
                    ? "bg-eco/15 text-eco"
                    : "bg-gold/20 text-gold-ink",
                )}
              >
                {plan.estimate.withinBudget ? "Byudjetga mos" : "Byudjetdan yuqori"}
              </Badge>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-xl font-bold text-foreground">
                <PriceInline usd={plan.estimate.total} />
              </span>
              <span className="text-xs text-muted-foreground">
                jami · <PriceInline usd={plan.estimate.perPerson} /> / kishi
              </span>
            </div>
            <ul className="mt-2 space-y-1">
              {plan.estimate.breakdown.map((row) => (
                <li
                  key={row.label}
                  className="flex items-center justify-between text-[12px] text-muted-foreground"
                >
                  <span>{row.label}</span>
                  <span className="font-semibold text-foreground">{row.amount} USD</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2">
            {plan.days.map((day) => (
              <div key={day.day} className="rounded-xl border bg-background p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[13px] font-semibold text-foreground">
                    {day.day}-kun · {day.city}
                  </p>
                  <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                    <CalendarClock className="size-3.5" aria-hidden="true" />
                    {day.lodging}
                  </span>
                </div>
                <p className="mt-0.5 text-[12px] text-muted-foreground">{day.title}</p>
                <ul className="mt-2 space-y-1.5">
                  {day.items.map((item) => (
                    <li key={`${day.day}-${item.time}-${item.title}`} className="flex gap-2">
                      <span className="mt-0.5 w-11 shrink-0 text-[11px] font-semibold text-primary">
                        {item.time}
                      </span>
                      <span className="text-[12px] leading-5 text-foreground">
                        {item.title}
                        {item.note && (
                          <span className="block text-[11px] text-muted-foreground">
                            {item.note}
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-dashed p-3">
            <p className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-foreground">
              <BadgeCheck className="size-3.5 text-eco" aria-hidden="true" />
              Maslahatlar
            </p>
            <ul className="mt-1.5 space-y-1">
              {plan.tips.map((tip) => (
                <li key={tip} className="text-[12px] leading-5 text-muted-foreground">
                  • {tip}
                </li>
              ))}
            </ul>
          </div>

          {packs.length > 0 && (
            <div className="space-y-2">
              <p className="text-[12px] font-semibold text-foreground">
                Shu marshrutga mos tur paketlar
              </p>
              {packs.map((tour) => (
                <Link
                  key={tour.slug}
                  to={`/paketlar/${tour.slug}`}
                  className="flex items-center justify-between gap-3 rounded-xl border bg-background p-2.5 transition-colors hover:border-primary/40"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-semibold text-foreground">
                      {tour.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {tour.days} kun · {tour.city}
                    </p>
                  </div>
                  <span className="shrink-0 text-[13px] font-bold text-foreground">
                    <Price usd={tour.priceFrom} />
                  </span>
                </Link>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="eco" asChild>
            <Link to={packs[0] ? `/paketlar/${packs[0].slug}` : "/paketlar"}>
              Tur paketni band qilish
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link to={isAuthenticated ? "/dashboard" : "/auth?returnTo=%2Fdashboard"}>
              {isAuthenticated ? "Kabinetda saqlangan" : "Hisobga saqlash"}
              <ExternalLink className="size-3.5" aria-hidden="true" />
            </Link>
          </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
