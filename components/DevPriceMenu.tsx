"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, MessageCircle, X } from "lucide-react";
import { BidiText } from "@/components/BidiText";
import { getDictionary } from "@/lib/dictionaries";
import { localePath, type Locale } from "@/lib/i18n";
import { getWhatsAppMessages, whatsappLink } from "@/lib/whatsapp";

const BOY_AGES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const GIRL_AGES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

type DevPriceMenuProps = {
  locale?: Locale;
  theme?: "light" | "dark";
  trigger?: (props: { open: boolean; onClick: () => void }) => ReactNode;
  autoOpenDelayMs?: number;
};

const HOME_PROGRAMS_POPUP_KEY = "mishanya-home-programs-popup-seen";

export function hasSeenHomeProgramsPopup() {
  if (typeof window === "undefined") return true;

  try {
    return window.sessionStorage.getItem(HOME_PROGRAMS_POPUP_KEY) === "1";
  } catch {
    return true;
  }
}

export function setHomeProgramsPopupSeen() {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(HOME_PROGRAMS_POPUP_KEY, "1");
  } catch {
    // Ignore storage failures; the menu still works from the button.
  }
}

export function DevPriceMenu({ locale = "ru", theme = "light", trigger, autoOpenDelayMs }: DevPriceMenuProps) {
  const [open, setOpen] = useState(false);
  const isDark = theme === "dark";
  const dict = getDictionary(locale);
  const waMessages = getWhatsAppMessages(locale);
  const summaryClass = isDark
    ? "border-white/25 bg-white/10 text-white hover:bg-white/16"
    : "border-[var(--color-line)] bg-white text-[var(--color-ink)] shadow-sm hover:bg-zinc-50";
  const markAutoPopupSeen = useCallback(() => {
    if (!autoOpenDelayMs) return;
    setHomeProgramsPopupSeen();
  }, [autoOpenDelayMs]);
  const closeMenu = useCallback(() => {
    markAutoPopupSeen();
    setOpen(false);
  }, [markAutoPopupSeen]);
  const toggleMenu = useCallback(() => {
    markAutoPopupSeen();
    setOpen((value) => !value);
  }, [markAutoPopupSeen]);
  const canUsePortal = typeof document !== "undefined";

  useEffect(() => {
    if (!autoOpenDelayMs) return;
    if (hasSeenHomeProgramsPopup()) return;

    const timeoutId = window.setTimeout(() => {
      if (hasSeenHomeProgramsPopup()) return;

      setHomeProgramsPopupSeen();
      setOpen(true);
    }, autoOpenDelayMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [autoOpenDelayMs]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu();
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [closeMenu, open]);

  const priceModal = (
    <div className="fixed inset-0 z-[160] bg-zinc-950/45 p-3 pt-[104px] text-[var(--color-ink)] backdrop-blur-sm sm:p-5 sm:pt-24">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={dict.common.pricesDialogTitle}
        className="mx-auto max-h-[calc(100dvh-116px)] w-full max-w-[340px] overflow-hidden rounded-2xl border border-black/5 bg-white shadow-[0_24px_70px_rgba(15,15,20,0.24)]"
      >
        <div className="flex items-start justify-between gap-3 px-4 pb-2 pt-4">
          <div>
            <div className="text-[11px] font-black uppercase tracking-wide text-[#0a84ff]">
              {dict.common.pricesDialogTitle}
            </div>
            <div className="mt-1 text-base font-black leading-tight">
              {dict.common.chooseChildAge}
            </div>
            <p className="mt-1.5 text-xs leading-5 text-[var(--color-ink-soft)]">
              <BidiText locale={locale}>{dict.common.chooseChildAgeDescription}</BidiText>
            </p>
          </div>
          <button
            type="button"
            onClick={closeMenu}
            aria-label={dict.common.closePrices}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-ink)] text-white shadow-sm transition active:scale-95"
          >
            <X className="h-5 w-5" strokeWidth={2.6} />
          </button>
        </div>
        <div className="max-h-[calc(100dvh-260px)] space-y-3 overflow-y-auto p-3 pt-2">
          <div className="rounded-xl bg-[#f4f8ff] p-3">
            <div className="mb-2 flex items-end justify-between gap-2">
              <div>
                <div className="text-sm font-black">{dict.common.boys}</div>
                <div className="text-xs font-bold text-[var(--color-ink-soft)]"><BidiText locale={locale}>{dict.common.ageRange}</BidiText></div>
              </div>
              <span className="rounded-full bg-white px-2 py-1 text-[10px] font-black text-[#0a84ff] min-[370px]:px-2.5 min-[370px]:text-[11px]">
                <BidiText locale={locale}>{dict.common.chooseAge}</BidiText>
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {BOY_AGES.map((age) => (
                <DevPriceLink key={age} href={localePath(locale, `/boy/${age}`)} label={`${age}`} compact onSelect={closeMenu} />
              ))}
            </div>
          </div>

          <div className="rounded-xl bg-[#fff4f8] p-3">
            <div className="mb-2 flex items-end justify-between gap-2">
              <div>
                <div className="text-sm font-black">{dict.common.girls}</div>
                <div className="text-xs font-bold text-[var(--color-ink-soft)]"><BidiText locale={locale}>{dict.common.ageRange}</BidiText></div>
              </div>
              <span className="rounded-full bg-white px-2 py-1 text-[10px] font-black text-[#e34f7d] min-[370px]:px-2.5 min-[370px]:text-[11px]">
                <BidiText locale={locale}>{dict.common.chooseAge}</BidiText>
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {GIRL_AGES.map((age) => (
                <DevPriceLink key={age} href={localePath(locale, `/girl/${age}`)} label={`${age}`} compact onSelect={closeMenu} />
              ))}
            </div>
          </div>

          <a
            href={whatsappLink(waMessages.default)}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 rounded-lg bg-[var(--color-whatsapp)] px-3 py-3 text-center text-sm font-black text-white transition active:scale-95"
          >
            <MessageCircle className="h-4 w-4" strokeWidth={2.6} />
            <BidiText locale={locale}>{dict.common.helpChooseProgram}</BidiText>
          </a>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {trigger ? (
        trigger({ open, onClick: toggleMenu })
      ) : (
        <button
          type="button"
          onClick={toggleMenu}
          aria-expanded={open}
          className={`flex h-10 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-xs font-black transition active:scale-95 ${summaryClass}`}
        >
          {dict.common.prices}
          <ChevronDown className={`h-3.5 w-3.5 transition ${open ? "rotate-180" : ""}`} strokeWidth={2.6} />
        </button>
      )}
      {open && canUsePortal ? createPortal(priceModal, document.body) : null}
    </>
  );
}

function DevPriceLink({
  href,
  label,
  compact = false,
  secondary = false,
  onSelect,
}: {
  href: string;
  label: string;
  compact?: boolean;
  secondary?: boolean;
  onSelect?: () => void;
}) {
  const pathname = usePathname();
  const isCurrentPage = pathname === href;

  return (
    <Link
      href={href}
      aria-current={isCurrentPage ? "page" : undefined}
      onClick={(event) => {
        onSelect?.();
        if (isCurrentPage) {
          event.preventDefault();
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }}
      className={`block rounded-lg font-black transition active:scale-95 ${
        secondary
          ? `border px-3 py-2.5 text-center text-sm ${
              isCurrentPage
                ? "border-[#0a84ff] bg-[#eaf4ff] text-[#0a84ff]"
                : "border-[var(--color-line)] bg-white text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
            }`
          : "bg-white text-[var(--color-ink)] hover:bg-zinc-50"
      } ${
        compact ? "px-2 py-2 text-center text-sm shadow-sm" : "px-3 py-2.5 text-sm"
      }`}
    >
      {label}
    </Link>
  );
}
