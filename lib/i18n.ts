export const LOCALES = ["ru", "he"] as const;

export type Locale = (typeof LOCALES)[number];
export type Direction = "ltr" | "rtl";

export const DEFAULT_LOCALE: Locale = "ru";

export const LOCALE_CONFIG: Record<
  Locale,
  {
    label: string;
    htmlLang: string;
    dir: Direction;
    ogLocale: string;
    nativeName: string;
  }
> = {
  ru: {
    label: "RU",
    htmlLang: "ru",
    dir: "ltr",
    ogLocale: "ru_RU",
    nativeName: "Русский",
  },
  he: {
    label: "HE",
    htmlLang: "he",
    dir: "rtl",
    ogLocale: "he_IL",
    nativeName: "עברית",
  },
};

export function isLocale(value: string): value is Locale {
  return LOCALES.includes(value as Locale);
}

export function localePath(locale: Locale, path = "/"): string {
  if (path === "/" || path === "") return `/${locale}`;
  return `/${locale}${path.startsWith("/") ? path : `/${path}`}`;
}

export function stripLocalePrefix(pathname: string): string {
  const parts = pathname.split("/");
  const maybeLocale = parts[1];
  if (!isLocale(maybeLocale)) return pathname === "" ? "/" : pathname;
  const stripped = `/${parts.slice(2).join("/")}`.replace(/\/$/, "");
  return stripped === "" ? "/" : stripped;
}

export function switchLocalePath(pathname: string, targetLocale: Locale): string {
  const cleanPath = stripLocalePrefix(pathname);
  return localePath(targetLocale, cleanPath);
}

export function localizeHref(locale: Locale, href: string): string {
  if (!href || href.startsWith("#")) return href;
  if (/^(https?:|mailto:|tel:|whatsapp:)/.test(href)) return href;

  const [pathWithLocale, suffix = ""] = href.split(/(?=[?#])/);
  return `${switchLocalePath(pathWithLocale || "/", locale)}${suffix}`;
}
