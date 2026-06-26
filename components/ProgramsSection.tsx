"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, animate, motion, useMotionValue } from "framer-motion";
import { Banknote, Check, ChevronDown, ChevronLeft, ChevronRight, Clock, MapPin, MessageCircle, Users, X } from "lucide-react";
import { BidiText } from "@/components/BidiText";
import type { Addon, AudienceContext, Hero, Program, SegmentId } from "@/lib/types";
import { filterHeroes, filterPrograms } from "@/lib/filtering";
import { sortHeroes } from "@/lib/heroOrder";
import { getDictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/i18n";
import { getLocalizedAddons } from "@/lib/localized-data";
import { getWhatsAppMessages, whatsappLink } from "@/lib/whatsapp";
import { formatProgramPriceLabel, formatShekelPrice, hasStartingPrice } from "@/lib/prices";
import { getHeroEmoji, getHeroImage } from "@/data/heroes";

type Props = {
  locale?: Locale;
  segment: SegmentId;
  accent: string;
  programs: Program[];
  heroes: Hero[];
  audience?: AudienceContext;
};

type AddonItem = Addon;
type HeroChoice = {
  label: string;
  hero: Hero;
};

type ProgramMoodConfig = {
  tint: string;
  glow: string;
  accent: string;
  marks: string[];
};

const PROGRAM_MOODS: Record<string, ProgramMoodConfig> = {
  chemistry: {
    tint: "rgba(20, 184, 166, 0.24)",
    glow: "rgba(16, 185, 129, 0.34)",
    accent: "#14b8a6",
    marks: ["●", "○", "✦"],
  },
  neon: {
    tint: "rgba(168, 85, 247, 0.28)",
    glow: "rgba(34, 211, 238, 0.32)",
    accent: "#a855f7",
    marks: ["—", "✦", "—"],
  },
  "harry-potter": {
    tint: "rgba(245, 158, 11, 0.24)",
    glow: "rgba(124, 58, 237, 0.24)",
    accent: "#f59e0b",
    marks: ["✦", "✧", "✦"],
  },
  "super-heroes": {
    tint: "rgba(37, 99, 235, 0.24)",
    glow: "rgba(239, 68, 68, 0.28)",
    accent: "#2563eb",
    marks: ["▰", "▱", "▰"],
  },
  kpop: {
    tint: "rgba(236, 72, 153, 0.24)",
    glow: "rgba(99, 102, 241, 0.28)",
    accent: "#ec4899",
    marks: ["♪", "✦", "♪"],
  },
  tiktok: {
    tint: "rgba(6, 182, 212, 0.24)",
    glow: "rgba(244, 63, 94, 0.28)",
    accent: "#06b6d4",
    marks: ["♪", "↗", "♪"],
  },
  foam: {
    tint: "rgba(125, 211, 252, 0.26)",
    glow: "rgba(45, 212, 191, 0.28)",
    accent: "#0ea5e9",
    marks: ["○", "●", "○"],
  },
};

const GIRL_COSTUME_HERO_IDS = {
  young: [
    "elsa",
    "sky",
    "unicorn",
    "ladybug",
    "lol-bee",
    "lol-unicorn",
    "stitch",
    "pj-owlette",
    "minnie-mouse",
    "fixiki-girl",
    "mashenka",
    "anna",
    "barbie",
    "kpop-rumi",
    "mermaid",
    "troll-poppy",
    "rapunzel",
    "cat-noir",
    "popit-girl",
    "tinker-bell",
    "pj-gekko",
    "racer",
    "troll-branch",
    "fixiki-boy",
  ],
  middle: [
    "elsa",
    "sky",
    "unicorn",
    "minnie-mouse",
    "stitch",
    "lol-bee",
    "kpop-rumi",
    "kpop-mira",
    "kpop-zoey",
    "wednesday",
    "barbie",
    "ladybug",
    "lol-unicorn",
    "pj-owlette",
    "anna",
    "fixiki-girl",
    "rapunzel",
    "minecraft-girl",
    "mashenka",
    "mermaid",
    "cat-noir",
    "popit-girl",
    "troll-poppy",
    "tinker-bell",
    "racer",
    "dinosaur",
    "pj-catboy",
    "troll-branch",
    "fixiki-boy",
  ],
  older: [
    "kpop-rumi",
    "kpop-mira",
    "kpop-zoey",
    "tiktoker-girl",
    "wednesday",
    "minecraft-girl",
    "elsa",
    "stitch",
    "unicorn",
    "barbie",
    "minnie-mouse",
    "lol-bee",
    "sky",
    "pj-owlette",
    "anna",
    "ladybug",
    "lol-unicorn",
    "popit-girl",
    "mermaid",
    "harry-potter",
    "hermione",
    "dinosaur",
    "marvel",
    "mickey-mouse",
    "tiktoker-boy",
  ],
} as const;

const GIRL_MASCOT_HERO_IDS = {
  young: [
    "unicorn-mascot",
    "bunny",
    "olaf",
    "marshall-mascot",
    "lol-unicorn-mascot",
    "lol-bee-mascot",
    "mickey-mouse-mascot",
    "minnie-mouse-mascot",
    "stitch-mascot",
    "sonic-mascot",
    "tom-and-jerry",
    "minion",
    "masha-bear-inflatable",
    "nu-pogodi-wolf-hare",
  ],
  middle: [
    "unicorn-mascot",
    "lol-unicorn-mascot",
    "lol-bee-mascot",
    "marshall-mascot",
    "olaf",
    "bunny",
    "stitch-mascot",
    "kissy-missy",
    "labubu",
    "minnie-mouse-mascot",
    "tom-and-jerry",
    "minion",
    "sonic-mascot",
    "dj-marshmello",
    "mickey-mouse-mascot",
    "masha-bear-inflatable",
  ],
  older: [
    "dj-marshmello",
    "unicorn-mascot",
    "bunny",
    "kissy-missy",
    "labubu",
    "lol-unicorn-mascot",
    "lol-bee-mascot",
    "marshall-mascot",
    "stitch-mascot",
    "minnie-mouse-mascot",
    "olaf",
    "pikachu-mascot",
    "sonic-mascot",
    "mickey-mouse-mascot",
    "huggy-wuggy-mascot",
  ],
} as const;

function formatPrice(price: number, locale: Locale): string {
  return formatShekelPrice(price, locale);
}

function programPriceLabel(program: Program, locale: Locale, amount = program.priceFrom): string {
  return formatProgramPriceLabel(program.id, amount, locale);
}

function programPriceDisplayParts(programId: string, amount: number, locale: Locale): { prefix: string; price: string } {
  const price = formatPrice(amount, locale);
  return {
    prefix: hasStartingPrice(programId) ? (locale === "he" ? "החל מ־" : "от ") : "",
    price,
  };
}

function programPriceCtaParts(program: Program, amount: number, locale: Locale): { prefix: string; price: string } {
  const price = formatPrice(amount, locale);
  if (locale === "he") {
    return {
      prefix: hasStartingPrice(program.id) ? "החל מ־" : "ב־",
      price,
    };
  }
  return {
    prefix: hasStartingPrice(program.id) ? "от " : "за ",
    price,
  };
}

function ageLabel(age: number, locale: Locale): string {
  if (locale === "he") return String(age);
  if (age === 1) return "1 год";
  if (age >= 2 && age <= 4) return `${age} года`;
  return `${age} лет`;
}

type AudienceIntro = {
  lead: string;
  body: string;
};

function audienceMessageValue(locale: Locale, audience?: AudienceContext): string | undefined {
  if (!audience?.age || !audience.gender) return undefined;
  const labels = getDictionary(locale).catalog.labels;
  return `${audience.gender === "boy" ? labels.boyAudience : labels.girlAudience} ${ageLabel(audience.age, locale)}`;
}

function audienceIntroText(locale: Locale, audience?: AudienceContext): AudienceIntro {
  const catalog = getDictionary(locale).catalog;
  if (audience?.age && audience.gender) {
    const copy = catalog.ageIntros[audience.gender][audience.age];
    if (copy) return copy;
  }

  return catalog.fallbackIntro;
}

function getProgramIdFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("program")?.trim() || null;
}

