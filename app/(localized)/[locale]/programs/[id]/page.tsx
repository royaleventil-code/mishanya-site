import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, Clock, Users } from "lucide-react";
import { PROGRAMS } from "@/data/programs";
import { BidiText } from "@/components/BidiText";
import { PublicFooter } from "@/components/PublicFooter";
import { PublicHeader } from "@/components/PublicHeader";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale, localePath, type Locale } from "@/lib/i18n";
import { getLocalizedProgramById, hasProgramCopy } from "@/lib/localized-data";
import { formatShekelPrice, formatProgramPriceLabel, hasStartingPrice } from "@/lib/prices";
import { SEGMENTS } from "@/lib/segments";
import { createPageMetadata, siteUrl } from "@/lib/seo";
import { getWhatsAppMessages, whatsappLink } from "@/lib/whatsapp";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

// HE-страницы генерируем только для переведённых программ,
// иначе под /he оказался бы русский контент.
export function generateStaticParams({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : "ru";
  return PROGRAMS.filter((program) => hasProgramCopy(locale, program.id)).map((program) => ({
    id: program.id,
  }));
}

// Уточнения для программ с одинаковым названием (иначе дубли title)
const TITLE_DISAMBIGUATION: Record<string, Record<Locale, string>> = {
  "paw-patrol-toddler-boys": { ru: " для мальчиков", he: " לבנים" },
  "paw-patrol-toddler-girls": { ru: " для девочек", he: " לבנות" },
};

function programDescription(locale: Locale, title: string, tagline: string | undefined, durationLabel: string, priceLabel: string): string {
  if (locale === "he") {
    return `"${title}" — תוכנית יום הולדת לילדים מבית מישניה בארץ הפלאות. ${tagline ? `${tagline}. ` : ""}${durationLabel}, ${priceLabel}. דמויות, מופעים והזמנה מהירה ב־WhatsApp.`;
  }
  return `«${title}» — программа детского праздника от Мишани. ${tagline ? `${tagline}. ` : ""}${durationLabel}, ${priceLabel}. Герои, шоу и быстрый заказ в WhatsApp.`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: localeParam, id } = await params;
  const locale: Locale = isLocale(localeParam) ? localeParam : "ru";
  const program = getLocalizedProgramById(locale, id);
  const dict = getDictionary(locale);

  if (!program || !hasProgramCopy(locale, id)) {
    return { title: `${dict.common.allProgramsTitle} | ${dict.brand.name}` };
  }

  const priceLabel = formatProgramPriceLabel(program.id, program.priceFrom, locale);
  const titleSuffix = TITLE_DISAMBIGUATION[program.id]?.[locale] ?? "";
  const metadata = createPageMetadata({
    title: `${program.title}${titleSuffix} — ${locale === "he" ? "תוכנית יום הולדת" : "программа детского праздника"} | ${dict.brand.name}`,
    description: programDescription(locale, program.title, program.tagline, program.durationLabel, priceLabel),
    path: `/${locale}/programs/${program.id}`,
    canonicalPath: `/${locale}/programs/${program.id}`,
    image: program.cover,
    locale,
  });

  // У 14 программ нет иврита — на них hreflang he не ставим
  if (!hasProgramCopy("he", id)) {
    metadata.alternates = {
      canonical: `/${locale}/programs/${program.id}`,
      languages: {
        ru: `/ru/programs/${program.id}`,
        "x-default": `/ru/programs/${program.id}`,
      },
    };
  }

  return metadata;
}

