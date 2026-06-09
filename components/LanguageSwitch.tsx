"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Languages } from "lucide-react";
import { getDictionary } from "@/lib/dictionaries";
import { LOCALES, switchLocalePath, type Locale } from "@/lib/i18n";

type Props = {
  locale: Locale;
  theme?: "light" | "dark";
  compact?: boolean;
};

export function LanguageSwitch({ locale, theme = "light", compact = false }: Props) {
  const pathname = usePathname() || "/";
  const dict = getDictionary(locale);
  const isDark = theme === "dark";

  return (
    <nav
      aria-label={dict.common.languageSwitchLabel}
      className={`inline-flex h-10 items-center rounded-full border p-1 text-xs font-black ${
        isDark
          ? "border-white/25 bg-white/10 text-white"
          : "border-[var(--color-line)] bg-white text-[var(--color-ink)] shadow-sm"
      }`}
    >
      {!compact && <Languages className="mx-1 h-3.5 w-3.5 opacity-70" strokeWidth={2.5} />}
      {LOCALES.map((targetLocale) => {
        const active = targetLocale === locale;
        const href = switchLocalePath(pathname, targetLocale);

        return (
          <Link
            key={targetLocale}
            href={href}
            aria-current={active ? "true" : undefined}
            onClick={(event) => {
              if (typeof window === "undefined") return;
              event.preventDefault();
              const current = new URL(window.location.href);
              const nextPath = switchLocalePath(current.pathname, targetLocale);
              const nextUrl = `${nextPath}${current.search}${current.hash}`;
              window.location.assign(nextUrl);
            }}
            className={`rounded-full px-2.5 py-1.5 transition ${
              active
                ? isDark
                  ? "bg-white text-zinc-950"
                  : "bg-zinc-950 text-white"
                : isDark
                  ? "text-white/72 hover:text-white"
                  : "text-zinc-600 hover:text-zinc-950"
            }`}
          >
            {targetLocale.toUpperCase()}
          </Link>
        );
      })}
    </nav>
  );
}