function syncProgramIdToUrl(programId: string | null, mode: "push" | "replace") {
  if (typeof window === "undefined") return;

  const url = new URL(window.location.href);
  if (programId) {
    url.searchParams.set("program", programId);
  } else {
    url.searchParams.delete("program");
  }

  const nextUrl = `${url.pathname}${url.search}${url.hash}`;
  const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (nextUrl === currentUrl) return;

  if (mode === "push") {
    window.history.pushState(window.history.state, "", nextUrl);
  } else {
    window.history.replaceState(window.history.state, "", nextUrl);
  }
}

function heroChoiceLabel(label: string, locale: Locale): string {
  const labels = getDictionary(locale).catalog.labels;
  const normalized = label.toLowerCase();
  if (locale === "he") {
    if (normalized.includes("בובת")) return labels.mascotChoice;
    if (normalized.includes("דמות")) return labels.costumeChoice;
    return label;
  }
  if (normalized.includes("ростовая")) return labels.mascotChoice;
  if (normalized.includes("ведущ") || normalized.includes("герой")) return labels.costumeChoice;
  return label;
}

function girlAgeGroup(audience?: AudienceContext): keyof typeof GIRL_COSTUME_HERO_IDS | null {
  if (audience?.gender !== "girl" || typeof audience.age !== "number") return null;
  if (audience.age >= 1 && audience.age <= 3) return "young";
  if (audience.age >= 4 && audience.age <= 6) return "middle";
  if (audience.age >= 7 && audience.age <= 10) return "older";
  return null;
}

function girlHeroIdsForSlot(
  audience: AudienceContext | undefined,
  kind: Hero["kind"],
): string[] | null {
  const ageGroup = girlAgeGroup(audience);
  if (!ageGroup) return null;
  return [...(kind === "costume" ? GIRL_COSTUME_HERO_IDS[ageGroup] : GIRL_MASCOT_HERO_IDS[ageGroup])];
}

function matchesAudienceCover(
  rule: NonNullable<Program["audienceCovers"]>[number],
  segment: SegmentId,
  audience?: AudienceContext,
): boolean {
  if (rule.segment && rule.segment !== segment) return false;
  if (rule.gender && rule.gender !== audience?.gender) return false;
  if (rule.age !== undefined && rule.age !== audience?.age) return false;
  if (rule.minAge !== undefined && (audience?.age === undefined || audience.age < rule.minAge)) {
    return false;
  }
  if (rule.maxAge !== undefined && (audience?.age === undefined || audience.age > rule.maxAge)) {
    return false;
  }
  return true;
}

function getProgramCover(
  program: Program,
  segment: SegmentId,
  audience?: AudienceContext,
): string | undefined {
  return (
    program.audienceCovers?.find((rule) => matchesAudienceCover(rule, segment, audience))?.cover ??
    program.cover
  );
}

