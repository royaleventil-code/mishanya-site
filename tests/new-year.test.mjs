import test from "node:test";
import assert from "node:assert/strict";
import { NEW_YEAR_PROGRAMS, newYearMessage, newYearPath, newYearProgram } from "../data/new-year.ts";

test("approved 2026 offers retain Sergey's explicit solo correction", () => {
  assert.deepEqual(NEW_YEAR_PROGRAMS.map(p => [p.id, p.options.map(o => [o.minutes ?? null, o.price])]), [
    ["ded-moroz", [[30, 1000]]],
    ["ded-moroz-snegurochka", [[30, 1200], [60, 1500]]],
    ["olaf", [[60, 1700], [90, 2300]]],
    ["grinch", [[60, 2000], [90, 2500]]],
    ["circus", [[45, 1600]]],
    ["new-year-night", [[null, 3500]]],
  ]);
  assert.equal(newYearProgram("circus").options[0].from, true);
});

test("performer photographs follow the supplied cast assignments", () => {
  assert.equal(newYearProgram("ded-moroz").photo, "solo-red-winter-v1");
  assert.equal(newYearProgram("ded-moroz-snegurochka").photo, "denis-silver-pair");
  assert.equal(newYearProgram("olaf").photo, "denis-silver-pair");
  assert.equal(newYearProgram("olaf").mascot, "olaf");
  assert.equal(newYearProgram("grinch").photo, "mishanya-blue-pair");
  assert.equal(newYearProgram("grinch").mascot, "grinch");
});

test("every duration creates a localized WhatsApp message with the selected price", () => {
  for (const program of NEW_YEAR_PROGRAMS) for (const option of program.options) for (const locale of ["ru", "he"]) {
    const message = newYearMessage(program, option, locale);
    assert.ok(message.includes(program.name[locale]));
    assert.ok(message.includes(`${option.price} ₪`));
    if (option.minutes) assert.ok(message.includes(`${option.minutes} ${locale === "ru" ? "минут" : "דקות"}`));
    assert.doesNotMatch(message, /Возраст ребёнка:|Город:|Дата:|Время:|undefined/);
    assert.equal(newYearPath(locale, program.id), `/${locale}/holiday/new-year/${program.id}`);
  }
});

test("circus preserves the from-price; night does not promise an unknown duration or cast", () => {
  const circus = newYearProgram("circus");
  assert.ok(newYearMessage(circus, circus.options[0], "ru").includes("от 1600 ₪"));
  const night = newYearProgram("new-year-night");
  assert.equal(night.cast, undefined);
  assert.equal(night.options[0].minutes, undefined);
  assert.doesNotMatch(newYearMessage(night, night.options[0], "ru"), /минут/);
  assert.equal(newYearProgram("missing"), undefined);
});
