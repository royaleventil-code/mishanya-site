import { Header } from "./Header";
import { Hero } from "./Hero";
import { ProgramsSection } from "./ProgramsSection";
import { HowItWorks } from "./HowItWorks";
import { Trust } from "./Trust";
import { Faq } from "./Faq";
import { FinalCta } from "./FinalCta";
import { Footer } from "./Footer";
import { StickyMobileCta } from "./StickyMobileCta";
import { PROGRAMS } from "@/data/programs";
import { HEROES } from "@/data/heroes";
import { SEGMENTS } from "@/lib/segments";
import type { SegmentId } from "@/lib/types";

type Props = {
  segment: SegmentId;
  title: string;
  emojiOverride?: string;
};

export function SegmentPage({ segment, title, emojiOverride }: Props) {
  const cfg = SEGMENTS[segment];
  return (
    <>
      <Header />
      <Hero emoji={emojiOverride ?? cfg.emoji} title={title} accent={cfg.accent} />
      <ProgramsSection
        segment={segment}
        accent={cfg.accent}
        programs={PROGRAMS}
        heroes={HEROES}
      />
      <HowItWorks />
      <Trust />
      <Faq />
      <FinalCta accent={cfg.accent} />
      <Footer />
      <StickyMobileCta />
    </>
  );
}
