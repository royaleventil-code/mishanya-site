import { HomeHero } from "@/components/home/HomeHero";
import { TrustBar } from "@/components/home/TrustBar";
import { ProgramsShowcase } from "@/components/home/ProgramsShowcase";
import { HeroesStrip } from "@/components/home/HeroesStrip";
import { WhyUs } from "@/components/home/WhyUs";
import { HowItWorks } from "@/components/home/HowItWorks";
import { SocialProof } from "@/components/home/SocialProof";
import { Faq } from "@/components/home/Faq";
import { FinalCta } from "@/components/home/FinalCta";
import { SiteFooter } from "@/components/home/SiteFooter";
import { StickyCta } from "@/components/home/StickyCta";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#fffaf4] text-[var(--color-ink)]">
      <HomeHero />
      <TrustBar />
      <ProgramsShowcase />
      <HeroesStrip />
      <WhyUs />
      <HowItWorks />
      <SocialProof />
      <Faq />
      <FinalCta />
      <SiteFooter />
      <StickyCta />
    </main>
  );
}
