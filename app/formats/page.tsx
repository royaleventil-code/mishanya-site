"use client";

import Link from "next/link";
import {
  Baby,
  BadgeCheck,
  Building2,
  CalendarCheck,
  CalendarHeart,
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
import { PublicFooter } from "@/components/PublicFooter";
import { PublicHeader } from "@/components/PublicHeader";
import { WA_MESSAGES, whatsappLink } from "@/lib/whatsapp";

const FORMATS = [
  {
    title: "День рождения дома",
    text: "Герои, ведущие, шоу и сценарий под возраст ребёнка — прямо у вас в гостиной.",
    Icon: Home,
    color: "#ff375f",
  },
  {
    title: "В детском саду",
    text: "Праздники для групп, сезонные события и выездные шоу прямо в садике.",
    Icon: Baby,
    color: "#ff9f0a",
  },
  {
    title: "В зале или ресторане",
    text: "Большая программа с шоу-блоками, музыкой и анимацией для всей компании гостей.",
    Icon: Building2,
    color: "#0a84ff",
  },
  {
    title: "На улице и в парке",
    text: "Активные игры, пенная вечеринка и шоу на свежем воздухе для подвижных детей.",
    Icon: TreePine,
    color: "#5e5ce6",
  },
  {
    title: "В школе",
    text: "Выпускные, классные праздники и интерактивные шоу для школьников любого возраста.",
    Icon: GraduationCap,
    color: "#ff375f",
  },
  {
    title: "Бар / Бат мицва",
    text: "Детская часть, интерактив, ведущие и шоу-блоки для большого семейного события.",
    Icon: CalendarHeart,
    color: "#0a84ff",
  },
  {
    title: "Корпоратив с детьми",
    text: "Детская зона, активности и аниматоры на взрослых и семейных мероприятиях.",
    Icon: PartyPopper,
    color: "#ff9f0a",
  },
  {
    title: "Городские праздники и мэрии",
    text: "Большие события: несколько зон, команда, фото, видео, музыка и активности.",
    Icon: Users,
    color: "#5e5ce6",
  },
];

const BENEFITS = [
  {
    Icon: CalendarCheck,
    color: "#ff375f",
    title: "Под любое место и возраст",
    text: "Один герой работает по-разному дома, в зале или на улице — сценарий подстроим.",
  },
  {
    Icon: Languages,
    color: "#0a84ff",
    title: "На русском и иврите",
    text: "Ведущие говорят на языке ваших гостей — праздник комфортен всей семье.",
  },
  {
    Icon: ShieldCheck,
    color: "#5e5ce6",
    title: "11 лет и 10 000+ праздников",
    text: "Нам доверяют тысячи семей, детские сады и мэрии по всему Израилю.",
  },
];

export default function FormatsPage() {
  const reduce = useReducedMotion();

  return (
    <main className="min-h-screen bg-[#fffaf4] text-[var(--color-ink)]">
      <PublicHeader />

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
            <p className="text-sm font-black uppercase tracking-wide text-[#ff9f0a]">Форматы</p>
            <h1 className="mt-2 font-[family-name:var(--font-nunito)] text-[34px] font-black leading-tight tracking-tight text-zinc-950 sm:text-6xl">
              Праздник в любом месте и формате
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--color-ink-soft)] sm:text-lg">
              Вы выбираете формат, а мы настраиваем его под возраст, место и гостей. Один и тот же
              герой может работать по-разному: дома, в парке, в зале, в садике или на большом
              семейном событии — поэтому начинаем с того, что комфортно вашей семье.
            </p>
          </motion.div>

          {/* Formats grid */}
          <div className="mt-8 grid grid-cols-1 gap-3 sm:mt-10 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
            {FORMATS.map((item, i) => (
              <motion.article
                key={item.title}
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
                  {item.title}
                </h2>
                <p className="mt-1.5 text-sm leading-6 text-[var(--color-ink-soft)]">{item.text}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* Why it works for any format */}
      <section className="bg-white px-5 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="text-sm font-black uppercase tracking-wide text-[#0a84ff]">
              Под вашу семью
            </p>
            <h2 className="mt-2 font-[family-name:var(--font-nunito)] text-[32px] font-black leading-tight tracking-tight text-zinc-950 sm:text-5xl">
              Подстроимся под место, возраст и язык
            </h2>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-5">
            {BENEFITS.map((item, i) => (
              <motion.article
                key={item.title}
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
                  {item.title}
                </h3>
                <p className="mt-1.5 text-sm leading-6 text-[var(--color-ink-soft)]">{item.text}</p>
              </motion.article>
            ))}
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
              Готовые программы
            </span>
            <h2 className="mt-3 max-w-2xl font-[family-name:var(--font-nunito)] text-[26px] font-black leading-tight tracking-tight text-zinc-950 sm:text-4xl">
              Не уверены в формате? Поможем выбрать
            </h2>
            <p className="mt-3 max-w-xl text-base leading-7 text-[var(--color-ink-soft)] sm:text-lg">
              Посмотрите готовые программы с понятной ценой или напишите нам — подберём героев, шоу и
              формат под вашего ребёнка и место праздника.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/ru/all"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-[linear-gradient(100deg,#ff375f,#ff5a7a)] px-7 py-4 text-base font-black text-white shadow-[0_14px_30px_rgba(255,55,95,0.4)] transition active:scale-95"
              >
                Все программы и цены
                <ChevronRight
                  className="h-5 w-5 transition group-hover:translate-x-0.5"
                  strokeWidth={2.6}
                />
              </Link>
              <a
                href={whatsappLink(WA_MESSAGES.default)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-whatsapp)] px-7 py-4 text-base font-black text-white shadow-lg transition active:scale-95"
              >
                <MessageCircle className="h-5 w-5" strokeWidth={2.4} />
                Обсудить мой формат
              </a>
            </div>

            <p className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-[var(--color-ink-soft)]">
              <MapPin className="h-4 w-4 text-[#ff9f0a]" strokeWidth={2.6} />
              Работаем по всему Израилю
            </p>
          </motion.div>
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}
