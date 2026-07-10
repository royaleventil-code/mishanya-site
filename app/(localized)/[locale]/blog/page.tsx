import type { Metadata } from "next";
import Link from "next/link";
import { BLOG_UI, blogPostsForLocale, formatBlogDate } from "@/data/blog";
import { BidiText } from "@/components/BidiText";
import { SiteFooter } from "@/components/home/SiteFooter";
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
  const ui = BLOG_UI[locale];

  return createPageMetadata({
    title: ui.indexSeoTitle,
    description: ui.indexSeoDescription,
    path: `/${locale}/blog`,
    canonicalPath: `/${locale}/blog`,
    locale,
  });
}

function blogIndexJsonLd(locale: Locale) {
  const dict = getDictionary(locale);
  const ui = BLOG_UI[locale];
  const pageUrl = siteUrl(`/${locale}/blog`);

  return [
    {
      "@context": "https://schema.org",
      "@type": "Blog",
      "@id": `${pageUrl}#blog`,
      name: ui.indexTitle,
      description: ui.indexSeoDescription,
      url: pageUrl,
      inLanguage: locale,
      publisher: { "@id": siteUrl("/#organization") },
      blogPost: blogPostsForLocale(locale).map((post) => ({
        "@type": "BlogPosting",
        headline: post.copy[locale]!.title,
        url: siteUrl(`/${locale}/blog/${post.slug}`),
        datePublished: post.datePublished,
        dateModified: post.dateModified,
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: dict.common.home, item: siteUrl(`/${locale}`) },
        { "@type": "ListItem", position: 2, name: ui.breadcrumb, item: pageUrl },
      ],
    },
  ];
}

export default async function BlogIndexPage({ params }: Props) {
  const { locale: localeParam } = await params;
  const locale: Locale = isLocale(localeParam) ? localeParam : "ru";
  const dict = getDictionary(locale);
  const ui = BLOG_UI[locale];
  const posts = blogPostsForLocale(locale);
  // экранируем «<»: текст с "</script>" не должен ломать inline-скрипт
  const jsonLd = JSON.stringify(blogIndexJsonLd(locale)).replace(/</g, "\\u003c");

  return (
    <main id="main" className="min-h-screen bg-[#fffaf4] text-[var(--color-ink)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <PublicHeader locale={locale} />

      <div className="mx-auto max-w-5xl px-5 pb-20 pt-6 sm:px-6">
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
              <BidiText locale={locale}>{ui.breadcrumb}</BidiText>
            </li>
          </ol>
        </nav>

        <header className="mt-4">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            <BidiText locale={locale}>{ui.indexTitle}</BidiText>
          </h1>
          <div className="mt-3 max-w-3xl space-y-3 text-[15px] leading-relaxed text-[var(--color-ink-soft)]">
            {ui.indexIntro.map((paragraph, index) => (
              <p key={index}>
                <BidiText locale={locale}>{paragraph}</BidiText>
              </p>
            ))}
          </div>
        </header>

        {/* Сетка карточек-статей */}
        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => {
            const copy = post.copy[locale]!;
            return (
              <li key={post.slug}>
                <Link
                  href={localePath(locale, `/blog/${post.slug}`)}
                  className="group block h-full overflow-hidden rounded-[28px] bg-white text-start shadow-[0_16px_40px_rgba(15,15,20,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_60px_rgba(15,15,20,0.12)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ink)]/20"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={post.cover.src}
                      alt={copy.coverAlt}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="p-5">
                    <p className="text-xs text-[var(--color-muted)]">
                      <BidiText locale={locale}>
                        {`${ui.updatedLabel}: ${formatBlogDate(post.dateModified, locale)}`}
                      </BidiText>
                    </p>
                    <h2 className="mt-1.5 text-lg font-bold leading-snug tracking-tight">
                      <BidiText locale={locale}>{copy.title}</BidiText>
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-soft)] line-clamp-3">
                      <BidiText locale={locale}>{copy.cardDescription}</BidiText>
                    </p>
                    <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-ink)]">
                      {ui.readMore}
                      <span
                        className={`transition ${locale === "he" ? "group-hover:-translate-x-0.5" : "group-hover:translate-x-0.5"}`}
                      >
                        {locale === "he" ? "←" : "→"}
                      </span>
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <SiteFooter locale={locale} />
    </main>
  );
}
