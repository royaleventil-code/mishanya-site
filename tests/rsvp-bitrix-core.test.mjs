import assert from "node:assert/strict";
import test from "node:test";
import { normalizeBitrixRsvpStartsAt } from "../shared/rsvp-bitrix-time.js";
import { formatRsvpEventDate } from "../shared/rsvp-invitation.js";

import {
  buildRsvpPayloadFromBitrix,
  constantTimeSecretEqual,
  createBitrixWebhookFingerprint,
  isClosedBitrixDeal,
  parseBitrixDealUpdateForm,
} from "../shared/rsvp-bitrix-core.js";

const NOW = new Date("2026-07-14T08:00:00.000Z");

function closedDeal(overrides = {}) {
  return {
    ID: "18123",
    CATEGORY_ID: "0",
    STAGE_ID: "UC_HP4F3F",
    TITLE: "др 2026 Анна Девочка возраст 6 Haifa",
    CONTACT_ID: "4854",
    UF_CRM_1645710600299: "Маша",
    UF_CRM_6314CD391B643: "Маша",
    UF_CRM_620BA6CC57523: "6",
    UF_CRM_1645710833434: "2026-08-28T16:00:00+03:00",
    UF_CRM_620BA6CC427A3: "Herzl 10, Haifa",
    ...overrides,
  };
}

function contact(overrides = {}) {
  return {
    ID: "4854",
    NAME: "Анна",
    LAST_NAME: "Леви",
    PHONE: [{ VALUE: "050-000-0000" }, { VALUE: "+972548000000" }],
    ...overrides,
  };
}

test("parses the official ONCRMDEALUPDATE form payload", () => {
  const form = new URLSearchParams({
    event: "ONCRMDEALUPDATE",
    event_handler_id: "201",
    "data[FIELDS][ID]": "18123",
    ts: "1784012400",
    "auth[domain]": "Mishanya.bitrix24.com",
    "auth[application_token]": "event-token-value",
  });
  const result = parseBitrixDealUpdateForm(form);
  assert.equal(result.error, undefined);
  assert.deepEqual(result.value, {
    event: "ONCRMDEALUPDATE",
    eventHandlerId: "201",
    dealId: "18123",
    eventTs: 1784012400,
    domain: "mishanya.bitrix24.com",
    applicationToken: "event-token-value",
  });
});

test("rejects a different Bitrix event", () => {
  const result = parseBitrixDealUpdateForm(new URLSearchParams({
    event: "ONCRMLEADUPDATE",
    event_handler_id: "201",
    "data[FIELDS][ID]": "18123",
    ts: "1784012400",
    "auth[domain]": "mishanya.bitrix24.com",
    "auth[application_token]": "event-token-value",
  }));
  assert.equal(result.error, "invalid_event");
});

test("recognizes both closed-work pipelines and no other stage", () => {
  assert.equal(isClosedBitrixDeal(closedDeal()), true);
  assert.equal(isClosedBitrixDeal(closedDeal({ CATEGORY_ID: "2", STAGE_ID: "C2:UC_AWENHX" })), true);
  assert.equal(isClosedBitrixDeal(closedDeal({ STAGE_ID: "WON" })), false);
});

test("maps a fresh deal and contact into the existing RSVP payload", () => {
  const result = buildRsvpPayloadFromBitrix(closedDeal(), contact(), NOW);
  assert.equal(result.error, undefined);
  assert.equal(result.value.locale, "ru");
  assert.equal(result.value.organizerName, "Анна Леви");
  assert.equal(result.value.organizerPhone, "+972500000000");
  assert.equal(result.value.childName, "Маша");
  assert.equal(result.value.childAge, 6);
  assert.equal(result.value.startsAt, "2026-08-28T13:00:00.000Z");
  assert.equal(result.value.city, "Herzl 10, Haifa");
  assert.equal(result.value.address, "Herzl 10, Haifa");
});

