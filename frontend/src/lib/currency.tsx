import { cn } from "@/lib/utils";

/**
 * Pul birligi.
 *
 * Narxlar bazada USD'da saqlanadi. Interfeysda har doim bosh liniyada `$`
 * ko'rsatiladi, ostidagi kichik qatorda esa so'mdagi ekvivalent turadi
 * (statik kurs — keyinchalik API bilan yangilanishi mumkin).
 */

/** 1 USD = necha so'm. */
export const UZS_PER_USD = 12650;

/** 1265000 → "1 265 000" (uzbekcha bo'shliq bilan guruhlash). */
export function group(n: number) {
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

export function usdToUzs(usd: number) {
  return usd * UZS_PER_USD;
}

export function uzsToUsd(uzs: number) {
  return uzs / UZS_PER_USD;
}

/** Bosh qator: `$299`. */
export function formatPrimary(usd: number) {
  const value = Math.round(usd * 100) / 100;
  return `$${Number.isInteger(value) ? group(value) : value.toFixed(2)}`;
}

/** Kichik qator: `≈ 3.78 mln so'm` yoki `≈ 253 000 so'm`. */
export function formatSecondary(usd: number) {
  const uzs = usdToUzs(usd);
  if (uzs >= 1_000_000) {
    return `≈ ${(Math.round(uzs / 10_000) / 100).toFixed(2)} mln so'm`;
  }
  return `≈ ${group(uzs)} so'm`;
}

/**
 * Narx: bosh qatorda `$`, pastida kichikroq so'm ekvivalenti.
 * Kartochkalarda va katta narxlarda ishlatiladi.
 */
export function Price({
  usd,
  className,
  secondaryClassName,
  suffix,
  hideSecondary = false,
}: {
  usd: number;
  className?: string;
  secondaryClassName?: string;
  suffix?: string;
  hideSecondary?: boolean;
}) {
  return (
    <span className={cn("inline-flex flex-col", className)}>
      <span className="font-bold whitespace-nowrap">
        {formatPrimary(usd)}
        {suffix ? <span className="ml-1 text-[0.72em] font-medium opacity-70">{suffix}</span> : null}
      </span>
      {!hideSecondary && (
        <span
          className={cn(
            "text-[0.72em] leading-tight font-medium text-muted-foreground whitespace-nowrap",
            secondaryClassName,
          )}
        >
          {formatSecondary(usd)}
        </span>
      )}
    </span>
  );
}

/** Bir qatordagi narx — jumla ichida ishlatiladi (`$299 ≈ 3.78 mln so'm`). */
export function PriceInline({ usd, className }: { usd: number; className?: string }) {
  return (
    <span className={cn("whitespace-nowrap", className)}>
      <span className="font-semibold">{formatPrimary(usd)}</span>
      <span className="ml-1.5 text-[0.78em] font-medium text-muted-foreground">
        {formatSecondary(usd)}
      </span>
    </span>
  );
}
