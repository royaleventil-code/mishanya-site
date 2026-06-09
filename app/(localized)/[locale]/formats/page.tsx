import FormatsContent from "@/components/formats/FormatsContent";
import { createPageMetadata, siteName } from "@/lib/seo";
import { isLocale, type Locale } from "@/lib/i18n";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeParam } = await params;
  const locale: Locale = isLocale(localeParam) ? localeParam : "ru";
  const name = siteName(locale);

  return createPageMetadata({
    title: locale === "he" ? `פורמטים לאירועים | ${name}` : `Форматы праздников | ${name}`,
    description:
      locale === "he"
        ? "ימי הולדת בבית, בגן, בבית ספר, באולם, במסעדה, בפארק ובאירועי עירייה. מישניה מתאים את התוכנית למקום, לגיל ולשפת האורחים."
        : "Детские праздники дома, в садике, школе, зале, ресторане, парке и на городских событиях. Мишаня подстраивает программу под место, возраст и язык гостей.",
    path: `/${locale}/formats`,
    canonicalPath: `/${locale}/formats`,
    image: "/generated/program-party.webp",
    locale,
  });
}

export default async function LocalizedFormatsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeParam } = await params;
  const locale: Locale = isLocale(localeParam) ? localeParam : "ru";
  return <FormatsContent locale={locale} />;
}
