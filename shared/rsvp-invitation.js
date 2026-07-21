const RSVP_TIME_ZONE = "Asia/Jerusalem";

export const DEFAULT_RSVP_INVITATION_MESSAGES = Object.freeze({
  ru: "Будем рады разделить этот день вместе!",
  he: "נשמח לחגוג את היום הזה יחד איתכם!",
});

const HEBREW_NAME_OVERRIDES = Object.freeze({
  александр: "אלכסנדר",
  александра: "אלכסנדרה",
  анна: "אנה",
  даниил: "דניאל",
  даниэль: "דניאל",
  илья: "איליה",
  мария: "מריה",
  маша: "מאשה",
  миша: "מישה",
  олег: "אולג",
  ольга: "אולגה",
  роберт: "רוברט",
  сергей: "סרגיי",
  софия: "סופיה",
  софья: "סופיה",
});

const CYRILLIC_TO_HEBREW = Object.freeze({
  б: "ב",
  в: "ו",
  г: "ג",
  д: "ד",
  ж: "ז׳",
  з: "ז",
  й: "י",
  к: "ק",
  л: "ל",
  м: "מ",
  н: "נ",
  п: "פ",
  р: "ר",
  с: "ס",
  т: "ט",
  ф: "פ",
  х: "ח",
  ц: "צ",
  ч: "צ׳",
  ш: "ש",
  щ: "שצ׳",
});

function transliterateCyrillicWord(word) {
  const lower = word.toLocaleLowerCase("ru-RU");
  if (HEBREW_NAME_OVERRIDES[lower]) return HEBREW_NAME_OVERRIDES[lower];

  return Array.from(lower, (letter, index) => {
    const first = index === 0;
    const last = index === lower.length - 1;
    const next = lower[index + 1] || "";
    if (letter === "а") return first ? "א" : last ? "ה" : "";
    if (letter === "о") return first ? "או" : "ו";
    if (letter === "у") return "ו";
    if (letter === "и" || letter === "ы") return "י";
    if (letter === "э") return first ? "א" : "";
    if (letter === "е") return first || next === "й" ? "י" : "";
    if (letter === "ё") return "יו";
    if (letter === "ю") return "יו";
    if (letter === "я") return "יה";
    if (letter === "ь" || letter === "ъ") return "";
    return CYRILLIC_TO_HEBREW[letter] || letter;
  }).join("");
}

/** @param {string} childName */
export function transliterateRsvpChildNameToHebrew(childName) {
  const source = String(childName || "").trim();
  if (!source || /\p{Script=Hebrew}/u.test(source)) return source;
  if (!/\p{Script=Cyrillic}/u.test(source)) return source;
  return source.replace(/[А-ЯЁа-яё]+/gu, transliterateCyrillicWord);
}

/**
 * @typedef {"ru" | "he"} RsvpInvitationLocale
 * @typedef {{
 *   locale: RsvpInvitationLocale;
 *   childName: string;
 *   startsAt: string;
 *   city: string;
 *   address: string;
 *   message?: string;
 * }} RsvpInvitationEvent
 */

/**
 * Keep one RSVP event and present it in the language selected by the organizer.
 * Known automatic messages are localized; custom messages remain untouched.
 *
 * @template {RsvpInvitationEvent} T
 * @param {T} event
 * @param {RsvpInvitationLocale} locale
 * @returns {T}
 */
export function localizeRsvpInvitationEvent(event, locale) {
  const targetLocale = locale === "he" ? "he" : "ru";
  const sourceLocale = event.locale === "he" ? "he" : "ru";
  const message = String(event.message || "").trim();
  const usesAutomaticMessage = !message || message === DEFAULT_RSVP_INVITATION_MESSAGES[sourceLocale];

  return /** @type {T} */ ({
    ...event,
    locale: targetLocale,
    childName: targetLocale === "he"
      ? transliterateRsvpChildNameToHebrew(event.childName)
      : event.childName,
    message: usesAutomaticMessage ? DEFAULT_RSVP_INVITATION_MESSAGES[targetLocale] : event.message,
  });
}

/**
 * @param {string} origin
 * @param {string} slug
 * @param {RsvpInvitationLocale} locale
 */
export function buildRsvpGuestUrl(origin, slug, locale) {
  const params = new URLSearchParams({
    event: String(slug || ""),
    lang: locale === "he" ? "he" : "ru",
  });
  return `${String(origin || "").replace(/\/+$/u, "")}/invite?${params.toString()}`;
}

/** @param {RsvpInvitationEvent} event */
export function formatRsvpEventDate(event) {
  const locale = event.locale === "he" ? "he-IL" : "ru-RU";
  const startsAt = new Date(event.startsAt);
  const date = new Intl.DateTimeFormat(locale, {
    timeZone: RSVP_TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(startsAt).replace(/\s*г\.$/u, "");
  const time = new Intl.DateTimeFormat(locale, {
    timeZone: RSVP_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
  }).format(startsAt);
  return `${date} · ${time}`;
}

/** @param {Pick<RsvpInvitationEvent, "city" | "address">} event */
export function formatRsvpEventLocation(event) {
  const city = event.city.trim();
  const address = event.address.trim();
  const normalizedCity = city.toLocaleLowerCase();
  const normalizedAddress = address.toLocaleLowerCase();

  if (!city || normalizedAddress === normalizedCity || normalizedAddress.includes(normalizedCity)) return address || city;
  if (!address) return city;
  return `${city}, ${address}`;
}

/**
 * @param {RsvpInvitationEvent} event
 */
export function buildRsvpGuestShareBody(event) {
  const date = formatRsvpEventDate(event);
  const location = formatRsvpEventLocation(event);

  if (event.locale === "he") {
    return `מזמינים אתכם לחגוג עם ${event.childName}! 🎉\n\n📅 ${date}\n📍 ${location}\n\nאנא עברו לקישור ועדכנו אם תוכלו להגיע:`;
  }

  return `Приглашаем вас на праздник — ${event.childName} отмечает день рождения! 🎉\n\n📅 ${date}\n📍 ${location}\n\nПожалуйста, перейдите по ссылке и отметьте, сможете ли вы прийти:`;
}

/**
 * @param {string} messageBody
 * @param {string} publicUrl
 */
export function composeRsvpGuestShareText(messageBody, publicUrl) {
  const body = String(messageBody || "").trim();
  const link = String(publicUrl || "").trim();
  return [body, link].filter(Boolean).join("\n");
}

/**
 * @param {RsvpInvitationEvent} event
 * @param {string} publicUrl
 */
export function buildRsvpGuestShareText(event, publicUrl) {
  return composeRsvpGuestShareText(buildRsvpGuestShareBody(event), publicUrl);
}
