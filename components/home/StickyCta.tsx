"use client";

import { MessageCircle } from "lucide-react";
import { whatsappLink } from "@/lib/whatsapp";

const WA = "Здравствуйте! Хочу организовать детский праздник 🎉";

export function StickyCta() {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 border-t border-black/5 bg-white/85 p-3 backdrop-blur md:hidden"
      style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
    >
      <a
        href={whatsappLink(WA)}
        target="_blank"
        rel="noreferrer"
        className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--color-whatsapp)] py-3.5 text-base font-black text-white shadow-lg active:scale-95"
      >
        <MessageCircle className="h-5 w-5" strokeWidth={2.4} />
        Написать в WhatsApp
      </a>
    </div>
  );
}
