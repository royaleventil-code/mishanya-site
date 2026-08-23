import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Baby, Heart } from "lucide-react";
import { BRIT_MILA_MEDIA, BRIT_MILA_COPY, BRIT_MILA_OPTION_MEDIA } from "@/data/brit-mila";
import { BidiText } from "@/components/BidiText";
import { EmphasisText } from "@/components/EmphasisText";
import { LiteYouTube } from "@/components/LiteYouTube";
import { SiteFooter } from "@/components/home/SiteFooter";
import { PublicHeader } from "@/components/PublicHeader";
import {
  EVENT_VIDEOS,
  formatVideoDuration,
  isoVideoDuration,
  videoWatchUrl,
} from "@/data/event-videos";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale, localePath, type Locale } from "@/lib/i18n";
import { createPageMetadata, siteUrl } from "@/lib/seo";
import { whatsappLink } from "@/lib/whatsapp";

type Props = {
  params: Promise<{ locale: string }>;
};

/** Бренд-палитра сайта: ею красим шаги и плитки, чтобы страница не была серой */
const ACCENTS = ["#0a84ff", "#ff375f", "#ff9f0a", "#5e5ce6"] as const;
const accentAt = (index: number) => ACCENTS[index % ACCENTS.length];

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale: Locale = isLocale(localeParam) ? localeParam : "ru";
  const copy = BRIT_MILA_COPY[locale];

  if (!copy.h1) {
    return { title: getDictionary(locale).brand.name };
  }

  return createPageMetadata({
    title: copy.seoTitle,
    description: copy.seoDescription,
    path: `/${locale}/brit-mila`,
    canonicalPath: `/${locale}/brit-mila`,
    locale,
  });
}

/** Ролики из карточек опций - единственное место, где на этой странице есть видео */
function optionVideos(locale: Locale) {
  return BRIT_MILA_COPY[locale].options.flatMap((option) => {
    const media = BRIT_MILA_OPTION_MEDIA[option.id];
    if (media?.kind !== "video") return [];
    const video = EVENT_VIDEOS.find((item) => item.videoId === media.videoId);
    return video ? [{ title: option.title, video }] : [];
  });
}

function britMilaJsonLd(locale: Locale) {
  const dict = getDictionary(locale);
  const copy = BRIT_MILA_COPY[locale];
  const pageUrl = siteUrl(`/${locale}/brit-mila`);

  return [
    ...optionVideos(locale).map((entry) => ({
      "@context": "https://schema.org",
      "@type": "VideoObject",
      name: entry.title,
      description: entry.video.description[locale],
      uploadDate: entry.video.uploadDate,
      duration: isoVideoDuration(entry.video.durationSeconds),
      thumbnailUrl: `https://i.ytimg.com/vi/${entry.video.videoId}/hqdefault.jpg`,
      // embedUrl только у роликов с разрешённым эмбедом - иначе разметка врёт
      ...(entry.video.embeddable
        ? { embedUrl: `https://www.youtube-nocookie.com/embed/${entry.video.videoId}` }
        : {}),
      url: videoWatchUrl(entry.video.videoId),
      // Ролики русскоязычные - честная разметка языка и на he-странице
      inLanguage: "ru",
    })),
    {
      "@context": "https://schema.org",
      "@type": "Service",
      "@id": `${pageUrl}#service`,
      name: copy.h1,
      serviceType:
        locale === "he"
          ? "הפעלות ובידור לברית מילה ולזבד הבת"
          : "Праздничные развлечения на брит милу и зевед а-бат",
      description: copy.seoDescription,
      url: pageUrl,
      provider: { "@id": siteUrl("/#organization") },
      areaServed: { "@type": "Country", name: locale === "he" ? "ישראל" : "Израиль" },
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: copy.optionsTitle,
        itemListElement: copy.options.map((option) => ({
          "@type": "Offer",
          itemOffered: { "@type": "Service", name: option.title, description: option.text },
        })),
      },
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
  ];
}

