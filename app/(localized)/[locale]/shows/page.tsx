import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Theater } from "lucide-react";
import { SHOWS, SHOWS_PAGE_COPY } from "@/data/shows";
import { BidiText } from "@/components/BidiText";
import { EmphasisText } from "@/components/EmphasisText";
import { accentAt, mirrorAngle } from "@/components/AccentPalette";
import { SiteFooter } from "@/components/home/SiteFooter";
import { LiteYouTube } from "@/components/LiteYouTube";
import { PublicHeader } from "@/components/PublicHeader";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale, localePath, type Locale } from "@/lib/i18n";
import { createPageMetadata, siteUrl } from "@/lib/seo";
import { whatsappLink } from "@/lib/whatsapp";

type Props = {
  params: Promise<{ locale: string }>;
};

const CASE_PHOTO = { src: "/city/krayot-3.webp", width: 1200, height: 1600 };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale: Locale = isLocale(localeParam) ? localeParam : "ru";
  const copy = SHOWS_PAGE_COPY[locale];

  if (!copy.h1) {
    return { title: getDictionary(locale).brand.name };
  }

  return createPageMetadata({
    title: copy.seoTitle,
    description: copy.seoDescription,
    path: `/${locale}/shows`,
    canonicalPath: `/${locale}/shows`,
    locale,
  });
}

function showsJsonLd(locale: Locale) {
  const dict = getDictionary(locale);
  const copy = SHOWS_PAGE_COPY[locale];
  const pageUrl = siteUrl(`/${locale}/shows`);

  return [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      "@id": `${pageUrl}#service`,
      name: copy.h1,
      serviceType: locale === "he" ? "הצגות ומופעים לילדים" : "Авторские спектакли и эстрадные шоу",
      description: copy.seoDescription,
      url: pageUrl,
      provider: { "@id": siteUrl("/#organization") },
      areaServed: { "@type": "Country", name: locale === "he" ? "ישראל" : "Израиль" },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: dict.common.home, item: siteUrl(`/${locale}`) },
        { "@type": "ListItem", position: 2, name: copy.breadcrumb, item: pageUrl },
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
    ...SHOWS.map((show) => {
      const showCopy = show.copy[locale];
      return {
        "@context": "https://schema.org",
        "@type": "VideoObject",
        name: showCopy.title,
        description: showCopy.tagline,
        uploadDate: show.uploadDate,
        embedUrl: `https://www.youtube-nocookie.com/embed/${show.videoId}`,
        thumbnailUrl: `https://i.ytimg.com/vi/${show.videoId}/hqdefault.jpg`,
      };
    }),
  ];
}

