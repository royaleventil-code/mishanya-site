"use client";

import { motion, useReducedMotion } from "framer-motion";

const STATS = [
  {
    value: "10 000+",
    label: "праздников",
    color: "#0a84ff",
  },
  {
    value: "11 лет",
    label: "в Израиле",
    color: "#5e5ce6",
  },
  {
    value: "783",
    label: "отзыва 5★",
    color: "#ff9f0a",
  },
  {
    value: "100M",
    label: "просмотров YouTube",
    color: "#ff375f",
  },
];

export function Trust() {
  const reduce = useReducedMotion();

  return (
    <section className="relative overflow-hidden bg-[#0f0f14] py-12 text-white sm:py-20">
      <div className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full bg-[#ff375f] opacity-30 blur-[90px]" />
      <div className="pointer-events-none absolute -bottom-16 -right-16 h-64 w-64 rounded-full bg-[#5e5ce6] opacity-30 blur-[90px]" />

      <div className="relative mx-auto max-w-5xl px-5 sm:px-6">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 sm:gap-4">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={reduce ? false : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: "easeOut" }}
              className="relative overflow-hidden rounded-[var(--radius-card)] px-2 py-6 text-center sm:px-4"
              style={{
                background: `radial-gradient(120% 100% at 50% 0%, ${s.color}26 0%, ${s.color}14 45%, transparent 75%)`,
                boxShadow: `inset 0 0 0 1px ${s.color}33, 0 0 32px -8px ${s.color}40`,
              }}
            >
              <div
                className="whitespace-nowrap font-[family-name:var(--font-nunito)] text-[26px] font-black leading-none tracking-tight tabular-nums sm:text-5xl"
                style={{
                  color: s.color,
                  filter: `drop-shadow(0 0 14px ${s.color}66)`,
                }}
              >
                {s.value}
              </div>
              <div className="mt-2 whitespace-nowrap text-xs text-white/70 sm:text-sm">
                {s.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
