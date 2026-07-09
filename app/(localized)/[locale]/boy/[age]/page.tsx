import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SegmentPage } from "@/components/SegmentPage";
import { getAgeGuide } from "@/data/age-guide";
import { getDictionary } from "@/lib/dictionaries";
import { createAgeProgramsMetadata, siteUrl } from "@/lib/seo";
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
  const ageGuide = getAgeGuide(locale, "boy", ageNum);
  const title = heroTitle(segment, ageNum, "boy", locale);
  // FAQPage по возрастному FAQ; «<» экранируем, чтобы текст не мог разорвать inline-скрипт
  const faqJsonLd = ageGuide
    ? JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: ageGuide.faq.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      }).replace(/</g, "\\u003c")
    : null;
  // BreadcrumbList: Главная → страница возраста (как на странице города)
  const breadcrumbJsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: getDictionary(locale).common.home,
        item: siteUrl(`/${locale}`),
      },
      { "@type": "ListItem", position: 2, name: title, item: siteUrl(`/${locale}/boy/${ageNum}`) },
    ],
  }).replace(/</g, "\\u003c");

  return (
    <>
      {faqJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: faqJsonLd }} />
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: breadcrumbJsonLd }} />
      <SegmentPage
        locale={locale}
        segment={segment}
        title={title}
        audience={{ gender: "boy", age: ageNum }}
        ageGuide={ageGuide}
      />
    </>
  );
}
