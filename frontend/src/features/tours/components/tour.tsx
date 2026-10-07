import { Link } from "react-router";
import {
  ArrowUpRight,
  CalendarDays,
  Clock,
  Heart,
  Landmark,
  MapPin,
  Moon,
  Mountain,
  Palette,
  Route,
  Star,
  TreePine,
  Users,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Price } from "@/shared/lib/currency";
import { TOUR_CATEGORIES, type CategoryId, type TourPackage } from "@/shared/data/catalog";
import {
  TOUR_KINDS,
  cityCount,
  isDirection,
  type TourKind,
} from "@/features/tours/lib/tours";
import { cn } from "@/shared/lib/utils";

/**
 * Tur turkumlari: "Barcha tur paketlar" + yo'nalish turlari
 * (tarixiy shaharlar, ekoturizm, hunarmandchilik, ziyorat, sarguzasht).
 */
export function CategoryTabs({
  value,
  onChange,
  counts,
  tone = "light",
  className,
}: {
  value: CategoryId;
  onChange: (id: CategoryId) => void;
  counts?: Partial<Record<CategoryId, number>>;
  tone?: "light" | "dark";
  className?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label="Tur turkumlari"
      className={cn("no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1", className)}
    >
      {TOUR_CATEGORIES.map((cat) => {
        const active = cat.id === value;
        const count = counts?.[cat.id];
        return (
          <button
            key={cat.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(cat.id)}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              tone === "dark"
                ? active
                  ? "border-transparent bg-white text-foreground"
                  : "border-white/20 bg-white/10 text-white/85 hover:bg-white/20"
                : active
                  ? "border-primary bg-primary text-primary-foreground shadow-xs"
                  : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground",
            )}
          >
            {cat.label}
            {typeof count === "number" && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[11px] font-bold",
                  tone === "dark"
                    ? active
                      ? "bg-primary/10 text-primary"
                      : "bg-white/15 text-white/80"
                    : active
                      ? "bg-white/20 text-white"
                      : "bg-muted text-muted-foreground",
                )}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function categoryLabel(id: CategoryId) {
  return TOUR_CATEGORIES.find((c) => c.id === id)?.short ?? "Tur paket";
}

/**
 * Tur turi: «Tur paketlar» (bitta shahar) va «Yo'nalishlar» (2-3 shahar).
 * Shu tugma orqali ikki xil tur bitta bo'lim ichida ajratiladi.
 */
export function TourKindTabs({
  value,
  onChange,
  counts,
  className,
}: {
  value: TourKind;
  onChange: (kind: TourKind) => void;
  counts?: Record<TourKind, number>;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label="Tur turi"
      className={cn(
        "inline-flex flex-wrap gap-1 rounded-2xl border border-border/70 bg-card p-1",
        className,
      )}
    >
      {TOUR_KINDS.map((kind) => {
        const active = kind.id === value;
        const count = counts?.[kind.id];
        return (
          <button
            key={kind.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(kind.id)}
            title={kind.hint}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[13px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              active
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {kind.label}
            {typeof count === "number" && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[11px] font-bold",
                  active ? "bg-white/20 text-white" : "bg-muted text-muted-foreground",
                )}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function TourBadge({ badge }: { badge?: TourPackage["badge"] }) {
  if (!badge) {
    return null;
  }
  return (
    <Badge
      className={cn(
        "border-0 font-semibold shadow-xs",
        badge === "Best Seller" && "bg-primary text-primary-foreground",
        badge === "Hot Deal" && "bg-gold text-gold-foreground",
        badge === "New" && "bg-coral text-coral-foreground",
      )}
    >
      {badge}
    </Badge>
  );
}

/**
 * Rasm yuklanmagan paketlar uchun turkum bo'yicha fon gradienti va ikonka —
 * kartochka bo'sh ko'rinmaydi.
 */
const CATEGORY_ART: Record<
  Exclude<CategoryId, "all">,
  { grad: string; ink: string; icon: LucideIcon }
> = {
  // Fon — ikonka rangining past opacity'li varianti, ikonka — to'q rangi.
  historical: {
    grad: "from-amber-500/40 via-orange-400/30 to-orange-500/40",
    ink: "text-amber-600 dark:text-amber-300",
    icon: Landmark,
  },
  eco: {
    grad: "from-emerald-500/40 via-teal-400/30 to-teal-500/40",
    ink: "text-teal-600 dark:text-teal-300",
    icon: TreePine,
  },
  craft: {
    grad: "from-violet-500/40 via-purple-400/30 to-fuchsia-500/40",
    ink: "text-violet-600 dark:text-violet-300",
    icon: Palette,
  },
  pilgrimage: {
    grad: "from-sky-500/40 via-blue-400/30 to-blue-500/40",
    ink: "text-blue-600 dark:text-blue-300",
    icon: Moon,
  },
  adventure: {
    grad: "from-orange-500/40 via-red-400/30 to-red-500/40",
    ink: "text-red-500 dark:text-red-300",
    icon: Mountain,
  },
};

/** Chegirma foizi (eski narx yo'q bo'lsa 0) — narx yonidagi qizil nishon uchun. */
function discountPercent(tour: TourPackage): number {
  return tour.oldPrice && tour.oldPrice > tour.priceFrom
    ? Math.round((1 - tour.priceFrom / tour.oldPrice) * 100)
    : 0;
}

/**
 * Tur kartochkasi.
 *
 * Tuzilishi: rasm ustida turkum/tur teglari (chapda) va reyting (o'ngda),
 * ostida manzil → tur nomi → kun/kecha · guruh · qatnov qatori, eng pastda
 * narx bloki ($ va so'm) hamda "Batafsil" tugmasi.
 */
export function TourCard({
  tour,
  className,
  href,
}: {
  tour: TourPackage;
  className?: string;
  href?: string;
}) {
  const discount = discountPercent(tour);
  // Nishon bo'lmasa, reytingi yuqori turlar "Top tanlov" bilan belgilanadi.
  const statusBadge = tour.badge ?? (tour.rating >= 4.8 ? "Top tanlov" : null);
  const art = CATEGORY_ART[tour.category] ?? CATEGORY_ART.historical;
  const ArtIcon = art.icon;

  return (
    <article
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-[26px] border border-border/60 bg-card shadow-[0_10px_30px_-14px_rgba(15,23,42,0.22)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_55px_-20px_rgba(15,23,42,0.32)]",
        className,
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {tour.image ? (
          <img
            src={tour.image}
            alt={tour.alt}
            loading="lazy"
            decoding="async"
            className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div
            className={cn(
              "grid size-full place-items-center bg-gradient-to-br transition-transform duration-500 group-hover:scale-[1.04]",
              art.grad,
            )}
          >
            <div className={cn("flex flex-col items-center gap-2", art.ink)}>
              <ArtIcon className="size-12" aria-hidden="true" />
              <span className="text-[11px] font-bold tracking-wider uppercase">
                {categoryLabel(tour.category)}
              </span>
            </div>
          </div>
        )}

        {/* Teglar — yarim shaffof ko'k planshetlar */}
        <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5">
          <span className="rounded-full bg-primary/85 px-2.5 py-1 text-[11px] font-semibold text-primary-foreground backdrop-blur-sm">
            {categoryLabel(tour.category)}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/85 px-2.5 py-1 text-[11px] font-semibold text-primary-foreground backdrop-blur-sm">
            {isDirection(tour) ? (
              <>
                <Route className="size-3" aria-hidden="true" />
                Yo'nalish · {cityCount(tour)} shahar
              </>
            ) : (
              "Tur paket"
            )}
          </span>
        </div>

        {/* Reyting — rasmning o'ng yuqori burchagida */}
        <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-foreground/65 px-2.5 py-1 text-[11.5px] font-bold text-white backdrop-blur-sm">
          <Star className="size-3.5 fill-gold text-gold" aria-hidden="true" />
          {tour.rating.toFixed(1)}
          <span className="font-medium text-white/70">({tour.reviews})</span>
        </span>

        {discount > 0 ? (
          <span className="absolute bottom-3 left-3 rounded-full bg-coral px-2 py-0.5 text-[10.5px] font-bold text-coral-foreground">
            −{discount}%
          </span>
        ) : null}

        <button
          type="button"
          aria-label="Saqlangan turlarga qo'shish"
          onClick={() => toast.success(`"${tour.title}" saqlangan turlarga qo'shildi`)}
          className="absolute right-3 bottom-3 grid size-9 place-items-center rounded-full bg-white/90 text-foreground shadow-xs transition-colors hover:bg-white"
        >
          <Heart className="size-4" aria-hidden="true" />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        {/* Manzil + maqom nishoni */}
        <div className="flex min-h-10 items-start justify-between gap-3">
          <p className="flex min-w-0 flex-1 items-start gap-1.5 text-[13.5px] leading-5 font-semibold text-foreground">
            <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            <span className="min-w-0">
              <span className="block truncate">{tour.city}</span>
              <span className="block truncate text-[11.5px] font-medium text-muted-foreground">
                {tour.region}
              </span>
            </span>
          </p>
          {statusBadge ? (
            <span className="shrink-0 rounded-full border border-border px-2.5 py-1 text-[10.5px] font-semibold tracking-wide text-muted-foreground uppercase">
              {statusBadge}
            </span>
          ) : null}
        </div>

        {/* Tur nomi — manzildan kattaroq */}
        <h3 className="mt-2 line-clamp-2 min-h-12 text-[17px] leading-6 font-bold tracking-tight text-foreground">
          {tour.title}
        </h3>

        {/* Kun/kecha · guruh · qatnov */}
        {/* Ikkita qator — barcha kartada bir xil balandlik */}
        <div className="mt-2.5 space-y-1 text-[12.5px] leading-5 text-muted-foreground">
          <div className="flex items-center gap-x-3">
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <Clock className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{tour.days} kun / {tour.nights} kecha</span>
            </span>
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <Users className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{tour.groupSize}</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <CalendarDays className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{tour.nextDeparture}</span>
          </div>
        </div>

        {/* Narx + harakat tugmasi */}
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-border/60 pt-4">
          <div className="flex min-w-0 items-center gap-2">
            <span className="inline-flex min-w-[108px] flex-col rounded-xl bg-muted/70 px-3 py-1.5">
              <Price
                usd={tour.priceFrom}
                suffix="dan"
                className="text-[18px]"
                secondaryClassName="text-[10.5px]"
              />
            </span>
            {tour.oldPrice ? (
              <span className="text-[11.5px] text-muted-foreground line-through">
                ${tour.oldPrice}
              </span>
            ) : null}
          </div>
          <Button
            size="sm"
            asChild
            className="shrink-0 rounded-full bg-foreground px-4 text-background hover:bg-foreground/90"
          >
            <Link to={href ?? `/paketlar/${tour.slug}`}>
              Batafsil
              <ArrowUpRight className="size-3.5" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
