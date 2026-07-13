import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, Landmark } from "lucide-react";
import { B2B_EMAIL, MUNICIPALITIES_COPY, type MunicipalityProgramAccent } from "@/data/b2b";
import { BidiText } from "@/components/BidiText";
import { LettersCarousel } from "@/components/municipalities/LettersCarousel";
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

/**
 * Акцентные цвета карточек программ - только из дизайн-токенов.
 * `plaque` - фон цветной плашки, `deep` - тёмный вариант акцента для текста
 * на белом (совпадает с high-contrast токенами, контраст AA), `chip*` - чипы.
 */
const PROGRAM_ACCENTS: Record<
  MunicipalityProgramAccent,
  { plaque: string; plaqueText: string; numberBg: string; deep: string; chipBorder: string; chipBg: string }
> = {
  boy: {
    plaque: "var(--color-boy)",
    plaqueText: "#ffffff",
    numberBg: "rgba(255,255,255,0.22)",
    deep: "#0053b8",
    chipBorder: "rgba(10,132,255,0.35)",
    chipBg: "rgba(10,132,255,0.06)",
  },
  allSeg: {
    plaque: "var(--color-all-seg)",
    plaqueText: "#ffffff",
    numberBg: "rgba(255,255,255,0.22)",
    deep: "#3a38c2",
    chipBorder: "rgba(94,92,230,0.35)",
    chipBg: "rgba(94,92,230,0.06)",
  },
  girl: {
    plaque: "var(--color-girl)",
    plaqueText: "#ffffff",
    numberBg: "rgba(255,255,255,0.22)",
    deep: "#c2003d",
    chipBorder: "rgba(255,55,95,0.35)",
    chipBg: "rgba(255,55,95,0.06)",
  },
  young: {
    plaque: "var(--color-young)",
    plaqueText: "var(--color-ink)",
    numberBg: "rgba(15,15,20,0.12)",
    deep: "#8f5a00",
    chipBorder: "rgba(255,159,10,0.45)",
    chipBg: "rgba(255,159,10,0.08)",
  },
  girlDeep: {
    plaque: "#c2003d",
    plaqueText: "#ffffff",
    numberBg: "rgba(255,255,255,0.22)",
    deep: "#c2003d",
    chipBorder: "rgba(194,0,61,0.35)",
    chipBg: "rgba(194,0,61,0.06)",
  },
  ink: {
    // тёмная плашка TECHNOFAN с неоновым бликом в тон --color-all-seg
    plaque: "linear-gradient(135deg, var(--color-ink) 0%, #1b1b2e 60%, #26244d 100%)",
    plaqueText: "#ffffff",
    numberBg: "rgba(94,92,230,0.45)",
    deep: "var(--color-ink)",
    chipBorder: "rgba(15,15,20,0.25)",
    chipBg: "rgba(15,15,20,0.04)",
  },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale: Locale = isLocale(localeParam) ? localeParam : "ru";
  const copy = MUNICIPALITIES_COPY[locale];

  if (!copy.h1) {
    return { title: getDictionary(locale).brand.name };
  }

  return createPageMetadata({
    title: copy.seoTitle,
    description: copy.seoDescription,
    path: `/${locale}/municipalities`,
    canonicalPath: `/${locale}/municipalities`,
    locale,
    image: "/og/municipalities.jpg",
  });
}

