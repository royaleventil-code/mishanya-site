"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Baby, Banknote, Check, ChevronDown, ChevronLeft, ChevronRight, Clock, MapPin, Users, X } from "lucide-react";
import type { AudienceContext, FilterState, Hero, Program, SegmentId } from "@/lib/types";
import { filterHeroes, filterPrograms } from "@/lib/filtering";
import { sortHeroes } from "@/lib/heroOrder";
import { whatsappLink, WA_MESSAGES } from "@/lib/whatsapp";
import { ADDONS } from "@/data/addons";
import { getHeroEmoji, getHeroImage } from "@/data/heroes";

type Props = {
  segment: SegmentId;
  accent: string;
  programs: Program[];
  heroes: Hero[];
  audience?: AudienceContext;
};

type AddonItem = (typeof ADDONS)[number];
type HeroChoice = {
  label: string;
  hero: Hero;
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

function heroChoiceLabel(label: string): string {
  const normalized = label.toLowerCase();
  if (normalized.includes("ростовая")) return "Ростовая кукла";
  if (normalized.includes("ведущ") || normalized.includes("герой")) return "Образ для ведущего";
  return label;
}

export function ProgramsSection({ segment, accent, programs, heroes, audience }: Props) {
  const [filters, setFilters] = useState<FilterState>({
    kidsCount: null,
    location: null,
    language: null,
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [slideDirection, setSlideDirection] = useState<-1 | 1>(1);

  const visibleProgramsBase = useMemo(
    () => filterPrograms(programs, segment, { kidsCount: null, location: null, language: null }, audience),
    [programs, segment, audience],
  );
  const visiblePrograms = useMemo(
    () => filterPrograms(programs, segment, filters, audience),
    [programs, segment, filters, audience],
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
      if (nextProgram) {
        setSlideDirection(direction);
        setSelectedId(nextProgram.id);
      }
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
            audience={audience}
            languageFilter={filters.language}
            position={selectedIndex + 1}
            total={visiblePrograms.length}
            canGoPrevious={canGoPrevious}
            canGoNext={canGoNext}
            slideDirection={slideDirection}
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
        className={`relative z-20 w-full px-3 py-2.5 text-sm font-medium border transition active:scale-[0.97] flex items-center justify-between gap-1.5 ${
          open ? "rounded-t-2xl rounded-b-none" : "rounded-full"
        }`}
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
        <div className="absolute top-full left-0 right-0 -mt-px z-20 rounded-t-none rounded-b-2xl bg-white shadow-[0_16px_40px_rgba(15,15,20,0.15)] border border-t-0 border-[var(--color-line)] overflow-hidden">
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
  const indoorOnly = program.locations.length === 1 && program.locations[0] === "indoor";

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
            : { background: "linear-gradient(135deg, rgba(255,255,255,0.92), rgba(244,242,238,0.78))" }
        }
      >
        {!program.cover && (
          <>
            <div
              aria-hidden
              className="absolute inset-0 opacity-60 pointer-events-none"
              style={{
                background: "radial-gradient(circle at 50% 55%, rgba(255,255,255,0.82), transparent 65%)",
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
          <span className="relative z-10 text-7xl" style={{ filter: "drop-shadow(0 10px 28px rgba(15,15,20,0.12))" }}>
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

        {indoorOnly && (
          <div
            className="mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold"
            style={{ background: `${accent}14`, color: "var(--color-ink)" }}
          >
            <MapPin className="h-3.5 w-3.5" strokeWidth={2.4} />
            Только в помещении
          </div>
        )}

        <div className="mt-3 flex items-center justify-center flex-wrap gap-x-3 gap-y-2">
          {/* Price pill */}
          <div className="apple-glass inline-flex items-baseline gap-1 rounded-full px-3 py-1.5 text-sm font-bold text-[var(--color-ink)]">
            <span className="text-[10px] font-medium opacity-60">от</span>
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
          className="apple-glass-strong mt-4 inline-flex w-full items-center justify-center gap-1 rounded-full py-2.5 text-sm font-semibold text-[var(--color-ink)] transition group-hover:bg-white"
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
  audience,
  languageFilter,
  position,
  total,
  canGoPrevious,
  canGoNext,
  slideDirection,
  onNavigate,
  onClose,
}: {
  program: Program;
  accent: string;
  segment: SegmentId;
  heroes: Hero[];
  audience?: AudienceContext;
  languageFilter: FilterState["language"];
  position: number;
  total: number;
  canGoPrevious: boolean;
  canGoNext: boolean;
  slideDirection: -1 | 1;
  onNavigate: (direction: -1 | 1) => void;
  onClose: () => void;
}) {
  const APPLE_EASE = [0.32, 0.72, 0, 1] as const;
  const swipeStartRef = useRef<{ x: number; y: number; canClose: boolean } | null>(null);
  const closeTrackingCleanupRef = useRef<(() => void) | null>(null);
  const [selectedHeroByProgram, setSelectedHeroByProgram] = useState<Record<string, Record<number, Hero>>>({});
  const [selectedAddonIdsByProgram, setSelectedAddonIdsByProgram] = useState<Record<string, string[]>>({});
  const recommendedAddons =
    program.recommendedAddonIds
      ?.map((id) => ADDONS.find((addon) => addon.id === id))
      .filter((addon): addon is AddonItem => Boolean(addon)) ?? [];
  const selectedHeroBySlot = selectedHeroByProgram[program.id] ?? {};
  const selectedAddonIds = selectedAddonIdsByProgram[program.id] ?? [];
  const selectedHeroChoices = program.heroSlots
    .map((slot, slotIdx) => {
      const hero = selectedHeroBySlot[slotIdx];
      return hero ? { label: heroChoiceLabel(slot.label), hero } : null;
    })
    .filter((choice): choice is HeroChoice => Boolean(choice));
  const selectedAddons = recommendedAddons.filter((addon) => selectedAddonIds.includes(addon.id));
  const totalPriceFrom =
    program.priceFrom + selectedAddons.reduce((sum, addon) => sum + addon.priceFrom, 0);
  const hasCustomChoice = selectedHeroChoices.length > 0 || selectedAddons.length > 0;
  const indoorOnly = program.locations.length === 1 && program.locations[0] === "indoor";
  const orderMessage = WA_MESSAGES.programOrder({
    programName: program.title,
    durationLabel: program.durationLabel,
    heroChoices: selectedHeroChoices.map((choice) => ({
      label: choice.label,
      name: choice.hero.name,
    })),
    addons: selectedAddons.map((addon) => addon.name),
    totalPriceFrom,
  });

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
    // Horizontal swipe handled by framer-motion drag on the slide content (visual follow + spring)
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
      className="fixed inset-0 z-50 modal-backdrop bg-black/40 sm:flex sm:items-center sm:justify-center sm:p-6"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: APPLE_EASE }}
    >
      <motion.div
        className="relative w-full sm:max-w-2xl bg-white sm:rounded-3xl shadow-2xl h-[100dvh] sm:h-auto sm:max-h-[95vh] overflow-y-auto overflow-x-hidden"
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
        <AnimatePresence mode="sync" initial={false} custom={slideDirection}>
          <motion.div
            key={program.id}
            custom={slideDirection}
            variants={{
              enter: (dir: number) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0 }),
              center: { x: 0, opacity: 1 },
              exit: (dir: number) => ({ x: dir > 0 ? "-100%" : "100%", opacity: 0 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 280, damping: 30, mass: 0.9 },
              opacity: { duration: 0.18 },
            }}
            drag="x"
            dragDirectionLock
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.6}
            dragMomentum={false}
            onDragEnd={(_event, info) => {
              const offset = info.offset.x;
              const velocity = info.velocity.x;
              const swiped =
                Math.abs(offset) > 80 || Math.abs(velocity) > 500;
              if (!swiped) return;
              if (offset < 0 && canGoNext) onNavigate(1);
              else if (offset > 0 && canGoPrevious) onNavigate(-1);
            }}
            style={{ touchAction: "pan-y" }}
          >
        {/* Cover */}
        <div
          className="relative h-48 sm:h-64 flex items-center justify-center rounded-t-3xl overflow-hidden"
          style={
            program.cover
              ? { background: "white" }
              : { background: "linear-gradient(135deg, rgba(255,255,255,0.92), rgba(244,242,238,0.78))" }
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
            <span className="text-7xl sm:text-8xl" style={{ filter: "drop-shadow(0 8px 24px rgba(15,15,20,0.12))" }}>
              {program.emoji}
            </span>
          )}
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
          {(program.ruOnly || indoorOnly) && (
            <div className="mt-2 space-y-1 text-center text-xs font-semibold text-amber-600">
              {program.ruOnly && <p>1. Программа проводится только на русском языке</p>}
              {indoorOnly && (
                <p>{program.ruOnly ? "2" : "1"}. Программа проводится только в помещении</p>
              )}
            </div>
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

          {program.note && (
            <div
              className="mt-3 rounded-2xl p-4 text-sm"
              style={{ background: `${accent}14`, color: "var(--color-ink)" }}
            >
              <span className="font-medium">Важно: </span>
              {program.note}
            </div>
          )}

          {/* Glass price tile */}
          <div
            className="mt-2 mx-auto w-[85%] rounded-2xl p-4 text-center relative overflow-hidden liquid-glass"
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
              style={{ background: "rgba(226,223,218,0.72)" }}
            />
            <div className="relative text-[var(--color-ink)]">
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
                className="apple-glass mb-3 rounded-2xl px-4 py-3 text-[15px] font-semibold"
                style={{
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
            const excludedHeroIds = new Set(slot.excludedHeroIds ?? []);
            const slotHeroes = sortHeroes(
              filterHeroes(
                heroes.filter((h) => h.kind === slot.kind && !excludedHeroIds.has(h.id)),
                segment,
                languageFilter,
                slot.includedHeroIds,
                audience,
                slot.onlyHeroIds,
              ),
              segment,
              slot.orderedHeroIds,
            );
            if (slotHeroes.length === 0) return null;
            return (
              <HeroSlotPanel
                key={slotIdx}
                label={slot.label}
                heroes={slotHeroes}
                accent={accent}
                defaultOpen={slotIdx === 0}
                selectedHeroId={selectedHeroBySlot[slotIdx]?.id ?? null}
                onSelectHero={(hero) => {
                  setSelectedHeroByProgram((current) => {
                    const programHeroes = current[program.id] ?? {};
                    if (programHeroes[slotIdx]?.id === hero.id) {
                      const next = { ...programHeroes };
                      delete next[slotIdx];
                      return { ...current, [program.id]: next };
                    }
                    return { ...current, [program.id]: { ...programHeroes, [slotIdx]: hero } };
                  });
                }}
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

          {recommendedAddons.length > 0 && (
            <RecommendedAddonsPanel
              addons={recommendedAddons}
              accent={accent}
              selectedAddonIds={selectedAddonIds}
              onToggleAddon={(addonId) => {
                setSelectedAddonIdsByProgram((current) => {
                  const programAddonIds = current[program.id] ?? [];
                  const nextAddonIds = programAddonIds.includes(addonId)
                    ? programAddonIds.filter((id) => id !== addonId)
                    : [...programAddonIds, addonId];
                  return { ...current, [program.id]: nextAddonIds };
                });
              }}
            />
          )}

          {hasCustomChoice && (
            <ProgramChoiceSummary
              programName={program.title}
              durationLabel={program.durationLabel}
              heroChoices={selectedHeroChoices}
              addons={selectedAddons}
              totalPriceFrom={totalPriceFrom}
            />
          )}

          {/* WhatsApp main CTA */}
          <a
            href={whatsappLink(orderMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-7 w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--color-whatsapp)] px-5 py-4 text-base font-semibold text-white shadow-lg transition active:scale-[0.98]"
          >
            {hasCustomChoice
              ? "Написать менеджеру с этим выбором"
              : "Написать менеджеру про эту программу"}
          </a>
        </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Sticky drag handle — always visible at top, swipe down to close */}
      <div
        data-close-drag-handle
        role="button"
        tabIndex={0}
        aria-label="Закрыть"
        className="fixed left-1/2 top-2 z-[70] flex h-10 w-28 -translate-x-1/2 cursor-grab items-start justify-center rounded-full pt-2 active:cursor-grabbing"
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
        <span className="h-1.5 w-12 rounded-full bg-black/30 shadow-sm" />
      </div>

      {/* Sticky close button */}
      <button
        onClick={onClose}
        aria-label="Закрыть"
        className="fixed top-3 right-3 z-[70] w-10 h-10 rounded-full bg-white/95 hover:bg-white flex items-center justify-center shadow-md backdrop-blur transition"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Floating navigation arrows — vertically centered on cover area, stay visible on scroll */}
      {total > 1 && (
        <div className="pointer-events-none fixed left-0 right-0 z-[60] flex items-center justify-between px-2 sm:px-5 top-[120px] sm:top-1/2 sm:-translate-y-1/2">
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

function RecommendedAddonsPanel({
  addons,
  accent,
  selectedAddonIds,
  onToggleAddon,
}: {
  addons: AddonItem[];
  accent: string;
  selectedAddonIds: string[];
  onToggleAddon: (addonId: string) => void;
}) {
  return (
    <div className="apple-glass mt-6 rounded-3xl p-4">
      <div className="flex items-start gap-3">
        <div className="apple-glass-strong flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-lg font-semibold text-[var(--color-ink)]">
          +
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-bold leading-tight">Можно добавить к празднику</h3>
          <p className="mt-1 text-xs leading-snug text-[var(--color-ink-soft)]">
            Опции, которые хорошо подходят к этой программе
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {addons.map((addon) => {
          const selected = selectedAddonIds.includes(addon.id);
          return (
          <button
            key={addon.id}
            type="button"
            onClick={() => onToggleAddon(addon.id)}
            className="relative rounded-2xl bg-white p-3 text-center shadow-[0_10px_30px_rgba(15,15,20,0.06)] transition active:scale-[0.98] border"
            style={{
              borderColor: selected ? accent : "transparent",
              boxShadow: selected
                ? `0 0 0 2px ${accent}22, 0 14px 34px rgba(15,15,20,0.10)`
                : "0 10px 30px rgba(15,15,20,0.06)",
            }}
          >
            {selected && (
              <span
                className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full text-white"
                style={{ backgroundColor: accent }}
              >
                <Check className="h-4 w-4" strokeWidth={2.8} />
              </span>
            )}
            <div className="mx-auto flex h-20 items-center justify-center">
              {addon.icon ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={addon.icon}
                  alt={addon.name}
                  className="h-full w-full object-contain"
                />
              ) : (
                <span className="text-4xl">{addon.emoji}</span>
              )}
            </div>
            <div className="mt-2 min-h-[34px] text-[13px] font-bold leading-tight text-[var(--color-ink)]">
              {addon.name}
            </div>
            <div className="mt-1 text-xs font-medium text-[var(--color-ink-soft)]">
              от {addon.priceFrom.toLocaleString("ru-RU")} ₪
            </div>
          </button>
          );
        })}
      </div>
    </div>
  );
}

function ProgramChoiceSummary({
  programName,
  durationLabel,
  heroChoices,
  addons,
  totalPriceFrom,
}: {
  programName: string;
  durationLabel: string;
  heroChoices: HeroChoice[];
  addons: AddonItem[];
  totalPriceFrom: number;
}) {
  return (
    <div className="apple-glass mt-6 rounded-3xl p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-bold">Мой праздник</h3>
        <span className="apple-glass-strong rounded-full px-3 py-1 text-[11px] font-semibold text-[var(--color-ink)]">
          Выбрано
        </span>
      </div>

      <div className="mt-4 space-y-2.5 text-sm">
        <SummaryRow label="Программа" value={`${programName}, ${durationLabel}`} />
        {heroChoices.map((choice) => (
          <SummaryRow key={choice.hero.id} label={choice.label} value={choice.hero.name} />
        ))}
        {addons.length > 0 && (
          <SummaryRow
            label={addons.length === 1 ? "Дополнительная опция" : "Дополнительные опции"}
            value={addons.map((addon) => addon.name).join(", ")}
          />
        )}
        <div className="apple-glass-strong flex items-center justify-between gap-3 rounded-2xl px-3 py-2.5 text-[var(--color-ink)]">
          <span className="text-xs font-medium opacity-70">Итого</span>
          <span className="text-base font-bold tabular-nums">
            от {totalPriceFrom.toLocaleString("ru-RU")} ₪
          </span>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl bg-white/75 px-3 py-2.5 shadow-sm">
      <span className="text-xs font-medium leading-snug text-[var(--color-ink-soft)]">
        {label}
      </span>
      <span className="max-w-[58%] text-right text-sm font-bold leading-snug text-[var(--color-ink)]">
        {value}
      </span>
    </div>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="apple-glass rounded-2xl p-3 text-center">
      <div className="flex justify-center text-[var(--color-ink-soft)]">{icon}</div>
      <div className="mt-1.5 text-sm font-semibold leading-tight">{value}</div>
      <div className="mt-0.5 text-[11px] text-[var(--color-ink-soft)]">{label}</div>
    </div>
  );
}

function HeroSlotPanel({
  label,
  heroes,
  accent,
  defaultOpen,
  selectedHeroId,
  onSelectHero,
}: {
  label: string;
  heroes: Hero[];
  accent: string;
  defaultOpen: boolean;
  selectedHeroId: string | null;
  onSelectHero: (hero: Hero) => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const selectedHero = heroes.find((hero) => hero.id === selectedHeroId);
  return (
    <div className="mt-6 border border-[var(--color-line)] rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3.5 text-left bg-white hover:bg-zinc-50"
      >
        <span className="text-[15px] font-semibold">{label}</span>
        <div className="flex items-center gap-2">
          <span
            className="max-w-[150px] truncate text-xs font-medium"
            style={selectedHero ? { color: accent } : undefined}
          >
            {selectedHero?.name ?? heroes.length}
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
          {heroes.map((h) => {
            const selected = selectedHeroId === h.id;
            return (
            <button
              key={h.id}
              type="button"
              onClick={() => onSelectHero(h)}
              className="relative rounded-xl bg-white pt-1 pb-2 px-1.5 text-center hover:shadow-md transition group border"
              style={{
                borderColor: selected ? accent : "transparent",
                boxShadow: selected
                  ? `0 0 0 2px ${accent}22, 0 10px 24px rgba(15,15,20,0.10)`
                  : undefined,
              }}
            >
              {selected && (
                <span
                  className="absolute right-1.5 top-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full text-white"
                  style={{ backgroundColor: accent }}
                >
                  <Check className="h-3.5 w-3.5" strokeWidth={2.8} />
                </span>
              )}
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
            </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
