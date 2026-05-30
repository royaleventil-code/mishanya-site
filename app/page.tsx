import Image from "next/image";
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
  PartyPopper,
  Phone,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import { PROGRAMS } from "@/data/programs";
import { HEROES, getHeroEmoji, getHeroImage } from "@/data/heroes";
import { DevPriceMenu } from "@/components/DevPriceMenu";
import { ProgramMenu } from "@/components/ProgramMenu";
import { ProgramVisual } from "@/components/ProgramVisual";
import { SocialProofSection } from "@/components/SocialProofSection";
import { WA_DISPLAY, WA_MESSAGES, whatsappLink } from "@/lib/whatsapp";
import type { Hero, Program } from "@/lib/types";

const HERO_BACKDROPS = [
  "/proof/kids-1-3/page-09.webp",
  "/proof/boys-6-10/page-11.webp",
  "/proof/girls-4-6/page-11.webp",
];

const STATS = [
  { value: "11 лет", label: "делаем праздники в Израиле" },
  { value: "10 000+", label: "детских событий и шоу" },
  { value: "80+", label: "персонажей и образов" },
  { value: "2 языка", label: "русский и иврит" },
];

const EVENT_TYPES = [
  {
    title: "День рождения",
    text: "От домашнего праздника на 10 детей до большого события в зале.",
    Icon: PartyPopper,
  },
  {
    title: "Бар / Бат мицва",
    text: "Сценарий, ведущие, интерактив и шоу-блоки для семьи и гостей.",
    Icon: Star,
  },
  {
    title: "Садик и школа",
    text: "Выпускные, календарные праздники, утренники и выездные программы.",
    Icon: Users,
  },
  {
    title: "Семейные события",
    text: "Детская зона на свадьбе, корпоративе, гендер-пати или городском празднике.",
    Icon: Sparkles,
  },
];

const SERVICE_BLOCKS = [
  "Аниматоры и ведущие",
  "Персонажи и ростовые герои",
  "Шоу-программы",
  "Музыка, свет и реквизит",
  "Фото и видео",
  "Дополнительные активности",
];

const CUSTOM_CONTROLS = [
  {
    title: "Герой и тема",
    text: "Можно выбрать любимого персонажа, заменить образ или собрать пару героев.",
    Icon: Palette,
  },
  {
    title: "Темп праздника",
    text: "Для спокойной маленькой компании и для активного события сценарий будет разным.",
    Icon: CalendarCheck,
  },
  {
    title: "Язык гостей",
    text: "Русский, иврит или смешанный формат под семью и приглашенных детей.",
    Icon: Languages,
  },
  {
    title: "Комфортный бюджет",
    text: "Можно оставить базовую идею или усилить её шоу-блоками, фото и большим финалом.",
    Icon: ShieldCheck,
  },
];

const PROGRAM_GROUPS = [
  {
    title: "Готовый день рождения",
    text: "База для праздника: ведущий, игры, музыка, реквизит и финал с тортом.",
    programIds: ["mini", "start", "standart"],
  },
  {
    title: "Супергерои и приключения",
    text: "Активные миссии, герои, квесты и эффектный выход персонажа.",
    programIds: ["super-heroes", "paw-patrol-toddler-boys", "harry-potter"],
  },
  {
    title: "Сказка и волшебство",
    text: "Нежные, яркие и фантазийные программы, которые можно адаптировать под ребенка.",
    programIds: ["frozen-toddler-girls", "unicorn-toddler-girls", "barbie"],
  },
  {
    title: "Шоу-эффекты",
    text: "Наука, фокусы, неон, пена и другие блоки, которые усиливают праздник.",
    programIds: ["chemistry", "magician", "neon", "foam"],
  },
];

const PROCESS = [
  {
    title: "Вы рассказываете, что важно",
    text: "Возраст, город, место, язык, количество детей, любимые темы и комфортный бюджет.",
    Icon: MessageCircle,
  },
  {
    title: "Выбираете направление",
    text: "Перед вами несколько идей, а вы решаете, какое настроение ближе.",
    Icon: Palette,
  },
  {
    title: "Вы утверждаете состав",
    text: "Согласовываем героев, длительность, язык, шоу-блоки и условия площадки.",
    Icon: CalendarCheck,
  },
  {
    title: "Проводим праздник",
    text: "Команда приезжает подготовленной и ведет детей от первого выхода до финала.",
    Icon: BadgeCheck,
  },
];

