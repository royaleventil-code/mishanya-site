import type { AudienceContext, FilterState, Hero, Program, ProgramVisibilityRule, SegmentId } from "./types";

export function matchesVisibilityRule(
  rule: ProgramVisibilityRule,
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

export function filterPrograms(
  programs: Program[],
  segment: SegmentId,
  filters: FilterState,
  audience?: AudienceContext,
): Program[] {
  return programs.filter((p) => {
    if (!p.segments.includes(segment)) return false;
    if (p.showFor && !p.showFor.some((rule) => matchesVisibilityRule(rule, segment, audience))) {
      return false;
    }
    if (p.hiddenFor?.some((rule) => matchesVisibilityRule(rule, segment, audience))) {
      return false;
    }

    // Small groups can book larger programs; large groups cannot book capped programs.
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
  includedHeroIds: string[] = [],
  audience?: AudienceContext,
  onlyHeroIds: string[] = [],
): Hero[] {
  const included = new Set(includedHeroIds);
  const only = new Set(onlyHeroIds);
  return heroes.filter((h) => {
    const explicitlyAllowed = included.has(h.id) || only.has(h.id);
    if (only.size > 0 && !only.has(h.id) && !included.has(h.id)) return false;
    if (h.segments.length === 0 || h.languages.length === 0) return false;
    if (!explicitlyAllowed && h.hiddenFor?.some((rule) => matchesVisibilityRule(rule, segment, audience))) {
      return false;
    }
    if (!explicitlyAllowed && !h.segments.includes(segment)) return false;
    if (language === "ru" || language === "he") {
      if (!explicitlyAllowed && !h.languages.includes(language)) return false;
    }
    return true;
  });
}
