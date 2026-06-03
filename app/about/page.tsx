"use client";

import Image from "next/image";
import Link from "next/link";
import {
  MessageCircle,
  ChevronRight,
  Phone,
  MapPin,
  Camera,
  Palette,
  CalendarCheck,
  Languages,
  ShieldCheck,
  BadgeCheck,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { PublicFooter } from "@/components/PublicFooter";
import { PublicHeader } from "@/components/PublicHeader";
import { WA_DISPLAY, WA_MESSAGES, whatsappLink } from "@/lib/whatsapp";

const STATS = [
  { value: "11", suffix: " лет", label: "дарим радость детям", color: "#ff9f0a" },
  { value: "10 000", suffix: "+", label: "проведённых праздников", color: "#0a84ff" },
  { value: "783", suffix: "★", label: "отзыва с оценкой 5,0", color: "#ff375f", star: true },
  { value: "80", suffix: "+", label: "любимых персонажей", color: "#5e5ce6" },
];

const TRUST = [
  {
    Icon: ShieldCheck,
    color: "#0a84ff",
    title: "Мэрии и детские сады",
    text: "Городские праздники и мероприятия в садах доверяют нам — мы работаем по договору и точно в срок.",
  },
  {
    Icon: BadgeCheck,
    color: "#ff375f",
    title: "Тысячи семей",
    text: "783 честных отзыва с оценкой 5,0★ — родители возвращаются к нам год за годом и приводят друзей.",
  },
  {
    Icon: Languages,
    color: "#ff9f0a",
    title: "На русском и иврите",
    text: "Ведущие говорят на языке ваших гостей — праздник комфортен и понятен всей семье.",
  },
  {
    Icon: MapPin,
    color: "#5e5ce6",
    title: "По всему Израилю",
    text: "Приезжаем в любой город: дом, зал, детский сад или площадка под открытым небом.",
  },
];

const MISSION = [
  {
    Icon: Palette,
    color: "#ff375f",
    title: "Эмоции, а не просто шоу",
    text: "Дети — герои собственной сказки: они в центре истории, а не зрители со стороны.",
  },
  {
    Icon: CalendarCheck,
    color: "#0a84ff",
    title: "Под каждого ребёнка",
    text: "Сценарий настраиваем под возраст, характер, место и любимых героев именно вашего малыша.",
  },
  {
    Icon: Camera,
    color: "#ff9f0a",
    title: "Воспоминания на всю жизнь",
    text: "Яркие фото, счастливые лица и день, который ребёнок и родители будут вспоминать с улыбкой.",
  },
];

export default function AboutPage() {
  const reduce = useReducedMotion();

  return (
    <main className="min-h-screen bg-[#fffaf4] text-[var(--color-ink)]">
      <PublicHeader />

      {/* HERO */}
      <section className="px-5 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.05fr_1fr]">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="text-sm font-black uppercase tracking-wide text-[#ff375f]">О нас</p>
            <h1 className="mt-3 font-[family-name:var(--font-nunito)] text-[34px] font-black leading-[1.05] tracking-tight text-zinc-950 sm:text-6xl">
              Мы дарим детям радость — уже 11 лет
            </h1>
            <p className="mt-5 text-base leading-7 text-[var(--color-ink-soft)] sm:text-lg">
              «Мишаня в Стране Чудес» — это команда из агентства{" "}
              <span className="font-bold text-zinc-800">Royal Event Israel</span>, которая
              превращает дни рождения в настоящую сказку. От домашнего праздника до большого
              шоу с любимыми героями — мы берём на себя всё, а вы наслаждаетесь счастьем ребёнка.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a
                href={whatsappLink(WA_MESSAGES.default)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[linear-gradient(100deg,#ff375f,#ff5a7a)] px-7 py-4 text-base font-black text-white shadow-[0_14px_30px_rgba(255,55,95,0.4)] transition active:scale-95"
              >
                <MessageCircle className="h-5 w-5" strokeWidth={2.4} />
                Обсудить праздник
              </a>
              <Link
                href="/ru/all"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-4 text-base font-black text-zinc-900 shadow-[var(--shadow-card)] ring-1 ring-black/[0.04] transition active:scale-95"
              >
                Наши программы
                <ChevronRight className="h-5 w-5 transition group-hover:translate-x-0.5" strokeWidth={2.6} />
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={reduce ? false : { opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-card)] bg-[#f3f0ff] shadow-[var(--shadow-card)] ring-1 ring-black/[0.04] sm:aspect-[4/3]">
              <Image
                src="/proof/kids-1-3/page-09.webp"
                alt="Праздник Мишани: дети и любимые персонажи"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            </div>
            {/* Floating rating badge */}
            <div className="absolute -bottom-4 -left-2 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-[var(--shadow-card)] ring-1 ring-black/[0.04] sm:-left-4">
              <span className="text-2xl font-black text-[#ffb400]">5,0★</span>
              <div className="leading-tight">
                <p className="font-[family-name:var(--font-nunito)] text-sm font-black text-zinc-950">
                  783 отзыва
                </p>
                <p className="text-xs text-[var(--color-ink-soft)]">от счастливых семей</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* STATS — clay cards */}
      <section className="bg-white px-5 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="text-sm font-black uppercase tracking-wide text-[#0a84ff]">
              Цифры, которым верят
            </p>
            <h2 className="mt-2 font-[family-name:var(--font-nunito)] text-[32px] font-black leading-tight tracking-tight text-zinc-950 sm:text-5xl">
              За 11 лет мы стали частью тысяч семейных историй
            </h2>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {STATS.map((s, i) => (
              <motion.div
                key={s.label}
                initial={reduce ? false : { opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-[var(--radius-card)] p-5 text-center shadow-[var(--shadow-card)] ring-1 ring-black/[0.04] sm:p-6"
                style={{ background: `${s.color}12` }}
              >
                <p
                  className="font-[family-name:var(--font-nunito)] text-4xl font-black leading-none tracking-tight sm:text-5xl"
                  style={{ color: s.star ? "#ffb400" : s.color }}
                >
                  {s.value}
                  <span className="text-2xl sm:text-3xl">{s.suffix}</span>
                </p>
                <p className="mt-2 text-xs leading-5 text-[var(--color-ink-soft)] sm:text-sm">
                  {s.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* MISSION */}
      <section className="px-5 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="text-sm font-black uppercase tracking-wide text-[#ff9f0a]">Наша миссия</p>
            <h2 className="mt-2 font-[family-name:var(--font-nunito)] text-[32px] font-black leading-tight tracking-tight text-zinc-950 sm:text-5xl">
              Дарить детям радость и настоящие эмоции
            </h2>
            <p className="mt-3 text-base leading-7 text-[var(--color-ink-soft)] sm:text-lg">
              Мы верим, что детство складывается из ярких моментов. Поэтому каждый праздник делаем
              так, будто он — для нашего собственного ребёнка.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {MISSION.map((m, i) => (
              <motion.article
                key={m.title}
                initial={reduce ? false : { opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-[var(--radius-card)] bg-white p-6 shadow-[var(--shadow-card)] ring-1 ring-black/[0.04]"
              >
                <span
                  className="inline-flex h-12 w-12 items-center justify-center rounded-2xl"
                  style={{ background: `${m.color}1f` }}
                >
                  <m.Icon className="h-6 w-6" strokeWidth={2.4} style={{ color: m.color }} />
                </span>
                <h3 className="mt-4 font-[family-name:var(--font-nunito)] text-lg font-black text-zinc-950">
                  {m.title}
                </h3>
                <p className="mt-1.5 text-sm leading-6 text-[var(--color-ink-soft)]">{m.text}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* WHY TRUST US */}
      <section className="bg-white px-5 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="text-sm font-black uppercase tracking-wide text-[#5e5ce6]">
              Почему нам доверяют
            </p>
            <h2 className="mt-2 font-[family-name:var(--font-nunito)] text-[32px] font-black leading-tight tracking-tight text-zinc-950 sm:text-5xl">
              Опыт, который чувствуешь с первой минуты
            </h2>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5">
            {TRUST.map((item, i) => (
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

      {/* TEAM */}
      <section className="px-5 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="grid grid-cols-2 gap-3 sm:gap-4"
          >
            <div className="relative aspect-[3/4] overflow-hidden rounded-[var(--radius-card)] bg-[#f3f0ff] shadow-[var(--shadow-card)] ring-1 ring-black/[0.04]">
              <Image
                src="/proof/girls-4-6/page-14.webp"
                alt="Ведущая Мишани на детском празднике"
                fill
                sizes="(max-width: 1024px) 50vw, 25vw"
                className="object-cover"
              />
            </div>
            <div className="relative mt-6 aspect-[3/4] overflow-hidden rounded-[var(--radius-card)] bg-[#f3f0ff] shadow-[var(--shadow-card)] ring-1 ring-black/[0.04]">
              <Image
                src="/proof/boys-6-10/page-13.webp"
                alt="Шоу-программа Мишани с детьми"
                fill
                sizes="(max-width: 1024px) 50vw, 25vw"
                className="object-cover"
              />
            </div>
          </motion.div>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="text-sm font-black uppercase tracking-wide text-[#ff375f]">Наша команда</p>
            <h2 className="mt-2 font-[family-name:var(--font-nunito)] text-[32px] font-black leading-tight tracking-tight text-zinc-950 sm:text-5xl">
              Харизматичные ведущие, которых обожают дети
            </h2>
            <p className="mt-4 text-base leading-7 text-[var(--color-ink-soft)] sm:text-lg">
              За каждым праздником стоят артисты, которые живут этим делом. Они умеют завладеть
              вниманием малышей и подростков, мгновенно подстроиться под настроение и превратить
              любой момент в маленькое чудо.
            </p>
            <ul className="mt-5 space-y-3">
              {[
                "Профессиональные актёры и аниматоры с опытом",
                "Свой реквизит, костюмы и понятный тайминг",
                "Говорят на русском и иврите",
              ].map((t) => (
                <li key={t} className="flex items-start gap-3">
                  <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#0a84ff]" strokeWidth={2.4} />
                  <span className="text-sm leading-6 text-zinc-700 sm:text-base">{t}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="px-5 py-14 sm:px-6 sm:py-20">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[32px] bg-[#0f0f14] px-6 py-14 text-center sm:px-10 sm:py-20">
          <div className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full bg-[#ff375f] opacity-30 blur-[90px]" />
          <div className="pointer-events-none absolute -bottom-16 -right-16 h-64 w-64 rounded-full bg-[#5e5ce6] opacity-30 blur-[90px]" />

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <h2 className="mx-auto max-w-2xl font-[family-name:var(--font-nunito)] text-[34px] font-black leading-tight tracking-tight text-white sm:text-6xl">
              Напишите нам — и начнём готовить сказку
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-white/70 sm:text-lg">
              Расскажите про вашего ребёнка и дату праздника — подберём идеальную программу и
              ответим на все вопросы.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href={whatsappLink(WA_MESSAGES.default)}
                target="_blank"
                rel="noreferrer"
                className="cta-glow inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-whatsapp)] px-8 py-4 text-base font-black text-white transition active:scale-95"
                style={{ ["--cta-glow-color" as unknown as string]: "rgba(37,211,102,0.45)" }}
              >
                <MessageCircle className="h-5 w-5" strokeWidth={2.4} />
                Написать в WhatsApp
              </a>
              <a
                href={`tel:${WA_DISPLAY.replace(/[^+\d]/g, "")}`}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 px-8 py-4 text-base font-bold text-white transition hover:bg-white/10 active:scale-95"
              >
                <Phone className="h-5 w-5" strokeWidth={2.4} />
                {WA_DISPLAY}
              </a>
            </div>
            <p className="mt-6 text-sm text-white/55">
              Или на почту{" "}
              <a
                href="mailto:royal.eventil@gmail.com"
                className="font-bold text-white/80 underline-offset-4 hover:underline"
              >
                royal.eventil@gmail.com
              </a>
            </p>
          </motion.div>
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}
