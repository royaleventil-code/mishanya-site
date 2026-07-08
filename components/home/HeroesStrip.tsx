"use client";

import { type PointerEvent, useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { BidiText } from "@/components/BidiText";
import { getHeroImage } from "@/data/heroes";
import { getDictionary } from "@/lib/dictionaries";
import { type Locale } from "@/lib/i18n";
import { getLocalizedHeroes } from "@/lib/localized-data";
import type { Hero } from "@/lib/types";

const AUTO_SPIN_DELAY_MS = 5000;
const AUTO_SCROLL_SETTLE_MS = 1000;
const FULL_BLEED_HERO_CARD_TEST = true;
const HERO_CARD_DRAG_TOLERANCE_PX = 14;
const HERO_LIGHTBOX_BACKGROUND = {
  backdrop: "linear-gradient(180deg, #f7fbff 0%, #edf1f7 48%, #dce2ea 100%)",
  light:
    "radial-gradient(ellipse at 50% 36%, rgba(255, 255, 255, 0.92) 0%, rgba(255, 255, 255, 0.56) 30%, rgba(180, 196, 215, 0) 70%)",
  floor:
    "radial-gradient(ellipse at 50% 50%, rgba(73, 88, 112, 0.24) 0%, rgba(73, 88, 112, 0.10) 34%, rgba(255, 255, 255, 0) 72%)",
} as const;

const HOME_HERO_IDS = [
  "spiderman",
  "pikachu-mascot",
  "bumblebee",
  "labubu",
  "racer",
  "sky",
  "bunny",
  "leon-brawl",
  "sonic-mascot",
  "stitch",
  "stitch-mascot",
  "captain-america",
  "bumblebee-mascot",
  "kpop-rumi",
  "unicorn-mascot",
  "kpop-mira",
  "marshall-mascot",
  "kpop-zoey",
  "huggy-wuggy-mascot",
  "elsa",
  "olaf",
  "kissy-missy",
  "anna",
  "masha-bear-inflatable",
  "optimus-prime",
  "lol-bee-mascot",
  "ladybug",
  "lol-unicorn-mascot",
  "cat-noir",
  "mickey-mouse-mascot",
  "rapunzel",
  "minnie-mouse-mascot",
  "lol-unicorn",
  "among-us-mascot",
  "lol-bee",
  "bumblebee-mascot-2",
  "lol-surprise-boy",
  "dj-marshmello",
  "mashenka",
  "batman-mascot",
  "superman",
  "hulk-mascot",
  "wednesday",
  "minion",
  "tinker-bell",
  "nu-pogodi-wolf-hare",
  "unicorn",
  "ninjago",
  "barbie",
  "barbie-ken",
  "tom-and-jerry",
  "ninja-turtle",
  "pj-owlette",
  "pj-gekko",
  "pj-catboy",
  "squid-soldier",
  "minnie-mouse",
  "mickey-mouse",
  "deadpool",
  "harry-potter",
  "hermione",
  "tiktoker-boy",
  "tiktoker-girl",
  "fixiki-boy",
  "fixiki-girl",
  "minecraft-girl",
  "minecraft-boy",
  "mermaid",
  "pirate",
  "mishanya",
  "troll-branch",
  "troll-poppy",
  "harley-quinn",
  "popit-girl",
  "popit-boy",
] as const;

function getOrderedHomeHeroes(heroes: Hero[]): Hero[] {
  const heroById = new Map(heroes.map((hero) => [hero.id, hero]));

  return HOME_HERO_IDS.flatMap((id) => {
    const hero = heroById.get(id);
    return hero && getHeroImage(hero.id) ? [hero] : [];
  });
}

type DragState = {
  heroIndex: number | null;
  pointerId: number;
  scrollLeft: number;
  startX: number;
};

type LightboxSwipeState = {
  pointerId: number;
  startX: number;
  startY: number;
};

export function HeroesStrip({ locale = "ru" }: { locale?: Locale }) {
  const reduce = useReducedMotion();
  const dict = getDictionary(locale);
  const tiles = getOrderedHomeHeroes(getLocalizedHeroes(locale));
  const [activeHeroIndex, setActiveHeroIndex] = useState<number | null>(null);
  const heroesSectionRef = useRef<HTMLElement | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const autoSpinTimeoutRef = useRef<number | null>(null);
  const autoScrollReleaseRef = useRef<number | null>(null);
  const loopNormalizeTimeoutRef = useRef<number | null>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const didDragRef = useRef(false);
  const lightboxSwipeRef = useRef<LightboxSwipeState | null>(null);
  const isHeroesStripInViewRef = useRef(false);
  const isAutoScrollingRef = useRef(false);
  const activeHero = activeHeroIndex === null ? null : (tiles[activeHeroIndex] ?? null);
  const activeHeroImage = activeHero ? getHeroImage(activeHero.id) : null;
  const activeHeroNumber = activeHeroIndex === null ? 0 : activeHeroIndex + 1;
  const activeLightboxBackground = HERO_LIGHTBOX_BACKGROUND;

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

  const getLoopMetrics = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller || tiles.length === 0) return null;

    const card = scroller.querySelector<HTMLElement>("[data-hero-card]");
    if (!card) return null;

    const style = window.getComputedStyle(scroller);
    const gap = Number.parseFloat(style.columnGap || style.gap || "0") || 0;
    const step = card.getBoundingClientRect().width + gap;
    return {
      loopWidth: step * tiles.length,
      scroller,
      step,
    };
  }, [tiles.length]);

  const normalizeLoopPosition = useCallback(() => {
    const metrics = getLoopMetrics();
    if (!metrics || metrics.loopWidth <= 0) return;

    const { loopWidth, scroller } = metrics;
    let nextLeft: number | null = null;
    if (scroller.scrollLeft < loopWidth) {
      nextLeft = scroller.scrollLeft + loopWidth;
    } else if (scroller.scrollLeft >= loopWidth * 2) {
      nextLeft = scroller.scrollLeft - loopWidth;
    }
    if (nextLeft === null) return;

    const previousScrollBehavior = scroller.style.scrollBehavior;
    scroller.style.scrollBehavior = "auto";
    scroller.scrollLeft = nextLeft;
    scroller.style.scrollBehavior = previousScrollBehavior;
  }, [getLoopMetrics]);

  const scheduleLoopNormalization = useCallback(() => {
    if (loopNormalizeTimeoutRef.current !== null) {
      window.clearTimeout(loopNormalizeTimeoutRef.current);
    }

    loopNormalizeTimeoutRef.current = window.setTimeout(() => {
      loopNormalizeTimeoutRef.current = null;
      if (dragStateRef.current) return;
      normalizeLoopPosition();
    }, 180);
  }, [normalizeLoopPosition]);

  const scrollHeroStrip = useCallback((direction: 1 | -1) => {
    normalizeLoopPosition();

    const metrics = getLoopMetrics();
    if (!metrics) return;

    const { scroller, step } = metrics;
    const nextLeft = scroller.scrollLeft + step * direction;

    isAutoScrollingRef.current = true;
    scroller.scrollTo({
      left: nextLeft,
      behavior: "smooth",
    });

    if (autoScrollReleaseRef.current !== null) {
      window.clearTimeout(autoScrollReleaseRef.current);
    }
    autoScrollReleaseRef.current = window.setTimeout(() => {
      normalizeLoopPosition();
      isAutoScrollingRef.current = false;
      autoScrollReleaseRef.current = null;
    }, AUTO_SCROLL_SETTLE_MS);
  }, [getLoopMetrics, normalizeLoopPosition]);

  const scrollToNextHero = useCallback(() => {
    scrollHeroStrip(1);
  }, [scrollHeroStrip]);

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

  const scheduleAutoSpinWhenVisible = useCallback(
    (delay = AUTO_SPIN_DELAY_MS) => {
      if (!isHeroesStripInViewRef.current) return;
      scheduleAutoSpin(delay);
    },
    [scheduleAutoSpin],
  );

  const restartAutoSpinAfterUserAction = useCallback(() => {
    stopAutoScrollTracking();
    scheduleAutoSpinWhenVisible(AUTO_SPIN_DELAY_MS);
  }, [scheduleAutoSpinWhenVisible, stopAutoScrollTracking]);

  const restartAutoSpinAfterUserScroll = useCallback(() => {
    if (isAutoScrollingRef.current) return;
    scheduleLoopNormalization();
    scheduleAutoSpinWhenVisible(AUTO_SPIN_DELAY_MS);
  }, [scheduleAutoSpinWhenVisible, scheduleLoopNormalization]);

  const scrollByButton = useCallback(
    (direction: 1 | -1) => {
      stopAutoScrollTracking();
      clearAutoSpinTimer();
      scrollHeroStrip(direction);
      scheduleAutoSpinWhenVisible(AUTO_SPIN_DELAY_MS);
    },
    [clearAutoSpinTimer, scheduleAutoSpinWhenVisible, scrollHeroStrip, stopAutoScrollTracking],
  );

  const openHeroLightbox = useCallback(
    (index: number) => {
      if (didDragRef.current) {
        didDragRef.current = false;
        return;
      }

      stopAutoScrollTracking();
      clearAutoSpinTimer();
      setActiveHeroIndex(index);
    },
    [clearAutoSpinTimer, setActiveHeroIndex, stopAutoScrollTracking],
  );

  const closeHeroLightbox = useCallback(() => {
    setActiveHeroIndex(null);
    lightboxSwipeRef.current = null;
    scheduleAutoSpinWhenVisible(AUTO_SPIN_DELAY_MS);
  }, [scheduleAutoSpinWhenVisible, setActiveHeroIndex]);

  const showLightboxHero = useCallback(
    (direction: 1 | -1) => {
      setActiveHeroIndex((current) => {
        if (current === null || tiles.length === 0) return current;
        return (current + direction + tiles.length) % tiles.length;
      });
    },
    [setActiveHeroIndex, tiles.length],
  );

  const startDrag = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (event.pointerType !== "mouse" || event.button !== 0) return;

      const scroller = event.currentTarget;
      const trigger = (event.target as HTMLElement).closest<HTMLElement>("[data-hero-lightbox-trigger]");
      const heroIndexValue = trigger?.dataset.heroIndex;
      const heroIndex = heroIndexValue === undefined ? null : Number.parseInt(heroIndexValue, 10);

      didDragRef.current = false;
      dragStateRef.current = {
        heroIndex: Number.isFinite(heroIndex) ? heroIndex : null,
        pointerId: event.pointerId,
        scrollLeft: scroller.scrollLeft,
        startX: event.clientX,
      };
      scroller.setPointerCapture(event.pointerId);
      restartAutoSpinAfterUserAction();
    },
    [restartAutoSpinAfterUserAction],
  );

  const drag = useCallback((event: PointerEvent<HTMLDivElement>) => {
    const state = dragStateRef.current;
    if (!state || state.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - state.startX;
    if (Math.abs(deltaX) > HERO_CARD_DRAG_TOLERANCE_PX) {
      didDragRef.current = true;
    }
    event.currentTarget.scrollLeft = state.scrollLeft - deltaX;
    event.preventDefault();
  }, []);

  const endDrag = useCallback((event: PointerEvent<HTMLDivElement>) => {
    const state = dragStateRef.current;
    if (!state || state.pointerId !== event.pointerId) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragStateRef.current = null;
    normalizeLoopPosition();
    if (!didDragRef.current && state.heroIndex !== null) {
      openHeroLightbox(state.heroIndex);
      return;
    }
    if (didDragRef.current) {
      window.setTimeout(() => {
        didDragRef.current = false;
      }, 0);
    }
  }, [normalizeLoopPosition, openHeroLightbox]);

  const startLightboxSwipe = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;

    lightboxSwipeRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }, []);

  const endLightboxSwipe = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const state = lightboxSwipeRef.current;
      if (!state || state.pointerId !== event.pointerId) return;

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      lightboxSwipeRef.current = null;

      const deltaX = event.clientX - state.startX;
      const deltaY = event.clientY - state.startY;
      if (Math.abs(deltaX) < 60 || Math.abs(deltaX) < Math.abs(deltaY) * 1.2) return;

      showLightboxHero(deltaX < 0 ? 1 : -1);
    },
    [showLightboxHero],
  );

  const cancelLightboxSwipe = useCallback((event: PointerEvent<HTMLDivElement>) => {
    const state = lightboxSwipeRef.current;
    if (!state || state.pointerId !== event.pointerId) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    lightboxSwipeRef.current = null;
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      normalizeLoopPosition();
    });
    const timers = [
      window.setTimeout(normalizeLoopPosition, 120),
      window.setTimeout(normalizeLoopPosition, 400),
    ];

    return () => {
      window.cancelAnimationFrame(frame);
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [normalizeLoopPosition]);

  useEffect(() => {
    const section = heroesSectionRef.current;
    if (!section || reduce) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isInView = entry.isIntersecting;
        isHeroesStripInViewRef.current = isInView;

        if (isInView) {
          normalizeLoopPosition();
          scheduleAutoSpin(AUTO_SPIN_DELAY_MS);
          return;
        }

        clearAutoSpinTimer();
        stopAutoScrollTracking();
      },
      { threshold: 0.2 },
    );

    observer.observe(section);

    return () => {
      observer.disconnect();
      isHeroesStripInViewRef.current = false;
      clearAutoSpinTimer();
      if (autoScrollReleaseRef.current !== null) {
        window.clearTimeout(autoScrollReleaseRef.current);
        autoScrollReleaseRef.current = null;
      }
      if (loopNormalizeTimeoutRef.current !== null) {
        window.clearTimeout(loopNormalizeTimeoutRef.current);
        loopNormalizeTimeoutRef.current = null;
      }
    };
  }, [clearAutoSpinTimer, normalizeLoopPosition, reduce, scheduleAutoSpin, stopAutoScrollTracking]);

  useEffect(() => {
    if (activeHeroIndex === null) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [activeHeroIndex]);

  useEffect(() => {
    if (activeHeroIndex === null) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeHeroLightbox();
      } else if (event.key === "ArrowRight") {
        showLightboxHero(1);
      } else if (event.key === "ArrowLeft") {
        showLightboxHero(-1);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [activeHeroIndex, closeHeroLightbox, showLightboxHero]);

  return (
    <>
      <section ref={heroesSectionRef} className="overflow-hidden bg-[#fffaf4] pt-14 pb-0 sm:pt-20 sm:pb-0">
        <div className="mx-auto max-w-6xl px-5 sm:px-6">
          <p className="text-sm font-black uppercase tracking-wide text-[#5e5ce6]">{dict.home.heroesStrip.eyebrow}</p>
          <h2 className="mt-2 font-[family-name:var(--font-nunito)] text-[32px] font-black leading-tight tracking-tight text-zinc-950 sm:text-5xl">
            <BidiText locale={locale}>{dict.home.heroesStrip.title}</BidiText>
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--color-ink-soft)] sm:text-lg">
            <BidiText locale={locale}>{dict.home.heroesStrip.description}</BidiText>
          </p>
        </div>

        <div className="relative mt-8">
          <button
            type="button"
            aria-label={locale === "he" ? "גלילה לתמונה הקודמת" : "Листать к предыдущему фото"}
            onClick={() => scrollByButton(-1)}
            className="absolute left-3 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/75 bg-white/92 text-zinc-950 shadow-[0_12px_28px_rgba(31,16,92,0.22)] backdrop-blur transition hover:scale-105 hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#5e5ce6] sm:left-6 sm:h-14 sm:w-14"
          >
            <ChevronLeft className="h-6 w-6" strokeWidth={3} />
          </button>
          <button
            type="button"
            aria-label={locale === "he" ? "גלילה לתמונה הבאה" : "Листать к следующему фото"}
            onClick={() => scrollByButton(1)}
            className="absolute right-3 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/75 bg-white/92 text-zinc-950 shadow-[0_12px_28px_rgba(31,16,92,0.22)] backdrop-blur transition hover:scale-105 hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#5e5ce6] sm:right-6 sm:h-14 sm:w-14"
          >
            <ChevronRight className="h-6 w-6" strokeWidth={3} />
          </button>

          <div
            data-heroes-strip-scroller
            ref={scrollerRef}
            onPointerDown={startDrag}
            onPointerMove={drag}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onLostPointerCapture={endDrag}
            onTouchStart={restartAutoSpinAfterUserAction}
            onScroll={restartAutoSpinAfterUserScroll}
            onWheel={restartAutoSpinAfterUserAction}
            onMouseEnter={restartAutoSpinAfterUserAction}
            className="hide-scrollbar flex cursor-grab snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-5 pb-0 pt-1 select-none active:cursor-grabbing sm:gap-6 sm:px-6"
          >
            {[...tiles, ...tiles, ...tiles].map((h, i) => {
              const img = getHeroImage(h.id) as string;
              const sourceIndex = i % tiles.length;
              const loopIndex = Math.floor(i / tiles.length);
              return (
                <motion.div
                  key={`${h.id}-${loopIndex}`}
                  aria-hidden={loopIndex !== 1}
                  data-hero-card
                  initial={reduce ? false : { opacity: 0, y: FULL_BLEED_HERO_CARD_TEST ? 0 : 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.4, delay: (sourceIndex % 6) * 0.05 }}
                  className="group w-[calc(100vw-40px)] max-w-[360px] shrink-0 snap-center text-center [perspective:1200px] sm:w-[420px] sm:max-w-[420px]"
                >
                  <button
                    type="button"
                    data-hero-lightbox-trigger
                    data-hero-index={sourceIndex}
                    tabIndex={loopIndex === 1 ? 0 : -1}
                    aria-label={locale === "he" ? `${h.name} במסך מלא` : `${h.name} на весь экран`}
                    onClick={() => openHeroLightbox(sourceIndex)}
                    className="block w-full rounded-[28px] text-center focus:outline-none focus-visible:ring-4 focus-visible:ring-[#5e5ce6]/35 sm:rounded-[34px]"
                  >
                    <div
                      className={
                        FULL_BLEED_HERO_CARD_TEST
                          ? "relative h-[638px] overflow-hidden rounded-[28px] bg-transparent p-0 transition-transform duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateX(2deg)_rotateY(-4deg)_translateY(-4px)] sm:h-[790px] sm:rounded-[34px]"
                          : "relative overflow-hidden rounded-[28px] border border-white/45 bg-[linear-gradient(145deg,#5e5ce6_0%,#8c6cff_46%,#f1d7ff_100%)] p-4 shadow-[0_22px_64px_rgba(94,92,230,0.34),0_8px_18px_rgba(15,15,20,0.12)] ring-1 ring-[#ffffff99] transition-transform duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateX(2deg)_rotateY(-4deg)_translateY(-4px)] sm:rounded-[34px] sm:p-5"
                      }
                    >
                      {!FULL_BLEED_HERO_CARD_TEST && (
                        <div
                          aria-hidden
                          className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[linear-gradient(135deg,rgba(255,255,255,0.46)_0%,rgba(255,255,255,0.14)_36%,rgba(255,255,255,0)_68%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.92),inset_0_-24px_52px_rgba(30,16,90,0.16)]"
                        />
                      )}
                      <div className={FULL_BLEED_HERO_CARD_TEST ? "absolute inset-0" : "relative h-[330px] w-full sm:h-[430px]"}>
                        <Image
                          src={img}
                          alt=""
                          fill
                          sizes="(max-width: 640px) calc(100vw - 40px), 420px"
                          className={
                            FULL_BLEED_HERO_CARD_TEST
                              ? "scale-[1.16] object-contain drop-shadow-[0_26px_28px_rgba(31,16,92,0.3)] transition-transform duration-500 group-hover:scale-[1.22]"
                              : "object-contain drop-shadow-[0_24px_24px_rgba(31,16,92,0.34)] transition-transform duration-500 group-hover:scale-[1.04]"
                          }
                        />
                      </div>
                      <div
                        className={
                          FULL_BLEED_HERO_CARD_TEST
                            ? "absolute bottom-[2.5%] left-1/2 z-10 flex w-fit max-w-[82%] -translate-x-1/2 items-center justify-center rounded-full border border-white/70 bg-white/92 px-4 py-2 text-sm font-black leading-tight text-zinc-950 shadow-[0_10px_26px_rgba(31,16,92,0.2)] backdrop-blur"
                            : "relative mx-auto -mt-1 inline-flex max-w-[92%] items-center justify-center rounded-full border border-white/70 bg-white/92 px-4 py-2 text-sm font-black leading-tight text-zinc-950 shadow-[0_10px_26px_rgba(31,16,92,0.2)] backdrop-blur"
                        }
                      >
                        <span className="truncate"><BidiText locale={locale}>{h.name}</BidiText></span>
                      </div>
                    </div>
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <AnimatePresence>
        {activeHero && activeHeroImage && (
          <motion.div
            key="hero-lightbox"
            role="dialog"
            aria-modal="true"
            aria-label={locale === "he" ? `${activeHero.name} במסך מלא` : `${activeHero.name} на весь экран`}
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduce ? undefined : { opacity: 0 }}
            className="fixed inset-0 z-[180] flex items-center justify-center overflow-hidden px-4 py-5 text-white backdrop-blur-md sm:px-8 sm:py-8"
            style={{ background: activeLightboxBackground.backdrop }}
            onClick={closeHeroLightbox}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-95"
              style={{ background: activeLightboxBackground.light }}
            />

            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-[12%] bottom-[8%] h-[24%] blur-xl"
              style={{ background: activeLightboxBackground.floor }}
            />

            <button
              type="button"
              aria-label={locale === "he" ? "סגירה" : "Закрыть"}
              onClick={(event) => {
                event.stopPropagation();
                closeHeroLightbox();
              }}
              className="absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-white/26 bg-zinc-950/28 text-white shadow-[0_16px_32px_rgba(0,0,0,0.28)] backdrop-blur transition hover:bg-zinc-950/38 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:right-6 sm:top-6 sm:h-12 sm:w-12"
            >
              <X className="h-5 w-5" strokeWidth={2.7} />
            </button>

            <button
              type="button"
              aria-label={locale === "he" ? "לתמונה הקודמת" : "Предыдущий герой"}
              onClick={(event) => {
                event.stopPropagation();
                showLightboxHero(-1);
              }}
              className="absolute left-3 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/26 bg-zinc-950/28 text-white shadow-[0_16px_32px_rgba(0,0,0,0.28)] backdrop-blur transition hover:bg-zinc-950/38 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:left-6 sm:h-14 sm:w-14"
            >
              <ChevronLeft className="h-7 w-7" strokeWidth={2.8} />
            </button>

            <button
              type="button"
              aria-label={locale === "he" ? "לתמונה הבאה" : "Следующий герой"}
              onClick={(event) => {
                event.stopPropagation();
                showLightboxHero(1);
              }}
              className="absolute right-3 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/26 bg-zinc-950/28 text-white shadow-[0_16px_32px_rgba(0,0,0,0.28)] backdrop-blur transition hover:bg-zinc-950/38 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:right-6 sm:h-14 sm:w-14"
            >
              <ChevronRight className="h-7 w-7" strokeWidth={2.8} />
            </button>

            <div
              className="relative h-[82dvh] w-full max-w-5xl touch-pan-y select-none"
              onClick={(event) => event.stopPropagation()}
              onPointerDown={startLightboxSwipe}
              onPointerUp={endLightboxSwipe}
              onPointerCancel={cancelLightboxSwipe}
              onLostPointerCapture={cancelLightboxSwipe}
            >
              <motion.div
                key={activeHero.id}
                initial={reduce ? false : { opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reduce ? undefined : { opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.22 }}
                className="relative h-full w-full"
              >
                <div
                  aria-hidden
                  className="absolute inset-x-[18%] bottom-[10%] h-[13%] rounded-full bg-black/28 blur-2xl"
                />
                <Image
                  src={activeHeroImage}
                  alt={activeHero.name}
                  fill
                  sizes="100vw"
                  priority
                  className="object-contain drop-shadow-[0_30px_48px_rgba(0,0,0,0.45)]"
                />
              </motion.div>
            </div>

            <div className="pointer-events-none absolute inset-x-4 bottom-5 z-20 flex justify-center sm:bottom-7">
              <div className="max-w-[min(88vw,520px)] rounded-full border border-zinc-950/10 bg-white/92 px-5 py-2.5 text-center text-sm font-black text-zinc-950 shadow-[0_16px_32px_rgba(31,16,92,0.18)] backdrop-blur-md sm:text-base">
                <span className="block truncate"><BidiText locale={locale}>{activeHero.name}</BidiText></span>
                <span className="mt-0.5 block text-xs font-bold text-zinc-600">
                  {activeHeroNumber} / {tiles.length}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
