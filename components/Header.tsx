"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { DevPriceMenu } from "@/components/DevPriceMenu";
import { ProgramMenu } from "@/components/ProgramMenu";
import { useAutoHideHeader } from "@/components/useAutoHideHeader";
import { whatsappLink, WA_MESSAGES } from "@/lib/whatsapp";

export function Header() {
  const { isVisible, showHeader } = useAutoHideHeader();

  return (
    <header
      onFocusCapture={showHeader}
      className={`sticky top-0 z-30 border-b border-[var(--color-line)] bg-[var(--color-canvas)]/85 backdrop-blur-md transition-transform duration-200 ease-out will-change-transform motion-reduce:transition-none ${
        isVisible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6 h-[100px] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2 group" aria-label="Мишаня в Стране Чудес">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-ru.png" alt="Мишаня в Стране Чудес" className="h-[87px] w-auto" />
          </Link>
          <DevPriceMenu />
        </div>
        <div className="flex items-center gap-2">
          <ProgramMenu />
          <a
            href={whatsappLink(WA_MESSAGES.default)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Написать в WhatsApp"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center gap-1.5 rounded-full bg-[var(--color-whatsapp)] text-[13px] font-medium text-white shadow-sm transition active:scale-95 sm:w-auto sm:px-3.5 sm:py-2"
          >
            <MessageCircle className="h-4 w-4" strokeWidth={2.4} />
            <span className="hidden sm:inline">WhatsApp</span>
          </a>
        </div>
      </div>
    </header>
  );
}
