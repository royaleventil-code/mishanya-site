import {
  buildRsvpPayloadFromBitrix,
  contactIdFromDeal,
  createRsvpPayloadFingerprint,
  isClosedBitrixDeal,
  isRecurringBitrixTemplate,
  RSVP_BITRIX_SOURCE_TYPE,
} from "./rsvp-bitrix-core.js";
import { createOpaqueToken } from "./rsvp-core.js";
import { decryptPayload, encryptPayload, phoneHash } from "./gift-core.js";

const MAX_TOKEN_ATTEMPTS = 5;
const WRITEBACK_LEASE_MS = 2 * 60 * 1000;
const RSVP_ACTIVITY_MARKER_PREFIX = "[MISHANYA_RSVP_DEAL:";
const RSVP_CLIENT_MESSAGE_KIND = "rsvp_client_invitation";
const RSVP_CLIENT_MESSAGE_TEMPLATE_VERSION = "rsvp-client-ru-v1";
const RSVP_CLIENT_MESSAGE_DELAY_SECONDS = 10 * 60;
const RSVP_CLIENT_MESSAGE_MODES = new Set(["off", "dry-run", "test", "live"]);
const RSVP_CLIENT_MESSAGE_TERMINAL_STATUSES = new Set([
  "accepted",
  "sent",
  "sending",
  "ambiguous",
  "failed",
]);

function cleanErrorCode(value, fallback = "bitrix_sync_failed") {
  const code = String(value || fallback).trim().slice(0, 160);
  return /^[a-z0-9_:-]+$/i.test(code) ? code : fallback;
}

function dataSecret(env) {
  return String(env.RSVP_DATA_SECRET || env.GIFT_DATA_SECRET || "").trim();
}

