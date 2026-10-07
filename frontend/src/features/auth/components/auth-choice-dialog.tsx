import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Loader2, Mail, MessageCircle, ShieldCheck } from "lucide-react";
import { apiUrl } from "@/shared/api/client";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { GoogleComingSoonButton } from "@/features/auth/components/google-button";

type Challenge = { id: string; deepLink: string };

/**
 * Kirish usulini tanlash oynasi.
 *
 * Telegram yo'li: bot ism-familiyani so'raydi va 6 xonali tasdiqlash kodini
 * beradi; foydalanuvchi shu kodni shu yerga kiritadi. Sayt va bot bir xil
 * hisobdan foydalanadi (ism, buyurtmalar, rejalar — hammasi umumiy).
 *
 * Bot manzillari atayin ko'rsatilmaydi — havola backenddan olinadi.
 */
export function AuthChoiceDialog({ trigger }: { trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "starting" | "pending" | "verifying" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const finishSignIn = () => {
    window.dispatchEvent(new Event("millytour:auth-change"));
    setStatus("idle");
    setOpen(false);
    window.location.assign("/kabinet");
  };

  // Botda tasdiqlanib bo'lingan bo'lsa (masalan kod kiritilmasdan), sayt o'zi kiritadi.
  useEffect(() => {
    if (!challenge || !open) return;
    const timer = window.setInterval(async () => {
      const response = await fetch(
        apiUrl(`/api/auth/telegram/status?challengeId=${encodeURIComponent(challenge.id)}`),
        { credentials: "include" },
      );
      const data = await response.json().catch(() => ({}));
      if (data.status === "verified") {
        finishSignIn();
      } else if (data.status === "expired") {
        setStatus("error");
        setError("Tasdiqlash muddati tugadi. Qaytadan boshlang.");
      }
    }, 2000);
    return () => window.clearInterval(timer);
  }, [challenge, open]);

  const startTelegram = async () => {
    setStatus("starting");
    setError(null);
    setCode("");
    try {
      const response = await fetch(apiUrl("/api/auth/telegram/start"), {
        method: "POST",
        credentials: "include",
      });
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

  const verifyCode = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!challenge) return;
    setStatus("verifying");
    setError(null);
    try {
      const response = await fetch(apiUrl("/api/auth/telegram/verify"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId: challenge.id, code }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Kod tasdiqlanmadi");
      finishSignIn();
    } catch (caught) {
      setStatus("pending");
      setError(caught instanceof Error ? caught.message : "Kod tasdiqlanmadi");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setChallenge(null);
          setCode("");
          setError(null);
          setStatus("idle");
        }
      }}
    >
      <span onClick={() => setOpen(true)}>{trigger}</span>
      <DialogContent className="max-w-md gap-0 overflow-hidden p-0">
        <div className="bg-[#0B1220] px-6 py-6 text-white">
          <DialogHeader>
            <span className="mb-3 grid size-11 place-items-center rounded-2xl bg-white/10 text-gold">
              <ShieldCheck className="size-5" />
            </span>
            <DialogTitle className="text-xl text-white">Hisobga kirish</DialogTitle>
            <DialogDescription className="text-white/65">
              Buyurtmalar, rejalar va profilingiz — bot va saytda bir xil hisob.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="grid gap-3 p-6">
          {status !== "pending" && status !== "verifying" ? (
            <Button
              variant="outline"
              size="lg"
              className="h-auto justify-start px-4 py-4 text-left"
              onClick={startTelegram}
              disabled={status === "starting"}
            >
              {status === "starting" ? (
                <Loader2 className="size-5 shrink-0 animate-spin" aria-hidden="true" />
              ) : (
                <MessageCircle className="size-5 shrink-0 text-sky-600" aria-hidden="true" />
              )}
              <span>
                <strong className="block">Telegram orqali kirish</strong>
                <small className="font-normal text-muted-foreground">
                  Bot ismingizni so'raydi va tasdiqlash kodi beradi
                </small>
              </span>
            </Button>
          ) : (
            <form onSubmit={verifyCode} className="grid gap-3">
              <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-sky-900">
                <p className="text-[12px] font-semibold tracking-wide uppercase">
                  Tasdiqlash kodi
                </p>
                <p className="mt-1 text-[12px] leading-5">
                  Telegram botda ism va familiyangizni kiriting — bot sizga 6 xonali kod beradi.
                  Shu kodni quyiga yozing:
                </p>
              </div>
              <Input
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                maxLength={6}
                disabled={status === "verifying"}
                className="h-14 text-center text-2xl font-bold tracking-[0.4em] tabular-nums"
                aria-label="Tasdiqlash kodi"
              />
              <Button type="submit" size="lg" disabled={status === "verifying" || code.length !== 6}>
                {status === "verifying" ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  "Tasdiqlash"
                )}
              </Button>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  asChild
                  className="h-auto px-0 text-[12px]"
                >
                  <a href={challenge?.deepLink} target="_blank" rel="noreferrer">
                    Botni qayta ochish
                  </a>
                </Button>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="h-auto px-0 text-[12px]"
                  onClick={startTelegram}
                >
                  Yangi kod olish
                </Button>
              </div>
            </form>
          )}

          <GoogleComingSoonButton />

          <Button
            variant="outline"
            size="lg"
            className="h-auto justify-start px-4 py-4 text-left"
            asChild
            onClick={() => setOpen(false)}
          >
            <Link to="/auth?method=email">
              <Mail className="size-5 shrink-0 text-primary" aria-hidden="true" />
              <span>
                <strong className="block">Email yoki telefon orqali kirish</strong>
                <small className="font-normal text-muted-foreground">
                  6 xonali tasdiqlash kodi bilan
                </small>
              </span>
            </Link>
          </Button>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <p className="text-center text-xs leading-5 text-muted-foreground">
            Telegram yoki email orqali kirganda profil, buyurtmalar va rejalar bir xil hisobga
            ulanadi.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
