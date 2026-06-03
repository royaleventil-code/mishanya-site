"use client";

import Link from "next/link";
import {
  BadgeCheck,
  CalendarCheck,
  Camera,
  ChevronRight,
  Languages,
  MapPin,
  MessageCircle,
  Palette,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { WA_DISPLAY, whatsappLink } from "@/lib/whatsapp";

const HERO_MESSAGE = "Здравствуйте! Хочу организовать детский праздник 🎉";
const TEL_HREF = `tel:${WA_DISPLAY.replace(/[^+\d]/g, "")}`;

const CONTACT_CARDS = [
  {
    color: "#25d366",
    Icon: MessageCircle,
    title: "WhatsApp",
    text: "Самый быстрый способ — ответим в течение нескольких минут.",
    value: WA_DISPLAY,
    href: whatsappLink(HERO_MESSAGE),
    external: true,
    cta: "Написать",
  },
  {
    color: "#0a84ff",
    Icon: Phone,
    title: "Телефон",
    text: "Позвоните, если удобнее голосом — всё обсудим и подберём программу.",
    value: WA_DISPLAY,
    href: TEL_HREF,
    external: false,
    cta: "Позвонить",
  },
  {
    color: "#ff9f0a",
    Icon: Camera,
    title: "Email",
    text: "Напишите письмо — пришлём идеи, форматы и ответим на все вопросы.",
    value: "royal.eventil@gmail.com",
    href: "mailto:royal.eventil@gmail.com",
    external: false,
    cta: "Написать письмо",
  },
  {
    color: "#5e5ce6",
    Icon: Palette,
    title: "Соцсети",
    text: "Загляните за фото и видео с праздников — там живые эмоции детей.",
    socials: [
      { label: "Instagram", href: "https://www.instagram.com/show.mishanya/" },
      { label: "Facebook", href: "https://www.facebook.com/royaleventisrael/" },
      { label: "YouTube", href: "https://www.youtube.com/channel/UCo189jVSku-2H_0Rgrw9JCw" },
    ],
  },
] as const;

const ASSURANCE = [
  {
    color: "#ff375f",
    Icon: MapPin,
    title: "Работаем по всему Израилю",
    text: "Приезжаем в любой город — дом, зал, садик, школа, парк или ресторан.",
  },
  {
    color: "#0a84ff",
    Icon: Languages,
    title: "Русский и иврит",
    text: "Ведущие говорят на языке ваших гостей — комфортно всей семье.",
  },
  {
    color: "#5e5ce6",
    Icon: CalendarCheck,
    title: "Отвечаем быстро",
    text: "Обычно на связи в течение нескольких минут — поможем закрепить дату.",
  },
] as const;

const EASE = [0.22, 1, 0.36, 1] as const;

export function ContactsContent() {
  const reduce = useReducedMotion();

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden px-5 py-14 sm:px-6 sm:py-20">
        <div className="pointer-events-none absolute -left-20 -top-24 h-64 w-64 rounded-full bg-[#25d366] opacity-[0.12] blur-[90px]" />
        <div className="pointer-events-none absolute -right-16 top-10 h-56 w-56 rounded-full bg-[#5e5ce6] opacity-[0.12] blur-[90px]" />

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="relative mx-auto max-w-6xl"
        >
          <p className="text-sm font-black uppercase tracking-wide text-[#25d366]">
            Контакты
          </p>
          <h1 className="mt-2 max-w-3xl font-[family-name:var(--font-nunito)] text-[34px] font-black leading-tight tracking-tight text-zinc-950 sm:text-6xl">
            Свяжитесь с нами
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-[var(--color-ink-soft)] sm:text-lg">
            Напишите в WhatsApp — подберём идеальную программу под вашего ребёнка
            и закрепим дату. Отвечаем быстро и с радостью.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href={whatsappLink(HERO_MESSAGE)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-whatsapp)] px-8 py-4 text-base font-black text-white shadow-lg transition active:scale-95"
            >
              <MessageCircle className="h-5 w-5" strokeWidth={2.4} />
              Написать в WhatsApp
            </a>
            <a
              href={TEL_HREF}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-base font-bold text-zinc-950 ring-1 ring-black/5 transition active:scale-95"
            >
              <Phone className="h-5 w-5" strokeWidth={2.4} />
              {WA_DISPLAY}
            </a>
          </div>
        </motion.div>
      </section>

      {/* Contact cards */}
      <section className="bg-white px-5 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="text-sm font-black uppercase tracking-wide text-[#25d366]">
              Как с нами связаться
            </p>
            <h2 className="mt-2 font-[family-name:var(--font-nunito)] text-[32px] font-black leading-tight tracking-tight text-zinc-950 sm:text-5xl">
              Выберите удобный способ
            </h2>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5">
            {CONTACT_CARDS.map((card, i) => (
              <motion.article
                key={card.title}
                initial={reduce ? false : { opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: i * 0.08, ease: EASE }}
                className="rounded-[var(--radius-card)] bg-white p-6 shadow-[var(--shadow-card)] ring-1 ring-black/[0.04]"
              >
                <span
                  className="inline-flex h-12 w-12 items-center justify-center rounded-2xl"
                  style={{ background: `${card.color}1f` }}
                >
                  <card.Icon
                    className="h-6 w-6"
                    strokeWidth={2.4}
                    style={{ color: card.color }}
                  />
                </span>
                <h3 className="mt-4 font-[family-name:var(--font-nunito)] text-lg font-black leading-tight text-zinc-950">
                  {card.title}
                </h3>
                <p className="mt-1.5 text-sm leading-6 text-[var(--color-ink-soft)]">
                  {card.text}
                </p>

                {"socials" in card ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {card.socials.map((s) => (
                      <a
                        key={s.label}
                        href={s.href}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-h-[44px] items-center gap-1 rounded-full bg-[#fffaf4] px-4 py-2.5 text-sm font-bold text-zinc-950 ring-1 ring-black/[0.06] transition active:scale-95"
                      >
                        {s.label}
                        <ChevronRight className="h-4 w-4 text-[var(--color-ink-soft)]" strokeWidth={2.4} />
                      </a>
                    ))}
                  </div>
                ) : (
                  <a
                    href={card.href}
                    {...(card.external ? { target: "_blank", rel: "noreferrer" } : {})}
                    className="mt-4 inline-flex min-h-[44px] items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-black text-white transition active:scale-95"
                    style={{ background: card.color }}
                  >
                    {card.cta}
                    <span className="font-bold opacity-90">· {card.value}</span>
                    <ChevronRight className="h-4 w-4" strokeWidth={2.4} />
                  </a>
                )}
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* Assurance: area + languages + fast reply */}
      <section className="bg-[#fffaf4] px-5 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="text-sm font-black uppercase tracking-wide text-[#25d366]">
              Что важно знать
            </p>
            <h2 className="mt-2 font-[family-name:var(--font-nunito)] text-[32px] font-black leading-tight tracking-tight text-zinc-950 sm:text-5xl">
              Рядом, на вашем языке и всегда на связи
            </h2>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-5">
            {ASSURANCE.map((item, i) => (
              <motion.article
                key={item.title}
                initial={reduce ? false : { opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: i * 0.08, ease: EASE }}
                className="rounded-[var(--radius-card)] bg-white p-6 shadow-[var(--shadow-card)] ring-1 ring-black/[0.04]"
              >
                <span
                  className="inline-flex h-12 w-12 items-center justify-center rounded-2xl"
                  style={{ background: `${item.color}1f` }}
                >
                  <item.Icon
                    className="h-6 w-6"
                    strokeWidth={2.4}
                    style={{ color: item.color }}
                  />
                </span>
                <h3 className="mt-4 font-[family-name:var(--font-nunito)] text-lg font-black leading-tight text-zinc-950">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-sm leading-6 text-[var(--color-ink-soft)]">
                  {item.text}
                </p>
              </motion.article>
            ))}
          </div>

          {/* Reassurance CTA strip */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="mt-8 flex flex-col gap-5 rounded-[var(--radius-card)] bg-white p-6 shadow-[var(--shadow-card)] ring-1 ring-black/[0.04] sm:flex-row sm:items-center sm:justify-between sm:p-8"
          >
            <div className="flex items-start gap-4">
              <span
                className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                style={{ background: "#25d3661f" }}
              >
                <BadgeCheck className="h-6 w-6 text-[#25d366]" strokeWidth={2.4} />
              </span>
              <div>
                <h3 className="font-[family-name:var(--font-nunito)] text-xl font-black leading-tight text-zinc-950 sm:text-2xl">
                  Ответим быстро и поможем с выбором
                </h3>
                <p className="mt-1.5 max-w-xl text-sm leading-6 text-[var(--color-ink-soft)]">
                  Напишите пару слов о ребёнке и дате — остальное решим вместе.
                </p>
              </div>
            </div>
            <a
              href={whatsappLink(HERO_MESSAGE)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[var(--color-whatsapp)] px-8 py-4 text-base font-black text-white shadow-lg transition active:scale-95"
            >
              <MessageCircle className="h-5 w-5" strokeWidth={2.4} />
              Написать в WhatsApp
            </a>
          </motion.div>

          {/* Subtle trust line */}
          <div className="mt-6 flex items-center gap-2 text-sm font-bold text-[var(--color-ink-soft)]">
            <ShieldCheck className="h-5 w-5 text-[#5e5ce6]" strokeWidth={2.4} />
            11 лет и 10 000+ праздников по всему Израилю
          </div>

          <p className="mt-6 text-sm text-[var(--color-ink-soft)]">
            Хотите сперва посмотреть программы?{" "}
            <Link href="/all" className="font-black text-[#0a84ff]">
              Открыть каталог
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
