import assert from "node:assert/strict";
import test from "node:test";
import {
  buildRsvpGuestShareBody,
  buildRsvpGuestUrl,
  buildRsvpGuestShareText,
  composeRsvpGuestShareText,
  DEFAULT_RSVP_INVITATION_MESSAGES,
  formatDefaultRsvpInvitationHeadline,
  formatRsvpEventDate,
  formatRsvpEventLocation,
  formatRsvpInvitationHeadline,
  hasMultipleRsvpCelebrants,
  localizeRsvpInvitationEvent,
  transliterateRsvpChildNameToHebrew,
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

test("uses plural birthday wording for two celebrants without showing one incorrect age", () => {
  const jointBirthday = {
    ...event,
    childName: "Майэль и Эден",
    childAge: 10,
  };

  assert.equal(hasMultipleRsvpCelebrants(jointBirthday.childName), true);
  assert.equal(
    formatRsvpInvitationHeadline(jointBirthday),
    "Майэль и Эден празднуют день рождения!",
  );
  assert.match(
    buildRsvpGuestShareBody(jointBirthday),
    /^Приглашаем вас на праздник — Майэль и Эден празднуют день рождения! 🎉/,
  );
  assert.doesNotMatch(formatRsvpInvitationHeadline(jointBirthday), /10/);
});

test("keeps the age wording for one celebrant", () => {
  assert.equal(
    formatRsvpInvitationHeadline({ ...event, childAge: 9 }),
    "Маша исполняется 9!",
  );
  assert.equal(hasMultipleRsvpCelebrants("Анна-Мария"), false);
});

test("uses a saved private-link headline only for its selected language", () => {
  const customized = {
    ...event,
    childAge: 9,
    invitationHeadlines: {
      ru: "Ждём вас на двойном празднике!",
      he: "מחכים לכם בחגיגה הכפולה!",
    },
  };

  assert.equal(formatRsvpInvitationHeadline(customized), "Ждём вас на двойном празднике!");
  assert.equal(
    formatRsvpInvitationHeadline(localizeRsvpInvitationEvent(customized, "he")),
    "מחכים לכם בחגיגה הכפולה!",
  );
  assert.equal(formatDefaultRsvpInvitationHeadline(customized), "Маша исполняется 9!");
});

test("uses a neutral Hebrew headline for two celebrants", () => {
  const jointBirthday = {
    ...event,
    locale: "he",
    childName: "מיאל ועדן",
    childAge: 10,
  };

  assert.equal(hasMultipleRsvpCelebrants(jointBirthday.childName), true);
  assert.equal(formatRsvpInvitationHeadline(jointBirthday), "יום ההולדת של מיאל ועדן!");
});

test("keeps a Russian conjunction as a Hebrew conjunction when localizing two names", () => {
  const localized = localizeRsvpInvitationEvent({
    ...event,
    childName: "Майэль и Эден",
    childAge: 10,
  }, "he");

  assert.equal(localized.childName, "מיאל ועדן");
  assert.equal(hasMultipleRsvpCelebrants(localized.childName), true);
  assert.equal(formatRsvpInvitationHeadline(localized), "יום ההולדת של מיאל ועדן!");
});

test("does not repeat the city when the full address already contains it", () => {
  assert.equal(formatRsvpEventLocation(event), "Хайфа, Herzl 10, Haifa");
  assert.equal(formatRsvpEventLocation({ city: "Haifa", address: "Herzl 10, Haifa" }), "Herzl 10, Haifa");
  assert.equal(formatRsvpEventLocation({ city: "Хайфа", address: "Хайфа" }), "Хайфа");
});

test("builds separate Russian and Hebrew guest links for the same event", () => {
  assert.equal(
    buildRsvpGuestUrl("https://mishanya-show.com/", "example", "ru"),
    "https://mishanya-show.com/invite?event=example&lang=ru",
  );
  assert.equal(
    buildRsvpGuestUrl("https://mishanya-show.com", "example", "he"),
    "https://mishanya-show.com/invite?event=example&lang=he",
  );
});

test("localizes the automatic invitation message without duplicating the event", () => {
  const localized = localizeRsvpInvitationEvent({
    ...event,
    message: DEFAULT_RSVP_INVITATION_MESSAGES.ru,
  }, "he");

  assert.equal(localized.locale, "he");
  assert.equal(localized.message, DEFAULT_RSVP_INVITATION_MESSAGES.he);
  assert.equal(localized.childName, "מאשה");
  assert.equal(event.childName, "Маша");
  assert.equal(localized.startsAt, event.startsAt);
});

test("keeps a custom invitation message when changing the interface language", () => {
  const localized = localizeRsvpInvitationEvent({ ...event, message: "Вход со двора" }, "he");
  assert.equal(localized.message, "Вход со двора");
});

test("transliterates a Cyrillic child name for Hebrew invitations", () => {
  assert.equal(transliterateRsvpChildNameToHebrew("Роберт"), "רוברט");
  assert.equal(transliterateRsvpChildNameToHebrew("Маша"), "מאשה");
});

test("keeps Hebrew and Latin child names unchanged", () => {
  assert.equal(transliterateRsvpChildNameToHebrew("רוברט"), "רוברט");
  assert.equal(transliterateRsvpChildNameToHebrew("Robert"), "Robert");
});

test("keeps the guest link protected when the organizer edits the message body", () => {
  const publicUrl = "https://mishanya-show.com/invite?event=example&lang=ru";
  const body = buildRsvpGuestShareBody(event);
  assert.doesNotMatch(body, /https:\/\//);
  assert.equal(composeRsvpGuestShareText("Ждём вас!", publicUrl), `Ждём вас!\n${publicUrl}`);
  assert.equal(composeRsvpGuestShareText("", publicUrl), publicUrl);
});
