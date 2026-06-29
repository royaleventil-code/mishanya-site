"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, MessageCircle } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { BidiText } from "@/components/BidiText";
import { DevPriceMenu, hasSeenHomeProgramsPopup } from "@/components/DevPriceMenu";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { getDictionary } from "@/lib/dictionaries";
import { localePath, type Locale } from "@/lib/i18n";
import { getWhatsAppMessages, whatsappLink } from "@/lib/whatsapp";

type HeroAdvantage = {
  value: string;
  counter?: {
    from: number;
    to: number;
    suffix?: string;
  };
  label: string;
  color: string;
};

type Dot = {
  left?: string;
  right?: string;
  top: string;
  size: number;
  color: string;
  dur: number;
};

const CONFETTI: Dot[] = [
  { left: "7%", top: "32%", size: 13, color: "#ff4d6d", dur: 6 },
  { left: "18%", top: "70%", size: 9, color: "#ffc83d", dur: 7.5 },
  { left: "44%", top: "13%", size: 8, color: "#34c759", dur: 6.8 },
  { right: "10%", top: "20%", size: 12, color: "#0a84ff", dur: 7 },
  { right: "16%", top: "64%", size: 10, color: "#5e5ce6", dur: 8 },
  { right: "33%", top: "10%", size: 7, color: "#ff9f0a", dur: 6.4 },
];

type Balloon = {
  side: "left" | "right";
  pos: string;
  top: string;
  c1: string;
  c2: string;
  dur: number;
  dy: number;
};

const BALLOONS: Balloon[] = [
  { side: "left", pos: "3%", top: "24%", c1: "#ff9bb3", c2: "#ff375f", dur: 8, dy: 16 },
  { side: "right", pos: "4%", top: "28%", c1: "#7fc0ff", c2: "#0a84ff", dur: 9, dy: 20 },
  { side: "right", pos: "19%", top: "60%", c1: "#c5b3ff", c2: "#5e5ce6", dur: 10, dy: 14 },
];

