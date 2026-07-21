import { normalizeRsvpPhone, validateRsvpEventPayload } from "./rsvp-core.js";
import { DEFAULT_RSVP_INVITATION_MESSAGES } from "./rsvp-invitation.js";

export const BITRIX_DEAL_UPDATE_EVENT = "ONCRMDEALUPDATE";
export const BITRIX_CLOSED_STAGES = new Map([
  ["0", "UC_HP4F3F"],
  ["2", "C2:UC_AWENHX"],
]);
export const RSVP_BITRIX_SOURCE_TYPE = "bitrix_deal";
export const RSVP_DEFAULT_MESSAGE_RU = DEFAULT_RSVP_INVITATION_MESSAGES.ru;

function cleanText(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function normalizedPortalDomain(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "");
}

function positiveInteger(value) {
  const raw = cleanText(value);
  if (!/^\d+$/.test(raw)) return null;
  const number = Number(raw);
  return Number.isSafeInteger(number) && number > 0 ? number : null;
}

export function parseBitrixDealUpdateForm(body) {
  const params = body instanceof URLSearchParams ? body : new URLSearchParams(String(body || ""));
  const event = cleanText(params.get("event")).toUpperCase();
  const eventHandlerId = positiveInteger(params.get("event_handler_id"));
  const dealId = positiveInteger(params.get("data[FIELDS][ID]"));
  const eventTs = positiveInteger(params.get("ts"));
  const domain = normalizedPortalDomain(params.get("auth[domain]"));
  const applicationToken = cleanText(params.get("auth[application_token]"));

  if (event !== BITRIX_DEAL_UPDATE_EVENT) return { error: "invalid_event" };
  if (!eventHandlerId) return { error: "invalid_event_handler" };
  if (!dealId) return { error: "invalid_deal_id" };
  if (!eventTs) return { error: "invalid_event_timestamp" };
  if (!domain || !applicationToken) return { error: "invalid_auth" };

  return {
    value: {
      event,
      eventHandlerId: String(eventHandlerId),
      dealId: String(dealId),
      eventTs,
      domain,
      applicationToken,
    },
  };
}

export function normalizeBitrixDomain(value) {
  return normalizedPortalDomain(value);
}

export async function constantTimeSecretEqual(actual, expected) {
  if (!actual || !expected) return false;
  const encoder = new TextEncoder();
  const [actualDigest, expectedDigest] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(String(actual))),
    crypto.subtle.digest("SHA-256", encoder.encode(String(expected))),
  ]);
  const left = new Uint8Array(actualDigest);
  const right = new Uint8Array(expectedDigest);
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left[index] ^ right[index];
  }
  return difference === 0;
}

export async function createBitrixWebhookFingerprint(event) {
  const source = [
    event.domain,
    event.event,
    event.eventHandlerId,
    event.dealId,
    String(event.eventTs),
  ].join("|");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(source));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function createRsvpPayloadFingerprint(payload) {
  const canonical = JSON.stringify({
    locale: payload.locale,
    organizerName: payload.organizerName,
    organizerPhone: payload.organizerPhone,
    childName: payload.childName,
    childAge: payload.childAge,
    startsAt: payload.startsAt,
    city: payload.city,
    address: payload.address,
    message: payload.message,
    contactEnabled: payload.contactEnabled,
  });
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonical));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function isClosedBitrixDeal(deal) {
  const categoryId = cleanText(deal?.CATEGORY_ID);
  const stageId = cleanText(deal?.STAGE_ID);
  return BITRIX_CLOSED_STAGES.get(categoryId) === stageId;
}

export function isRecurringBitrixTemplate(deal) {
  return /^РС(?:\s|$)/iu.test(cleanText(deal?.TITLE));
}

export function contactIdFromDeal(deal) {
  const direct = positiveInteger(deal?.CONTACT_ID);
  if (direct) return String(direct);
  const ids = Array.isArray(deal?.CONTACT_IDS) ? deal.CONTACT_IDS : [];
  const first = ids.map(positiveInteger).find(Boolean);
  return first ? String(first) : null;
}

function firstValidPhone(contact) {
  const phones = Array.isArray(contact?.PHONE) ? contact.PHONE : [];
  return phones
    .map((phone) => cleanText(phone?.VALUE ?? phone))
    .find((phone) => normalizeRsvpPhone(phone)) || "";
}

export function buildRsvpPayloadFromBitrix(deal, contact, now = new Date()) {
  if (!deal || typeof deal !== "object") return { error: "deal_not_found" };
  if (!isClosedBitrixDeal(deal)) return { error: "deal_not_closed" };
  if (isRecurringBitrixTemplate(deal)) return { error: "recurring_template" };

  const childName = cleanText(deal.UF_CRM_1645710600299);
  const duplicateChildName = cleanText(deal.UF_CRM_6314CD391B643);
  if (!childName || !duplicateChildName) return { error: "missing_child_name" };
  if (childName !== duplicateChildName) return { error: "child_name_mismatch" };

  const address = cleanText(deal.UF_CRM_620BA6CC427A3);
  if (!address) return { error: "missing_address" };

  const organizerName = cleanText([contact?.NAME, contact?.LAST_NAME].filter(Boolean).join(" "));
  if (!organizerName) return { error: "missing_organizer_name" };

  const startsAt = cleanText(deal.UF_CRM_1645710833434);
  if (!/T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/i.test(startsAt)) {
    return { error: "invalid_date_timezone" };
  }

  const payload = {
    locale: "ru",
    organizerName,
    organizerPhone: firstValidPhone(contact),
    childName,
    childAge: Number(deal.UF_CRM_620BA6CC57523),
    startsAt,
    city: address,
    address,
    message: RSVP_DEFAULT_MESSAGE_RU,
    contactEnabled: true,
  };
  const checked = validateRsvpEventPayload(payload, now);
  if (checked.error) return { error: checked.error };
  return checked;
}
