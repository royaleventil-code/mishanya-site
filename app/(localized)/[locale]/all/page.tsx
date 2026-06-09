import { SegmentPage } from "@/components/SegmentPage";
import { createAllProgramsMetadata } from "@/lib/seo";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale, type Locale } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale: Locale = isLocale(localeParam) ? localeParam : "ru";
  return createAllProgramsMetadata(`/${locale}/all`, locale);
}

export default async function LocalizedAllPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale: Locale = isLocale(localeParam) ? localeParam : "ru";
  const dict = getDictionary(locale);
  return (
    <SegmentPage
      locale={locale}
      segment="all"
      title={`${dict.common.allPrograms} ${dict.brand.shortName}`}
    />
  );
}
