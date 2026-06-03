"use client";

import { MessageCircle, Phone } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { WA_DISPLAY, WA_MESSAGES, whatsappLink } from "@/lib/whatsapp";

export function FinalCta() {
  const reduce = useReducedMotion();

  return (
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
            Готовы подарить праздник мечты?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-white/70 sm:text-lg">
            Напишите нам — подберём идеальную программу под вашего ребёнка и закрепим дату.
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
        </motion.div>
      </div>
    </section>
  );
}
