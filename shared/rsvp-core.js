import { parsePhoneNumberFromString } from "libphonenumber-js/max";

export const RSVP_LOCALES = new Set(["ru", "he"]);
export const RSVP_STATUSES = new Set(["yes", "no", "maybe"]);

function cleanText(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function cleanMultiline(value) {
  return String(value || "").trim().replace(/\r\n/g, "\n");
}

export function normalizeRsvpPhone(value) {
  const phone = parsePhoneNumberFromString(String(value || ""), "IL");
  return phone?.isValid() ? String(phone.number) : null;
}

export function sanitizeRsvpSlug(value) {
  const slug = String(value || "").trim();
  return /^[A-Za-z0-9_-]{12,64}$/.test(slug) ? slug : null;
}

export function sanitizeManageToken(value) {
  const token = String(value || "").trim();
  return /^[A-Za-z0-9_-]{32,160}$/.test(token) ? token : null;
}

export function createOpaqueToken(byteLength = 24) {
  const bytes = crypto.getRandomValues(new Uint8Array(byteLength));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function validateRsvpEventPayload(raw, now = new Date()) {
  if (!raw || typeof raw !== "object") return { error: "invalid_payload" };
  if (!RSVP_LOCALES.has(raw.locale)) return { error: "invalid_locale" };

  const organizerName = cleanText(raw.organizerName);
  const organizerPhone = normalizeRsvpPhone(raw.organizerPhone);
  const childName = cleanText(raw.childName);
  const childAge = Number(raw.childAge);
  const startsAt = cleanText(raw.startsAt);
  const city = cleanText(raw.city);
  const address = cleanText(raw.address);
  const message = cleanMultiline(raw.message);

  if (organizerName.length < 2 || organizerName.length > 80) return { error: "invalid_organizer_name" };
  if (!organizerPhone) return { error: "invalid_phone" };
  if (childName.length < 1 || childName.length > 60) return { error: "invalid_child_name" };
  if (!Number.isInteger(childAge) || childAge < 1 || childAge > 18) return { error: "invalid_child_age" };
  if (city.length < 2 || city.length > 100) return { error: "invalid_city" };
  if (address.length < 3 || address.length > 180) return { error: "invalid_address" };
  if (message.length > 600) return { error: "invalid_message" };

  const startDate = new Date(startsAt);
  if (Number.isNaN(startDate.getTime())) return { error: "invalid_date" };
  const earliest = new Date(now.getTime() - 60 * 60 * 1000);
  const latest = new Date(now);
  latest.setFullYear(latest.getFullYear() + 2);
  if (startDate < earliest || startDate > latest) return { error: "invalid_date" };

  return {
    value: {
      locale: raw.locale,
      organizerName,
      organizerPhone,
      childName,
      childAge,
      startsAt: startDate.toISOString(),
      city,
      address,
      message,
      contactEnabled: raw.contactEnabled !== false,
    },
  };
}

export function validateRsvpResponsePayload(raw) {
  if (!raw || typeof raw !== "object") return { error: "invalid_payload" };
  const eventSlug = sanitizeRsvpSlug(raw.eventSlug);
  const respondentName = cleanText(raw.respondentName);
  const phone = normalizeRsvpPhone(raw.phone);
  const status = String(raw.status || "");
  const comment = cleanMultiline(raw.comment);
  let adults = Number(raw.adults);
  let children = Number(raw.children);

  if (!eventSlug) return { error: "invalid_event" };
  if (respondentName.length < 2 || respondentName.length > 80) return { error: "invalid_name" };
  if (!phone) return { error: "invalid_phone" };
  if (!RSVP_STATUSES.has(status)) return { error: "invalid_status" };
  if (!Number.isInteger(adults) || adults < 0 || adults > 10) return { error: "invalid_adults" };
  if (!Number.isInteger(children) || children < 0 || children > 10) return { error: "invalid_children" };
  if (comment.length > 500) return { error: "invalid_comment" };

  if (status === "yes" && adults + children < 1) return { error: "invalid_headcount" };
  if (status !== "yes") {
    adults = 0;
    children = 0;
  }

  return {
    value: {
      eventSlug,
      respondentName,
      phone,
      status,
      adults,
      children,
      comment,
    },
  };
}
