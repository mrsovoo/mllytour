import { motion } from "framer-motion";
import {
  BadgeDollarSign,
  CalendarX2,
  Headphones,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { Container } from "@/components/site";
import { cn } from "@/lib/utils";

type Advantage = {
  icon: LucideIcon;
  title: string;
  note: string;
  tone: string;
};

const ADVANTAGES: Advantage[] = [
  {
    icon: BadgeDollarSign,
    title: "Eng yaxshi narx kafolati",
    note: "Topilsa arzonroq narx — farqni qaytaramiz",
    tone: "bg-primary/10 text-primary",
  },
  {
    icon: Headphones,
    title: "24/7 qo'llab-quvvatlash",
    note: "Sayohat paytida ham doim aloqadamiz",
    tone: "bg-eco/10 text-eco",
  },
  {
    icon: ShieldCheck,
    title: "Xavfsiz bron",
    note: "To'lov himoyalangan, hujjatlar rasmiy",
    tone: "bg-sky-500/10 text-sky-600",
  },
  {
    icon: CalendarX2,
    title: "Oson bekor qilish",
    note: "24 soat oldin bepul o'zgartirish",
    tone: "bg-orange-500/10 text-orange-600",
  },
  {
    icon: Sparkles,
    title: "Tanlangan mehmonxonalar",
    note: "Har biri shaxsan tekshirilgan",
    tone: "bg-fuchsia-500/10 text-fuchsia-600",
  },
];

/** Bitta qatorda 5 ta afzallik — ishonch hosil qiluvchi belgilar. */
export function AdvantagesBand({ className }: { className?: string }) {
  return (
    <section
      // `bg-muted` emas: hunarmandlar bo'limi bilan ketma-ket "muted" bo'lib qolmasligi uchun.
      className={cn("border-y bg-card py-10 lg:py-12", className)}
      aria-label="Xizmat afzalliklari"
    >
      <Container>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5 lg:gap-4">
          {ADVANTAGES.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.42, delay: Math.min(index * 0.06, 0.3) }}
              className="flex items-start gap-3 lg:flex-col lg:items-center lg:text-center"
            >
              <span
                className={cn(
                  "grid size-11 shrink-0 place-items-center rounded-2xl",
                  item.tone,
                )}
              >
                <item.icon className="size-5" aria-hidden="true" />
              </span>
              <div className="lg:mt-3">
                <p className="text-[13.5px] font-bold text-foreground">{item.title}</p>
                <p className="mt-0.5 text-[12px] leading-5 text-muted-foreground">{item.note}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