function programJsonLd(locale: Locale, program: NonNullable<ReturnType<typeof getLocalizedProgramById>>) {
  const dict = getDictionary(locale);
  const pageUrl = siteUrl(`/${locale}/programs/${program.id}`);

  return [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      "@id": `${pageUrl}#product`,
      name: program.title,
      description:
        program.tagline ??
        programDescription(
          locale,
          program.title,
          program.tagline,
          program.durationLabel,
          formatProgramPriceLabel(program.id, program.priceFrom, locale),
        ),
      image: program.cover ? siteUrl(program.cover) : undefined,
      url: pageUrl,
      brand: {
        "@type": "Brand",
        name: dict.brand.name,
      },
      offers: {
        "@type": "Offer",
        price: program.priceFrom,
        priceCurrency: "ILS",
        availability: "https://schema.org/InStock",
        url: pageUrl,
        seller: { "@id": siteUrl("/#organization") },
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: dict.common.home,
          item: siteUrl(`/${locale}`),
        },
        {
          "@type": "ListItem",
          position: 2,
          name: dict.common.allPrograms,
          item: siteUrl(`/${locale}/all`),
        },
        {
          "@type": "ListItem",
          position: 3,
          name: program.title,
          item: pageUrl,
        },
      ],
    },
  ];
}

