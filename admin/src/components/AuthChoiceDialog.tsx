import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Mail, MessageCircle, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function AuthChoiceDialog({ trigger }: { trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [challenge, setChallenge] = useState<{ id: string; deepLink: string } | null>(null);
  const [status, setStatus] = useState<"idle" | "starting" | "pending" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!challenge || !open) return;
    const timer = window.setInterval(async () => {
      const response = await fetch(`/api/auth/telegram/status?challengeId=${encodeURIComponent(challenge.id)}`, { credentials: "include" });
      const data = await response.json().catch(() => ({}));
      if (data.status === "verified") {
        window.dispatchEvent(new Event("millytour:auth-change"));
        setStatus("idle");
        setOpen(false);
        window.location.assign("/dashboard");
      } else if (data.status === "expired") {
        setStatus("error");
        setError("Tasdiqlash muddati tugadi. Qaytadan boshlang.");
      }
    }, 1800);
    return () => window.clearInterval(timer);
  }, [challenge, open]);

  const startTelegram = async () => {
    setStatus("starting");
    setError(null);
    try {
      const response = await fetch("/api/auth/telegram/start", { method: "POST", credentials: "include" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Telegram ulanmadi");
      setChallenge({ id: data.challengeId, deepLink: data.deepLink });
      setStatus("pending");
      window.open(data.deepLink, "_blank", "noopener,noreferrer");
    } catch (caught) {
      setStatus("error");
      setError(caught instanceof Error ? caught.message : "Telegram ulanmadi");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (!next) setChallenge(null); }}>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      <DialogContent className="max-w-md gap-0 overflow-hidden p-0">
        <div className="bg-[#0B1220] px-6 py-6 text-white">
          <DialogHeader>
            <span className="mb-3 grid size-11 place-items-center rounded-2xl bg-white/10 text-gold"><ShieldCheck className="size-5" /></span>
            <DialogTitle className="text-xl text-white">Millytour hisobiga kirish</DialogTitle>
            <DialogDescription className="text-white/65">Buyurtmalar, profil, Milly AI dasturlari va Telegram bir hisobda ishlaydi.</DialogDescription>
          </DialogHeader>
        </div>
        <div className="grid gap-3 p-6">
          <Button variant="outline" size="lg" className="h-auto justify-start px-4 py-4 text-left" onClick={startTelegram} disabled={status === "starting"}>
            {status === "starting" ? <Loader2 className="size-5 animate-spin" /> : <MessageCircle className="size-5 text-sky-600" />}
            <span><strong className="block">@millytour_bot orqali tasdiqlash</strong><small className="font-normal text-muted-foreground">Botda Start bosing, platforma avtomatik tasdiqlaydi</small></span>
          </Button>
          {status === "pending" && challenge && (
            <div className="rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900">
              Telegram bot ochildi. <a className="font-semibold underline" href={challenge.deepLink}>Botni qayta ochish</a> va <strong>Start</strong> bosing.
            </div>
          )}
          <Button variant="outline" size="lg" className="h-auto justify-start px-4 py-4 text-left" asChild onClick={() => setOpen(false)}>
            <Link to="/auth?method=email">
              <Mail className="size-5 text-primary" />
              <span><strong className="block">Email orqali kirish</strong><small className="font-normal text-muted-foreground">6 xonali tasdiqlash kodi bilan</small></span>
            </Link>
          </Button>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <p className="text-center text-xs leading-5 text-muted-foreground">Telegram yoki email orqali kirganda profil va buyurtmalar bir xil hisobga ulanadi.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
