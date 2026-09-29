import { Link } from "react-router";
import { useRestQuery } from "@/api/client";
import { motion } from "framer-motion";
import { CalendarDays, MapPin, Sparkles, Ticket, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/site";
import { cn } from "@/lib/utils";

type EventRow = {
  slug: string;
  title: string;
  city: string;
  month: number;
  dates: string;
  kind: string;
  summary: string;
  price: number;
  monthLabel: string;
  monthsAhead: number;
  isCurrentMonth: boolean;
  reason: string;
  directions: string[];
  packages: { slug: string; title: string; city: string; priceFrom: number }[];
};

const KIND_LABEL: Record<string, string> = {
  festival: "Festival",
  hunarmandchilik: "Hunarmandchilik",
  gastro: "Gastronomiya",
  musiqa: "Musiqa",
  sport: "Faol turizm",
  ilmiy: "Forum",
};

const DIRECTION_LABEL: Record<string, string> = {
  guide: "Gid",
  transfer: "Transfer",
  hotel: "Mehmonxona",
  restaurant: "Restoran",
  translator: "Tarjimon",
  photographer: "Fotograf",
  artisan: "Hunarmand",
  other: "Xizmat",
};

/**
 * "Bu oy tadbirlari" — har oy takrorlanadigan festivallar va tadbirlar.
 * Tavsiya algoritmi joriy oyga eng yaqin tadbirni birinchi chiqaradi va
 * unga mos tur paketlarini bog'laydi.
 */
export function EventsSection({
  className,
  heading = true,
}: {
  className?: string;
  heading?: boolean;
}) {
  const events = useRestQuery<EventRow[]>("events", "list", { limit: 6 });

  if (!events || events.length === 0) {
    return null;
  }

  return (
    <section className={cn("border-y bg-muted/40 py-14 lg:py-20", className)} aria-label="Tadbirlar">
      <Container>
        {heading && (
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold tracking-wide text-primary uppercase">
                <Ticket className="size-3.5" aria-hidden="true" />
                Turistik tadbirlar
              </span>
              <h2 className="mt-2 text-2xl leading-8 font-bold tracking-tight text-foreground">
                Bu oy nima bo'ladi
              </h2>
              <p className="mt-1 max-w-2xl text-[13px] leading-5 text-muted-foreground">
                Har oy takrorlanadigan festivallar, gastro kechalar va ekotur yig'inlari. Sana,
                shahar va tavsiya etilgan tur paketlar bilan.
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/paketlar?events=1">Tadbirli paketlar</Link>
            </Button>
          </div>
        )}

        <div className="no-scrollbar -mx-4 mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
          {events.map((event, i) => (
            <motion.article
              key={event.slug}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: Math.min(i * 0.05, 0.25) }}
              className="flex w-[280px] shrink-0 snap-start flex-col rounded-2xl border bg-card p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/15 px-2.5 py-1 text-[11px] font-bold text-gold-ink uppercase">
                  {event.monthLabel}
                </span>
                {event.isCurrentMonth && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-eco">
                    <Sparkles className="size-3" aria-hidden="true" />
                    Shu oy
                  </span>
                )}
              </div>

              <h3 className="mt-2 line-clamp-2 min-h-10 text-[15px] leading-5 font-semibold text-foreground">
                {event.title}
              </h3>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3" aria-hidden="true" />
                  {event.city}
                </span>
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="size-3" aria-hidden="true" />
                  {event.dates}
                </span>
                <span>{KIND_LABEL[event.kind] ?? event.kind}</span>
              </p>
              <p className="mt-2 line-clamp-3 text-[12px] leading-5 text-muted-foreground">
                {event.summary}
              </p>
              <p className="mt-2 text-[12px] leading-5 font-medium text-primary">{event.reason}</p>

              <p className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                <Users className="size-3" aria-hidden="true" />
                Kerak bo'ladi:
                {event.directions.map((d) => (
                  <span key={d} className="rounded-md bg-muted px-1.5 py-0.5">
                    {DIRECTION_LABEL[d] ?? d}
                  </span>
                ))}
              </p>

              <div className="mt-auto pt-3">
                <p className="text-[13px] font-bold text-foreground">
                  ${event.price}
                  <span className="ml-1 text-[11px] font-normal text-muted-foreground">
                    dan / kishi
                  </span>
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {event.packages[0] ? (
                    <Button size="sm" asChild>
                      <Link to={`/paketlar/${event.packages[0].slug}`}>Paketni olish</Link>
                    </Button>
                  ) : (
                    <Button size="sm" asChild>
                      <Link to="/xizmatlar">Xizmat tanlash</Link>
                    </Button>
                  )}
                  <Button size="sm" variant="outline" asChild>
                    <Link to={`/xizmatlar?city=${encodeURIComponent(event.city)}`}>Xizmatlar</Link>
                  </Button>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </Container>
    </section>
  );
}
