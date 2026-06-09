import type { Locale } from "@/lib/i18n";
import { formatProgramPriceLabel } from "./prices";

export const WA_NUMBER = "972546163260";
export const WA_DISPLAY = "+972 54-616-32-60";

export function whatsappLink(message: string): string {
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;
}

const GENERAL_INQUIRY_LINES = [
  "Здравствуйте! Хочу детский праздник.",
  "Помогите подобрать программу",
];

export const WA_MESSAGES = {
  default: GENERAL_INQUIRY_LINES.join("\n"),
  audience: (audienceLabel: string) =>
    [
      "Здравствуйте! Хочу детский праздник.",
      "Помогите подобрать программу",
      `Возраст ребёнка: ${audienceLabel}`,
    ].join("\n"),
  program: (name: string, durationLabel?: string, priceFrom?: number, programId = "") => {
    const programLine = [
      `Программа: ${name}`,
      durationLabel,
      priceFrom ? formatProgramPriceLabel(programId, priceFrom) : undefined,
    ]
      .filter(Boolean)
      .join(", ");

    return [
      "Здравствуйте! Хочу детский праздник.",
      programLine,
      "Возраст ребёнка:",
    ].join("\n");
  },
  programWithHero: (programName: string, heroName: string) =>
    [
      "Здравствуйте! Хочу детский праздник.",
      `Программа: ${programName}`,
      `Герой: ${heroName}`,
      "Возраст ребёнка:",
    ].join("\n"),
  programWithAddon: (programName: string, addonName: string) =>
    [
      "Здравствуйте! Хочу детский праздник.",
      `Программа: ${programName}`,
      `Дополнительная опция: ${addonName}`,
      "Возраст ребёнка:",
    ].join("\n"),
  programOrder: ({
    programName,
    programId,
    durationLabel,
    heroChoices,
    addons,
    totalPriceFrom,
    audienceLabel,
  }: {
    programName: string;
    programId: string;
    durationLabel: string;
    heroChoices: { label: string; name: string }[];
    addons: string[];
    totalPriceFrom: number;
    audienceLabel?: string;
  }) => {
    const lines = [
      "Здравствуйте! Хочу детский праздник.",
      `Программа: ${programName}, ${durationLabel}, ${formatProgramPriceLabel(programId, totalPriceFrom)}`,
    ];

    heroChoices.forEach((choice) => {
      lines.push(`${choice.label}: ${choice.name}`);
    });

    if (addons.length === 1) {
      lines.push(`Дополнительная опция: ${addons[0]}`);
    }

    if (addons.length > 1) {
      lines.push(`Дополнительные опции: ${addons.join(", ")}`);
    }

    lines.push(`Возраст ребёнка: ${audienceLabel ?? ""}`);

    return lines.join("\n");
  },
} as const;

export function getWhatsAppMessages(locale: Locale = "ru") {
  if (locale === "ru") return WA_MESSAGES;

  const defaultMessage = [
    "שלום! אני רוצה יום הולדת לילדים.",
    "אשמח לעזרה בבחירת תוכנית",
  ].join("\n");

  return {
    default: defaultMessage,
    audience: (audienceLabel: string) =>
      [
        "שלום! אני רוצה יום הולדת לילדים.",
        "אשמח לעזרה בבחירת תוכנית",
        `גיל הילד או הילדה: ${audienceLabel}`,
      ].join("\n"),
    program: (name: string, durationLabel?: string, priceFrom?: number, programId = "") => {
      const programLine = [
        `תוכנית: ${name}`,
        durationLabel,
        priceFrom ? formatProgramPriceLabel(programId, priceFrom, "he") : undefined,
      ]
        .filter(Boolean)
        .join(", ");

      return ["שלום! אני רוצה יום הולדת לילדים.", programLine, "גיל הילד או הילדה:"].join("\n");
    },
    programWithHero: (programName: string, heroName: string) =>
      [
        "שלום! אני רוצה יום הולדת לילדים.",
        `תוכנית: ${programName}`,
        `דמות: ${heroName}`,
        "גיל הילד או הילדה:",
      ].join("\n"),
    programWithAddon: (programName: string, addonName: string) =>
      [
        "שלום! אני רוצה יום הולדת לילדים.",
        `תוכנית: ${programName}`,
        `תוספת: ${addonName}`,
        "גיל הילד או הילדה:",
      ].join("\n"),
    programOrder: ({
      programName,
      programId,
      durationLabel,
      heroChoices,
      addons,
      totalPriceFrom,
      audienceLabel,
    }: Parameters<typeof WA_MESSAGES.programOrder>[0]) => {
      const lines = [
        "שלום! אני רוצה יום הולדת לילדים.",
        `תוכנית: ${programName}, ${durationLabel}, ${formatProgramPriceLabel(programId, totalPriceFrom, "he")}`,
      ];

      heroChoices.forEach((choice) => {
        lines.push(`${choice.label}: ${choice.name}`);
      });

      if (addons.length === 1) {
        lines.push(`תוספת: ${addons[0]}`);
      }

      if (addons.length > 1) {
        lines.push(`תוספות: ${addons.join(", ")}`);
      }

      lines.push(`גיל הילד או הילדה: ${audienceLabel ?? ""}`);

      return lines.join("\n");
    },
  } as const;
}
