import Image from "next/image";
import Link from "next/link";
import { CITIES } from "@/data/cities";
import { HOLIDAYS } from "@/data/holidays";
import { VENUES } from "@/data/venues";
import { MUNICIPALITIES_COPY, BUSINESS_COPY } from "@/data/b2b";
import { SHOWS_PAGE_COPY } from "@/data/shows";
import { VIDEOS_PAGE_COPY } from "@/data/videos";
import { CHARITY_PAGE_COPY } from "@/data/charity";
import { BAR_MITZVAH_COPY } from "@/data/bar-mitzvah";
import { BidiText } from "@/components/BidiText";
import { getDictionary } from "@/lib/dictionaries";
import { localePath, type Locale } from "@/lib/i18n";
import { WA_DISPLAY, getWhatsAppMessages, whatsappLink } from "@/lib/whatsapp";

export function SiteFooter({ locale = "ru" }: { locale?: Locale }) {
  const dict = getDictionary(locale);
  const waMessages = getWhatsAppMessages(locale);

  return (
    <footer className="bg-[#0f0f14] px-5 pb-28 pt-12 text-white sm:px-6 md:pb-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-xs">
          <Image
            src={dict.brand.logo}
            alt={dict.brand.logoAlt}
            width={200}
            height={100}
            className="h-16 w-auto"
          />
          <p className="mt-3 text-sm leading-6 text-white/60">
            <BidiText locale={locale}>{dict.brand.siteDescription}</BidiText>
          </p>
        </div>

        <div className="flex flex-col gap-2 text-sm">
          <div className="font-black text-white/90">{dict.common.contacts}</div>
          <a
            href={whatsappLink(waMessages.default)}
            target="_blank"
            rel="noreferrer"
            className="text-white/70 transition hover:text-white"
          >
            <BidiText locale={locale}>{dict.common.whatsapp}</BidiText> <span dir="ltr">{WA_DISPLAY}</span>
          </a>
          <a href="mailto:royal.eventil@gmail.com" className="text-white/70 transition hover:text-white">
            royal.eventil@gmail.com
          </a>
        </div>

        <div className="flex flex-col gap-2 text-sm">
          <div className="font-black text-white/90">{dict.common.social}</div>
          <a
            href="https://www.instagram.com/show.mishanya/"
            target="_blank"
            rel="noreferrer"
            className="text-white/70 transition hover:text-white"
          >
            Instagram
          </a>
          <a
            href="https://www.facebook.com/royaleventisrael/"
            target="_blank"
            rel="noreferrer"
            className="text-white/70 transition hover:text-white"
          >
            Facebook
          </a>
          <a
            href="https://www.youtube.com/channel/UCo189jVSku-2H_0Rgrw9JCw"
            target="_blank"
            rel="noreferrer"
            className="text-white/70 transition hover:text-white"
          >
            YouTube
          </a>
        </div>

        <div className="flex flex-col gap-2 text-sm">
          <div className="font-black text-white/90">{dict.common.site}</div>
          <Link href={localePath(locale, "/all")} className="text-white/70 transition hover:text-white">
            {dict.common.programs}
          </Link>
          <Link href={localePath(locale, "/gallery")} className="text-white/70 transition hover:text-white">
            {dict.common.gallery}
          </Link>
          <Link href={localePath(locale, "/faq")} className="text-white/70 transition hover:text-white">
            {dict.common.faqShort}
          </Link>
          <Link href={localePath(locale, "/about")} className="text-white/70 transition hover:text-white">
            {dict.common.about}
          </Link>
          <Link
            href={localePath(locale, "/accessibility")}
            className="text-white/70 transition hover:text-white"
          >
            {dict.a11y.statementLink}
          </Link>
        </div>
      </div>

      {/* Праздник по возрасту — перелинковка возрастных страниц */}
      <div className="mx-auto mt-8 max-w-6xl border-t border-white/10 pt-6 text-sm">
        <div className="font-black text-white/90">{dict.common.byAgeTitle}</div>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-white/60">
          <span className="me-1 text-xs font-semibold text-white/45">{dict.common.boys}:</span>
          {Array.from({ length: 10 }, (_, i) => i + 1).map((age) => (
            <Link
              key={`boy-${age}`}
              href={localePath(locale, `/boy/${age}`)}
              className="tabular-nums transition hover:text-white"
            >
              {age}
            </Link>
          ))}
        </div>
        <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-white/60">
          <span className="me-1 text-xs font-semibold text-white/45">{dict.common.girls}:</span>
          {Array.from({ length: 10 }, (_, i) => i + 1).map((age) => (
            <Link
              key={`girl-${age}`}
              href={localePath(locale, `/girl/${age}`)}
              className="tabular-nums transition hover:text-white"
            >
              {age}
            </Link>
          ))}
        </div>
      </div>

      {/* Города — перелинковка городских страниц */}
      <div className="mx-auto mt-6 max-w-6xl border-t border-white/10 pt-6 text-sm">
        <div className="font-black text-white/90">{dict.common.citiesTitle}</div>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-white/60">
          {CITIES.map((city) => (
            <Link
              key={city.id}
              href={localePath(locale, `/city/${city.id}`)}
              className="transition hover:text-white"
            >
              <BidiText locale={locale}>{city.copy[locale].name}</BidiText>
            </Link>
          ))}
        </div>
      </div>

      {/* Площадки и сезоны — перелинковка новых SEO-страниц (гейт по наличию перевода) */}
      {(VENUES.some((v) => v.copy[locale].name) || HOLIDAYS.some((h) => h.copy[locale].name)) && (
        <div className="mx-auto mt-6 max-w-6xl border-t border-white/10 pt-6 text-sm">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-white/60">
            {VENUES.filter((venue) => venue.copy[locale].name).map((venue) => (
              <Link
                key={venue.id}
                href={localePath(locale, `/venue/${venue.id}`)}
                className="transition hover:text-white"
              >
                <BidiText locale={locale}>{venue.copy[locale].name}</BidiText>
              </Link>
            ))}
            {HOLIDAYS.filter((holiday) => holiday.copy[locale].name).map((holiday) => (
              <Link
                key={holiday.id}
                href={localePath(locale, `/holiday/${holiday.id}`)}
                className="transition hover:text-white"
              >
                <BidiText locale={locale}>{holiday.copy[locale].name}</BidiText>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Бизнесу и событиям — гейт на каждую ссылку отдельно (нет copy → нет ссылки) */}
      {(() => {
        const b2bLinks = [
          { href: "/municipalities", label: MUNICIPALITIES_COPY[locale].breadcrumb },
          { href: "/business", label: BUSINESS_COPY[locale].breadcrumb },
          { href: "/shows", label: SHOWS_PAGE_COPY[locale].breadcrumb },
          { href: "/bar-mitzvah", label: BAR_MITZVAH_COPY[locale].breadcrumb },
          { href: "/videos", label: VIDEOS_PAGE_COPY[locale].breadcrumb },
          { href: "/charity", label: CHARITY_PAGE_COPY[locale].breadcrumb },
        ].filter((link) => link.label);
        if (b2bLinks.length === 0) return null;
        return (
          <div className="mx-auto mt-6 max-w-6xl border-t border-white/10 pt-6 text-sm">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-white/60">
              {b2bLinks.map((link) => (
                <Link key={link.href} href={localePath(locale, link.href)} className="transition hover:text-white">
                  <BidiText locale={locale}>{link.label}</BidiText>
                </Link>
              ))}
            </div>
          </div>
        );
      })()}

      <div className="mx-auto mt-6 max-w-6xl border-t border-white/10 pt-6 text-xs text-white/40">
        <BidiText locale={locale}>{`© 2026 ${dict.brand.name} · Royal Event Israel`}</BidiText>
      </div>
    </footer>
  );
}
