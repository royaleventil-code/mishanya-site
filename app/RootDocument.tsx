import type { Metadata, Viewport } from "next";
import { Inter, Lilita_One, Noto_Sans_Hebrew, Nunito } from "next/font/google";
import { Suspense } from "react";
import { MarketingEvents } from "@/components/MarketingEvents";
import { MarketingPixels } from "@/components/MarketingPixels";
import type { Locale } from "@/lib/i18n";
import { LOCALE_CONFIG } from "@/lib/i18n";
import { getDictionary } from "@/lib/dictionaries";
import {
  BRAND_ALIASES,
  HOME_WHATSAPP_PREVIEW_IMAGE,
  SITE_URL,
  siteUrl,
} from "@/lib/seo";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
});

const notoHebrew = Noto_Sans_Hebrew({
  subsets: ["hebrew"],
  weight: ["400", "500", "700", "800", "900"],
  variable: "--font-hebrew",
  display: "swap",
});

const lilita = Lilita_One({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
  display: "swap",
});

const nunito = Nunito({
  subsets: ["latin", "cyrillic"],
  weight: ["700", "800", "900"],
  variable: "--font-nunito",
  display: "swap",
});

export function createRootMetadata(locale: Locale): Metadata {
  const dict = getDictionary(locale);
  const localeConfig = LOCALE_CONFIG[locale];
  const googleSiteVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim();

  return {
    metadataBase: new URL(SITE_URL),
    title: `${dict.brand.name} — ${locale === "he" ? "ימי הולדת לילדים בישראל" : "детские праздники в Израиле"}`,
    description: dict.brand.siteDescription,
    applicationName: dict.brand.name,
    openGraph: {
      type: "website",
      locale: localeConfig.ogLocale,
      siteName: dict.brand.name,
      title: `${dict.brand.name} — ${locale === "he" ? "ימי הולדת לילדים בישראל" : "детские праздники в Израиле"}`,
      description: dict.brand.siteDescription,
      images: [
        {
          url: HOME_WHATSAPP_PREVIEW_IMAGE,
          width: 1200,
          height: 1200,
          alt: dict.brand.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: dict.brand.name,
      description: dict.brand.siteDescription,
      images: [HOME_WHATSAPP_PREVIEW_IMAGE],
    },
    verification: googleSiteVerification
      ? {
          google: googleSiteVerification,
        }
      : undefined,
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#fafafa",
};

function rootJsonLd(locale: Locale) {
  const dict = getDictionary(locale);
  const localePath = locale === "ru" ? "/ru" : "/he";

  return [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": siteUrl("/#website"),
      name: dict.brand.name,
      alternateName: BRAND_ALIASES,
      description: dict.brand.siteDescription,
      url: siteUrl(localePath),
      inLanguage: ["ru", "he"],
      publisher: {
        "@id": siteUrl("/#organization"),
      },
    },
    {
      "@context": "https://schema.org",
      "@type": ["LocalBusiness", "EntertainmentBusiness"],
      "@id": siteUrl("/#organization"),
      name: dict.brand.name,
      alternateName: BRAND_ALIASES,
      description: dict.brand.footerDescription,
      url: siteUrl(localePath),
      logo: siteUrl(dict.brand.logo),
      image: siteUrl(HOME_WHATSAPP_PREVIEW_IMAGE),
      telephone: "+972546163260",
      email: "royal.eventil@gmail.com",
      priceRange: "₪₪",
      availableLanguage: ["Russian", "Hebrew"],
      areaServed: {
        "@type": "Country",
        name: "Israel",
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "5.0",
        reviewCount: 783,
        bestRating: 5,
        worstRating: 1,
      },
      contactPoint: {
        "@type": "ContactPoint",
        telephone: "+972546163260",
        contactType: "customer service",
        availableLanguage: ["Russian", "Hebrew"],
      },
      sameAs: [
        "https://www.instagram.com/show.mishanya/",
        "https://www.facebook.com/royaleventisrael/",
        "https://www.youtube.com/channel/UCo189jVSku-2H_0Rgrw9JCw",
      ],
    },
  ];
}

export function RootDocument({
  children,
  locale,
}: Readonly<{ children: React.ReactNode; locale: Locale }>) {
  const localeConfig = LOCALE_CONFIG[locale];

  return (
    <html
      lang={localeConfig.htmlLang}
      dir={localeConfig.dir}
      className={`${inter.variable} ${notoHebrew.variable} ${lilita.variable} ${nunito.variable}`}
    >
      <body className="min-h-screen antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(rootJsonLd(locale)) }}
        />
        <MarketingPixels />
        <Suspense fallback={null}>
          <MarketingEvents />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
