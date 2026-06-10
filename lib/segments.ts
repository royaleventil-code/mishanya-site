import type { Gender, SegmentId } from "./types";
import type { Locale } from "@/lib/i18n";

export function segmentFromAge(age: number, gender: Gender): SegmentId {
  return gender;
}

export type SegmentConfig = {
  accent: string;
  accentDim: string;
  label: string;
  emoji: string;
};

export const SEGMENTS: Record<SegmentId, SegmentConfig> = {
  boy: {
    accent: "#0a84ff",
    accentDim: "rgba(10,132,255,0.12)",
    label: "мальчика",
    emoji: "🚀",
  },
  girl: {
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

function ageLabel(age: number, locale: Locale = "ru"): string {
  if (locale === "he") return String(age);
  if (age === 1) return "1 год";
  if (age >= 2 && age <= 4) return `${age} года`;
  return `${age} лет`;
}

export function heroTitle(
  segment: SegmentId,
  age?: number,
  gender?: Gender,
  locale: Locale = "ru",
): string {
  if (locale === "he") {
    if (segment === "all") return "כל התוכניות";
    const ageNum = age ?? 5;
    return `תוכניות יום הולדת ${segment === "boy" ? "לבן" : "לבת"} ${ageLabel(ageNum, locale)}`;
  }

  if (segment === "all") return "Все программы";
  const ageNum = age ?? 5;
  const child = segment === "boy" ? "мальчика" : "девочки";
  return `Программы для ${child} ${ageLabel(ageNum, locale)}`;
}
