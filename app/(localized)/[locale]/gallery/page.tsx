import GalleryContent from "@/components/gallery/GalleryContent";
import { createPageMetadata, siteName } from "@/lib/seo";
import { isLocale, type Locale } from "@/lib/i18n";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeParam } = await params;
  const locale: Locale = isLocale(localeParam) ? localeParam : "ru";
  const name = siteName(locale);

  return createPageMetadata({
    title: locale === "he" ? `תמונות, סרטונים וביקורות | ${name}` : `Фото, видео и отзывы | ${name}`,
    description:
      locale === "he"
        ? "הגלריה של מישניה: תמונות אמיתיות מימי הולדת, סרטוני מופעים וביקורות הורים. דירוג 5.0 לפי 783 ביקורות, אירועים בכל הארץ."
        : "Галерея Мишани: реальные фото детских праздников, видео шоу-программ и отзывы родителей. 5,0 по 783 отзывам, праздники по всему Израилю.",
    path: `/${locale}/gallery`,
    canonicalPath: `/${locale}/gallery`,
    locale,
  });
}

export default async function LocalizedGalleryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeParam } = await params;
  const locale: Locale = isLocale(localeParam) ? localeParam : "ru";
  return <GalleryContent locale={locale} />;
}
