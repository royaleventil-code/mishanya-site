import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Flame,
  GraduationCap,
  PartyPopper,
  Snowflake,
  Sparkles,
  Sun,
  VenetianMask,
  type LucideIcon,
} from "lucide-react";
import { HOLIDAYS, getHolidayById, hasHolidayCopy } from "@/data/holidays";
import { PROGRAMS } from "@/data/programs";
import { BidiText } from "@/components/BidiText";
import { SiteFooter } from "@/components/home/SiteFooter";
import { ProgramCatalogCard } from "@/components/ProgramCatalogCard";
import { PublicHeader } from "@/components/PublicHeader";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale, localePath, type Locale } from "@/lib/i18n";
import { getLocalizedProgramById } from "@/lib/localized-data";
import { createPageMetadata, siteUrl } from "@/lib/seo";
import { whatsappLink } from "@/lib/whatsapp";

type Props = {
  params: Promise<{ locale: string; holiday: string }>;
};

// Иконка по смыслу праздника (lucide)
const HOLIDAY_ICONS: Record<string, LucideIcon> = {
  hanukkah: Flame,
  purim: VenetianMask,
  summer: Sun,
  "gan-graduation": GraduationCap,
  "new-year": Snowflake,
};

const OTHER_HOLIDAYS_TITLE: Record<Locale, string> = {
  ru: "Другие сезонные праздники",
  he: "עוד חגים ואירועים עונתיים",
};

export function generateStaticParams({ params }: { params: { locale: string } }) {
  // he-страницы без готового перевода не генерируем (static export)
  const locale: Locale = isLocale(params.locale) ? params.locale : "ru";
  return HOLIDAYS.filter((holiday) => hasHolidayCopy(locale, holiday.id)).map((holiday) => ({
    holiday: holiday.id,
  }));
}

function holidayWhatsAppMessage(locale: Locale, forHoliday: string): string {
  if (locale === "he") {
    return [`שלום! אני רוצה חגיגה לילדים ${forHoliday}.`, "אשמח לעזרה בבחירת תוכנית"].join("\n");
  }
  return [`Здравствуйте! Хочу детский праздник ${forHoliday}.`, "Помогите подобрать программу"].join("\n");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: localeParam, holiday: holidayId } = await params;
  const locale: Locale = isLocale(localeParam) ? localeParam : "ru";
  const holiday = getHolidayById(holidayId);
  const dict = getDictionary(locale);

  if (!holiday || !hasHolidayCopy(locale, holiday.id)) {
    return { title: dict.brand.name };
  }

  const copy = holiday.copy[locale];
  return createPageMetadata({
    title: copy.seoTitle,
    description: copy.seoDescription,
    path: `/${locale}/holiday/${holiday.id}`,
    canonicalPath: `/${locale}/holiday/${holiday.id}`,
    locale,
  });
}

function holidayJsonLd(locale: Locale, holiday: NonNullable<ReturnType<typeof getHolidayById>>) {
  const dict = getDictionary(locale);
  const copy = holiday.copy[locale];
  const pageUrl = siteUrl(`/${locale}/holiday/${holiday.id}`);

  return [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      "@id": `${pageUrl}#service`,
      name: copy.h1,
      serviceType: locale === "he" ? "הפעלות לילדים וימי הולדת" : "Детские праздники и аниматоры",
      description: copy.seoDescription,
      url: pageUrl,
      provider: { "@id": siteUrl("/#organization") },
      areaServed: { "@type": "Country", name: locale === "he" ? "ישראל" : "Израиль" },
      offers: {
        "@type": "Offer",
        price: 1300,
        priceCurrency: "ILS",
        url: pageUrl,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: dict.common.home, item: siteUrl(`/${locale}`) },
        { "@type": "ListItem", position: 2, name: copy.name, item: pageUrl },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: copy.faq.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
  ];
}

