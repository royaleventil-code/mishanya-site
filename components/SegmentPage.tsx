import Link from "next/link";
import { SiteFooter } from "@/components/home/SiteFooter";
import { PublicHeader } from "./PublicHeader";
import { BidiText } from "./BidiText";
import { Hero } from "./Hero";
import { ProgramsSection } from "./ProgramsSection";
import { SocialProofSection } from "./SocialProofSection";
import { HowItWorks } from "./HowItWorks";
import { Trust } from "./Trust";
import { Faq } from "./Faq";
import { FinalCta } from "./FinalCta";
import { AgeAtmosphere } from "./AgeAtmosphere";
import { AgeGuide } from "./AgeGuide";
import type { AgeGuideData } from "@/data/age-guide";
import {
  BOYS_4_5_PROOF,
  BOYS_6_10_PROOF,
  GIRLS_4_6_PROOF,
  GIRLS_7_10_PROOF,
} from "@/data/social-proof";
import { getDictionary } from "@/lib/dictionaries";
import { getLocalizedHeroes, getLocalizedPrograms, hasProgramCopy } from "@/lib/localized-data";
import { SEGMENTS } from "@/lib/segments";
import { localePath, type Locale } from "@/lib/i18n";
import type { AudienceContext, Program, SegmentId } from "@/lib/types";

type Props = {
  locale?: Locale;
  segment: SegmentId;
  title: string;
  emojiOverride?: string;
  audience?: AudienceContext;
  // Возрастной гайд + FAQ (только на страницах /{boy|girl}/{age}); без пропа блок не рендерится
  ageGuide?: AgeGuideData | null;
};

export function SegmentPage({ locale = "ru", segment, title, emojiOverride, audience, ageGuide }: Props) {
  const cfg = SEGMENTS[segment];
  const programs = getLocalizedPrograms(locale);
  const heroes = getLocalizedHeroes(locale);
  const useBoysProof =
    audience?.gender === "boy" &&
    typeof audience.age === "number" &&
    audience.age >= 6 &&
    audience.age <= 10;
  const useBoysYoungProof =
    audience?.gender === "boy" &&
    typeof audience.age === "number" &&
    audience.age >= 4 &&
    audience.age <= 5;
  const useGirlsYoungProof =
    audience?.gender === "girl" &&
    typeof audience.age === "number" &&
    audience.age >= 4 &&
    audience.age <= 6;
  const useGirlsOlderProof =
    audience?.gender === "girl" &&
    typeof audience.age === "number" &&
    audience.age >= 7 &&
    audience.age <= 10;
  const proofSet = useBoysProof
    ? BOYS_6_10_PROOF
    : useBoysYoungProof
      ? BOYS_4_5_PROOF
      : useGirlsYoungProof
        ? GIRLS_4_6_PROOF
        : useGirlsOlderProof
          ? GIRLS_7_10_PROOF
          : undefined;

  return (
    <>
      <PublicHeader locale={locale} />
      <main id="main" className="relative isolate overflow-hidden pb-24 sm:pb-0">
        <AgeAtmosphere audience={audience} />
        <div className="relative z-10">
          <Hero locale={locale} emoji={emojiOverride ?? cfg.emoji} title={title} accent={cfg.accent} />
          <ProgramsSection
            locale={locale}
            segment={segment}
            accent={cfg.accent}
            programs={programs}
            heroes={heroes}
            audience={audience}
          />
          {ageGuide && <AgeGuide locale={locale} data={ageGuide} />}
          <SocialProofSection locale={locale} proofSet={proofSet} />
          <HowItWorks locale={locale} />
          <Trust locale={locale} />
          {/* при возрастном гайде FAQPage уже вставлен страницей - второй не дублируем */}
          <Faq locale={locale} jsonLd={!ageGuide} />
          <FinalCta locale={locale} accent={cfg.accent} />
          {segment === "all" && <ProgramLinksIndex locale={locale} programs={programs} />}
          <SiteFooter locale={locale} />
        </div>
      </main>
    </>
  );
}

// Тихий индекс текстовых ссылок на страницы программ - внутренняя перелинковка для поисковиков.
// Видимое поведение каталога (карточки-модалки) не трогаем.
function ProgramLinksIndex({ locale, programs }: { locale: Locale; programs: Program[] }) {
  const dict = getDictionary(locale);
  const linked = programs.filter((program) => hasProgramCopy(locale, program.id));

  return (
    <section className="mx-auto max-w-3xl px-5 pb-12 sm:px-6">
      <h2 className="text-sm font-semibold text-[var(--color-ink-soft)]">
        {dict.common.programsIndexTitle}
      </h2>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm">
        {linked.map((program) => (
          <li key={program.id}>
            <Link
              href={localePath(locale, `/programs/${program.id}`)}
              className="text-[var(--color-ink-soft)] underline-offset-4 transition hover:text-[var(--color-ink)] hover:underline"
            >
              <BidiText locale={locale}>{program.title}</BidiText>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
