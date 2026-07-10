import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BLOG_POSTS,
  BLOG_UI,
  blogPostsForLocale,
  formatBlogDate,
  getBlogPostBySlug,
  hasBlogCopy,
  type BlogSection,
} from "@/data/blog";
import { CITIES, hasCityCopy } from "@/data/cities";
import { BidiText } from "@/components/BidiText";
import { SiteFooter } from "@/components/home/SiteFooter";
import { ProgramCatalogCard } from "@/components/ProgramCatalogCard";
import { PublicHeader } from "@/components/PublicHeader";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale, localePath, LOCALES, type Locale } from "@/lib/i18n";
import { getLocalizedProgramById } from "@/lib/localized-data";
import { createPageMetadata, siteUrl } from "@/lib/seo";
import { whatsappLink } from "@/lib/whatsapp";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

/**
 * Строим только пары locale×slug с готовой копией: иврит без PASS не публикуется.
 * Пары генерируем сами (без параметров родителя): локаль без единой статьи
 * не должна ронять static export пустым списком.
 */
export function generateStaticParams() {
  return BLOG_POSTS.flatMap((post) =>
    LOCALES.filter((locale) => hasBlogCopy(locale, post.slug)).map((locale) => ({
      locale,
      slug: post.slug,
    })),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: localeParam, slug } = await params;
  const locale: Locale = isLocale(localeParam) ? localeParam : "ru";
  const post = getBlogPostBySlug(slug);
  const copy = post?.copy[locale];
  const dict = getDictionary(locale);

  if (!post || !copy) {
    return { title: dict.brand.name };
  }

  const metadata = createPageMetadata({
    title: copy.seoTitle,
    description: copy.seoDescription,
    path: `/${locale}/blog/${post.slug}`,
    canonicalPath: `/${locale}/blog/${post.slug}`,
    image: post.cover.src,
    imageWidth: post.cover.width,
    imageHeight: post.cover.height,
    locale,
  });

  // Статья без иврита: hreflang только на ru, как в sitemap (he-URL не строится)
  if (!hasBlogCopy("he", post.slug) && metadata.alternates) {
    metadata.alternates.languages = {
      ru: `/ru/blog/${post.slug}`,
      "x-default": `/ru/blog/${post.slug}`,
    };
  }

  return metadata;
}

