"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { BidiText } from "@/components/BidiText";
import { getDictionary } from "@/lib/dictionaries";
import { localePath, type Locale } from "@/lib/i18n";
import { getLocalizedPrograms } from "@/lib/localized-data";
import { formatProgramPriceLabel } from "@/lib/prices";
import type { Program } from "@/lib/types";

const FEATURED_IDS = ["standart", "super-heroes", "frozen-toddler-girls", "chemistry", "paw-patrol-toddler-boys", "mishanya"];
const FEATURED_TARGETS: Record<string, (locale: Locale) => string> = {
  "super-heroes": (locale) => `${localePath(locale, "/all")}?program=super-heroes`,
  "frozen-toddler-girls": (locale) => `${localePath(locale, "/girl/3")}?program=frozen-toddler-girls`,
  "paw-patrol-toddler-boys": (locale) => `${localePath(locale, "/boy/3")}?program=paw-patrol-toddler-boys`,
};
const FEATURED_COVERS: Record<string, string> = {
  "super-heroes": "/programs/super-heroes-universal.png",
};

function coverOf(p: Program): string {
  return FEATURED_COVERS[p.id] ?? p.cover ?? "/generated/program-party.webp";
}

export function ProgramsShowcase({ locale = "ru" }: { locale?: Locale }) {
  const reduce = useReducedMotion();
  const dict = getDictionary(locale);
  const localizedPrograms = getLocalizedPrograms(locale);
  const featured: Program[] = FEATURED_IDS.map((id) => localizedPrograms.find((p) => p.id === id)).filter(
    (p): p is Program => Boolean(p),
  );

  return (
    <section id="programs" className="bg-white px-5 py-14 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <p className="text-sm font-black uppercase tracking-wide text-[#ff375f]">{dict.home.programs.eyebrow}</p>
          <h2 className="mt-2 font-[family-name:var(--font-nunito)] text-[32px] font-black leading-tight tracking-tight text-zinc-950 sm:text-5xl">
            {dict.home.programs.title}
          </h2>
          <p className="mt-3 text-base leading-7 text-[var(--color-ink-soft)] sm:text-lg">
            {dict.home.programs.description}
          </p>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
          {featured.map((p, i) => (
            <motion.div
              key={p.id}
              initial={reduce ? false : { opacity: 0, y: 26 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.5, delay: (i % 3) * 0.08, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link
                href={FEATURED_TARGETS[p.id]?.(locale) ?? `${localePath(locale, "/all")}?program=${encodeURIComponent(p.id)}`}
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
                    <span dir="ltr">{formatProgramPriceLabel(p.id, p.priceFrom, locale)}</span>
                  </div>
                </div>
                <div className="p-3 sm:p-4">
                  <h3 className="font-[family-name:var(--font-nunito)] text-base font-black leading-tight text-zinc-950 sm:text-lg">
                    <BidiText locale={locale}>{p.title}</BidiText>
                  </h3>
                  <p className="mt-1 line-clamp-1 text-xs text-[var(--color-ink-soft)] sm:text-sm">
                    <BidiText locale={locale}>{p.tagline}</BidiText>
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <Link
            href={localePath(locale, "/all")}
            className="group inline-flex items-center justify-center gap-2 rounded-full bg-zinc-950 px-7 py-4 text-base font-black text-white shadow-lg transition hover:bg-zinc-800 active:scale-95"
          >
            <BidiText locale={locale}>{dict.home.programs.allCta}</BidiText>
            <ChevronRight className={`h-5 w-5 transition ${locale === "he" ? "rotate-180 group-hover:-translate-x-0.5" : "group-hover:translate-x-0.5"}`} strokeWidth={2.6} />
          </Link>
        </div>
      </div>
    </section>
  );
}