export function ProgramsSection({ locale = "ru", segment, accent, programs, heroes, audience }: Props) {
  const dict = getDictionary(locale);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [slideDirection, setSlideDirection] = useState<-1 | 1>(1);
  const [modalRoot] = useState<HTMLElement | null>(() =>
    typeof document === "undefined" ? null : document.body,
  );
  const audienceIntro = audienceIntroText(locale, audience);

  const visiblePrograms = useMemo(
    () => filterPrograms(programs, segment, { kidsCount: null, location: null, language: null }, audience),
    [programs, segment, audience],
  );

  const selectedIndex = selectedId
    ? visiblePrograms.findIndex((p) => p.id === selectedId)
    : -1;
  const selectedProgram = selectedId
    ? visiblePrograms[selectedIndex] ?? programs.find((p) => p.id === selectedId) ?? null
    : null;
  const selectedPosition = selectedIndex >= 0 ? selectedIndex + 1 : undefined;
  const canGoPrevious = selectedIndex > 0;
  const canGoNext = selectedIndex >= 0 && selectedIndex < visiblePrograms.length - 1;

  useEffect(() => {
    const syncSelectedProgramFromUrl = () => setSelectedId(getProgramIdFromUrl());
    const timer = window.setTimeout(syncSelectedProgramFromUrl, 0);
    window.addEventListener("popstate", syncSelectedProgramFromUrl);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("popstate", syncSelectedProgramFromUrl);
    };
  }, []);

  const openProgram = useCallback((programId: string) => {
    syncProgramIdToUrl(programId, "push");
    setSelectedId(programId);
  }, []);

  const closeProgram = useCallback(() => {
    syncProgramIdToUrl(null, "replace");
    setSelectedId(null);
  }, []);

  const navigateProgram = useCallback(
    (direction: -1 | 1) => {
      if (!selectedId) return;
      const index = visiblePrograms.findIndex((p) => p.id === selectedId);
      const nextProgram = visiblePrograms[index + direction];
      if (nextProgram) {
        setSlideDirection(direction);
        syncProgramIdToUrl(nextProgram.id, "replace");
        setSelectedId(nextProgram.id);
      }
    },
    [selectedId, visiblePrograms],
  );

  useEffect(() => {
    if (!selectedProgram) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedId(null);
      if (e.key === "ArrowLeft") navigateProgram(locale === "he" ? 1 : -1);
      if (e.key === "ArrowRight") navigateProgram(locale === "he" ? -1 : 1);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [locale, navigateProgram, selectedProgram]);

  return (
    <section className="mx-auto max-w-3xl px-5 sm:px-6 pb-10">
      {audience?.age && audience.gender && (
        <div className="mt-5 rounded-3xl bg-white px-5 py-4 text-center text-[15px] leading-7 shadow-[var(--shadow-card)] ring-1 ring-black/[0.04] sm:text-base">
          <span className="block font-black"><BidiText locale={locale}>{audienceIntro.lead}</BidiText></span>
          <span className="mt-1 block text-[var(--color-ink-soft)]"><BidiText locale={locale}>{audienceIntro.body}</BidiText></span>
        </div>
      )}

      {/* Programs grid */}
      <div className="mt-8 grid sm:grid-cols-2 gap-4">
        {visiblePrograms.map((p) => (
          <ProgramCard
            key={p.id}
            program={p}
            locale={locale}
            accent={accent}
            segment={segment}
            audience={audience}
            onOpen={() => openProgram(p.id)}
          />
        ))}
        {visiblePrograms.length === 0 && (
          <div className="sm:col-span-2 text-center py-12 text-[var(--color-ink-soft)] text-sm">
            {dict.catalog.labels.noPrograms}
          </div>
        )}
      </div>

      {modalRoot &&
        createPortal(
          <AnimatePresence>
            {selectedProgram && (
              <ProgramModal
                key="program-modal"
                program={selectedProgram}
                locale={locale}
                accent={accent}
                segment={segment}
                heroes={heroes}
                audience={audience}
                position={selectedPosition}
                total={visiblePrograms.length}
                canGoPrevious={canGoPrevious}
                canGoNext={canGoNext}
                slideDirection={slideDirection}
                onNavigate={navigateProgram}
                onClose={closeProgram}
              />
            )}
          </AnimatePresence>,
          modalRoot,
        )}
    </section>
  );
}

// ---------- ProgramCard ----------

