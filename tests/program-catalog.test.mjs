import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFileSync } from "node:fs";
import test from "node:test";

const programsSource = readFileSync(new URL("../data/programs.ts", import.meta.url), "utf8");
const programCopySource = readFileSync(new URL("../lib/program-copy.ts", import.meta.url), "utf8");

function programBlock(id) {
  const idIndex = programsSource.indexOf(`id: "${id}"`);
  assert.notEqual(idIndex, -1, `Program ${id} should exist`);

  const objectStart = programsSource.lastIndexOf("{", idIndex);
  assert.notEqual(objectStart, -1, `Program ${id} should have an object start`);

  let depth = 0;
  for (let index = objectStart; index < programsSource.length; index += 1) {
    const char = programsSource[index];
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return programsSource.slice(objectStart, index + 1);
      }
    }
  }

  throw new Error(`Program ${id} object was not closed`);
}

test("super-heroes remains the universal hero-choice program", () => {
  const block = programBlock("super-heroes");

  assert.match(block, /title:\s*"All Heroes"/);
  assert.match(block, /segments:\s*\["boy", "girl", "all"\]/);
  assert.match(block, /\.\.\.MAIN_PROGRAM_HERO_SLOT_SETTINGS/);
  assert.match(block, /\{\s*label:\s*"Ростовая кукла на выбор",\s*kind:\s*"mascot"\s*\}/);
});

