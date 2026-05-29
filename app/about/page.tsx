import type { Metadata } from "next";
import Image from "next/image";
import { BadgeCheck, HeartHandshake, ShieldCheck, Sparkles } from "lucide-react";
import { PublicFooter } from "@/components/PublicFooter";
import { PublicHeader } from "@/components/PublicHeader";
import { WA_MESSAGES, whatsappLink } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "О нас | Мишаня в Стране Чудес",
  description: "Агентство детских праздников в Израиле: ведущие, персонажи, шоу и программы, которые настраиваются под ребенка и формат семьи.",
};

const VALUES = [
  {
    title: "План без суеты",
    text: "Вы выбираете настроение, а сценарий подстраивается под возраст, место и характер ребенка.",
    Icon: Sparkles,
  },
  {
    title: "Команда на месте",
    text: "Ведущие, персонажи и шоу-блоки приезжают с реквизитом и понятным таймингом.",
    Icon: BadgeCheck,
  },
  {
    title: "Спокойствие родителей",
    text: "Заранее фиксируем вводные, условия площадки и детали, которые важны именно вам.",
    Icon: ShieldCheck,
  },
  {
    title: "Живые эмоции",
    text: "Дети вовлечены в историю, а не просто смотрят выступление со стороны.",
    Icon: HeartHandshake,
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#fffaf4] text-[var(--color-ink)]">
      <PublicHeader />
      <section className="px-5 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-sm font-bold text-[#e34f35]">
              О нас
            </p>
            <h1 className="mt-3 break-words text-4xl font-black leading-tight sm:text-6xl">
              Агентство, которое помогает собрать праздник под вашего ребенка.
            </h1>
            <p className="mt-6 text-lg leading-8 text-[var(--color-ink-soft)]">
              «Мишаня в Стране Чудес» делает праздники в Израиле: от камерного
              дня рождения дома до большого события с героями, шоу и полной организацией.
              Вы выбираете настроение и масштаб, а команда отвечает за подготовку и проведение.
            </p>
            <a
              href={whatsappLink(WA_MESSAGES.default)}
              target="_blank"
              rel="noreferrer"
              className="mt-8 inline-flex rounded-full bg-[var(--color-whatsapp)] px-6 py-3.5 text-base font-black text-white transition active:scale-95"
            >
              Обсудить праздник
            </a>
          </div>
          <div className="relative h-[460px] overflow-hidden rounded-lg bg-zinc-100 shadow-[var(--shadow-card)]">
            <Image
              src="/proof/kids-1-3/page-09.webp"
              alt="Праздник Мишани с детьми и персонажами"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="max-w-3xl text-4xl font-black leading-tight sm:text-5xl">
            Хороший праздник держится на выборе семьи и понятной организации.
          </h2>
          <div className="mt-9 grid gap-4 md:grid-cols-4">
            {VALUES.map((item) => (
              <article key={item.title} className="rounded-lg border border-[var(--color-line)] p-5">
                <item.Icon className="h-7 w-7 text-[#0a84ff]" strokeWidth={2.4} />
                <h3 className="mt-5 text-xl font-black">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[var(--color-ink-soft)]">
                  {item.text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <PublicFooter />
    </main>
  );
}
