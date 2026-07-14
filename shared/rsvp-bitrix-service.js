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

function rsvpActivityDescription(dealId, publicUrl, manageUrl) {
  return [
    "RSVP-приглашение создано автоматически.",
    "",
    `Ссылка для гостей: ${publicUrl}`,
    `Личный кабинет клиента: ${manageUrl}`,
    "",
    "Это внутренняя запись. Сообщение клиенту автоматически не отправлялось.",
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
    `SELECT id, public_slug, manage_token_ciphertext, source_payload_hash
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
  const tokenPayload = await decryptPayload(event.manage_token_ciphertext, secret);
  const manageToken = String(tokenPayload?.manageToken || "");
  if (!/^[A-Za-z0-9_-]{32,160}$/.test(manageToken)) throw new Error("invalid_manage_token");

  const origin = publicOrigin(env);
  const publicUrl = `${origin}/invite?event=${encodeURIComponent(event.public_slug)}`;
  const manageUrl = `${origin}/my-event#token=${encodeURIComponent(manageToken)}`;
  const description = rsvpActivityDescription(dealId, publicUrl, manageUrl);
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

export async function processRsvpDealUpdate(env, job, attempts = 1) {
  const dealId = String(job?.dealId || "");
  if (!/^\d+$/.test(dealId) || Number(dealId) < 1) throw new Error("invalid_deal_id");
  const secret = dataSecret(env);
  if (!env.GIFT_DB || !secret || !env.BITRIX_WEBHOOK_URL) throw new Error("rsvp_worker_not_configured");

  const attemptedAt = new Date().toISOString();
  await updateRsvpBitrixSyncState(env.GIFT_DB, dealId, {
    status: "processing",
    attempts,
    eventTs: job.eventTs,
    eventHandlerId: job.eventHandlerId,
    lastAttemptAt: attemptedAt,
  });

  const { deal, contact } = await readDealContext(env, dealId);
  if (!deal) {
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
    await updateRsvpBitrixSyncState(env.GIFT_DB, dealId, {
      status,
      attempts,
      lastAttemptAt: attemptedAt,
    });
    return { status };
  }
  if (!contact) {
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
  return {
    status: "synced",
    publicSlug: event.public_slug,
    bitrixActivityId: writeback.activityId,
  };
}