export default async function BritMilaPage({ params }: Props) {
  const { locale: localeParam } = await params;
  const locale: Locale = isLocale(localeParam) ? localeParam : "ru";
  const copy = BRIT_MILA_COPY[locale];
  // Гейт на случай, если для локали ещё нет копии - страница не строится вхолостую
  if (!copy.h1) notFound();

  const dict = getDictionary(locale);
  const waHref = whatsappLink(copy.waMessage);
  // Фото показываем на HE только когда готовы ивритские alt-тексты (HE-PENDING гейт)
  const showPhotos =
    BRIT_MILA_MEDIA.photos.length > 0 &&
    (locale !== "he" || BRIT_MILA_MEDIA.photos.every((photo) => photo.altHe));
  // экранируем «<»: текст с "</script>" не должен ломать inline-скрипт
  // linear-gradient не знает про направление письма: на иврите зеркалим угол вручную,
  // иначе цветная подложка уходит в сторону, противоположную полоске
  const stepGradientAngle = locale === "he" ? 260 : 100;
  const jsonLd = JSON.stringify(britMilaJsonLd(locale)).replace(/</g, "\\u003c");

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
            <Baby className="h-4 w-4" strokeWidth={2.2} />
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

          {/* Два повода: брит мила и зевед а-бат (пустой заголовок скрывает блок) */}
          {copy.occasionsTitle && (
            <section className="mt-8">
              <h2 className="mb-2 text-base font-semibold">
                <BidiText locale={locale}>{copy.occasionsTitle}</BidiText>
              </h2>
              <p className="text-[15px] leading-relaxed text-[var(--color-ink-soft)]">
                <BidiText locale={locale}>{copy.occasionsIntro}</BidiText>
              </p>
              {/* Объёмные карточки в стиле сайта: мягкий градиент, стеклянный блик,
                  цветной кант и лёгкий наклон при наведении - как у карточек героев */}
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {[
                  {
                    title: copy.occasionsBoyTitle,
                    items: copy.occasionsBoyItems,
                    Icon: Baby,
                    accent: "var(--color-boy)",
                    surface: `linear-gradient(${locale === "he" ? 202 : 158}deg, #e8f3ff 0%, #ffffff 58%, #f7fbff 100%)`,
                    shadow: "0 22px 54px rgba(10,132,255,0.22), 0 6px 16px rgba(15,15,20,0.08)",
                    glow: "rgba(10,132,255,0.16)",
                  },
                  {
                    title: copy.occasionsGirlTitle,
                    items: copy.occasionsGirlItems,
                    Icon: Heart,
                    accent: "var(--color-girl)",
                    surface: `linear-gradient(${locale === "he" ? 202 : 158}deg, #ffeaf0 0%, #ffffff 58%, #fff7f9 100%)`,
                    shadow: "0 22px 54px rgba(255,55,95,0.2), 0 6px 16px rgba(15,15,20,0.08)",
                    glow: "rgba(255,55,95,0.16)",
                  },
                ].map((group) => (
                  <div
                    key={group.title}
                    className="relative overflow-hidden rounded-[26px] border border-white/70 p-5 ring-1 ring-white/70 transition-transform duration-500 [transform-style:preserve-3d] hover:[transform:rotateX(2deg)_rotateY(-3deg)_translateY(-4px)]"
                    style={{ background: group.surface, boxShadow: group.shadow }}
                  >
                    {/* стеклянный блик и внутренняя тень - объём без картинки */}
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[linear-gradient(135deg,rgba(255,255,255,0.85)_0%,rgba(255,255,255,0.25)_34%,rgba(255,255,255,0)_66%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.95),inset_0_-26px_46px_rgba(15,15,20,0.06)]"
                    />
                    {/* цветной кант сверху */}
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-x-0 top-0 h-1.5"
                      style={{ background: group.accent }}
                    />
                    {/* мягкое свечение в углу */}
                    <span
                      aria-hidden
                      className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full blur-2xl"
                      style={{ background: group.glow }}
                    />

                    <div className="relative flex items-center gap-2.5">
                      <span
                        aria-hidden
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white shadow-[0_8px_18px_rgba(15,15,20,0.18)]"
                        style={{ background: group.accent }}
                      >
                        <group.Icon className="h-5 w-5" strokeWidth={2.4} />
                      </span>
                      <h3 className="text-base font-bold leading-snug">
                        <BidiText locale={locale}>{group.title}</BidiText>
                      </h3>
                    </div>

                    <ul className="relative mt-3 space-y-2 text-[15px] leading-relaxed text-[var(--color-ink-soft)]">
                      {group.items.map((item, index) => (
                        <li key={index} className="flex gap-2.5">
                          <span
                            aria-hidden
                            className="mt-[8px] h-1.5 w-1.5 shrink-0 rounded-full"
                            style={{ background: group.accent }}
                          />
                          <BidiText locale={locale}>{item}</BidiText>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Что берём на себя */}
          <section className="mt-8">
            <h2 className="mb-3 text-base font-semibold">
              <BidiText locale={locale}>{copy.whatTitle}</BidiText>
            </h2>
            {/* Плитки вместо списка: каждая услуга - отдельная «кнопка» с цветной меткой */}
            <ul className="grid gap-2.5 sm:grid-cols-2">
              {copy.whatItems.map((item, index) => {
                // копирайт написан как «Заголовок: подробности» - разбираем на две части
                const separator = item.indexOf(": ");
                const title = separator > 0 ? item.slice(0, separator) : item;
                const detail = separator > 0 ? item.slice(separator + 2) : "";
                const accent = accentAt(index);

                return (
                  <li
                    key={index}
                    className="group/tile rounded-2xl border border-white/70 bg-white px-4 py-3 shadow-[0_6px_18px_rgba(15,15,20,0.06)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(15,15,20,0.1)]"
                  >
                    <span className="flex items-center gap-2">
                      <span
                        aria-hidden
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ background: accent, boxShadow: `0 0 0 4px ${accent}1f` }}
                      />
                      <span className="text-[15px] font-bold leading-snug text-[var(--color-ink)]">
                        <BidiText locale={locale}>{title}</BidiText>
                      </span>
                    </span>
                    {detail && (
                      <span className="mt-1 block text-sm leading-relaxed text-[var(--color-ink-soft)]">
                        <BidiText locale={locale}>{detail}</BidiText>
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Опции: карточки, которые клиент выбирает под свой праздник */}
          <section className="mt-8">
            <h2 className="mb-2 text-base font-semibold">
              <BidiText locale={locale}>{copy.optionsTitle}</BidiText>
            </h2>
            <p className="text-[15px] leading-relaxed text-[var(--color-ink-soft)]">
              <BidiText locale={locale}>{copy.optionsIntro}</BidiText>
            </p>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              {copy.options.map((option) => {
                const media = BRIT_MILA_OPTION_MEDIA[option.id];
                const video =
                  media?.kind === "video"
                    ? EVENT_VIDEOS.find((item) => item.videoId === media.videoId)
                    : undefined;

                return (
                  <div
                    key={option.id}
                    className="overflow-hidden rounded-2xl"
                    style={{ background: "rgba(255,255,255,0.55)", border: "1px solid rgba(0,0,0,0.06)" }}
                  >
                    {media?.kind === "photo" && (
                      <Image
                        src={media.src}
                        alt={media.alt[locale]}
                        width={media.width}
                        height={media.height}
                        sizes="(max-width: 640px) 92vw, 320px"
                        className="aspect-[4/3] w-full object-cover"
                        loading="lazy"
                      />
                    )}
                    {media?.kind === "video" && (
                      <LiteYouTube
                        videoId={media.videoId}
                        title={option.title}
                        duration={video ? formatVideoDuration(video.durationSeconds) : undefined}
                        sizes="(max-width: 640px) 92vw, 320px"
                        rounded={false}
                      />
                    )}
                    <div className="px-4 py-3">
                      <h3 className="text-[15px] font-semibold leading-snug">
                        <BidiText locale={locale}>{option.title}</BidiText>
                      </h3>
                      <p className="mt-1.5 text-[15px] leading-relaxed text-[var(--color-ink-soft)]">
                        <BidiText locale={locale}>{option.text}</BidiText>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Как проходит праздник */}
          <section className="mt-8">
            <h2 className="mb-2 text-base font-semibold">
              <BidiText locale={locale}>{copy.structureTitle}</BidiText>
            </h2>
            <p className="text-[15px] leading-relaxed text-[var(--color-ink-soft)]">
              <BidiText locale={locale}>{copy.structureIntro}</BidiText>
            </p>
            {/* Каждый шаг - своя цветная полоса с крупной цифрой: сценарий читается как маршрут */}
            <ol className="mt-3 space-y-2.5">
              {copy.structureSteps.map((step, index) => {
                const accent = accentAt(index);

                return (
                  <li
                    key={index}
                    className="relative overflow-hidden rounded-2xl border border-white/70 py-3 pe-4 ps-5 shadow-[0_6px_18px_rgba(15,15,20,0.05)]"
                    style={{ background: `linear-gradient(${stepGradientAngle}deg, ${accent}14 0%, #ffffff 62%)` }}
                  >
                    {/* цветная полоска слева (справа на иврите) */}
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-y-0 start-0 w-1.5"
                      style={{ background: accent }}
                    />
                    <span className="flex items-start gap-3">
                      <span
                        aria-hidden
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-base font-black text-white"
                        style={{ background: accent, boxShadow: `0 8px 18px ${accent}59` }}
                      >
                        {index + 1}
                      </span>
                      <span className="pt-1 text-[15px] leading-relaxed text-[var(--color-ink-soft)]">
                        <BidiText locale={locale}>{step}</BidiText>
                      </span>
                    </span>
                  </li>
                );
              })}
            </ol>
          </section>

          {/* Фото событий (HE-гейт по altHe) */}
          {showPhotos && (
            <section className="mt-8">
              {copy.photosTitle && (
                <h2 className="mb-3 text-base font-semibold">
                  <BidiText locale={locale}>{copy.photosTitle}</BidiText>
                </h2>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                {BRIT_MILA_MEDIA.photos.map((photo) => (
                  <Image
                    key={photo.src}
                    src={photo.src}
                    alt={locale === "he" && photo.altHe ? photo.altHe : photo.alt}
                    width={photo.width}
                    height={photo.height}
                    sizes="(max-width: 640px) 90vw, 340px"
                    className="w-full rounded-2xl object-cover"
                    loading="lazy"
                  />
                ))}
              </div>
            </section>
          )}


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
                href={localePath(locale, "/shows")}
                className="text-[var(--color-ink)] underline-offset-4 transition hover:underline"
              >
                <BidiText locale={locale}>{copy.seeAlsoShows}</BidiText>
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
