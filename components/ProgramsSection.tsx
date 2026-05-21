"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Baby, Banknote, Check, ChevronDown, ChevronLeft, ChevronRight, Clock, Users, X } from "lucide-react";
import type { FilterState, Hero, Program, SegmentId } from "@/lib/types";
import { filterHeroes, filterPrograms } from "@/lib/filtering";
import { sortHeroes } from "@/lib/heroOrder";
import { whatsappLink, WA_MESSAGES } from "@/lib/whatsapp";
import { getHeroEmoji, getHeroImage } from "@/data/heroes";

type Props = {
  segment: SegmentId;
  accent: string;
  programs: Program[];
  heroes: Hero[];
};

const KIDS_OPTIONS = [
  { value: "small" as const, label: "До 15" },
  { value: "large" as const, label: "Больше 15" },
];
const LOCATION_OPTIONS = [
  { value: "indoor" as const, label: "В помещении" },
  { value: "outdoor" as const, label: "На улице" },
];
const LANGUAGE_OPTIONS = [
  { value: "ru" as const, label: "Русский" },
  { value: "he" as const, label: "Иврит" },
  { value: "en" as const, label: "Английский" },
  { value: "mixed" as const, label: "Смешанный" },
];

export function ProgramsSection({ segment, accent, programs, heroes }: Props) {
  const [filters, setFilters] = useState<FilterState>({
    kidsCount: null,
    location: null,
    language: null,
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const visibleProgramsBase = useMemo(
    () => programs.filter((p) => p.segments.includes(segment)),
    [programs, segment],
  );
  const visiblePrograms = useMemo(
    () => filterPrograms(programs, segment, filters),
    [programs, segment, filters],
  );

  const selectedIndex = selectedId
    ? visiblePrograms.findIndex((p) => p.id === selectedId)
    : -1;
  const selectedProgram = selectedId
    ? visiblePrograms[selectedIndex] ?? programs.find((p) => p.id === selectedId) ?? null
    : null;
  const canGoPrevious = selectedIndex > 0;
  const canGoNext = selectedIndex >= 0 && selectedIndex < visiblePrograms.length - 1;

  const navigateProgram = useCallback(
    (direction: -1 | 1) => {
      if (!selectedId) return;
      const index = visiblePrograms.findIndex((p) => p.id === selectedId);
      const nextProgram = visiblePrograms[index + direction];
      if (nextProgram) setSelectedId(nextProgram.id);
    },
    [selectedId, visiblePrograms],
  );

  useEffect(() => {
    if (!selectedProgram) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedId(null);
      if (e.key === "ArrowLeft") navigateProgram(-1);
      if (e.key === "ArrowRight") navigateProgram(1);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [navigateProgram, selectedProgram]);

  return (
    <section className="mx-auto max-w-3xl px-5 sm:px-6 pb-10">
      {/* Filters */}
      <div className="mt-6 sm:mt-8 grid grid-cols-3 gap-2">
        <FilterDropdown
          label="Дети"
          options={KIDS_OPTIONS}
          value={filters.kidsCount}
          onChange={(v) => setFilters((f) => ({ ...f, kidsCount: v }))}
          accent={accent}
        />
        <FilterDropdown
          label="Место"
          options={LOCATION_OPTIONS}
          value={filters.location}
          onChange={(v) => setFilters((f) => ({ ...f, location: v }))}
          accent={accent}
        />
        <FilterDropdown
          label="Язык"
          options={LANGUAGE_OPTIONS}
          value={filters.language}
          onChange={(v) => setFilters((f) => ({ ...f, language: v }))}
          accent={accent}
        />
      </div>

      {/* Programs grid */}
      <div className="mt-8 grid sm:grid-cols-2 gap-4">
        {visiblePrograms.map((p) => (
          <ProgramCard
            key={p.id}
            program={p}
            accent={accent}
            onOpen={() => setSelectedId(p.id)}
          />
        ))}
        {visiblePrograms.length === 0 && (
          <div className="sm:col-span-2 text-center py-12 text-[var(--color-ink-soft)] text-sm">
            По выбранным фильтрам нет программ. Попробуйте снять один из фильтров.
          </div>
        )}
      </div>

      {visiblePrograms.length > 0 &&
        visiblePrograms.length !== visibleProgramsBase.length && (
          <p className="mt-4 text-xs text-[var(--color-ink-soft)] text-center">
            Показано {visiblePrograms.length} из {visibleProgramsBase.length} программ
          </p>
        )}

      <AnimatePresence>
        {selectedProgram && (
          <ProgramModal
            key="program-modal"
            program={selectedProgram}
            accent={accent}
            segment={segment}
            heroes={heroes}
            languageFilter={filters.language}
            position={selectedIndex + 1}
            total={visiblePrograms.length}
            canGoPrevious={canGoPrevious}
            canGoNext={canGoNext}
            onNavigate={navigateProgram}
            onClose={() => setSelectedId(null)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}

// ---------- FilterDropdown ----------

type FilterDropdownProps<T extends string> = {
  label: string;
  options: { value: T; label: string }[];
  value: T | null;
  onChange: (v: T | null) => void;
  accent: string;
};

function FilterDropdown<T extends string>({
  label,
  options,
  value,
  onChange,
  accent,
}: FilterDropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const selected = options.find((o) => o.value === value);
  const isActive = selected != null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full rounded-full px-3 py-2.5 text-sm font-medium border transition active:scale-[0.97] flex items-center justify-between gap-1.5"
        style={
          isActive
            ? { backgroundColor: accent, borderColor: accent, color: "white" }
            : {
                backgroundColor: "white",
                borderColor: "var(--color-line)",
                color: "var(--color-ink)",
              }
        }
      >
        <span className="truncate text-left">{selected?.label ?? label}</span>
        <ChevronDown
          className={`w-4 h-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          strokeWidth={2.5}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 z-30 rounded-2xl bg-white shadow-[0_16px_40px_rgba(15,15,20,0.15)] border border-[var(--color-line)] overflow-hidden">
          {isActive && (
            <button
              type="button"
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
              className="w-full text-left px-4 py-2.5 text-sm text-[var(--color-ink-soft)] hover:bg-zinc-50 border-b border-[var(--color-line)]"
            >
              Сбросить
            </button>
          )}
          {options.map((o) => {
            const active = value === o.value;
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => {
                  onChange(active ? null : o.value);
                  setOpen(false);
                }}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-zinc-50 flex items-center justify-between gap-2"
                style={active ? { color: accent, fontWeight: 600 } : undefined}
              >
                {o.label}
                {active && <Check className="w-4 h-4" strokeWidth={2.5} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------- ProgramCard ----------

function ProgramCard({
  program,
  accent,
  onOpen,
}: {
  program: Program;
  accent: string;
  onOpen: () => void;
}) {
  return (
    <button
      onClick={onOpen}
      className="group text-left rounded-[28px] bg-white overflow-hidden shadow-[0_16px_40px_rgba(15,15,20,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_60px_rgba(15,15,20,0.12)] focus:outline-none focus:ring-2"
      style={{ ['--tw-ring-color' as never]: accent }}
    >
      {/* Cover */}
      <div
        className="relative h-44 sm:h-48 flex items-center justify-center overflow-hidden"
        style={
          program.cover
            ? { background: "white" }
            : { background: `linear-gradient(135deg, ${accent}33 0%, #8b5cf61f 60%, ${accent}0a 100%)` }
        }
      >
        {!program.cover && (
          <>
            <div
              aria-hidden
              className="absolute inset-0 opacity-60 pointer-events-none"
              style={{
                background: `radial-gradient(circle at 50% 55%, ${accent}40, transparent 65%)`,
              }}
            />
            <span aria-hidden className="absolute top-5 left-6 text-[var(--color-ink)]/30 text-sm">✦</span>
            <span aria-hidden className="absolute bottom-6 right-8 text-white/60 text-xs">●</span>
            <span aria-hidden className="absolute top-8 right-10 text-white/40 text-xs">●</span>
          </>
        )}

        {program.cover ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={program.cover}
            alt={program.title}
            className="relative z-10 w-full h-full object-cover"
            style={{ objectPosition: "center 30%" }}
          />
        ) : (
          <span className="relative z-10 text-7xl" style={{ filter: `drop-shadow(0 10px 28px ${accent}55)` }}>
            {program.emoji}
          </span>
        )}

        {program.ruOnly && (
          <span className="absolute top-3 right-3 rounded-full bg-white/85 backdrop-blur px-2.5 py-1 text-[10px] font-medium text-[var(--color-ink-soft)] shadow-sm">
            На русском
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-5 text-center">
        <h3 className="text-xl font-bold tracking-tight">{program.title}</h3>
        {program.tagline && (
          <p className="mt-1 text-xs text-[var(--color-ink-soft)] line-clamp-2">
            {program.tagline}
          </p>
        )}

        <div className="mt-3 flex items-center justify-center flex-wrap gap-x-3 gap-y-2">
          {/* Price pill */}
          <div
            className="inline-flex items-baseline gap-1 rounded-full px-3 py-1.5 text-sm font-bold text-white shadow-sm"
            style={{
              background: `linear-gradient(135deg, ${accent} 0%, #8b5cf6 100%)`,
            }}
          >
            <span className="text-[10px] font-medium opacity-80">от</span>
            {program.priceFrom.toLocaleString("ru-RU")} ₪
          </div>

          <span className="inline-flex items-center gap-1 text-xs text-[var(--color-ink-soft)]">
            <Clock className="w-3.5 h-3.5" strokeWidth={2.2} />
            {program.durationLabel}
          </span>

          {program.maxKids !== null && (
            <span className="inline-flex items-center gap-1 text-xs text-[var(--color-ink-soft)]">
              <Users className="w-3.5 h-3.5" strokeWidth={2.2} />
              до {program.maxKids}
            </span>
          )}
        </div>

        <div
          className="mt-4 inline-flex w-full items-center justify-center gap-1 rounded-full py-2.5 text-sm font-semibold text-white shadow-sm transition group-hover:shadow-md"
          style={{
            background: `linear-gradient(135deg, ${accent} 0%, #8b5cf6 100%)`,
          }}
        >
          Подробнее
          <span className="transition group-hover:translate-x-0.5">→</span>
        </div>
      </div>
    </button>
  );
}

// ---------- ProgramModal ----------

function ProgramModal({
  program,
  accent,
  segment,
  heroes,
  languageFilter,
  position,
  total,
  canGoPrevious,
  canGoNext,
  onNavigate,
  onClose,
}: {
  program: Program;
  accent: string;
  segment: SegmentId;
  heroes: Hero[];
  languageFilter: FilterState["language"];
  position: number;
  total: number;
  canGoPrevious: boolean;
  canGoNext: boolean;
  onNavigate: (direction: -1 | 1) => void;
  onClose: () => void;
}) {
  const APPLE_EASE = [0.32, 0.72, 0, 1] as const;
  const swipeStartRef = useRef<{ x: number; y: number; canClose: boolean } | null>(null);
  const closeTrackingCleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      closeTrackingCleanupRef.current?.();
    };
  }, []);

  const startCloseTracking = (startY: number) => {
    closeTrackingCleanupRef.current?.();

    let closed = false;
    const cleanup = () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", cleanup);
      window.removeEventListener("pointercancel", cleanup);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", cleanup);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", cleanup);
      window.removeEventListener("touchcancel", cleanup);
      closeTrackingCleanupRef.current = null;
    };

    const closeIfPulled = (clientY: number) => {
      if (closed || clientY - startY <= 50) return;
      closed = true;
      cleanup();
      onClose();
    };

    function onPointerMove(event: PointerEvent) {
      closeIfPulled(event.clientY);
    }

    function onMouseMove(event: MouseEvent) {
      closeIfPulled(event.clientY);
    }

    function onTouchMove(event: TouchEvent) {
      const touch = event.touches[0];
      if (touch) closeIfPulled(touch.clientY);
    }

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", cleanup);
    window.addEventListener("pointercancel", cleanup);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", cleanup);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", cleanup);
    window.addEventListener("touchcancel", cleanup);
    closeTrackingCleanupRef.current = cleanup;
  };

  const startSwipe = (target: EventTarget, container: HTMLDivElement, x: number, y: number) => {
    const targetElement = target as HTMLElement;
    const isCloseHandle = !!targetElement.closest("[data-close-drag-handle]");
    const isTopDragZone = y - container.getBoundingClientRect().top <= 96;
    if (targetElement.closest("a")) return;
    if (targetElement.closest("button") && !isCloseHandle) return;
    swipeStartRef.current = { x, y, canClose: isCloseHandle || isTopDragZone };
  };

  const moveSwipe = (x: number, y: number) => {
    const start = swipeStartRef.current;
    if (!start?.canClose) return;
    const dx = x - start.x;
    const dy = y - start.y;
    const isDownClose = dy > 50 && Math.abs(dy) > Math.abs(dx) * 1.0;
    if (!isDownClose) return;

    swipeStartRef.current = null;
    onClose();
  };

  const endSwipe = (x: number, y: number) => {
    const start = swipeStartRef.current;
    swipeStartRef.current = null;
    if (!start) return;

    const dx = x - start.x;
    const dy = y - start.y;
    const isDownClose = start.canClose && dy > 50 && Math.abs(dy) > Math.abs(dx) * 1.0;
    if (isDownClose) {
      onClose();
      return;
    }

    const isHorizontalSwipe = Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.0;
    if (!isHorizontalSwipe) return;

    if (dx < 0 && canGoNext) onNavigate(1);
    if (dx > 0 && canGoPrevious) onNavigate(-1);
  };

  const rememberSwipeStart = (event: React.PointerEvent<HTMLDivElement>) => {
    startSwipe(event.target, event.currentTarget, event.clientX, event.clientY);
  };

  const rememberMouseSwipeStart = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    startSwipe(event.target, event.currentTarget, event.clientX, event.clientY);
  };

  const handleSwipeMove = (event: React.PointerEvent<HTMLDivElement>) => {
    moveSwipe(event.clientX, event.clientY);
  };

  const handleMouseSwipeMove = (event: React.MouseEvent<HTMLDivElement>) => {
    moveSwipe(event.clientX, event.clientY);
  };

  const handleSwipeEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    endSwipe(event.clientX, event.clientY);
  };

  const handleMouseSwipeEnd = (event: React.MouseEvent<HTMLDivElement>) => {
    endSwipe(event.clientX, event.clientY);
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 modal-backdrop bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-6 overflow-y-auto"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: APPLE_EASE }}
    >
      <motion.div
        className="relative w-full max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl my-auto sm:my-8 max-h-[95vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={rememberSwipeStart}
        onPointerMove={handleSwipeMove}
        onPointerUp={handleSwipeEnd}
        onPointerCancel={() => {
          swipeStartRef.current = null;
        }}
        onMouseDown={rememberMouseSwipeStart}
        onMouseMove={handleMouseSwipeMove}
        onMouseUp={handleMouseSwipeEnd}
        initial={{ opacity: 0, scale: 0.96, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 24 }}
        transition={{ duration: 0.32, ease: APPLE_EASE }}
      >
        <div
          data-close-drag-handle
          role="button"
          tabIndex={0}
          aria-label="Закрыть"
          className="absolute left-1/2 top-2 z-30 flex h-7 w-24 -translate-x-1/2 cursor-grab items-start justify-center rounded-full pt-1.5 active:cursor-grabbing"
          style={{ touchAction: "none" }}
          onClick={(event) => {
            event.stopPropagation();
            onClose();
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") onClose();
          }}
          onPointerDown={(event) => startCloseTracking(event.clientY)}
          onMouseDown={(event) => startCloseTracking(event.clientY)}
          onTouchStart={(event) => {
            const touch = event.touches[0];
            if (touch) startCloseTracking(touch.clientY);
          }}
        >
          <span className="h-1.5 w-12 rounded-full bg-black/20" />
        </div>

        {/* Cover */}
        <div
          className="relative h-40 sm:h-52 flex items-center justify-center rounded-t-3xl overflow-hidden"
          style={
            program.cover
              ? { background: "white" }
              : { background: `linear-gradient(135deg, ${accent}33 0%, ${accent}0d 100%)` }
          }
        >
          {program.cover ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={program.cover}
              alt={program.title}
              className="w-full h-full object-cover"
              style={{ objectPosition: "center 30%" }}
            />
          ) : (
            <span className="text-7xl sm:text-8xl" style={{ filter: `drop-shadow(0 8px 24px ${accent}55)` }}>
              {program.emoji}
            </span>
          )}
          <button
            onClick={onClose}
            aria-label="Закрыть"
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-md transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-7">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-center">
            {program.title}
          </h2>
          {program.tagline && (
            <p className="mt-1 text-sm text-[var(--color-ink-soft)] text-center">
              {program.tagline}
            </p>
          )}
          {total > 1 && (
            <p className="mt-2 text-center text-xs font-medium tabular-nums text-[var(--color-ink-soft)]">
              {position} / {total}
            </p>
          )}
          {program.ruOnly && (
            <p className="mt-2 text-xs font-medium text-center" style={{ color: accent }}>
              Программа проводится только на русском языке
            </p>
          )}

          {/* Stat tiles */}
          <div className="mt-5 grid grid-cols-3 gap-2">
            <Stat icon={<Clock className="w-4 h-4" />} value={program.durationLabel} label="длительность" />
            <Stat icon={<Users className="w-4 h-4" />} value={program.animatorsLabel ?? `${program.animators}`} label="команда" />
            <Stat
              icon={<Baby className="w-4 h-4" />}
              value={program.maxKids === null ? "любое" : `до ${program.maxKids}`}
              label="детей"
            />
          </div>

          {/* Liquid Glass price tile */}
          <div
            className="mt-2 mx-auto w-[85%] rounded-2xl p-4 text-center relative overflow-hidden liquid-glass"
            style={{
              ['--lg-tint-a' as never]: `${accent}cc`,
              ['--lg-tint-b' as never]: "#8b5cf6cc",
              ['--lg-glow' as never]: `${accent}40`,
              backdropFilter: "blur(28px) saturate(180%)",
              WebkitBackdropFilter: "blur(28px) saturate(180%)",
            }}
          >
            {/* refraction highlights */}
            <span
              aria-hidden
              className="absolute -top-12 -left-10 w-32 h-32 rounded-full opacity-50 blur-2xl"
              style={{ background: "white" }}
            />
            <span
              aria-hidden
              className="absolute -bottom-16 -right-10 w-40 h-40 rounded-full opacity-30 blur-3xl"
              style={{ background: accent }}
            />
            <div className="relative" style={{ color: "white", textShadow: "0 2px 6px rgba(15,15,20,0.4)" }}>
              <div className="text-xs uppercase tracking-wider opacity-90 font-medium">
                Стоимость от
              </div>
              <div className="mt-1 text-3xl sm:text-4xl font-bold tracking-tight tabular-nums">
                {program.priceFrom.toLocaleString("ru-RU")} ₪
              </div>
              <Banknote className="w-5 h-5 mx-auto mt-1 opacity-90" strokeWidth={2.2} />
            </div>
          </div>

          {/* Includes — iOS list style */}
          <div className="mt-7">
            <h3 className="text-base font-semibold mb-3 px-1">Что входит</h3>
            {program.includesHighlight && (
              <div
                className="mb-3 rounded-2xl px-4 py-3 text-[15px] font-semibold"
                style={{
                  background: `linear-gradient(135deg, ${accent}1f, ${accent}0a)`,
                  border: `1px solid ${accent}40`,
                  color: "var(--color-ink)",
                }}
              >
                {program.includesHighlight}
              </div>
            )}
            <ul
              className="rounded-2xl overflow-hidden"
              style={{
                background: "rgba(255,255,255,0.55)",
                backdropFilter: "blur(20px) saturate(160%)",
                WebkitBackdropFilter: "blur(20px) saturate(160%)",
                border: "1px solid rgba(0,0,0,0.06)",
              }}
            >
              {[...program.includes, ...(program.bundled ?? [])].map((item, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 px-4 py-3 text-[15px]"
                  style={{
                    borderTop: i === 0 ? "none" : "0.5px solid rgba(0,0,0,0.08)",
                    color: "var(--color-ink)",
                  }}
                >
                  <Check
                    className="mt-0.5 w-[18px] h-[18px] shrink-0"
                    strokeWidth={2.5}
                    style={{ color: accent }}
                  />
                  <span className="leading-snug">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Bonus */}
          {program.bonus && (
            <div
              className="mt-5 rounded-2xl p-4 text-sm"
              style={{ background: `${accent}14`, color: "var(--color-ink)" }}
            >
              <span className="font-medium">Бонус: </span>
              {program.bonus}
            </div>
          )}

          {/* Hero slots */}
          {program.heroSlots.map((slot, slotIdx) => {
            const slotHeroes = sortHeroes(
              filterHeroes(
                heroes.filter((h) => h.kind === slot.kind),
                segment,
                languageFilter,
              ),
              segment,
            );
            if (slotHeroes.length === 0) return null;
            return (
              <HeroSlotPanel
                key={slotIdx}
                label={slot.label}
                heroes={slotHeroes}
                programName={program.title}
                accent={accent}
                defaultOpen={slotIdx === 0}
              />
            );
          })}

          {/* Videos */}
          {program.videos && program.videos.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {program.videos.map((url, i) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3.5 py-2 text-sm font-medium hover:bg-zinc-200"
                >
                  🎥 Смотреть видео {program.videos!.length > 1 ? `№${i + 1}` : ""}
                </a>
              ))}
            </div>
          )}

          {/* WhatsApp main CTA */}
          <a
            href={whatsappLink(WA_MESSAGES.program(program.title))}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-7 w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--color-whatsapp)] px-5 py-4 text-base font-semibold text-white shadow-lg transition active:scale-[0.98]"
          >
            💬 Написать менеджеру про эту программу
          </a>
        </div>
      </motion.div>

      {/* Floating navigation arrows — stay visible while scrolling modal */}
      {total > 1 && (
        <div className="pointer-events-none fixed inset-y-0 left-0 right-0 z-[60] flex items-center justify-between px-2 sm:px-5">
          <button
            type="button"
            aria-label="Предыдущая программа"
            disabled={!canGoPrevious}
            onClick={(e) => {
              e.stopPropagation();
              onNavigate(-1);
            }}
            className="pointer-events-auto flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-white/95 text-[var(--color-ink)] shadow-[0_10px_30px_rgba(0,0,0,0.25)] backdrop-blur transition active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
            title="Предыдущая программа"
          >
            <ChevronLeft className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={2.6} />
          </button>
          <button
            type="button"
            aria-label="Следующая программа"
            disabled={!canGoNext}
            onClick={(e) => {
              e.stopPropagation();
              onNavigate(1);
            }}
            className="pointer-events-auto flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-white/95 text-[var(--color-ink)] shadow-[0_10px_30px_rgba(0,0,0,0.25)] backdrop-blur transition active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
            title="Следующая программа"
          >
            <ChevronRight className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={2.6} />
          </button>
        </div>
      )}
    </motion.div>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="rounded-2xl bg-zinc-50 p-3 text-center">
      <div className="flex justify-center text-[var(--color-ink-soft)]">{icon}</div>
      <div className="mt-1.5 text-sm font-semibold leading-tight">{value}</div>
      <div className="mt-0.5 text-[11px] text-[var(--color-ink-soft)]">{label}</div>
    </div>
  );
}

