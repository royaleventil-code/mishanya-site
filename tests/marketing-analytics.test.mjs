import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pixelsSource = readFileSync(new URL("../components/MarketingPixels.tsx", import.meta.url), "utf8");
const eventsSource = readFileSync(new URL("../components/MarketingEvents.tsx", import.meta.url), "utf8");
const rootDocumentSource = readFileSync(new URL("../app/RootDocument.tsx", import.meta.url), "utf8");

test("Google Tag Manager is installed with its script and noscript snippets", () => {
  assert.match(rootDocumentSource, /GTM-NBGL3X4H/);
  assert.match(rootDocumentSource, /googletagmanager\.com\/gtm\.js/);
  assert.match(rootDocumentSource, /googletagmanager\.com\/ns\.html/);
  assert.match(rootDocumentSource, /window\.dataLayer/);
});

test("the previous direct GA4 loader is removed", () => {
  assert.doesNotMatch(pixelsSource, /NEXT_PUBLIC_GA_MEASUREMENT_ID/);
  assert.doesNotMatch(pixelsSource, /googletagmanager\.com\/gtag\/js/);
});

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
