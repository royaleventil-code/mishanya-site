import { notFound } from "next/navigation";
import {
  RootDocument,
  createRootMetadata,
  viewport as rootViewport,
} from "@/app/RootDocument";
import { isLocale, LOCALES, type Locale } from "@/lib/i18n";

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) return createRootMetadata("ru");
  return createRootMetadata(locale);
}

export const viewport = rootViewport;

export default async function LocalizedLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return <RootDocument locale={locale as Locale}>{children}</RootDocument>;
}
