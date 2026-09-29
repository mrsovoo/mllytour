import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * millytour brend belgisi — gumbaz silueti (Registon manzilgohi uyi),
 * ichida yulduzcha: sayohat + meros. Minimal, bir rangli.
 */
export function MillytourLogo({
  className,
  mono = false,
}: {
  className?: string;
  mono?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "grid size-8 shrink-0 place-items-center rounded-lg",
          mono
            ? "border border-white/30 bg-white/10 text-white"
            : "bg-primary text-primary-foreground",
        )}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="size-5"
          aria-hidden="true"
        >
          <path
            d="M4 21c0-4.6 3.6-8.3 8-8.3s8 3.7 8 8.3"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
          <path
            d="M12 12.7c-1.9 0-3.4-1.5-3.4-3.4 0-1.9 1.5-3.4 3.4-3.4 1.9 0 3.4 1.5 3.4 3.4 0 1.9-1.5 3.4-3.4 3.4Z"
            stroke="currentColor"
            strokeWidth="1.7"
          />
          <path
            d="m12 6.4.9 1.7 1.9.2-1.4 1.3.4 1.9-1.8-1-1.8 1 .4-1.9L9.2 8.3l1.9-.2L12 6.4Z"
            fill="currentColor"
          />
          <path
            d="M12 4.9V2.6"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
          <path
            d="M2.5 21h19"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span
        className={cn(
          "text-lg font-bold tracking-tight",
          mono ? "text-white" : "text-foreground",
        )}
      >
        Millytour
      </span>
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
