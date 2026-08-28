import assert from "node:assert/strict";
import test from "node:test";
import {
  createOpaqueToken,
  sanitizeManageToken,
  sanitizeRsvpSlug,
  validateRsvpEventPayload,
  validateRsvpInvitationHeadlinesPayload,
  validateRsvpResponsePayload,
} from "../shared/rsvp-core.js";

const NOW = new Date("2026-07-14T09:00:00.000Z");

test("validates and normalizes a new RSVP event", () => {
  const result = validateRsvpEventPayload({
    locale: "ru",
    organizerName: "  Анна   Леви ",
    organizerPhone: "054-800-0000",
    childName: "Миша",
    childAge: 7,
    startsAt: "2026-07-20T14:00:00.000Z",
    city: "Хайфа",
    address: "ул. Герцль, 10",
    message: "Будем рады!",
    contactEnabled: true,
  }, NOW);
  assert.equal(result.error, undefined);
  assert.equal(result.value.organizerName, "Анна Леви");
  assert.equal(result.value.organizerPhone, "+972548000000");
  assert.equal(result.value.startsAt, "2026-07-20T14:00:00.000Z");
});

test("rejects a past event", () => {
  const result = validateRsvpEventPayload({
    locale: "ru",
    organizerName: "Анна",
    organizerPhone: "+972548000000",
    childName: "Миша",
    childAge: 7,
    startsAt: "2026-07-10T14:00:00.000Z",
    city: "Хайфа",
    address: "Герцль, 10",
    message: "",
    contactEnabled: true,
  }, NOW);
  assert.equal(result.error, "invalid_date");
});

test("requires at least one attendee for yes response", () => {
  const result = validateRsvpResponsePayload({
    eventSlug: "AbCdEfGhIjKl",
    respondentName: "Анна",
    respondentKey: "guest_response_key_1234567890",
    status: "yes",
    adults: 0,
    children: 0,
    comment: "",
  });
  assert.equal(result.error, "invalid_headcount");
});

test("validates editable invitation headlines and treats empty values as automatic", () => {
  const checked = validateRsvpInvitationHeadlinesPayload({
    invitationHeadlines: {
      ru: "  Майэль и Эден   празднуют день рождения! ",
      he: "",
    },
  });
  assert.equal(checked.error, undefined);
  assert.deepEqual(checked.value, {
    ru: "Майэль и Эден празднуют день рождения!",
  });

  assert.equal(
    validateRsvpInvitationHeadlinesPayload({ invitationHeadlines: { ru: "я".repeat(141) } }).error,
    "invalid_invitation_headlines",
  );
});

test("clears headcount for a declined response", () => {
  const result = validateRsvpResponsePayload({
    eventSlug: "AbCdEfGhIjKl",
    respondentName: "Анна",
    respondentKey: "guest_response_key_1234567890",
    status: "no",
    adults: 2,
    children: 3,
    comment: "Не сможем",
  });
  assert.equal(result.error, undefined);
  assert.equal(result.value.adults, 0);
  assert.equal(result.value.children, 0);
});

test("uses an anonymous respondent key instead of a guest phone", () => {
  const valid = validateRsvpResponsePayload({
    eventSlug: "AbCdEfGhIjKl",
    respondentName: "Анна",
    respondentKey: "guest_response_key_1234567890",
    status: "maybe",
    adults: 0,
    children: 0,
    comment: "",
  });
  assert.equal(valid.error, undefined);
  assert.equal(valid.value.respondentKey, "guest_response_key_1234567890");
  assert.equal("phone" in valid.value, false);

  const missingKey = validateRsvpResponsePayload({
    eventSlug: "AbCdEfGhIjKl",
    respondentName: "Анна",
    status: "maybe",
    adults: 0,
    children: 0,
    comment: "",
  });
  assert.equal(missingKey.error, "invalid_respondent_key");
});

test("creates URL-safe public and management tokens", () => {
  const slug = createOpaqueToken(9);
  const manageToken = createOpaqueToken(32);
  assert.equal(sanitizeRsvpSlug(slug), slug);
  assert.equal(sanitizeManageToken(manageToken), manageToken);
});
