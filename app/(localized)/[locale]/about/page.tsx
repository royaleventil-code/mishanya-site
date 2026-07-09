import AboutContent from "@/components/about/AboutContent";
import { createPageMetadata, siteName } from "@/lib/seo";
import { isLocale, type Locale } from "@/lib/i18n";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeParam } = await params;
  const locale: Locale = isLocale(localeParam) ? localeParam : "ru";
  const name = siteName(locale);

  return createPageMetadata({
    title: locale === "he" ? `עלינו | ${name}` : `О нас | ${name}`,
    description:
      locale === "he"
        ? "הצוות של מישניה בארץ הפלאות: 11 שנות ימי הולדת לילדים בישראל, 10,000+ אירועים, 783 ביקורות בדירוג 5.0 ומנחים בעברית וברוסית."
        : "Команда Мишаня в Стране Чудес: 11 лет детских праздников в Израиле, 10 000+ мероприятий, 783 отзыва с оценкой 5,0 и ведущие на русском и иврите.",
    path: `/${locale}/about`,
    canonicalPath: `/${locale}/about`,
    locale,
  });
}

export default async function LocalizedAboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeParam } = await params;
  const locale: Locale = isLocale(localeParam) ? localeParam : "ru";
  return <AboutContent locale={locale} />;
}
