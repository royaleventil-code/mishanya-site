import { decryptPayload, readClaimById, syncBitrix } from "../shared/gift-core.js";

function errorMessage(error) {
  return (error instanceof Error ? error.message : "bitrix_sync_failed").slice(0, 1000);
}

const giftSyncWorker = {
  async queue(batch, env) {
    for (const message of batch.messages) {
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
