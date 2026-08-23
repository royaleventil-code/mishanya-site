import type { Locale } from "@/lib/i18n";

/** Бренд-палитра сайта: ею красим шаги и плитки, чтобы страницы не были серыми */
export const ACCENTS = ["#0a84ff", "#ff375f", "#ff9f0a", "#5e5ce6"] as const;

export const accentAt = (index: number) => ACCENTS[index % ACCENTS.length];

/**
 * CSS-градиент не знает про направление письма: на иврите угол зеркалим,
 * иначе цветная подложка уходит в сторону, противоположную цветной полоске.
 */
export const mirrorAngle = (angle: number, locale: Locale) =>
  locale === "he" ? 360 - angle : angle;
