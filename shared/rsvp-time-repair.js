import { decryptPayload, encryptPayload } from "./gift-core.js";
import { createRsvpPayloadFingerprint, isClosedBitrixDeal, isRecurringBitrixTemplate } from "./rsvp-bitrix-core.js";
import { BITRIX_RSVP_TIME_FIELD, normalizeBitrixRsvpStartsAt } from "./rsvp-bitrix-time.js";
import { readRsvpDealSnapshot } from "./rsvp-bitrix-service.js";

function stop(code) {
  const error = new Error(code);
  error.retryable = false;
  throw error;
}

async function digest(value) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function repairRsvpEventTime(env, job) {
  const dealId = String(job?.dealId || "");
  if (!/^\d+$/.test(dealId) || Number(dealId) < 1) stop("invalid_repair_deal");
  if (!/^[a-f0-9]{64}$/.test(String(job.slugDigest || ""))
    || !/^[a-f0-9]{64}$/.test(String(job.payloadDigest || ""))) stop("invalid_repair_snapshot");
  const from = normalizeBitrixRsvpStartsAt(job.fromStartsAt);
  const to = normalizeBitrixRsvpStartsAt(job.toStartsAt);
  if (from.error || to.error) stop("invalid_repair_time");
  const secret = String(env.RSVP_DATA_SECRET || env.GIFT_DATA_SECRET || "").trim();
  if (!secret || !env.GIFT_DB) throw new Error("repair_not_configured");
  const event = await env.GIFT_DB.prepare(`SELECT id, public_slug, source_id, status, payload_ciphertext
    FROM rsvp_events WHERE source_type = 'bitrix_deal' AND source_id = ? LIMIT 1`).bind(dealId).first();
  if (!event || event.status !== "open" || String(event.source_id) !== dealId) stop("repair_event_not_open");
  if (await digest(event.public_slug) !== job.slugDigest) stop("repair_invitation_changed");

  const deal = await readRsvpDealSnapshot(env, dealId);
  if (!deal || !isClosedBitrixDeal(deal) || isRecurringBitrixTemplate(deal)) stop("repair_deal_not_active");
  const fresh = normalizeBitrixRsvpStartsAt(deal[BITRIX_RSVP_TIME_FIELD]);
  if (fresh.error || fresh.value !== to.value) stop("repair_bitrix_time_changed");
  const payload = await decryptPayload(event.payload_ciphertext, secret);
  const current = normalizeBitrixRsvpStartsAt(payload.startsAt);
  if (current.value === to.value) return { status: "already_correct", dealId };
  if (current.error || current.value !== from.value) stop("repair_invitation_time_changed");
  if (await digest(event.payload_ciphertext) !== job.payloadDigest) stop("repair_payload_changed");

  // Keep every existing payload property, private link and guest response. This
  // handler never schedules client messages, updates CRM fields or changes stage.
  const next = { ...payload, startsAt: to.value };
  const encrypted = await encryptPayload(next, secret);
  const fingerprint = await createRsvpPayloadFingerprint(next);
  const result = await env.GIFT_DB.prepare(`UPDATE rsvp_events
    SET payload_ciphertext = ?, source_payload_hash = ?, updated_at = ?
    WHERE id = ? AND source_type = 'bitrix_deal' AND source_id = ?
      AND public_slug = ? AND status = 'open' AND payload_ciphertext = ?`)
    .bind(encrypted, fingerprint, new Date().toISOString(), event.id, dealId, event.public_slug, event.payload_ciphertext).run();
  if (Number(result?.meta?.changes || 0) !== 1) stop("repair_concurrent_edit");
  return { status: "repaired", dealId };
}