function ProgramCard({
  program,
  locale,
  accent,
  segment,
  audience,
  onOpen,
}: {
  program: Program;
  locale: Locale;
  accent: string;
  segment: SegmentId;
  audience?: AudienceContext;
  onOpen: () => void;
}) {
  const dict = getDictionary(locale);
  const indoorOnly = program.locations.length === 1 && program.locations[0] === "indoor";
  const cover = getProgramCover(program, segment, audience);
  const priceParts = programPriceDisplayParts(program.id, program.priceFrom, locale);
  const isVipProgram = program.id === "mishanya";

  return (
    <button
      onClick={onOpen}
      className={`group text-start rounded-[28px] bg-white overflow-hidden shadow-[0_16px_40px_rgba(15,15,20,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_60px_rgba(15,15,20,0.12)] focus:outline-none focus:ring-2 ${isVipProgram ? "vip-program-card" : ""}`}
      style={{ ['--tw-ring-color' as never]: accent }}
    >
      {/* Cover */}
      <div
        className="relative aspect-[4/3] flex items-center justify-center overflow-hidden"
        style={
          cover
            ? { background: "white" }
            : { background: "linear-gradient(135deg, rgba(255,255,255,0.92), rgba(244,242,238,0.78))" }
        }
      >
        {!cover && (
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

        {cover ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={cover}
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
            {dict.catalog.labels.ruOnlyBadge}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-5 text-center">
        <h3 className="text-xl font-bold tracking-tight"><BidiText locale={locale}>{program.title}</BidiText></h3>
        {program.tagline && (
          <p className="mt-0.5 text-xs text-[var(--color-ink-soft)] line-clamp-2">
            <BidiText locale={locale}>{program.tagline}</BidiText>
          </p>
        )}

        {indoorOnly && (
          <div
            className="mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold"
            style={{ background: `${accent}14`, color: "var(--color-ink)" }}
          >
            <MapPin className="h-3.5 w-3.5" strokeWidth={2.4} />
            {dict.catalog.labels.indoorOnly}
          </div>
        )}

        <div className="mt-2 flex items-center justify-center flex-wrap gap-x-2 gap-y-1.5">
          {/* Price pill */}
          <div className="apple-glass inline-flex items-baseline rounded-full px-3 py-1.5 text-sm font-bold text-[var(--color-ink)]" dir={locale === "he" ? undefined : "ltr"}>
            {locale === "he" ? (
              <>
                {priceParts.prefix && <span>{priceParts.prefix}</span>}
                <bdi dir="ltr" className="whitespace-nowrap">
                  {priceParts.price}
                </bdi>
              </>
            ) : (
              programPriceLabel(program, locale)
            )}
          </div>

          <span className="inline-flex items-center gap-1 text-xs text-[var(--color-ink-soft)]">
            <Clock className="w-3.5 h-3.5" strokeWidth={2.2} />
            <BidiText locale={locale}>{program.durationLabel}</BidiText>
          </span>

          <span className="inline-flex items-center gap-1 text-xs text-[var(--color-ink-soft)]">
            <Users className="w-3.5 h-3.5" strokeWidth={2.2} />
            <BidiText locale={locale}>{program.maxKids === null ? dict.catalog.labels.unlimitedKids : dict.catalog.labels.upToKids(program.maxKids)}</BidiText>
          </span>
        </div>

        <div
          className="apple-glass-strong mt-4 inline-flex w-full items-center justify-center gap-1 rounded-full py-2.5 text-sm font-semibold text-[var(--color-ink)] transition group-hover:bg-white"
        >
          {dict.catalog.labels.details}
          <span className={`transition ${locale === "he" ? "group-hover:-translate-x-0.5" : "group-hover:translate-x-0.5"}`}>
            {dict.catalog.labels.detailsArrow}
          </span>
        </div>
      </div>
    </button>
  );
}

// ---------- ProgramModal ----------

function ProgramModal({
  program,
  locale,
  accent,
  segment,
  heroes,
  audience,
  position,
  total,
  canGoPrevious,
  canGoNext,
  slideDirection,
  onNavigate,
  onClose,
}: {
  program: Program;
  locale: Locale;
  accent: string;
  segment: SegmentId;
  heroes: Hero[];
  audience?: AudienceContext;
  position?: number;
  total: number;
  canGoPrevious: boolean;
  canGoNext: boolean;
  slideDirection: -1 | 1;
  onNavigate: (direction: -1 | 1) => void;
  onClose: () => void;
}) {
  const dict = getDictionary(locale);
  const waMessages = getWhatsAppMessages(locale);
  const addons = getLocalizedAddons(locale);
  const APPLE_EASE = [0.32, 0.72, 0, 1] as const;
  const swipeStartRef = useRef<{ x: number; y: number; canClose: boolean } | null>(null);
  const closeTrackingCleanupRef = useRef<(() => void) | null>(null);
  const pullCloseTimeoutRef = useRef<number | null>(null);
  const modalY = useMotionValue(0);
  const [selectedHeroByProgram, setSelectedHeroByProgram] = useState<Record<string, Record<number, Hero>>>({});
  const [selectedAddonIdsByProgram, setSelectedAddonIdsByProgram] = useState<Record<string, string[]>>({});
  const recommendedAddons =
    program.recommendedAddonIds
      ?.map((id) => addons.find((addon) => addon.id === id))
      .filter((addon): addon is AddonItem => Boolean(addon)) ?? [];
  const cover = getProgramCover(program, segment, audience);
  const selectedHeroBySlot = selectedHeroByProgram[program.id] ?? {};
  const selectedAddonIds = selectedAddonIdsByProgram[program.id] ?? [];
  const selectedHeroChoices = program.heroSlots
    .map((slot, slotIdx) => {
      const hero = selectedHeroBySlot[slotIdx];
      return hero ? { label: heroChoiceLabel(slot.label, locale), hero } : null;
    })
    .filter((choice): choice is HeroChoice => Boolean(choice));
  const selectedAddons = recommendedAddons.filter((addon) => selectedAddonIds.includes(addon.id));
  const totalPriceFrom =
    program.priceFrom + selectedAddons.reduce((sum, addon) => sum + addon.priceFrom, 0);
  const hasCustomChoice = selectedHeroChoices.length > 0 || selectedAddons.length > 0;
  const indoorOnly = program.locations.length === 1 && program.locations[0] === "indoor";
  const orderMessage = waMessages.programOrder({
    programId: program.id,
    programName: program.title,
    durationLabel: program.durationLabel,
    heroChoices: selectedHeroChoices.map((choice) => ({
      label: choice.label,
      name: choice.hero.name,
    })),
    addons: selectedAddons.map((addon) => addon.name),
    totalPriceFrom,
    audienceLabel: audienceMessageValue(locale, audience),
  });
  const ctaPriceParts = programPriceCtaParts(program, totalPriceFrom, locale);
  const ctaPriceLabel = `${ctaPriceParts.prefix}${ctaPriceParts.price}`;
  const ctaLabel = dict.catalog.labels.writeAboutProgram(program.title, ctaPriceLabel);
  const ctaTextPrefix =
    locale === "he" && ctaLabel.endsWith(ctaPriceLabel)
      ? `${ctaLabel.slice(0, -ctaPriceLabel.length)}${ctaPriceParts.prefix}`
      : null;
  const mood = PROGRAM_MOODS[program.id];
  const isVipProgram = program.id === "mishanya";

  useEffect(() => {
    return () => {
      closeTrackingCleanupRef.current?.();
      if (pullCloseTimeoutRef.current !== null) window.clearTimeout(pullCloseTimeoutRef.current);
    };
  }, []);

  const closeThreshold = () => window.innerHeight * 0.15;

  const settlePull = () => {
    animate(modalY, 0, { type: "spring", stiffness: 420, damping: 34, mass: 0.8 });
  };

  const closeWithPull = () => {
    if (pullCloseTimeoutRef.current !== null) return;
    animate(modalY, window.innerHeight, { duration: 0.24, ease: APPLE_EASE });
    pullCloseTimeoutRef.current = window.setTimeout(onClose, 180);
  };

  const startCloseTracking = (startY: number) => {
    closeTrackingCleanupRef.current?.();

    let closed = false;
    const cleanupListeners = () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", finish);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", finish);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", finish);
      window.removeEventListener("touchcancel", finish);
      closeTrackingCleanupRef.current = null;
    };

    const finish = () => {
      cleanupListeners();
      if (!closed) settlePull();
    };

    const updatePull = (clientY: number) => {
      if (closed) return;
      const dy = clientY - startY;
      if (dy <= 0) {
        modalY.set(0);
        return;
      }
      modalY.set(Math.min(dy, window.innerHeight));
      if (dy <= closeThreshold()) return;
      closed = true;
      cleanupListeners();
      closeWithPull();
    };

    function onPointerMove(event: PointerEvent) {
      updatePull(event.clientY);
    }

    function onMouseMove(event: MouseEvent) {
      updatePull(event.clientY);
    }

    function onTouchMove(event: TouchEvent) {
      const touch = event.touches[0];
      if (touch) updatePull(touch.clientY);
    }

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", finish);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", finish);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", finish);
    window.addEventListener("touchcancel", finish);
    closeTrackingCleanupRef.current = finish;
  };

  const startSwipe = (target: EventTarget, container: HTMLDivElement, x: number, y: number) => {
    const targetElement = target as HTMLElement;
    const isCloseHandle = !!targetElement.closest("[data-close-drag-handle]");
    const isTopDragZone = y - container.getBoundingClientRect().top <= 96;
    const isAtScrollTop = container.scrollTop <= 2;
    if (targetElement.closest("a")) return;
    if (targetElement.closest("button") && !isCloseHandle) return;
    swipeStartRef.current = { x, y, canClose: isCloseHandle || isTopDragZone || isAtScrollTop };
  };

  const moveSwipe = (x: number, y: number) => {
    const start = swipeStartRef.current;
    if (!start?.canClose) return;
    const dx = x - start.x;
    const dy = y - start.y;
    const isDownClose = dy > 8 && Math.abs(dy) > Math.abs(dx) * 1.0;
    if (!isDownClose) return;

    modalY.set(Math.min(dy, window.innerHeight));
    if (dy <= closeThreshold()) return;
    swipeStartRef.current = null;
    closeWithPull();
  };

  const endSwipe = (x: number, y: number) => {
    const start = swipeStartRef.current;
    swipeStartRef.current = null;
    if (!start) return;

    const dx = x - start.x;
    const dy = y - start.y;
    const isDownClose = start.canClose && dy > 8 && Math.abs(dy) > Math.abs(dx) * 1.0;
    if (isDownClose) {
      if (dy > closeThreshold()) closeWithPull();
      else settlePull();
      return;
    }
    settlePull();
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
        role="dialog"
        aria-modal="true"
        aria-label={dict.catalog.labels.modalAria(program.title)}
        className={`relative w-full sm:max-w-2xl bg-white sm:rounded-3xl shadow-2xl h-[100dvh] sm:h-auto sm:max-h-[95vh] overflow-y-auto overflow-x-hidden overscroll-y-contain ${isVipProgram ? "vip-program-card vip-program-modal" : ""}`}
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
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.32, ease: APPLE_EASE }}
        style={{ y: modalY }}
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
              if (locale === "he") {
                if (offset < 0 && canGoPrevious) onNavigate(-1);
                else if (offset > 0 && canGoNext) onNavigate(1);
              } else {
                if (offset < 0 && canGoNext) onNavigate(1);
                else if (offset > 0 && canGoPrevious) onNavigate(-1);
              }
            }}
            style={{ touchAction: "pan-y" }}
          >
        {/* Cover */}
        <div
          className="relative h-48 sm:h-64 flex items-center justify-center rounded-t-3xl overflow-hidden"
          style={
            cover
              ? { background: "white" }
              : { background: "linear-gradient(135deg, rgba(255,255,255,0.92), rgba(244,242,238,0.78))" }
          }
        >
          {cover ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={cover}
              alt={program.title}
              className="w-full h-full object-cover"
              style={{ objectPosition: "center 30%" }}
            />
          ) : (
            <span className="text-7xl sm:text-8xl" style={{ filter: "drop-shadow(0 8px 24px rgba(15,15,20,0.12))" }}>
              {program.emoji}
            </span>
          )}
          <ProgramMoodLayer mood={mood} label={dict.catalog.moods[program.id]} />
        </div>

        <div className="p-5 pb-28 sm:p-7 sm:pb-7">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-center">
            <BidiText locale={locale}>{program.title}</BidiText>
          </h2>
          {program.tagline && (
            <p className="mt-1 text-sm text-[var(--color-ink-soft)] text-center">
              <BidiText locale={locale}>{program.tagline}</BidiText>
            </p>
          )}
          {total > 1 && position !== undefined && (
            <p className="mt-2 text-center text-xs font-medium tabular-nums text-[var(--color-ink-soft)]">
              {position} / {total}
            </p>
          )}
          {(program.ruOnly || indoorOnly) && (
            <div className="mt-2 space-y-1 text-center text-xs font-semibold text-amber-600">
              {program.ruOnly && <p>{dict.catalog.labels.ruOnlyNotice}</p>}
              {indoorOnly && <p>{dict.catalog.labels.indoorNotice}</p>}
            </div>
          )}

          {/* Stat tiles */}
          <div className="mt-5 grid grid-cols-3 gap-2">
            <Stat locale={locale} icon={<Clock className="w-4 h-4" />} value={program.durationLabel} label={dict.catalog.labels.duration} />
            <Stat locale={locale} icon={<Users className="w-4 h-4" />} value={program.animatorsLabel ?? `${program.animators}`} label={dict.catalog.labels.team} />
            <Stat
              locale={locale}
              icon={<Users className="w-4 h-4" />}
              value={program.maxKids === null ? dict.catalog.labels.unlimitedKids : dict.catalog.labels.upToKids(program.maxKids)}
              label={program.maxKids === null ? "" : dict.catalog.labels.kids}
            />
          </div>

          {program.note && (
            <div
              className="mt-3 rounded-2xl p-4 text-sm"
              style={{ background: `${accent}14`, color: "var(--color-ink)" }}
            >
              <span className="font-medium">{dict.catalog.labels.important}</span>
              <BidiText locale={locale}>{program.note}</BidiText>
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
                {hasStartingPrice(program.id) ? dict.catalog.labels.priceFrom : dict.catalog.labels.price}
              </div>
              <div className="mt-1 flex min-h-[40px] items-center justify-center text-3xl font-bold tracking-tight tabular-nums sm:min-h-[48px] sm:text-4xl" dir="ltr">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={totalPriceFrom}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.16, ease: APPLE_EASE }}
                  >
                    {formatPrice(totalPriceFrom, locale)}
                  </motion.span>
                </AnimatePresence>
              </div>
              <p className="mx-auto mt-2 max-w-[320px] text-xs font-medium leading-snug text-[var(--color-muted)]">
                {dict.catalog.labels.priceCityNote}
              </p>
              <Banknote className="w-5 h-5 mx-auto mt-1 opacity-90" strokeWidth={2.2} />
            </div>
          </div>

          {/* Includes — iOS list style */}
          <div className="mt-7">
            <h3 className="text-base font-semibold mb-3 px-1">{dict.catalog.labels.includes}</h3>
            {program.includesHighlight && (
              <div
                className="apple-glass mb-3 rounded-2xl px-4 py-3 text-[15px] font-semibold"
                style={{
                  color: "var(--color-ink)",
                }}
              >
                <BidiText locale={locale}>{program.includesHighlight}</BidiText>
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
                  <span className="leading-snug"><BidiText locale={locale}>{item}</BidiText></span>
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
              <span className="font-medium">{dict.catalog.labels.bonus}</span>
              <BidiText locale={locale}>{program.bonus}</BidiText>
            </div>
          )}

          {/* Hero slots */}
          {program.heroSlots.map((slot, slotIdx) => {
            const defaultOpen = slot.kind === "mascot" || slotIdx === 0;
            const explicitHeroIds = new Set([
              ...(slot.includedHeroIds ?? []),
              ...(slot.onlyHeroIds ?? []),
            ]);
            const hasSlotOnlyHeroIds = Boolean(slot.onlyHeroIds?.length);
            const useUniversalHeroPool =
              segment === "all" && !audience?.gender && !slot.onlyHeroIds?.length;
            const girlHeroIds = useUniversalHeroPool ? null : girlHeroIdsForSlot(audience, slot.kind);
            const onlyHeroIds = hasSlotOnlyHeroIds ? slot.onlyHeroIds : girlHeroIds ?? slot.onlyHeroIds;
            const orderedHeroIds = hasSlotOnlyHeroIds
              ? [...(slot.orderedHeroIds ?? []), ...(girlHeroIds ?? [])]
              : [...(girlHeroIds ?? []), ...(slot.orderedHeroIds ?? [])];
            const excludedHeroIds = new Set(
              girlHeroIds || useUniversalHeroPool ? [] : slot.excludedHeroIds ?? [],
            );
            const slotHeroes = sortHeroes(
              filterHeroes(
                heroes.filter((h) => (h.kind === slot.kind || explicitHeroIds.has(h.id)) && !excludedHeroIds.has(h.id)),
                segment,
                null,
                slot.includedHeroIds,
                audience,
                onlyHeroIds,
              ),
              segment,
              orderedHeroIds,
            );
            if (slotHeroes.length === 0) return null;
            return (
              <HeroSlotPanel
                key={`${program.id}-${slotIdx}`}
                locale={locale}
                label={slot.label}
                heroes={slotHeroes}
                accent={accent}
                defaultOpen={defaultOpen}
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
                  <BidiText locale={locale}>{dict.catalog.labels.video(program.videos!.length > 1 ? i + 1 : undefined)}</BidiText>
                </a>
              ))}
            </div>
          )}

          {recommendedAddons.length > 0 && (
            <RecommendedAddonsPanel
              locale={locale}
              addons={recommendedAddons}
              accent={accent}
              selectedAddonIds={selectedAddonIds}
              onToggleAddon={(addonId) => {
                setSelectedAddonIdsByProgram((current) => {
                  const programAddonIds = current[program.id] ?? [];
                  const nextAddonIds = programAddonIds.includes(addonId)
                    ? programAddonIds.filter((id) => id !== addonId)
                    : [...programAddonIds, addonId];
                  if (nextAddonIds.length === 0) {
                    const next = { ...current };
                    delete next[program.id];
                    return next;
                  }
                  return { ...current, [program.id]: nextAddonIds };
                });
              }}
            />
          )}

          {hasCustomChoice && (
            <ProgramChoiceSummary
              locale={locale}
              programId={program.id}
              programName={program.title}
              durationLabel={program.durationLabel}
              heroChoices={selectedHeroChoices}
              addons={selectedAddons}
              totalPriceFrom={totalPriceFrom}
            />
          )}

          <a
            href={whatsappLink(orderMessage)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={ctaLabel}
            className="mt-7 inline-flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl bg-[var(--color-whatsapp)] px-5 py-4 text-center text-base font-semibold leading-tight text-white shadow-lg transition active:scale-[0.98]"
          >
            <MessageCircle className="h-5 w-5 shrink-0" strokeWidth={2.5} />
            {ctaTextPrefix ? (
              <>
                <span>{ctaTextPrefix}</span>
                <bdi dir="ltr" className="whitespace-nowrap">
                  {ctaPriceParts.price}
                </bdi>
              </>
            ) : (
              <BidiText locale={locale}>{ctaLabel}</BidiText>
            )}
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
        aria-label={dict.catalog.labels.close}
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
        aria-label={dict.catalog.labels.close}
        className="fixed top-3 end-3 z-[70] w-10 h-10 rounded-full bg-white/95 hover:bg-white flex items-center justify-center shadow-md backdrop-blur transition"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Floating navigation arrows — vertically centered on cover area, stay visible on scroll */}
      {total > 1 && (
        <div className="pointer-events-none fixed left-0 right-0 z-[60] flex items-center justify-between px-2 sm:px-5 top-[120px] sm:top-1/2 sm:-translate-y-1/2">
          <button
            type="button"
            aria-label={dict.catalog.labels.previous}
            disabled={!canGoPrevious}
            onClick={(e) => {
              e.stopPropagation();
              onNavigate(-1);
            }}
            className="pointer-events-auto flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-white/95 text-[var(--color-ink)] shadow-[0_10px_30px_rgba(0,0,0,0.25)] backdrop-blur transition active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
            title={dict.catalog.labels.previous}
          >
            {locale === "he" ? (
              <ChevronRight className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={2.6} />
            ) : (
              <ChevronLeft className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={2.6} />
            )}
          </button>
          <button
            type="button"
            aria-label={dict.catalog.labels.next}
            disabled={!canGoNext}
            onClick={(e) => {
              e.stopPropagation();
              onNavigate(1);
            }}
            className="pointer-events-auto flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-white/95 text-[var(--color-ink)] shadow-[0_10px_30px_rgba(0,0,0,0.25)] backdrop-blur transition active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
            title={dict.catalog.labels.next}
          >
            {locale === "he" ? (
              <ChevronLeft className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={2.6} />
            ) : (
              <ChevronRight className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={2.6} />
            )}
          </button>
        </div>
      )}
    </motion.div>
  );
}

