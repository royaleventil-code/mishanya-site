import type { Metadata } from "next";
import { getDictionary } from "@/lib/dictionaries";
import { LOCALE_CONFIG, localePath, switchLocalePath, type Locale } from "@/lib/i18n";
import type { Gender } from "@/lib/types";

export const SITE_NAME = "Мишаня в Стране Чудес";
const DEFAULT_SITE_URL = "https://mishanya-show.com";
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL).replace(/\/$/, "");
export const BRAND_ALIASES = [
  "Мишаня",
  "Михаил в Стране Чудес",
  "Михаил в стране чудес",
  "Страна Чудес",
  "Страна чудес",
  "Мишаня в стране чудес",
  "Royal Event Israel",
];

const DEFAULT_IMAGE = "/generated/program-party.webp";
export const HOME_WHATSAPP_PREVIEW_IMAGE = "/og/home-whatsapp-preview.jpg";
const AGE_WHATSAPP_PREVIEW_AGES = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

export function siteUrl(path = "/"): string {
  return new URL(path, SITE_URL).toString();
}

export function siteName(locale: Locale = "ru"): string {
  return getDictionary(locale).brand.name;
}

export function childAgeLabel(age: number, locale: Locale = "ru"): string {
  if (locale === "he") return `גיל ${age}`;
  if (age === 1) return "1 год";
  if (age >= 2 && age <= 4) return `${age} года`;
  return `${age} лет`;
}

export function childLabel(gender: Gender, age: number, locale: Locale = "ru"): string {
  if (locale === "he") {
    return `${gender === "boy" ? "בן" : "בת"} ${age}`;
  }
  const child = gender === "boy" ? "мальчика" : "девочки";
  return `${child} ${childAgeLabel(age, locale)}`;
}

export function audiencePreviewImage(gender: Gender, age: number): string {
  if (gender === "girl" && age <= 3) return "/programs/start-girls-1-3.webp";
  if (gender === "girl") return "/programs/standart-girls.webp";
  if (age <= 3) return "/programs/start-universal.webp";
  return "/programs/super-heroes.webp";
}

export function ruProgramPath(path: string): string {
  if (path === "/") return "/ru";
  return `/ru${path}`;
}

export function localizedProgramPath(locale: Locale, path: string): string {
  return localePath(locale, path);
}

function alternateLanguages(canonicalPath: string) {
  return {
    ru: switchLocalePath(canonicalPath, "ru"),
    he: switchLocalePath(canonicalPath, "he"),
    "x-default": switchLocalePath(canonicalPath, "ru"),
  };
}

export function createPageMetadata({
  title,
  description,
  path,
  canonicalPath = path,
  image = DEFAULT_IMAGE,
  imageWidth = 1200,
  imageHeight = 630,
  noIndex = false,
  locale = "ru",
}: {
  title: string;
  description: string;
  path: string;
  canonicalPath?: string;
  image?: string;
  imageWidth?: number;
  imageHeight?: number;
  noIndex?: boolean;
  locale?: Locale;
}): Metadata {
  const dict = getDictionary(locale);

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
      languages: alternateLanguages(canonicalPath),
    },
    openGraph: {
      type: "website",
      locale: LOCALE_CONFIG[locale].ogLocale,
      siteName: dict.brand.name,
      title,
      description,
      url: path,
      images: [
        {
          url: image,
          width: imageWidth,
          height: imageHeight,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
    robots: {
      index: !noIndex,
      follow: true,
    },
  };
}

export function createAllProgramsMetadata(path = "/ru/all", locale: Locale = "ru"): Metadata {
  const name = siteName(locale);

  return createPageMetadata({
    title:
      locale === "he"
        ? `כל תוכניות ימי ההולדת | ${name}`
        : `Все программы детских праздников | ${name}`,
    description:
      locale === "he"
        ? "כל התוכניות של מישניה עם מחירים, דמויות, מופעים, משך האירוע והתאמה לגיל הילד. ימי הולדת לילדים בישראל בעברית וברוסית."
        : "Все программы Мишани с ценами: герои, шоу, длительность и подбор под возраст ребенка. Детские праздники в Израиле на русском и иврите.",
    path,
    canonicalPath: localePath(locale, "/all"),
    image: DEFAULT_IMAGE,
    locale,
  });
}

export function createAgeProgramsMetadata({
  gender,
  age,
  path,
  locale = "ru",
}: {
  gender: Gender;
  age: number;
  path: string;
  locale?: Locale;
}): Metadata {
  const name = siteName(locale);
  const audience = childLabel(gender, age, locale);
  const capitalizedAudience = audience[0].toUpperCase() + audience.slice(1);
  const hasAgeWhatsappPreview =
    AGE_WHATSAPP_PREVIEW_AGES.has(age) && path === localePath(locale, `/${gender}/${age}`);
  const ageLabel = childAgeLabel(age, locale);
  const child = gender === "boy" ? "мальчика" : "девочки";
  const heChild = gender === "boy" ? "לבן" : "לבת";

  return createPageMetadata({
    title:
      locale === "he"
        ? `תוכניות יום הולדת ${heChild} ${age} | ${name}`
        : hasAgeWhatsappPreview
          ? `Программа для ${child} ${ageLabel} | ${name}`
          : `Программы для ${audience} | ${name}`,
    description:
      locale === "he"
        ? `תוכניות יום הולדת ${heChild} ${age}: דמויות, מופעים, מחירים, תמונות, סרטונים ובחירה מהירה ב־WhatsApp.`
        : hasAgeWhatsappPreview
          ? `Программа праздника для ${child} ${ageLabel}: герои, шоу, цены, фото, видео и быстрый выбор.`
          : `${capitalizedAudience}: готовые программы с ценами, героями и шоу. Подберем праздник под возраст, формат и место проведения в Израиле.`,
    path,
    canonicalPath: localizedProgramPath(locale, `/${gender}/${age}`),
    image: hasAgeWhatsappPreview
      ? `/og/${gender}-${age}-whatsapp-preview.jpg`
      : audiencePreviewImage(gender, age),
    imageHeight: hasAgeWhatsappPreview ? 1200 : undefined,
    locale,
  });
}
