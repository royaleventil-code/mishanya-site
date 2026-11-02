import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { encryptPayload, decryptPayload } from "../shared/gift-core.js";
import { repairRsvpEventTime } from "../shared/rsvp-time-repair.js";

const hash = (value) => createHash("sha256").update(value).digest("hex");
async function fixture(options = {}) {
  const secret = "local-test-secret-that-is-long-enough";
  const payload = { locale: "ru", organizerName: "Test", organizerPhone: "+972500000000", childName: "Test child", childAge: 6,
    startsAt: options.initialTime || "2026-11-04T15:00:00.000Z", city: "Test city", address: "Test address",
    message: "Custom message", contactEnabled: true, invitationHeadlines: { ru: "Saved heading", he: "כותרת" }, customProperty: "keep this too" };
  const event = { id: "unchanged-event", public_slug: "unchangedslug", source_id: "18312", status: "open", payload_ciphertext: await encryptPayload(payload, secret),
    manage_token_hash: "unchanged-private-hash", manage_token_ciphertext: "unchanged-private-key" };
  const responses = [{ id: "guest-1", status: "yes", adults: 2, children: 1 }];
  const originalEvent = { ...event };
  let writes = 0;
  const database = {
    prepare(sql) {
      if (sql.startsWith("SELECT id")) return { bind() { return { async first() { return { ...event }; } }; } };
      assert.match(sql, /^UPDATE rsvp_events/);
      assert.doesNotMatch(sql, /rsvp_responses|rsvp_client_messages/i);
      assert.doesNotMatch(sql.split(/\bWHERE\b/i)[0], /manage_token|public_slug/i);
      return { bind(...params) { return { async run() {
        assert.equal(params[3], event.id);
        assert.equal(params[4], event.source_id);
        assert.equal(params[5], event.public_slug);
        assert.equal(params[6], event.payload_ciphertext);
        if (options.concurrentEdit) return { meta: { changes: 0 } };
        event.payload_ciphertext = params[0];
        writes++;
        return { meta: { changes: 1 } };
      } }; } };
    },
  };
  const job = { dealId: "18312", slugDigest: hash(event.public_slug), payloadDigest: hash(event.payload_ciphertext),
    fromStartsAt: "2026-11-04T15:00:00.000Z", toStartsAt: "2026-11-04T14:00:00.000Z", ...options.job };
  return { event, originalEvent, payload, responses, job, secret, writes: () => writes,
    env: { GIFT_DB: database, GIFT_DATA_SECRET: secret, BITRIX_WEBHOOK_URL: "https://example.bitrix.test/rest/1/local-test" },
    fetcher: async (url, init) => {
      assert.ok(String(url).endsWith("/crm.deal.get.json"));
      assert.deepEqual(JSON.parse(init.body), { id: "18312" });
      return Response.json({ result: { ID: "18312", CATEGORY_ID: "2", STAGE_ID: options.stage || "C2:UC_AWENHX", TITLE: "Birthday",
        UF_CRM_1645710833434: options.bitrixTime || "2026-11-04T16:00:00+02:00" } });
    },
  };
}

test("repairs only the time while keeping all other payload fields, links and guest answers", async () => {
  const f = await fixture();
  const originalFetch = globalThis.fetch; globalThis.fetch = f.fetcher;
  try {
    assert.equal((await repairRsvpEventTime(f.env, f.job)).status, "repaired");
    assert.deepEqual(await decryptPayload(f.event.payload_ciphertext, f.secret), { ...f.payload, startsAt: f.job.toStartsAt });
    for (const field of ["id", "public_slug", "source_id", "status", "manage_token_hash", "manage_token_ciphertext"]) assert.equal(f.event[field], f.originalEvent[field]);
    assert.deepEqual(f.responses, [{ id: "guest-1", status: "yes", adults: 2, children: 1 }]);
    assert.equal((await repairRsvpEventTime(f.env, f.job)).status, "already_correct");
    assert.equal(f.writes(), 1);
  } finally { globalThis.fetch = originalFetch; }
});

test("can move an invitation one hour later when that is the fresh Bitrix time", async () => {
  const f = await fixture({ initialTime: "2026-12-11T11:00:00.000Z", bitrixTime: "2026-12-11T14:00:00+02:00",
    job: { fromStartsAt: "2026-12-11T11:00:00.000Z", toStartsAt: "2026-12-11T12:00:00.000Z" } });
  const originalFetch = globalThis.fetch; globalThis.fetch = f.fetcher;
  try {
    assert.equal((await repairRsvpEventTime(f.env, f.job)).status, "repaired");
    assert.equal((await decryptPayload(f.event.payload_ciphertext, f.secret)).startsAt, "2026-12-11T12:00:00.000Z");
  } finally { globalThis.fetch = originalFetch; }
});

for (const [name, options, code] of [
  ["changed CRM time", { bitrixTime: "2026-11-04T17:00:00+02:00" }, /repair_bitrix_time_changed/],
  ["cancelled deal", { stage: "LOSE" }, /repair_deal_not_active/],
  ["different invitation", { job: { slugDigest: "0".repeat(64) } }, /repair_invitation_changed/],
  ["edited payload", { job: { payloadDigest: "0".repeat(64) } }, /repair_payload_changed/],
  ["time without an offset", { job: { toStartsAt: "2026-11-04T16:00:00" } }, /invalid_repair_time/],
  ["concurrent edit", { concurrentEdit: true }, /repair_concurrent_edit/],
]) {
  test("refuses " + name + " without changing the event", async () => {
    const f = await fixture(options);
    const originalFetch = globalThis.fetch; globalThis.fetch = f.fetcher;
    try {
      await assert.rejects(repairRsvpEventTime(f.env, f.job), code);
      assert.equal(f.writes(), 0);
      assert.equal(f.event.payload_ciphertext, f.originalEvent.payload_ciphertext);
    } finally { globalThis.fetch = originalFetch; }
  });
}
