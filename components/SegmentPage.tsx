import { Header } from "./Header";
import { Hero } from "./Hero";
import { ProgramsSection } from "./ProgramsSection";
import { SocialProofSection } from "./SocialProofSection";
import { HowItWorks } from "./HowItWorks";
import { Trust } from "./Trust";
import { Faq } from "./Faq";
import { FinalCta } from "./FinalCta";
import { Footer } from "./Footer";
import { StickyMobileCta } from "./StickyMobileCta";
import { PROGRAMS } from "@/data/programs";
import { HEROES } from "@/data/heroes";
import {
  BOYS_4_5_PROOF,
  BOYS_6_10_PROOF,
  GIRLS_4_6_PROOF,
  GIRLS_7_10_PROOF,
} from "@/data/social-proof";
import { SEGMENTS } from "@/lib/segments";
import type { AudienceContext, SegmentId } from "@/lib/types";

type Props = {
  segment: SegmentId;
  title: string;
  emojiOverride?: string;
  audience?: AudienceContext;
};

export function SegmentPage({ segment, title, emojiOverride, audience }: Props) {
  const cfg = SEGMENTS[segment];
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
      <Header />
      <Hero emoji={emojiOverride ?? cfg.emoji} title={title} accent={cfg.accent} />
      <ProgramsSection
        segment={segment}
        accent={cfg.accent}
        programs={PROGRAMS}
        heroes={HEROES}
        audience={audience}
      />
      <SocialProofSection proofSet={proofSet} />
      <HowItWorks />
      <Trust />
      <Faq />
      <FinalCta accent={cfg.accent} />
      <Footer />
      <StickyMobileCta />
    </>
  );
}
