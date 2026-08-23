import { BidiText } from "@/components/BidiText";
import { accentAt } from "@/components/AccentPalette";
import type { Locale } from "@/lib/i18n";

/**
 * Перечень услуг плитками-«кнопками» вместо списка с точками.
 * Копирайт пишется одной строкой «Заголовок: подробности» - разбираем
 * по первому двоеточию, чтобы не заводить отдельную структуру данных.
 * Строка без двоеточия остаётся просто заголовком.
 */
export function FeatureTiles({ items, locale }: { items: readonly string[]; locale: Locale }) {
  return (
    <ul className="grid gap-2.5 sm:grid-cols-2">
      {items.map((item, index) => {
        const separator = item.indexOf(": ");
        const title = separator > 0 ? item.slice(0, separator) : item;
        const detail = separator > 0 ? item.slice(separator + 2) : "";
        const accent = accentAt(index);

        return (
          <li
            key={index}
            className="rounded-2xl border border-white/70 bg-white px-4 py-3 shadow-[0_6px_18px_rgba(15,15,20,0.06)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(15,15,20,0.1)]"
          >
            <span className="flex items-center gap-2">
              <span
                aria-hidden
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: accent, boxShadow: `0 0 0 4px ${accent}1f` }}
              />
              <span className="text-[15px] font-bold leading-snug text-[var(--color-ink)]">
                <BidiText locale={locale}>{title}</BidiText>
              </span>
            </span>
            {detail && (
              <span className="mt-1 block text-sm leading-relaxed text-[var(--color-ink-soft)]">
                <BidiText locale={locale}>{detail}</BidiText>
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
