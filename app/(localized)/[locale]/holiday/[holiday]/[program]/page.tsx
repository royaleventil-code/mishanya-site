import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NEW_YEAR_PROGRAMS, NEW_YEAR_PHOTO_SIZE, newYearPath, newYearProgram } from "@/data/new-year";
import { isLocale } from "@/lib/i18n";
import { createPageMetadata, siteUrl } from "@/lib/seo";
import { NewYearShell } from "@/components/new-year/NewYearShell";
import { NewYearProgram } from "@/components/new-year/NewYearProgram";

type Props = { params: Promise<{ locale: string; holiday: string; program: string }> };
export const dynamicParams = false;

export function generateStaticParams() {
  return NEW_YEAR_PROGRAMS.map((program) => ({ holiday: "new-year", program: program.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, holiday, program: id } = await params;
  const program = newYearProgram(id);
  if (!isLocale(locale) || holiday !== "new-year" || !program) return {};
  const [imageWidth, imageHeight] = NEW_YEAR_PHOTO_SIZE[program.photo ?? "winter"];
  return createPageMetadata({
    title: `${program.name[locale]} | ${locale === "ru" ? "Новый год с Мишаней" : "נובי גוד עם מישניה"}`,
    description: program.description[locale], path: newYearPath(locale, id), locale,
    image: `/new-year/${program.photo ?? "winter"}-1000.webp`, imageWidth, imageHeight,
  });
}

export default async function ProgramPage({ params }: Props) {
  const { locale, holiday, program: id } = await params;
  const program = newYearProgram(id);
  if (!isLocale(locale) || holiday !== "new-year" || !program) notFound();
  const pageUrl = siteUrl(newYearPath(locale, id));
  const jsonLd = {
    "@context": "https://schema.org", "@type": "Service", name: program.name[locale],
    description: program.description[locale], url: pageUrl,
    provider: { "@id": siteUrl("/#organization") },
    areaServed: { "@type": "Country", name: "Israel" },
    offers: program.options.map((option) => ({
      "@type": option.from ? "AggregateOffer" : "Offer", priceCurrency: "ILS", ...(option.from ? { lowPrice: option.price } : { price: option.price }), url: pageUrl,
      name: option.minutes ? `${option.minutes} ${locale === "ru" ? "минут" : "דקות"}` : program.name[locale],
    })),
  };
  return <NewYearShell locale={locale} programId={id}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    <NewYearProgram key={id} locale={locale} program={program} />
  </NewYearShell>;
}
