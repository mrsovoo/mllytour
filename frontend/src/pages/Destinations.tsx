import { motion } from "framer-motion";
import { Compass, MapPin, Sparkles } from "lucide-react";
import { Container, PageHero } from "@/components/site";
import { DestinationCard } from "@/components/destination-card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router";
import { DESTINATIONS, destinationPricing } from "@/data/destinations";
import { openMillyAi } from "@/components/AiAssistant";

/** Barcha yo'nalishlar ro'yxati (`/shaharlar`). */
export default function Destinations() {
  const totalPackages = DESTINATIONS.reduce(
    (sum, destination) => sum + destinationPricing(destination).packageCount,
    0,
  );

  return (
    <>
      <PageHero
        eyebrow="Yo'nalishlar"
        title="O'zbekiston bo'ylab yo'nalishlar"
        description="Tarixiy shaharlar, cho'l va voha, hunarmandchilik markazlari — har biri uchun obidalar, eng yaxshi mavsum va tayyor tur paketlar."
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white/90">
            <MapPin className="size-3.5 text-gold" aria-hidden="true" />
            {DESTINATIONS.length} yo'nalish
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white/90">
            <Compass className="size-3.5 text-gold" aria-hidden="true" />
            {totalPackages} tur paket
          </span>
          <Button size="sm" variant="secondary" className="ml-auto" onClick={openMillyAi}>
            <Sparkles className="size-3.5" aria-hidden="true" />
            AI bilan tanlash
          </Button>
        </div>
      </PageHero>

      <Container className="py-12 lg:py-16">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {DESTINATIONS.map((destination, index) => (
            <motion.div
              key={destination.slug}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: Math.min(index * 0.06, 0.3) }}
            >
              <DestinationCard destination={destination} />
            </motion.div>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 rounded-3xl border bg-muted/40 p-6">
          <div>
            <p className="text-[15px] font-semibold text-foreground">
              Qaysi shahar sizga mos kelishini bilmayapsizmi?
            </p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Milly AI kunlar, byudjet va qiziqishlaringizga qarab bir necha soniyada tanlaydi.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={openMillyAi}>
              <Sparkles className="size-4" aria-hidden="true" />
              Milly AI
            </Button>
            <Button asChild>
              <Link to="/paketlar">Tur paketlar</Link>
            </Button>
          </div>
        </div>
      </Container>
    </>
  );
}
