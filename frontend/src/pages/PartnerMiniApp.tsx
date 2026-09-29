import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Store,
  UserCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  ChevronLeft,
  DollarSign,
  Star,
  Plus,
  Phone,
  MapPin,
  Calendar,
  Users,
  ShieldCheck,
  Building2,
  Car,
  Utensils,
  Compass,
  Camera,
  Home as HomeIcon,
  CreditCard,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

const SERVICE_TYPES = [
  { id: "guide", label: "Gid / Ekskursovod", icon: UserCheck },
  { id: "driver", label: "Haydovchi / Transfer", icon: Car },
  { id: "hotel", label: "Mehmonxona", icon: Building2 },
  { id: "restaurant", label: "Restoran / Choyxona", icon: Utensils },
  { id: "guesthouse", label: "Guest House / Mehmon uyi", icon: HomeIcon },
  { id: "touroperator", label: "Tur Operator", icon: Compass },
  { id: "photographer", label: "Fotograf / Videograf", icon: Camera },
  { id: "other", label: "Boshqa xizmat", icon: Sparkles },
];

export default function PartnerMiniApp() {
  const [partner, setPartner] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [onboardingStep, setOnboardingStep] = useState(1);

  // Onboarding form state
  const [direction, setDirection] = useState("guide");
  const [businessName, setBusinessName] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("Samarqand");
  const [about, setAbout] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [servicePrice, setServicePrice] = useState("");
  const [cardNumber, setCardNumber] = useState("");

  const apiBase = (import.meta.env.VITE_API_URL as string | undefined) ?? "";

  useEffect(() => {
    // 1. Telegram WebApp ni sozlash (agar Telegram ichida bo'lsa)
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
    }

    // 2. Telegram initData orqali autentifikatsiya
    const authViaTelegram = async () => {
      try {
        const initData = tg?.initData || "";
        if (initData) {
          const res = await fetch(`${apiBase}/api/auth/telegram`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ initData, role: "PARTNER" }),
          });
          if (res.ok) {
            const json = await res.json();
            if (json.data?.partner) {
              setPartner(json.data.partner);
            }
          }
        } else {
          // Oddiy brauzerdan kirilganda mavjud sessiyani tekshirish
          const res = await fetch(`${apiBase}/api/partners/me`, { credentials: "include" });
          if (res.ok) {
            const json = await res.json();
            setPartner(json.data);
          }
        }
      } catch (err) {
        console.error("Partner auth error:", err);
      } finally {
        setLoading(false);
      }
    };

    authViaTelegram();
  }, [apiBase]);

  const handleApply = async () => {
    if (!businessName || !phone) {
      toast.error("Iltimos, barcha majburiy maydonlarni to'ldiring");
      return;
    }

    setLoading(true);
    try {
      const tgUser = (window as any).Telegram?.WebApp?.initDataUnsafe?.user;
      const res = await fetch(`${apiBase}/api/partners/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          businessName,
          contactName: contactName || tgUser?.first_name || "",
          phone,
          direction,
          city,
          about: `${about}. Asosiy xizmat: ${serviceName} (${servicePrice} UZS). Karta: ${cardNumber}`,
          telegramId: tgUser?.id?.toString(),
          telegramUsername: tgUser?.username,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Ariza yuborishda xatolik");

      toast.success("Arizangiz muvaffaqiyatli qabul qilindi!");
      setPartner(json.data);
    } catch (err: any) {
      toast.error(err.message || "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-2">
          <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto" />
          <p className="text-xs text-muted-foreground font-medium">Hamkor portali yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  // 1. Agar ariza ko'rib chiqilayotgan bo'lsa (PENDING)
  if (partner?.status === "PENDING" || partner?.status === "pending") {
    return (
      <div className="min-h-screen bg-slate-50 p-4 flex items-center justify-center">
        <Card className="max-w-md w-full text-center border-border/60 shadow-sm">
          <CardContent className="pt-8 pb-8 px-6 space-y-4">
            <div className="size-16 rounded-full bg-amber-100 text-amber-600 mx-auto grid place-items-center">
              <Clock className="size-8" />
            </div>
            <h2 className="text-xl font-bold">Arizangiz ko'rib chiqilmoqda</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Hurmatli <strong>{partner.businessName}</strong>, sizning hamkorlik arizangiz MillyTour ma'muriyati tomonidan tekshirilmoqda. Ariza tasdiqlanishi bilan Telegram orqali xabar olasiz va boshqaruv paneli faollashadi.
            </p>
            <div className="p-3 bg-muted/50 rounded-xl text-left text-xs space-y-1">
              <p><span className="text-muted-foreground">Yo'nalish:</span> <span className="font-semibold uppercase">{partner.direction}</span></p>
              <p><span className="text-muted-foreground">Shahar:</span> <span className="font-semibold">{partner.city}</span></p>
              <p><span className="text-muted-foreground">Holat:</span> <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">Kutayotgan</Badge></p>
            </div>
            <Button variant="outline" className="w-full text-xs" onClick={() => window.location.reload()}>
              Holatni tekshirish
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 2. Agar tasdiqlangan bo'lsa (APPROVED) -> Partner Mobile Dashboard
  if (partner?.status === "APPROVED" || partner?.status === "approved") {
    return (
      <div className="min-h-screen bg-slate-50 pb-20">
        {/* Header */}
        <div className="bg-card border-b px-4 py-3 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-primary/10 text-primary grid place-items-center font-bold">
              <Store className="size-5" />
            </div>
            <div>
              <h1 className="font-bold text-sm leading-tight">{partner.businessName}</h1>
              <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="size-3" /> Tasdiqlangan Hamkor
              </p>
            </div>
          </div>
          <Badge className="bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1 font-bold">
            <Star className="size-3 fill-amber-500 text-amber-500" /> {partner.rating?.toFixed(1) || "5.0"}
          </Badge>
        </div>

        <div className="p-4 space-y-4 max-w-lg mx-auto">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="border-border/60">
              <CardContent className="p-4">
                <p className="text-[11px] font-semibold text-muted-foreground">Buyurtmalar</p>
                <p className="text-2xl font-bold mt-0.5">{partner.completedOrders || 0}</p>
                <p className="text-[10px] text-emerald-600 mt-1">100% muvaffaqiyatli</p>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="p-4">
                <p className="text-[11px] font-semibold text-muted-foreground">Yechishga tayyor</p>
                <p className="text-2xl font-bold mt-0.5 text-primary">0 UZS</p>
                <p className="text-[10px] text-muted-foreground mt-1">Komissiya: 10%</p>
              </CardContent>
            </Card>
          </div>

          {/* Navigation Tabs */}
          <Tabs defaultValue="orders" className="w-full">
            <TabsList className="grid grid-cols-3 mb-3">
              <TabsTrigger value="orders">Buyurtmalar</TabsTrigger>
              <TabsTrigger value="services">Xizmatlarim</TabsTrigger>
              <TabsTrigger value="earnings">Moliya</TabsTrigger>
            </TabsList>

            {/* Orders Tab */}
            <TabsContent value="orders" className="space-y-3">
              <div className="p-6 text-center bg-card rounded-2xl border border-dashed border-border/80 space-y-2">
                <div className="size-10 rounded-full bg-primary/10 text-primary mx-auto grid place-items-center">
                  <Calendar className="size-5" />
                </div>
                <h3 className="font-bold text-sm">Yangi buyurtmalar yo'q</h3>
                <p className="text-xs text-muted-foreground">
                  Mijozlar yangi xizmat yoki tur buyurtma qilganda Telegram botingizga darhol xabar keladi.
                </p>
              </div>
            </TabsContent>

            {/* Services Tab */}
            <TabsContent value="services" className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase text-muted-foreground">Mening Xizmatlarim</h3>
                <Button size="sm" variant="outline" className="h-8 gap-1 text-xs">
                  <Plus className="size-3.5" /> Xizmat qo'shish
                </Button>
              </div>

              {(partner.services || []).length === 0 ? (
                <div className="p-6 text-center bg-card rounded-2xl border border-border/60 space-y-2">
                  <p className="text-xs text-muted-foreground">Siz hali alohida xizmat qo'shmadingiz</p>
                </div>
              ) : (
                partner.services.map((srv: any) => (
                  <Card key={srv.id} className="border-border/60">
                    <CardContent className="p-3 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-sm">{srv.name}</p>
                        <p className="text-xs text-muted-foreground">{srv.price?.toLocaleString()} UZS · {srv.region}</p>
                      </div>
                      <Badge variant="outline">{srv.status}</Badge>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* Earnings Tab */}
            <TabsContent value="earnings" className="space-y-3">
              <Card className="border-border/60 bg-primary/5">
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Jami hisoblangan:</span>
                    <span className="font-bold text-sm">0 UZS</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Platforma ulushi:</span>
                    <span className="font-semibold text-xs text-amber-600">10%</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between items-center">
                    <span className="text-xs font-bold">Yechib olish uchun qoldiq:</span>
                    <span className="font-extrabold text-base text-primary">0 UZS</span>
                  </div>
                  <Button disabled className="w-full text-xs font-semibold h-10 mt-1">
                    Pulni kartaga yechib olish
                  </Button>
                  <p className="text-[10px] text-muted-foreground text-center">
                    *Mablag'lar buyurtma muvaffaqiyatli yakunlangach kartangizga o'tkaziladi
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  }

  // 3. Yangi hamkor uchun ro'yxatdan o'tish (Onboarding)
  return (
    <div className="min-h-screen bg-slate-50 p-4 flex flex-col justify-center">
      <div className="max-w-md w-full mx-auto space-y-6">
        <div className="text-center space-y-1">
          <Badge className="bg-primary/10 text-primary border-primary/20">MillyTour Hamkor</Badge>
          <h1 className="text-2xl font-extrabold tracking-tight">Hamkor sifatida ulanish</h1>
          <p className="text-xs text-muted-foreground">
            O'zbekiston bo'ylab xizmatlaringizni minglab turistlarga taqdim eting
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className={`h-1.5 rounded-full transition-all ${
                onboardingStep >= step ? "w-8 bg-primary" : "w-4 bg-muted"
              }`}
            />
          ))}
        </div>

        <Card className="border-border/60 shadow-sm">
          <CardContent className="pt-6 space-y-4">
            {/* Step 1: Yo'nalish tanlash */}
            {onboardingStep === 1 && (
              <div className="space-y-3">
                <h3 className="font-bold text-sm">Siz qanday xizmat ko'rsatasiz?</h3>
                <div className="grid grid-cols-2 gap-2.5">
                  {SERVICE_TYPES.map((type) => {
                    const Icon = type.icon;
                    const isSelected = direction === type.id;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setDirection(type.id)}
                        className={`p-3 rounded-xl border text-left flex flex-col gap-2 transition-all ${
                          isSelected
                            ? "border-primary bg-primary/5 text-primary font-bold shadow-sm"
                            : "border-border hover:border-muted-foreground/30 text-foreground"
                        }`}
                      >
                        <Icon className="size-5" />
                        <span className="text-xs">{type.label}</span>
                      </button>
                    );
                  })}
                </div>
                <Button className="w-full mt-4" onClick={() => setOnboardingStep(2)}>
                  Davom etish <ArrowRight className="size-4 ml-1" />
                </Button>
              </div>
            )}

            {/* Step 2: Shaxsiy va biznes ma'lumotlar */}
            {onboardingStep === 2 && (
              <div className="space-y-3">
                <h3 className="font-bold text-sm">Biznes ma'lumotlari</h3>
                <div className="space-y-2">
                  <label className="text-xs font-semibold">Tashkilot / Brand nomi *</label>
                  <Input
                    placeholder="Masalan: Silk Road Guides yoki Orom Mehmonxonasi"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold">Aloqa uchun shaxs (Ism-familiya)</label>
                  <Input
                    placeholder="Ali Valiyev"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold">Telefon raqam *</label>
                  <Input
                    placeholder="+998901234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold">Asosiy shahar / hudud *</label>
                  <Input
                    placeholder="Samarqand, Buxoro, Toshkent, Xiva..."
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="w-1/3" onClick={() => setOnboardingStep(1)}>
                    Orqaga
                  </Button>
                  <Button className="w-2/3" onClick={() => setOnboardingStep(3)}>
                    Davom etish <ArrowRight className="size-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Xizmat va Narxlar */}
            {onboardingStep === 3 && (
              <div className="space-y-3">
                <h3 className="font-bold text-sm">Asosiy xizmat va narx</h3>
                <div className="space-y-2">
                  <label className="text-xs font-semibold">Boshlang'ich xizmat nomi</label>
                  <Input
                    placeholder="Masalan: Samarqand bo'ylab 1 kunlik shaxsiy ekskursiya"
                    value={serviceName}
                    onChange={(e) => setServiceName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold">Xizmat narxi (UZS)</label>
                  <Input
                    type="number"
                    placeholder="Masalan: 350000"
                    value={servicePrice}
                    onChange={(e) => setServicePrice(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold">Xizmat haqida qisqacha</label>
                  <Textarea
                    placeholder="Tajribangiz, tillar, avtomobil modeli yoki qulayliklar..."
                    value={about}
                    onChange={(e) => setAbout(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="w-1/3" onClick={() => setOnboardingStep(2)}>
                    Orqaga
                  </Button>
                  <Button className="w-2/3" onClick={() => setOnboardingStep(4)}>
                    Davom etish <ArrowRight className="size-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: To'lov rekvizitlari va yakunlash */}
            {onboardingStep === 4 && (
              <div className="space-y-4">
                <h3 className="font-bold text-sm">To'lov va Rekvizitlar</h3>
                <p className="text-xs text-muted-foreground">
                  Mijozlar to'lagan mablag'larni qabul qilish uchun bank kartangiz yoki hisob raqamingiz:
                </p>
                <div className="space-y-2">
                  <label className="text-xs font-semibold">Uzcard / Humo karta raqami (ixtiyoriy)</label>
                  <Input
                    placeholder="8600 0000 0000 0000"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                  />
                </div>

                <div className="p-3 bg-muted/60 rounded-xl space-y-1.5 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5 font-semibold text-foreground">
                    <ShieldCheck className="size-4 text-emerald-600" /> Xavfsiz Shartnoma
                  </div>
                  <p>Arizangiz 24 soat ichida ko'rib chiqiladi. Tasdiqlangach to'liq buyurtmalar oqimi ochiladi.</p>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="w-1/3" onClick={() => setOnboardingStep(3)}>
                    Orqaga
                  </Button>
                  <Button className="w-2/3" onClick={handleApply}>
                    Arizani yuborish <CheckCircle2 className="size-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
