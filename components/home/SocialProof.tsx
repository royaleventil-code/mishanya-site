"use client";

import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

const PHOTOS = [
  "/proof/girls-4-6/page-11.webp",
  "/proof/boys-4-5/page-13.webp",
  "/proof/kids-1-3/page-10.webp",
  "/proof/boys-6-10/page-12.webp",
  "/proof/girls-7-10/page-13.webp",
];

const FB = "https://www.facebook.com/royaleventisrael/reviews/?ref=page_internal";
const YT = "https://www.youtube.com/channel/UCo189jVSku-2H_0Rgrw9JCw";

export function SocialProof() {
  const reduce = useReducedMotion();

  return (
    <section id="reviews" className="bg-white px-5 py-14 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl text-center">
        <div className="text-2xl text-[#ffb400]">★★★★★</div>
        <h2 className="mt-2 font-[family-name:var(--font-nunito)] text-[32px] font-black leading-tight tracking-tight text-zinc-950 sm:text-5xl">
          5,0 из 5 · 783 отзыва родителей
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-[var(--color-ink-soft)] sm:text-lg">
          Семьи возвращаются к нам год за годом и приводят друзей. Лучшее доказательство — реальные
          фото, видео и отзывы.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <a
            href={FB}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-zinc-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-zinc-800 active:scale-95"
          >
            Отзывы в Facebook
            <ChevronRight className="h-4 w-4" strokeWidth={2.6} />
          </a>
          <a
            href={YT}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-white px-5 py-3 text-sm font-bold text-zinc-900 ring-1 ring-black/10 transition hover:bg-zinc-50 active:scale-95"
          >
            Видео с праздников
            <ChevronRight className="h-4 w-4" strokeWidth={2.6} />
          </a>
        </div>
      </div>

      <div className="hide-scrollbar mx-auto mt-10 flex max-w-6xl gap-3 overflow-x-auto pb-2 sm:gap-4">
        {PHOTOS.map((src, i) => (
          <motion.div
            key={src}
            initial={reduce ? false : { opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, delay: (i % 5) * 0.06 }}
            className="relative aspect-[3/4] w-[200px] shrink-0 overflow-hidden rounded-[var(--radius-card)] shadow-[var(--shadow-card)] ring-1 ring-black/[0.04] sm:w-[240px]"
          >
            <Image
              src={src}
              alt="Фото с детского праздника Мишани"
              fill
              sizes="240px"
              className="object-cover"
            />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
