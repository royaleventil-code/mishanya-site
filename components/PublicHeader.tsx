"use client";

import Image from "next/image";
import Link from "next/link";
import { Snowflake } from "lucide-react";
import { DevPriceMenu } from "@/components/DevPriceMenu";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { useAutoHideHeader } from "@/components/useAutoHideHeader";
import { getDictionary } from "@/lib/dictionaries";
import { localePath, type Locale } from "@/lib/i18n";

export function PublicHeader({
  locale = "ru",
  theme = "light",
  langHrefOverrides,
}: {
  locale?: Locale;
  theme?: "light" | "dark";
  langHrefOverrides?: Partial<Record<Locale, string>>;
}) {
  const isDark = theme === "dark";
  const { isVisible, showHeader } = useAutoHideHeader();
  const dict = getDictionary(locale);
  const nav = [
    { href: localePath(locale, "/about"), label: dict.common.about },
    { href: localePath(locale, "/formats"), label: dict.common.formats },
    { href: localePath(locale, "/all"), label: dict.common.programs },
    { href: localePath(locale, "/holiday/new-year"), label: dict.common.newYearPrograms },
    { href: localePath(locale, "/gallery"), label: dict.common.galleryShort },
    { href: localePath(locale, "/contacts"), label: dict.common.contacts },
  ];

  return (
    <header
      onFocusCapture={showHeader}
      className={`sticky top-0 z-40 border-b backdrop-blur-md transition-transform duration-200 ease-out will-change-transform motion-reduce:transition-none ${
        isVisible ? "translate-y-0" : "-translate-y-full"
      } ${
        isDark
          ? "border-white/15 bg-zinc-950/78 text-white"
          : "border-[var(--color-line)] bg-[#fffaf4]/88 text-[var(--color-ink)]"
      }`}
    >
      <div className="mx-auto flex h-24 max-w-6xl items-center justify-between px-5 sm:px-6">
        <div className="flex items-center gap-2">
          <Link href={localePath(locale)} aria-label={dict.brand.logoAlt} className="flex items-center">
            <Image
              src={dict.brand.logo}
              alt={dict.brand.logoAlt}
              width={180}
              height={92}
              className="h-20 w-auto"
            />
          </Link>
        </div>

        <nav className="hidden items-center gap-4 text-sm font-bold lg:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={isDark ? "text-white/78 hover:text-white" : "text-zinc-700 hover:text-zinc-950"}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <DevPriceMenu
            locale={locale}
            theme={theme}
            trigger={({ open, onClick }) => (
              <button
                type="button"
                onClick={onClick}
                aria-expanded={open}
                aria-haspopup="dialog"
                className={`inline-flex h-11 shrink-0 items-center justify-center rounded-full border px-4 text-sm font-black transition active:scale-95 ${
                  isDark
                    ? "border-white/25 bg-white/10 text-white hover:bg-white/16"
                    : "border-[var(--color-line)] bg-white text-[var(--color-ink)] shadow-sm hover:bg-zinc-50"
                }`}
              >
                {dict.common.programs}
              </button>
            )}
          />
          <LanguageSwitch locale={locale} theme={theme} compact hrefOverrides={langHrefOverrides} />
        </div>
      </div>
      <nav aria-label={dict.common.newYearPrograms} className="mx-auto max-w-6xl px-5 pb-3 sm:px-6 lg:hidden">
        <Link href={localePath(locale, "/holiday/new-year")} className="inline-flex min-h-9 items-center gap-2 rounded-full border border-[#c6e2f7] bg-[#eef8ff] px-3 text-xs font-bold text-[#155a8f] transition hover:bg-[#e4f2ff]">
          <Snowflake className="h-4 w-4" aria-hidden />{dict.common.newYearPrograms}
        </Link>
      </nav>
    </header>
  );
}
