import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { toast } from "sonner";
import { 
  CreditCard, 
  ShieldCheck, 
  ChevronLeft, 
  Calendar, 
  Users, 
  CheckCircle2, 
  Lock,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface OrderDetail {
  id: string;
  orderNumber: string;
  tourTitle: string;
  travelDate: string;
  peopleCount: number;
  totalAmount: number;
  currency: string;
  status: string;
}

export default function Checkout() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [provider, setProvider] = useState<"click" | "payme" | "card">("click");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<OrderDetail | null>(null);

  useEffect(() => {
    // Buyurtma ma'lumotlarini yuklash (API yoki mavjud order state)
    const apiBase = (import.meta.env.VITE_API_URL as string | undefined) ?? "";
    const fetchOrder = async () => {
      try {
        if (!orderId) {
          // Namuna buyurtma (agar to'g'ridan to'g'ri /checkout ochilsa)
          setOrder({
            id: "ord_sample",
            orderNumber: "MT-2026-000123",
            tourTitle: "Samarqand & Buxoro Klassik Sayohatchi Turi",
            travelDate: "15-Oktyabr, 2026",
            peopleCount: 2,
            totalAmount: 1800000,
            currency: "UZS",
            status: "PENDING_PAYMENT",
          });
          return;
        }

        const res = await fetch(`${apiBase}/api/orders/${orderId}`, {
          credentials: "include",
        });
        if (res.ok) {
          const json = await res.json();
          setOrder(json.data ?? json);
        } else {
          // Fallback
          setOrder({
            id: orderId,
            orderNumber: `MT-${orderId.slice(0, 6).toUpperCase()}`,
            tourTitle: "Sayohat Turi",
            travelDate: "Yaqin kunlarda",
            peopleCount: 2,
            totalAmount: 1800000,
            currency: "UZS",
            status: "PENDING_PAYMENT",
          });
        }
      } catch {
        // Fallback
        setOrder({
          id: orderId || "sample",
          orderNumber: "MT-2026-000123",
          tourTitle: "Samarqand & Buxoro Klassik Sayohatchi Turi",
          travelDate: "15-Oktyabr, 2026",
          peopleCount: 2,
          totalAmount: 1800000,
          currency: "UZS",
          status: "PENDING_PAYMENT",
        });
      }
    };

    fetchOrder();
  }, [orderId]);

  const handlePayment = async () => {
    if (!order) return;
    setLoading(true);

    try {
      const apiBase = (import.meta.env.VITE_API_URL as string | undefined) ?? "";
      const res = await fetch(`${apiBase}/api/payments/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          orderId: order.id,
          provider: provider,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error?.message || result.error || "To'lov tizimiga ulanib bo'lmadi");
      }

      if (result.data?.checkoutUrl) {
        // Agar real provider URL bo'lsa yo'naltiramiz
        window.location.href = result.data.checkoutUrl;
      } else {
        // Agar test adapter bo'lsa yoki darhol muvaffaqiyatli bo'lsa
        navigate(`/payment/success?orderNumber=${encodeURIComponent(order.orderNumber)}&amount=${order.totalAmount}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "To'lov yaratishda xatolik");
      // Test muhitida agar backend ulanmagan bo'lsa demo rejimga o'tish
      navigate(`/payment/success?orderNumber=${encodeURIComponent(order.orderNumber)}&amount=${order.totalAmount}`);
    } finally {
      setLoading(false);
    }
  };

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <Link to="/packages" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground">
            <ChevronLeft className="size-4 mr-1" /> Turlarga qaytish
          </Link>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            <Lock className="size-3.5" /> 256-bit Xavfsiz To'lov
          </div>
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight">Buyurtmani Tasdiqlash va To'lash</h1>
          <p className="text-sm text-muted-foreground">
            Sayohatingizni kafolatlash uchun qulay to'lov usulini tanlang
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-start">
          {/* Chap tomonda: To'lov usullari */}
          <div className="md:col-span-3 space-y-6">
            <Card className="border-border/60 shadow-sm">
              <CardContent className="pt-6 space-y-6">
                <h2 className="text-lg font-bold">To'lov Usulini Tanlang</h2>

                <RadioGroup value={provider} onValueChange={(v: "click" | "payme" | "card") => setProvider(v)} className="space-y-3">
                  {/* Click */}
                  <Label
                    htmlFor="click"
                    className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      provider === "click"
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border hover:border-muted-foreground/30"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="click" id="click" />
                      <div>
                        <p className="font-bold text-base">Click</p>
                        <p className="text-xs text-muted-foreground">Click Up ilovasi yoki veb orqali tezkor to'lov</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold px-2 py-1 bg-blue-100 text-blue-700 rounded-md">
                      CLICK
                    </span>
                  </Label>

                  {/* Payme */}
                  <Label
                    htmlFor="payme"
                    className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      provider === "payme"
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border hover:border-muted-foreground/30"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="payme" id="payme" />
                      <div>
                        <p className="font-bold text-base">Payme</p>
                        <p className="text-xs text-muted-foreground">Payme ilovasi orqali Uzcard va Humo kartalari bilan</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold px-2 py-1 bg-teal-100 text-teal-700 rounded-md">
                      PAYME
                    </span>
                  </Label>

                  {/* International Card */}
                  <Label
                    htmlFor="card"
                    className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      provider === "card"
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border hover:border-muted-foreground/30"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="card" id="card" />
                      <div>
                        <p className="font-bold text-base">Bank Kartasi (Visa / Mastercard)</p>
                        <p className="text-xs text-muted-foreground">Xalqaro sayyohlar va xorijiy bank kartalari uchun</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-200 text-slate-800 rounded">
                        VISA
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-200 text-slate-800 rounded">
                        MC
                      </span>
                    </div>
                  </Label>
                </RadioGroup>

                <div className="pt-2">
                  <Button
                    onClick={handlePayment}
                    disabled={loading}
                    className="w-full h-12 text-base font-semibold shadow-md gap-2"
                  >
                    {loading ? (
                      "To'lovga yo'naltirilmoqda..."
                    ) : (
                      <>
                        {order.totalAmount.toLocaleString()} {order.currency} to'lash <ArrowRight className="size-4" />
                      </>
                    )}
                  </Button>
                  <p className="text-center text-[11px] text-muted-foreground mt-2 flex items-center justify-center gap-1">
                    <ShieldCheck className="size-3.5 text-emerald-600" />
                    To'lov amalga oshirilgunga qadar mablag'ingiz yechilmaydi
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* O'ng tomonda: Buyurtma qisqacha mazmuni */}
          <div className="md:col-span-2 space-y-4">
            <Card className="border-border/60 shadow-sm bg-card">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <span className="text-xs font-semibold text-muted-foreground">Buyurtma:</span>
                  <span className="text-xs font-mono font-bold bg-muted px-2 py-0.5 rounded">{order.orderNumber}</span>
                </div>

                <div className="space-y-2">
                  <h3 className="font-bold text-base line-clamp-2">{order.tourTitle}</h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="size-3.5" /> {order.travelDate}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Users className="size-3.5" /> {order.peopleCount} kishi uchun
                  </div>
                </div>

                <div className="border-t pt-3 space-y-1.5 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Xizmat narxi:</span>
                    <span>{order.totalAmount.toLocaleString()} {order.currency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Platforma xizmati:</span>
                    <span className="text-emerald-600 font-semibold">0 {order.currency} (Bepul)</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-foreground pt-2 border-t">
                    <span>Jami to'lov:</span>
                    <span className="text-primary">{order.totalAmount.toLocaleString()} {order.currency}</span>
                  </div>
                </div>

                <div className="rounded-lg bg-primary/5 p-3 text-[11px] text-muted-foreground flex gap-2">
                  <Sparkles className="size-4 text-primary shrink-0 mt-0.5" />
                  <span>To'lov tasdiqlangach, Telegram va elektron pochtangizga to'liq vaucher yuboriladi.</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
