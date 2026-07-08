import Image from "next/image";
import Link from "next/link";
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

      <div className="mx-auto mt-8 max-w-6xl border-t border-white/10 pt-6 text-xs text-white/40">
        <BidiText locale={locale}>{`© 2026 ${dict.brand.name} · Royal Event Israel`}</BidiText>
      </div>
    </footer>
  );
}
