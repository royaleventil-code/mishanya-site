export const WA_NUMBER = "972546163260";
export const WA_DISPLAY = "+972 54-616-32-60";

export function whatsappLink(message: string): string {
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;
}

export const WA_MESSAGES = {
  default: "Здравствуйте! Хочу узнать подробнее про детский праздник.",
  program: (name: string) =>
    `Здравствуйте! Интересует программа "${name}". Подскажите, пожалуйста, подробности.`,
  programWithHero: (programName: string, heroName: string) =>
    `Здравствуйте! Интересует программа "${programName}" с героем "${heroName}". Подскажите, пожалуйста, подробности.`,
  programWithAddon: (programName: string, addonName: string) =>
    `Здравствуйте! Интересует программа "${programName}" и хочу добавить "${addonName}". Подскажите, пожалуйста, подробности.`,
  programOrder: ({
    programName,
    durationLabel,
    heroChoices,
    addons,
    totalPriceFrom,
  }: {
    programName: string;
    durationLabel: string;
    heroChoices: { label: string; name: string }[];
    addons: string[];
    totalPriceFrom: number;
  }) => {
    const lines = [
      "Здравствуйте! Интересует праздник:",
      `Программа: ${programName}, ${durationLabel}`,
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

    lines.push(`Итого: от ${totalPriceFrom.toLocaleString("ru-RU")} ₪`);

    return lines.join("\n");
  },
} as const;
