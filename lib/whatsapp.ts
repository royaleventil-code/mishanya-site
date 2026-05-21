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
} as const;