function HeroSlotPanel({
  label,
  heroes,
  programName,
  accent,
  defaultOpen,
}: {
  label: string;
  heroes: Hero[];
  programName: string;
  accent: string;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mt-6 border border-[var(--color-line)] rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3.5 text-left bg-white hover:bg-zinc-50"
      >
        <span className="text-[15px] font-semibold">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--color-ink-soft)]">
            {heroes.length}
          </span>
          <ChevronDown
            className={`w-5 h-5 text-[var(--color-ink-soft)] transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>
      {open && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 p-3 bg-zinc-50/60">
          {heroes.map((h) => (
            <a
              key={h.id}
              href={whatsappLink(WA_MESSAGES.programWithHero(programName, h.name))}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-white pt-1 pb-2 px-1.5 text-center hover:shadow-md transition group"
            >
              <div
                className="w-full h-[88px] flex items-center justify-center"
                style={{ filter: `drop-shadow(0 4px 12px ${accent}40)` }}
              >
                {getHeroImage(h.id) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={getHeroImage(h.id)!}
                    alt={h.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="text-[44px] leading-none">{getHeroEmoji(h.id)}</span>
                )}
              </div>
              <div className="mt-0.5 text-[11px] leading-tight font-medium line-clamp-2 min-h-[28px] flex items-center justify-center">
                {h.name}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