test("All Heroes keeps the same name in Hebrew and uses the new general cover", () => {
  const block = programBlock("super-heroes");

  assert.match(block, /cover:\s*"\/programs\/all-heroes\.png"/);
  assert.match(block, /\{\s*segment:\s*"all",\s*cover:\s*"\/programs\/all-heroes\.png"\s*\}/);
  assert.equal(existsSync(new URL("../public/programs/all-heroes.png", import.meta.url)), true);

  assert.match(programCopySource, /"super-heroes":\s*\{\s*title:\s*"All Heroes"/);
});

test("Marvel superheroes is a separate program with the new boy cover", () => {
  const block = programBlock("marvel-superheroes");

  assert.match(block, /title:\s*"Marvel-вечеринка"/);
  assert.match(block, /cover:\s*"\/programs\/super-heroes-boys\.png"/);
  assert.match(block, /priorityHeroIds:\s*\["spiderman", "captain-america", "bumblebee", "optimus-prime", "superman", "deadpool"\]/);
});

test("core programs stay first in the requested catalog order", () => {
  const orderedIds = [...programsSource.matchAll(/^\s*id:\s*"([^"]+)"/gm)].map((match) => match[1]);

  assert.deepEqual(orderedIds.slice(0, 6), [
    "start",
    "standart",
    "super-heroes",
    "mishanya",
    "foam",
    "chemistry",
  ]);
});

test("thematic programs prioritize heroes without restricting the full choice", () => {
  const thematicProgramIds = [
    "marvel-superheroes",
    "unicorn-toddler-girls",
    "paw-patrol-toddler-girls",
    "paw-patrol-toddler-boys",
    "masha-bear",
    "mickey-mouse-party",
    "princesses",
    "fixiki-girls",
    "ladybug-party",
    "trolls-party",
    "pirates",
    "pikachu-party",
    "labubu-party",
    "sonic-party",
    "pj-masks",
    "minecraft",
    "huggy-wuggy-party",
    "leon-dj-marshmello",
    "kpop",
    "frozen-toddler-girls",
    "stitch-ohana-party",
  ];

  for (const id of thematicProgramIds) {
    const block = programBlock(id);

    assert.doesNotMatch(block, /onlyHeroIds/);
    assert.match(block, /priorityHeroIds/);
    assert.doesNotMatch(block, /label:\s*"Образ ведущ(?:его|ей)"/);
    assert.doesNotMatch(block, /label:\s*"Ростовая кукла"/);
    assert.doesNotMatch(block, /label:\s*"Персонаж на выбор"/);
  }
});

test("core program covers match the new audience-specific artwork", () => {
  const expectedCovers = {
    start: [
      "/programs/start-universal-2026.png",
      "/programs/start-toddlers-1-3-2026.png",
      "/programs/start-girls-4-6-2026.png",
    ],
    standart: [
      "/programs/standart-universal-2026.png",
      "/programs/standart-toddlers-1-3-2026.png",
      "/programs/standart-girls-4-6-2026.png",
      "/programs/standart-girls-7-10-2026.png",
      "/programs/standart-boys-4-6-2026.png",
      "/programs/standart-boys-7-10-2026.png",
    ],
    "super-heroes": [
      "/programs/all-heroes.png",
      "/programs/all-heroes-toddlers-0-3.png",
      "/programs/all-heroes-boys-4-7.png",
      "/programs/all-heroes-girls-4-7.png",
      "/programs/super-heroes-girls-7-10-2026.png",
    ],
  };

  for (const [id, covers] of Object.entries(expectedCovers)) {
    const block = programBlock(id);

    for (const cover of covers) {
      assert.match(block, new RegExp(cover.replaceAll("/", "\\/").replaceAll(".", "\\.")));
      assert.equal(
        existsSync(new URL(`../public${cover}`, import.meta.url)),
        true,
        `${cover} should exist in public assets`,
      );
    }
  }

  const startBlock = programBlock("start");
  assert.match(startBlock, /\{\s*segment:\s*"all",\s*cover:\s*"\/programs\/start-universal-2026\.png"\s*\}/);
  assert.match(startBlock, /\{\s*minAge:\s*1,\s*maxAge:\s*3,\s*cover:\s*"\/programs\/start-toddlers-1-3-2026\.png"\s*\}/);
  assert.match(startBlock, /\{\s*gender:\s*"girl",\s*minAge:\s*4,\s*maxAge:\s*6,\s*cover:\s*"\/programs\/start-girls-4-6-2026\.png"\s*\}/);

  const standartBlock = programBlock("standart");
  assert.match(standartBlock, /cover:\s*"\/programs\/standart-universal-2026\.png"/);
  assert.match(standartBlock, /\{\s*segment:\s*"all",\s*cover:\s*"\/programs\/standart-universal-2026\.png"\s*\}/);
  assert.match(standartBlock, /\{\s*minAge:\s*1,\s*maxAge:\s*3,\s*cover:\s*"\/programs\/standart-toddlers-1-3-2026\.png"\s*\}/);
  assert.match(standartBlock, /\{\s*gender:\s*"girl",\s*minAge:\s*4,\s*maxAge:\s*6,\s*cover:\s*"\/programs\/standart-girls-4-6-2026\.png"\s*\}/);
  assert.match(standartBlock, /\{\s*gender:\s*"girl",\s*minAge:\s*7,\s*maxAge:\s*10,\s*cover:\s*"\/programs\/standart-girls-7-10-2026\.png"\s*\}/);
  assert.match(standartBlock, /\{\s*gender:\s*"boy",\s*minAge:\s*4,\s*maxAge:\s*6,\s*cover:\s*"\/programs\/standart-boys-4-6-2026\.png"\s*\}/);
  assert.match(standartBlock, /\{\s*gender:\s*"boy",\s*minAge:\s*7,\s*maxAge:\s*10,\s*cover:\s*"\/programs\/standart-boys-7-10-2026\.png"\s*\}/);

  const superHeroesBlock = programBlock("super-heroes");
  assert.match(superHeroesBlock, /\{\s*minAge:\s*1,\s*maxAge:\s*3,\s*cover:\s*"\/programs\/all-heroes-toddlers-0-3\.png"\s*\}/);
  assert.match(superHeroesBlock, /\{\s*gender:\s*"boy",\s*minAge:\s*4,\s*maxAge:\s*7,\s*cover:\s*"\/programs\/all-heroes-boys-4-7\.png"\s*\}/);
  assert.match(superHeroesBlock, /\{\s*gender:\s*"girl",\s*minAge:\s*4,\s*maxAge:\s*7,\s*cover:\s*"\/programs\/all-heroes-girls-4-7\.png"\s*\}/);
  assert.match(superHeroesBlock, /\{\s*gender:\s*"girl",\s*minAge:\s*8,\s*maxAge:\s*10,\s*cover:\s*"\/programs\/super-heroes-girls-7-10-2026\.png"\s*\}/);
});
