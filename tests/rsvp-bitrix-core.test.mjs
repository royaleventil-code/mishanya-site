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
const EVENT_TIME_CONTEXT = { useTimeZone: false, serverTime: "2026-07-14T11:00:00+03:00" };

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
  const result = buildRsvpPayloadFromBitrix(closedDeal(), contact(), NOW, EVENT_TIME_CONTEXT);
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
  ["winter birthday retains 14:00 from the timezone-disabled CRM field", "2026-11-06T13:00:00+02:00", "2026-11-06T12:00:00.000Z", "14:00"],
  ["summer birthday stays at 14:00", "2026-08-28T14:00:00+03:00", "2026-08-28T11:00:00.000Z", "14:00"],
  ["the day winter time starts retains 14:00", "2026-10-25T13:00:00+02:00", "2026-10-25T12:00:00.000Z", "14:00"],
  ["a different REST user offset does not change the appointment", "2026-11-06T04:00:00-07:00", "2026-11-06T12:00:00.000Z", "14:00"],
  ["a midnight appointment retains its CRM calendar date", "2026-11-05T23:30:00+02:00", "2026-11-05T22:30:00.000Z", "00:30"],
]) {
  test(name, () => {
    const result = buildRsvpPayloadFromBitrix(closedDeal({ UF_CRM_1645710833434: raw }), contact(), NOW, EVENT_TIME_CONTEXT);
    assert.equal(result.error, undefined);
    assert.equal(result.value.startsAt, expected);
    for (const locale of ["ru", "he"]) {
      assert.ok(formatRsvpEventDate({ ...result.value, locale }).endsWith(`· ${time}`));
    }
  });
}

test("the same appointment stays fixed when imported in a different season", () => {
  const raw = "2027-11-06T13:00:00+02:00";
  for (const serverTime of ["2027-01-15T10:00:00+03:00", "2027-07-15T10:00:00+03:00"]) {
    assert.deepEqual(normalizeBitrixRsvpStartsAt(raw, { useTimeZone: false, serverTime }), { value: "2027-11-06T12:00:00.000Z" });
  }
});

test("the server offset is read from Bitrix rather than hard-coded", () => {
  assert.deepEqual(normalizeBitrixRsvpStartsAt("2026-11-06T16:00:00+02:00", {
    useTimeZone: false, serverTime: "2026-09-24T11:00:00Z",
  }), { value: "2026-11-06T12:00:00.000Z" });
});

test("timezone-aware CRM fields preserve their original instant", () => {
  assert.deepEqual(normalizeBitrixRsvpStartsAt("2026-11-06T14:00:00+02:00", { useTimeZone: true }), {
    value: "2026-11-06T12:00:00.000Z",
  });
});

test("missing or invalid time metadata cannot silently move an appointment", () => {
  assert.equal(normalizeBitrixRsvpStartsAt("2026-11-06T13:00:00+02:00").error, "missing_event_time_context");
  assert.equal(normalizeBitrixRsvpStartsAt("2026-11-06T13:00:00+02:00", { useTimeZone: false }).error, "invalid_bitrix_server_time");
  assert.equal(normalizeBitrixRsvpStartsAt("2027-02-30T13:00:00+02:00", EVENT_TIME_CONTEXT).error, "invalid_date_timezone");
});

test("nonexistent and repeated Israel clock hours require clarification", () => {
  assert.equal(normalizeBitrixRsvpStartsAt("2027-03-26T02:30:00+03:00", EVENT_TIME_CONTEXT).error, "nonexistent_event_time");
  assert.equal(normalizeBitrixRsvpStartsAt("2026-10-25T00:30:00+02:00", EVENT_TIME_CONTEXT).error, "ambiguous_event_time");
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
