import type { Metadata, Viewport } from "next";
import { Inter, Lilita_One } from "next/font/google";
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

export const metadata: Metadata = {
  title: "Мишаня в Стране Чудес — детские праздники в Израиле",
  description:
    "Агентство детских праздников в Израиле. 11 лет, 10 000+ мероприятий, 783 отзыва 5★. WhatsApp +972 54-616-32-60.",
};

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
    <html lang="ru" className={`${inter.variable} ${lilita.variable}`}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
