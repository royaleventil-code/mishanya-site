"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronRight, MessageCircle } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { DevPriceMenu } from "@/components/DevPriceMenu";
import { whatsappLink } from "@/lib/whatsapp";

const WA_HELP =
  "Здравствуйте! Помогите, пожалуйста, подобрать праздник для ребёнка 🎉";

const HERO_ADVANTAGES = [
  { value: "11 лет", label: "дарим праздники в Израиле", color: "#ff9f0a" },
  { value: "10 000+", label: "праздников провели", color: "#0a84ff" },
  { value: "783", label: "отзыва родителей · 5,0", color: "#ff375f" },
  { value: "RU / HE", label: "ведущие на русском и иврите", color: "#5e5ce6" },
];

const NAV = [
  { href: "/all", label: "Программы" },
  { href: "/gallery", label: "Фото и видео" },
  { href: "/about", label: "О нас" },
  { href: "/contacts", label: "Контакты" },
];

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

export function HomeHero() {
  const reduce = useReducedMotion();

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
      <header className="relative z-20 mx-auto flex h-20 max-w-6xl items-center justify-between px-5 sm:h-24 sm:px-6">
        <Link href="/" aria-label="Мишаня в Стране Чудес" className="flex items-center">
          <Image
            src="/logo-ru.png"
            alt="Мишаня в Стране Чудес"
            width={180}
            height={92}
            priority
            className="h-14 w-auto sm:h-16"
          />
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-bold text-zinc-700 md:flex">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="transition hover:text-zinc-950">
              {item.label}
            </Link>
          ))}
        </nav>
        <a
          href={whatsappLink(WA_HELP)}
          target="_blank"
          rel="noreferrer"
          aria-label="Написать в WhatsApp"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[var(--color-whatsapp)] px-4 text-sm font-bold text-white shadow-lg transition active:scale-95"
        >
          <MessageCircle className="h-4 w-4" strokeWidth={2.4} />
          <span className="hidden sm:inline">WhatsApp</span>
        </a>
      </header>

      {/* content */}
      <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-6 px-5 pb-14 pt-4 sm:px-6 md:grid-cols-2 md:gap-10 md:pb-24 md:pt-8">
        <motion.div variants={container} initial="hidden" animate="show">
          <motion.div
            variants={rise}
            className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3.5 py-1.5 text-xs font-bold text-zinc-700 shadow-sm ring-1 ring-black/5 backdrop-blur"
          >
            <span className="text-[#ffb400]">★★★★★</span>
            <span>5,0 · 783 отзыва · 11 лет в Израиле</span>
          </motion.div>

          <motion.h1
            variants={rise}
            className="mt-4 font-[family-name:var(--font-nunito)] text-[40px] font-black leading-[1.02] tracking-tight text-zinc-950 sm:text-6xl sm:leading-[1.03]"
          >
            Праздник{" "}
            <span className="bg-[linear-gradient(100deg,#ff375f,#ff4d6d_40%,#7c5cff)] bg-clip-text text-transparent">
              мечты
            </span>
            <br className="hidden sm:block" /> для вашего ребёнка
          </motion.h1>

          <motion.div
            variants={rise}
            className="mt-5 grid max-w-xl grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3"
          >
            {HERO_ADVANTAGES.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl bg-white/78 px-3 py-2.5 shadow-sm ring-1 ring-black/5 backdrop-blur"
              >
                <div
                  className="font-[family-name:var(--font-nunito)] text-xl font-black leading-none sm:text-2xl"
                  style={{ color: item.color }}
                >
                  {item.value}
                </div>
                <div className="mt-1 text-[11px] font-bold leading-snug text-[var(--color-ink-soft)] sm:text-xs">
                  {item.label}
                </div>
              </div>
            ))}
          </motion.div>

          <motion.div variants={rise} className="mt-7 flex flex-col gap-3 sm:flex-row">
            <DevPriceMenu
              trigger={({ open, onClick }) => (
                <button
                  type="button"
                  onClick={onClick}
                  aria-expanded={open}
                  aria-haspopup="dialog"
                  className="group inline-flex items-center justify-center gap-2 rounded-full bg-[linear-gradient(100deg,#ff375f,#ff5a7a)] px-7 py-4 text-base font-black text-white shadow-[0_14px_30px_rgba(255,55,95,0.4)] transition hover:shadow-[0_18px_40px_rgba(255,55,95,0.5)] active:scale-95"
                >
                  Смотреть программы
                  <ChevronRight className="h-5 w-5 transition group-hover:translate-x-0.5" strokeWidth={2.6} />
                </button>
              )}
            />
            <a
              href={whatsappLink(WA_HELP)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-4 text-base font-bold text-zinc-900 shadow-md ring-1 ring-black/5 transition hover:bg-zinc-50 active:scale-95"
            >
              <MessageCircle className="h-5 w-5 text-[var(--color-whatsapp)]" strokeWidth={2.4} />
              Подобрать под ребёнка
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
              alt="Герои и персонажи Мишани для детского праздника"
              fill
              priority
              sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 500px"
              className="object-cover object-[50%_76%] md:object-center"
            />
          </motion.div>

          <div className="absolute -left-3 -top-4 rounded-2xl bg-white/90 px-3.5 py-2 shadow-lg ring-1 ring-black/5 backdrop-blur">
            <div className="text-base font-black leading-none text-zinc-950">★ 5,0</div>
            <div className="mt-0.5 text-[10px] font-semibold text-[var(--color-ink-soft)]">783 отзыва</div>
          </div>
          <div className="absolute -bottom-4 -right-3 rounded-2xl bg-white/90 px-3.5 py-2 text-right shadow-lg ring-1 ring-black/5 backdrop-blur">
            <div className="text-base font-black leading-none text-[#0a84ff]">10 000+</div>
            <div className="mt-0.5 text-[10px] font-semibold text-[var(--color-ink-soft)]">праздников</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
