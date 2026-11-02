import type { Quest } from "@/data/quests";

// Customer-facing prices per event, approved on 01.11.2026.
// Only retail amounts belong in this client-side module.
export type QuestPricingKind = "ready" | "performance" | "bars" | "alcohol" | "customKids" | "custom";
export type QuestVenue = "client" | "jaffa";
type Tier = { upTo: number; amount: number };
export type QuestPricingSpec = {
  tiers: readonly Tier[];
  from?: boolean;
  flatFrom?: number;
  extraParticipant?: number;
  quoteAbove?: number;
};

export const READY_QUEST_PRICES: QuestPricingSpec = {
  tiers: [{ upTo: 10, amount: 2200 }, { upTo: 15, amount: 2700 }, { upTo: 20, amount: 3100 }],
  extraParticipant: 90,
};

const PERFORMANCE_PRICES: Record<QuestVenue, QuestPricingSpec> = {
  client: { tiers: [{ upTo: 10, amount: 2400 }, { upTo: 15, amount: 3000 }, { upTo: 20, amount: 3600 }], quoteAbove: 20 },
  jaffa: { tiers: [{ upTo: 10, amount: 2800 }, { upTo: 15, amount: 3400 }, { upTo: 20, amount: 4100 }], quoteAbove: 20 },
};

const OTHER_PRICES: Record<"bars" | "alcohol" | "customKids" | "custom", QuestPricingSpec> = {
  bars: { tiers: [{ upTo: 10, amount: 2700 }], quoteAbove: 10 },
  alcohol: { tiers: [{ upTo: 10, amount: 2500 }], quoteAbove: 10 },
  customKids: { tiers: [{ upTo: 10, amount: 2700 }, { upTo: 15, amount: 3500 }, { upTo: 20, amount: 3900 }], from: true, extraParticipant: 90 },
  custom: { tiers: [], flatFrom: 2600 },
};

export const QUEST_ALCOHOL_EXTRAS = {
  bars: [{ bars: 3, amount: 800 }, { bars: 5, amount: 1400 }],
  alcohol: { min: 300, max: 500 },
} as const;

export function getQuestPricingKind(quest: Quest): QuestPricingKind | null {
  if (quest.category === "kids" || quest.category === "excursion") return "ready";
  if (quest.category === "performance") return "performance";
  if (quest.id === "tel-aviv-bars") return "bars";
  if (quest.id === "alco-quest") return "alcohol";
  return null;
}

export function getQuestPricingSpec(kind: QuestPricingKind, venue: QuestVenue = "client"): QuestPricingSpec {
  if (kind === "ready") return READY_QUEST_PRICES;
  if (kind === "performance") return PERFORMANCE_PRICES[venue];
  return OTHER_PRICES[kind];
}

export function getQuestPriceRows(kind: QuestPricingKind, capacity: readonly [number, number] = [1, Infinity], venue: QuestVenue = "client") {
  const spec = getQuestPricingSpec(kind, venue);
  let lower = 1;
  return spec.tiers.flatMap((tier) => {
    const min = Math.max(lower, capacity[0]);
    const max = Math.min(tier.upTo, capacity[1]);
    lower = tier.upTo + 1;
    return min <= max ? [{ min, max, amount: tier.amount, from: !!spec.from }] : [];
  });
}

export function getQuestStartingPrice(quest: Quest): number | null {
  const kind = getQuestPricingKind(quest);
  return kind ? getQuestPriceRows(kind, quest.players)[0]?.amount ?? null : null;
}

export function getQuestGroupPrice(kind: QuestPricingKind, count: number, venue: QuestVenue = "client"): number | null {
  if (!Number.isInteger(count) || count < 1) return null;
  const spec = getQuestPricingSpec(kind, venue);
  const tier = spec.tiers.find((item) => count <= item.upTo);
  if (tier) return tier.amount;
  const last = spec.tiers.at(-1);
  return last && spec.extraParticipant ? last.amount + (count - last.upTo) * spec.extraParticipant : null;
}
