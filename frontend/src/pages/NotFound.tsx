import { Link } from "react-router";
import { motion } from "framer-motion";
import { ArrowLeft, Compass, MapPin, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/site";

const LINKS = [
  { label: "Barcha tur paketlar", to: "/paketlar", icon: MapPin },
  { label: "Xizmatlar", to: "/xizmatlar", icon: Sparkles },
  { label: "Hunarmandlar bozori", to: "/hunarmandlar", icon: Compass },
];

export default function NotFound() {
  return (
    <section className="relative overflow-hidden py-24">
      <Container className="relative">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto flex max-w-xl flex-col items-center text-center"
        >
          <span className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Compass className="size-7" aria-hidden="true" />
          </span>
          <p className="mt-6 text-xs font-semibold tracking-[0.2em] text-gold uppercase">
            Xatolik 404
          </p>
          <h1 className="mt-3 text-[28px] leading-9 font-bold tracking-tight text-foreground sm:text-[34px]">
            Bu sahifa marshrutda yo'q
          </h1>
          <p className="mt-3 text-[15px] leading-6 text-muted-foreground">
            Havola o'zgargan yoki sahifa ko'chirilgan bo'lishi mumkin. Quyidagi bo'limlardan
            davom eting yoki bosh sahifaga qayting.
          </p>

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Button size="lg" asChild>
              <Link to="/">
                <ArrowLeft className="size-4" aria-hidden="true" />
                Bosh sahifa
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/paketlar">Tur paketlarni ko'rish</Link>
            </Button>
          </div>

          <ul className="mt-10 grid w-full gap-3 sm:grid-cols-3">
            {LINKS.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className="flex items-center gap-2 rounded-xl border bg-card px-4 py-3 text-[13px] font-semibold text-foreground transition-colors hover:border-primary/40"
                >
                  <link.icon className="size-4 text-primary" aria-hidden="true" />
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </motion.div>
      </Container>
    </section>
  );
}
