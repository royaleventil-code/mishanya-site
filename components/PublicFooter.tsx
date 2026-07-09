import Link from "next/link";
import { BidiText } from "@/components/BidiText";
import { MUNICIPALITIES_COPY, BUSINESS_COPY } from "@/data/b2b";
import { SHOWS_PAGE_COPY } from "@/data/shows";
import { VIDEOS_PAGE_COPY } from "@/data/videos";
import { getDictionary } from "@/lib/dictionaries";
import { localePath, type Locale } from "@/lib/i18n";
import { WA_DISPLAY } from "@/lib/whatsapp";

export function PublicFooter({ locale = "ru" }: { locale?: Locale }) {
  const dict = getDictionary(locale);
  const links = [
    { href: localePath(locale, "/about"), label: dict.common.about },
    { href: localePath(locale, "/formats"), label: dict.common.formats },
    { href: localePath(locale, "/all"), label: dict.common.programs },
    { href: localePath(locale, "/gallery"), label: dict.catalog.proof.eyebrow },
    { href: localePath(locale, "/faq"), label: dict.common.faqShort },
    // Новые разделы — до перевода he-ссылки скрыты (гейт по наличию copy)
    ...(SHOWS_PAGE_COPY[locale].breadcrumb
      ? [{ href: localePath(locale, "/shows"), label: SHOWS_PAGE_COPY[locale].breadcrumb }]
      : []),
    ...(MUNICIPALITIES_COPY[locale].breadcrumb
      ? [{ href: localePath(locale, "/municipalities"), label: MUNICIPALITIES_COPY[locale].breadcrumb }]
      : []),
    ...(BUSINESS_COPY[locale].breadcrumb
      ? [{ href: localePath(locale, "/business"), label: BUSINESS_COPY[locale].breadcrumb }]
      : []),
    ...(VIDEOS_PAGE_COPY[locale].breadcrumb
      ? [{ href: localePath(locale, "/videos"), label: VIDEOS_PAGE_COPY[locale].breadcrumb }]
      : []),
    { href: localePath(locale, "/contacts"), label: dict.common.contacts },
    { href: localePath(locale, "/accessibility"), label: dict.a11y.statementLink },
  ];

  return (
    <footer className="bg-[#111318] px-5 py-8 text-white sm:px-6">
      <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <div className="text-lg font-black"><BidiText locale={locale}>{dict.brand.name}</BidiText></div>
          <div className="mt-1 text-sm text-white/60">
            <BidiText locale={locale}>{dict.brand.footerDescription}</BidiText>
          </div>
          <div className="mt-3 text-sm font-bold text-white/82" dir="ltr">{WA_DISPLAY}</div>
        </div>
        <div className="flex flex-wrap gap-4 text-sm font-semibold text-white/72 md:justify-end">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-white">
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
