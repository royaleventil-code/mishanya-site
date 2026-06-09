import { HomeHero } from "@/components/home/HomeHero";
import { ProgramsShowcase } from "@/components/home/ProgramsShowcase";
import { HeroesStrip } from "@/components/home/HeroesStrip";
import { WhyUs } from "@/components/home/WhyUs";
import { HowItWorks } from "@/components/home/HowItWorks";
import { SocialProof } from "@/components/home/SocialProof";
import { Faq } from "@/components/home/Faq";
import { FinalCta } from "@/components/home/FinalCta";
import { SiteFooter } from "@/components/home/SiteFooter";
import { StickyCta } from "@/components/home/StickyCta";
import type { Locale } from "@/lib/i18n";

export function HomePage({ locale = "ru" }: { locale?: Locale }) {
  return (
    <main className="min-h-screen bg-[#fffaf4] pb-24 text-[var(--color-ink)] md:pb-0">
      <HomeHero locale={locale} />
      <ProgramsShowcase locale={locale} />
      <HeroesStrip locale={locale} />
      <WhyUs locale={locale} />
      <HowItWorks locale={locale} />
      <SocialProof locale={locale} />
      <Faq locale={locale} />
      <FinalCta locale={locale} />
      <SiteFooter locale={locale} />
      <StickyCta locale={locale} />
    </main>
  );
}
