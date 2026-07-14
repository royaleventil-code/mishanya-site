const RSVP_TIME_ZONE = "Asia/Jerusalem";

/**
 * @typedef {"ru" | "he"} RsvpInvitationLocale
 * @typedef {{
 *   locale: RsvpInvitationLocale;
 *   childName: string;
 *   startsAt: string;
 *   city: string;
 *   address: string;
 * }} RsvpInvitationEvent
 */

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
 * @param {string} publicUrl
 */
export function buildRsvpGuestShareText(event, publicUrl) {
  const date = formatRsvpEventDate(event);
  const location = formatRsvpEventLocation(event);

  if (event.locale === "he") {
    return `מזמינים אתכם לחגוג עם ${event.childName}! 🎉\n\n📅 ${date}\n📍 ${location}\n\nאנא עברו לקישור ועדכנו אם תוכלו להגיע:\n${publicUrl}`;
  }

  return `Приглашаем вас на праздник — ${event.childName} отмечает день рождения! 🎉\n\n📅 ${date}\n📍 ${location}\n\nПожалуйста, перейдите по ссылке и отметьте, сможете ли вы прийти:\n${publicUrl}`;
}
