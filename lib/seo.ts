import type { Metadata } from "next";
import type { Gender } from "@/lib/types";

export const SITE_NAME = "Мишаня в Стране Чудес";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://mishanya-site.pages.dev";
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

export function siteUrl(path = "/"): string {
  return new URL(path, SITE_URL).toString();
}

export function childAgeLabel(age: number): string {
  if (age === 1) return "1 год";
  if (age >= 2 && age <= 4) return `${age} года`;
  return `${age} лет`;
}

export function childLabel(gender: Gender, age: number): string {
  const child = gender === "boy" ? "мальчика" : "девочки";
  return `${child} ${childAgeLabel(age)}`;
}

export function audiencePreviewImage(gender: Gender, age: number): string {
  if (gender === "girl" && age <= 3) return "/programs/start-girls-1-3.webp";
  if (gender === "girl") return "/programs/standart-girls.png";
  if (age <= 3) return "/programs/start-universal.png";
  return "/programs/super-heroes.png";
}

export function ruProgramPath(path: string): string {
  if (path === "/") return "/ru";
  return `/ru${path}`;
}

export function createPageMetadata({
  title,
  description,
  path,
  canonicalPath = path,
  image = DEFAULT_IMAGE,
  noIndex = false,
}: {
  title: string;
  description: string;
  path: string;
  canonicalPath?: string;
  image?: string;
  noIndex?: boolean;
}): Metadata {
  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
      languages: {
        ru: canonicalPath,
      },
    },
    openGraph: {
      type: "website",
      locale: "ru_RU",
      siteName: SITE_NAME,
      title,
      description,
      url: path,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
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

export function createAllProgramsMetadata(path = "/ru/all"): Metadata {
  return createPageMetadata({
    title: `Все программы детских праздников | ${SITE_NAME}`,
    description:
      "Все программы Мишани с ценами: герои, шоу, длительность и подбор под возраст ребенка. Детские праздники в Израиле на русском и иврите.",
    path,
    canonicalPath: "/ru/all",
    image: DEFAULT_IMAGE,
  });
}

export function createAgeProgramsMetadata({
  gender,
  age,
  path,
}: {
  gender: Gender;
  age: number;
  path: string;
}): Metadata {
  const audience = childLabel(gender, age);
  const capitalizedAudience = audience[0].toUpperCase() + audience.slice(1);

  return createPageMetadata({
    title: `Программы для ${audience} | ${SITE_NAME}`,
    description: `${capitalizedAudience}: готовые программы с ценами, героями и шоу. Подберем праздник под возраст, формат и место проведения в Израиле.`,
    path,
    canonicalPath: ruProgramPath(`/${gender}/${age}`),
    image: audiencePreviewImage(gender, age),
  });
}
