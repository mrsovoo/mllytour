import { Check, MessageSquareText, Sparkles, Users, Wallet, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/site";
import { openMillyAi } from "@/components/AiAssistant";
import { cn } from "@/lib/utils";

const FACTS = [
  { icon: MessageSquareText, label: "Savol-javob: shahar, kun, kishi, byudjet" },
  { icon: Sparkles, label: "Ikki xil dastur: komfort va tejamkor" },
  { icon: Users, label: "Gid, mehmonxona, transfer — avtomatik" },
  { icon: Wallet, label: "Bron va to'lov chat ichida" },
];

const FLOW = [
  "Savollarga javob berasiz",
  "AI ikki xil dastur taklif qiladi",
  "Tanlaysiz — bron va to'lov shu yerda",
];

/**
 * Milly AI bo'limi — faqat funksiyani tanishtiradi.
 * Chatning o'zi suzuvchi "Milly AI" tugmasi orqali ochiladi (butun saytda mavjud).
 */
export function AiSection({ className, id = "milly-ai" }: { className?: string; id?: string }) {
  return (
    <section
      id={id}
      className={cn("scroll-mt-24 border-y bg-muted/40 py-14 lg:py-20", className)}
      aria-label="Milly AI"
    >
      <Container>
        <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-[11px] font-bold tracking-wide text-primary-foreground uppercase">
              <Sparkles className="size-3.5 text-gold" aria-hidden="true" />
              Milly AI
            </span>
            <h2 className="mt-3 text-2xl leading-8 font-bold tracking-tight text-foreground sm:text-[28px] sm:leading-9">
              Milly AI — dasturni bir necha savolda tuzadi
            </h2>
            <p className="mt-3 max-w-xl text-[15px] leading-6 text-muted-foreground">
              Savollarga javob bering: AI ikki xil dastur beradi — komfort va tejamkor. Birini
              tanlaysiz, kerak bo'lsa o'zgartirasiz, so'ngra gid, mehmonxona va transfer
              biriktiriladi. Bron va to'lov ham chat ichida.
            </p>

            <ul className="mt-5 grid gap-2 sm:grid-cols-2">
              {FACTS.map((f) => (
                <li
                  key={f.label}
                  className="flex items-start gap-2 rounded-xl border bg-card px-3 py-2.5 text-[13px] text-muted-foreground"
                >
                  <f.icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                  {f.label}
                </li>
              ))}
            </ul>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button size="lg" onClick={openMillyAi}>
                <Zap className="size-4" aria-hidden="true" />
                Milly AI'ni ochish
              </Button>
              <span className="text-[12px] text-muted-foreground">
                Chat o'ng pastda ochiladi — sahifadan chiqmaysiz.
              </span>
            </div>
          </div>

          {/* Chat qanday ishlashini ko'rsatuvchi mini-markaz */}
          <div className="relative overflow-hidden rounded-2xl border bg-card p-5 shadow-xs">
            <div className="flex items-center gap-3 border-b pb-3">
                  <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-[#587b58] to-[#2f4b3d] text-white">
                <Sparkles className="size-4 text-gold" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">Milly AI</p>
                <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span className="size-1.5 rounded-full bg-eco" aria-hidden="true" />
                  Onlayn · har doim yoningizda
                </p>
              </div>
            </div>
            <ol className="mt-4 flex flex-col gap-2.5">
              {FLOW.map((step, i) => (
                <li key={step} className="flex items-center gap-2.5 text-[13px] text-foreground">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                    {i + 1}
                  </span>
                  {step}
                  <Check className="ml-auto size-3.5 text-eco" aria-hidden="true" />
                </li>
              ))}
            </ol>
            <Button className="mt-5 w-full" onClick={openMillyAi}>
              <Sparkles className="size-4" aria-hidden="true" />
              Hozir sinab ko'rish
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
