import { ADDONS } from "@/data/addons";
import { HEROES } from "@/data/heroes";
import { PROGRAMS } from "@/data/programs";
import type { Locale } from "@/lib/i18n";
import { ADDON_COPY, HERO_COPY, PROGRAM_COPY } from "@/lib/program-copy";
import type { ProgramCopy } from "@/lib/program-copy";
import type { Addon, Hero, Program } from "@/lib/types";

export function getLocalizedPrograms(locale: Locale): Program[] {
  if (locale === "ru") return PROGRAMS;
  const copy: Record<string, ProgramCopy | undefined> = PROGRAM_COPY[locale];

  return PROGRAMS.map((program) => {
    const localized = copy[program.id];
    if (!localized) return program;

    return {
      ...program,
      ...localized,
      includes: localized.includes ? [...localized.includes] : program.includes,
      bundled: localized.bundled ? [...localized.bundled] : program.bundled,
      heroSlots: localized.heroSlots
        ? program.heroSlots.map((slot, index) => ({
            ...slot,
            label: localized.heroSlots?.[index] ?? slot.label,
          }))
        : program.heroSlots,
    };
  });
}

// Есть ли у программы перевод на данный язык (для he-страниц без перевода контент упал бы в русский)
export function hasProgramCopy(locale: Locale, programId: string): boolean {
  if (locale === "ru") return true;
  const copy: Record<string, ProgramCopy | undefined> = PROGRAM_COPY[locale];
  return Boolean(copy[programId]);
}

export function getLocalizedProgramById(locale: Locale, programId: string): Program | undefined {
  return getLocalizedPrograms(locale).find((program) => program.id === programId);
}

export function getLocalizedHeroes(locale: Locale): Hero[] {
  if (locale === "ru") return HEROES;
  const copy: Record<string, string | undefined> = HERO_COPY[locale];

  return HEROES.map((hero) => ({
    ...hero,
    name: copy[hero.id] ?? hero.name,
  }));
}

export function getLocalizedAddons(locale: Locale): Addon[] {
  if (locale === "ru") return ADDONS;
  const copy: Record<string, string | undefined> = ADDON_COPY[locale];

  return ADDONS.map((addon) => ({
    ...addon,
    name: copy[addon.id] ?? addon.name,
  }));
}