for (const [name, raw, expected, time] of [
  ["Leonel's winter invitation keeps the agreed 17:30", "2026-11-11T17:30:00+02:00", "2026-11-11T15:30:00.000Z", "17:30"],
  ["winter server hours are converted to Israel time once", "2026-12-11T15:00:00+03:00", "2026-12-11T12:00:00.000Z", "14:00"],
  ["summer birthday stays at 14:00", "2026-08-28T14:00:00+03:00", "2026-08-28T11:00:00.000Z", "14:00"],
  ["the day winter time starts retains 14:00", "2026-10-25T15:00:00+03:00", "2026-10-25T12:00:00.000Z", "14:00"],
  ["a different REST user offset does not change the appointment", "2026-11-06T05:00:00-07:00", "2026-11-06T12:00:00.000Z", "14:00"],
  ["a midnight appointment retains its Israel calendar date", "2026-11-05T22:30:00Z", "2026-11-05T22:30:00.000Z", "00:30"],
]) {
  test(name, () => {
    const result = buildRsvpPayloadFromBitrix(closedDeal({ UF_CRM_1645710833434: raw }), contact(), NOW);
    assert.equal(result.error, undefined);
    assert.equal(result.value.startsAt, expected);
    for (const locale of ["ru", "he"]) {
      assert.ok(formatRsvpEventDate({ ...result.value, locale }).endsWith(`· ${time}`));
    }
  });
}

test("the same instant stays fixed across REST offsets and old field metadata", () => {
  for (const raw of ["2026-11-11T17:30:00+02:00", "2026-11-11T18:30:00+03:00", "2026-11-11T15:30:00Z"]) {
    for (const context of [undefined, { useTimeZone: true },
      { useTimeZone: false, serverTime: "2026-07-14T11:00:00+03:00" },
      { useTimeZone: false, serverTime: "2026-11-02T10:00:00+02:00" }]) {
      assert.deepEqual(normalizeBitrixRsvpStartsAt(raw, context), { value: "2026-11-11T15:30:00.000Z" });
    }
  }
});

test("invalid timestamps cannot silently move an appointment", () => {
  for (const raw of ["", "2026-11-11T17:30:00", "2027-02-30T13:00:00+02:00", "2026-11-11T17:30:00+02:99"]) {
    assert.equal(normalizeBitrixRsvpStartsAt(raw).error, "invalid_date_timezone");
  }
});

test("explicit offsets distinguish repeated Israel hours at the winter transition", () => {
  assert.deepEqual(normalizeBitrixRsvpStartsAt("2026-10-25T01:30:00+03:00"), { value: "2026-10-24T22:30:00.000Z" });
  assert.deepEqual(normalizeBitrixRsvpStartsAt("2026-10-25T01:30:00+02:00"), { value: "2026-10-24T23:30:00.000Z" });
});

test("spring transition timestamps retain their explicit instant", () => {
  assert.deepEqual(normalizeBitrixRsvpStartsAt("2027-03-26T03:30:00+03:00"), { value: "2027-03-26T00:30:00.000Z" });
});

test("fails closed when duplicate child-name fields disagree", () => {
  const result = buildRsvpPayloadFromBitrix(
    closedDeal({ UF_CRM_6314CD391B643: "Миша" }),
    contact(),
    NOW,
  );
  assert.equal(result.error, "child_name_mismatch");
});

test("rejects a Bitrix date without an explicit timezone", () => {
  const result = buildRsvpPayloadFromBitrix(
    closedDeal({ UF_CRM_1645710833434: "2026-08-28T16:00:00" }),
    contact(),
    NOW,
  );
  assert.equal(result.error, "invalid_date_timezone");
});

test("ignores recurring templates", () => {
  const result = buildRsvpPayloadFromBitrix(closedDeal({ TITLE: "РС ДР 2027 Анна" }), contact(), NOW);
  assert.equal(result.error, "recurring_template");
});

test("compares webhook tokens without exposing them", async () => {
  assert.equal(await constantTimeSecretEqual("same-token", "same-token"), true);
  assert.equal(await constantTimeSecretEqual("wrong-token", "same-token"), false);
});

test("creates stable webhook fingerprints", async () => {
  const event = {
    event: "ONCRMDEALUPDATE",
    eventHandlerId: "201",
    dealId: "18123",
    eventTs: 1784012400,
    domain: "mishanya.bitrix24.com",
  };
  const first = await createBitrixWebhookFingerprint(event);
  const second = await createBitrixWebhookFingerprint({ ...event });
  assert.equal(first, second);
  assert.match(first, /^[a-f0-9]{64}$/);
});
