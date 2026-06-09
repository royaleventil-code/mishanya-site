"use client";

import { useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { BidiText } from "@/components/BidiText";
import { getHeroImage } from "@/data/heroes";
import { getDictionary } from "@/lib/dictionaries";
import { type Locale } from "@/lib/i18n";
import { getLocalizedHeroes } from "@/lib/localized-data";

const AUTO_SPIN_DELAY_MS = 5000;
const AUTO_SCROLL_SETTLE_MS = 1000;

export function HeroesStrip({ locale = "ru" }: { locale?: Locale }) {
  const reduce = useReducedMotion();
  const dict = getDictionary(locale);
  const tiles = getLocalizedHeroes(locale).filter((h) => getHeroImage(h.id));
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const autoSpinTimeoutRef = useRef<number | null>(null);
  const autoScrollReleaseRef = useRef<number | null>(null);
  const isAutoScrollingRef = useRef(false);

  const clearAutoSpinTimer = useCallback(() => {
    if (autoSpinTimeoutRef.current === null) return;
    window.clearTimeout(autoSpinTimeoutRef.current);
    autoSpinTimeoutRef.current = null;
  }, []);

  const stopAutoScrollTracking = useCallback(() => {
    isAutoScrollingRef.current = false;
    if (autoScrollReleaseRef.current === null) return;
    window.clearTimeout(autoScrollReleaseRef.current);
    autoScrollReleaseRef.current = null;
  }, []);

  const scrollToNextHero = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const card = scroller.querySelector<HTMLElement>("[data-hero-card]");
    if (!card) return;

    const style = window.getComputedStyle(scroller);
    const gap = Number.parseFloat(style.columnGap || style.gap || "0") || 0;
    const step = card.getBoundingClientRect().width + gap;
    const maxScroll = scroller.scrollWidth - scroller.clientWidth - 4;
    const nextLeft = scroller.scrollLeft + step;

    isAutoScrollingRef.current = true;
    scroller.scrollTo({
      left: nextLeft >= maxScroll ? 0 : nextLeft,
      behavior: "smooth",
    });

    if (autoScrollReleaseRef.current !== null) {
      window.clearTimeout(autoScrollReleaseRef.current);
    }
    autoScrollReleaseRef.current = window.setTimeout(() => {
      isAutoScrollingRef.current = false;
      autoScrollReleaseRef.current = null;
    }, AUTO_SCROLL_SETTLE_MS);
  }, []);

  const scheduleAutoSpin = useCallback(
    (delay = AUTO_SPIN_DELAY_MS) => {
      if (reduce) return;
      clearAutoSpinTimer();

      function tick() {
        scrollToNextHero();
        autoSpinTimeoutRef.current = window.setTimeout(tick, AUTO_SPIN_DELAY_MS);
      }

      autoSpinTimeoutRef.current = window.setTimeout(tick, delay);
    },
    [clearAutoSpinTimer, reduce, scrollToNextHero],
  );

  const restartAutoSpinAfterUserAction = useCallback(() => {
    stopAutoScrollTracking();
    scheduleAutoSpin(AUTO_SPIN_DELAY_MS);
  }, [scheduleAutoSpin, stopAutoScrollTracking]);

  const restartAutoSpinAfterUserScroll = useCallback(() => {
    if (isAutoScrollingRef.current) return;
    scheduleAutoSpin(AUTO_SPIN_DELAY_MS);
  }, [scheduleAutoSpin]);

  useEffect(() => {
    if (reduce) return;

    scheduleAutoSpin(AUTO_SPIN_DELAY_MS);

    return () => {
      clearAutoSpinTimer();
      if (autoScrollReleaseRef.current !== null) {
        window.clearTimeout(autoScrollReleaseRef.current);
        autoScrollReleaseRef.current = null;
      }
    };
  }, [clearAutoSpinTimer, reduce, scheduleAutoSpin]);

  return (
    <section className="overflow-hidden bg-[#fffaf4] py-14 sm:py-20">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <p className="text-sm font-black uppercase tracking-wide text-[#5e5ce6]">{dict.home.heroesStrip.eyebrow}</p>
        <h2 className="mt-2 font-[family-name:var(--font-nunito)] text-[32px] font-black leading-tight tracking-tight text-zinc-950 sm:text-5xl">
          <BidiText locale={locale}>{dict.home.heroesStrip.title}</BidiText>
        </h2>
        <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--color-ink-soft)] sm:text-lg">
          <BidiText locale={locale}>{dict.home.heroesStrip.description}</BidiText>
        </p>
      </div>

      <div
        ref={scrollerRef}
        onPointerDown={restartAutoSpinAfterUserAction}
        onTouchStart={restartAutoSpinAfterUserAction}
        onScroll={restartAutoSpinAfterUserScroll}
        onWheel={restartAutoSpinAfterUserAction}
        onMouseEnter={restartAutoSpinAfterUserAction}
        className="hide-scrollbar mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-5 pb-4 sm:gap-6 sm:px-6"
      >
        {tiles.map((h, i) => {
          const img = getHeroImage(h.id) as string;
          return (
            <motion.div
              key={h.id}
              data-hero-card
              initial={reduce ? false : { opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.4, delay: (i % 6) * 0.05 }}
              className="group w-[calc(100vw-40px)] max-w-[360px] shrink-0 snap-center text-center [perspective:1200px] sm:w-[420px] sm:max-w-[420px]"
            >
              <div className="relative overflow-hidden rounded-[28px] border border-white/45 bg-[linear-gradient(145deg,#5e5ce6_0%,#8c6cff_46%,#f1d7ff_100%)] p-4 shadow-[0_22px_64px_rgba(94,92,230,0.34),0_8px_18px_rgba(15,15,20,0.12)] ring-1 ring-[#ffffff99] transition-transform duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateX(2deg)_rotateY(-4deg)_translateY(-4px)] sm:rounded-[34px] sm:p-5">
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[linear-gradient(135deg,rgba(255,255,255,0.46)_0%,rgba(255,255,255,0.14)_36%,rgba(255,255,255,0)_68%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.92),inset_0_-24px_52px_rgba(30,16,90,0.16)]"
                />
                <div className="relative h-[330px] w-full sm:h-[430px]">
                  <Image
                    src={img}
                    alt={h.name}
                    fill
                    sizes="(max-width: 640px) calc(100vw - 40px), 420px"
                    className="object-contain drop-shadow-[0_24px_24px_rgba(31,16,92,0.34)] transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                </div>
                <div className="relative mx-auto -mt-1 inline-flex max-w-[92%] items-center justify-center rounded-full border border-white/70 bg-white/92 px-4 py-2 text-sm font-black leading-tight text-zinc-950 shadow-[0_10px_26px_rgba(31,16,92,0.2)] backdrop-blur">
                  <span className="truncate"><BidiText locale={locale}>{h.name}</BidiText></span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
