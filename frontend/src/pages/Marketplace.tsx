import { useMemo, useState } from "react";
import { useRestQuery } from "@/api/client";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { BadgeCheck, Package, ShoppingBag, Sparkles, Store, Truck } from "lucide-react";
import { AuthGateDialog } from "@/components/AuthGateDialog";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Container, PageHero } from "@/components/site";
import { Price } from "@/lib/currency";
import { PARTNER_BOT_USERNAME, PRODUCTS, partnerBotLink, type Product } from "@/data/catalog";
import { cn } from "@/lib/utils";

type MarketItem = {
  _id: string;
  title: string;
  category: string;
  city: string;
  price: number;
  seller: string;
  handmadeDays: number;
};

type UnifiedItem = {
  id: string;
  title: string;
  category: string;
  city: string;
  price: number;
  seller: string;
  handmadeDays: number;
  image?: string;
  alt?: string;
};

const CATEGORIES = ["Barchasi", "Kulolchilik", "To'qimachilik", "Zargarlik", "Yog'och", "Gilam"] as const;

export default function Marketplace() {
  const approved = useRestQuery<MarketItem[]>("market", "approved");
  const { isAuthenticated } = useAuth();
  const [category, setCategory] = useState<string>("Barchasi");
  const [gateItem, setGateItem] = useState<string | null>(null);

  const items = useMemo<UnifiedItem[]>(() => {
    const fromProviders: UnifiedItem[] = (approved ?? []).map((item) => ({
      id: item._id,
      title: item.title,
      category: item.category,
      city: item.city,
      price: item.price,
      seller: item.seller,
      handmadeDays: item.handmadeDays,
    }));
    const staticItems: UnifiedItem[] = PRODUCTS.map((p: Product) => ({
      id: p.id,
      title: p.title,
      category: p.category,
      city: p.city,
      price: p.price,
      seller: p.seller,
      handmadeDays: p.handmadeDays,
      image: p.image,
      alt: p.alt,
    }));
    return [...fromProviders, ...staticItems];
  }, [approved]);

  const filtered = category === "Barchasi" ? items : items.filter((i) => i.category === category);

  return (
    <>
      <PageHero
        eyebrow="Hunarmandlar bozori"
        title="Milliy hunarmandchilik — ustaxonadan to'g'ridan-to'g'ri"
        description="Rishton kulolchiligi, Marg'ilon atlasi, Buxoro zargarligi va Xiva o'ymakorligi. Har bir buyum muallifi ma'lum, to'lov xavfsiz va eksport uchun hujjatlar tayyor."
      >
        <div className="flex flex-wrap gap-2">
          {[
            { icon: Store, label: "160+ ustaxona" },
            { icon: Truck, label: "Xalqaro yetkazish" },
            { icon: BadgeCheck, label: "Mualliflik kafolati" },
          ].map((b) => (
            <span
              key={b.label}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white/90"
            >
              <b.icon className="size-3.5 text-gold" aria-hidden="true" />
              {b.label}
            </span>
          ))}
        </div>
      </PageHero>

      <Container className="py-10 lg:py-14">
        <div className="flex flex-wrap items-center gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={cn(
                "rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors",
                category === cat
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground",
              )}
            >
              {cat}
            </button>
          ))}
          <span className="ml-auto text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{filtered.length}</span> mahsulot
          </span>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_300px]">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 lg:gap-5">
            {filtered.map((item, i) => (
              <motion.article
                key={item.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: Math.min(i * 0.04, 0.3) }}
                className="group flex flex-col overflow-hidden rounded-2xl border bg-card transition-shadow hover:shadow-soft"
              >
                <div className="relative aspect-square overflow-hidden bg-muted">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.alt ?? item.title}
                      loading="lazy"
                      decoding="async"
                      className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                  ) : (
                    <div className="grid size-full place-items-center bg-gradient-to-br from-primary/10 via-muted to-gold/10">
                      <Package className="size-8 text-primary/50" aria-hidden="true" />
                    </div>
                  )}
                  <Badge className="absolute top-3 left-3 border-0 bg-white/90 text-[10px] text-foreground">
                    {item.category}
                  </Badge>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="line-clamp-2 min-h-10 text-sm leading-5 font-semibold">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.seller} · {item.city}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Qo'lda tayyorlangan · {item.handmadeDays} kun
                  </p>
                  <div className="mt-auto flex items-center justify-between pt-3">
                    <Price usd={item.price} className="text-[15px]" />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        // Savat hisobga bog'lanadi — mehmon uchun avval kirish
                        // kartochkasi ko'rsatiladi.
                        if (!isAuthenticated) {
                          setGateItem(item.title);
                          return;
                        }
                        toast.success(`"${item.title}" savatga qo'shildi`);
                      }}
                    >
                      <ShoppingBag className="size-3.5" aria-hidden="true" />
                      Savatga
                    </Button>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>

          <aside className="flex flex-col gap-4">
            <Card className="relative overflow-hidden border-gold/30 bg-gold/10">
              <CardContent className="flex flex-col items-start gap-3 py-6">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-[11px] font-bold tracking-wide text-gold-ink uppercase">
                  <Sparkles className="size-3.5" aria-hidden="true" />
                  Hunarmandlarga
                </span>
                <h2 className="text-lg leading-6 font-semibold text-foreground">
                  O'z ustaxonangizni onlayn do'konga aylantiring
                </h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  {PARTNER_BOT_USERNAME} orqali ro'yxatdan o'ting, mahsulotlarni botga yuboring —
                  moderatsiyadan so'ng do'koningiz shu yerda chiqadi. Oylik obuna $19.
                </p>
                <Button className="self-start" asChild>
                  <a href={partnerBotLink()} target="_blank" rel="noreferrer">
                    Hunarmand sifatida qo'shilish
                  </a>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border/70">
              <CardContent className="flex flex-col gap-3 py-6">
                <h2 className="text-sm font-semibold text-foreground">Buyurtma qanday ishlaydi</h2>
                <ol className="flex flex-col gap-3 text-[13px] leading-5 text-muted-foreground">
                  {[
                    "Mahsulotni savatga qo'shing yoki to'g'ridan-to'g'ri sotib oling.",
                    "To'lov Click, Payme yoki karta orqali amalga oshiriladi.",
                    "Ustaxona buyurtmani tayyorlaydi — holat botda va kabinetda ko'rinadi.",
                    "Yetkazish: O'zbekiston bo'ylab 3 kun, xalqaro 7–12 kun.",
                  ].map((step, i) => (
                    <li key={step} className="flex gap-3">
                      <span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </aside>
        </div>
      </Container>

      <AuthGateDialog
        open={gateItem !== null}
        onOpenChange={(open) => !open && setGateItem(null)}
        returnTo="/hunarmandlar"
        title={gateItem ? `"${gateItem}" savatga qo'shish` : "Savatga qo'shish uchun hisob kerak"}
        description="Savat va buyurtmalar hisobingizga bog'lanadi — shunda holatni botda va kabinetda kuzatasiz."
      />
    </>
  );
}
