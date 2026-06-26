import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pixelsSource = readFileSync(new URL("../components/MarketingPixels.tsx", import.meta.url), "utf8");
const eventsSource = readFileSync(new URL("../components/MarketingEvents.tsx", import.meta.url), "utf8");

test("Meta pixel sends the initial PageView from the pixel bootstrap", () => {
  const initIndex = pixelsSource.indexOf("fbq('init'");
  const pageViewIndex = pixelsSource.indexOf("fbq('track', 'PageView')");

  assert.notEqual(initIndex, -1);
  assert.notEqual(pageViewIndex, -1);
  assert.ok(pageViewIndex > initIndex);
});

test("route tracking skips the first Meta PageView to avoid duplicate initial events", () => {
  assert.match(eventsSource, /skipInitialMetaPageViewRef/);
  assert.match(eventsSource, /skipInitialMetaPageViewRef\.current = false/);
});
