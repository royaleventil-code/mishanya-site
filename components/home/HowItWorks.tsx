"use client";

import { BadgeCheck, MessageCircle, Palette } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { BidiText } from "@/components/BidiText";
import { getDictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/i18n";
import { getWhatsAppMessages, whatsappLink } from "@/lib/whatsapp";

const ICONS = [MessageCircle, Palette, BadgeCheck] as const;

export function HowItWorks({ locale = "ru" }: { locale?: Locale }) {
  const reduce = useReducedMotion();
  const dict = getDictionary(locale);
  const waMessages = getWhatsAppMessages(locale);

  return (
    <section className="bg-[#fffaf4] px-5 py-14 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <p className="text-sm font-black uppercase tracking-wide text-[#25d366]">
            {dict.home.howItWorks.eyebrow}
          </p>
          <h2 className="mt-2 font-[family-name:var(--font-nunito)] text-[32px] font-black leading-tight tracking-tight text-zinc-950 sm:text-5xl">
            {dict.home.howItWorks.title}
          </h2>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {dict.home.howItWorks.steps.map((s, i) => {
            const Icon = ICONS[i] ?? MessageCircle;
            const numberPositionClass = locale === "he" ? "left-5" : "right-5";
            return (
            <motion.div
              key={s.title}
              initial={reduce ? false : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="relative rounded-[var(--radius-card)] bg-white p-6 shadow-[var(--shadow-card)] ring-1 ring-black/[0.04]"
            >
              <span
                aria-hidden
                className={`absolute ${numberPositionClass} top-4 font-[family-name:var(--font-nunito)] text-3xl font-black text-zinc-200`}
              >
                0{i + 1}
              </span>
              <span
                className="inline-flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{ background: `${s.color}1f` }}
              >
                <Icon className="h-6 w-6" strokeWidth={2.4} style={{ color: s.color }} />
              </span>
              <h3 className="mt-4 font-[family-name:var(--font-nunito)] text-lg font-black text-zinc-950">
                <BidiText locale={locale}>{s.title}</BidiText>
              </h3>
              <p className="mt-1.5 text-sm leading-6 text-[var(--color-ink-soft)]"><BidiText locale={locale}>{s.text}</BidiText></p>
            </motion.div>
            );
          })}
        </div>

        <div className="mt-8">
          <a
            href={whatsappLink(waMessages.default)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--color-whatsapp)] px-7 py-4 text-base font-black text-white shadow-lg transition active:scale-95 sm:w-auto"
          >
            <MessageCircle className="h-5 w-5" strokeWidth={2.4} />
            <BidiText locale={locale}>{dict.home.howItWorks.cta}</BidiText>
          </a>
        </div>
      </div>
    </section>
  );
}
