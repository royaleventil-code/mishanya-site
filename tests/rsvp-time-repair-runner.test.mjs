import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import worker from "../workers/rsvp-time-repair-19484.js";

const capability = "a".repeat(43);
const env = {
  REPAIR_TOKEN_HASH: createHash("sha256").update(capability).digest("hex"),
  REPAIR_EXPIRES_AT: String(Date.now() + 60_000),
  GIFT_DB: { prepare() { throw new Error("Unauthorized request reached the database"); } },
};

for (const [name, path, method, token, changes] of [
  ["missing token", "/repair", "POST", "", {}],
  ["wrong token", "/repair", "POST", "b".repeat(43), {}],
  ["wrong path", "/other", "POST", capability, {}],
  ["wrong method", "/repair", "GET", capability, {}],
  ["expired operation", "/repair", "POST", capability, { REPAIR_EXPIRES_AT: "1" }],
  ["unconfigured operation", "/repair", "POST", capability, { REPAIR_TOKEN_HASH: "" }],
]) {
  test("rejects " + name + " before reading or changing data", async () => {
    const response = await worker.fetch(new Request("https://repair.example" + path, { method, headers: { Authorization: "Bearer " + token } }), { ...env, ...changes });
    assert.equal(response.status, 403);
  });
}

test("an authorized already-correct invitation preserves the existing event and responses", async () => {
  const generation = "c".repeat(64);
  let writes = 0;
  const database = {
    prepare(sql) {
      return { bind() { return { async all() {
        let results;
        if (sql.startsWith("SELECT e.id")) results = [{ id: "same-event", source_id: "19484", public_slug: "lZv3hJM1C8ed", message_status: "accepted", message_generation: generation,
          job_json: JSON.stringify({ type: "rsvp_deal_update", dealId: "19484", messageGeneration: generation }) }];
        else if (sql.includes("FROM rsvp_responses")) results = [{ id: "one" }, { id: "two" }, { id: "three" }];
        else { writes++; throw new Error("Unexpected write"); }
        return { success: true, results };
      } }; } };
    },
  };
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ slug: "lZv3hJM1C8ed", startsAt: "2026-11-11T15:30:00.000Z" });
  try {
    const response = await worker.fetch(new Request("https://repair.example/repair", { method: "POST", headers: { Authorization: "Bearer " + capability } }), { ...env, GIFT_DB: database });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: "already_correct", dealId: "19484", slug: "lZv3hJM1C8ed", startsAt: "2026-11-11T15:30:00.000Z", responses: 3 });
    assert.equal(writes, 0);
  } finally { globalThis.fetch = originalFetch; }
});