export default async function HolidayPage({ params }: Props) {
  const { locale: localeParam, holiday: holidayId } = await params;
  const locale: Locale = isLocale(localeParam) ? localeParam : "ru";
  const holiday = getHolidayById(holidayId);
  if (!holiday || !hasHolidayCopy(locale, holiday.id)) notFound();

  const dict = getDictionary(locale);
  const copy = holiday.copy[locale];
  const HolidayIcon = HOLIDAY_ICONS[holiday.id] ?? PartyPopper;
  const programs = holiday.programIds
    .map((id) => getLocalizedProgramById(locale, id))
    .filter((program): program is NonNullable<typeof program> => Boolean(program));
  const otherHolidays = HOLIDAYS.filter(
    (item) => item.id !== holiday.id && hasHolidayCopy(locale, item.id),
  );
  const waHref = whatsappLink(holidayWhatsAppMessage(locale, copy.forHoliday));
  // экранируем «<»: текст с "</script>" не должен ломать inline-скрипт
  const jsonLd = JSON.stringify(holidayJsonLd(locale, holiday)).replace(/</g, "\\u003c");

  return (
    <main id="main" className="min-h-screen bg-[#fffaf4] text-[var(--color-ink)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <PublicHeader locale={locale} />

      <div className="mx-auto max-w-3xl px-5 pb-20 pt-6 sm:px-6">
        {/* Breadcrumbs */}
        <nav aria-label="breadcrumbs" className="text-xs text-[var(--color-ink-soft)]">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href={localePath(locale)} className="underline-offset-4 transition hover:underline">
                {dict.common.home}
              </Link>
            </li>
            <li aria-hidden>·</li>
            <li className="font-semibold text-[var(--color-ink)]">
              <BidiText locale={locale}>{copy.name}</BidiText>
            </li>
          </ol>
        </nav>

        <article className="mt-4 overflow-hidden rounded-[28px] bg-white p-5 shadow-[0_16px_40px_rgba(15,15,20,0.06)] sm:p-7">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-ink-soft)]">
            <HolidayIcon className="h-4 w-4" strokeWidth={2.2} />
            <BidiText locale={locale}>{copy.name}</BidiText>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            <BidiText locale={locale}>{copy.h1}</BidiText>
          </h1>

          {/* Видимая пометка (new-year: для русскоязычных семей) */}
          {copy.badge && (
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-black/5 bg-[#fffaf4] px-3.5 py-1.5 text-[13px] font-semibold text-[var(--color-ink-soft)]">
              <Sparkles className="h-3.5 w-3.5 shrink-0" strokeWidth={2.2} aria-hidden />
              <BidiText locale={locale}>{copy.badge}</BidiText>
            </p>
          )}

          <div className="mt-4 space-y-3 text-[15px] leading-relaxed text-[var(--color-ink-soft)]">
            {copy.intro.map((paragraph, index) => (
              <p key={index}>
                <BidiText locale={locale}>{paragraph}</BidiText>
              </p>
            ))}
          </div>

          {/* Программы */}
          <section className="mt-8">
            <h2 className="mb-3 text-base font-semibold">{dict.city.programsTitle}</h2>
            <ul className="grid gap-4 sm:grid-cols-2">
              {programs.map((program) => (
                <li key={program.id}>
                  <ProgramCatalogCard locale={locale} program={program} />
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-[var(--color-muted)]">
              <BidiText locale={locale}>{dict.city.programsNote(PROGRAMS.length)}</BidiText>{" "}
              <Link
                href={localePath(locale, "/all")}
                className="font-semibold text-[var(--color-ink)] underline-offset-4 hover:underline"
              >
                {dict.common.allPrograms}
              </Link>
            </p>
          </section>

          {/* FAQ */}
          <section className="mt-8">
            <h2 className="mb-3 text-base font-semibold">{dict.city.faqTitle}</h2>
            <ul
              className="overflow-hidden rounded-2xl"
              style={{ background: "rgba(255,255,255,0.55)", border: "1px solid rgba(0,0,0,0.06)" }}
            >
              {copy.faq.map((item, index) => (
                <li
                  key={index}
                  className="px-4 py-3"
                  style={{ borderTop: index === 0 ? "none" : "0.5px solid rgba(0,0,0,0.08)" }}
                >
                  <h3 className="text-[15px] font-semibold leading-snug">
                    <BidiText locale={locale}>{item.q}</BidiText>
                  </h3>
                  <p className="mt-1 text-[15px] leading-snug text-[var(--color-ink-soft)]">
                    <BidiText locale={locale}>{item.a}</BidiText>
                  </p>
                </li>
              ))}
            </ul>
          </section>

          {/* CTA */}
          <div className="mt-8 text-center">
            <p className="mx-auto max-w-md text-sm text-[var(--color-ink-soft)]">
              <BidiText locale={locale}>{dict.city.ctaTitle}</BidiText>
            </p>
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="cta-glow mt-4 inline-flex items-center gap-2 rounded-full bg-[var(--color-whatsapp)] px-7 py-4 text-base font-black text-white transition active:scale-95"
              style={{ ["--cta-glow-color" as unknown as string]: "rgba(37,211,102,0.45)" }}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden>
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
              </svg>
              <BidiText locale={locale}>{dict.city.ctaButton(copy.forHoliday)}</BidiText>
            </a>
          </div>

          {/* Другие праздники */}
          {otherHolidays.length > 0 && (
            <section className="mt-8 border-t border-black/5 pt-5">
              <h2 className="text-sm font-semibold text-[var(--color-ink-soft)]">
                {OTHER_HOLIDAYS_TITLE[locale]}
              </h2>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-sm font-semibold">
                {otherHolidays.map((item) => (
                  <Link
                    key={item.id}
                    href={localePath(locale, `/holiday/${item.id}`)}
                    className="text-[var(--color-ink)] underline-offset-4 transition hover:underline"
                  >
                    <BidiText locale={locale}>{item.copy[locale].name}</BidiText>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </article>
      </div>

      <SiteFooter locale={locale} />
    </main>
  );
}
