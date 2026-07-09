"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { BidiText } from "@/components/BidiText";
import { getDictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/i18n";

// jsonLd=false — когда на странице уже есть свой FAQPage (у Google допустим только один на страницу)
export function Faq({ locale = "ru", jsonLd = true }: { locale?: Locale; jsonLd?: boolean }) {
  const [open, setOpen] = useState<number | null>(null);
  const reduce = useReducedMotion();
  const dict = getDictionary(locale);
  const items = dict.catalog.faq.items;
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };

  return (
    <section className="mx-auto max-w-3xl px-5 py-10 sm:px-6 sm:py-14">
      {jsonLd && (
        <script
          type="application/ld+json"
          // экранируем «<» как на остальных страницах — текст не должен разорвать inline-скрипт
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c") }}
        />
      )}
      <p className="text-sm font-black uppercase tracking-wide text-[#ff9f0a]">
        {dict.catalog.faq.eyebrow}
      </p>
      <h2 className="mt-2 font-[family-name:var(--font-nunito)] text-2xl font-black tracking-tight sm:text-3xl">
        {dict.catalog.faq.title}
      </h2>

      <div className="mt-6 space-y-3">
        {items.map((item, i) => {
          const isOpen = open === i;
          return (
            <motion.div
              key={i}
              initial={reduce ? false : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: "easeOut" }}
              className="overflow-hidden rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-card)] ring-1 ring-black/[0.04]"
            >
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-start sm:px-6 sm:py-5"
                aria-expanded={isOpen}
              >
                <span className="font-[family-name:var(--font-nunito)] text-[15px] font-black sm:text-base">
                  <BidiText locale={locale}>{item.q}</BidiText>
                </span>
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-[var(--color-ink-soft)] transition-transform duration-300 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                  strokeWidth={2.6}
                />
              </button>
              <motion.div
                initial={false}
                animate={isOpen ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="overflow-hidden"
                aria-hidden={!isOpen}
              >
                <p className="-mt-1 px-5 pb-5 text-sm leading-relaxed text-[var(--color-ink-soft)] sm:px-6 sm:pb-6">
                  <BidiText locale={locale}>{item.a}</BidiText>
                </p>
              </motion.div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
