import type { Locale } from "@/lib/i18n";
import { formatShekelPrice } from "@/lib/prices";
import type { Program } from "@/lib/types";

export function ProgramDiscount({
  program,
  locale,
  totalPrice = program.priceFrom,
}: {
  program: Program;
  locale: Locale;
  totalPrice?: number;
}) {
  const { originalPrice, priceFrom } = program;
  if (originalPrice === undefined || originalPrice <= priceFrom) return null;

  const savings = originalPrice - priceFrom;
  const discount = Math.round((savings / originalPrice) * 100);

  return (
    <div className="mt-2 flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
      <span className="sr-only">{locale === "he" ? "מחיר קודם" : "Прежняя цена"}</span>
      <del dir="ltr" className="whitespace-nowrap text-sm font-medium text-[var(--color-muted)]">
        {formatShekelPrice(totalPrice + savings, locale)}
      </del>
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-800">
        <bdi dir="ltr">−{discount}%</bdi>
        {totalPrice > priceFrom && <span>{locale === "he" ? "על התוכנית" : "на программу"}</span>}
      </span>
    </div>
  );
}