export default async function ShowsPage({ params }: Props) {
  const { locale: localeParam } = await params;
  const locale: Locale = isLocale(localeParam) ? localeParam : "ru";
  const copy = SHOWS_PAGE_COPY[locale];
  // Иврит ещё не прошёл контент-пайплайн - страница есть только на русском
  if (!copy.h1) notFound();

  const dict = getDictionary(locale);
  const waHref = whatsappLink(copy.waMessage);
  const cardAngle = mirrorAngle(158, locale);
  // экранируем «<»: текст с "</script>" не должен ломать inline-скрипт
  const jsonLd = JSON.stringify(showsJsonLd(locale)).replace(/</g, "\\u003c");

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
              <BidiText locale={locale}>{copy.breadcrumb}</BidiText>
            </li>
          </ol>
        </nav>

        <article className="mt-4 overflow-hidden rounded-[28px] bg-white p-5 shadow-[0_16px_40px_rgba(15,15,20,0.06)] sm:p-7">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-ink-soft)]">
            <Theater className="h-4 w-4" strokeWidth={2.2} />
            <BidiText locale={locale}>{copy.breadcrumb}</BidiText>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            <BidiText locale={locale}>{copy.h1}</BidiText>
          </h1>

          <div className="mt-4 space-y-3 text-[15px] leading-relaxed text-[var(--color-ink-soft)]">
            {copy.intro.map((paragraph, index) => (
              // первый абзац - лид: крупнее остальных, чтобы взгляд зацепился
              <p key={index} className={index === 0 ? "text-[17px] leading-relaxed" : undefined}>
                <EmphasisText locale={locale}>{paragraph}</EmphasisText>
              </p>
            ))}
          </div>

          {/* Три аудитории с отдельными CTA */}
          <section className="mt-8">
            <h2 className="mb-3 text-base font-semibold">
              <BidiText locale={locale}>{copy.audiencesTitle}</BidiText>
            </h2>
            <ul className="grid gap-4 sm:grid-cols-3">
              {copy.audiences.map((item, audienceIndex) => (
                <li
                  key={item.title}
                  className="relative flex flex-col overflow-hidden rounded-[26px] border border-white/70 p-5 ring-1 ring-white/70 shadow-[0_18px_44px_rgba(15,15,20,0.09)] transition-transform duration-500 hover:-translate-y-1"
                  style={{
                    background: `linear-gradient(${cardAngle}deg, ${accentAt(audienceIndex)}14 0%, #ffffff 60%)`,
                  }}
                >
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 top-0 h-1.5"
                    style={{ background: accentAt(audienceIndex) }}
                  />
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full blur-2xl"
                    style={{ background: `${accentAt(audienceIndex)}29` }}
                  />
                  <h3 className="relative text-base font-bold leading-snug">
                    <BidiText locale={locale}>{item.title}</BidiText>
                  </h3>
                  <p className="mt-1 text-sm leading-snug text-[var(--color-ink-soft)]">
                    <BidiText locale={locale}>{item.text}</BidiText>
                  </p>
                  {item.linkHref && item.linkLabel && (
                    <p className="relative mt-2 text-sm">
                      <Link
                        href={localePath(locale, item.linkHref)}
                        className="font-semibold text-[var(--color-ink)] underline-offset-4 hover:underline"
                      >
                        <BidiText locale={locale}>{item.linkLabel}</BidiText>
                      </Link>
                    </p>
                  )}
                  {/* mt-auto прижимает кнопку к низу: у карточек разный объём текста,
                      без этого кнопки в ряду стоят на разной высоте */}
                  <span className="relative mt-auto block pt-4">
                    <a
                      href={whatsappLink(item.waMessage)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-full items-center justify-center rounded-full bg-[var(--color-whatsapp)] px-4 py-2.5 text-sm font-bold text-white shadow-[0_10px_22px_rgba(37,211,102,0.35)] transition active:scale-95"
                    >
                      <BidiText locale={locale}>{item.ctaLabel}</BidiText>
                    </a>
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* Репертуар */}
          <section className="mt-8">
            <h2 className="mb-3 text-base font-semibold">
              <BidiText locale={locale}>{copy.repertoireTitle}</BidiText>
            </h2>
            <div className="space-y-5">
              {SHOWS.map((show, showIndex) => {
                const showCopy = show.copy[locale];
                if (!showCopy.title) return null;
                return (
                  <section
                    key={show.id}
                    className="relative overflow-hidden rounded-[26px] border border-white/70 bg-white p-4 shadow-[0_14px_36px_rgba(15,15,20,0.08)] sm:p-5"
                  >
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-x-0 top-0 h-1.5"
                      style={{ background: accentAt(showIndex) }}
                    />
                    <h3 className="text-lg font-bold leading-snug">
                      <BidiText locale={locale}>{showCopy.title}</BidiText>
                    </h3>
                    <p className="mt-1 text-[15px] font-semibold leading-snug text-[var(--color-ink-soft)]">
                      <BidiText locale={locale}>{showCopy.tagline}</BidiText>
                    </p>
                    {(showCopy.duration || showCopy.audience) && (
                      <p className="mt-2 text-sm text-[var(--color-muted)]">
                        {showCopy.duration && (
                          <BidiText locale={locale}>{`${copy.durationLabel}: ${showCopy.duration}`}</BidiText>
                        )}
                        {showCopy.duration && showCopy.audience && <span aria-hidden> · </span>}
                        {showCopy.audience && (
                          <BidiText locale={locale}>{`${copy.audienceLabel}: ${showCopy.audience}`}</BidiText>
                        )}
                      </p>
                    )}
                    <div className="mt-4">
                      <LiteYouTube videoId={show.videoId} title={showCopy.title} />
                    </div>
                    <div className="mt-4 space-y-3 text-[15px] leading-relaxed text-[var(--color-ink-soft)]">
                      {showCopy.description.map((paragraph, index) => (
                        <p key={index}>
                          <BidiText locale={locale}>{paragraph}</BidiText>
                        </p>
                      ))}
                    </div>
                    <ul className="mt-4 space-y-2 text-[15px] leading-relaxed text-[var(--color-ink-soft)]">
                      {showCopy.highlights.map((item, index) => (
                        <li key={index} className="flex gap-2.5">
                          <span
                            aria-hidden
                            className="mt-[8px] h-1.5 w-1.5 shrink-0 rounded-full"
                            style={{ background: accentAt(showIndex) }}
                          />
                          <BidiText locale={locale}>{item}</BidiText>
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })}
            </div>
          </section>

          {/* Подтверждённые показы */}
          <section className="mt-8">
            <h2 className="mb-2 text-base font-semibold">
              <BidiText locale={locale}>{copy.casesTitle}</BidiText>
            </h2>
            <p className="text-[15px] leading-relaxed text-[var(--color-ink-soft)]">
              <BidiText locale={locale}>{copy.casesText}</BidiText>
            </p>
            <figure className="mt-4 max-w-xs">
              <Image
                src={CASE_PHOTO.src}
                alt={copy.photoAlt}
                width={CASE_PHOTO.width}
                height={CASE_PHOTO.height}
                sizes="(max-width: 640px) 80vw, 320px"
                className="w-full rounded-2xl object-cover"
                loading="lazy"
              />
              <figcaption className="mt-2 text-sm text-[var(--color-muted)]">
                <BidiText locale={locale}>{copy.photoCaption}</BidiText>
              </figcaption>
            </figure>
          </section>

          {/* FAQ */}
          <section className="mt-8">
            <h2 className="mb-3 text-base font-semibold">
              <BidiText locale={locale}>{copy.faqTitle}</BidiText>
            </h2>
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
              <BidiText locale={locale}>{copy.ctaTitle}</BidiText>
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
              <BidiText locale={locale}>{copy.ctaButton}</BidiText>
            </a>
          </div>

          {/* Смотрите также */}
          <section className="mt-8 border-t border-black/5 pt-5">
            <h2 className="text-sm font-semibold text-[var(--color-ink-soft)]">
              <BidiText locale={locale}>{copy.seeAlsoTitle}</BidiText>
            </h2>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-sm font-semibold">
              <Link
                href={localePath(locale, "/municipalities")}
                className="text-[var(--color-ink)] underline-offset-4 transition hover:underline"
              >
                <BidiText locale={locale}>{copy.seeAlsoMunicipalities}</BidiText>
              </Link>
              <Link
                href={localePath(locale, "/business")}
                className="text-[var(--color-ink)] underline-offset-4 transition hover:underline"
              >
                <BidiText locale={locale}>{copy.seeAlsoBusiness}</BidiText>
              </Link>
            </div>
          </section>
        </article>
      </div>

      <SiteFooter locale={locale} />
    </main>
  );
}
