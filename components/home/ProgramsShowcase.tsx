"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { PROGRAMS } from "@/data/programs";
import type { Program } from "@/lib/types";

const FEATURED_IDS = ["super-heroes", "frozen-toddler-girls", "chemistry", "paw-patrol-toddler-boys", "tiktok", "mishanya"];

function coverOf(p: Program): string {
  return p.cover ?? "/generated/program-party.webp";
}

const FEATURED: Program[] = FEATURED_IDS.map((id) => PROGRAMS.find((p) => p.id === id)).filter(
  (p): p is Program => Boolean(p)
);

export function ProgramsShowcase() {
  const reduce = useReducedMotion();

  return (
    <section id="programs" className="bg-white px-5 py-14 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <p className="text-sm font-black uppercase tracking-wide text-[#ff375f]">Программы</p>
          <h2 className="mt-2 font-[family-name:var(--font-nunito)] text-[32px] font-black leading-tight tracking-tight text-zinc-950 sm:text-5xl">
            Выберите праздник по душе
          </h2>
          <p className="mt-3 text-base leading-7 text-[var(--color-ink-soft)] sm:text-lg">
            Готовые программы с понятной ценой. Любую адаптируем под героя, возраст и формат вашего
            ребёнка.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
          {FEATURED.map((p, i) => (
            <motion.div
              key={p.id}
              initial={reduce ? false : { opacity: 0, y: 26 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.5, delay: (i % 3) * 0.08, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link
                href={`/all?program=${encodeURIComponent(p.id)}`}
                className="group block overflow-hidden rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-card)] ring-1 ring-black/[0.04] transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)]"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-[#f3f0ff]">
                  <Image
                    src={coverOf(p)}
                    alt={p.title}
                    fill
                    sizes="(max-width: 768px) 50vw, 30vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute left-2.5 top-2.5 rounded-full bg-white/92 px-2.5 py-1 text-xs font-black text-zinc-900 shadow-sm backdrop-blur">
                    от {p.priceFrom} {p.currency}
                  </div>
                </div>
                <div className="p-3 sm:p-4">
                  <h3 className="font-[family-name:var(--font-nunito)] text-base font-black leading-tight text-zinc-950 sm:text-lg">
                    {p.title}
                  </h3>
                  <p className="mt-1 line-clamp-1 text-xs text-[var(--color-ink-soft)] sm:text-sm">
                    {p.tagline}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <Link
            href="/all"
            className="group inline-flex items-center justify-center gap-2 rounded-full bg-zinc-950 px-7 py-4 text-base font-black text-white shadow-lg transition hover:bg-zinc-800 active:scale-95"
          >
            Все программы и цены
            <ChevronRight className="h-5 w-5 transition group-hover:translate-x-0.5" strokeWidth={2.6} />
          </Link>
        </div>
      </div>
    </section>
  );
}