export function HomeHero({ locale = "ru" }: { locale?: Locale }) {
  const reduce = useReducedMotion();
  const dict = getDictionary(locale);
  const waMessages = getWhatsAppMessages(locale);
  const [showProgramsGuide, setShowProgramsGuide] = useState(false);
  const [pulseProgramsCta, setPulseProgramsCta] = useState(false);
  const [programsGuideDismissed, setProgramsGuideDismissed] = useState(false);
  const nav = [
    { href: localePath(locale, "/all"), label: dict.common.programs },
    { href: localePath(locale, "/gallery"), label: dict.common.gallery },
    { href: localePath(locale, "/about"), label: dict.common.about },
    { href: localePath(locale, "/contacts"), label: dict.common.contacts },
  ];
  const hero = dict.home.hero;

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
  };
  const rise = {
    hidden: { opacity: 0, y: reduce ? 0 : 22 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
    },
  };
  const ctaRise = {
    hidden: { opacity: 0, y: reduce ? 0 : 14, scale: reduce ? 1 : 0.985 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.85,
        ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      },
    },
  };

  useEffect(() => {
    if (reduce === true || programsGuideDismissed || hasSeenHomeProgramsPopup()) return;

    const showTimer = window.setTimeout(() => {
      if (hasSeenHomeProgramsPopup()) return;

      setPulseProgramsCta(true);
      setShowProgramsGuide(true);
    }, 860);
    const hideTimer = window.setTimeout(() => {
      setShowProgramsGuide(false);
    }, 2500);
    const pulseTimer = window.setTimeout(() => {
      setPulseProgramsCta(false);
    }, 2200);

    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(hideTimer);
      window.clearTimeout(pulseTimer);
    };
  }, [programsGuideDismissed, reduce]);

  const stopProgramsGuide = () => {
    setProgramsGuideDismissed(true);
    setShowProgramsGuide(false);
    setPulseProgramsCta(false);
  };

  return (
    <section className="relative isolate overflow-hidden bg-[radial-gradient(120%_90%_at_50%_-10%,#fff6e9_0%,#ffedf2_45%,#f1f0ff_100%)]">
      {/* floating decorations */}
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
        {CONFETTI.map((c, i) =>
          reduce ? (
            <span
              key={i}
              className="absolute rounded-full opacity-60"
              style={{ top: c.top, left: c.left, right: c.right, width: c.size, height: c.size, background: c.color }}
            />
          ) : (
            <motion.span
              key={i}
              className="absolute rounded-full opacity-60"
              style={{ top: c.top, left: c.left, right: c.right, width: c.size, height: c.size, background: c.color }}
              animate={{ y: [0, -14, 0], rotate: [0, 25, 0] }}
              transition={{ duration: c.dur, repeat: Infinity, ease: "easeInOut" }}
            />
          )
        )}
        {BALLOONS.map((b, i) => {
          const wrapStyle = {
            top: b.top,
            left: b.side === "left" ? b.pos : undefined,
            right: b.side === "right" ? b.pos : undefined,
          };
          const balloon = (
            <div className="flex flex-col items-center">
              <div
                className="h-16 w-[52px] rounded-[50%] shadow-[0_12px_26px_rgba(15,15,20,0.12)]"
                style={{
                  background: `radial-gradient(125% 125% at 32% 24%, rgba(255,255,255,0.85), ${b.c1} 40%, ${b.c2} 100%)`,
                }}
              />
              <div className="h-7 w-px bg-black/15" />
            </div>
          );
          return reduce ? (
            <div key={i} className="absolute hidden opacity-80 sm:block" style={wrapStyle}>
              {balloon}
            </div>
          ) : (
            <motion.div
              key={i}
              className="absolute hidden opacity-80 sm:block"
              style={wrapStyle}
              animate={{ y: [0, b.dy, 0] }}
              transition={{ duration: b.dur, repeat: Infinity, ease: "easeInOut" }}
            >
              {balloon}
            </motion.div>
          );
        })}
      </div>

      {/* header */}
      <header className="relative z-20 mx-auto flex h-24 max-w-6xl items-center justify-between px-5 sm:h-28 sm:px-6">
        <Link href={localePath(locale)} aria-label={dict.brand.logoAlt} className="flex items-center">
          <Image
            src={dict.brand.logo}
            alt={dict.brand.logoAlt}
            width={180}
            height={92}
            priority
            className="h-[86px] w-auto sm:h-24"
          />
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-bold text-zinc-700 md:flex">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="transition hover:text-zinc-950">
              {item.label}
            </Link>
          ))}
        </nav>
        <LanguageSwitch locale={locale} compact />
      </header>

      {/* content */}
      <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-6 px-5 pb-14 pt-4 sm:px-6 md:grid-cols-2 md:gap-10 md:pb-24 md:pt-8">
        <motion.div variants={container} initial="hidden" animate="show">
          <motion.div
            variants={rise}
            className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3.5 py-1.5 text-xs font-bold text-zinc-700 shadow-sm ring-1 ring-black/5 backdrop-blur"
          >
            <span className="text-[#ffb400]">★★★★★</span>
            <span><BidiText locale={locale}>{hero.badge}</BidiText></span>
          </motion.div>

          <motion.h1
            variants={rise}
            className="mt-4 font-[family-name:var(--font-nunito)] text-[40px] font-black leading-[1.02] tracking-tight text-zinc-950 sm:text-6xl sm:leading-[1.03]"
          >
            {hero.titleStart}{" "}
            <span className="bg-[linear-gradient(100deg,#ff375f,#ff4d6d_40%,#7c5cff)] bg-clip-text text-transparent">
              {hero.titleAccent}
            </span>
            <br className="hidden sm:block" /> {hero.titleEnd}
          </motion.h1>

          <motion.div
            variants={rise}
            className="mt-5 grid max-w-xl grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3"
          >
            {hero.advantages.map((item) => (
              <HeroStatCard
                key={item.label}
                locale={locale}
                item={item}
                reduce={reduce}
              />
            ))}
          </motion.div>

          <motion.div variants={ctaRise} className="mt-7 flex flex-col gap-3 sm:flex-row">
            <DevPriceMenu
              locale={locale}
              autoOpenDelayMs={6000}
              trigger={({ open, onClick }) => {
                const showGuide = showProgramsGuide && !open && !programsGuideDismissed;
                const runPulse = pulseProgramsCta && !open && !programsGuideDismissed;

                return (
                  <div className="relative flex sm:inline-flex">
                    <div className="pointer-events-none absolute inset-x-0 bottom-full z-20 mb-2 flex justify-center">
                      <motion.div
                        aria-hidden={!showGuide}
                        initial={false}
                        animate={showGuide ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 5, scale: 0.98 }}
                        transition={{ duration: showGuide ? 0.18 : 0.14, ease: "easeOut" }}
                        className="relative w-max max-w-[min(280px,calc(100vw-40px))] rounded-full bg-white/95 px-3 py-2 text-center text-xs font-black text-zinc-800 shadow-lg ring-1 ring-black/5 backdrop-blur"
                      >
                        <BidiText locale={locale}>{dict.common.chooseChildAge}</BidiText>
                        <span
                          aria-hidden
                          className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1 rotate-45 bg-white/95 ring-1 ring-black/5"
                        />
                      </motion.div>
                    </div>
                    <motion.button
                      type="button"
                      onClick={() => {
                        stopProgramsGuide();
                        onClick();
                      }}
                      aria-expanded={open}
                      aria-haspopup="dialog"
                      animate={runPulse ? { scale: [1, 1.018, 1, 1.026, 1] } : { scale: 1 }}
                      transition={
                        runPulse
                          ? {
                              duration: 1.18,
                              ease: [0.2, 0.9, 0.24, 1],
                              times: [0, 0.18, 0.36, 0.58, 1],
                            }
                          : { duration: 0.14, ease: "easeOut" }
                      }
                      className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-[linear-gradient(100deg,#ff375f,#ff5a7a)] px-7 py-4 text-base font-black text-white shadow-[0_14px_30px_rgba(255,55,95,0.4)] transition-[box-shadow,background] duration-300 ease-out hover:shadow-[0_18px_40px_rgba(255,55,95,0.5)] active:scale-[0.98] sm:w-auto"
                    >
                      <BidiText locale={locale}>{hero.programsCta}</BidiText>
                      <ChevronRight className={`h-5 w-5 transition ${locale === "he" ? "rotate-180 group-hover:-translate-x-0.5" : "group-hover:translate-x-0.5"}`} strokeWidth={2.6} />
                    </motion.button>
                  </div>
                );
              }}
            />
            <a
              href={whatsappLink(waMessages.default)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-4 text-base font-bold text-zinc-900 shadow-md ring-1 ring-black/5 transition hover:bg-zinc-50 active:scale-95"
            >
              <MessageCircle className="h-5 w-5 text-[var(--color-whatsapp)]" strokeWidth={2.4} />
              <BidiText locale={locale}>{hero.personalCta}</BidiText>
            </a>
          </motion.div>
        </motion.div>

        {/* feature visual */}
        <motion.div
          initial={reduce ? false : { opacity: 0, scale: 0.92, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
          className="relative mx-auto mt-2 w-full max-w-[430px] sm:max-w-[520px] md:mt-0 md:max-w-[460px] lg:max-w-[500px]"
        >
          <motion.div
            animate={reduce ? undefined : { y: [0, -10, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="relative aspect-[4/3] rotate-1 overflow-hidden rounded-[24px] bg-[#72c7ff] shadow-[0_30px_70px_rgba(15,15,20,0.22)] sm:aspect-[16/11] sm:rounded-[28px] md:aspect-square lg:aspect-[4/3] xl:aspect-square"
          >
            <Image
              src="/generated/program-party.webp"
              alt={hero.imageAlt}
              fill
              priority
              sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 500px"
              className="object-cover object-[50%_76%] md:object-center"
            />
          </motion.div>

          <div className="absolute -left-3 -top-4 rounded-2xl bg-white/90 px-3.5 py-2 shadow-lg ring-1 ring-black/5 backdrop-blur">
            <div className="text-base font-black leading-none text-zinc-950" dir="ltr">★ 5,0</div>
            <div className="mt-0.5 text-[10px] font-semibold text-[var(--color-ink-soft)]"><BidiText locale={locale}>{hero.ratingCaption}</BidiText></div>
          </div>
          <div className="absolute -bottom-4 -right-3 rounded-2xl bg-white/90 px-3.5 py-2 text-end shadow-lg ring-1 ring-black/5 backdrop-blur">
            <div className="text-base font-black leading-none text-[#0a84ff]" dir="ltr">
              {hero.advantages[1]?.value ?? "10 000+"}
            </div>
            <div className="mt-0.5 text-[10px] font-semibold text-[var(--color-ink-soft)]"><BidiText locale={locale}>{hero.partiesCaption}</BidiText></div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function HeroStatCard({
  locale,
  item,
  reduce,
}: {
  locale: Locale;
  item: HeroAdvantage;
  reduce: boolean | null;
}) {
  return (
    <div className="relative min-h-[74px] overflow-hidden rounded-2xl bg-white/78 px-3 py-2.5 shadow-sm ring-1 ring-black/5 backdrop-blur">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px opacity-70"
        style={{ background: `linear-gradient(90deg, transparent, ${item.color}, transparent)` }}
      />
      <div
        className="font-[family-name:var(--font-nunito)] text-xl font-black leading-none sm:text-2xl"
        style={{ color: item.color }}
      >
        {item.counter ? (
          <OdometerCounter
            locale={locale}
            value={item.value}
            from={item.counter.from}
            to={item.counter.to}
            suffix={item.counter.suffix}
            reduce={reduce}
          />
        ) : (
          <BidiText locale={locale}>{item.value}</BidiText>
        )}
      </div>
      <div className="mt-1 text-[11px] font-bold leading-snug text-[var(--color-ink-soft)] sm:text-xs">
        <BidiText locale={locale}>{item.label}</BidiText>
      </div>
    </div>
  );
}

function OdometerCounter({
  locale,
  value,
  from,
  to,
  suffix = "",
  reduce,
}: {
  locale: Locale;
  value: string;
  from: number;
  to: number;
  suffix?: string;
  reduce: boolean | null;
}) {
  const [current, setCurrent] = useState(reduce ? to : from);

  useEffect(() => {
    if (reduce) return;

    let frame = 0;
    const duration = 2200;

    const tick = (startTime: number) => {
      const step = (now: number) => {
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setCurrent(Math.round(from + (to - from) * eased));

        if (progress < 1) {
          frame = window.requestAnimationFrame(step);
        }
      };

      frame = window.requestAnimationFrame(step);
    };

    frame = window.requestAnimationFrame((startTime) => {
      setCurrent(from);
      tick(startTime);
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [from, reduce, to]);

  if (reduce) {
    return (
      <bdi dir="ltr" className="whitespace-nowrap">
        {value}
      </bdi>
    );
  }

  const formattedValue = formatOdometerNumber(current, locale);
  const finalValue = formatOdometerNumber(to, locale);
  const needsSuffixGap = suffix.startsWith(" ");
  const visibleSuffix = needsSuffixGap ? suffix.trimStart() : suffix;

  return (
    <span
      aria-label={value}
      className="inline-flex items-baseline whitespace-nowrap tabular-nums"
      dir="ltr"
      role="text"
    >
      <span
        className="inline-block text-left"
        style={{ minWidth: `${finalValue.length * 0.56}em` }}
        aria-hidden
      >
        {formattedValue}
      </span>
      {visibleSuffix && (
        <span aria-hidden className={needsSuffixGap ? "ml-1" : undefined}>
          {visibleSuffix}
        </span>
      )}
    </span>
  );
}

function formatOdometerNumber(value: number, locale: Locale): string {
  const numberLocale = locale === "he" ? "en-US" : "ru-RU";
  return Math.max(0, value).toLocaleString(numberLocale).replace(/\u00a0/g, " ");
}
