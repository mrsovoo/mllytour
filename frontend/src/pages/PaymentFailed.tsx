import { Link } from "react-router";
import { XCircle, RefreshCcw, Home, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function PaymentFailed() {
  return (
    <div className="min-h-screen bg-slate-50/50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-border/60 shadow-lg text-center">
        <CardContent className="pt-8 pb-8 px-6 space-y-6">
          <div className="size-16 rounded-full bg-red-100 text-red-600 mx-auto grid place-items-center">
            <XCircle className="size-10" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">To'lov amalga oshmadi</h1>
            <p className="text-xs text-muted-foreground">
              Mablag' yetarli bo'lmasligi yoki to'lov bekor qilingan bo'lishi mumkin. Kartangizdan pul yechilmadi.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <Link to="/checkout">
              <Button className="w-full gap-2 font-semibold">
                <RefreshCcw className="size-4" /> Qayta urinib ko'rish
              </Button>
            </Link>
            <Link to="/packages">
              <Button variant="outline" className="w-full gap-2">
                <Home className="size-4" /> Turlarga qaytish
              </Button>
            </Link>
          </div>

          <p className="text-[11px] text-muted-foreground flex items-center justify-center gap-1">
            <HelpCircle className="size-3.5" /> Savollar bo'lsa qo'llab-quvvatlash xizmati bilan bog'laning
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
