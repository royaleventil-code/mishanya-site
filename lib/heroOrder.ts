import type { Hero, SegmentId } from "./types";

const MASCOT_ORDER = [
  "marshall-mascot",
  "sonic-mascot",
  "stitch-mascot",
];

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
  boy: [...MASCOT_ORDER, ...BOYS_ORDER],
  girl: MASCOT_ORDER,
  all: MASCOT_ORDER,
};

export function sortHeroes(
  heroes: Hero[],
  segment: SegmentId,
  orderedHeroIds: string[] = [],
): Hero[] {
  const order = [...orderedHeroIds, ...(HERO_ORDER[segment] ?? [])];
  const indexOf = (id: string) => {
    const idx = order.indexOf(id);
    return idx === -1 ? Number.MAX_SAFE_INTEGER : idx;
  };
  return [...heroes].sort((a, b) => indexOf(a.id) - indexOf(b.id));
}