function articleJsonLd(locale: Locale, post: NonNullable<ReturnType<typeof getBlogPostBySlug>>) {
  const dict = getDictionary(locale);
  const ui = BLOG_UI[locale];
  const copy = post.copy[locale]!;
  const pageUrl = siteUrl(`/${locale}/blog/${post.slug}`);
  const images = [
    { src: post.cover.src, width: post.cover.width, height: post.cover.height, alt: copy.coverAlt },
    ...copy.sections
      .filter((section): section is Extract<BlogSection, { type: "img" }> => section.type === "img")
      .map((section) => ({ src: section.src, width: section.width, height: section.height, alt: section.alt })),
  ];

  return [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      "@id": `${pageUrl}#article`,
      headline: copy.title,
      description: copy.seoDescription,
      url: pageUrl,
      mainEntityOfPage: pageUrl,
      inLanguage: locale,
      datePublished: post.datePublished,
      dateModified: post.dateModified,
      keywords: post.keywords[locale].join(", "),
      image: images.map((image) => ({
        "@type": "ImageObject",
        contentUrl: siteUrl(image.src),
        width: image.width,
        height: image.height,
        caption: image.alt,
      })),
      author: {
        "@type": "Person",
        name: locale === "he" ? "מיכאל (מישניה)" : "Михаил (Мишаня)",
        jobTitle: locale === "he" ? "מייסד ומנחה ראשי" : "Основатель и ведущий",
        url: siteUrl(`/${locale}/about`),
        worksFor: { "@id": siteUrl("/#organization") },
      },
      publisher: { "@id": siteUrl("/#organization") },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: dict.common.home, item: siteUrl(`/${locale}`) },
        { "@type": "ListItem", position: 2, name: ui.breadcrumb, item: siteUrl(`/${locale}/blog`) },
        { "@type": "ListItem", position: 3, name: copy.title, item: pageUrl },
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

function SectionBlock({ section, locale }: { section: BlogSection; locale: Locale }) {
  switch (section.type) {
    case "h2":
      return (
        <h2 className="mt-8 text-xl font-bold tracking-tight sm:text-2xl">
          <BidiText locale={locale}>{section.text}</BidiText>
        </h2>
      );
    case "h3":
      return (
        <h3 className="mt-6 text-base font-semibold sm:text-lg">
          <BidiText locale={locale}>{section.text}</BidiText>
        </h3>
      );
    case "p":
      return (
        <p className="mt-3 text-[15px] leading-relaxed text-[var(--color-ink-soft)]">
          <BidiText locale={locale}>{section.text}</BidiText>
        </p>
      );
    case "ul":
      return (
        <ul className="mt-3 list-disc space-y-1.5 ps-5 text-[15px] leading-relaxed text-[var(--color-ink-soft)] marker:text-[var(--color-ink)]/40">
          {section.items.map((item, index) => (
            <li key={index}>
              <BidiText locale={locale}>{item}</BidiText>
            </li>
          ))}
        </ul>
      );
    case "table":
      return (
        <div className="mt-4 overflow-x-auto rounded-2xl" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="bg-[#fffaf4] text-start">
                {section.head.map((cell, index) => (
                  <th key={index} className="px-4 py-3 text-start font-semibold">
                    <BidiText locale={locale}>{cell}</BidiText>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {section.rows.map((row, rowIndex) => (
                <tr key={rowIndex} style={{ borderTop: "0.5px solid rgba(0,0,0,0.08)" }}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="px-4 py-3 align-top text-[var(--color-ink-soft)]">
                      <BidiText locale={locale}>{cell}</BidiText>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "img":
      return (
        <figure className="mt-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={section.src}
            alt={section.alt}
            width={section.width}
            height={section.height}
            loading="lazy"
            className="max-h-[480px] w-full rounded-2xl object-cover"
          />
          <figcaption className="mt-2 text-xs text-[var(--color-muted)]">
            <BidiText locale={locale}>{section.alt}</BidiText>
          </figcaption>
        </figure>
      );
    case "case":
      return (
        <aside
          className="mt-5 rounded-2xl p-4 sm:p-5"
          style={{ background: "rgba(255,214,140,0.16)", border: "1px solid rgba(255,180,80,0.35)" }}
        >
          <p className="text-sm font-bold">
            <BidiText locale={locale}>{section.title}</BidiText>
          </p>
          <p className="mt-1.5 text-[15px] leading-relaxed text-[var(--color-ink-soft)]">
            <BidiText locale={locale}>{section.text}</BidiText>
          </p>
        </aside>
      );
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { locale: localeParam, slug } = await params;
  const locale: Locale = isLocale(localeParam) ? localeParam : "ru";
  const post = getBlogPostBySlug(slug);
  const copy = post?.copy[locale];
  if (!post || !copy) notFound();

  const dict = getDictionary(locale);
  const ui = BLOG_UI[locale];
  const programs = post.relatedProgramIds
    .map((id) => getLocalizedProgramById(locale, id))
    .filter((program): program is NonNullable<typeof program> => Boolean(program));
  const cities = post.relatedCityIds
    .map((id) => CITIES.find((city) => city.id === id))
    .filter((city): city is NonNullable<typeof city> => Boolean(city && hasCityCopy(locale, city.id)));
  const otherPosts = blogPostsForLocale(locale).filter((item) => item.slug !== post.slug);
  const waHref = whatsappLink(copy.whatsappMessage);
  // экранируем «<»: текст с "</script>" не должен ломать inline-скрипт
  const jsonLd = JSON.stringify(articleJsonLd(locale, post)).replace(/</g, "\\u003c");

  return (
    <main id="main" className="min-h-screen bg-[#fffaf4] text-[var(--color-ink)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <PublicHeader locale={locale} />

      <div className="mx-auto max-w-3xl px-5 pb-20 pt-6 sm:px-6">
        {/* Breadcrumbs: Главная · Блог · Статья */}
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
                href={localePath(locale, "/blog")}
                className="underline-offset-4 transition hover:underline"
              >
                <BidiText locale={locale}>{ui.breadcrumb}</BidiText>
              </Link>
            </li>
            <li aria-hidden>·</li>
            <li className="font-semibold text-[var(--color-ink)]">
              <BidiText locale={locale}>{copy.title}</BidiText>
            </li>
          </ol>
        </nav>

        <article className="mt-4 overflow-hidden rounded-[28px] bg-white p-5 shadow-[0_16px_40px_rgba(15,15,20,0.06)] sm:p-7">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            <BidiText locale={locale}>{copy.title}</BidiText>
          </h1>
          <p className="mt-2 text-xs text-[var(--color-muted)]">
            <BidiText locale={locale}>
              {`${ui.byAuthor} · ${ui.updatedLabel}: ${formatBlogDate(post.dateModified, locale)}`}
            </BidiText>
          </p>

          {/* Обложка */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.cover.src}
            alt={copy.coverAlt}
            width={post.cover.width}
            height={post.cover.height}
            fetchPriority="high"
            className="mt-4 max-h-[420px] w-full rounded-2xl object-cover"
          />

          {/* Лид: ответ на главный вопрос сразу */}
          <div className="mt-5 space-y-3 text-[15px] leading-relaxed text-[var(--color-ink-soft)]">
            {copy.intro.map((paragraph, index) => (
              <p key={index}>
                <BidiText locale={locale}>{paragraph}</BidiText>
              </p>
            ))}
          </div>

          {copy.sections.map((section, index) => (
            <SectionBlock key={index} section={section} locale={locale} />
          ))}

          {/* FAQ */}
          <section className="mt-8">
            <h2 className="mb-3 text-xl font-bold tracking-tight sm:text-2xl">
              <BidiText locale={locale}>{copy.faqTitle}</BidiText>
            </h2>
            <ul
              className="overflow-hidden rounded-2xl"
              style={{ background: "rgba(255,255,255,0.55)", border: "1px solid rgba(0,0,0,0.06)" }}
            >
              {copy.faq.map((item, index) => (
                <li
                  key={index}
                  className="px-4 py-4"
                  style={{ borderTop: index === 0 ? "none" : "0.5px solid rgba(0,0,0,0.08)" }}
                >
                  <h3 className="text-[15px] font-semibold leading-snug">
                    <BidiText locale={locale}>{item.q}</BidiText>
                  </h3>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-[var(--color-ink-soft)]">
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
              <BidiText locale={locale}>{dict.common.writeWhatsapp}</BidiText>
            </a>
          </div>

          {/* Программы из статьи - карточки как в каталоге */}
          {programs.length > 0 && (
            <section className="mt-8">
              <h2 className="mb-3 text-base font-semibold">
                <BidiText locale={locale}>{ui.relatedProgramsTitle}</BidiText>
              </h2>
              <ul className="grid gap-4 sm:grid-cols-2">
                {programs.map((program) => (
                  <li key={program.id}>
                    <ProgramCatalogCard locale={locale} program={program} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Города + другие статьи */}
          <section className="mt-8 border-t border-black/5 pt-5">
            {cities.length > 0 && (
              <>
                <h2 className="text-sm font-semibold text-[var(--color-ink-soft)]">
                  <BidiText locale={locale}>{ui.relatedCitiesTitle}</BidiText>
                </h2>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-sm font-semibold">
                  {cities.map((city) => (
                    <Link
                      key={city.id}
                      href={localePath(locale, `/city/${city.id}`)}
                      className="text-[var(--color-ink)] underline-offset-4 transition hover:underline"
                    >
                      <BidiText locale={locale}>{city.copy[locale].name}</BidiText>
                    </Link>
                  ))}
                </div>
              </>
            )}
            {otherPosts.length > 0 && (
              <>
                <h2 className="mt-5 text-sm font-semibold text-[var(--color-ink-soft)]">
                  <BidiText locale={locale}>{ui.otherPostsTitle}</BidiText>
                </h2>
                <div className="mt-2 flex flex-col gap-1.5 text-sm font-semibold">
                  {otherPosts.map((item) => (
                    <Link
                      key={item.slug}
                      href={localePath(locale, `/blog/${item.slug}`)}
                      className="text-[var(--color-ink)] underline-offset-4 transition hover:underline"
                    >
                      <BidiText locale={locale}>{item.copy[locale]!.title}</BidiText>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </section>
        </article>
      </div>

      <SiteFooter locale={locale} />
    </main>
  );
}
