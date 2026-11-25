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

const BOY_AUDIENCE_HERO_IDS = new Set([
  "among-us-mascot",
  "batman-mascot",
  "bumblebee",
  "captain-america",
  "cat-noir",
  "deadpool",
  "dinosaur",
  "dj-marshmello",
  "fixiki-boy",
  "harry-potter",
  "hulk-mascot",
  "leon-brawl",
  "lol-surprise-boy",
  "marvel",
  "marshall-mascot",
  "mickey-mouse",
  "mickey-mouse-mascot",
  "minecraft-boy",
  "minion",
  "ninja-turtle",
  "ninjago",
  "optimus-prime",
  "pirate",
  "pj-catboy",
  "pj-gekko",
  "popit-boy",
  "racer",
  "sonic-mascot",
  "spiderman",
  "squid-soldier",
  "stitch",
  "stitch-mascot",
  "superman",
  "tiktoker-boy",
  "tom-and-jerry",
  "troll-branch",
]);

const GIRL_AUDIENCE_HERO_IDS = new Set([
  "anna",
  "barbie",
  "bunny",
  "elsa",
  "fixiki-girl",
  "hermione",
  "kissy-missy",
  "kpop-mira",
  "kpop-rumi",
  "kpop-zoey",
  "ladybug",
  "labubu",
  "lol-bee",
  "lol-bee-mascot",
  "lol-unicorn",
  "lol-unicorn-mascot",
  "masha-bear-inflatable",
  "mashenka",
  "mermaid",
  "minecraft-girl",
  "minnie-mouse",
  "minnie-mouse-mascot",
  "olaf",
  "pj-owlette",
  "popit-girl",
  "rapunzel",
  "sky",
  "tiktoker-girl",
  "tinker-bell",
  "troll-poppy",
  "unicorn",
  "unicorn-mascot",
  "wednesday",
]);

export const HERO_ORDER: Partial<Record<SegmentId, string[]>> = {
  boy: [...MASCOT_ORDER, ...BOYS_ORDER],
  girl: MASCOT_ORDER,
  all: MASCOT_ORDER,
};

type AudienceSide = "boy" | "girl";

function hasSegment(hero: Hero, segment: SegmentId): boolean {
  return hero.segments.includes(segment);
}

function hasHiddenRuleFor(hero: Hero, gender: AudienceSide): boolean {
  return hero.hiddenFor?.some((rule) => rule.gender === gender) ?? false;
}

function heroAudienceSide(hero: Hero): AudienceSide | null {
  if (BOY_AUDIENCE_HERO_IDS.has(hero.id)) return "boy";
  if (GIRL_AUDIENCE_HERO_IDS.has(hero.id)) return "girl";

  if (hasSegment(hero, "boy") && !hasSegment(hero, "girl")) return "boy";
  if (hasSegment(hero, "girl") && !hasSegment(hero, "boy")) return "girl";

  const hiddenForBoy = hasHiddenRuleFor(hero, "boy");
  const hiddenForGirl = hasHiddenRuleFor(hero, "girl");
  if (hiddenForGirl && !hiddenForBoy) return "boy";
  if (hiddenForBoy && !hiddenForGirl) return "girl";

  if (hero.id.includes("-boy")) return "boy";
  if (hero.id.includes("-girl")) return "girl";

  return null;
}

function interleaveAllAudienceHeroes(heroes: Hero[]): Hero[] {
  const grouped: Record<AudienceSide, Hero[]> = { boy: [], girl: [] };
  let nextNeutralSide: AudienceSide = "boy";

  heroes.forEach((hero) => {
    const knownSide = heroAudienceSide(hero);
    const side = knownSide ?? nextNeutralSide;
    grouped[side].push(hero);
    if (knownSide === null) {
      nextNeutralSide = nextNeutralSide === "boy" ? "girl" : "boy";
    }
  });

  const result: Hero[] = [];
  let nextSide: AudienceSide = "boy";
  while (grouped.boy.length > 0 || grouped.girl.length > 0) {
    const current = grouped[nextSide];
    const fallback = grouped[nextSide === "boy" ? "girl" : "boy"];
    const nextHero = current.shift() ?? fallback.shift();
    if (!nextHero) break;
    result.push(nextHero);
    nextSide = nextSide === "boy" ? "girl" : "boy";
  }

  return result;
}

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
  const sorted = [...heroes].sort((a, b) => indexOf(a.id) - indexOf(b.id));
  return segment === "all" ? interleaveAllAudienceHeroes(sorted) : sorted;
}
