"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, Menu, X } from "lucide-react";
import { PROGRAMS } from "@/data/programs";
import type { Program } from "@/lib/types";

type Props = {
  theme?: "light" | "dark";
  variant?: "icon" | "pill";
  label?: string;
};

type MenuGroup = {
  tab: string;
  title: string;
  ids: string[];
};

const MENU_GROUPS: MenuGroup[] = [
  {
    tab: "Основа",
    title: "Основа праздника",
    ids: ["mini", "start", "standart", "mishanya", "vip", "super-vip"],
  },
  {
    tab: "Герои",
    title: "Герои и темы",
    ids: [
      "super-heroes",
      "frozen-toddler-girls",
      "unicorn-toddler-girls",
      "paw-patrol-toddler-boys",
      "harry-potter",
      "barbie",
      "wednesday",
      "kpop",
      "tiktok",
      "squid-game",
    ],
  },
  {
    tab: "Шоу",
    title: "Шоу-эффекты",
    ids: ["chemistry", "circus", "magician", "neon", "foam", "tesla", "techno"],
  },
];

function byIds(ids: string[]): Program[] {
  return ids
    .map((id) => PROGRAMS.find((program) => program.id === id))
    .filter((program): program is Program => Boolean(program));
}

export function ProgramMenu({ theme = "light", variant = "icon", label = "Программы" }: Props) {
  const [open, setOpen] = useState(false);
  const [activeGroupIndex, setActiveGroupIndex] = useState(0);
  const pathname = usePathname();
  const isDark = theme === "dark";
  const canUsePortal = typeof document !== "undefined";
  const isPill = variant === "pill";
  const activeGroup = MENU_GROUPS[activeGroupIndex] ?? MENU_GROUPS[0];

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open]);

  const menuOverlay = (
    <div
      className="fixed inset-0 z-[90] bg-zinc-950/35 p-3 text-[var(--color-ink)] backdrop-blur-sm sm:p-5"
      onClick={() => setOpen(false)}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Список программ"
        className="ml-auto flex h-full max-w-[430px] flex-col overflow-hidden rounded-lg bg-[#fffaf4] shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--color-line)] bg-white px-4 py-4">
          <div>
            <p className="text-xs font-black uppercase text-[#e34f35]">
              Программы
            </p>
            <h2 className="mt-1 text-2xl font-black leading-tight">
              Быстрый список
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Закрыть список программ"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-ink)] text-white shadow-sm transition active:scale-95"
          >
            <X className="h-5 w-5" strokeWidth={2.6} />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-1.5 border-b border-[var(--color-line)] bg-white px-4 py-3">
          {MENU_GROUPS.map((group, index) => {
            const isActive = activeGroupIndex === index;

            return (
              <button
                key={group.tab}
                type="button"
                onClick={() => setActiveGroupIndex(index)}
                className={`rounded-full px-3 py-2 text-sm font-black transition active:scale-95 ${
                  isActive
                    ? "bg-[var(--color-ink)] text-white"
                    : "bg-[#fffaf4] text-[var(--color-ink-soft)] hover:bg-zinc-100"
                }`}
              >
                {group.tab}
              </button>
            );
          })}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <div>
            <h3 className="mb-2 text-sm font-black text-[var(--color-ink-soft)]">
              {activeGroup.title}
            </h3>
            <div className="space-y-1.5">
              {byIds(activeGroup.ids).map((program) => (
                <Link
                  key={program.id}
                  href={`/programs/${program.id}`}
                  prefetch={false}
                  className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-lg border border-[var(--color-line)] bg-white px-3 py-2.5 transition hover:border-[#0a84ff] hover:shadow-sm active:scale-[0.99]"
                >
                  <div className="min-w-0">
                    <div className="truncate text-[15px] font-black leading-5">
                      {program.title}
                    </div>
                    {program.tagline && (
                      <p className="mt-0.5 truncate text-xs font-semibold leading-5 text-[var(--color-ink-soft)]">
                        {program.tagline}
                      </p>
                    )}
                  </div>
                  <ArrowRight
                    className="h-4 w-4 shrink-0 text-[#0a84ff]"
                    strokeWidth={2.7}
                  />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? "Закрыть список программ" : "Открыть список программ"}
        title="Программы"
        className={`inline-flex h-11 shrink-0 items-center justify-center rounded-full border text-sm font-black transition active:scale-95 ${
          isPill ? "w-auto gap-2 px-4" : "w-11 sm:w-auto sm:gap-2 sm:px-4"
        } ${
          open
            ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-white"
            : isDark
              ? "border-white/25 bg-white/10 text-white hover:bg-white/16"
              : "border-[var(--color-line)] bg-white text-[var(--color-ink)] shadow-sm hover:bg-zinc-50"
        }`}
      >
        {open ? (
          <X className="h-5 w-5" strokeWidth={2.6} />
        ) : (
          <Menu className="h-5 w-5" strokeWidth={2.6} />
        )}
        <span className={isPill ? "inline" : "hidden sm:inline"}>{label}</span>
      </button>

      {open && canUsePortal ? createPortal(menuOverlay, document.body) : null}
    </>
  );
}
