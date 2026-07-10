import type { Metadata } from "next";
import { HomePage } from "@/components/home/HomePage";
import { createPageMetadata, HOME_WHATSAPP_PREVIEW_IMAGE, SITE_NAME } from "@/lib/seo";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale, type Locale } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale: Locale = isLocale(localeParam) ? localeParam : "ru";
  const dict = getDictionary(locale);

  return createPageMetadata({
    title:
      locale === "he"
        ? `${dict.brand.name} - הפעלות וימי הולדת לילדים בישראל`
        : `${SITE_NAME} - аниматоры и детские праздники в Израиле`,
    description: dict.brand.siteDescription,
    path: `/${locale}`,
    canonicalPath: `/${locale}`,
    image: HOME_WHATSAPP_PREVIEW_IMAGE,
    imageHeight: 1200,
    locale,
  });
}

export default async function LocalizedHomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale: Locale = isLocale(localeParam) ? localeParam : "ru";
  return <HomePage locale={locale} />;
}
