"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const ITEMS = [
  {
    q: "Почему именно эти программы?",
    a: "Мы подобрали программы, которые лучше всего подходят для этого возраста и пола — учли интересы и формат. Полный каталог можно посмотреть в общем разделе или спросить менеджера в WhatsApp.",
  },
  {
    q: "Окончательная ли это цена?",
    a: "Цена «от X ₪» — это базовая стоимость программы. Финальная сумма зависит от количества детей, локации, дополнительных опций и города. Точный расчёт менеджер сделает за 5 минут в WhatsApp.",
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

export function Faq() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="mx-auto max-w-3xl px-5 sm:px-6 py-10 sm:py-14">
      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
        Частые вопросы
      </h2>

      <div className="mt-6 divide-y divide-[var(--color-line)] rounded-2xl bg-white shadow-[0_8px_24px_rgba(15,15,20,0.04)]">
        {ITEMS.map((item, i) => {
          const isOpen = open === i;
          return (
            <div key={i}>
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                className="w-full text-left px-5 py-4 sm:px-6 sm:py-5 flex items-center justify-between gap-4"
                aria-expanded={isOpen}
              >
                <span className="text-[15px] sm:text-base font-medium">
                  {item.q}
                </span>
                <ChevronDown
                  className={`w-5 h-5 shrink-0 text-[var(--color-ink-soft)] transition-transform ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {isOpen && (
                <div className="px-5 pb-5 sm:px-6 sm:pb-6 -mt-1 text-sm text-[var(--color-ink-soft)] leading-relaxed">
                  {item.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
