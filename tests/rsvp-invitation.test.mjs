import assert from "node:assert/strict";
import test from "node:test";
import {
  buildRsvpGuestShareText,
  formatRsvpEventDate,
  formatRsvpEventLocation,
} from "../shared/rsvp-invitation.js";

const event = {
  locale: "ru",
  childName: "Маша",
  startsAt: "2026-08-28T13:00:00.000Z",
  city: "Хайфа",
  address: "Herzl 10, Haifa",
};

test("builds a clear Russian guest invitation with date, place and RSVP link", () => {
  const publicUrl = "https://mishanya-show.com/invite?event=example";
  const text = buildRsvpGuestShareText(event, publicUrl);

  assert.match(text, /^Приглашаем вас на праздник — Маша отмечает день рождения! 🎉/);
  assert.match(text, new RegExp(`📅 ${formatRsvpEventDate(event)}`));
  assert.match(text, /📍 Хайфа, Herzl 10, Haifa/);
  assert.match(text, /отметьте, сможете ли вы прийти/);
  assert.ok(text.endsWith(publicUrl));
});

test("builds the Hebrew version of the guest invitation", () => {
  const publicUrl = "https://mishanya-show.com/invite?event=example-he";
  const text = buildRsvpGuestShareText({ ...event, locale: "he", childName: "מאיה", city: "חיפה", address: "הרצל 10, חיפה" }, publicUrl);

  assert.match(text, /^מזמינים אתכם לחגוג עם מאיה! 🎉/);
  assert.match(text, /📅/);
  assert.match(text, /📍 הרצל 10, חיפה/);
  assert.match(text, /עדכנו אם תוכלו להגיע/);
  assert.ok(text.endsWith(publicUrl));
});

test("does not repeat the city when the full address already contains it", () => {
  assert.equal(formatRsvpEventLocation(event), "Хайфа, Herzl 10, Haifa");
  assert.equal(formatRsvpEventLocation({ city: "Haifa", address: "Herzl 10, Haifa" }), "Herzl 10, Haifa");
  assert.equal(formatRsvpEventLocation({ city: "Хайфа", address: "Хайфа" }), "Хайфа");
});
