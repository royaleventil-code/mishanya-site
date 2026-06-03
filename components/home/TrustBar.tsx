"use client";

import { motion, useReducedMotion } from "framer-motion";

const STATS = [
  { value: "11 лет", label: "дарим праздники в Израиле", color: "#ff9f0a" },
  { value: "10 000+", label: "праздников уже провели", color: "#0a84ff" },
  { value: "783", label: "отзыва родителей · 5,0 ★", color: "#ff375f" },
  { value: "100M", label: "просмотров наших шоу", color: "#5e5ce6" },
];

export function TrustBar() {
  const reduce = useReducedMotion();

  return (
    <section className="bg-[#fffaf4] px-5 pb-12 pt-2 sm:px-6 sm:pb-16">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        {STATS.map((s, i) => (
          <motion.div
            key={s.label}
            initial={reduce ? false : { opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-[var(--radius-card)] bg-white p-5 text-center shadow-[var(--shadow-card)] ring-1 ring-black/[0.04] sm:p-6"
          >
            <div
              className="font-[family-name:var(--font-nunito)] text-3xl font-black leading-none sm:text-4xl"
              style={{ color: s.color }}
            >
              {s.value}
            </div>
            <div className="mt-2 text-xs font-semibold leading-snug text-[var(--color-ink-soft)] sm:text-sm">
              {s.label}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
