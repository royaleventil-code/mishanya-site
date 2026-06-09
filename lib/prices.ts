import type { Locale } from "@/lib/i18n";

export function formatPriceAmount(amount: number): string {
  return Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

export function formatLocalizedPriceAmount(amount: number, locale: Locale = "ru"): string {
  if (locale === "he") return Math.round(amount).toLocaleString("en-US");
  return formatPriceAmount(amount);
}

export function formatShekelPrice(amount: number, locale: Locale = "ru"): string {
  return `${formatLocalizedPriceAmount(amount, locale)} ₪`;
}

export function hasStartingPrice(programId: string): boolean {
  return programId === "circus";
}

export function formatProgramPriceLabel(
  programId: string,
  amount: number,
  locale: Locale = "ru",
): string {
  const price = formatShekelPrice(amount, locale);
  if (locale === "he") return hasStartingPrice(programId) ? `החל מ־${price}` : price;
  return hasStartingPrice(programId) ? `от ${price}` : price;
}
