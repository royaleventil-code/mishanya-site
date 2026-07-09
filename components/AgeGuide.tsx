import { BidiText } from "./BidiText";
import type { AgeGuideData } from "@/data/age-guide";
import type { Locale } from "@/lib/i18n";

// Гайд «как выбрать программу для {пол} {возраст}» + возрастной FAQ.
// Стиль списка повторяет FAQ-блок страниц городов (rounded-2xl, токены var(--color-...)).
export function AgeGuide({ locale = "ru", data }: { locale?: Locale; data: AgeGuideData }) {
  return (
    <section className="mx-auto max-w-3xl px-5 py-10 sm:px-6 sm:py-14">
      <h2 className="font-[family-name:var(--font-nunito)] text-xl font-black tracking-tight sm:text-2xl">
        <BidiText locale={locale}>{data.guideTitle}</BidiText>
      </h2>
      <p className="mt-3 text-[15px] leading-relaxed text-[var(--color-ink-soft)]">
        <BidiText locale={locale}>{data.guide}</BidiText>
      </p>

      <h2 className="mb-3 mt-8 text-base font-semibold">
        <BidiText locale={locale}>{data.faqTitle}</BidiText>
      </h2>
      <ul
        className="overflow-hidden rounded-2xl"
        style={{ background: "rgba(255,255,255,0.55)", border: "1px solid rgba(0,0,0,0.06)" }}
      >
        {data.faq.map((item, index) => (
          <li
            key={index}
            className="px-4 py-3"
            style={{ borderTop: index === 0 ? "none" : "0.5px solid rgba(0,0,0,0.08)" }}
          >
            <h3 className="text-[15px] font-semibold leading-snug">
              <BidiText locale={locale}>{item.q}</BidiText>
            </h3>
            <p className="mt-1 text-[15px] leading-snug text-[var(--color-ink-soft)]">
              <BidiText locale={locale}>{item.a}</BidiText>
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
