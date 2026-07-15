import {
  constantTimeSecretEqual,
  createBitrixWebhookFingerprint,
  normalizeBitrixDomain,
  parseBitrixDealUpdateForm,
} from "../../../shared/rsvp-bitrix-core.js";

const MAX_BODY_BYTES = 24_000;
const QUEUE_DELAY_SECONDS = 10;
const CLIENT_MESSAGE_DELAY_SECONDS = 10 * 60;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

async function recordReceipt(db, event, fingerprint, receivedAt) {
  const result = await db.prepare(
    `INSERT OR IGNORE INTO rsvp_bitrix_webhook_receipts
      (fingerprint, deal_id, event_ts, event_handler_id, status, received_at)
     VALUES (?, ?, ?, ?, 'received', ?)`,
  ).bind(
    fingerprint,
    event.dealId,
    event.eventTs,
    event.eventHandlerId,
    receivedAt,
  ).run();
  return Number(result?.meta?.changes || 0) > 0;
}

async function markQueued(db, event, fingerprint, receivedAt, queuedAt) {
  const messageScheduledFor = new Date(
    Date.parse(receivedAt) + CLIENT_MESSAGE_DELAY_SECONDS * 1000,
  ).toISOString();
  const job = {
    type: "rsvp_deal_update",
    dealId: event.dealId,
    eventTs: event.eventTs,
    eventHandlerId: event.eventHandlerId,
    receivedAt,
    messageGeneration: fingerprint,
    messageScheduledFor,
  };
  await db.batch([
    db.prepare(
      "UPDATE rsvp_bitrix_webhook_receipts SET status = 'queued', queued_at = ? WHERE fingerprint = ?",
    ).bind(queuedAt, fingerprint),
    db.prepare(
      `INSERT INTO rsvp_bitrix_sync
        (deal_id, status, attempts, last_event_ts, event_handler_id,
         message_generation, message_scheduled_for, created_at, updated_at)
       VALUES (?, 'queued', 0, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(deal_id) DO UPDATE SET
         status = 'queued',
         last_event_ts = excluded.last_event_ts,
         event_handler_id = excluded.event_handler_id,
         message_generation = excluded.message_generation,
         message_scheduled_for = excluded.message_scheduled_for,
         last_error = NULL,
         updated_at = excluded.updated_at
       WHERE rsvp_bitrix_sync.message_scheduled_for IS NULL
          OR excluded.message_scheduled_for > rsvp_bitrix_sync.message_scheduled_for
          OR (
            excluded.message_scheduled_for = rsvp_bitrix_sync.message_scheduled_for
            AND excluded.message_generation > rsvp_bitrix_sync.message_generation
          )`,
    ).bind(
      event.dealId,
      event.eventTs,
      event.eventHandlerId,
      fingerprint,
      messageScheduledFor,
      receivedAt,
      queuedAt,
    ),
    db.prepare(
      `INSERT OR IGNORE INTO rsvp_webhook_outbox
        (generation, deal_id, job_json, status, attempts, next_attempt_at, created_at, updated_at)
       VALUES (?, ?, ?, 'pending', 0, ?, ?, ?)`,
    ).bind(
      fingerprint,
      event.dealId,
      JSON.stringify(job),
      queuedAt,
      queuedAt,
      queuedAt,
    ),
  ]);
  const current = await db.prepare(
    "SELECT message_generation FROM rsvp_bitrix_sync WHERE deal_id = ? LIMIT 1",
  ).bind(event.dealId).first();
  const isLatest = current?.message_generation === fingerprint;
  if (!isLatest) {
    await db.prepare(
      "UPDATE rsvp_webhook_outbox SET status = 'stale', updated_at = ? WHERE generation = ?",
    ).bind(new Date().toISOString(), fingerprint).run();
  }
  return { job, isLatest };
}

async function markOutboxDelivered(db, generation) {
  const now = new Date().toISOString();
  await db.prepare(
    `UPDATE rsvp_webhook_outbox
     SET status = 'delivered', delivered_at = ?, last_error = NULL, updated_at = ?
     WHERE generation = ? AND status = 'pending'`,
  ).bind(now, now, generation).run();
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const expectedToken = String(env.BITRIX_EVENT_TOKEN || "").trim();
  const expectedDomain = normalizeBitrixDomain(env.BITRIX_EVENT_DOMAIN);
  if (!env.GIFT_DB || !env.GIFT_SYNC_QUEUE || !expectedToken || !expectedDomain) {
    return json({ error: "webhook_not_configured" }, 503);
  }

  const contentType = String(request.headers.get("content-type") || "").toLowerCase();
  if (!contentType.startsWith("application/x-www-form-urlencoded")) {
    return json({ error: "unsupported_media_type" }, 415);
  }
  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (declaredLength > MAX_BODY_BYTES) return json({ error: "payload_too_large" }, 413);

  const body = await request.text();
  if (new TextEncoder().encode(body).byteLength > MAX_BODY_BYTES) {
    return json({ error: "payload_too_large" }, 413);
  }
  const checked = parseBitrixDealUpdateForm(body);
  if (checked.error) return json({ error: checked.error }, 400);
  const event = checked.value;

  const [tokenOk, domainOk] = await Promise.all([
    constantTimeSecretEqual(event.applicationToken, expectedToken),
    constantTimeSecretEqual(event.domain, expectedDomain),
  ]);
  if (!tokenOk || !domainOk) return json({ error: "unauthorized" }, 401);

  const fingerprint = await createBitrixWebhookFingerprint(event);
  const receivedAt = new Date().toISOString();
  const isNew = await recordReceipt(env.GIFT_DB, event, fingerprint, receivedAt);
  if (!isNew) return json({ status: "duplicate" }, 202);

  try {
    const queuedAt = new Date().toISOString();
    const queued = await markQueued(
      env.GIFT_DB,
      event,
      fingerprint,
      receivedAt,
      queuedAt,
    );
    if (queued.isLatest) {
      try {
        await env.GIFT_SYNC_QUEUE.send(queued.job, { delaySeconds: QUEUE_DELAY_SECONDS });
        await markOutboxDelivered(env.GIFT_DB, fingerprint);
      } catch {
        // The durable outbox is retried by the gift-sync Worker's scheduled handler.
      }
    }
    return json({ status: "queued" }, 202);
  } catch {
    await env.GIFT_DB.prepare(
      "DELETE FROM rsvp_bitrix_webhook_receipts WHERE fingerprint = ? AND status = 'received'",
    ).bind(fingerprint).run().catch(() => undefined);
    return json({ error: "webhook_storage_unavailable" }, 503);
  }
}

export function onRequestGet() {
  return json({ error: "method_not_allowed" }, 405);
}
