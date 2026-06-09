"use client";

import { motion, useReducedMotion } from "framer-motion";
import { BidiText } from "@/components/BidiText";
import { getDictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/i18n";
import { getWhatsAppMessages, whatsappLink } from "@/lib/whatsapp";

type Props = {
  locale?: Locale;
  accent: string;
};

export function FinalCta({ locale = "ru", accent }: Props) {
  const reduce = useReducedMotion();
  const dict = getDictionary(locale);
  const waMessages = getWhatsAppMessages(locale);

  return (
    <section className="bg-[#0f0f14] text-white">
      <div className="relative mx-auto max-w-3xl overflow-hidden px-5 pb-10 pt-16 text-center sm:px-6 sm:pb-14 sm:pt-24">
        <div
          className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full opacity-30 blur-[90px]"
          style={{ background: accent }}
        />
        <div className="pointer-events-none absolute -bottom-16 -right-16 h-64 w-64 rounded-full bg-[#5e5ce6] opacity-30 blur-[90px]" />

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative z-10"
        >
          <h2 className="font-[family-name:var(--font-nunito)] text-3xl font-black tracking-tight sm:text-4xl">
            {dict.catalog.finalCta.title}
          </h2>
          <p className="mt-3 text-sm text-white/70 sm:text-base">
            <BidiText locale={locale}>{dict.catalog.finalCta.description}</BidiText>
          </p>
          <a
            href={whatsappLink(waMessages.default)}
            target="_blank"
            rel="noopener noreferrer"
            className="cta-glow mt-8 inline-flex items-center gap-2 rounded-full bg-[var(--color-whatsapp)] px-7 py-4 text-base font-black text-white transition active:scale-95"
            style={{ ["--cta-glow-color" as unknown as string]: "rgba(37,211,102,0.45)" }}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
            </svg>
            <BidiText locale={locale}>{dict.common.writeWhatsapp}</BidiText>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
