import { QuestCatalogRedirect } from "@/components/quests/QuestCatalogRedirect";
import { QUEST_COPY } from "@/data/quests";
import { isLocale, type Locale } from "@/lib/i18n";
import { createPageMetadata, siteName } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeParam } = await params;
  const locale: Locale = isLocale(localeParam) ? localeParam : "ru";
  return createPageMetadata({
    title: `${QUEST_COPY[locale].title} | ${siteName(locale)}`,
    description: QUEST_COPY[locale].metadata,
    path: `/${locale}/quests`,
    canonicalPath: `/${locale}/all`,
    noIndex: true,
    locale,
  });
}

export default async function QuestsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeParam } = await params;
  const locale: Locale = isLocale(localeParam) ? localeParam : "ru";
  return <QuestCatalogRedirect locale={locale} />;
}
