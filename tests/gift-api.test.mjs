import assert from "node:assert/strict";
import test from "node:test";
import { onRequestPost } from "../functions/api/gift.js";
import { decryptPayload } from "../shared/gift-core.js";

function contextFor(payload, existingClaim = null) {
  const state = { claim: existingClaim, inserts: 0, queued: [] };
  const secret = "gift-endpoint-test-secret";
  const env = {
    GIFT_DATA_SECRET: secret,
    GIFT_SYNC_QUEUE: { async send(job) { state.queued.push(job); } },
    GIFT_DB: {
      prepare(sql) {
        return {
          bind(...values) {
            return {
              async first() { return state.claim; },
              async run() {
                if (sql.startsWith("INSERT OR IGNORE INTO gift_claims")) {
                  state.inserts += 1;
                  state.claim = {
                    id: values[0], phone_hash: values[1], gift_code: values[2],
                    source_code: values[3], language: values[4], payload_ciphertext: values[5],
                    submitted_at: values[6], valid_until: values[7], status: "pending",
                  };
                } else if (sql.includes("SET status = 'queued'")) {
                  state.claim.status = "queued";
                } else {
                  throw new Error(`Unexpected database operation: ${sql}`);
                }
                return { success: true };
              },
            };
          },
        };
      },
    },
  };
  const request = new Request("https://example.test/api/gift", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return { context: { request, env }, state, secret };
}

test("gift endpoint encrypts and queues a phone-only submission in both languages", async () => {
  for (const language of ["ru", "he"]) {
    const { context, state, secret } = contextFor({
      language, sourceCode: "banner-01", giftCode: "discount-200", phone: " 050-234-5678 ",
    });
    const response = await onRequestPost(context);
    assert.equal(response.status, 202);
    assert.equal((await response.json()).status, "queued");
    assert.equal(state.inserts, 1);
    assert.deepEqual(state.queued, [{ claimId: state.claim.id }]);
    const stored = await decryptPayload(state.claim.payload_ciphertext, secret);
    assert.equal(stored.phone, "050-234-5678");
    assert.equal(stored.language, language);
    assert.deepEqual(stored.children, []);
    assert.equal(stored.clientName, "");
    assert.equal(stored.city, "");
    assert.equal(stored.hostCode, "");
    assert.equal(Object.hasOwn(stored, "turnstileToken"), false);
  }
});

test("gift endpoint rejects an empty phone without storing or queuing a claim", async () => {
  const { context, state } = contextFor({
    language: "ru", giftCode: "discount-200", phone: "   ",
  });
  const response = await onRequestPost(context);
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error, "invalid_phone");
  assert.equal(state.inserts, 0);
  assert.deepEqual(state.queued, []);
});

test("a phone-only repeat keeps an existing gift and does not create another claim", async () => {
  const { context, state } = contextFor({
    language: "ru", giftCode: "discount-200", phone: "0502345678",
  }, {
    id: "existing-legacy-claim", gift_code: "bubbles", status: "synced",
    valid_until: "2099-12-31T00:00:00.000Z",
  });
  const response = await onRequestPost(context);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    status: "existing", giftCode: "bubbles", validUntil: "2099-12-31T00:00:00.000Z",
  });
  assert.equal(state.inserts, 0);
  assert.deepEqual(state.queued, []);
});
