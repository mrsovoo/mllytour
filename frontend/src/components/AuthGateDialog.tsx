import { useState } from "react";
import { useNavigate } from "react-router";
import { BadgeCheck, Loader2, LogIn, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MillytourLogo } from "@/components/brand";
import { useAuth } from "@/hooks/use-auth";

const PERKS = [
  "Buyurtmalar va vauchers shu hisobda saqlanadi",
  "Milly AI dasturlari va tarix bir joyda",
];

/**
 * Bron qilishdan oldin ko'rsatiladigan kirish kartochkasi.
 *
 * Ro'yxatdan o'tmagan foydalanuvchi bron tugmasini bosganda ekran orqasi
 * qorayadi va shu dialog chiqadi — email bilan ro'yxatdan o'tish yoki mehmon
 * sifatida davom etish taklif qilinadi. `returnTo` orqali foydalanuvchi
 * to'xtagan joyiga qaytadi.
 */
export function AuthGateDialog({
  open,
  onOpenChange,
  returnTo,
  title = "Bron qilish uchun hisob kerak",
  description = "Hisobingiz bo'lmasa, email manzilingiz bilan 30 soniyada avtomatik yaratiladi.",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  returnTo: string;
  title?: string;
  description?: string;
}) {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [guestBusy, setGuestBusy] = useState(false);

  const goToAuth = () => {
    onOpenChange(false);
    navigate(`/auth?returnTo=${encodeURIComponent(returnTo)}`);
  };

  const continueAsGuest = async () => {
    setGuestBusy(true);
    try {
      await signIn("anonymous");
      onOpenChange(false);
    } catch {
      toast.error("Mehmon sifatida kirish amalga oshmadi.");
    } finally {
      setGuestBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-md gap-0 overflow-hidden p-0"
      >
        <div className="relative overflow-hidden bg-[#0B1220] px-6 pt-6 pb-5 text-white">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0B1220] via-[#12306B] to-[#1E40AF]" />
          <div className="relative">
            <MillytourLogo mono />
            <DialogHeader className="mt-5 gap-2 text-left">
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-gold">
                <ShieldCheck className="size-3" aria-hidden="true" />
                Xavfsiz bron
              </span>
              <DialogTitle className="text-xl leading-7 font-bold tracking-tight text-white">
                {title}
              </DialogTitle>
              <DialogDescription className="text-[13px] leading-5 text-white/70">
                {description}
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>

        <div className="px-6 py-5">
          <ul className="flex flex-col gap-2.5">
            {PERKS.map((perk) => (
              <li key={perk} className="flex items-start gap-2.5 text-[13px] leading-5">
                <span className="mt-0.5 grid size-4.5 shrink-0 place-items-center rounded-full bg-eco/15">
                  <BadgeCheck className="size-3 text-eco" aria-hidden="true" />
                </span>
                <span className="text-foreground">{perk}</span>
              </li>
            ))}
          </ul>

          <Button size="lg" className="mt-5 w-full" onClick={goToAuth}>
            <LogIn className="size-4" aria-hidden="true" />
            Kirish / Ro'yxatdan o'tish
          </Button>

          <Button
            size="lg"
            variant="outline"
            className="mt-2 w-full"
            onClick={continueAsGuest}
            disabled={guestBusy}
          >
            {guestBusy ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <UserRound className="size-4" aria-hidden="true" />
            )}
            Mehmon sifatida davom etish
          </Button>

          <div className="mt-4 flex items-start gap-2 rounded-2xl border border-dashed bg-muted/40 px-3 py-2.5">
            <Sparkles className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden="true" />
            <p className="text-[11px] leading-4 text-muted-foreground">
              Mehmon sifatida kirganingizda buyurtma shu brauzerda saqlanadi — keyin email
              qo'shib hisobni doimiylashtirishingiz mumkin.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="mt-4 w-full cursor-pointer text-center text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Keyinroq
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
