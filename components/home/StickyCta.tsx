"use client";

import { MessageCircle } from "lucide-react";
import { BidiText } from "@/components/BidiText";
import { getDictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/i18n";
import { getWhatsAppMessages, whatsappLink } from "@/lib/whatsapp";

export function StickyCta({ locale = "ru" }: { locale?: Locale }) {
  const dict = getDictionary(locale);
  const waMessages = getWhatsAppMessages(locale);

  return (
    <div
      className="js-bottom-bar fixed inset-x-0 bottom-0 z-50 border-t border-black/5 bg-white/85 p-3 backdrop-blur md:hidden"
      style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
    >
      <a
        href={whatsappLink(waMessages.default)}
        target="_blank"
        rel="noreferrer"
        className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--color-whatsapp)] py-3.5 text-base font-black text-white shadow-lg active:scale-95"
      >
        <MessageCircle className="h-5 w-5" strokeWidth={2.4} />
        <BidiText locale={locale}>{dict.common.writeWhatsapp}</BidiText>
      </a>
    </div>
  );
}
