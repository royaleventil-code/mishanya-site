import type { Hero, SegmentId } from "./types";

const BOYS_ORDER = [
  "spiderman",
  "captain-america",
  "racer",
  "optimus-prime",
  "bumblebee",
  "harry-potter",
  "leon-brawl",
  "superman",
  "minecraft-boy",
  "fixiki-boy",
  "pirate",
  "squid-soldier",
  "mario",
  "dinosaur",
  "deadpool",
  "pj-gekko",
  "pj-catboy",
  "tiktoker-boy",
  "popit-boy",
  "snake",
  "marvel",
];

export const HERO_ORDER: Partial<Record<SegmentId, string[]>> = {
  "boy-4-6": BOYS_ORDER,
  "boy-6plus": BOYS_ORDER,
};

export function sortHeroes(heroes: Hero[], segment: SegmentId): Hero[] {
  const order = HERO_ORDER[segment];
  if (!order) return heroes;
  const indexOf = (id: string) => {
    const idx = order.indexOf(id);
    return idx === -1 ? Number.MAX_SAFE_INTEGER : idx;
  };
  return [...heroes].sort((a, b) => indexOf(a.id) - indexOf(b.id));
}
