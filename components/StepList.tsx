import { BidiText } from "@/components/BidiText";
import { accentAt, mirrorAngle } from "@/components/AccentPalette";
import type { Locale } from "@/lib/i18n";

/**
 * Сценарий события по шагам: у каждого шага своя цветная полоса,
 * подложка в тот же цвет и крупная цифра. Читается как маршрут,
 * а не как серый нумерованный список.
 */
export function StepList({ steps, locale }: { steps: readonly string[]; locale: Locale }) {
  const angle = mirrorAngle(100, locale);

  return (
    <ol className="mt-3 space-y-2.5">
      {steps.map((step, index) => {
        const accent = accentAt(index);

        return (
          <li
            key={index}
            className="relative overflow-hidden rounded-2xl border border-white/70 py-3 pe-4 ps-5 shadow-[0_6px_18px_rgba(15,15,20,0.05)]"
            style={{ background: `linear-gradient(${angle}deg, ${accent}14 0%, #ffffff 62%)` }}
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-0 start-0 w-1.5"
              style={{ background: accent }}
            />
            <span className="flex items-start gap-3">
              <span
                aria-hidden
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-base font-black text-white"
                style={{ background: accent, boxShadow: `0 8px 18px ${accent}59` }}
              >
                {index + 1}
              </span>
              <span className="pt-1 text-[15px] leading-relaxed text-[var(--color-ink-soft)]">
                <BidiText locale={locale}>{step}</BidiText>
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
