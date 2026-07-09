import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clapperboard } from "lucide-react";
import { VIDEOS, VIDEOS_PAGE_COPY, YOUTUBE_CHANNEL_URL } from "@/data/videos";
import { BidiText } from "@/components/BidiText";
import { LiteYouTube } from "@/components/LiteYouTube";
import { PublicFooter } from "@/components/PublicFooter";
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
  const copy = VIDEOS_PAGE_COPY[locale];

  if (!copy.h1) {
    return { title: getDictionary(locale).brand.name };
  }

  return createPageMetadata({
    title: copy.seoTitle,
    description: copy.seoDescription,
    path: `/${locale}/videos`,
    canonicalPath: `/${locale}/videos`,
    locale,
  });
}

function videosJsonLd(locale: Locale) {
  const dict = getDictionary(locale);
  const copy = VIDEOS_PAGE_COPY[locale];
  const pageUrl = siteUrl(`/${locale}/videos`);

  return [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: dict.common.home, item: siteUrl(`/${locale}`) },
        { "@type": "ListItem", position: 2, name: copy.breadcrumb, item: pageUrl },
      ],
    },
    ...VIDEOS.slice(0, 6).map((video) => ({
      "@context": "https://schema.org",
      "@type": "VideoObject",
      name: video.title,
      uploadDate: video.uploadDate,
      thumbnailUrl: `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`,
      embedUrl: `https://www.youtube-nocookie.com/embed/${video.videoId}`,
    })),
  ];
}

export default async function VideosPage({ params }: Props) {
  const { locale: localeParam } = await params;
  const locale: Locale = isLocale(localeParam) ? localeParam : "ru";
  const copy = VIDEOS_PAGE_COPY[locale];
  // Иврит ещё не прошёл контент-пайплайн — страница есть только на русском
  if (!copy.h1) notFound();

  const dict = getDictionary(locale);
  // экранируем «<»: текст с "</script>" не должен ломать inline-скрипт
  const jsonLd = JSON.stringify(videosJsonLd(locale)).replace(/</g, "\\u003c");

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
            <Clapperboard className="h-4 w-4" strokeWidth={2.2} />
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

          {/* Сетка роликов */}
          <section className="mt-8">
            <h2 className="mb-3 text-base font-semibold">
              <BidiText locale={locale}>{copy.gridTitle}</BidiText>
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {VIDEOS.map((video) => (
                <figure
                  key={video.videoId}
                  className="rounded-2xl p-3"
                  style={{ background: "rgba(255,255,255,0.55)", border: "1px solid rgba(0,0,0,0.06)" }}
                >
                  <LiteYouTube videoId={video.videoId} title={video.title} />
                  <figcaption className="mt-2">
                    <p className="text-sm font-semibold leading-snug">{video.title}</p>
                    {video.caption[locale] && (
                      <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                        <BidiText locale={locale}>{video.caption[locale]}</BidiText>
                      </p>
                    )}
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>

          {/* Канал на YouTube */}
          <section className="mt-8 text-center">
            <h2 className="text-base font-semibold">
              <BidiText locale={locale}>{copy.channelTitle}</BidiText>
            </h2>
            <p className="mx-auto mt-1 max-w-md text-sm text-[var(--color-ink-soft)]">
              <BidiText locale={locale}>{copy.channelText}</BidiText>
            </p>
            <a
              href={YOUTUBE_CHANNEL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="cta-glow mt-4 inline-flex items-center gap-2 rounded-full bg-[#e62117] px-7 py-4 text-base font-black text-white transition active:scale-95"
              style={{ ["--cta-glow-color" as unknown as string]: "rgba(230,33,23,0.4)" }}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden>
                <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.3 31.3 0 0 0 0 12a31.3 31.3 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.3 31.3 0 0 0 24 12a31.3 31.3 0 0 0-.5-5.8ZM9.6 15.6V8.4L15.8 12l-6.2 3.6Z" />
              </svg>
              <BidiText locale={locale}>{copy.channelCta}</BidiText>
            </a>
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

          {/* Смотрите также */}
          <section className="mt-8 border-t border-black/5 pt-5">
            <h2 className="text-sm font-semibold text-[var(--color-ink-soft)]">
              <BidiText locale={locale}>{copy.seeAlsoTitle}</BidiText>
            </h2>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-sm font-semibold">
              <Link
                href={localePath(locale, "/all")}
                className="text-[var(--color-ink)] underline-offset-4 transition hover:underline"
              >
                <BidiText locale={locale}>{copy.seeAlsoPrograms}</BidiText>
              </Link>
              <Link
                href={localePath(locale, "/shows")}
                className="text-[var(--color-ink)] underline-offset-4 transition hover:underline"
              >
                <BidiText locale={locale}>{copy.seeAlsoShows}</BidiText>
              </Link>
            </div>
          </section>
        </article>
      </div>

      <PublicFooter locale={locale} />
    </main>
  );
}
