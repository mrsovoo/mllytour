import { Link } from "react-router";
import { MapPin, Star } from "lucide-react";
import { destinationPricing, type Destination } from "@/data/destinations";
import { formatPrimary, formatSecondary } from "@/lib/currency";
import { cn } from "@/lib/utils";

/**
 * Yo'nalish kartochkasi.
 *
 * Tuzilishi (so'ralgan ko'rinish):
 *   [ rasm — kartochkaning deyarli butun kengligi ]
 *   [ chap yuqorida chegirma nishoni — "-30%" ]
 *   [ pastda qoramtir gradient ustida oq matn ]
 *     Shahar nomi · viloyat
 *     "dan $499"  + eski narx ustidan chiziq
 *     ★★★★★ 4.8 (412 sharh)
 * Butun kartochka bosiladi → /shaharlar/:slug
 */
export function DestinationCard({
  destination,
  className,
}: {
  destination: Destination;
  className?: string;
}) {
  const { priceFrom, oldPrice, discount, packageCount, rating, reviews } =
    destinationPricing(destination);

  return (
    <Link
      to={`/shaharlar/${destination.slug}`}
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-[24px] border border-border/70 bg-card shadow-[0_10px_30px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/25 hover:shadow-[0_22px_50px_rgba(31,91,255,0.16)]",
        className,
      )}
    >
      {/* Rasm + gradient + matn */}
      <div className="relative aspect-[4/5] w-full overflow-hidden">
        <img
          src={destination.image}
          alt={destination.alt}
          loading="lazy"
          decoding="async"
          className="size-full object-cover transition-transform duration-[900ms] group-hover:scale-[1.07]"
        />

        {/* Matn o'qilishi uchun qoramtir gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050B19]/92 via-[#050B19]/35 to-transparent" />

        {discount > 0 && (
          <span className="absolute top-3 left-3 rounded-full bg-coral px-2.5 py-1 text-[11px] font-bold tracking-wide text-coral-foreground shadow-sm">
            −{discount}%
          </span>
        )}

        <div className="absolute inset-x-0 bottom-0 p-4 text-white">
          <h3 className="text-[19px] leading-6 font-extrabold tracking-tight">
            {destination.name}
          </h3>
          <p className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-white/75">
            <MapPin className="size-3.5 text-gold" aria-hidden="true" />
            {destination.region} · {packageCount} tur paket
          </p>

          <div className="mt-3 flex flex-wrap items-end gap-x-2 gap-y-0.5 border-t border-white/20 pt-3">
            <span className="text-[11px] text-white/70">dan</span>
            <span className="text-[19px] leading-6 font-extrabold">{formatPrimary(priceFrom)}</span>
            {oldPrice > priceFrom && (
              <span className="pb-0.5 text-[12px] text-white/55 line-through">
                {formatPrimary(oldPrice)}
              </span>
            )}
            <span className="w-full text-[11px] text-white/60">{formatSecondary(priceFrom)}</span>
          </div>

          <div className="mt-2 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-0.5" aria-hidden="true">
              {Array.from({ length: 5 }).map((_, star) => (
                <Star
                  key={star}
                  className={cn(
                    "size-3",
                    star < Math.round(rating) ? "fill-gold text-gold" : "text-white/30",
                  )}
                />
              ))}
            </span>
            <span className="text-[11.5px] font-semibold">{rating.toFixed(1)}</span>
            <span className="text-[11px] text-white/60">({reviews} sharh)</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
