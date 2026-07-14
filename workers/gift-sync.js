import { decryptPayload, readClaimById, syncBitrix } from "../shared/gift-core.js";
import {
  processRsvpDealUpdate,
  updateRsvpBitrixSyncState,
} from "../shared/rsvp-bitrix-service.js";

function errorMessage(error) {
  return (error instanceof Error ? error.message : "bitrix_sync_failed").slice(0, 1000);
}

const giftSyncWorker = {
  async queue(batch, env) {
    for (const message of batch.messages) {
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
          const requestedDelay = Number(error?.retryAfterSeconds || 0);
          const delaySeconds = Number.isFinite(requestedDelay) && requestedDelay > 0
            ? Math.min(3600, Math.ceil(requestedDelay))
            : Math.min(3600, 30 * 2 ** Math.min(message.attempts, 6));
          message.retry({ delaySeconds });
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