export default async function LocalizedProgramPage({ params }: Props) {
  const { locale: localeParam, id } = await params;
  const locale: Locale = isLocale(localeParam) ? localeParam : "ru";
  const program = getLocalizedProgramById(locale, id);
  if (!program || !hasProgramCopy(locale, id)) notFound();

  const dict = getDictionary(locale);
  const accent = SEGMENTS.all.accent;
  const waMessages = getWhatsAppMessages(locale);
  const indoorOnly = program.locations.length === 1 && program.locations[0] === "indoor";
  const includes = [...program.includes, ...(program.bundled ?? [])];
  const priceLabel = formatProgramPriceLabel(program.id, program.priceFrom, locale);
  const waHref = whatsappLink(
    waMessages.program(program.title, program.durationLabel, program.priceFrom, program.id),
  );
  // экранируем «<»: текст программы с "</script>" не должен ломать inline-скрипт
  const jsonLd = JSON.stringify(programJsonLd(locale, program)).replace(/</g, "\\u003c");

  return (
    <main id="main" className="min-h-screen bg-[#fffaf4] text-[var(--color-ink)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />
      <PublicHeader
        locale={locale}
        // у непереведённых программ нет HE-зеркала — переключатель ведёт в HE-каталог
        langHrefOverrides={hasProgramCopy("he", id) ? undefined : { he: "/he/all" }}
      />

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
            <li>
              <Link
                href={localePath(locale, "/all")}
                className="underline-offset-4 transition hover:underline"
              >
                {dict.common.allPrograms}
              </Link>
            </li>
            <li aria-hidden>·</li>
            <li className="font-semibold text-[var(--color-ink)]">
              <BidiText locale={locale}>{program.title}</BidiText>
            </li>
          </ol>
        </nav>

        <article className="mt-4 overflow-hidden rounded-[28px] bg-white shadow-[0_16px_40px_rgba(15,15,20,0.06)]">
          {/* Cover */}
          <div
            className="relative flex aspect-[4/3] items-center justify-center overflow-hidden sm:aspect-[16/9]"
            style={
              program.cover
                ? { background: "white" }
                : { background: "linear-gradient(135deg, rgba(255,255,255,0.92), rgba(244,242,238,0.78))" }
            }
          >
            {program.cover ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={program.cover}
                alt={program.title}
                className="h-full w-full object-cover"
                style={{ objectPosition: "center 30%" }}
              />
            ) : (
              <span className="text-8xl" style={{ filter: "drop-shadow(0 10px 28px rgba(15,15,20,0.12))" }}>
                {program.emoji}
              </span>
            )}
          </div>

          <div className="p-5 sm:p-7">
            <h1 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
              <BidiText locale={locale}>{program.title}</BidiText>
            </h1>
            {program.tagline && (
              <p className="mt-1 text-center text-sm text-[var(--color-ink-soft)]">
                <BidiText locale={locale}>{program.tagline}</BidiText>
              </p>
            )}

            {(program.ruOnly || indoorOnly) && (
              <div className="mt-2 space-y-1 text-center text-xs font-semibold text-amber-600">
                {program.ruOnly && <p>{dict.catalog.labels.ruOnlyNotice}</p>}
                {indoorOnly && <p>{dict.catalog.labels.indoorNotice}</p>}
              </div>
            )}

            {/* Stat chips */}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-[var(--color-ink-soft)]">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4" strokeWidth={2.2} />
                <BidiText locale={locale}>{program.durationLabel}</BidiText>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-4 w-4" strokeWidth={2.2} />
                <BidiText locale={locale}>{program.animatorsLabel ?? `${program.animators}`}</BidiText>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-4 w-4" strokeWidth={2.2} />
                <BidiText locale={locale}>
                  {program.maxKids === null
                    ? dict.catalog.labels.unlimitedKids
                    : dict.catalog.labels.upToKids(program.maxKids)}
                </BidiText>
              </span>
            </div>

            {/* Price */}
            <div className="apple-glass mx-auto mt-5 w-fit rounded-2xl px-6 py-4 text-center">
              <div className="text-xs font-medium uppercase tracking-wider text-[var(--color-ink-soft)]">
                {hasStartingPrice(program.id) ? dict.catalog.labels.priceFrom : dict.catalog.labels.price}
              </div>
              <div className="mt-1 text-3xl font-bold tabular-nums tracking-tight" dir="ltr">
                {formatShekelPrice(program.priceFrom, locale)}
              </div>
              <p className="mx-auto mt-1 max-w-[320px] text-xs font-medium leading-snug text-[var(--color-muted)]">
                {dict.catalog.labels.priceCityNote}
              </p>
            </div>

            {program.note && (
              <div className="mt-4 rounded-2xl p-4 text-sm" style={{ background: `${accent}14` }}>
                <span className="font-medium">{dict.catalog.labels.important}</span>{" "}
                <BidiText locale={locale}>{program.note}</BidiText>
              </div>
            )}

            {/* Includes */}
            <div className="mt-7">
              <h2 className="mb-3 px-1 text-base font-semibold">{dict.catalog.labels.includes}</h2>
              {program.includesHighlight && (
                <div className="apple-glass mb-3 rounded-2xl px-4 py-3 text-[15px] font-semibold">
                  <BidiText locale={locale}>{program.includesHighlight}</BidiText>
                </div>
              )}
              <ul
                className="overflow-hidden rounded-2xl"
                style={{ background: "rgba(255,255,255,0.55)", border: "1px solid rgba(0,0,0,0.06)" }}
              >
                {includes.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 px-4 py-3 text-[15px]"
                    style={{ borderTop: i === 0 ? "none" : "0.5px solid rgba(0,0,0,0.08)" }}
                  >
                    <Check className="mt-0.5 h-[18px] w-[18px] shrink-0" strokeWidth={2.5} style={{ color: accent }} />
                    <span className="leading-snug">
                      <BidiText locale={locale}>{item}</BidiText>
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {program.bonus && (
              <div className="mt-5 rounded-2xl p-4 text-sm" style={{ background: `${accent}14` }}>
                <span className="font-medium">{dict.catalog.labels.bonus}</span>{" "}
                <BidiText locale={locale}>{program.bonus}</BidiText>
              </div>
            )}

            {/* CTA */}
            <div className="mt-8 text-center">
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="cta-glow inline-flex items-center gap-2 rounded-full bg-[var(--color-whatsapp)] px-7 py-4 text-base font-black text-white transition active:scale-95"
                style={{ ["--cta-glow-color" as unknown as string]: "rgba(37,211,102,0.45)" }}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden>
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                </svg>
                <BidiText locale={locale}>
                  {dict.catalog.labels.writeAboutProgram(program.title, priceLabel)}
                </BidiText>
              </a>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm font-semibold">
                <Link
                  href={`${localePath(locale, "/all")}?program=${encodeURIComponent(program.id)}`}
                  className="text-[var(--color-ink)] underline-offset-4 hover:underline"
                >
                  {dict.common.openInCatalog}
                </Link>
                <Link
                  href={localePath(locale, "/all")}
                  className="text-[var(--color-ink-soft)] underline-offset-4 hover:underline"
                >
                  {dict.common.allProgramsTitle}
                </Link>
              </div>
            </div>
          </div>
        </article>
      </div>

      <PublicFooter locale={locale} />
    </main>
  );
}
