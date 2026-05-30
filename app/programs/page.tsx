import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock, Languages, MapPin, Users } from "lucide-react";
import { PROGRAMS } from "@/data/programs";
import { ProgramVisual } from "@/components/ProgramVisual";
import { PublicFooter } from "@/components/PublicFooter";
import { PublicHeader } from "@/components/PublicHeader";
import { whatsappLink } from "@/lib/whatsapp";
import type { Program } from "@/lib/types";

export const metadata: Metadata = {
  title: "Программы детских праздников | Мишаня в Стране Чудес",
  description:
    "Готовые идеи программ для детских праздников в Израиле: герои, шоу, длительность и условия, которые можно адаптировать под ребенка.",
};

const CATALOG_GROUPS = [
  {
    title: "Готовая основа праздника",
    text: "Можно взять как базу и настроить под возраст, место, язык и количество гостей.",
    ids: ["mini", "start", "standart", "super-heroes", "mishanya", "vip", "super-vip"],
  },
  {
    title: "Темы и герои",
    text: "Сказки, тренды, приключения и персонажи, которые легко адаптировать под интересы ребенка.",
    ids: [
      "frozen-toddler-girls",
      "unicorn-toddler-girls",
      "paw-patrol-toddler-boys",
      "kpop",
      "tiktok",
      "wednesday",
      "barbie",
      "harry-potter",
      "squid-game",
    ],
  },
  {
    title: "Шоу и вау-эффекты",
    text: "Шоу-блоки и яркие эффекты, которые можно добавить к готовой программе или выбрать отдельно.",
    ids: ["chemistry", "circus", "magician", "neon", "foam", "tesla", "techno"],
  },
];

const FEATURED_CHOICES = [
  {
    id: "super-heroes",
    title: "Супергеройское приключение",
    text: "Для активного праздника с миссиями, героями и ярким выходом персонажа.",
  },
  {
    id: "frozen-toddler-girls",
    title: "Сказка и волшебство",
    text: "Для мягкого, красивого праздника с любимыми героями и спокойным темпом.",
  },
  {
    id: "tiktok",
    title: "Танцы и тренды",
    text: "Для детей, которым хочется музыки, челленджей и современной вечеринки.",
  },
  {
    id: "chemistry",
    title: "Шоу-эффект",
    text: "Для праздника, где нужен сильный визуальный блок и вау-момент для гостей.",
  },
];

function byIds(ids: string[]): Program[] {
  return ids
    .map((id) => PROGRAMS.find((program) => program.id === id))
    .filter((program): program is Program => Boolean(program));
}

function languageLabel(program: Program): string {
  const labels = program.languages.map((language) => {
    if (language === "ru") return "русский";
    if (language === "he") return "иврит";
    return "английский";
  });
  return labels.join(" / ");
}

function locationLabel(program: Program): string {
  if (program.locations.length > 1) return "помещение / улица";
  if (program.locations[0] === "indoor") return "в помещении";
  return "на улице";
}

