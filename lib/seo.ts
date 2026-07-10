import type { Metadata } from "next";
import { getAgeSeoFacts } from "@/data/age-guide";
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
  // дефолтный баннер квадратный 800×800; для остальных картинок прежняя декларация 1200×630
  imageWidth = image === DEFAULT_IMAGE ? 800 : 1200,
  imageHeight = image === DEFAULT_IMAGE ? 800 : 630,
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
        ? "כל התוכניות של מישניה עם מחירים שקופים החל מ־1,300 ₪, מעל 80 דמויות ומופעים, משך האירוע והתאמה לגיל הילד. ימי הולדת לילדים בכל הארץ, בעברית וברוסית."
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

  // Description 140-160 знаков с реальными данными возраста: 2-3 названия программ,
  // минимальная цена и CTA. Перебираем варианты и берем первый, попавший в диапазон.
  const facts = getAgeSeoFacts(locale, gender, age);
  let description =
    locale === "he"
      ? `תוכניות יום הולדת ${heChild} ${age}: דמויות, מופעים, מחירים, תמונות, סרטונים ובחירה מהירה ב־WhatsApp.`
      : hasAgeWhatsappPreview
        ? `Программа праздника для ${child} ${ageLabel}: герои, шоу, цены, фото, видео и быстрый выбор.`
        : `${capitalizedAudience}: готовые программы с ценами, героями и шоу. Подберем праздник под возраст, формат и место проведения в Израиле.`;
  if (facts) {
    const price =
      locale === "he"
        ? `${String(facts.minPrice).replace(/\B(?=(\d{3})+(?!\d))/g, ",")} ₪`
        : `${String(facts.minPrice).replace(/\B(?=(\d{3})+(?!\d))/g, " ")} ₪`;
    const ruPrograms = (n: number) => {
      if (n % 10 === 1 && n % 100 !== 11) return `${n} программа`;
      if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return `${n} программы`;
      return `${n} программ`;
    };
    const heads = [2, 3].map((n) => {
      const titles = facts.titles.slice(0, n);
      const rest = facts.count - titles.length;
      return locale === "he"
        ? `יום הולדת ${heChild} ${age}: ${titles.join(", ")} ועוד ${rest} תוכניות במחיר החל מ־${price}.`
        : `Праздник для ${audience}: ${titles.map((t) => `«${t}»`).join(", ")} и еще ${ruPrograms(rest)} с ценами от ${price}.`;
    });
    const tails =
      locale === "he"
        ? [
            " דמויות, מופעים, תמונות וסרטונים - בחירה מהירה ב־WhatsApp.",
            " דמויות, מופעים ובחירה מהירה ב־WhatsApp.",
            " בחירה מהירה ב־WhatsApp.",
          ]
        : [
            " Ведущий и герои приедут сами - напишите в WhatsApp, подберем за 5 минут.",
            " Напишите в WhatsApp - подберем программу за 5 минут.",
            " Пишите в WhatsApp - подберем за 5 минут.",
            " Быстрый подбор в WhatsApp.",
          ];
    const candidates: string[] = [];
    for (const head of heads) for (const tail of tails) candidates.push(head + tail);
    description =
      candidates.find((text) => text.length >= 140 && text.length <= 160) ??
      [...candidates].sort(
        (a, b) => Math.abs(150 - a.length) - Math.abs(150 - b.length),
      )[0];
  }

  return createPageMetadata({
    title:
      locale === "he"
        ? `תוכניות יום הולדת ${heChild} ${age} | ${name}`
        : hasAgeWhatsappPreview
          ? `Программа для ${child} ${ageLabel} | ${name}`
          : `Программы для ${audience} | ${name}`,
    description,
    path,
    canonicalPath: localizedProgramPath(locale, `/${gender}/${age}`),
    image: hasAgeWhatsappPreview
      ? `/og/${gender}-${age}-whatsapp-preview.jpg`
      : audiencePreviewImage(gender, age),
    imageHeight: hasAgeWhatsappPreview ? 1200 : undefined,
    locale,
  });
}
