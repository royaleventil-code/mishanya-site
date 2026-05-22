import type { FilterState, Hero, Program, SegmentId } from "./types";

export function filterPrograms(
  programs: Program[],
  segment: SegmentId,
  filters: FilterState,
): Program[] {
  return programs.filter((p) => {
    if (!p.segments.includes(segment)) return false;

    if (filters.kidsCount === "small" && (p.maxKids === null || p.maxKids > 15)) return false;
    if (filters.kidsCount === "large" && p.maxKids !== null && p.maxKids <= 15) return false;
    if (filters.location && !p.locations.includes(filters.location)) return false;

    if (filters.language === "mixed") {
      if (!p.languages.includes("ru") || !p.languages.includes("he")) return false;
    } else if (
      filters.language === "ru" ||
      filters.language === "he" ||
      filters.language === "en"
    ) {
      if (!p.languages.includes(filters.language)) return false;
    }

    return true;
  });
}

export function filterHeroes(
  heroes: Hero[],
  segment: SegmentId,
  language: FilterState["language"],
): Hero[] {
  return heroes.filter((h) => {
    if (h.segments.length === 0 || h.languages.length === 0) return false;
    if (!h.segments.includes(segment)) return false;
    if (language === "ru" || language === "he") {
      if (!h.languages.includes(language)) return false;
    }
    return true;
  });
}
