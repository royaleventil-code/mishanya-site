"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { BidiText } from "@/components/BidiText";
import type { MunicipalityLetter } from "@/data/b2b";
import type { Locale } from "@/lib/i18n";

type LettersCarouselProps = {
  locale: Locale;
  letters: readonly MunicipalityLetter[];
  /** aria-label кнопок и лайтбокса */
  labels: { prev: string; next: string; open: string; close: string };
};

/**
 * Горизонтальная карусель рекомендательных писем: scroll-snap + стрелки,
 * клик по письму открывает лайтбокс с крупной версией.
 */
export function LettersCarousel({ locale, letters, labels }: LettersCarouselProps) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [opened, setOpened] = useState<MunicipalityLetter | null>(null);
  // направление визуального сдвига: в RTL «вперёд» = влево
  const dir = locale === "he" ? -1 : 1;

  const scrollByCards = useCallback(
    (sign: number) => {
      const track = trackRef.current;
      if (!track) return;
      track.scrollBy({ left: sign * dir * Math.round(track.clientWidth * 0.8), behavior: "smooth" });
    },
    [dir],
  );

  useEffect(() => {
    if (!opened) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpened(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [opened]);

  return (
    <div className="relative">
      <ul
        ref={trackRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin]"
      >
        {letters.map((letter) => (
          <li key={letter.src} className="w-[230px] shrink-0 snap-start sm:w-[250px]">
            <button
              type="button"
              onClick={() => setOpened(letter)}
              aria-label={`${labels.open}: ${letter.city}`}
              className="group block w-full cursor-pointer overflow-hidden rounded-[var(--radius-card)] bg-white text-start shadow-[var(--shadow-card)] ring-1 ring-black/[0.04] transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)] focus-visible:-translate-y-1"
            >
              <span className="relative block aspect-[1/1.35] overflow-hidden bg-[#f6f4ef]">
                <Image
                  src={letter.src}
                  alt={letter.alt}
                  fill
                  sizes="250px"
                  className="object-cover object-top transition duration-300 group-hover:scale-[1.03]"
                />
              </span>
              <span className="block px-4 pb-4 pt-3">
                <span className="block text-sm font-black leading-snug text-[var(--color-ink)]">
                  <BidiText locale={locale}>{letter.city}</BidiText>
                </span>
                <span className="mt-0.5 block text-xs leading-snug text-[var(--color-ink-soft)]">
                  <BidiText locale={locale}>{letter.author}</BidiText>
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      {/* Стрелки - на десктопе; на тач-устройствах карусель листается свайпом */}
      <div className="mt-2 hidden justify-center gap-3 sm:flex">
        <button
          type="button"
          onClick={() => scrollByCards(-1)}
          aria-label={labels.prev}
          className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-black/10 bg-white text-[var(--color-ink)] shadow-sm transition duration-200 hover:border-black/25 hover:shadow-[var(--shadow-card)] active:scale-95"
        >
          <ChevronLeft className={`h-5 w-5 ${locale === "he" ? "rotate-180" : ""}`} strokeWidth={2.4} aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => scrollByCards(1)}
          aria-label={labels.next}
          className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-black/10 bg-white text-[var(--color-ink)] shadow-sm transition duration-200 hover:border-black/25 hover:shadow-[var(--shadow-card)] active:scale-95"
        >
          <ChevronRight className={`h-5 w-5 ${locale === "he" ? "rotate-180" : ""}`} strokeWidth={2.4} aria-hidden />
        </button>
      </div>

      {/* Лайтбокс */}
      {opened && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={opened.alt}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 sm:p-8"
          onClick={() => setOpened(null)}
        >
          <button
            type="button"
            aria-label={labels.close}
            onClick={() => setOpened(null)}
            className="absolute end-4 top-4 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition duration-200 hover:bg-white/30"
          >
            <X className="h-6 w-6" strokeWidth={2.4} aria-hidden />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element -- лайтбокс: нужен нативный max-h без обвязки fill */}
          <img
            src={opened.src}
            alt={opened.alt}
            className="max-h-full max-w-full rounded-2xl bg-white object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
