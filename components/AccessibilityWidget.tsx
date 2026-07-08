"use client";

import {
  Accessibility,
  Contrast,
  Droplet,
  FileText,
  Link2,
  Minus,
  MousePointer2,
  Pause,
  Plus,
  RotateCcw,
  Type,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import {
  type A11yState,
  getA11yServerState,
  getA11yState,
  resetA11yState,
  setA11yState,
  subscribeA11y,
} from "@/lib/a11y";
import { getDictionary } from "@/lib/dictionaries";
import { localePath, type Locale } from "@/lib/i18n";

type ToggleKey = keyof Omit<A11yState, "fontScale">;

const FOCUSABLE =
  'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function AccessibilityWidget({ locale = "ru" }: { locale?: Locale }) {
  const dict = getDictionary(locale);
  const t = dict.a11y;
  const state = useSyncExternalStore(subscribeA11y, getA11yState, getA11yServerState);

  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setMounted(true), []);

  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  // Escape + фокус-ловушка внутри панели
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        close();
        return;
      }
      if (event.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null,
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (event.shiftKey) {
        if (active === first || !panel.contains(active)) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last || !panel.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [open, close]);

  // Скролл-лок фона + стартовый фокус
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frame = requestAnimationFrame(() => {
      panelRef.current
        ?.querySelector<HTMLElement>("[data-a11y-initial]")
        ?.focus();
    });
    return () => {
      document.body.style.overflow = previousOverflow;
      cancelAnimationFrame(frame);
    };
  }, [open]);

  const toggle = (key: ToggleKey) => setA11yState({ [key]: !state[key] });

  const toggles: { key: ToggleKey; label: string; icon: React.ReactNode }[] = [
    { key: "contrast", label: t.contrast, icon: <Contrast className="h-5 w-5" aria-hidden /> },
    { key: "grayscale", label: t.grayscale, icon: <Droplet className="h-5 w-5" aria-hidden /> },
    { key: "highlightLinks", label: t.highlightLinks, icon: <Link2 className="h-5 w-5" aria-hidden /> },
    { key: "readableFont", label: t.readableFont, icon: <Type className="h-5 w-5" aria-hidden /> },
    { key: "stopAnimations", label: t.stopAnimations, icon: <Pause className="h-5 w-5" aria-hidden /> },
    { key: "bigCursor", label: t.bigCursor, icon: <MousePointer2 className="h-5 w-5" aria-hidden /> },
  ];

  const activeCount =
    toggles.filter(({ key }) => state[key]).length + (state.fontScale > 0 ? 1 : 0);

  return (
    <aside aria-label={t.title}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={t.buttonLabel}
        title={t.buttonLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="fixed bottom-[calc(1rem+var(--a11y-offset,0px))] start-4 z-[46] inline-flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-[var(--color-boy)] text-white shadow-[0_14px_32px_rgba(10,132,255,0.35)] transition hover:scale-105 active:scale-95 motion-reduce:transition-none sm:bottom-[calc(1.5rem+var(--a11y-offset,0px))] sm:start-6 sm:h-16 sm:w-16 print:hidden"
        style={{ marginBottom: "env(safe-area-inset-bottom)" }}
      >
        <Accessibility className="h-7 w-7 sm:h-8 sm:w-8" aria-hidden strokeWidth={2.5} />
        {activeCount > 0 && (
          <span
            aria-hidden
            className="absolute -top-1 -end-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-ink)] px-1 text-[11px] font-black text-white"
          >
            {activeCount}
          </span>
        )}
      </button>

      {mounted &&
        open &&
        createPortal(
          <div className="fixed inset-0 z-[220]" role="presentation">
            <div
              className="absolute inset-0 bg-black/25 modal-backdrop"
              onClick={close}
              aria-hidden
            />
            <div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-label={t.title}
              className="apple-glass-strong absolute bottom-[calc(5rem+var(--a11y-offset,0px))] start-4 flex max-h-[min(72dvh,600px)] w-[336px] max-w-[calc(100vw-2rem)] flex-col overflow-y-auto rounded-3xl p-5 sm:bottom-[calc(6rem+var(--a11y-offset,0px))] sm:start-6"
              style={{ marginBottom: "env(safe-area-inset-bottom)" }}
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-black text-[var(--color-ink)]">{t.title}</h2>
                <button
                  type="button"
                  data-a11y-initial
                  onClick={close}
                  aria-label={t.close}
                  className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-[rgba(15,15,20,0.06)] text-[var(--color-ink)] transition hover:bg-[rgba(15,15,20,0.12)] active:scale-95 motion-reduce:transition-none"
                >
                  <X className="h-5 w-5" aria-hidden strokeWidth={2.6} />
                </button>
              </div>
              <p className="mt-1 text-sm text-[var(--color-ink-soft)]">{t.description}</p>

              <div className="mt-4 rounded-2xl border border-[var(--glass-border)] bg-white/60 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-[var(--color-ink)]">{t.fontSize}</span>
                  <span className="text-xs font-semibold text-[var(--color-ink-soft)]" aria-live="polite">
                    {t.fontLevels[state.fontScale]}
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setA11yState({
                        fontScale: Math.max(0, state.fontScale - 1) as A11yState["fontScale"],
                      })
                    }
                    disabled={state.fontScale === 0}
                    aria-label={t.decreaseFont}
                    className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl bg-[rgba(15,15,20,0.06)] font-black text-[var(--color-ink)] transition hover:bg-[rgba(15,15,20,0.12)] active:scale-95 disabled:cursor-default disabled:opacity-35 motion-reduce:transition-none"
                  >
                    <Minus className="h-5 w-5" aria-hidden />
                    <span className="ms-1 text-base">A</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setA11yState({
                        fontScale: Math.min(3, state.fontScale + 1) as A11yState["fontScale"],
                      })
                    }
                    disabled={state.fontScale === 3}
                    aria-label={t.increaseFont}
                    className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl bg-[rgba(15,15,20,0.06)] font-black text-[var(--color-ink)] transition hover:bg-[rgba(15,15,20,0.12)] active:scale-95 disabled:cursor-default disabled:opacity-35 motion-reduce:transition-none"
                  >
                    <Plus className="h-5 w-5" aria-hidden />
                    <span className="ms-1 text-lg">A</span>
                  </button>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                {toggles.map(({ key, label, icon }) => {
                  const active = state[key];
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggle(key)}
                      aria-pressed={active}
                      className={`flex min-h-[72px] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border px-2 py-2.5 text-center text-[13px] font-bold leading-tight transition active:scale-95 motion-reduce:transition-none ${
                        active
                          ? "border-[var(--color-boy)] bg-[var(--color-boy)] text-white shadow-[0_8px_20px_rgba(10,110,240,0.3)]"
                          : "border-[var(--glass-border)] bg-white/60 text-[var(--color-ink)] hover:bg-white"
                      }`}
                    >
                      {icon}
                      {label}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={resetA11yState}
                className="mt-3 inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[rgba(15,15,20,0.06)] text-sm font-bold text-[var(--color-ink)] transition hover:bg-[rgba(15,15,20,0.12)] active:scale-95 motion-reduce:transition-none"
              >
                <RotateCcw className="h-4 w-4" aria-hidden />
                {t.reset}
              </button>

              <Link
                href={localePath(locale, "/accessibility")}
                onClick={() => setOpen(false)}
                className="mt-2 inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[var(--glass-border)] bg-white/60 text-sm font-bold text-[var(--color-ink)] transition hover:bg-white active:scale-95 motion-reduce:transition-none"
              >
                <FileText className="h-4 w-4" aria-hidden />
                {t.statementLink}
              </Link>
            </div>
          </div>,
          document.body,
        )}
    </aside>
  );
}
