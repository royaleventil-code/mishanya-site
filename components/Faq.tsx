"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

const ITEMS = [
  {
    q: "Почему именно эти программы?",
    a: "Мы подобрали программы, которые лучше всего подходят для этого возраста и пола — учли интересы и формат. Полный каталог можно посмотреть в общем разделе или спросить менеджера в WhatsApp.",
  },
  {
    q: "Окончательная ли это цена?",
    a: "Да, цена программы фиксированная и указана в карточке. «От» оставляем только у циркового шоу, потому что там состав артистов и формат могут отличаться. Дополнительные опции считаются отдельно, если вы захотите их добавить.",
  },
  {
    q: "Можно ли выбрать другого героя?",
    a: "В каждой программе можно выбрать героя из списка под программой. Если не нашли нужного — напишите менеджеру, у нас более 80 персонажей и мы подберём любого.",
  },
  {
    q: "На каком языке проводится программа?",
    a: "У нас русскоговорящие, иврит-говорящие и двуязычные ведущие. Язык программы зависит от выбора — указан в каждой карточке. Программа «Мишаня», «ТехноШоу» и «Барби» проводятся только на русском, остальные — на оба языка.",
  },
  {
    q: "Можно ли изменить детали программы?",
    a: "Конечно. Любую программу можно адаптировать под ваш праздник — увеличить длительность, добавить персонажа, поменять активности. Обсудите с менеджером в WhatsApp.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: ITEMS.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.a,
    },
  })),
};

export function Faq() {
  const [open, setOpen] = useState<number | null>(null);
  const reduce = useReducedMotion();

  return (
    <section className="mx-auto max-w-3xl px-5 py-10 sm:px-6 sm:py-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <p className="text-sm font-black uppercase tracking-wide text-[#ff9f0a]">
        Вопросы
      </p>
      <h2 className="mt-2 font-[family-name:var(--font-nunito)] text-2xl font-black tracking-tight sm:text-3xl">
        Частые вопросы
      </h2>

      <div className="mt-6 space-y-3">
        {ITEMS.map((item, i) => {
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
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6 sm:py-5"
                aria-expanded={isOpen}
              >
                <span className="font-[family-name:var(--font-nunito)] text-[15px] font-black sm:text-base">
                  {item.q}
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
                  {item.a}
                </p>
              </motion.div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
