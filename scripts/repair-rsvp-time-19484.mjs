import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

const TARGET = Object.freeze({
  account: "1171f931de9f44c2a0375a9684dd40c5",
  database: "895c9651-6854-47fe-aeb0-836e59864f38",
  deal: "19484",
  slug: "lZv3hJM1C8ed",
  oldStartsAt: "2026-11-11T16:30:00.000Z",
  startsAt: "2026-11-11T15:30:00.000Z",
});

function requireCondition(condition, code) {
  if (!condition) throw new Error(code);
}

export async function repairRsvpTime19484({
  token,
  apply = false,
  fetcher = fetch,
  pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  maxPolls = 36,
}) {
  requireCondition(Boolean(token), "cloudflare_token_required");
  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${TARGET.account}/d1/database/${TARGET.database}/query`;
  async function query(sql, params = []) {
    const response = await fetcher(endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ sql, params }),
    });
    const body = await response.json();
    requireCondition(response.ok && body.success && body.result?.[0]?.success !== false,
      `d1_query_failed_http_${response.status}_${body.errors?.map((error) => error.code).join("_") || "unknown"}`);
    return body.result[0].results || [];
  }
  async function readState() {
    const rows = await query(`SELECT e.id, e.public_slug, e.source_id, e.source_type,
      e.manage_token_hash, e.manage_token_ciphertext,
      s.status AS sync_status, s.message_generation,
      m.status AS message_status, m.attempts AS message_attempts,
      m.message_fingerprint, m.schedule_token,
      o.status AS outbox_status, o.job_json, o.updated_at AS outbox_updated_at
      FROM rsvp_events e
      JOIN rsvp_bitrix_sync s ON s.deal_id = e.source_id
      JOIN rsvp_client_messages m ON m.deal_id = e.source_id AND m.message_kind = 'rsvp_client_invitation'
      JOIN rsvp_webhook_outbox o ON o.generation = s.message_generation AND o.deal_id = s.deal_id
      WHERE e.source_type = 'bitrix_deal' AND e.source_id = ? AND e.public_slug = ?`, [TARGET.deal, TARGET.slug]);
    requireCondition(rows.length === 1, "existing_invitation_or_sync_job_not_found");
    return rows[0];
  }
  async function readResponses(eventId) {
    return query(`SELECT id, event_id, phone_hash, status, adults, children,
      payload_ciphertext, created_at, updated_at
      FROM rsvp_responses WHERE event_id = ? ORDER BY id`, [eventId]);
  }
  async function readPublicEvent() {
    const response = await fetcher(`https://mishanya-show.com/api/rsvp?event=${TARGET.slug}`, { cache: "no-store" });
    requireCondition(response.ok, "public_invitation_unavailable");
    const event = await response.json();
    requireCondition(event.slug === TARGET.slug, "unexpected_public_invitation");
    return event;
  }
  const before = await readState();
  requireCondition(before.source_id === TARGET.deal && before.public_slug === TARGET.slug, "wrong_invitation");
  requireCondition(["accepted", "sent"].includes(before.message_status), "client_message_not_already_sent");
  requireCondition(/^[a-f0-9]{64}$/i.test(before.message_generation), "invalid_existing_generation");
  const job = JSON.parse(before.job_json);
  requireCondition(job.type === "rsvp_deal_update" && String(job.dealId) === TARGET.deal
    && job.messageGeneration === before.message_generation, "unexpected_existing_sync_job");
  const responsesBefore = await readResponses(before.id);
  const publicBefore = await readPublicEvent();
  if (publicBefore.startsAt === TARGET.startsAt) {
    return { status: "already_correct", dealId: TARGET.deal, slug: TARGET.slug, startsAt: TARGET.startsAt, responses: responsesBefore.length };
  }
  requireCondition(publicBefore.startsAt === TARGET.oldStartsAt, "unexpected_current_event_time");
  requireCondition(before.outbox_status === "delivered", "sync_job_is_not_idle");
  if (!apply) return { status: "ready", dealId: TARGET.deal, slug: TARGET.slug, from: publicBefore.startsAt, to: TARGET.startsAt, responses: responsesBefore.length };

  // Replay the original job and generation only after an already-sent message.
  // The worker's terminal-message guard prevents a second client notification.
  // Compare the original row and generation again in the same SQL mutation.
  const now = new Date().toISOString();
  const updated = await query(`UPDATE rsvp_webhook_outbox
    SET status = 'pending', next_attempt_at = ?, delivered_at = NULL, last_error = NULL, updated_at = ?
    WHERE generation = ? AND deal_id = ? AND job_json = ? AND updated_at = ? AND status = 'delivered'
      AND EXISTS (SELECT 1 FROM rsvp_bitrix_sync s WHERE s.deal_id = ? AND s.message_generation = rsvp_webhook_outbox.generation)
      AND EXISTS (SELECT 1 FROM rsvp_client_messages m WHERE m.deal_id = ? AND m.message_kind = 'rsvp_client_invitation' AND m.status IN ('accepted', 'sent'))
    RETURNING generation`, [now, now, before.message_generation, TARGET.deal, before.job_json, before.outbox_updated_at, TARGET.deal, TARGET.deal]);
  requireCondition(updated.length === 1, "sync_changed_before_replay");

  for (let attempt = 0; attempt < maxPolls; attempt++) {
    await pause(5000);
    if ((await readPublicEvent()).startsAt !== TARGET.startsAt) continue;
    const after = await readState();
    if (after.sync_status !== "synced" || after.outbox_status !== "delivered") continue;
    for (const field of ["id", "public_slug", "manage_token_hash", "manage_token_ciphertext",
      "message_generation", "message_status", "message_attempts", "message_fingerprint", "schedule_token"]) {
      requireCondition(after[field] === before[field], `changed_${field}`);
    }
    const responsesAfter = await readResponses(after.id);
    const responseDigest = (row) => createHash("sha256").update(JSON.stringify(row)).digest("hex");
    const afterById = new Map(responsesAfter.map((row) => [row.id, responseDigest(row)]));
    requireCondition(responsesBefore.every((row) => afterById.get(row.id) === responseDigest(row)), "guest_responses_changed_during_repair");
    return {
      status: "repaired", dealId: TARGET.deal, slug: TARGET.slug, startsAt: TARGET.startsAt,
      previousResponsesPreserved: responsesBefore.length, totalResponses: responsesAfter.length,
      linksPreserved: true, clientMessageUnchanged: true,
    };
  }
  throw new Error("invitation_sync_not_confirmed_before_timeout");
}

if (typeof process !== "undefined" && process.argv?.[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const result = await repairRsvpTime19484({ token: process.env.CLOUDFLARE_API_TOKEN, apply: process.argv.includes("--apply") });
    console.log(JSON.stringify(result));
  } catch (error) {
    console.error(error instanceof Error ? error.message : "repair_failed");
    process.exitCode = 1;
  }
}
