import { PublicHeader } from "./PublicHeader";
import { Hero } from "./Hero";
import { ProgramsSection } from "./ProgramsSection";
import { SocialProofSection } from "./SocialProofSection";
import { HowItWorks } from "./HowItWorks";
import { Trust } from "./Trust";
import { Faq } from "./Faq";
import { FinalCta } from "./FinalCta";
import { PublicFooter } from "./PublicFooter";
import { AgeAtmosphere } from "./AgeAtmosphere";
import {
  BOYS_4_5_PROOF,
  BOYS_6_10_PROOF,
  GIRLS_4_6_PROOF,
  GIRLS_7_10_PROOF,
} from "@/data/social-proof";
import { getLocalizedHeroes, getLocalizedPrograms } from "@/lib/localized-data";
import { SEGMENTS } from "@/lib/segments";
import type { Locale } from "@/lib/i18n";
import type { AudienceContext, SegmentId } from "@/lib/types";

type Props = {
  locale?: Locale;
  segment: SegmentId;
  title: string;
  emojiOverride?: string;
  audience?: AudienceContext;
};

export function SegmentPage({ locale = "ru", segment, title, emojiOverride, audience }: Props) {
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
      <main className="relative isolate overflow-hidden pb-24 sm:pb-0">
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
          <SocialProofSection locale={locale} proofSet={proofSet} />
          <HowItWorks locale={locale} />
          <Trust locale={locale} />
          <Faq locale={locale} />
          <FinalCta locale={locale} accent={cfg.accent} />
          <PublicFooter locale={locale} />
        </div>
      </main>
    </>
  );
}
