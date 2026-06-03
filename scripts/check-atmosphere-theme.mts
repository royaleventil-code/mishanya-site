import assert from "node:assert/strict";
import { resolveAtmosphereTheme } from "../lib/atmosphere.ts";

assert.equal(resolveAtmosphereTheme({ gender: "girl", age: 2 })?.ageGroup, "toddler");
assert.equal(resolveAtmosphereTheme({ gender: "boy", age: 5 })?.ageGroup, "kids");
assert.equal(resolveAtmosphereTheme({ gender: "girl", age: 9 })?.ageGroup, "older");
assert.equal(resolveAtmosphereTheme({ gender: "boy", age: 9 })?.motifs.includes("pixel"), true);
assert.equal(resolveAtmosphereTheme({ gender: "girl", age: 9 })?.motifs.includes("music"), true);
assert.equal(resolveAtmosphereTheme({ gender: "girl", age: 4 })?.motifs.includes("ribbon"), true);
assert.equal(resolveAtmosphereTheme({ gender: "boy", age: 4 })?.motifs.includes("rocket"), true);
assert.equal(
  resolveAtmosphereTheme({ gender: "girl", age: 2 }, "chemistry-show")?.programTheme?.id,
  "chemistry-show",
);
assert.equal(resolveAtmosphereTheme({ age: 4 }), null);
assert.equal(resolveAtmosphereTheme({ gender: "boy", age: 11 }), null);

console.log("Atmosphere theme checks passed");