const TRUST_POINTS = [
  {
    title: "Один понятный план",
    text: "Сценарий, ведущие, реквизит, музыка, шоу и дополнительные активности собираются в понятный порядок.",
    Icon: ShieldCheck,
  },
  {
    title: "По всему Израилю",
    text: "Работаем дома, в парках, ресторанах, садах, школах, залах и на выездных площадках.",
    Icon: MapPin,
  },
  {
    title: "Живые материалы",
    text: "На сайте есть фото, отзывы и видео с реальных праздников, а не только красивые картинки.",
    Icon: Camera,
  },
  {
    title: "Два языка",
    text: "Можно провести праздник на русском, иврите или в смешанном формате для разных гостей.",
    Icon: Languages,
  },
];

const FAQ = [
  {
    q: "Как выбрать программу, если вариантов много?",
    a: "Можно начать с любой готовой идеи на сайте. После этого мы адаптируем героев, длительность, язык, площадку и состав под ваш праздник.",
  },
  {
    q: "Можно ли сделать праздник дома или в парке?",
    a: "Да. Мы проводим праздники дома, на улице, в ресторанах, садах, школах и залах. Для некоторых шоу нужны условия, например помещение, вода или электричество.",
  },
  {
    q: "Можно выбрать конкретного героя?",
    a: "Да. Можно выбрать любимого героя или попросить несколько вариантов под возраст, язык и настроение праздника.",
  },
  {
    q: "На каком языке проводится праздник?",
    a: "Есть русскоязычные, ивритоязычные и двуязычные ведущие. Выберите язык заранее, чтобы праздник был комфортным для всех гостей.",
  },
];

function pickPrograms(ids: string[]): Program[] {
  return ids
    .map((id) => PROGRAMS.find((program) => program.id === id))
    .filter((program): program is Program => Boolean(program));
}

export default function Home() {
  const costumeHeroes = HEROES.filter((hero) => hero.kind === "costume");
  const mascotHeroes = HEROES.filter((hero) => hero.kind === "mascot");

  return (
    <main className="min-h-screen bg-[#fffaf4] text-[var(--color-ink)]">
      <HeroSection />
      <EventTypesSection />
      <AgencySection />
      <CustomControlSection />
      <ProgramSkeletonSection />
      <CharactersSection costumes={costumeHeroes} mascots={mascotHeroes} />
      <ProcessSection />
      <div id="proof">
        <SocialProofSection />
      </div>
      <FaqSection />
      <FinalSection />
      <SiteFooter />
    </main>
  );
}

