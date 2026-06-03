import type { AudienceContext, Gender } from "./types";

export type AtmosphereAgeGroup = "toddler" | "kids" | "older";

export type AtmosphereMotif =
  | "bubble"
  | "heart"
  | "softCircle"
  | "wave"
  | "confetti"
  | "star"
  | "ribbon"
  | "balloon"
  | "bolt"
  | "rocket"
  | "music"
  | "glow"
  | "pixel"
  | "speedLine";

export type ProgramAtmosphereThemeId =
  | "chemistry-show"
  | "neon"
  | "harry-potter"
  | "super-heroes";

type AtmospherePalette = {
  base: string;
  aura: string;
  glow: string;
  accent: string;
  accent2: string;
  accent3: string;
};

export type ProgramAtmosphereTheme = {
  id: ProgramAtmosphereThemeId;
  motifs: AtmosphereMotif[];
};

export type AtmosphereTheme = {
  id: string;
  ageGroup: AtmosphereAgeGroup;
  gender: Gender;
  intensity: "scenic";
  palette: AtmospherePalette;
  motifs: AtmosphereMotif[];
  programTheme?: ProgramAtmosphereTheme;
};

type BaseAtmosphereTheme = Omit<AtmosphereTheme, "id" | "gender" | "ageGroup" | "programTheme">;

export const PROGRAM_ATMOSPHERE_THEMES: Record<ProgramAtmosphereThemeId, ProgramAtmosphereTheme> = {
  "chemistry-show": {
    id: "chemistry-show",
    motifs: ["bubble", "softCircle", "wave"],
  },
  neon: {
    id: "neon",
    motifs: ["glow", "music", "speedLine"],
  },
  "harry-potter": {
    id: "harry-potter",
    motifs: ["star", "glow", "speedLine"],
  },
  "super-heroes": {
    id: "super-heroes",
    motifs: ["bolt", "speedLine", "star"],
  },
};

const THEMES: Record<Gender, Record<AtmosphereAgeGroup, BaseAtmosphereTheme>> = {
  girl: {
    toddler: {
      intensity: "scenic",
      palette: {
        base: "rgba(255, 246, 251, 0.94)",
        aura: "rgba(255, 151, 191, 0.34)",
        glow: "rgba(255, 216, 232, 0.52)",
        accent: "rgba(255, 91, 145, 0.55)",
        accent2: "rgba(123, 190, 255, 0.42)",
        accent3: "rgba(255, 224, 239, 0.68)",
      },
      motifs: ["bubble", "heart", "softCircle"],
    },
    kids: {
      intensity: "scenic",
      palette: {
        base: "rgba(255, 247, 253, 0.95)",
        aura: "rgba(255, 103, 162, 0.34)",
        glow: "rgba(185, 139, 255, 0.24)",
        accent: "rgba(255, 55, 95, 0.56)",
        accent2: "rgba(184, 126, 255, 0.46)",
        accent3: "rgba(255, 204, 92, 0.44)",
      },
      motifs: ["confetti", "star", "ribbon", "balloon"],
    },
    older: {
      intensity: "scenic",
      palette: {
        base: "rgba(255, 246, 252, 0.94)",
        aura: "rgba(255, 55, 125, 0.32)",
        glow: "rgba(117, 105, 255, 0.28)",
        accent: "rgba(255, 55, 95, 0.58)",
        accent2: "rgba(104, 126, 255, 0.5)",
        accent3: "rgba(255, 214, 64, 0.45)",
      },
      motifs: ["music", "glow", "star", "speedLine"],
    },
  },
  boy: {
    toddler: {
      intensity: "scenic",
      palette: {
        base: "rgba(246, 251, 255, 0.94)",
        aura: "rgba(106, 190, 255, 0.34)",
        glow: "rgba(180, 236, 255, 0.48)",
        accent: "rgba(10, 132, 255, 0.5)",
        accent2: "rgba(78, 214, 201, 0.42)",
        accent3: "rgba(255, 216, 138, 0.46)",
      },
      motifs: ["bubble", "softCircle", "wave"],
    },
    kids: {
      intensity: "scenic",
      palette: {
        base: "rgba(246, 250, 255, 0.95)",
        aura: "rgba(10, 132, 255, 0.32)",
        glow: "rgba(255, 214, 64, 0.3)",
        accent: "rgba(10, 132, 255, 0.56)",
        accent2: "rgba(255, 194, 48, 0.5)",
        accent3: "rgba(91, 209, 255, 0.42)",
      },
      motifs: ["confetti", "star", "bolt", "rocket"],
    },
    older: {
      intensity: "scenic",
      palette: {
        base: "rgba(245, 250, 255, 0.94)",
        aura: "rgba(10, 132, 255, 0.34)",
        glow: "rgba(48, 209, 88, 0.26)",
        accent: "rgba(10, 132, 255, 0.6)",
        accent2: "rgba(48, 209, 88, 0.48)",
        accent3: "rgba(255, 214, 64, 0.48)",
      },
      motifs: ["pixel", "bolt", "speedLine", "glow"],
    },
  },
};

export function getAtmosphereAgeGroup(age?: number): AtmosphereAgeGroup | null {
  if (typeof age !== "number" || !Number.isFinite(age)) return null;
  if (age >= 1 && age <= 3) return "toddler";
  if (age >= 4 && age <= 6) return "kids";
  if (age >= 7 && age <= 10) return "older";
  return null;
}

export function resolveAtmosphereTheme(
  audience?: AudienceContext,
  programThemeId?: ProgramAtmosphereThemeId,
): AtmosphereTheme | null {
  if (!audience?.gender) return null;

  const ageGroup = getAtmosphereAgeGroup(audience.age);
  if (!ageGroup) return null;

  const baseTheme = THEMES[audience.gender][ageGroup];
  const programTheme = programThemeId ? PROGRAM_ATMOSPHERE_THEMES[programThemeId] : undefined;

  return {
    ...baseTheme,
    id: `${audience.gender}-${ageGroup}`,
    ageGroup,
    gender: audience.gender,
    programTheme,
  };
}
