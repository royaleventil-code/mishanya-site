import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const showcaseSource = readFileSync(
  new URL("../components/home/ProgramsShowcase.tsx", import.meta.url),
  "utf8",
);

test("featured homepage program cards link to the all-programs catalog", () => {
  assert.doesNotMatch(showcaseSource, /FEATURED_TARGETS/);
  assert.doesNotMatch(showcaseSource, /localePath\(locale, "\/(boy|girl)\//);
  assert.match(
    showcaseSource,
    /href=\{`\$\{localePath\(locale, "\/all"\)\}\?program=\$\{encodeURIComponent\(p\.id\)\}`\}/,
  );
});