function HeroSection() {
  return (
    <section className="relative isolate min-h-[78svh] overflow-hidden bg-zinc-950 text-white">
      <div className="absolute inset-0 grid grid-cols-3">
        {HERO_BACKDROPS.map((src, index) => (
          <div key={src} className="relative min-h-full overflow-hidden">
            <Image
              src={src}
              alt=""
              fill
              priority={index === 0}
              sizes="(max-width: 768px) 70vw, 34vw"
              className="object-cover"
            />
          </div>
        ))}
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(4,7,20,0.88)_0%,rgba(4,7,20,0.66)_42%,rgba(4,7,20,0.22)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#fffaf4] to-transparent" />

      <header className="relative z-50 mx-auto flex h-24 max-w-6xl items-center justify-between px-5 sm:px-6">
        <div className="flex items-center gap-2">
          <Link href="/" aria-label="Мишаня в Стране Чудес" className="flex items-center">
            <Image
              src="/logo-ru.png"
              alt="Мишаня в Стране Чудес"
              width={180}
              height={92}
              priority
              className="h-20 w-auto"
            />
          </Link>
          <DevPriceMenu theme="dark" />
        </div>
        <nav className="hidden items-center gap-6 text-sm font-semibold text-white/85 md:flex">
          <Link href="/about" className="transition hover:text-white">
            О нас
          </Link>
          <Link href="/formats" className="transition hover:text-white">
            Форматы
          </Link>
          <Link href="/programs" className="transition hover:text-white">
            Программы
          </Link>
          <Link href="/gallery" className="transition hover:text-white">
            Фото
          </Link>
          <Link href="/contacts" className="transition hover:text-white">
            Контакты
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <ProgramMenu theme="dark" />
          <a
            href={whatsappLink(WA_MESSAGES.default)}
            target="_blank"
            rel="noreferrer"
            aria-label="Написать в WhatsApp"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center gap-2 rounded-full bg-[var(--color-whatsapp)] text-sm font-bold text-white shadow-lg transition active:scale-95 sm:w-auto sm:px-4 sm:py-2.5"
          >
            <MessageCircle className="h-4 w-4" strokeWidth={2.4} />
            <span className="hidden sm:inline">WhatsApp</span>
          </a>
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-6xl px-5 pb-16 pt-10 sm:px-6 sm:pb-20 sm:pt-14">
        <p className="text-sm font-bold text-yellow-200">
          Агентство детских праздников в Израиле
        </p>
        <h1 className="mt-5 max-w-4xl text-5xl font-black leading-[0.95] tracking-tight sm:text-7xl lg:text-8xl">
          Детский праздник под вашего ребенка, а не по шаблону.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-white/86 sm:text-xl">
          Вы выбираете настроение, героев, язык и масштаб. Мы помогаем собрать
          из этого понятную программу для дня рождения, семейного события или
          праздника в садике и школе.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/programs"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-base font-black text-zinc-950 transition active:scale-95"
          >
            Посмотреть все идеи
            <ChevronRight className="h-5 w-5" strokeWidth={2.6} />
          </Link>
          <a
            href={whatsappLink("Здравствуйте! Хочу подобрать детский праздник.")}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/35 px-6 py-3.5 text-base font-bold text-white backdrop-blur transition hover:bg-white/10 active:scale-95"
          >
            Написать в WhatsApp
          </a>
        </div>
        <div className="mt-10 grid max-w-4xl grid-cols-2 gap-3 md:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="border-l border-white/25 pl-4">
              <div className="text-2xl font-black leading-none sm:text-3xl">{stat.value}</div>
              <div className="mt-2 text-xs font-medium leading-snug text-white/72">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function EventTypesSection() {
  return (
    <section id="formats" className="px-5 py-14 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-bold text-[#e34f35]">
              Форматы
            </p>
            <h2 className="mt-3 max-w-3xl text-4xl font-black leading-tight sm:text-5xl">
              Выберите формат, который подходит вашей семье.
            </h2>
          </div>
          <p className="max-w-sm text-base leading-7 text-[var(--color-ink-soft)]">
            Вы выбираете настроение праздника, а мы помогаем собрать его под
            возраст, место, язык гостей и ваш комфортный масштаб.
          </p>
        </div>

        <div className="mt-9 grid gap-4 md:grid-cols-4">
          {EVENT_TYPES.map((item) => (
            <article key={item.title} className="rounded-lg bg-white p-5 shadow-[var(--shadow-card)]">
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
  );
}

function AgencySection() {
  return (
    <section className="bg-white px-5 py-14 sm:px-6 sm:py-20">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div>
          <p className="text-sm font-bold text-[#0a84ff]">
            Что можно собрать
          </p>
          <h2 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">
            Вы выбираете эмоцию, героев и масштаб праздника.
          </h2>
          <p className="mt-5 text-lg leading-8 text-[var(--color-ink-soft)]">
            Вы задаете настроение, героев и желаемый масштаб. Мы собираем из
            программ, персонажей, шоу и дополнительных услуг понятный сценарий
            именно для вашего праздника.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {SERVICE_BLOCKS.map((service, index) => (
            <div
              key={service}
              className="rounded-lg border border-[var(--color-line)] bg-[#fffaf4] p-5"
            >
              <div className="text-sm font-black text-[#e34f35]">
                {String(index + 1).padStart(2, "0")}
              </div>
              <div className="mt-4 text-xl font-black">{service}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CustomControlSection() {
  return (
    <section className="px-5 py-14 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <p className="text-sm font-bold text-[#0a84ff]">
              Настройка под вас
            </p>
            <h2 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">
              Готовая программа — это основа, а праздник собирается под вашу семью.
            </h2>
            <p className="mt-5 text-lg leading-8 text-[var(--color-ink-soft)]">
              Можно начать с простой идеи: супергерои, сказка, танцы или шоу.
              Дальше выбираете, что оставить главным, а что поменять под ребенка,
              гостей, площадку и бюджет.
            </p>
            <Link
              href="/programs"
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#0a84ff] px-6 py-3.5 text-base font-black text-white transition active:scale-95"
            >
              Посмотреть все идеи
              <ChevronRight className="h-5 w-5" strokeWidth={2.6} />
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {CUSTOM_CONTROLS.map((item) => (
              <article key={item.title} className="rounded-lg bg-white p-5 shadow-[var(--shadow-card)]">
                <item.Icon className="h-7 w-7 text-[#e34f35]" strokeWidth={2.4} />
                <h3 className="mt-5 text-xl font-black leading-tight">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[var(--color-ink-soft)]">
                  {item.text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ProgramSkeletonSection() {
  return (
    <section id="programs" className="px-5 py-14 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-3xl">
          <p className="text-sm font-bold text-[#e34f35]">
            Готовые идеи
          </p>
          <h2 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">
            Выберите готовую идею или соберите программу под себя.
          </h2>
          <p className="mt-5 text-lg leading-8 text-[var(--color-ink-soft)]">
            Эти карточки — удобная отправная точка. Любую программу можно
            адаптировать по героям, длительности, языку, площадке и бюджету.
          </p>
        </div>

        <div className="mt-9 grid gap-5 lg:grid-cols-4">
          {PROGRAM_GROUPS.map((group) => (
            <article key={group.title} className="overflow-hidden rounded-lg bg-white shadow-[var(--shadow-card)]">
              <div className="relative h-56 bg-zinc-100">
                <ProgramCoverStrip programs={pickPrograms(group.programIds)} />
              </div>
              <div className="p-5">
                <h3 className="text-2xl font-black">{group.title}</h3>
                <p className="mt-3 min-h-[72px] text-sm leading-6 text-[var(--color-ink-soft)]">
                  {group.text}
                </p>
                <div className="mt-4 space-y-2">
                  {pickPrograms(group.programIds).map((program) => (
                    <Link
                      key={program.id}
                      href={`/programs/${program.id}`}
                      className="block rounded-lg border border-[var(--color-line)] px-3 py-2 transition hover:border-[#0a84ff]"
                    >
                      <div className="text-sm font-black">{program.title}</div>
                      {program.tagline && (
                        <div className="mt-1 text-xs leading-5 text-[var(--color-ink-soft)]">
                          {program.tagline}
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProgramCoverStrip({ programs }: { programs: Program[] }) {
  if (programs.length === 0) {
    return (
      <div className="flex h-full items-center justify-center bg-[#f6efe4] text-5xl font-black text-[#e34f35]">
        M
      </div>
    );
  }

  return (
    <div className="grid h-full grid-cols-3">
      {programs.slice(0, 3).map((program) => (
        <ProgramVisual
          key={program.id}
          program={program}
          sizes="(max-width: 768px) 33vw, 9vw"
          className="h-full"
        />
      ))}
    </div>
  );
}

function CharactersSection({ costumes, mascots }: { costumes: Hero[]; mascots: Hero[] }) {
  return (
    <section className="bg-[#111318] px-5 py-14 text-white sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <p className="text-sm font-bold text-yellow-200">
              Персонажи
            </p>
            <h2 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">
              Все наши герои.
            </h2>
          </div>
          <p className="text-base leading-7 text-white/72">
            Можно выбрать ведущего в образе, добавить ростовую куклу или собрать
            пару героев под возраст, язык и настроение праздника.
          </p>
        </div>

        <div className="mt-9 space-y-8">
          <HeroCarousel title="Костюмы" heroes={costumes} />
          <HeroCarousel title="Ростовые куклы" heroes={mascots} />
        </div>
      </div>
    </section>
  );
}

function HeroCarousel({ title, heroes }: { title: string; heroes: Hero[] }) {
  return (
    <div>
      <div className="mb-3 flex items-end justify-between gap-4">
        <h3 className="text-2xl font-black leading-tight">{title}</h3>
        <div className="text-sm font-black text-white/55">{heroes.length}</div>
      </div>
      <div className="hide-scrollbar -mx-5 overflow-x-auto px-5 pb-2 sm:-mx-6 sm:px-6">
        <div className="flex min-w-max snap-x gap-3">
          {heroes.map((hero) => (
            <HeroCarouselCard key={hero.id} hero={hero} />
          ))}
        </div>
      </div>
    </div>
  );
}

function HeroCarouselCard({ hero }: { hero: Hero }) {
  const image = getHeroImage(hero.id);

  return (
    <div className="w-[136px] shrink-0 snap-start rounded-lg bg-white p-3 text-center text-zinc-950 shadow-[0_18px_38px_rgba(0,0,0,0.18)] sm:w-[152px]">
      <div className="relative flex aspect-square items-center justify-center rounded-md bg-[#fffaf4]">
        {image ? (
          <Image
            src={image}
            alt={hero.name}
            fill
            sizes="152px"
            className="object-contain p-2"
          />
        ) : (
          <span className="text-4xl" aria-hidden="true">
            {getHeroEmoji(hero.id)}
          </span>
        )}
      </div>
      <div className="mt-3 flex min-h-[42px] items-center justify-center text-xs font-black leading-tight">
        {hero.name}
      </div>
    </div>
  );
}

function ProcessSection() {
  return (
    <section className="bg-white px-5 py-14 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-3xl">
          <p className="text-sm font-bold text-[#0a84ff]">
            Процесс
          </p>
          <h2 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">
            Вы видите понятный выбор, а детали собираем вместе.
          </h2>
        </div>

        <div className="mt-9 grid gap-4 md:grid-cols-4">
          {PROCESS.map((step, index) => (
            <article key={step.title} className="rounded-lg border border-[var(--color-line)] p-5">
              <div className="flex items-center justify-between">
                <step.Icon className="h-7 w-7 text-[#e34f35]" strokeWidth={2.4} />
                <span className="text-sm font-black text-[var(--color-ink-soft)]">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="mt-7 text-xl font-black">{step.title}</h3>
              <p className="mt-3 text-sm leading-6 text-[var(--color-ink-soft)]">
                {step.text}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-4">
          {TRUST_POINTS.map((point) => (
            <div key={point.title} className="rounded-lg bg-[#fffaf4] p-5">
              <point.Icon className="h-6 w-6 text-[#0a84ff]" strokeWidth={2.4} />
              <h3 className="mt-4 text-lg font-black">{point.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--color-ink-soft)]">
                {point.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FaqSection() {
  return (
    <section id="faq" className="px-5 py-14 sm:px-6 sm:py-20">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.75fr_1.25fr]">
        <div>
          <p className="text-sm font-bold text-[#e34f35]">
            Вопросы
          </p>
          <h2 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">
            Частые вопросы перед выбором программы.
          </h2>
        </div>
        <div className="space-y-3">
          {FAQ.map((item) => (
            <article key={item.q} className="rounded-lg bg-white p-5 shadow-[var(--shadow-card)]">
              <h3 className="text-lg font-black">{item.q}</h3>
              <p className="mt-3 text-sm leading-6 text-[var(--color-ink-soft)]">
                {item.a}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalSection() {
  return (
    <section className="bg-[#0a84ff] px-5 py-14 text-white sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-4xl">
          <p className="text-sm font-bold text-white/72">
            Быстрый старт
          </p>
          <h2 className="mt-3 text-4xl font-black leading-tight sm:text-6xl">
            Оставьте заявку — подберем несколько вариантов под возраст, город и дату.
          </h2>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href={whatsappLink("Здравствуйте! Хочу подобрать детский праздник. Возраст, город и дата: ")}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-base font-black text-[#0a84ff] transition active:scale-95"
            >
              <Phone className="h-5 w-5" strokeWidth={2.4} />
              Написать в WhatsApp
            </a>
            <a
              href={`tel:${WA_DISPLAY.replace(/[^+\d]/g, "")}`}
              className="inline-flex items-center justify-center rounded-full border border-white/35 px-6 py-3.5 text-base font-bold text-white transition hover:bg-white/10 active:scale-95"
            >
              {WA_DISPLAY}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="bg-[#111318] px-5 py-8 text-white sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-lg font-black">Мишаня в Стране Чудес</div>
          <div className="mt-1 text-sm text-white/60">
            Детские праздники и шоу в Израиле
          </div>
        </div>
        <div className="flex flex-wrap gap-4 text-sm font-semibold text-white/72">
          <Link href="/about" className="hover:text-white">
            О нас
          </Link>
          <Link href="/formats" className="hover:text-white">
            Форматы
          </Link>
          <Link href="/programs" className="hover:text-white">
            Программы
          </Link>
          <Link href="/gallery" className="hover:text-white">
            Фото
          </Link>
          <Link href="/contacts" className="hover:text-white">
            Контакты
          </Link>
        </div>
      </div>
    </footer>
  );
}