async function bitrixCall(env, method, params) {
  const configuredBase = String(env.BITRIX_WEBHOOK_URL || "").trim();
  if (!configuredBase) throw new Error("bitrix_not_configured");
  const base = `${configuredBase.replace(/\/+$/, "")}/`;
  const response = await fetch(`${base}${method}.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Accept: "application/json",
    },
    body: JSON.stringify(params),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.error) {
    const error = new Error(cleanErrorCode(data.error, `bitrix_${method.replace(/\./g, "_")}_failed`));
    error.transient = response.status >= 429 || response.status >= 500 || data.error === "QUERY_LIMIT_EXCEEDED";
    throw error;
  }
  return data.result;
}

async function readDealContext(env, dealId) {
  const deal = await bitrixCall(env, "crm.deal.get", { id: dealId });
  if (!deal) return { deal: null, contact: null };
  let contactId = contactIdFromDeal(deal);
  if (!contactId) {
    const links = await bitrixCall(env, "crm.deal.contact.items.get", { id: dealId });
    const first = Array.isArray(links) ? links.find((item) => Number(item?.CONTACT_ID) > 0) : null;
    contactId = first?.CONTACT_ID ? String(first.CONTACT_ID) : null;
  }
  if (!contactId) return { deal, contact: null };
  const contact = await bitrixCall(env, "crm.contact.get", { id: contactId });
  return { deal, contact };
}

function publicOrigin(env) {
  const configured = String(env.RSVP_PUBLIC_ORIGIN || "https://mishanya-show.com").trim();
  return configured.replace(/\/+$/, "");
}

function rsvpActivityMarker(dealId) {
  return `${RSVP_ACTIVITY_MARKER_PREFIX}${dealId}]`;
}

function clientMessageStatusLabel(status) {
  if (status === "accepted" || status === "sent") {
    return "Сообщение клиенту автоматически принято WhatsApp-сервисом.";
  }
  if (status === "scheduled" || status === "rescheduling" || status === "retryable") {
    return "Сообщение клиенту будет отправлено автоматически через 10 минут после последнего изменения сделки.";
  }
  if (status === "ambiguous" || status === "sending") {
    return "Статус отправки сообщения клиенту требует проверки; автоматический повтор заблокирован.";
  }
  if (status === "failed") return "Сообщение клиенту не отправлено; автоматический повтор заблокирован.";
  return "Сообщение клиенту автоматически ещё не отправлялось.";
}

function rsvpActivityDescription(dealId, publicUrl, manageUrl, messageStatus) {
  return [
    "RSVP-приглашение создано автоматически.",
    "",
    `Ссылка для гостей: ${publicUrl}`,
    `Личный кабинет клиента: ${manageUrl}`,
    "",
    clientMessageStatusLabel(messageStatus),
    rsvpActivityMarker(dealId),
  ].join("\n");
}

export async function updateRsvpBitrixSyncState(db, dealId, patch = {}) {
  const now = new Date().toISOString();
  const status = cleanErrorCode(patch.status, "queued");
  const lastError = patch.lastError ? cleanErrorCode(patch.lastError) : null;
  await db.prepare(
    `INSERT INTO rsvp_bitrix_sync
      (deal_id, status, attempts, last_event_ts, event_handler_id, public_slug,
       last_attempt_at, synced_at, last_error, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(deal_id) DO UPDATE SET
       status = excluded.status,
       attempts = CASE WHEN excluded.attempts > attempts THEN excluded.attempts ELSE attempts END,
       last_event_ts = COALESCE(excluded.last_event_ts, last_event_ts),
       event_handler_id = COALESCE(excluded.event_handler_id, event_handler_id),
       public_slug = COALESCE(excluded.public_slug, public_slug),
       last_attempt_at = COALESCE(excluded.last_attempt_at, last_attempt_at),
       synced_at = COALESCE(excluded.synced_at, synced_at),
       last_error = excluded.last_error,
       updated_at = excluded.updated_at`,
  ).bind(
    String(dealId),
    status,
    Number(patch.attempts || 0),
    patch.eventTs || null,
    patch.eventHandlerId || null,
    patch.publicSlug || null,
    patch.lastAttemptAt || null,
    patch.syncedAt || null,
    lastError,
    now,
    now,
  ).run();
}

async function findSourceEvent(db, dealId) {
  return db.prepare(
    `SELECT id, public_slug, manage_token_ciphertext, source_payload_hash, created_at
     FROM rsvp_events
     WHERE source_type = ? AND source_id = ?
     LIMIT 1`,
  ).bind(RSVP_BITRIX_SOURCE_TYPE, String(dealId)).first();
}

async function updateExistingEvent(db, event, payload, payloadHash, secret) {
  if (event.source_payload_hash === payloadHash) return event;
  const encrypted = await encryptPayload(payload, secret);
  const updatedAt = new Date().toISOString();
  await db.prepare(
    `UPDATE rsvp_events
     SET payload_ciphertext = ?, source_payload_hash = ?, updated_at = ?
     WHERE id = ?`,
  ).bind(encrypted, payloadHash, updatedAt, event.id).run();
  return { ...event, source_payload_hash: payloadHash };
}

async function createSourceEvent(db, dealId, payload, payloadHash, secret) {
  for (let attempt = 0; attempt < MAX_TOKEN_ATTEMPTS; attempt += 1) {
    const id = crypto.randomUUID();
    const slug = createOpaqueToken(9);
    const manageToken = createOpaqueToken(32);
    const manageHash = await phoneHash(`rsvp-manage:${manageToken}`, secret);
    const [encryptedPayload, encryptedManageToken] = await Promise.all([
      encryptPayload(payload, secret),
      encryptPayload({ manageToken }, secret),
    ]);
    const createdAt = new Date().toISOString();
    const result = await db.prepare(
      `INSERT OR IGNORE INTO rsvp_events
        (id, public_slug, manage_token_hash, payload_ciphertext, status,
         created_at, updated_at, source_type, source_id,
         manage_token_ciphertext, source_payload_hash)
       VALUES (?, ?, ?, ?, 'open', ?, ?, ?, ?, ?, ?)`,
    ).bind(
      id,
      slug,
      manageHash,
      encryptedPayload,
      createdAt,
      createdAt,
      RSVP_BITRIX_SOURCE_TYPE,
      String(dealId),
      encryptedManageToken,
      payloadHash,
    ).run();
    if (Number(result?.meta?.changes || 0) > 0) {
      return {
        id,
        public_slug: slug,
        manage_token_ciphertext: encryptedManageToken,
        source_payload_hash: payloadHash,
        created_at: createdAt,
      };
    }
    const concurrent = await findSourceEvent(db, dealId);
    if (concurrent) return updateExistingEvent(db, concurrent, payload, payloadHash, secret);
  }
  throw new Error("rsvp_token_generation_failed");
}

export async function upsertSourceEvent(db, dealId, payload, secret) {
  const payloadHash = await createRsvpPayloadFingerprint(payload);
  const existing = await findSourceEvent(db, dealId);
  if (existing) return updateExistingEvent(db, existing, payload, payloadHash, secret);
  return createSourceEvent(db, dealId, payload, payloadHash, secret);
}

async function acquireWritebackLease(db, dealId) {
  const now = new Date();
  const staleBefore = new Date(now.getTime() - WRITEBACK_LEASE_MS).toISOString();
  const startedAt = now.toISOString();
  const result = await db.prepare(
    `UPDATE rsvp_bitrix_sync
     SET writeback_status = 'writing', writeback_started_at = ?, updated_at = ?
     WHERE deal_id = ?
       AND bitrix_activity_id IS NULL
       AND (
         writeback_status IS NULL
         OR writeback_status != 'writing'
         OR writeback_started_at IS NULL
         OR writeback_started_at < ?
       )`,
  ).bind(startedAt, startedAt, String(dealId), staleBefore).run();
  return Number(result?.meta?.changes || 0) > 0;
}

async function readSyncActivityId(db, dealId) {
  const row = await db.prepare(
    "SELECT bitrix_activity_id FROM rsvp_bitrix_sync WHERE deal_id = ? LIMIT 1",
  ).bind(String(dealId)).first();
  return row?.bitrix_activity_id ? String(row.bitrix_activity_id) : null;
}

async function saveSyncActivityId(db, dealId, activityId) {
  const now = new Date().toISOString();
  await db.prepare(
    `UPDATE rsvp_bitrix_sync
     SET bitrix_activity_id = ?, writeback_status = 'synced',
         writeback_started_at = NULL, updated_at = ?
     WHERE deal_id = ?`,
  ).bind(String(activityId), now, String(dealId)).run();
}

async function readClientMessageState(db, dealId) {
  return db.prepare(
    `SELECT status, message_fingerprint, next_attempt_at, schedule_token, scheduled_for, claimed_at
     FROM rsvp_client_messages
     WHERE deal_id = ? AND message_kind = ?
     LIMIT 1`,
  ).bind(String(dealId), RSVP_CLIENT_MESSAGE_KIND).first();
}

async function readClientMessageSchedule(db, dealId) {
  return db.prepare(
    `SELECT message_generation, message_scheduled_for
     FROM rsvp_bitrix_sync
     WHERE deal_id = ?
     LIMIT 1`,
  ).bind(String(dealId)).first();
}

async function ensureLegacyClientMessageSchedule(db, dealId, job) {
  const receivedAtMs = Date.parse(String(job?.receivedAt || ""));
  if (!Number.isFinite(receivedAtMs)) return readClientMessageSchedule(db, dealId);
  const generation = await sha256Hex([
    "legacy-rsvp-deal-update",
    dealId,
    String(job?.eventTs || ""),
    String(job?.eventHandlerId || ""),
    new Date(receivedAtMs).toISOString(),
  ].join("|"));
  const scheduledFor = new Date(
    receivedAtMs + RSVP_CLIENT_MESSAGE_DELAY_SECONDS * 1000,
  ).toISOString();
  const now = new Date().toISOString();
  await db.prepare(
    `UPDATE rsvp_bitrix_sync
     SET message_generation = ?, message_scheduled_for = ?, updated_at = ?
     WHERE deal_id = ? AND message_generation IS NULL`,
  ).bind(generation, scheduledFor, now, String(dealId)).run();
  return readClientMessageSchedule(db, dealId);
}

function cleanMessageValue(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

export function buildRsvpClientMessage(clientName, childName, manageUrl) {
  const safeClientName = cleanMessageValue(clientName);
  const safeChildName = cleanMessageValue(childName);
  const safeManageUrl = String(manageUrl || "").trim();
  if (!safeClientName || !safeChildName || !/^https:\/\//i.test(safeManageUrl)) {
    throw new Error("invalid_client_message_data");
  }
  return [
    `${safeClientName}, я также для вашего удобства подготовил текстовое приглашение на праздник ${safeChildName} 🎉`,
    "",
    "В нём уже указаны дата, время и место праздника. По ссылке вы сможете проверить информацию, отправить приглашение гостям и видеть ответы гостей в своём кабинете.",
    "",
    safeManageUrl,
    "",
    "Если приглашение вам неактуально, просто не обращайте внимания на это сообщение.",
  ].join("\n");
}

async function sha256Hex(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(value)));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function clientMessageMode(env) {
  const mode = String(env.RSVP_CLIENT_MESSAGE_MODE || "off").trim().toLowerCase();
  return RSVP_CLIENT_MESSAGE_MODES.has(mode) ? mode : "off";
}

export function evaluateRsvpClientMessageEligibility(env, deal, contact) {
  const mode = clientMessageMode(env);
  if (mode === "off") return { allowed: false, status: "disabled", mode };
  if (mode === "dry-run") return { allowed: false, status: "dry_run", mode };
  if (mode === "test") {
    const allowedDealId = String(env.RSVP_CLIENT_MESSAGE_TEST_DEAL_ID || "");
    const allowedContactId = String(env.RSVP_CLIENT_MESSAGE_TEST_CONTACT_ID || "");
    const matches = allowedDealId && allowedContactId
      && String(deal?.ID || "") === allowedDealId
      && String(contact?.ID || "") === allowedContactId;
    return { allowed: Boolean(matches), status: matches ? "eligible" : "test_blocked", mode };
  }

  const enabledAfter = Date.parse(String(env.RSVP_CLIENT_MESSAGE_ENABLED_AFTER || ""));
  const movedToCurrentStageAt = Date.parse(String(deal?.MOVED_TIME || ""));
  if (!Number.isFinite(enabledAfter) || !Number.isFinite(movedToCurrentStageAt)) {
    return { allowed: false, status: "live_blocked", mode };
  }
  const allowed = movedToCurrentStageAt >= enabledAfter;
  return { allowed, status: allowed ? "eligible" : "before_cutoff", mode };
}

async function cancelScheduledClientMessage(
  db,
  dealId,
  status = "canceled",
  scheduleToken = null,
  requiredGeneration = null,
) {
  const now = new Date().toISOString();
  const tokenClause = scheduleToken ? " AND schedule_token = ?" : "";
  const generationClause = requiredGeneration
    ? " AND EXISTS (SELECT 1 FROM rsvp_bitrix_sync WHERE deal_id = ? AND message_generation = ?)"
    : "";
  const statement = db.prepare(
    `UPDATE rsvp_client_messages
     SET status = ?, schedule_token = NULL, scheduled_for = NULL,
         next_attempt_at = NULL, last_error = NULL, updated_at = ?
     WHERE deal_id = ? AND message_kind = ?
       AND status IN ('scheduled', 'rescheduling', 'retryable')${tokenClause}${generationClause}`,
  );
  const args = [status, now, String(dealId), RSVP_CLIENT_MESSAGE_KIND];
  if (scheduleToken) args.push(scheduleToken);
  if (requiredGeneration) args.push(String(dealId), requiredGeneration);
  await statement.bind(...args).run();
}

async function storeClientMessageSchedule(db, data) {
  const now = new Date().toISOString();
  const result = await db.prepare(
    `INSERT INTO rsvp_client_messages
      (deal_id, message_kind, contact_id, template_version, message_fingerprint,
       status, attempts, schedule_token, scheduled_for, created_at, updated_at)
     SELECT ?, ?, ?, ?, ?, 'scheduled', 0, ?, ?, ?, ?
     FROM rsvp_bitrix_sync
     WHERE deal_id = ? AND message_generation = ?
     ON CONFLICT(deal_id, message_kind) DO UPDATE SET
       contact_id = excluded.contact_id,
       template_version = excluded.template_version,
       message_fingerprint = excluded.message_fingerprint,
       status = 'scheduled',
       schedule_token = excluded.schedule_token,
       scheduled_for = excluded.scheduled_for,
       claimed_at = NULL,
       next_attempt_at = NULL,
       provider_message_id = NULL,
       last_http_status = NULL,
       last_error = NULL,
       updated_at = excluded.updated_at
     WHERE rsvp_client_messages.status NOT IN ('accepted', 'sent', 'sending', 'ambiguous', 'failed')
       AND NOT (
         rsvp_client_messages.status = 'claimed'
         AND rsvp_client_messages.schedule_token = excluded.schedule_token
       )`,
  ).bind(
    data.dealId,
    RSVP_CLIENT_MESSAGE_KIND,
    data.contactId,
    data.templateVersion,
    data.fingerprint,
    data.scheduleToken,
    data.scheduledFor,
    now,
    now,
    data.dealId,
    data.scheduleToken,
  ).run();
  if (Number(result?.meta?.changes || 0) > 0) return { scheduled: true, status: "scheduled" };
  const existing = await readClientMessageState(db, data.dealId);
  return { scheduled: false, status: String(existing?.status || "message_conflict") };
}

async function acquireScheduledClientMessage(db, data) {
  const now = new Date().toISOString();
  const staleBefore = new Date(Date.now() - WRITEBACK_LEASE_MS).toISOString();
  const claimed = await db.prepare(
    `UPDATE rsvp_client_messages
     SET status = 'claimed', contact_id = ?, template_version = ?,
         message_fingerprint = ?, attempts = attempts + 1, claimed_at = ?,
         last_error = NULL, updated_at = ?
     WHERE deal_id = ? AND message_kind = ?
       AND schedule_token = ?
       AND (
         status IN ('scheduled', 'retryable')
         OR (status = 'claimed' AND (claimed_at IS NULL OR claimed_at < ?))
       )
       AND EXISTS (
         SELECT 1 FROM rsvp_bitrix_sync
         WHERE deal_id = ? AND message_generation = ?
       )`,
  ).bind(
    data.contactId,
    data.templateVersion,
    data.fingerprint,
    now,
    now,
    data.dealId,
    RSVP_CLIENT_MESSAGE_KIND,
    data.scheduleToken,
    staleBefore,
    data.dealId,
    data.scheduleToken,
  ).run();
  if (Number(claimed?.meta?.changes || 0) > 0) return { acquired: true, status: "claimed" };
  const existing = await readClientMessageState(db, data.dealId);
  return { acquired: false, status: String(existing?.status || "message_conflict") };
}

async function markClientMessageSending(db, dealId, scheduleToken) {
  const now = new Date().toISOString();
  const result = await db.prepare(
    `UPDATE rsvp_client_messages
     SET status = 'sending', updated_at = ?
     WHERE deal_id = ? AND message_kind = ? AND schedule_token = ? AND status = 'claimed'
       AND EXISTS (
         SELECT 1 FROM rsvp_bitrix_sync
         WHERE deal_id = ? AND message_generation = ?
       )`,
  ).bind(
    now,
    String(dealId),
    RSVP_CLIENT_MESSAGE_KIND,
    scheduleToken,
    String(dealId),
    scheduleToken,
  ).run();
  return Number(result?.meta?.changes || 0) > 0;
}

async function saveClientMessageOutcome(db, dealId, outcome) {
  const now = new Date().toISOString();
  await db.prepare(
    `UPDATE rsvp_client_messages
     SET status = ?, accepted_at = ?, next_attempt_at = ?,
         provider_message_id = ?, last_http_status = ?, last_error = ?, updated_at = ?
     WHERE deal_id = ? AND message_kind = ? AND status = 'sending'`,
  ).bind(
    outcome.status,
    outcome.status === "accepted" ? now : null,
    outcome.nextAttemptAt || null,
    outcome.providerMessageId || null,
    Number.isInteger(outcome.httpStatus) ? outcome.httpStatus : null,
    outcome.errorCode ? cleanErrorCode(outcome.errorCode, "client_message_failed") : null,
    now,
    String(dealId),
    RSVP_CLIENT_MESSAGE_KIND,
  ).run();
}

function retryAfterSeconds(response) {
  const raw = Number(response.headers.get("Retry-After"));
  if (!Number.isFinite(raw) || raw < 1) return 60;
  return Math.min(3600, Math.ceil(raw));
}

function checkedOlchatUrl(env) {
  const raw = String(env.OLCHAT_SEND_TEXT_URL || "").trim();
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("olchat_not_configured");
  }
  if (url.protocol !== "https:" || !/\/sendText\/?$/i.test(url.pathname)) {
    throw new Error("olchat_not_configured");
  }
  return url.toString();
}

async function clientMessageDraft(env, deal, contact, payload, manageUrl) {
  const eligibility = evaluateRsvpClientMessageEligibility(env, deal, contact);
  const clientName = cleanMessageValue(contact?.NAME) || payload.organizerName;
  const body = buildRsvpClientMessage(clientName, payload.childName, manageUrl);
  const templateVersion = cleanMessageValue(env.RSVP_CLIENT_MESSAGE_TEMPLATE_VERSION)
    || RSVP_CLIENT_MESSAGE_TEMPLATE_VERSION;
  const fingerprint = await sha256Hex([
    templateVersion,
    String(deal.ID),
    String(contact.ID),
    manageUrl,
    body,
  ].join("|"));
  return { eligibility, body, templateVersion, fingerprint };
}

async function scheduleRsvpClientMessage(
  env,
  deal,
  contact,
  payload,
  manageUrl,
  scheduleToken,
  scheduledFor,
) {
  const existingState = await readClientMessageState(env.GIFT_DB, deal.ID);
  if (RSVP_CLIENT_MESSAGE_TERMINAL_STATUSES.has(existingState?.status)) {
    return { status: existingState.status, mode: clientMessageMode(env) };
  }
  const draft = await clientMessageDraft(env, deal, contact, payload, manageUrl);
  if (!draft.eligibility.allowed) {
    await cancelScheduledClientMessage(
      env.GIFT_DB,
      deal.ID,
      draft.eligibility.status,
      null,
      scheduleToken,
    );
    return {
      status: draft.eligibility.status,
      mode: draft.eligibility.mode,
      fingerprint: draft.fingerprint,
    };
  }
  if (!env.GIFT_SYNC_QUEUE) throw new Error("rsvp_message_queue_not_configured");

  if (!/^[a-f0-9]{64}$/i.test(scheduleToken) || !Number.isFinite(Date.parse(scheduledFor))) {
    return { status: "stale", mode: draft.eligibility.mode, fingerprint: draft.fingerprint };
  }
  const schedule = await storeClientMessageSchedule(env.GIFT_DB, {
    dealId: String(deal.ID),
    contactId: String(contact.ID),
    templateVersion: draft.templateVersion,
    fingerprint: draft.fingerprint,
    scheduleToken,
    scheduledFor,
  });
  if (!schedule.scheduled) {
    return { status: schedule.status, mode: draft.eligibility.mode, fingerprint: draft.fingerprint };
  }

  try {
    const remainingSeconds = Math.ceil((Date.parse(scheduledFor) - Date.now()) / 1000);
    await env.GIFT_SYNC_QUEUE.send({
      type: "rsvp_send_initial_message",
      dealId: String(deal.ID),
      scheduleToken,
      scheduledFor,
    }, { delaySeconds: Math.max(1, Math.min(RSVP_CLIENT_MESSAGE_DELAY_SECONDS, remainingSeconds)) });
  } catch {
    const now = new Date().toISOString();
    await env.GIFT_DB.prepare(
      `UPDATE rsvp_client_messages
       SET status = 'retryable', schedule_token = NULL, scheduled_for = NULL,
           last_error = 'queue_unavailable', updated_at = ?
       WHERE deal_id = ? AND message_kind = ? AND schedule_token = ? AND status = 'scheduled'`,
    ).bind(now, String(deal.ID), RSVP_CLIENT_MESSAGE_KIND, scheduleToken).run().catch(() => undefined);
    throw new Error("rsvp_message_queue_unavailable");
  }
  return {
    status: "scheduled",
    mode: draft.eligibility.mode,
    fingerprint: draft.fingerprint,
    scheduleToken,
    scheduledFor,
  };
}

async function sendRsvpClientMessage(env, deal, contact, payload, manageUrl, scheduleToken) {
  const existingState = await readClientMessageState(env.GIFT_DB, deal.ID);
  if (RSVP_CLIENT_MESSAGE_TERMINAL_STATUSES.has(existingState?.status)) {
    return { status: existingState.status, mode: clientMessageMode(env) };
  }
  if (existingState?.schedule_token !== scheduleToken) {
    return { status: "stale", mode: clientMessageMode(env) };
  }
  const draft = await clientMessageDraft(env, deal, contact, payload, manageUrl);

  if (!draft.eligibility.allowed) {
    await cancelScheduledClientMessage(
      env.GIFT_DB,
      deal.ID,
      draft.eligibility.status,
      scheduleToken,
      scheduleToken,
    );
    return {
      status: draft.eligibility.status,
      mode: draft.eligibility.mode,
      fingerprint: draft.fingerprint,
    };
  }

  const phoneNumber = String(payload.organizerPhone || "").replace(/^\+/, "");
  if (!/^\d{8,15}$/.test(phoneNumber)) {
    await cancelScheduledClientMessage(
      env.GIFT_DB,
      deal.ID,
      "failed",
      scheduleToken,
      scheduleToken,
    );
    return { status: "failed", mode: draft.eligibility.mode, fingerprint: draft.fingerprint };
  }
  const requestUrl = new URL(checkedOlchatUrl(env));
  requestUrl.search = new URLSearchParams({
    phone_number: phoneNumber,
    body: draft.body,
    send_to_imol: "Y",
  }).toString();

  const claim = await acquireScheduledClientMessage(env.GIFT_DB, {
    dealId: String(deal.ID),
    contactId: String(contact.ID),
    templateVersion: draft.templateVersion,
    fingerprint: draft.fingerprint,
    scheduleToken,
  });
  if (!claim.acquired) {
    return { status: claim.status, mode: draft.eligibility.mode, fingerprint: draft.fingerprint };
  }
  const markedSending = await markClientMessageSending(env.GIFT_DB, deal.ID, scheduleToken);
  if (!markedSending) {
    const current = await readClientMessageState(env.GIFT_DB, deal.ID);
    return {
      status: String(current?.status || "stale"),
      mode: draft.eligibility.mode,
      fingerprint: draft.fingerprint,
    };
  }

  let response;
  try {
    response = await fetch(requestUrl.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json, text/plain",
      },
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    await saveClientMessageOutcome(env.GIFT_DB, deal.ID, {
      status: "ambiguous",
      errorCode: "olchat_network_error",
    }).catch(() => undefined);
    return { status: "ambiguous", mode: draft.eligibility.mode, fingerprint: draft.fingerprint };
  }

  if (response.status === 200) {
    await saveClientMessageOutcome(env.GIFT_DB, deal.ID, {
      status: "accepted",
      httpStatus: response.status,
    });
    return { status: "accepted", mode: draft.eligibility.mode, fingerprint: draft.fingerprint };
  }

  if (response.status === 429) {
    const delaySeconds = retryAfterSeconds(response);
    await saveClientMessageOutcome(env.GIFT_DB, deal.ID, {
      status: "retryable",
      httpStatus: response.status,
      errorCode: "olchat_rate_limited",
      nextAttemptAt: new Date(Date.now() + delaySeconds * 1000).toISOString(),
    });
    const error = new Error("olchat_rate_limited");
    error.retryAfterSeconds = delaySeconds;
    throw error;
  }

  const ambiguous = response.status >= 500 || response.status === 408;
  await saveClientMessageOutcome(env.GIFT_DB, deal.ID, {
    status: ambiguous ? "ambiguous" : "failed",
    httpStatus: response.status,
    errorCode: ambiguous ? "olchat_ambiguous_response" : "olchat_rejected",
  });
  return {
    status: ambiguous ? "ambiguous" : "failed",
    mode: draft.eligibility.mode,
    fingerprint: draft.fingerprint,
  };
}

async function findExistingRsvpActivity(env, dealId) {
  const activities = await bitrixCall(env, "crm.activity.list", {
    filter: {
      OWNER_TYPE_ID: 2,
      OWNER_ID: Number(dealId),
    },
    select: ["ID", "DESCRIPTION"],
    order: { ID: "DESC" },
  });
  const marker = rsvpActivityMarker(dealId);
  const existing = Array.isArray(activities)
    ? activities.find((activity) => String(activity?.DESCRIPTION || "").includes(marker))
    : null;
  return existing?.ID ? String(existing.ID) : null;
}

function rsvpActivityFields(dealId, description, responsibleId, contact) {
  const now = new Date().toISOString();
  const contactId = String(contact?.ID || "");
  const phone = Array.isArray(contact?.PHONE)
    ? String(contact.PHONE.find((item) => String(item?.VALUE || "").trim())?.VALUE || "").trim()
    : "";
  if (!/^\d+$/.test(contactId) || !phone) throw new Error("invalid_activity_communication");
  const fields = {
    OWNER_TYPE_ID: 2,
    OWNER_ID: Number(dealId),
    TYPE_ID: 1,
    SUBJECT: "RSVP-приглашение",
    DESCRIPTION: description,
    DESCRIPTION_TYPE: 1,
    COMPLETED: "Y",
    START_TIME: now,
    END_TIME: now,
    COMMUNICATIONS: [{
      ENTITY_ID: Number(contactId),
      ENTITY_TYPE_ID: 3,
      TYPE: "PHONE",
      VALUE: phone,
    }],
  };
  if (/^\d+$/.test(String(responsibleId || ""))) {
    fields.RESPONSIBLE_ID = Number(responsibleId);
  }
  return fields;
}

async function writeRsvpLinksToDeal(env, deal, contact, event, secret) {
  const dealId = String(deal.ID);
  const { publicUrl, manageUrl } = await rsvpEventLinks(env, event, secret);
  const messageState = await readClientMessageState(env.GIFT_DB, dealId);
  const description = rsvpActivityDescription(dealId, publicUrl, manageUrl, messageState?.status);
  const fields = rsvpActivityFields(dealId, description, deal.ASSIGNED_BY_ID, contact);

  let activityId = await readSyncActivityId(env.GIFT_DB, dealId);
  if (activityId) {
    await bitrixCall(env, "crm.activity.update", {
      id: Number(activityId),
      fields,
    });
    return { activityId, publicUrl, manageUrl };
  }

  const leaseAcquired = await acquireWritebackLease(env.GIFT_DB, dealId);
  if (!leaseAcquired) throw new Error("rsvp_writeback_busy");

  activityId = await findExistingRsvpActivity(env, dealId);
  if (activityId) {
    await bitrixCall(env, "crm.activity.update", {
      id: Number(activityId),
      fields,
    });
  } else {
    const created = await bitrixCall(env, "crm.activity.add", {
      fields,
    });
    activityId = String(created || "");
    if (!/^\d+$/.test(activityId)) throw new Error("invalid_crm_activity_id");
  }

  await saveSyncActivityId(env.GIFT_DB, dealId, activityId);
  return { activityId, publicUrl, manageUrl };
}

async function rsvpEventLinks(env, event, secret) {
  const tokenPayload = await decryptPayload(event.manage_token_ciphertext, secret);
  const manageToken = String(tokenPayload?.manageToken || "");
  if (!/^[A-Za-z0-9_-]{32,160}$/.test(manageToken)) throw new Error("invalid_manage_token");

  const origin = publicOrigin(env);
  const publicUrl = `${origin}/invite?event=${encodeURIComponent(event.public_slug)}`;
  const manageUrl = `${origin}/my-event#token=${encodeURIComponent(manageToken)}`;
  return { publicUrl, manageUrl };
}

async function refreshRsvpActivityMessageStatus(env, deal, contact, writeback, messageStatus) {
  const description = rsvpActivityDescription(
    String(deal.ID),
    writeback.publicUrl,
    writeback.manageUrl,
    messageStatus,
  );
  const fields = rsvpActivityFields(deal.ID, description, deal.ASSIGNED_BY_ID, contact);
  await bitrixCall(env, "crm.activity.update", {
    id: Number(writeback.activityId),
    fields,
  });
}

export async function processRsvpClientMessageSend(env, job) {
  const dealId = String(job?.dealId || "");
  const scheduleToken = String(job?.scheduleToken || "");
  if (!/^\d+$/.test(dealId) || Number(dealId) < 1) throw new Error("invalid_deal_id");
  if (!/^[a-f0-9]{64}$/i.test(scheduleToken)) throw new Error("invalid_schedule_token");
  const secret = dataSecret(env);
  if (!env.GIFT_DB || !secret || !env.BITRIX_WEBHOOK_URL) throw new Error("rsvp_worker_not_configured");

  const state = await readClientMessageState(env.GIFT_DB, dealId);
  const schedule = await readClientMessageSchedule(env.GIFT_DB, dealId);
  if (!state) return { status: "stale" };
  if (schedule?.message_generation !== scheduleToken) return { status: "stale" };
  if (state.schedule_token !== scheduleToken) return { status: "stale" };
  if (["sending", "ambiguous", "failed"].includes(state.status)) return { status: state.status };
  if (state.status === "claimed") {
    const claimedAt = Date.parse(String(state.claimed_at || ""));
    const leaseRemaining = Math.ceil((claimedAt + WRITEBACK_LEASE_MS - Date.now()) / 1000);
    if (Number.isFinite(claimedAt) && leaseRemaining > 0) {
      const error = new Error("rsvp_message_claim_busy");
      error.retryAfterSeconds = Math.min(Math.ceil(WRITEBACK_LEASE_MS / 1000), leaseRemaining);
      throw error;
    }
  }

  const scheduledFor = Date.parse(String(
    schedule?.message_scheduled_for || state.scheduled_for || job?.scheduledFor || "",
  ));
  const remainingSeconds = Math.ceil((scheduledFor - Date.now()) / 1000);
  if (!["accepted", "sent"].includes(state.status)
    && Number.isFinite(scheduledFor) && remainingSeconds > 0) {
    const error = new Error("rsvp_message_not_due");
    error.retryAfterSeconds = Math.min(RSVP_CLIENT_MESSAGE_DELAY_SECONDS, remainingSeconds);
    throw error;
  }

  const { deal, contact } = await readDealContext(env, dealId);
  if (!deal || !isClosedBitrixDeal(deal) || isRecurringBitrixTemplate(deal)) {
    if (["accepted", "sent"].includes(state.status)) return { status: state.status };
    await cancelScheduledClientMessage(
      env.GIFT_DB,
      dealId,
      "canceled",
      scheduleToken,
      scheduleToken,
    );
    return { status: "canceled" };
  }
  if (!contact) {
    await cancelScheduledClientMessage(env.GIFT_DB, dealId, "failed", scheduleToken, scheduleToken);
    return { status: "failed", error: "missing_contact" };
  }

  const checked = buildRsvpPayloadFromBitrix(deal, contact);
  if (checked.error) {
    await cancelScheduledClientMessage(env.GIFT_DB, dealId, "failed", scheduleToken, scheduleToken);
    return { status: "failed", error: checked.error };
  }
  const event = await findSourceEvent(env.GIFT_DB, dealId);
  if (!event) throw new Error("rsvp_event_not_found");
  const links = await rsvpEventLinks(env, event, secret);
  const activityId = await readSyncActivityId(env.GIFT_DB, dealId);
  if (["accepted", "sent"].includes(state.status)) {
    if (activityId) {
      await refreshRsvpActivityMessageStatus(env, deal, contact, {
        ...links,
        activityId,
      }, state.status);
    }
    return { status: state.status };
  }
  const clientMessage = await sendRsvpClientMessage(
    env,
    deal,
    contact,
    checked.value,
    links.manageUrl,
    scheduleToken,
  );
  if (activityId) {
    await refreshRsvpActivityMessageStatus(env, deal, contact, {
      ...links,
      activityId,
    }, clientMessage.status);
  }
  return { status: clientMessage.status };
}

export async function processRsvpDealUpdate(env, job, attempts = 1) {
  const dealId = String(job?.dealId || "");
  if (!/^\d+$/.test(dealId) || Number(dealId) < 1) throw new Error("invalid_deal_id");
  const secret = dataSecret(env);
  if (!env.GIFT_DB || !secret || !env.BITRIX_WEBHOOK_URL) throw new Error("rsvp_worker_not_configured");

  const attemptedAt = new Date().toISOString();
  let messageSchedule = await readClientMessageSchedule(env.GIFT_DB, dealId);
  let messageGeneration = String(job?.messageGeneration || "");
  const hasSuppliedGeneration = /^[a-f0-9]{64}$/i.test(messageGeneration);
  if (!/^[a-f0-9]{64}$/i.test(messageGeneration)) {
    messageSchedule = await ensureLegacyClientMessageSchedule(env.GIFT_DB, dealId, job);
    messageGeneration = String(messageSchedule?.message_generation || "");
  }
  const isLatestMessageGeneration = /^[a-f0-9]{64}$/i.test(messageGeneration)
    && messageSchedule?.message_generation === messageGeneration;
  if (hasSuppliedGeneration && !isLatestMessageGeneration) {
    return { status: "stale", clientMessageStatus: "stale" };
  }
  await updateRsvpBitrixSyncState(env.GIFT_DB, dealId, {
    status: "processing",
    attempts,
    eventTs: job.eventTs,
    eventHandlerId: job.eventHandlerId,
    lastAttemptAt: attemptedAt,
  });

  const { deal, contact } = await readDealContext(env, dealId);
  if (!deal) {
    if (isLatestMessageGeneration) {
      await cancelScheduledClientMessage(
        env.GIFT_DB,
        dealId,
        "failed",
        null,
        messageGeneration,
      );
    }
    await updateRsvpBitrixSyncState(env.GIFT_DB, dealId, {
      status: "invalid",
      attempts,
      lastAttemptAt: attemptedAt,
      lastError: "deal_not_found",
    });
    return { status: "invalid", error: "deal_not_found" };
  }
  if (!isClosedBitrixDeal(deal) || isRecurringBitrixTemplate(deal)) {
    const status = isRecurringBitrixTemplate(deal) ? "ignored_template" : "ignored_stage";
    if (isLatestMessageGeneration) {
      await cancelScheduledClientMessage(
        env.GIFT_DB,
        dealId,
        "canceled",
        null,
        messageGeneration,
      );
    }
    await updateRsvpBitrixSyncState(env.GIFT_DB, dealId, {
      status,
      attempts,
      lastAttemptAt: attemptedAt,
    });
    return { status };
  }
  if (!contact) {
    if (isLatestMessageGeneration) {
      await cancelScheduledClientMessage(
        env.GIFT_DB,
        dealId,
        "failed",
        null,
        messageGeneration,
      );
    }
    await updateRsvpBitrixSyncState(env.GIFT_DB, dealId, {
      status: "invalid",
      attempts,
      lastAttemptAt: attemptedAt,
      lastError: "missing_contact",
    });
    return { status: "invalid", error: "missing_contact" };
  }

  const checked = buildRsvpPayloadFromBitrix(deal, contact);
  if (checked.error) {
    if (isLatestMessageGeneration) {
      await cancelScheduledClientMessage(
        env.GIFT_DB,
        dealId,
        "failed",
        null,
        messageGeneration,
      );
    }
    await updateRsvpBitrixSyncState(env.GIFT_DB, dealId, {
      status: "invalid",
      attempts,
      lastAttemptAt: attemptedAt,
      lastError: checked.error,
    });
    return { status: "invalid", error: checked.error };
  }

  const event = await upsertSourceEvent(env.GIFT_DB, dealId, checked.value, secret);
  const writeback = await writeRsvpLinksToDeal(env, deal, contact, event, secret);
  const syncedAt = new Date().toISOString();
  await updateRsvpBitrixSyncState(env.GIFT_DB, dealId, {
    status: "synced",
    attempts,
    eventTs: job.eventTs,
    eventHandlerId: job.eventHandlerId,
    publicSlug: event.public_slug,
    lastAttemptAt: attemptedAt,
    syncedAt,
  });
  const clientMessage = isLatestMessageGeneration
    ? await scheduleRsvpClientMessage(
      env,
      deal,
      contact,
      checked.value,
      writeback.manageUrl,
      messageGeneration,
      String(messageSchedule.message_scheduled_for || job?.messageScheduledFor || ""),
    )
    : { status: "stale" };
  const activityMessageStatus = clientMessage.status === "stale"
    ? String((await readClientMessageState(env.GIFT_DB, dealId))?.status || "stale")
    : clientMessage.status;
  await refreshRsvpActivityMessageStatus(env, deal, contact, writeback, activityMessageStatus);
  return {
    status: "synced",
    publicSlug: event.public_slug,
    bitrixActivityId: writeback.activityId,
    clientMessageStatus: clientMessage.status,
  };
}
