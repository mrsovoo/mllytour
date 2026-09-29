import { useState } from "react";
import { useNavigate } from "react-router";
import { useRestMutation } from "@/api/client";
import { toast } from "sonner";
import { CalendarDays, Loader2, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthGateDialog } from "@/components/AuthGateDialog";
import { useAuth } from "@/hooks/use-auth";
import type { Direction } from "@/data/catalog";

/** Hunarmandlar bozori bundan mustasno — qolgan yo'nalishlar bron qilinadi. */
export type BookableService = Exclude<Direction, "artisan">;

/**
 * Bitta mutaxassis uchun qisqa so'rov formasi — narx serverda hisoblanadi.
 * Ro'yxatdan o'tmagan foydalanuvchi "Alohida bron qilish"ni bossa, ekran
 * orqasi qorayib kirish kartochkasi chiqadi (AuthGateDialog).
 */
export function ServiceOrderForm({
  service,
  providerName,
  city: providerCity,
  returnTo,
  defaultOpen = false,
}: {
  service: BookableService;
  providerName: string;
  city: string;
  /** Kirishdan keyin qaytadigan manzil (odatda sahifaning o'zi). */
  returnTo?: string;
  defaultOpen?: boolean;
}) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const request = useRestMutation("bookings", "requestService");
  const [open, setOpen] = useState(defaultOpen);
  const [gateOpen, setGateOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({
    startDate: "",
    days: 2,
    guests: 2,
    note: "",
  });

  const backTo =
    returnTo ??
    (typeof window !== "undefined" ? window.location.pathname + window.location.search : "/xizmatlar");

  if (!open) {
    return (
      <>
        <Button
          size="sm"
          variant="outline"
          className="w-full"
          onClick={() => (isAuthenticated ? setOpen(true) : setGateOpen(true))}
        >
          <Send className="size-3.5" aria-hidden="true" />
          Alohida bron qilish
        </Button>
        <AuthGateDialog
          open={gateOpen}
          onOpenChange={setGateOpen}
          returnTo={backTo}
          title={`${providerName} uchun bron qilish`}
          description="Mutaxassisga so'rov yuborish va javobni kuzatish uchun hisobingiz kerak."
        />
      </>
    );
  }

  const submit = async () => {
    if (!isAuthenticated) {
      setGateOpen(true);
      return;
    }
    setSending(true);
    try {
      const result = await request({
        service,
        city: providerCity,
        startDate: form.startDate || new Date().toISOString().slice(0, 10),
        days: form.days,
        guests: form.guests,
        note: form.note || undefined,
      });
      toast.success(`So'rov yuborildi · ${result.reference}`);
      navigate("/dashboard?tab=history");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "So'rov yuborilmadi");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="rounded-xl border border-primary/25 bg-primary/5 p-3">
      <p className="text-[12px] font-semibold text-foreground">{providerName} uchun so'rov</p>
      <div className="mt-2 grid grid-cols-3 gap-2">
        <label className="col-span-3 block sm:col-span-1">
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-muted-foreground">
            <CalendarDays className="size-3" aria-hidden="true" /> Sana
          </span>
          <input
            type="date"
            value={form.startDate}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            className="mt-1 h-9 w-full rounded-lg border bg-background px-2 text-[12px] outline-none focus-visible:border-primary/50"
          />
        </label>
        <label className="block">
          <span className="text-[10px] font-semibold text-muted-foreground">Kun</span>
          <select
            value={form.days}
            onChange={(e) => setForm({ ...form, days: Number(e.target.value) })}
            className="mt-1 h-9 w-full rounded-lg border bg-background px-2 text-[12px] outline-none"
          >
            {[1, 2, 3, 5, 7, 10].map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-[10px] font-semibold text-muted-foreground">Kishi</span>
          <select
            value={form.guests}
            onChange={(e) => setForm({ ...form, guests: Number(e.target.value) })}
            className="mt-1 h-9 w-full rounded-lg border bg-background px-2 text-[12px] outline-none"
          >
            {[1, 2, 3, 4, 6, 8, 12, 20].map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>
      </div>
      <Input
        value={form.note}
        onChange={(e) => setForm({ ...form, note: e.target.value })}
        placeholder="Izoh: vaqt, menyu, lokatsiya…"
        className="mt-2 h-9 text-[12px]"
      />
      <div className="mt-2 flex gap-2">
        <Button size="sm" className="flex-1" disabled={sending} onClick={submit}>
          {sending ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> : "Yuborish"}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Bekor
        </Button>
      </div>
      <AuthGateDialog
        open={gateOpen}
        onOpenChange={setGateOpen}
        returnTo={backTo}
        title={`${providerName} uchun bron qilish`}
        description="Mutaxassisga so'rov yuborish va javobni kuzatish uchun hisobingiz kerak."
      />
    </div>
  );
}
