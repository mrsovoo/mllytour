import { useState } from "react";
import { useNavigate } from "react-router";
import { useRestMutation } from "@/api/client";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { CalendarDays, Loader2, Send, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthGateDialog } from "@/components/AuthGateDialog";
import { PriceInline } from "@/lib/currency";
import { useAuth } from "@/hooks/use-auth";
import { CITIES } from "@/data/catalog";
import type { BookableService } from "@/components/service-order-form";

/** Yo'nalish bo'yicha taxminiy birlik narxi (so'rov narxi serverda tasdiqlanadi). */
const RATES: Record<BookableService, { unit: number; per: string; perGuests: boolean }> = {
  guide: { unit: 60, per: "kun", perGuests: false },
  transfer: { unit: 45, per: "kun", perGuests: true },
  hotel: { unit: 80, per: "kecha", perGuests: true },
  restaurant: { unit: 35, per: "kun", perGuests: true },
  translator: { unit: 40, per: "kun", perGuests: false },
  photographer: { unit: 55, per: "kun", perGuests: false },
  other: { unit: 50, per: "kun", perGuests: false },
};

/**
 * Umumiy so'rov paneli.
 *
 * Bitta mutaxassis tanlanmagan bo'lsa ham ishlaydi: so'rov shu yo'nalishdagi
 * barcha tasdiqlangan hamkorlarga tushadi. Shu sababli hamkor ro'yxati hali
 * bo'sh bo'lgan yangi yo'nalishlarda ham sahifa to'liq ishlaydi.
 */
export function ServiceRequestPanel({
  service,
  label,
  defaultCity = CITIES[0],
  defaultGuests = 2,
  returnTo,
}: {
  service: BookableService;
  label: string;
  defaultCity?: string;
  defaultGuests?: number;
  returnTo: string;
}) {
  const rate = RATES[service];
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const request = useRestMutation("bookings", "requestService");

  const [form, setForm] = useState({
    city: defaultCity as string,
    // Sana bo'sh qoldirilsa, yuborishda bugungi kun olinadi (render vaqtida
    // `new Date()` chaqirmaslik uchun — sof render qoidasi).
    startDate: "",
    days: 2,
    guests: defaultGuests,
    note: "",
  });
  const [sending, setSending] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);

  const units = rate.per === "kecha" ? Math.max(1, form.days - 1) : Math.max(1, form.days);
  const unitsCount = rate.perGuests ? Math.max(1, Math.ceil(form.guests / 3)) : 1;
  const estimate = Math.round(rate.unit * units * unitsCount);

  const submit = async () => {
    if (!isAuthenticated) {
      setGateOpen(true);
      return;
    }
    setSending(true);
    try {
      const result = await request({
        service,
        city: form.city,
        startDate: form.startDate || new Date().toISOString().slice(0, 10),
        days: form.days,
        guests: form.guests,
        note: form.note || undefined,
      });
      toast.success(`So'rov yuborildi · ${result.reference}`);
      navigate("/dashboard?tab=orders");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "So'rov yuborilmadi");
    } finally {
      setSending(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl border border-primary/25 bg-primary/5 p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">
            {label} uchun so'rov qoldiring
          </p>
          <p className="mt-1 text-[13px] leading-5 text-muted-foreground">
            So'rov shu yo'nalishdagi tasdiqlangan hamkorlarning botiga va paneliga tushadi. Birinchi
            mos mutaxassis qabul qilgach narx tasdiqlanadi.
          </p>
        </div>
        <span className="rounded-full border bg-card px-3 py-1.5 text-[12px] font-semibold text-foreground">
          Taxminiy: <PriceInline usd={estimate} /> · {rate.unit} USD/{rate.per}
        </span>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_auto_auto]">
        <label className="block">
          <span className="text-[11px] font-semibold text-muted-foreground">Shahar</span>
          <select
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            className="mt-1 h-10 w-full cursor-pointer rounded-xl border bg-background px-3 text-sm outline-none focus-visible:border-primary/50"
          >
            {CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
            <CalendarDays className="size-3" aria-hidden="true" /> Sana
          </span>
          <input
            type="date"
            value={form.startDate}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            className="mt-1 h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus-visible:border-primary/50"
          />
        </label>
        <label className="block">
          <span className="text-[11px] font-semibold text-muted-foreground">Kun</span>
          <select
            value={form.days}
            onChange={(e) => setForm({ ...form, days: Number(e.target.value) })}
            className="mt-1 h-10 w-full cursor-pointer rounded-xl border bg-background px-3 text-sm outline-none"
          >
            {[1, 2, 3, 4, 5, 7, 10].map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
            <Users className="size-3" aria-hidden="true" /> Kishi
          </span>
          <select
            value={form.guests}
            onChange={(e) => setForm({ ...form, guests: Number(e.target.value) })}
            className="mt-1 h-10 w-full cursor-pointer rounded-xl border bg-background px-3 text-sm outline-none"
          >
            {[1, 2, 3, 4, 6, 8, 12, 20].map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <Input
          value={form.note}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
          placeholder="Izoh: vaqt, lokatsiya, menyu, maxsus talab…"
          className="h-10"
        />
        <Button size="lg" className="sm:w-auto" disabled={sending} onClick={submit}>
          {sending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <>
              <Send className="size-4" aria-hidden="true" />
              So'rov yuborish
            </>
          )}
        </Button>
      </div>

      <AuthGateDialog
        open={gateOpen}
        onOpenChange={setGateOpen}
        returnTo={returnTo}
        title={`${label} uchun so'rov yuborish`}
        description="So'rovni hamkorlarga yuborish va javobni kuzatish uchun hisobingiz kerak."
      />
    </motion.div>
  );
}
