import { Star } from "lucide-react";
import { cn } from "@/shared/lib/utils";

/**
 * MillyTour brend belgisi — faqat so'z belgisi (wordmark).
 * Simvol/ikonka ishlatilmaydi, brend nomi matn ko'rinishida yoziladi.
 */
export function MillyTourLogo({
  className,
  mono = false,
}: {
  className?: string;
  mono?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center text-lg font-bold tracking-tight",
        mono ? "text-white" : "text-foreground",
        className,
      )}
    >
      MillyTour
    </span>
  );
}

export function Rating({
  value,
  reviews,
  className,
  light = false,
}: {
  value: number;
  reviews?: number;
  className?: string;
  light?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-sm",
        light ? "text-white/90" : "text-muted-foreground",
        className,
      )}
    >
      <Star className="size-4 fill-gold text-gold" aria-hidden="true" />
      <span className={cn("font-semibold", light ? "text-white" : "")}>
        {value.toFixed(1)}
      </span>
      {reviews !== undefined && <span>({reviews})</span>}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      {eyebrow && (
        <p className="mb-3 text-xs font-semibold tracking-[0.2em] text-accent uppercase">
          {eyebrow}
        </p>
      )}
      <h2 className="text-2xl leading-8 font-bold tracking-tight text-foreground sm:text-[28px] sm:leading-9">
        {title}
      </h2>
      {description && (
        <p className="mt-3 text-base leading-6 text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  );
}
