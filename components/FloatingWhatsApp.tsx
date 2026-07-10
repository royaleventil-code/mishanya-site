"use client";

import { MessageCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { getDictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/i18n";
import { getWhatsAppMessages, whatsappLink } from "@/lib/whatsapp";

// На главной мобильная версия показывает StickyCta-полосу внизу - там круглая
// кнопка была бы дублем, поэтому на этих путях она видна только с md (десктоп).
const HOME_PATHS = new Set(["", "/", "/ru", "/he"]);

function normalizePath(pathname: string) {
  return pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
}

export function FloatingWhatsApp({ locale = "ru" }: { locale?: Locale }) {
  const pathname = normalizePath(usePathname() ?? "");
  const dict = getDictionary(locale);
  const waMessages = getWhatsAppMessages(locale);

  if (pathname.startsWith("/admin")) {
    return null;
  }

  // Кнопка всегда в одной точке: снизу, с противоположной стороны от кнопки доступности
  const visibility = HOME_PATHS.has(pathname) ? "hidden md:inline-flex" : "inline-flex";

  return (
    <aside aria-label={dict.common.whatsapp}>
    <a
      href={whatsappLink(waMessages.default)}
      target="_blank"
      rel="noreferrer"
      aria-label={dict.common.writeWhatsapp}
      title={dict.common.writeWhatsapp}
      className={`fixed bottom-4 end-4 z-[45] ${visibility} h-14 w-14 items-center justify-center rounded-full bg-[var(--color-whatsapp)] text-white shadow-[0_14px_32px_rgba(18,140,78,0.34)] transition hover:scale-105 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-[rgba(37,211,102,0.35)] active:scale-95 motion-reduce:transition-none sm:bottom-6 sm:end-6 sm:h-16 sm:w-16 print:hidden`}
      style={{ marginBottom: "env(safe-area-inset-bottom)" }}
    >
      <MessageCircle className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={2.5} />
    </a>
    </aside>
  );
}
