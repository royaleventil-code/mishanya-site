"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import { ChevronDown } from "lucide-react";

const BOY_AGES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const GIRL_AGES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export function DevPriceMenu({ theme = "light" }: { theme?: "light" | "dark" }) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const isDark = theme === "dark";
  const summaryClass = isDark
    ? "border-white/25 bg-white/10 text-white hover:bg-white/16"
    : "border-[var(--color-line)] bg-white text-[var(--color-ink)] shadow-sm hover:bg-zinc-50";
  const closeMenu = () => {
    if (detailsRef.current) detailsRef.current.open = false;
  };

  return (
    <details ref={detailsRef} className="group relative z-[80]">
      <summary
        className={`flex h-10 cursor-pointer list-none items-center gap-1.5 rounded-full border px-3 text-xs font-black transition active:scale-95 [&::-webkit-details-marker]:hidden ${summaryClass}`}
      >
        Цены
        <ChevronDown className="h-3.5 w-3.5 transition group-open:rotate-180" strokeWidth={2.6} />
      </summary>
      <div className="absolute left-0 top-12 w-[min(320px,calc(100vw-40px))] overflow-hidden rounded-2xl border border-black/5 bg-white text-[var(--color-ink)] shadow-[0_24px_70px_rgba(15,15,20,0.24)]">
        <div className="px-4 pb-2 pt-4">
          <div className="text-[11px] font-black uppercase tracking-wide text-[#0a84ff]">Программы и цены</div>
          <div className="mt-1 text-base font-black leading-tight">Выберите возраст ребёнка</div>
          <p className="mt-1.5 text-xs leading-5 text-[var(--color-ink-soft)]">
            Так сайт покажет программы, которые подходят именно вашему ребёнку.
          </p>
        </div>
        <div className="max-h-[70vh] space-y-3 overflow-y-auto p-3 pt-2">
          <div className="rounded-xl bg-[#f4f8ff] p-3">
            <div className="mb-2 flex items-end justify-between gap-3">
              <div>
                <div className="text-sm font-black">Для мальчиков</div>
                <div className="text-xs font-bold text-[var(--color-ink-soft)]">1-10 лет</div>
              </div>
              <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-[#0a84ff]">
                выбрать возраст
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {BOY_AGES.map((age) => (
                <DevPriceLink key={age} href={`/boy/${age}`} label={`${age}`} compact onSelect={closeMenu} />
              ))}
            </div>
          </div>

          <div className="rounded-xl bg-[#fff4f8] p-3">
            <div className="mb-2 flex items-end justify-between gap-3">
              <div>
                <div className="text-sm font-black">Для девочек</div>
                <div className="text-xs font-bold text-[var(--color-ink-soft)]">1-10 лет</div>
              </div>
              <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-[#e34f7d]">
                выбрать возраст
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {GIRL_AGES.map((age) => (
                <DevPriceLink key={age} href={`/girl/${age}`} label={`${age}`} compact onSelect={closeMenu} />
              ))}
            </div>
          </div>

          <DevPriceLink href="/all" label="Показать все программы" secondary onSelect={closeMenu} />
        </div>
      </div>
    </details>
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
