export type Language = "ru" | "he" | "en";
export type Location = "indoor" | "outdoor";
export type SegmentId =
  | "baby"
  | "boy-4-6"
  | "girl-4-6"
  | "boy-6plus"
  | "girl-6plus"
  | "all";
export type HeroKind = "costume" | "mascot";
export type Gender = "boy" | "girl";

export type HeroSlot = {
  label: string;
  kind: HeroKind;
};

export type Program = {
  id: string;
  emoji: string;
  title: string;
  tagline?: string;
  durationLabel: string;
  animators: number;
  animatorsLabel?: string;
  priceFrom: number;
  currency: string;
  maxKids: number | null;
  languages: Language[];
  locations: Location[];
  segments: SegmentId[];
  heroSlots: HeroSlot[];
  includes: string[];
  includesHighlight?: string;
  bundled?: string[];
  bonus?: string;
  note?: string;
  recommendedAddonIds?: string[];
  videos?: string[];
  gradientFrom: string;
  gradientTo: string;
  ruOnly?: boolean;
  cover?: string;
};

export type Hero = {
  id: string;
  name: string;
  kind: HeroKind;
  segments: SegmentId[];
  languages: Language[];
  photo?: string;
  gallery?: string[];
  description?: string;
};

export type Addon = {
  id: string;
  emoji: string;
  name: string;
  priceFrom: number;
  icon?: string;
};

export type FilterState = {
  kidsCount: "small" | "large" | null;
  location: Location | null;
  language: Language | "mixed" | null;
};