export default function ProgramsPage() {
  return (
    <main className="min-h-screen bg-[#fffaf4] text-[var(--color-ink)]">
      <PublicHeader />
      <section className="px-5 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-bold text-[#e34f35]">
            Программы
          </p>
          <h1 className="mt-3 max-w-4xl break-words text-4xl font-black leading-tight sm:text-6xl">
            Выберите готовую идею — мы адаптируем её под ваш праздник.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--color-ink-soft)]">
            В карточках видно длительность, формат, язык, условия и что входит.
            Это не жёсткие пакеты: героев, шоу-блоки и масштаб можно собрать под
            возраст ребенка, площадку и ваш бюджет.
          </p>

          <section className="mt-10">
            <div className="mb-5 max-w-2xl">
              <h2 className="text-3xl font-black leading-tight">
                Начните с настроения праздника
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--color-ink-soft)]">
                Эти варианты — примеры. Можно выбрать один как основу, а потом
                поменять героя, длительность, язык, шоу-блоки и масштаб.
              </p>
            </div>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {FEATURED_CHOICES.map((choice) => {
                const program = PROGRAMS.find((item) => item.id === choice.id);
                return program ? (
                  <FeaturedChoiceCard key={choice.id} program={program} title={choice.title} text={choice.text} />
                ) : null;
              })}
            </div>
          </section>

          <div className="mt-10 space-y-12">
            {CATALOG_GROUPS.map((group) => (
              <section key={group.title}>
                <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-end">
                  <div>
                    <h2 className="text-3xl font-black leading-tight">{group.title}</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-ink-soft)]">
                      {group.text}
                    </p>
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {byIds(group.ids).map((program) => (
                    <ProgramCard key={program.id} program={program} />
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-12 rounded-lg bg-white p-6 shadow-[var(--shadow-card)] md:flex md:items-center md:justify-between md:gap-8">
            <div>
              <h2 className="text-2xl font-black">Хотите подобрать точнее?</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-ink-soft)]">
                Напишите возраст ребенка, город, дату, место и любимые темы.
                Вы получите несколько вариантов и выберете направление,
                которое ближе семье и ребенку.
              </p>
            </div>
            <a
              href={whatsappLink("Здравствуйте! Хочу выбрать программу для детского праздника.")}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex shrink-0 rounded-full bg-[var(--color-whatsapp)] px-6 py-3.5 text-base font-black text-white transition active:scale-95 md:mt-0"
            >
              Оставить заявку в WhatsApp
            </a>
          </div>
        </div>
      </section>
      <PublicFooter />
    </main>
  );
}

function FeaturedChoiceCard({
  program,
  title,
  text,
}: {
  program: Program;
  title: string;
  text: string;
}) {
  return (
    <Link
      href={`/programs/${program.id}`}
      className="group overflow-hidden rounded-lg bg-white shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)]"
    >
      <ProgramVisual
        program={program}
        sizes="(max-width: 768px) 100vw, 25vw"
        className="aspect-[4/3]"
      />
      <div className="p-5">
        <h3 className="text-xl font-black leading-tight">{title}</h3>
        <p className="mt-3 min-h-[96px] text-sm leading-6 text-[var(--color-ink-soft)]">
          {text}
        </p>
        <div className="mt-4 inline-flex items-center gap-2 text-sm font-black text-[#0a84ff]">
          Посмотреть идею
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" strokeWidth={2.6} />
        </div>
      </div>
    </Link>
  );
}

function ProgramCard({ program }: { program: Program }) {
  return (
    <Link
      href={`/programs/${program.id}`}
      className="group overflow-hidden rounded-lg bg-white shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)]"
    >
      <ProgramVisual
        program={program}
        sizes="(max-width: 768px) 100vw, 33vw"
        className="aspect-[4/3]"
      />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-2xl font-black leading-tight">{program.title}</h3>
            {program.tagline && (
              <p className="mt-2 text-sm leading-6 text-[var(--color-ink-soft)]">
                {program.tagline}
              </p>
            )}
          </div>
          <ArrowRight
            className="mt-1 h-5 w-5 shrink-0 text-[#0a84ff] transition group-hover:translate-x-1"
            strokeWidth={2.5}
          />
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 text-xs font-bold text-[var(--color-ink-soft)]">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fffaf4] px-3 py-2">
            <Clock className="h-3.5 w-3.5" strokeWidth={2.4} />
            {program.durationLabel}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fffaf4] px-3 py-2">
            <Users className="h-3.5 w-3.5" strokeWidth={2.4} />
            {program.maxKids === null ? "по запросу" : `до ${program.maxKids}`}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fffaf4] px-3 py-2">
            <Languages className="h-3.5 w-3.5" strokeWidth={2.4} />
            {languageLabel(program)}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fffaf4] px-3 py-2">
            <MapPin className="h-3.5 w-3.5" strokeWidth={2.4} />
            {locationLabel(program)}
          </span>
        </div>
      </div>
    </Link>
  );
}
