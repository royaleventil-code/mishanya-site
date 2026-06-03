"use client";

import { CalendarCheck, Languages, Palette, ShieldCheck } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

const ITEMS = [
  {
    Icon: Palette,
    color: "#ff375f",
    title: "Любимые герои и яркие шоу",
    text: "80+ персонажей и форматов — от супергероев и принцесс до науки, неона и пены.",
  },
  {
    Icon: CalendarCheck,
    color: "#0a84ff",
    title: "Под возраст и формат",
    text: "Малышам и школьникам, дома, в зале, в саду или на улице — сценарий подстроим.",
  },
  {
    Icon: Languages,
    color: "#ff9f0a",
    title: "На русском и иврите",
    text: "Ведущие говорят на языке ваших гостей — праздник комфортен всей семье.",
  },
  {
    Icon: ShieldCheck,
    color: "#5e5ce6",
    title: "11 лет и 10 000+ праздников",
    text: "Нам доверяют тысячи семей, детские сады и мэрии по всему Израилю.",
  },
];

export function WhyUs() {
  const reduce = useReducedMotion();

  return (
    <section className="bg-white px-5 py-14 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <p className="text-sm font-black uppercase tracking-wide text-[#0a84ff]">Почему Страна Чудес</p>
          <h2 className="mt-2 font-[family-name:var(--font-nunito)] text-[32px] font-black leading-tight tracking-tight text-zinc-950 sm:text-5xl">
            Праздник, который любят и дети, и родители
          </h2>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5">
          {ITEMS.map((item, i) => (
            <motion.article
              key={item.title}
              initial={reduce ? false : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-start gap-4 rounded-[var(--radius-card)] bg-[#fffaf4] p-5 shadow-[var(--shadow-card)] ring-1 ring-black/[0.04] sm:p-6"
            >
              <span
                className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                style={{ background: `${item.color}1f` }}
              >
                <item.Icon className="h-6 w-6" strokeWidth={2.4} style={{ color: item.color }} />
              </span>
              <div>
                <h3 className="font-[family-name:var(--font-nunito)] text-lg font-black leading-tight text-zinc-950">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-sm leading-6 text-[var(--color-ink-soft)]">{item.text}</p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
