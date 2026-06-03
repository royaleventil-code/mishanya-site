"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const FAQ = [
  {
    q: "Сколько стоит детский праздник?",
    a: "Базовая программа стоит 1 300 ₪. У большинства программ цена фиксированная и указана сразу; «от» оставляем только у циркового шоу. Дополнительные опции можно добавить отдельно.",
  },
  {
    q: "Где вы проводите праздники?",
    a: "По всему Израилю: дома, в зале, детском саду, ресторане, парке или на площадке. Подскажем, какой формат лучше под ваше место.",
  },
  {
    q: "На каком языке ведущий?",
    a: "Русский, иврит или смешанный формат — выбираете под ваших гостей, чтобы было комфортно и детям, и взрослым.",
  },
  {
    q: "Можно выбрать конкретного героя?",
    a: "Да. У нас 80+ персонажей и образов — подберём любимого героя под возраст и тему праздника.",
  },
  {
    q: "Как забронировать дату?",
    a: "Напишите нам в WhatsApp — проверим, свободна ли дата, и закрепим её за вами.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="bg-[#fffaf4] px-5 py-14 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-3xl">
        <p className="text-center text-sm font-black uppercase tracking-wide text-[#ff9f0a]">
          Вопросы
        </p>
        <h2 className="mt-2 text-center font-[family-name:var(--font-nunito)] text-[32px] font-black leading-tight tracking-tight text-zinc-950 sm:text-5xl">
          Частые вопросы
        </h2>

        <div className="mt-8 space-y-3">
          {FAQ.map((item, i) => {
            const isOpen = open === i;
            return (
              <div
                key={item.q}
                className="overflow-hidden rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-card)] ring-1 ring-black/[0.04]"
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6"
                >
                  <span className="font-[family-name:var(--font-nunito)] text-base font-black text-zinc-950 sm:text-lg">
                    {item.q}
                  </span>
                  <ChevronRight
                    className={`h-5 w-5 shrink-0 text-zinc-400 transition-transform duration-300 ${
                      isOpen ? "rotate-90" : ""
                    }`}
                    strokeWidth={2.6}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-5 text-sm leading-6 text-[var(--color-ink-soft)] sm:px-6">
                        {item.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
