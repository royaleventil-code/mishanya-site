"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { HEROES, getHeroImage } from "@/data/heroes";

const TILES = HEROES.filter((h) => getHeroImage(h.id)).slice(0, 18);

export function HeroesStrip() {
  const reduce = useReducedMotion();

  return (
    <section className="overflow-hidden bg-[#fffaf4] py-14 sm:py-20">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <p className="text-sm font-black uppercase tracking-wide text-[#5e5ce6]">Любимые герои</p>
        <h2 className="mt-2 font-[family-name:var(--font-nunito)] text-[32px] font-black leading-tight tracking-tight text-zinc-950 sm:text-5xl">
          80+ персонажей, которых обожают дети
        </h2>
        <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--color-ink-soft)] sm:text-lg">
          Супергерои, принцессы, ростовые куклы и тематические образы — подберём любимца вашего
          ребёнка.
        </p>
      </div>

      <div className="hide-scrollbar mt-8 flex gap-3 overflow-x-auto px-5 pb-2 sm:gap-4 sm:px-6">
        {TILES.map((h, i) => {
          const img = getHeroImage(h.id) as string;
          return (
            <motion.div
              key={h.id}
              initial={reduce ? false : { opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.4, delay: (i % 6) * 0.05 }}
              className="w-[112px] shrink-0 rounded-[var(--radius-card)] bg-white p-3 text-center shadow-[var(--shadow-card)] ring-1 ring-black/[0.04] sm:w-[128px]"
            >
              <div className="relative mx-auto flex aspect-square items-center justify-center rounded-2xl bg-[#f7f4ff]">
                <Image src={img} alt={h.name} fill sizes="128px" className="object-contain p-2" />
              </div>
              <div className="mt-2 line-clamp-1 text-xs font-bold text-zinc-800">{h.name}</div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
