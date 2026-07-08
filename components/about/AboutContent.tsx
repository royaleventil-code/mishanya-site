"use client";

import Image from "next/image";
import Link from "next/link";
import {
  MessageCircle,
  ChevronLeft,
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
import { BidiText } from "@/components/BidiText";
import { PublicFooter } from "@/components/PublicFooter";
import { PublicHeader } from "@/components/PublicHeader";
import { getDictionary } from "@/lib/dictionaries";
import { localePath, type Locale } from "@/lib/i18n";
import { getPageCopy } from "@/lib/page-copy";
import { WA_DISPLAY, getWhatsAppMessages, whatsappLink } from "@/lib/whatsapp";

const STAT_META = [
  { color: "#ff9f0a" },
  { color: "#0a84ff" },
  { color: "#ff375f", star: true },
  { color: "#5e5ce6" },
];

const TRUST = [
  {
    Icon: ShieldCheck,
    color: "#0a84ff",
  },
  {
    Icon: BadgeCheck,
    color: "#ff375f",
  },
  {
    Icon: Languages,
    color: "#ff9f0a",
  },
  {
    Icon: MapPin,
    color: "#5e5ce6",
  },
];

const MISSION = [
  {
    Icon: Palette,
    color: "#ff375f",
  },
  {
    Icon: CalendarCheck,
    color: "#0a84ff",
  },
  {
    Icon: Camera,
    color: "#ff9f0a",
  },
];

export default function AboutContent({ locale = "ru" }: { locale?: Locale }) {
  const reduce = useReducedMotion();
  const copy = getPageCopy(locale).about;
  const dict = getDictionary(locale);
  const waMessages = getWhatsAppMessages(locale);
  const ArrowIcon = locale === "he" ? ChevronLeft : ChevronRight;
  const arrowHoverClass = locale === "he" ? "group-hover:-translate-x-0.5" : "group-hover:translate-x-0.5";

  return (
    <main id="main" className="min-h-screen bg-[#fffaf4] text-[var(--color-ink)]">
      <PublicHeader locale={locale} />

      {/* HERO */}
      <section className="px-5 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.05fr_1fr]">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="text-sm font-black uppercase tracking-wide text-[#ff375f]">{copy.hero.eyebrow}</p>
            <h1 className="mt-3 font-[family-name:var(--font-nunito)] text-[34px] font-black leading-[1.05] tracking-tight text-zinc-950 sm:text-6xl">
              <BidiText locale={locale}>{copy.hero.title}</BidiText>
            </h1>
            <p className="mt-5 text-base leading-7 text-[var(--color-ink-soft)] sm:text-lg">
              <BidiText locale={locale}>{copy.hero.body}</BidiText>
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a
                href={whatsappLink(waMessages.default)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[linear-gradient(100deg,#ff375f,#ff5a7a)] px-7 py-4 text-base font-black text-white shadow-[0_14px_30px_rgba(255,55,95,0.4)] transition active:scale-95"
              >
                <MessageCircle className="h-5 w-5" strokeWidth={2.4} />
                <BidiText locale={locale}>{copy.hero.primaryCta}</BidiText>
              </a>
              <Link
                href={localePath(locale, "/all")}
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-4 text-base font-black text-zinc-900 shadow-[var(--shadow-card)] ring-1 ring-black/[0.04] transition active:scale-95"
              >
                <BidiText locale={locale}>{copy.hero.secondaryCta}</BidiText>
                <ArrowIcon className={`h-5 w-5 transition ${arrowHoverClass}`} strokeWidth={2.6} />
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
                alt={copy.hero.imageAlt}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            </div>
            {/* Floating rating badge */}
            <div className="absolute -bottom-4 -left-2 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-[var(--shadow-card)] ring-1 ring-black/[0.04] sm:-left-4">
              <span className="text-2xl font-black text-[#ffb400]" dir="ltr">5,0★</span>
              <div className="leading-tight">
                <p className="font-[family-name:var(--font-nunito)] text-sm font-black text-zinc-950">
                  <BidiText locale={locale}>{copy.hero.ratingTitle}</BidiText>
                </p>
                <p className="text-xs text-[var(--color-ink-soft)]"><BidiText locale={locale}>{copy.hero.ratingCaption}</BidiText></p>
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
              {copy.statsIntro.eyebrow}
            </p>
            <h2 className="mt-2 font-[family-name:var(--font-nunito)] text-[32px] font-black leading-tight tracking-tight text-zinc-950 sm:text-5xl">
              <BidiText locale={locale}>{copy.statsIntro.title}</BidiText>
            </h2>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {STAT_META.map((meta, i) => {
              const s = copy.stats[i];
              return (
              <motion.div
                key={s.label}
                initial={reduce ? false : { opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-[var(--radius-card)] p-5 text-center shadow-[var(--shadow-card)] ring-1 ring-black/[0.04] sm:p-6"
                style={{ background: `${meta.color}12` }}
              >
                <p
                  className="font-[family-name:var(--font-nunito)] text-4xl font-black leading-none tracking-tight sm:text-5xl"
                  dir="ltr"
                  style={{ color: meta.star ? "#ffb400" : meta.color }}
                >
                  {s.value}
                  <span className="text-2xl sm:text-3xl">{s.suffix}</span>
                </p>
                <p className="mt-2 text-xs leading-5 text-[var(--color-ink-soft)] sm:text-sm">
                  <BidiText locale={locale}>{s.label}</BidiText>
                </p>
              </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* MISSION */}
      <section className="px-5 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="text-sm font-black uppercase tracking-wide text-[#ff9f0a]">{copy.missionIntro.eyebrow}</p>
            <h2 className="mt-2 font-[family-name:var(--font-nunito)] text-[32px] font-black leading-tight tracking-tight text-zinc-950 sm:text-5xl">
              <BidiText locale={locale}>{copy.missionIntro.title}</BidiText>
            </h2>
            <p className="mt-3 text-base leading-7 text-[var(--color-ink-soft)] sm:text-lg">
              <BidiText locale={locale}>{copy.missionIntro.description}</BidiText>
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {MISSION.map((m, i) => {
              const item = copy.mission[i];
              return (
              <motion.article
                key={item.title}
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
                  <BidiText locale={locale}>{item.title}</BidiText>
                </h3>
                <p className="mt-1.5 text-sm leading-6 text-[var(--color-ink-soft)]"><BidiText locale={locale}>{item.text}</BidiText></p>
              </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      {/* WHY TRUST US */}
      <section className="bg-white px-5 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="text-sm font-black uppercase tracking-wide text-[#5e5ce6]">
              {copy.trustIntro.eyebrow}
            </p>
            <h2 className="mt-2 font-[family-name:var(--font-nunito)] text-[32px] font-black leading-tight tracking-tight text-zinc-950 sm:text-5xl">
              <BidiText locale={locale}>{copy.trustIntro.title}</BidiText>
            </h2>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5">
            {TRUST.map((item, i) => {
              const text = copy.trust[i];
              return (
              <motion.article
                key={text.title}
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
                    <BidiText locale={locale}>{text.title}</BidiText>
                  </h3>
                  <p className="mt-1.5 text-sm leading-6 text-[var(--color-ink-soft)]"><BidiText locale={locale}>{text.text}</BidiText></p>
                </div>
              </motion.article>
              );
            })}
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
                alt={copy.team.imageAltPrimary}
                fill
                sizes="(max-width: 1024px) 50vw, 25vw"
                className="object-cover"
              />
            </div>
            <div className="relative mt-6 aspect-[3/4] overflow-hidden rounded-[var(--radius-card)] bg-[#f3f0ff] shadow-[var(--shadow-card)] ring-1 ring-black/[0.04]">
              <Image
                src="/proof/boys-6-10/page-13.webp"
                alt={copy.team.imageAltSecondary}
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
            <p className="text-sm font-black uppercase tracking-wide text-[#ff375f]">{copy.team.eyebrow}</p>
            <h2 className="mt-2 font-[family-name:var(--font-nunito)] text-[32px] font-black leading-tight tracking-tight text-zinc-950 sm:text-5xl">
              <BidiText locale={locale}>{copy.team.title}</BidiText>
            </h2>
            <p className="mt-4 text-base leading-7 text-[var(--color-ink-soft)] sm:text-lg">
              <BidiText locale={locale}>{copy.team.body}</BidiText>
            </p>
            <ul className="mt-5 space-y-3">
              {copy.team.bullets.map((t) => (
                <li key={t} className="flex items-start gap-3">
                  <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#0a84ff]" strokeWidth={2.4} />
                  <span className="text-sm leading-6 text-zinc-700 sm:text-base"><BidiText locale={locale}>{t}</BidiText></span>
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
              <BidiText locale={locale}>{copy.finalCta.title}</BidiText>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-white/70 sm:text-lg">
              <BidiText locale={locale}>{copy.finalCta.description}</BidiText>
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href={whatsappLink(waMessages.default)}
                target="_blank"
                rel="noreferrer"
                className="cta-glow inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-whatsapp)] px-8 py-4 text-base font-black text-white transition active:scale-95"
                style={{ ["--cta-glow-color" as unknown as string]: "rgba(37,211,102,0.45)" }}
              >
                <MessageCircle className="h-5 w-5" strokeWidth={2.4} />
                <BidiText locale={locale}>{dict.common.writeWhatsapp}</BidiText>
              </a>
              <a
                href={`tel:${WA_DISPLAY.replace(/[^+\d]/g, "")}`}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 px-8 py-4 text-base font-bold text-white transition hover:bg-white/10 active:scale-95"
              >
                <Phone className="h-5 w-5" strokeWidth={2.4} />
                <bdi dir="ltr">{WA_DISPLAY}</bdi>
              </a>
            </div>
            <p className="mt-6 text-sm text-white/55">
              <BidiText locale={locale}>{copy.finalCta.emailPrefix}</BidiText>{" "}
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

      <PublicFooter locale={locale} />
    </main>
  );
}