function ProgramMoodLayer({ mood, label }: { mood?: ProgramMoodConfig; label?: string }) {
  if (!mood) return null;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg, transparent 42%, ${mood.tint} 100%)`,
        }}
      />
      <span
        className="absolute -left-8 bottom-6 h-24 w-24 rounded-full blur-2xl"
        style={{ background: mood.glow }}
      />
      <span
        className="absolute -right-8 top-8 h-20 w-20 rounded-full blur-2xl"
        style={{ background: mood.tint }}
      />
      <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-black text-[var(--color-ink)] shadow-sm backdrop-blur">
        {mood.marks.map((mark, index) => (
          <span key={`${mark}-${index}`} style={{ color: mood.accent }}>
            {mark}
          </span>
        ))}
        {label && <span>{label}</span>}
      </div>
    </div>
  );
}

function RecommendedAddonsPanel({
  locale,
  addons,
  accent,
  selectedAddonIds,
  onToggleAddon,
}: {
  locale: Locale;
  addons: AddonItem[];
  accent: string;
  selectedAddonIds: string[];
  onToggleAddon: (addonId: string) => void;
}) {
  const dict = getDictionary(locale);

  return (
    <div className="apple-glass mt-6 rounded-3xl p-4">
      <div className="flex items-start gap-3">
        <div className="apple-glass-strong flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-lg font-semibold text-[var(--color-ink)]">
          +
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-bold leading-tight">{dict.catalog.labels.addonsTitle}</h3>
          <p className="mt-1 text-xs leading-snug text-[var(--color-ink-soft)]">
            {dict.catalog.labels.addonsDescription}
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
            aria-pressed={selected}
            className="relative rounded-2xl border bg-white p-3 text-center shadow-[0_10px_30px_rgba(15,15,20,0.06)] transition-[box-shadow,transform] active:scale-[0.98] focus:outline-none focus-visible:ring-2"
            style={{
              borderColor: selected ? accent : "transparent",
              boxShadow: selected
                ? `0 0 0 2px ${accent}22, 0 14px 34px rgba(15,15,20,0.10)`
                : "0 10px 30px rgba(15,15,20,0.06)",
              ['--tw-ring-color' as never]: accent,
            }}
          >
            <AnimatePresence>
              {selected && (
                <motion.span
                  className="absolute end-2 top-2 flex h-6 w-6 items-center justify-center rounded-full text-white"
                  style={{ backgroundColor: accent }}
                  initial={{ opacity: 0, scale: 0.82 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.82 }}
                  transition={{ duration: 0.12 }}
                >
                  <Check className="h-4 w-4" strokeWidth={2.8} />
                </motion.span>
              )}
            </AnimatePresence>
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
              <BidiText locale={locale}>{addon.name}</BidiText>
            </div>
            <div className="mt-1 text-xs font-medium text-[var(--color-ink-soft)]">
              {dict.catalog.labels.addonPricePrefix} <span dir="ltr">{formatPrice(addon.priceFrom, locale)}</span>
            </div>
          </button>
          );
        })}
      </div>
    </div>
  );
}

function ProgramChoiceSummary({
  locale,
  programId,
  programName,
  durationLabel,
  heroChoices,
  addons,
  totalPriceFrom,
}: {
  locale: Locale;
  programId: string;
  programName: string;
  durationLabel: string;
  heroChoices: HeroChoice[];
  addons: AddonItem[];
  totalPriceFrom: number;
}) {
  const dict = getDictionary(locale);
  const priceParts = programPriceDisplayParts(programId, totalPriceFrom, locale);

  return (
    <motion.div
      className="apple-glass mt-6 rounded-3xl p-4"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
      aria-live="polite"
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-bold">{dict.catalog.labels.summaryTitle}</h3>
        <span className="apple-glass-strong rounded-full px-3 py-1 text-[11px] font-semibold text-[var(--color-ink)]">
          {dict.catalog.labels.selected}
        </span>
      </div>

      <div className="mt-4 space-y-2.5 text-sm">
        <SummaryRow locale={locale} label={dict.catalog.labels.program} value={`${programName}, ${durationLabel}`} />
        <AnimatePresence initial={false}>
          {heroChoices.map((choice) => (
            <SummaryRow key={choice.hero.id} locale={locale} label={choice.label} value={choice.hero.name} />
          ))}
          {addons.length > 0 && (
            <SummaryRow
              key="addons"
              locale={locale}
              label={addons.length === 1 ? dict.catalog.labels.addon : dict.catalog.labels.addons}
              value={addons.map((addon) => addon.name).join(", ")}
            />
          )}
        </AnimatePresence>
        <div className="apple-glass-strong flex items-center justify-between gap-3 rounded-2xl px-3 py-2.5 text-[var(--color-ink)]">
          <span className="text-xs font-medium opacity-70">{dict.catalog.labels.total}</span>
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={totalPriceFrom}
              className="text-base font-bold tabular-nums"
              dir={locale === "he" ? undefined : "ltr"}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.14, ease: [0.32, 0.72, 0, 1] }}
            >
              {locale === "he" ? (
                <>
                  {priceParts.prefix && <span>{priceParts.prefix}</span>}
                  <bdi dir="ltr" className="whitespace-nowrap">
                    {priceParts.price}
                  </bdi>
                </>
              ) : (
                formatProgramPriceLabel(programId, totalPriceFrom, locale)
              )}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

function SummaryRow({ locale, label, value }: { locale: Locale; label: string; value: string }) {
  return (
    <motion.div
      className="flex items-start justify-between gap-3 rounded-2xl bg-white/75 px-3 py-2.5 shadow-sm"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.14, ease: [0.32, 0.72, 0, 1] }}
    >
      <span className="text-xs font-medium leading-snug text-[var(--color-ink-soft)]">
        <BidiText locale={locale}>{label}</BidiText>
      </span>
      <span className="max-w-[58%] text-end text-sm font-bold leading-snug text-[var(--color-ink)]">
        <BidiText locale={locale}>{value}</BidiText>
      </span>
    </motion.div>
  );
}

function Stat({ locale, icon, value, label }: { locale: Locale; icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="apple-glass rounded-2xl p-3 text-center">
      <div className="flex justify-center text-[var(--color-ink-soft)]">{icon}</div>
      <div className="mt-1.5 text-sm font-semibold leading-tight"><BidiText locale={locale}>{value}</BidiText></div>
      {label && <div className="mt-0.5 text-[11px] text-[var(--color-ink-soft)]"><BidiText locale={locale}>{label}</BidiText></div>}
    </div>
  );
}

function HeroSlotPanel({
  locale,
  label,
  heroes,
  accent,
  defaultOpen,
  selectedHeroId,
  onSelectHero,
}: {
  locale: Locale;
  label: string;
  heroes: Hero[];
  accent: string;
  defaultOpen: boolean;
  selectedHeroId: string | null;
  onSelectHero: (hero: Hero) => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const dict = getDictionary(locale);
  const selectedHero = heroes.find((hero) => hero.id === selectedHeroId);
  return (
    <div className="mt-6 border border-[var(--color-line)] rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between px-4 py-3.5 text-start bg-white hover:bg-zinc-50"
      >
        <span className="text-[15px] font-semibold"><BidiText locale={locale}>{label}</BidiText></span>
        <div className="flex items-center gap-2">
          <span
            className="max-w-[150px] truncate text-xs font-bold"
            style={selectedHero ? { color: accent } : undefined}
          >
            <BidiText locale={locale}>{selectedHero?.name ?? dict.catalog.labels.variants(heroes.length)}</BidiText>
          </span>
          <ChevronDown
            className={`w-5 h-5 text-[var(--color-ink-soft)] transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            className="grid grid-cols-3 sm:grid-cols-5 gap-2 p-3 bg-zinc-50/60"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.16, ease: [0.32, 0.72, 0, 1] }}
          >
            {heroes.map((h) => {
              const selected = selectedHeroId === h.id;
              return (
              <button
                key={h.id}
                type="button"
                onClick={() => onSelectHero(h)}
                aria-pressed={selected}
                className="relative rounded-xl border bg-white px-1.5 pb-2 pt-1 text-center transition-[box-shadow,transform] hover:shadow-md active:scale-[0.98] focus:outline-none focus-visible:ring-2"
                style={{
                  borderColor: selected ? accent : "transparent",
                  boxShadow: selected
                    ? `0 0 0 2px ${accent}22, 0 10px 24px rgba(15,15,20,0.10)`
                    : undefined,
                  ['--tw-ring-color' as never]: accent,
                }}
              >
                <AnimatePresence>
                  {selected && (
                    <motion.span
                      className="absolute right-1.5 top-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full text-white"
                      style={{ backgroundColor: accent }}
                      initial={{ opacity: 0, scale: 0.82 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.82 }}
                      transition={{ duration: 0.12 }}
                    >
                      <Check className="h-3.5 w-3.5" strokeWidth={2.8} />
                    </motion.span>
                  )}
                </AnimatePresence>
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
                  <BidiText locale={locale}>{h.name}</BidiText>
                </div>
              </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
