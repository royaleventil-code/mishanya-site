import type { Metadata, Viewport } from "next";
import { Inter, Lilita_One, Nunito } from "next/font/google";
import { BRAND_ALIASES, SITE_NAME, SITE_URL, siteUrl } from "@/lib/seo";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
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

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: `${SITE_NAME} — детские праздники в Израиле`,
  description:
    "Мишаня в Стране Чудес, также известные как Михаил в Стране Чудес и Страна Чудес: детские праздники в Израиле, герои и шоу. WhatsApp +972 54-616-32-60.",
  applicationName: SITE_NAME,
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — детские праздники в Израиле`,
    description:
      "Мишаня в Стране Чудес: герои, шоу и готовые программы для детских праздников в Израиле. Нас также ищут как Михаил в Стране Чудес и Страна Чудес.",
    images: [
      {
        url: "/generated/program-party.webp",
        width: 1200,
        height: 630,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — детские праздники в Израиле`,
    description:
      "Мишаня в Стране Чудес: герои, шоу и готовые программы для детских праздников в Израиле.",
    images: ["/generated/program-party.webp"],
  },
};

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": siteUrl("/#website"),
    name: SITE_NAME,
    alternateName: BRAND_ALIASES,
    url: siteUrl("/"),
    inLanguage: "ru",
  },
  {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "EntertainmentBusiness"],
    "@id": siteUrl("/#organization"),
    name: SITE_NAME,
    alternateName: BRAND_ALIASES,
    url: siteUrl("/"),
    logo: siteUrl("/logo-ru.png"),
    image: siteUrl("/generated/program-party.webp"),
    telephone: "+972546163260",
    email: "royal.eventil@gmail.com",
    areaServed: {
      "@type": "Country",
      name: "Israel",
    },
    sameAs: [
      "https://www.instagram.com/show.mishanya/",
      "https://www.facebook.com/royaleventisrael/",
      "https://www.youtube.com/channel/UCo189jVSku-2H_0Rgrw9JCw",
    ],
  },
];

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#fafafa",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" className={`${inter.variable} ${lilita.variable} ${nunito.variable}`}>
      <body className="min-h-screen antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
