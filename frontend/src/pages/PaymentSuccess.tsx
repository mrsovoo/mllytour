import { useSearchParams, Link } from "react-router";
import { CheckCircle2, ArrowRight, Home, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const orderNumber = searchParams.get("orderNumber") || "MT-2026-000123";
  const amount = searchParams.get("amount") ? Number(searchParams.get("amount")).toLocaleString() : "1,800,000";

  return (
    <div className="min-h-screen bg-slate-50/50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-border/60 shadow-lg text-center">
        <CardContent className="pt-8 pb-8 px-6 space-y-6">
          <div className="size-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto grid place-items-center">
            <CheckCircle2 className="size-10" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">To'lov muvaffaqiyatli amalga oshirildi!</h1>
            <p className="text-xs text-muted-foreground">
              Buyurtmangiz tasdiqlandi. Tez orada hamkorimiz siz bilan bog'lanadi.
            </p>
          </div>

          <div className="rounded-xl bg-muted/50 p-4 space-y-2.5 text-left text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Buyurtma raqami:</span>
              <span className="font-mono font-bold text-foreground">{orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">To'lov summasi:</span>
              <span className="font-bold text-emerald-600">{amount} UZS</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">To'lov holati:</span>
              <span className="font-semibold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="size-3" /> Tasdiqlandi (PAID)
              </span>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <Link to="/dashboard">
              <Button className="w-full gap-2 font-semibold">
                Buyurtmalarimga o'tish <ArrowRight className="size-4" />
              </Button>
            </Link>
            <Link to="/">
              <Button variant="outline" className="w-full gap-2">
                <Home className="size-4" /> Bosh sahifaga qaytish
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
