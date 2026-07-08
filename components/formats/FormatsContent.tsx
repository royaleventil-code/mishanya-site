"use client";

import Link from "next/link";
import {
  BadgeCheck,
  Building2,
  CalendarCheck,
  CalendarHeart,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Home,
  Languages,
  MapPin,
  MessageCircle,
  PartyPopper,
  ShieldCheck,
  TreePine,
  Users,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { BidiText } from "@/components/BidiText";
import { PublicFooter } from "@/components/PublicFooter";
import { PublicHeader } from "@/components/PublicHeader";
import { localePath, type Locale } from "@/lib/i18n";
import { getPageCopy } from "@/lib/page-copy";
import { getWhatsAppMessages, whatsappLink } from "@/lib/whatsapp";

const FORMATS = [
  {
    Icon: Home,
    color: "#ff375f",
  },
  {
    Icon: Users,
    color: "#ff9f0a",
  },
  {
    Icon: Building2,
    color: "#0a84ff",
  },
  {
    Icon: TreePine,
    color: "#5e5ce6",
  },
  {
    Icon: GraduationCap,
    color: "#ff375f",
  },
  {
    Icon: CalendarHeart,
    color: "#0a84ff",
  },
  {
    Icon: PartyPopper,
    color: "#ff9f0a",
  },
  {
    Icon: Users,
    color: "#5e5ce6",
  },
];

const BENEFITS = [
  {
    Icon: CalendarCheck,
    color: "#ff375f",
  },
  {
    Icon: Languages,
    color: "#0a84ff",
  },
  {
    Icon: ShieldCheck,
    color: "#5e5ce6",
  },
];

export default function FormatsContent({ locale = "ru" }: { locale?: Locale }) {
  const reduce = useReducedMotion();
  const copy = getPageCopy(locale).formats;
  const waMessages = getWhatsAppMessages(locale);
  const ArrowIcon = locale === "he" ? ChevronLeft : ChevronRight;
  const arrowHoverClass = locale === "he" ? "group-hover:-translate-x-0.5" : "group-hover:translate-x-0.5";

  return (
    <main id="main" className="min-h-screen bg-[#fffaf4] text-[var(--color-ink)]">
      <PublicHeader locale={locale} />

      {/* Intro */}
      <section className="bg-[#fffaf4] px-5 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-3xl"
          >
            <p className="text-sm font-black uppercase tracking-wide text-[#ff9f0a]">{copy.hero.eyebrow}</p>
            <h1 className="mt-2 font-[family-name:var(--font-nunito)] text-[34px] font-black leading-tight tracking-tight text-zinc-950 sm:text-6xl">
              {copy.hero.title}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--color-ink-soft)] sm:text-lg">
              <BidiText locale={locale}>{copy.hero.description}</BidiText>
            </p>
          </motion.div>

          {/* Formats grid */}
          <div className="mt-8 grid grid-cols-1 gap-3 sm:mt-10 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
            {FORMATS.map((item, i) => {
              const text = copy.items[i];
              return (
              <motion.article
                key={text.title}
                initial={reduce ? false : { opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: (i % 4) * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-[var(--radius-card)] bg-white p-6 shadow-[var(--shadow-card)] ring-1 ring-black/[0.04]"
              >
                <span
                  className="inline-flex h-12 w-12 items-center justify-center rounded-2xl"
                  style={{ background: `${item.color}1f` }}
                >
                  <item.Icon className="h-6 w-6" strokeWidth={2.4} style={{ color: item.color }} />
                </span>
                <h2 className="mt-4 font-[family-name:var(--font-nunito)] text-lg font-black leading-tight text-zinc-950">
                  <BidiText locale={locale}>{text.title}</BidiText>
                </h2>
                <p className="mt-1.5 text-sm leading-6 text-[var(--color-ink-soft)]"><BidiText locale={locale}>{text.text}</BidiText></p>
              </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why it works for any format */}
      <section className="bg-white px-5 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="text-sm font-black uppercase tracking-wide text-[#0a84ff]">
              {copy.benefitsIntro.eyebrow}
            </p>
            <h2 className="mt-2 font-[family-name:var(--font-nunito)] text-[32px] font-black leading-tight tracking-tight text-zinc-950 sm:text-5xl">
              {copy.benefitsIntro.title}
            </h2>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-5">
            {BENEFITS.map((item, i) => {
              const text = copy.benefits[i];
              return (
              <motion.article
                key={text.title}
                initial={reduce ? false : { opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-[var(--radius-card)] bg-[#fffaf4] p-6 shadow-[var(--shadow-card)] ring-1 ring-black/[0.04]"
              >
                <span
                  className="inline-flex h-12 w-12 items-center justify-center rounded-2xl"
                  style={{ background: `${item.color}1f` }}
                >
                  <item.Icon className="h-6 w-6" strokeWidth={2.4} style={{ color: item.color }} />
                </span>
                <h3 className="mt-4 font-[family-name:var(--font-nunito)] text-lg font-black leading-tight text-zinc-950">
                  <BidiText locale={locale}>{text.title}</BidiText>
                </h3>
                <p className="mt-1.5 text-sm leading-6 text-[var(--color-ink-soft)]"><BidiText locale={locale}>{text.text}</BidiText></p>
              </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#fffaf4] px-5 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-[var(--radius-card)] bg-white p-7 shadow-[var(--shadow-card)] ring-1 ring-black/[0.04] sm:p-10"
          >
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#5e5ce61f] px-3 py-1 text-xs font-black uppercase tracking-wide text-[#5e5ce6]">
              <BadgeCheck className="h-4 w-4" strokeWidth={2.6} />
              <BidiText locale={locale}>{copy.cta.badge}</BidiText>
            </span>
            <h2 className="mt-3 max-w-2xl font-[family-name:var(--font-nunito)] text-[26px] font-black leading-tight tracking-tight text-zinc-950 sm:text-4xl">
              <BidiText locale={locale}>{copy.cta.title}</BidiText>
            </h2>
            <p className="mt-3 max-w-xl text-base leading-7 text-[var(--color-ink-soft)] sm:text-lg">
              <BidiText locale={locale}>{copy.cta.description}</BidiText>
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href={localePath(locale, "/all")}
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-[linear-gradient(100deg,#ff375f,#ff5a7a)] px-7 py-4 text-base font-black text-white shadow-[0_14px_30px_rgba(255,55,95,0.4)] transition active:scale-95"
              >
                <BidiText locale={locale}>{copy.cta.allPrograms}</BidiText>
                <ArrowIcon
                  className={`h-5 w-5 transition ${arrowHoverClass}`}
                  strokeWidth={2.6}
                />
              </Link>
              <a
                href={whatsappLink(waMessages.default)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-whatsapp)] px-7 py-4 text-base font-black text-white shadow-lg transition active:scale-95"
              >
                <MessageCircle className="h-5 w-5" strokeWidth={2.4} />
                <BidiText locale={locale}>{copy.cta.discuss}</BidiText>
              </a>
            </div>

            <p className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-[var(--color-ink-soft)]">
              <MapPin className="h-4 w-4 text-[#ff9f0a]" strokeWidth={2.6} />
              <BidiText locale={locale}>{copy.cta.map}</BidiText>
            </p>
          </motion.div>
        </div>
      </section>

      <PublicFooter locale={locale} />
    </main>
  );
}
