import assert from "node:assert/strict";
import test from "node:test";
import { repairRsvpTime19484 } from "../scripts/repair-rsvp-time-19484.mjs";

function fixture(overrides = {}) {
  const generation = "a".repeat(64);
  const state = {
    id: "existing-event", public_slug: "lZv3hJM1C8ed", source_id: "19484", source_type: "bitrix_deal",
    manage_token_hash: "same-private-token-hash", manage_token_ciphertext: "same-private-token-ciphertext",
    sync_status: "synced", message_generation: generation, message_status: "accepted", message_attempts: 1,
    message_fingerprint: "same-message", schedule_token: "same-schedule",
    outbox_status: "delivered", outbox_updated_at: "2026-10-28T10:00:00Z",
    job_json: JSON.stringify({ type: "rsvp_deal_update", dealId: "19484", messageGeneration: generation }),
    ...overrides,
  };
  const responses = Array.from({ length: 3 }, (_, index) => ({ id: `guest-${index}`, event_id: state.id, payload_ciphertext: `encrypted-answer-${index}` }));
  let writes = 0;
  let corrected = false;
  const fetcher = async (url, init) => {
    if (String(url).startsWith("https://mishanya-show.com/api/rsvp?event=")) {
      return Response.json({ slug: state.public_slug, startsAt: corrected ? "2026-11-11T15:30:00.000Z" : "2026-11-11T16:30:00.000Z" });
    }
    assert.match(String(url), /^https:\/\/api\.cloudflare\.com\/client\/v4\/accounts\/1171f931de9f44c2a0375a9684dd40c5\/d1\/database\//);
    const { sql, params } = JSON.parse(init.body);
    let rows;
    if (sql.startsWith("SELECT e.id")) rows = [{ ...state }];
    else if (sql.includes("FROM rsvp_responses")) rows = responses;
    else if (sql.startsWith("UPDATE rsvp_webhook_outbox")) {
      assert.equal(params[2], generation);
      assert.equal(params[3], "19484");
      assert.equal(params[4], state.job_json);
      assert.match(sql, /m\.status IN \('accepted', 'sent'\)/);
      assert.match(sql, /s\.message_generation = rsvp_webhook_outbox\.generation/);
      writes++;
      corrected = true;
      rows = [{ generation }];
    } else throw new Error("Unexpected database mutation");
    return Response.json({ success: true, result: [{ success: true, results: rows }] });
  };
  return { state, responses, fetcher, writes: () => writes, correct: () => { corrected = true; } };
}

test("dry-run checks the exact invitation and never queues a replay", async () => {
  const f = fixture();
  const result = await repairRsvpTime19484({ token: "test-token", fetcher: f.fetcher });
  assert.equal(result.status, "ready");
  assert.equal(result.responses, 3);
  assert.equal(f.writes(), 0);
});

test("replays the original generation and preserves links, private token, responses and sent-message state", async () => {
  const f = fixture();
  const result = await repairRsvpTime19484({ token: "test-token", apply: true, fetcher: f.fetcher, pause: async () => {} });
  assert.equal(result.status, "repaired");
  assert.equal(result.startsAt, "2026-11-11T15:30:00.000Z");
  assert.equal(result.previousResponsesPreserved, 3);
  assert.equal(result.linksPreserved, true);
  assert.equal(result.clientMessageUnchanged, true);
  assert.equal(f.writes(), 1);
});

test("an already-correct invitation is not queued again", async () => {
  const f = fixture();
  f.correct();
  const result = await repairRsvpTime19484({ token: "test-token", apply: true, fetcher: f.fetcher });
  assert.equal(result.status, "already_correct");
  assert.equal(f.writes(), 0);
});

for (const [name, changes, error] of [
  ["an unsent client message", { message_status: "scheduled" }, /client_message_not_already_sent/],
  ["another invitation", { public_slug: "different-slug" }, /wrong_invitation/],
  ["an in-flight job", { outbox_status: "pending" }, /sync_job_is_not_idle/],
  ["another generation", { job_json: JSON.stringify({ type: "rsvp_deal_update", dealId: "19484", messageGeneration: "b".repeat(64) }) }, /unexpected_existing_sync_job/],
]) {
  test(`refuses ${name} without changing the database`, async () => {
    const f = fixture(changes);
    await assert.rejects(repairRsvpTime19484({ token: "test-token", apply: true, fetcher: f.fetcher }), error);
    assert.equal(f.writes(), 0);
  });
}
