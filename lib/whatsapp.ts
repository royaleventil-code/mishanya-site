import { formatProgramPriceLabel } from "./prices";

export const WA_NUMBER = "972546163260";
export const WA_DISPLAY = "+972 54-616-32-60";

export function whatsappLink(message: string): string {
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;
}

const GENERAL_INQUIRY_LINES = [
  "Здравствуйте! Хочу детский праздник.",
  "Программа: помогите подобрать",
  "Возраст ребёнка:",
  "Дата:",
  "Город:",
  "Количество детей:",
  "Место:",
  "Язык:",
];

export const WA_MESSAGES = {
  default: GENERAL_INQUIRY_LINES.join("\n"),
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
      "Дата:",
      "Город:",
      "Количество детей:",
      "Место:",
      "Язык:",
    ].join("\n");
  },
  programWithHero: (programName: string, heroName: string) =>
    [
      "Здравствуйте! Хочу детский праздник.",
      `Программа: ${programName}`,
      `Герой: ${heroName}`,
      "Возраст ребёнка:",
      "Дата:",
      "Город:",
      "Количество детей:",
      "Место:",
      "Язык:",
    ].join("\n"),
  programWithAddon: (programName: string, addonName: string) =>
    [
      "Здравствуйте! Хочу детский праздник.",
      `Программа: ${programName}`,
      `Дополнительная опция: ${addonName}`,
      "Возраст ребёнка:",
      "Дата:",
      "Город:",
      "Количество детей:",
      "Место:",
      "Язык:",
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

    lines.push(
      `Возраст ребёнка: ${audienceLabel ?? ""}`,
      "Дата:",
      "Город:",
      "Количество детей:",
      "Место:",
      "Язык:",
    );

    return lines.join("\n");
  },
} as const;
