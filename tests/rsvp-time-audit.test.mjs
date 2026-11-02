import assert from "node:assert/strict";
import test from "node:test";
import { createHash } from "node:crypto";
import worker, { auditPage, enqueueTimeRepairs, verifyTimeRepairs } from "../workers/rsvp-time-audit.js";

test("unauthorized audit requests cannot read customer data", async () => {
  const response = await worker.fetch(new Request("https://audit.example/audit", { method: "POST" }), {
    GIFT_DB: { prepare() { throw new Error("Unexpected database access"); } },
  });
  assert.equal(response.status, 403);
});

test("the maintenance producer binds the queue job to the exact invitation and verifies preserved data", async () => {
  const hash = (value) => createHash("sha256").update(value).digest("hex");
  const queued = [];
  const env = {
    GIFT_DB: { prepare(sql) {
      return { bind() { return {
        async first() { return { id: "same-id", public_slug: "same-slug", payload_ciphertext: "encrypted-payload",
          manage_token_hash: "private-hash", manage_token_ciphertext: "private-key", message_status: "accepted", message_attempts: 1 }; },
        async all() { assert.match(sql, /rsvp_responses/); return { results: [{ id: "existing-answer", status: "yes" }] }; },
      }; } };
    } },
    GIFT_SYNC_QUEUE: { async send(job, options) { queued.push({ job, options }); } },
  };
  let startsAt = "2026-11-04T15:00:00.000Z";
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ slug: "same-slug", startsAt, childName: "Test", address: "Unchanged address" });
  const plan = [{ dealId: "18312", slugDigest: hash("same-slug"), fromStartsAt: startsAt, toStartsAt: "2026-11-04T14:00:00.000Z" }];
  try {
    await assert.rejects(enqueueTimeRepairs(env, { plan: [{ ...plan[0], slugDigest: "0".repeat(64) }] }), /repair_invitation_changed/);
    assert.equal(queued.length, 0);
    const { baselines } = await enqueueTimeRepairs(env, { plan });
    assert.equal(queued.length, 1);
    assert.deepEqual(queued[0].job, { type: "rsvp_repair_event_time", dealId: "18312", slugDigest: hash("same-slug"),
      payloadDigest: hash("encrypted-payload"), fromStartsAt: plan[0].fromStartsAt, toStartsAt: plan[0].toStartsAt });
    assert.equal(JSON.stringify(baselines).includes("private-key"), false);
    startsAt = plan[0].toStartsAt;
    const verified = await verifyTimeRepairs(env, { baselines });
    assert.equal(verified.results[0].status, "verified");
    assert.equal(verified.results[0].responseCount, 1);
    assert.equal(verified.results[0].clientMessageUnchanged, true);
  } finally { globalThis.fetch = originalFetch; }
});

test("audit uses bound cursors and returns digests instead of encrypted payloads or private keys", async () => {
  const originalFetch = globalThis.fetch;
  const database = { prepare(sql) {
    assert.match(sql, /e\.status = 'open'/);
    return { bind(asOf, after) {
      assert.equal(asOf, "2026-11-02T10:00:00.000Z");
      assert.equal(after, "");
      return { async all() { return { results: [{ id: "a", public_slug: "testslug123", source_type: "bitrix_deal", source_id: "123",
        payload_ciphertext: "private-ciphertext", manage_token_hash: "private-hash", manage_token_ciphertext: "private-token", response_count: 3 }] }; } };
    } };
  } };
  globalThis.fetch = async () => Response.json({ slug: "testslug123", childName: "Test", startsAt: "2026-11-11T15:30:00.000Z" });
  try {
    const result = await auditPage({ GIFT_DB: database }, { asOf: "2026-11-02T10:00:00Z" });
    assert.equal(result.events[0].responseCount, 3);
    assert.equal(result.events[0].startsAt, "2026-11-11T15:30:00.000Z");
    assert.equal(result.next, null);
    assert.equal(JSON.stringify(result).includes("private-"), false);
    assert.match(result.events[0].payloadDigest, /^[a-f0-9]{64}$/);
  } finally { globalThis.fetch = originalFetch; }
});
