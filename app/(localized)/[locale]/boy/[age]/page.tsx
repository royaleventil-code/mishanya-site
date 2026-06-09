import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SegmentPage } from "@/components/SegmentPage";
import { createAgeProgramsMetadata } from "@/lib/seo";
import { heroTitle, segmentFromAge } from "@/lib/segments";
import { isLocale, type Locale } from "@/lib/i18n";

export function generateStaticParams() {
  return Array.from({ length: 10 }, (_, index) => ({ age: String(index + 1) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; age: string }>;
}): Promise<Metadata> {
  const { locale: localeParam, age } = await params;
  const locale: Locale = isLocale(localeParam) ? localeParam : "ru";
  const ageNum = Number.parseInt(age, 10);
  if (!Number.isFinite(ageNum) || ageNum < 1 || ageNum > 10) {
    return {
      title:
        locale === "he"
          ? "תוכניות יום הולדת לבנים | מישניה בארץ הפלאות"
          : "Программы для мальчиков | Мишаня в Стране Чудес",
    };
  }

  return createAgeProgramsMetadata({
    gender: "boy",
    age: ageNum,
    path: `/${locale}/boy/${ageNum}`,
    locale,
  });
}

export default async function LocalizedBoyAgePage({
  params,
}: {
  params: Promise<{ locale: string; age: string }>;
}) {
  const { locale: localeParam, age } = await params;
  const locale: Locale = isLocale(localeParam) ? localeParam : "ru";
  const ageNum = Number.parseInt(age, 10);
  if (!Number.isFinite(ageNum) || ageNum < 1 || ageNum > 10) notFound();

  const segment = segmentFromAge(ageNum, "boy");
  return (
    <SegmentPage
      locale={locale}
      segment={segment}
      title={heroTitle(segment, ageNum, "boy", locale)}
      audience={{ gender: "boy", age: ageNum }}
    />
  );
}