function municipalitiesJsonLd(locale: Locale) {
  const dict = getDictionary(locale);
  const copy = MUNICIPALITIES_COPY[locale];
  const pageUrl = siteUrl(`/${locale}/municipalities`);

  return [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      "@id": `${pageUrl}#service`,
      name: copy.h1,
      serviceType:
        locale === "he" ? "אירועים עירוניים לילדים" : "Городские детские праздники для муниципалитетов",
      description: copy.seoDescription,
      url: pageUrl,
      provider: { "@id": siteUrl("/#organization") },
      areaServed: { "@type": "Country", name: locale === "he" ? "ישראל" : "Израиль" },
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: copy.programsTitle,
        itemListElement: copy.programs.map((program) => ({
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: program.title,
            description: program.subtitle,
          },
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

export default async function MunicipalitiesPage({ params }: Props) {
  const { locale: localeParam } = await params;
  const locale: Locale = isLocale(localeParam) ? localeParam : "ru";
  const copy = MUNICIPALITIES_COPY[locale];
  // страховка: локаль без заполненного контента не рендерим
  if (!copy.h1) notFound();

  const dict = getDictionary(locale);
  const waHref = whatsappLink(copy.waMessage);
  const mailHref = `mailto:${B2B_EMAIL}?subject=${encodeURIComponent(copy.emailSubject)}`;
  // экранируем «<»: текст с "</script>" не должен ломать inline-скрипт
  const jsonLd = JSON.stringify(municipalitiesJsonLd(locale)).replace(/</g, "\\u003c");

  const cardShellClass =
    "mx-auto max-w-3xl overflow-hidden rounded-[var(--radius-card)] bg-white p-5 shadow-[var(--shadow-card)] sm:p-7";

  return (
    <main id="main" className="min-h-screen bg-[#fffaf4] text-[var(--color-ink)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <PublicHeader locale={locale} />

      <div className="mx-auto max-w-5xl px-5 pb-20 pt-6 sm:px-6">
        {/* Breadcrumbs */}
        <nav aria-label="breadcrumbs" className="mx-auto max-w-3xl text-xs text-[var(--color-ink-soft)]">
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

        {/* Интро, аудитории, форматы */}
        <article className={`mt-4 ${cardShellClass}`}>
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-ink-soft)]">
            <Landmark className="h-4 w-4" strokeWidth={2.2} />
            <BidiText locale={locale}>{copy.breadcrumb}</BidiText>
          </div>
          <h1 className="mt-2 font-[family-name:var(--font-nunito)] text-2xl font-black tracking-tight sm:text-3xl">
            <BidiText locale={locale}>{copy.h1}</BidiText>
          </h1>

          <div className="mt-4 space-y-3 text-[15px] leading-relaxed text-[var(--color-ink-soft)]">
            {copy.intro.map((paragraph, index) => (
              <p key={index}>
                <BidiText locale={locale}>{paragraph}</BidiText>
              </p>
            ))}
          </div>

          {/* С кем работаем */}
          <section className="mt-8">
            <h2 className="mb-3 text-base font-semibold">
              <BidiText locale={locale}>{copy.audienceTitle}</BidiText>
            </h2>
            <ul className="grid gap-3 sm:grid-cols-3">
              {copy.audience.map((item) => (
                <li
                  key={item.title}
                  className="rounded-2xl p-4"
                  style={{ background: "rgba(255,255,255,0.55)", border: "1px solid rgba(0,0,0,0.06)" }}
                >
                  <h3 className="text-[15px] font-semibold leading-snug">
                    <BidiText locale={locale}>{item.title}</BidiText>
                  </h3>
                  <p className="mt-1 text-sm leading-snug text-[var(--color-ink-soft)]">
                    <BidiText locale={locale}>{item.text}</BidiText>
                  </p>
                </li>
              ))}
            </ul>
          </section>

          {/* Форматы */}
          <section className="mt-8">
            <h2 className="mb-3 text-base font-semibold">
              <BidiText locale={locale}>{copy.formatsTitle}</BidiText>
            </h2>
            <ul className="space-y-2 text-[15px] leading-relaxed text-[var(--color-ink-soft)]">
              {copy.formats.map((item, index) => (
                <li key={index} className="flex gap-2">
                  <span aria-hidden className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-ink-soft)]" />
                  <BidiText locale={locale}>{item}</BidiText>
                </li>
              ))}
            </ul>
          </section>
        </article>

        {/* Программы - широкая секция с фирменными карточками */}
        <section className="mt-12" aria-labelledby="municipal-programs-title">
          <div className="mx-auto max-w-3xl text-center">
            <h2
              id="municipal-programs-title"
              className="font-[family-name:var(--font-nunito)] text-[28px] font-black leading-tight tracking-tight sm:text-4xl"
            >
              <BidiText locale={locale}>{copy.programsTitle}</BidiText>
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-[var(--color-ink-soft)] sm:text-base">
              <BidiText locale={locale}>{copy.programsIntro}</BidiText>
            </p>
          </div>

          <ul className="mt-8 grid gap-5 sm:grid-cols-2 sm:gap-6">
            {copy.programs.map((program, index) => {
              const accent = PROGRAM_ACCENTS[program.accent];
              return (
                <li
                  key={program.id}
                  className="group flex flex-col overflow-hidden rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-card)] ring-1 ring-black/[0.04] transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)]"
                >
                  {/* Обложка 3:2 */}
                  <div className="relative aspect-[3/2] overflow-hidden bg-[#f3f0ff]">
                    <Image
                      src={program.cover}
                      alt={program.coverAlt}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 480px"
                      className="object-cover transition duration-300 group-hover:scale-105"
                    />
                    <span className="absolute end-3 top-3 rounded-full bg-white/92 px-3 py-1 text-xs font-black text-[var(--color-ink)] shadow-sm backdrop-blur">
                      <BidiText locale={locale}>{program.tag}</BidiText>
                    </span>
                  </div>

                  {/* Цветная плашка: номер + название */}
                  <div
                    className="flex items-center gap-3 px-5 py-3.5"
                    style={{ background: accent.plaque, color: accent.plaqueText }}
                  >
                    <span
                      aria-hidden
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-[family-name:var(--font-nunito)] text-base font-black"
                      style={{ background: accent.numberBg }}
                    >
                      {index + 1}
                    </span>
                    {/* text-xl (20px) + font-black = «крупный текст» WCAG: белому на boy/girl хватает 3:1 */}
                    <h3 className="font-[family-name:var(--font-nunito)] text-xl font-black leading-tight">
                      <BidiText locale={locale}>{program.title}</BidiText>
                    </h3>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <p className="text-sm font-bold" style={{ color: accent.deep }}>
                      <BidiText locale={locale}>{program.subtitle}</BidiText>
                    </p>
                    <p className="mt-2 text-[15px] leading-relaxed text-[var(--color-ink-soft)]">
                      <BidiText locale={locale}>{program.description}</BidiText>
                    </p>

                    {/* Чипы «что входит» */}
                    <ul className="mt-4 flex flex-wrap gap-2">
                      {program.includes.map((item) => (
                        <li
                          key={item}
                          className="rounded-full border px-3 py-1 text-xs font-semibold leading-snug"
                          style={{ borderColor: accent.chipBorder, background: accent.chipBg, color: accent.deep }}
                        >
                          <BidiText locale={locale}>{item}</BidiText>
                        </li>
                      ))}
                    </ul>

                    {/* Формат */}
                    <p className="mt-auto flex items-center gap-2 border-t border-black/5 pt-3 text-sm font-semibold text-[var(--color-ink-soft)]">
                      <Clock aria-hidden className="h-4 w-4 shrink-0" strokeWidth={2.2} />
                      <BidiText locale={locale}>{program.format}</BidiText>
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Кейсы, масштаб, спектакли */}
        <article className={`mt-12 ${cardShellClass}`}>
          <section>
            <h2 className="mb-2 text-base font-semibold">
              <BidiText locale={locale}>{copy.casesTitle}</BidiText>
            </h2>
            <p className="text-[15px] leading-relaxed text-[var(--color-ink-soft)]">
              <BidiText locale={locale}>{copy.casesIntro}</BidiText>
            </p>
            <ul
              className="mt-3 overflow-hidden rounded-2xl"
              style={{ background: "rgba(255,255,255,0.55)", border: "1px solid rgba(0,0,0,0.06)" }}
            >
              {copy.cases.map((item, index) => (
                <li
                  key={index}
                  className="px-4 py-3 text-[15px] leading-snug text-[var(--color-ink-soft)]"
                  style={{ borderTop: index === 0 ? "none" : "0.5px solid rgba(0,0,0,0.08)" }}
                >
                  <BidiText locale={locale}>{item}</BidiText>
                </li>
              ))}
            </ul>
          </section>

          {/* Масштаб */}
          <section className="mt-8">
            <h2 className="mb-2 text-base font-semibold">
              <BidiText locale={locale}>{copy.scaleTitle}</BidiText>
            </h2>
            <p className="text-[15px] leading-relaxed text-[var(--color-ink-soft)]">
              <BidiText locale={locale}>{copy.scaleText}</BidiText>
            </p>
          </section>

          {/* Авторские спектакли */}
          <section className="mt-8">
            <h2 className="mb-2 text-base font-semibold">
              <BidiText locale={locale}>{copy.showsTitle}</BidiText>
            </h2>
            <div className="space-y-3 text-[15px] leading-relaxed text-[var(--color-ink-soft)]">
              {copy.showsText.map((paragraph, index) => (
                <p key={index}>
                  <BidiText locale={locale}>{paragraph}</BidiText>
                </p>
              ))}
            </div>
            <p className="mt-3 text-[15px]">
              <Link
                href={localePath(locale, "/shows")}
                className="font-semibold text-[var(--color-ink)] underline-offset-4 hover:underline"
              >
                <BidiText locale={locale}>{copy.showsLinkLabel}</BidiText>
              </Link>
            </p>
          </section>
        </article>

        {/* Видео с городских праздников - галерея */}
        <section className="mt-12" aria-labelledby="municipal-videos-title">
          <div className="mx-auto max-w-3xl text-center">
            <h2
              id="municipal-videos-title"
              className="font-[family-name:var(--font-nunito)] text-[28px] font-black leading-tight tracking-tight sm:text-4xl"
            >
              <BidiText locale={locale}>{copy.videosTitle}</BidiText>
            </h2>
          </div>
          <div
            className={
              copy.videos.length === 1
                ? "mx-auto mt-8 max-w-2xl"
                : "mt-8 grid gap-5 sm:grid-cols-2 sm:gap-6"
            }
          >
            {copy.videos.map((video) => (
              <figure
                key={video.id}
                className="overflow-hidden rounded-[var(--radius-card)] bg-white p-3 shadow-[var(--shadow-card)] ring-1 ring-black/[0.04]"
              >
                <LiteYouTube videoId={video.id} title={video.title} />
                <figcaption className="px-2 pb-1 pt-3 text-sm font-semibold text-[var(--color-ink-soft)]">
                  <BidiText locale={locale}>{video.title}</BidiText>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* Рекомендательные письма - карусель */}
        <section className="mt-12" aria-labelledby="municipal-letters-title">
          <div className="mx-auto max-w-3xl text-center">
            <h2
              id="municipal-letters-title"
              className="font-[family-name:var(--font-nunito)] text-[28px] font-black leading-tight tracking-tight sm:text-4xl"
            >
              <BidiText locale={locale}>{copy.lettersTitle}</BidiText>
            </h2>
          </div>
          <div className="mt-8">
            <LettersCarousel locale={locale} letters={copy.letters} labels={copy.letterLabels} />
          </div>
        </section>

        {/* Документы, FAQ, CTA */}
        <article className={`mt-12 ${cardShellClass}`}>
          {/* Документы и надёжность */}
          <section>
            <h2 className="mb-3 text-base font-semibold">
              <BidiText locale={locale}>{copy.docsTitle}</BidiText>
            </h2>
            <ul className="space-y-2 text-[15px] leading-relaxed text-[var(--color-ink-soft)]">
              {copy.docs.map((item, index) => (
                <li key={index} className="flex gap-2">
                  <span aria-hidden className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-ink-soft)]" />
                  <BidiText locale={locale}>{item}</BidiText>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[15px] leading-relaxed text-[var(--color-ink-soft)]">
              <BidiText locale={locale}>{copy.lettersText}</BidiText>
            </p>
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

          {/* CTA: WhatsApp + email - мэрии любят почту */}
          <div className="mt-8 text-center">
            <p className="mx-auto max-w-md text-sm text-[var(--color-ink-soft)]">
              <BidiText locale={locale}>{copy.ctaTitle}</BidiText>
            </p>
            <div className="mt-4 flex flex-col items-center justify-center gap-3 sm:flex-row">
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
                <BidiText locale={locale}>{copy.ctaWhatsApp}</BidiText>
              </a>
              <a
                href={mailHref}
                className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-7 py-4 text-base font-bold text-[var(--color-ink)] transition hover:border-black/20 active:scale-95"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                  aria-hidden
                >
                  <rect x="2" y="4" width="20" height="16" rx="3" />
                  <path d="m3.5 6.5 8.5 6 8.5-6" />
                </svg>
                <BidiText locale={locale}>{copy.ctaEmail}</BidiText>
              </a>
            </div>
            <p className="mt-3 text-sm text-[var(--color-ink-soft)]" dir="ltr">
              {B2B_EMAIL}
            </p>
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
