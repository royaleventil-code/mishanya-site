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
import { BOYS_6_10_PROOF } from "@/data/social-proof";
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
      <SocialProofSection proofSet={useBoysProof ? BOYS_6_10_PROOF : undefined} />
      <HowItWorks />
      <Trust />
      <Faq />
      <FinalCta accent={cfg.accent} />
      <Footer />
      <StickyMobileCta />
    </>
  );
}
