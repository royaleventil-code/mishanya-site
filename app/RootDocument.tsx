import type { Metadata, Viewport } from "next";
import { Inter, Lilita_One, Noto_Sans_Hebrew, Nunito } from "next/font/google";
import { Suspense } from "react";
import { A11yProvider } from "@/components/A11yProvider";
import { AccessibilityWidget } from "@/components/AccessibilityWidget";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import { MarketingEvents } from "@/components/MarketingEvents";
import { MarketingPixels } from "@/components/MarketingPixels";
import { A11Y_BOOT_SCRIPT } from "@/lib/a11y";
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
    title: `${dict.brand.name} - ${locale === "he" ? "הפעלות וימי הולדת לילדים בישראל" : "аниматоры и детские праздники в Израиле"}`,
    description: dict.brand.siteDescription,
    applicationName: dict.brand.name,
    openGraph: {
      type: "website",
      locale: localeConfig.ogLocale,
      siteName: dict.brand.name,
      title: `${dict.brand.name} - ${locale === "he" ? "הפעלות וימי הולדת לילדים בישראל" : "аниматоры и детские праздники в Израиле"}`,
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
      priceRange: "₪1500-₪3000",
      foundingDate: "2015",
      availableLanguage: ["Russian", "Hebrew"],
      hasMap: "https://www.google.com/maps/place/?q=place_id:ChIJcVYXCzq3HRURZpNp45P8WLY",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Kiryat Yam",
        postalCode: "29082",
        addressCountry: "IL",
      },
      areaServed: [
        { "@type": "City", name: "Netanya" },
        { "@type": "City", name: "Tel Aviv" },
        { "@type": "City", name: "Haifa" },
        { "@type": "City", name: "Ashdod" },
        { "@type": "City", name: "Jerusalem" },
        { "@type": "City", name: "Beer Sheva" },
        { "@type": "City", name: "Kiryat Yam" },
        { "@type": "City", name: "Kiryat Bialik" },
        { "@type": "City", name: "Kiryat Motzkin" },
        { "@type": "City", name: "Kiryat Ata" },
        { "@type": "City", name: "Rishon LeZion" },
        { "@type": "Country", name: "Israel" },
      ],
      knowsLanguage: ["ru", "he"],
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
        "https://www.google.com/maps/place/?q=place_id:ChIJcVYXCzq3HRURZpNp45P8WLY",
      ],
    },
  ];
}

export function RootDocument({
  children,
  locale,
  showFloatingWhatsApp = true,
  showAccessibilityWidget = true,
}: Readonly<{
  children: React.ReactNode;
  locale: Locale;
  showFloatingWhatsApp?: boolean;
  showAccessibilityWidget?: boolean;
}>) {
  const localeConfig = LOCALE_CONFIG[locale];
  const dict = getDictionary(locale);

  return (
    <html
      lang={localeConfig.htmlLang}
      dir={localeConfig.dir}
      // Классы режимов доступности добавляются до гидрации boot-скриптом
      suppressHydrationWarning
      className={`${inter.variable} ${notoHebrew.variable} ${lilita.variable} ${nunito.variable}`}
    >
      <head>
        {/* Восстанавливает включённые режимы доступности до первой отрисовки */}
        <script dangerouslySetInnerHTML={{ __html: A11Y_BOOT_SCRIPT }} />
      </head>
      <body className="min-h-screen antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            // экранируем «<», чтобы текст с "</script>" не мог сломать inline-скрипт
            __html: JSON.stringify(rootJsonLd(locale)).replace(/</g, "\\u003c"),
          }}
        />
        <a href="#main" className="skip-link">
          {dict.a11y.skipToContent}
        </a>
        <MarketingPixels />
        <Suspense fallback={null}>
          <MarketingEvents />
        </Suspense>
        <A11yProvider>{children}</A11yProvider>
        {showFloatingWhatsApp ? <FloatingWhatsApp locale={locale} /> : null}
        {showAccessibilityWidget ? <AccessibilityWidget locale={locale} /> : null}
      </body>
    </html>
  );
}
