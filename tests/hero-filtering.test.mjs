import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const programsSectionSource = readFileSync(
  new URL("../components/ProgramsSection.tsx", import.meta.url),
  "utf8",
);

test("girl-specific hero pools do not force included heroes into the slot", () => {
  assert.match(programsSectionSource, /const includedHeroIds = girlHeroIds \? \[\] : slot\.includedHeroIds;/);
  assert.match(programsSectionSource, /filterHeroes\([\s\S]*includedHeroIds,[\s\S]*audience,[\s\S]*onlyHeroIds,/);
});
