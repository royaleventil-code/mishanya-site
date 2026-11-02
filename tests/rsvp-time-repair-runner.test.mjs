import assert from "node:assert/strict";
import test from "node:test";
import { tailDecoder } from "../scripts/run-rsvp-time-repair-19484.mjs";

test("reads the exact repair result across split JSON chunks without confusing escaped braces", () => {
  const results = [];
  const decode = tailDecoder((result) => results.push(result));
  const stream = "Wrangler starting\n" + JSON.stringify({ logs: [{ message: ['unrelated {text}', 'RSVP_REPAIR_19484={"status":"repaired","previousResponsesPreserved":3}'] }] }, null, 2);
  for (let index = 0; index < stream.length; index += 7) decode(stream.slice(index, index + 7));
  assert.deepEqual(results, [{ status: "repaired", previousResponsesPreserved: 3 }]);
});

test("handles multiple tail events and returns a failure instead of inventing success", () => {
  const results = [];
  const decode = tailDecoder((result) => results.push(result));
  decode(JSON.stringify({ logs: [{ message: ["unrelated log"] }] }) + "\n" + JSON.stringify({ logs: [{ message: ['RSVP_REPAIR_19484={"status":"failed","error":"client_message_not_already_sent"}'] }] }));
  assert.deepEqual(results, [{ status: "failed", error: "client_message_not_already_sent" }]);
});
