import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HeartHandshake } from "lucide-react";
import {
  CHARITY_LINKS,
  CHARITY_PAGE_COPY,
  CHARITY_PHOTOS,
  CHARITY_VIDEO_ID,
} from "@/data/charity";
import { BidiText } from "@/components/BidiText";
import { SiteFooter } from "@/components/home/SiteFooter";
import { LiteYouTube } from "@/components/LiteYouTube";
import { PublicHeader } from "@/components/PublicHeader";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale, localePath, type Locale } from "@/lib/i18n";
import { createPageMetadata, siteUrl } from "@/lib/seo";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale: Locale = isLocale(localeParam) ? localeParam : "ru";
  const copy = CHARITY_PAGE_COPY[locale];

  if (!copy.h1) {
    return { title: getDictionary(locale).brand.name };
  }

  return createPageMetadata({
    title: copy.seoTitle,
    description: copy.seoDescription,
    path: `/${locale}/charity`,
    canonicalPath: `/${locale}/charity`,
    image: CHARITY_PHOTOS[0].src,
    imageWidth: CHARITY_PHOTOS[0].width,
    imageHeight: CHARITY_PHOTOS[0].height,
    locale,
  });
}

function charityJsonLd(locale: Locale) {
  const dict = getDictionary(locale);
  const copy = CHARITY_PAGE_COPY[locale];
  const pageUrl = siteUrl(`/${locale}/charity`);

  return [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: dict.common.home, item: siteUrl(`/${locale}`) },
        { "@type": "ListItem", position: 2, name: copy.breadcrumb, item: pageUrl },
      ],
    },
  ];
}

export default async function CharityPage({ params }: Props) {
  const { locale: localeParam } = await params;
  const locale: Locale = isLocale(localeParam) ? localeParam : "ru";
  const copy = CHARITY_PAGE_COPY[locale];
  // Иврит ещё не прошёл контент-пайплайн — страница есть только на русском
  if (!copy.h1) notFound();

  const dict = getDictionary(locale);
  // экранируем «<»: текст с "</script>" не должен ломать inline-скрипт
  const jsonLd = JSON.stringify(charityJsonLd(locale)).replace(/</g, "\\u003c");

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
            <HeartHandshake className="h-4 w-4" strokeWidth={2.2} />
            <BidiText locale={locale}>{copy.breadcrumb}</BidiText>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            <BidiText locale={locale}>{copy.h1}</BidiText>
          </h1>

          <div className="mt-4 space-y-3 text-[15px] leading-relaxed text-[var(--color-ink-soft)]">
            {copy.intro.map((paragraph, index) => (
              <p key={index}>
                <BidiText locale={locale}>{paragraph}</BidiText>
              </p>
            ))}
          </div>

          {/* Чем занимается фонд */}
          <section className="mt-8">
            <h2 className="mb-3 text-base font-semibold">
              <BidiText locale={locale}>{copy.whatTitle}</BidiText>
            </h2>
            <ul className="space-y-2 text-[15px] leading-relaxed text-[var(--color-ink-soft)]">
              {copy.whatItems.map((item, index) => (
                <li key={index} className="flex gap-2">
                  <span
                    aria-hidden
                    className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-ink-soft)]"
                  />
                  <BidiText locale={locale}>{item}</BidiText>
                </li>
              ))}
            </ul>
          </section>

          {/* Наши праздники для подопечных фонда */}
          <section className="mt-8">
            <h2 className="mb-2 text-base font-semibold">
              <BidiText locale={locale}>{copy.eventsTitle}</BidiText>
            </h2>
            <div className="space-y-3 text-[15px] leading-relaxed text-[var(--color-ink-soft)]">
              {copy.eventsText.map((paragraph, index) => (
                <p key={index}>
                  <BidiText locale={locale}>{paragraph}</BidiText>
                </p>
              ))}
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {CHARITY_PHOTOS.map((photo, index) => {
                const photoCopy = copy.photos[index];
                if (!photoCopy) return null;
                return (
                  <figure key={photo.src}>
                    <Image
                      src={photo.src}
                      alt={photoCopy.alt}
                      width={photo.width}
                      height={photo.height}
                      sizes="(max-width: 640px) 90vw, 340px"
                      className="w-full rounded-2xl object-cover"
                      loading="lazy"
                    />
                    <figcaption className="mt-2 text-sm text-[var(--color-muted)]">
                      <BidiText locale={locale}>{photoCopy.caption}</BidiText>
                    </figcaption>
                  </figure>
                );
              })}
            </div>

            <div className="mt-4">
              <LiteYouTube videoId={CHARITY_VIDEO_ID} title={copy.videoTitle} />
            </div>
          </section>

          {/* Как помочь */}
          <section className="mt-8">
            <h2 className="mb-2 text-base font-semibold">
              <BidiText locale={locale}>{copy.helpTitle}</BidiText>
            </h2>
            <p className="text-[15px] leading-relaxed text-[var(--color-ink-soft)]">
              <BidiText locale={locale}>{copy.helpText}</BidiText>
            </p>
            <div className="mt-4 text-center">
              <a
                href={CHARITY_LINKS.site}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-[var(--color-ink)] px-7 py-3.5 text-base font-bold text-white transition active:scale-95"
              >
                <BidiText locale={locale}>{copy.helpCta}</BidiText>
              </a>
            </div>
            <p className="mt-4 text-center text-sm text-[var(--color-ink-soft)]">
              <BidiText locale={locale}>{copy.socialLabel}</BidiText>{" "}
              <a
                href={CHARITY_LINKS.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[var(--color-ink)] underline-offset-4 hover:underline"
              >
                Facebook
              </a>
              <span aria-hidden> · </span>
              <a
                href={CHARITY_LINKS.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[var(--color-ink)] underline-offset-4 hover:underline"
              >
                Instagram
              </a>
            </p>
          </section>
        </article>
      </div>

      <SiteFooter locale={locale} />
    </main>
  );
}
