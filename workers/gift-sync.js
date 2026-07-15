import { decryptPayload, readClaimById, syncBitrix } from "../shared/gift-core.js";
import {
  processRsvpDealUpdate,
  processRsvpClientMessageSend,
  updateRsvpBitrixSyncState,
} from "../shared/rsvp-bitrix-service.js";

function errorMessage(error) {
  return (error instanceof Error ? error.message : "bitrix_sync_failed").slice(0, 1000);
}

function queueRetryDelay(error, attempts) {
  const requestedDelay = Number(error?.retryAfterSeconds || 0);
  return Number.isFinite(requestedDelay) && requestedDelay > 0
    ? Math.min(3600, Math.ceil(requestedDelay))
    : Math.min(3600, 30 * 2 ** Math.min(attempts, 6));
}

async function saveOutboxState(db, generation, patch) {
  const now = new Date().toISOString();
  await db.prepare(
    `UPDATE rsvp_webhook_outbox
     SET status = ?, attempts = attempts + ?, next_attempt_at = ?, delivered_at = ?,
         last_error = ?, updated_at = ?
     WHERE generation = ? AND status = 'pending'`,
  ).bind(
    patch.status,
    Number(patch.incrementAttempts || 0),
    patch.nextAttemptAt || now,
    patch.deliveredAt || null,
    patch.lastError || null,
    now,
    generation,
  ).run();
}

export async function drainRsvpWebhookOutbox(env) {
  if (!env.GIFT_DB || !env.GIFT_SYNC_QUEUE) throw new Error("rsvp_outbox_not_configured");
  const now = new Date();
  const pending = await env.GIFT_DB.prepare(
    `SELECT generation, job_json, attempts
     FROM rsvp_webhook_outbox
     WHERE status = 'pending' AND next_attempt_at <= ?
     ORDER BY next_attempt_at ASC
     LIMIT 25`,
  ).bind(now.toISOString()).all();

  for (const row of pending?.results || []) {
    let job;
    try {
      job = JSON.parse(String(row?.job_json || ""));
    } catch {
      job = null;
    }
    const generation = String(row?.generation || "");
    if (!job || job.type !== "rsvp_deal_update" || job.messageGeneration !== generation) {
      await saveOutboxState(env.GIFT_DB, generation, {
        status: "failed",
        incrementAttempts: 1,
        lastError: "invalid_outbox_job",
      });
      continue;
    }

    try {
      const earliestReadAt = Date.parse(String(job.receivedAt || "")) + 10_000;
      const delaySeconds = Number.isFinite(earliestReadAt)
        ? Math.max(1, Math.min(10, Math.ceil((earliestReadAt - Date.now()) / 1000)))
        : 10;
      await env.GIFT_SYNC_QUEUE.send(job, { delaySeconds });
      await saveOutboxState(env.GIFT_DB, generation, {
        status: "delivered",
        deliveredAt: new Date().toISOString(),
      });
    } catch (error) {
      const attempts = Number(row?.attempts || 0) + 1;
      const retrySeconds = Math.min(300, 30 * 2 ** Math.min(attempts, 4));
      await saveOutboxState(env.GIFT_DB, generation, {
        status: "pending",
        incrementAttempts: 1,
        nextAttemptAt: new Date(Date.now() + retrySeconds * 1000).toISOString(),
        lastError: errorMessage(error),
      });
    }
  }
}

const giftSyncWorker = {
  async scheduled(_controller, env, context) {
    context.waitUntil(drainRsvpWebhookOutbox(env));
  },

  async queue(batch, env) {
    for (const message of batch.messages) {
      if (message.body?.type === "rsvp_send_initial_message") {
        try {
          await processRsvpClientMessageSend(env, message.body);
          message.ack();
        } catch (error) {
          message.retry({ delaySeconds: queueRetryDelay(error, message.attempts) });
        }
        continue;
      }

      if (message.body?.type === "rsvp_deal_update") {
        const dealId = String(message.body?.dealId || "");
        if (!/^\d+$/.test(dealId)) {
          message.ack();
          continue;
        }
        try {
          await processRsvpDealUpdate(env, message.body, Number(message.attempts || 0) + 1);
          message.ack();
        } catch (error) {
          await updateRsvpBitrixSyncState(env.GIFT_DB, dealId, {
            status: "retrying",
            attempts: Number(message.attempts || 0) + 1,
            eventTs: message.body?.eventTs,
            eventHandlerId: message.body?.eventHandlerId,
            lastAttemptAt: new Date().toISOString(),
            lastError: errorMessage(error),
          }).catch(() => undefined);
          message.retry({ delaySeconds: queueRetryDelay(error, message.attempts) });
        }
        continue;
      }

      const claimId = String(message.body?.claimId || "");
      if (!claimId) {
        message.ack();
        continue;
      }

      try {
        const claim = await readClaimById(env.GIFT_DB, claimId);
        if (!claim || claim.status === "synced") {
          message.ack();
          continue;
        }

        const attemptedAt = new Date().toISOString();
        await env.GIFT_DB.prepare(
          "UPDATE gift_claims SET status = 'syncing', sync_attempts = sync_attempts + 1, last_attempt_at = ?, updated_at = ? WHERE id = ?",
        )
          .bind(attemptedAt, attemptedAt, claimId)
          .run();

        const payload = await decryptPayload(claim.payload_ciphertext, env.GIFT_DATA_SECRET);
        const sync = await syncBitrix(
          payload,
          {
            id: claim.id,
            submittedAt: claim.submitted_at,
            validUntil: claim.valid_until,
          },
          env,
        );
        await env.GIFT_DB.prepare(
          "UPDATE gift_claims SET status = 'synced', bitrix_lead_id = ?, last_error = NULL, updated_at = ? WHERE id = ?",
        )
          .bind(sync.leadId, new Date().toISOString(), claimId)
          .run();
        message.ack();
      } catch (error) {
        await env.GIFT_DB.prepare(
          "UPDATE gift_claims SET status = 'queued', last_error = ?, updated_at = ? WHERE id = ?",
        )
          .bind(errorMessage(error), new Date().toISOString(), claimId)
          .run()
          .catch(() => undefined);
        message.retry({ delaySeconds: Math.min(3600, 30 * 2 ** Math.min(message.attempts, 6)) });
      }
    }
  },
};

export default giftSyncWorker;
