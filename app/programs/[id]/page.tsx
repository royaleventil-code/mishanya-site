import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Check, Clock, Languages, MapPin, MessageCircle, Users } from "lucide-react";
import { ADDONS } from "@/data/addons";
import { PROGRAMS, getProgramById } from "@/data/programs";
import { HEROES, getHeroImage } from "@/data/heroes";
import { ProgramMenu } from "@/components/ProgramMenu";
import { ProgramVisual } from "@/components/ProgramVisual";
import { PublicHeader } from "@/components/PublicHeader";
import { whatsappLink } from "@/lib/whatsapp";
import type { Hero, Program } from "@/lib/types";

export function generateStaticParams() {
  return PROGRAMS.map((program) => ({ id: program.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const program = getProgramById(id);

  if (!program) {
    return {
      title: "Программа не найдена | Мишаня в Стране Чудес",
    };
  }

  return {
    title: `${program.title} | Программа детского праздника`,
    description: program.tagline ?? "Готовая идея детского праздника, которую можно адаптировать под возраст, площадку и формат семьи.",
  };
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
  if (program.locations.length > 1) return "в помещении или на улице";
  if (program.locations[0] === "indoor") return "только в помещении";
  return "только на улице";
}

function heroExamples(program: Program): Hero[] {
  const ids = program.heroSlots
    .flatMap((slot) => slot.onlyHeroIds ?? slot.orderedHeroIds ?? slot.includedHeroIds ?? [])
    .slice(0, 8);

  return ids
    .map((id) => HEROES.find((hero) => hero.id === id))
    .filter((hero): hero is Hero => Boolean(hero));
}

const CUSTOM_OPTIONS = [
  {
    title: "Герой и тема",
    text: "Оставляем эту идею как основу или меняем персонажа под интересы ребенка.",
  },
  {
    title: "Темп и длительность",
    text: "Можно сделать праздник спокойнее, активнее, короче или насыщеннее.",
  },
  {
    title: "Язык и площадка",
    text: "Подстроим проведение под русский, иврит или смешанный формат, дом, парк или зал.",
  },
  {
    title: "Состав под бюджет",
    text: "Выбираем, что оставить главным: героев, шоу-блок, фото-моменты или большой финал.",
  },
];

export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const program = getProgramById(id);
  if (!program) notFound();

  const includes = [...program.includes, ...(program.bundled ?? [])];
  const recommendedAddons =
    program.recommendedAddonIds
      ?.map((addonId) => ADDONS.find((addon) => addon.id === addonId))
      .filter((addon): addon is (typeof ADDONS)[number] => Boolean(addon)) ?? [];
  const examples = heroExamples(program);

  return (
    <main className="min-h-screen bg-[#fffaf4] text-[var(--color-ink)]">
      <PublicHeader />
      <ProgramReturnBar />
      <section className="px-5 py-8 sm:px-6 sm:py-12">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-7 lg:grid-cols-[1.08fr_0.92fr] lg:items-start">
            <div>
              <p className="text-sm font-bold text-[#e34f35]">
                Выбранная программа
              </p>
              <h1 className="mt-3 break-words text-4xl font-black leading-tight sm:text-7xl">
                {program.title}
              </h1>
              {program.tagline && (
                <p className="mt-5 max-w-2xl text-xl leading-8 text-[var(--color-ink-soft)]">
                  {program.tagline}
                </p>
              )}
            </div>

            <div className="overflow-hidden rounded-lg bg-white shadow-[var(--shadow-card)] lg:row-span-2">
              <ProgramVisual
                program={program}
                priority
                sizes="(max-width: 1024px) 100vw, 42vw"
                className="aspect-[4/3]"
              />
            </div>

            <div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Fact icon={<Clock className="h-5 w-5" />} title="Длительность" value={program.durationLabel} />
                <Fact icon={<Users className="h-5 w-5" />} title="Команда" value={program.animatorsLabel ?? `${program.animators} ведущих`} />
                <Fact
                  icon={<Users className="h-5 w-5" />}
                  title="Группа"
                  value={program.maxKids === null ? "обсуждаем по формату" : `до ${program.maxKids}`}
                />
                <Fact icon={<Languages className="h-5 w-5" />} title="Язык" value={languageLabel(program)} />
                <Fact icon={<MapPin className="h-5 w-5" />} title="Место" value={locationLabel(program)} />
              </div>

              {program.note && (
                <div className="mt-5 rounded-lg bg-white p-5 text-sm leading-6 shadow-[var(--shadow-card)]">
                  <span className="font-black">Важно: </span>
                  {program.note}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <h2 className="text-4xl font-black leading-tight sm:text-5xl">
              Что входит в программу
            </h2>
            {program.includesHighlight && (
              <p className="mt-5 rounded-lg bg-[#fffaf4] p-5 text-base font-bold leading-7">
                {program.includesHighlight}
              </p>
            )}
            {program.bonus && (
              <p className="mt-4 rounded-lg bg-[#eaf4ff] p-5 text-sm leading-6">
                <span className="font-black">Бонус: </span>
                {program.bonus}
              </p>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {includes.map((item) => (
              <div key={item} className="flex gap-3 rounded-lg border border-[var(--color-line)] p-4">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#0a84ff]" strokeWidth={2.5} />
                <span className="text-sm font-semibold leading-6">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="text-sm font-bold text-[#0a84ff]">
              Можно настроить
            </p>
            <h2 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">
              Это готовая основа, а не жёсткий пакет.
            </h2>
            <p className="mt-4 text-base leading-7 text-[var(--color-ink-soft)]">
              Вы можете оставить программу как есть или поменять детали под ребенка,
              гостей, площадку и комфортный бюджет.
            </p>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {CUSTOM_OPTIONS.map((option) => (
              <div key={option.title} className="rounded-lg bg-white p-5 shadow-[var(--shadow-card)]">
                <Check className="h-5 w-5 text-[#0a84ff]" strokeWidth={2.5} />
                <h3 className="mt-4 text-xl font-black leading-tight">{option.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[var(--color-ink-soft)]">
                  {option.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {(program.heroSlots.length > 0 || examples.length > 0) && (
        <section className="px-5 py-14 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-3xl">
              <p className="text-sm font-bold text-[#e34f35]">
                Герои
              </p>
              <h2 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">
                Героя можно выбрать или заменить под интересы ребенка.
              </h2>
            </div>

            {program.heroSlots.length > 0 && (
              <div className="mt-8 grid gap-3 md:grid-cols-2">
                {program.heroSlots.map((slot) => (
                  <div key={`${slot.label}-${slot.kind}`} className="rounded-lg bg-white p-5 shadow-[var(--shadow-card)]">
                    <div className="text-xl font-black">{slot.label}</div>
                    <div className="mt-2 text-sm leading-6 text-[var(--color-ink-soft)]">
                      {slot.kind === "mascot" ? "Ростовой персонаж" : "Ведущий в образе"}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {examples.length > 0 && (
              <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
                {examples.map((hero) => (
                  <HeroMiniCard key={hero.id} hero={hero} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {recommendedAddons.length > 0 && (
        <section className="bg-[#111318] px-5 py-14 text-white sm:px-6 sm:py-20">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-4xl font-black leading-tight">
              Можно усилить праздник
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/72">
              Эти опции можно добавить, если хочется больше эффекта, фото-моментов
              или финального вау-блока. Доступность уточним под дату и площадку.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {recommendedAddons.map((addon) => (
                <div key={addon.id} className="rounded-lg bg-white p-4 text-zinc-950">
                  <div className="flex items-center gap-3">
                    {addon.icon ? (
                      <div className="relative h-14 w-14 shrink-0">
                        <Image src={addon.icon} alt={addon.name} fill sizes="56px" className="object-contain" />
                      </div>
                    ) : (
                      <span className="text-4xl">{addon.emoji}</span>
                    )}
                    <div className="text-base font-black leading-tight">{addon.name}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="px-5 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl rounded-lg bg-[#0a84ff] p-6 text-white sm:p-10">
          <h2 className="max-w-3xl text-4xl font-black leading-tight sm:text-5xl">
            Нравится эта идея? Напишите дату, город и возраст ребенка.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-white/82">
            Подстроим состав, героев, язык и дополнительные блоки под вашу
            площадку, количество гостей и комфортный формат.
          </p>
          <a
            href={whatsappLink(`Здравствуйте! Интересует программа "${program.title}". Подскажите, пожалуйста, подробности.`)}
            target="_blank"
            rel="noreferrer"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-base font-black text-[#0a84ff] transition active:scale-95"
          >
            <MessageCircle className="h-5 w-5" strokeWidth={2.4} />
            Оставить заявку в WhatsApp
          </a>
        </div>
      </section>
    </main>
  );
}

function ProgramReturnBar() {
  return (
    <div className="border-b border-[var(--color-line)] bg-white px-5 py-3 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <ProgramMenu variant="pill" label="Другие программы" />
        <p className="text-sm font-semibold leading-6 text-[var(--color-ink-soft)]">
          Можно сразу выбрать другую идею для сравнения.
        </p>
      </div>
    </div>
  );
}

function Fact({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-white p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-2 text-[#0a84ff]">{icon}</div>
      <div className="mt-3 text-sm font-bold text-[var(--color-ink-soft)]">
        {title}
      </div>
      <div className="mt-1 text-base font-black leading-tight">{value}</div>
    </div>
  );
}

function HeroMiniCard({ hero }: { hero: Hero }) {
  const image = getHeroImage(hero.id);

  return (
    <div className="rounded-lg bg-white p-3 text-center shadow-[var(--shadow-card)]">
      <div className="relative mx-auto h-24 w-full">
        {image ? (
          <Image src={image} alt={hero.name} fill sizes="110px" className="object-contain" />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl">🎭</div>
        )}
      </div>
      <div className="mt-3 min-h-[40px] text-xs font-black leading-tight">
        {hero.name}
      </div>
    </div>
  );
}
