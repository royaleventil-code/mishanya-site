import type { Gender, SegmentId } from "./types";

export function segmentFromAge(age: number, gender: Gender): SegmentId {
  if (age <= 3) return "baby";
  if (gender === "boy") return age <= 5 ? "boy-4-6" : "boy-6plus";
  if (age <= 6) return "girl-4-6";
  return "girl-6plus";
}

export type SegmentConfig = {
  accent: string;
  accentDim: string;
  label: string;
  emoji: string;
};

export const SEGMENTS: Record<SegmentId, SegmentConfig> = {
  baby: {
    accent: "#ff9f0a",
    accentDim: "rgba(255,159,10,0.12)",
    label: "малышей",
    emoji: "🍼",
  },
  "boy-4-6": {
    accent: "#0a84ff",
    accentDim: "rgba(10,132,255,0.12)",
    label: "мальчика",
    emoji: "🚀",
  },
  "boy-6plus": {
    accent: "#0a84ff",
    accentDim: "rgba(10,132,255,0.12)",
    label: "мальчика",
    emoji: "🚀",
  },
  "girl-4-6": {
    accent: "#ff375f",
    accentDim: "rgba(255,55,95,0.12)",
    label: "девочки",
    emoji: "💕",
  },
  "girl-6plus": {
    accent: "#ff375f",
    accentDim: "rgba(255,55,95,0.12)",
    label: "девочки",
    emoji: "💕",
  },
  all: {
    accent: "#5e5ce6",
    accentDim: "rgba(94,92,230,0.12)",
    label: "",
    emoji: "✨",
  },
};

function ageLabel(age: number): string {
  if (age === 1) return "1 год";
  if (age >= 2 && age <= 4) return `${age} года`;
  return `${age} лет`;
}

export function heroTitle(segment: SegmentId, age?: number, gender?: Gender): string {
  if (segment === "baby") {
    if (age && gender) {
      const child = gender === "boy" ? "мальчика" : "девочки";
      return `Программы для ${child} ${ageLabel(age)}`;
    }
    return "Программы для малышей";
  }
  if (segment === "all") return "Все программы";
  const ageNum = age ?? (segment.endsWith("4-6") ? 5 : 8);
  const child = segment.startsWith("boy") ? "мальчика" : "девочки";
  return `Программы для ${child} ${ageLabel(ageNum)}`;
}
