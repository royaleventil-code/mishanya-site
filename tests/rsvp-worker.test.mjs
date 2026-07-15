import assert from "node:assert/strict";
import test from "node:test";

import {
  drainRsvpMessageOutbox,
  drainRsvpWebhookOutbox,
} from "../workers/gift-sync.js";

function outboxDb(row) {
  return {
    prepare(sql) {
      return {
        bind(...args) {
          return {
            async all() {
              return { results: row.status === "pending" ? [{ ...row }] : [] };
            },
            async run() {
              const key = row.generation || row.schedule_token;
              if (sql.includes("UPDATE rsvp_") && args[6] === key) {
                row.status = args[0];
                row.attempts += Number(args[1] || 0);
                row.next_attempt_at = args[2];
                row.delivered_at = args[3];
                row.last_error = args[4];
              }
              return { meta: { changes: 1 } };
            },
          };
        },
      };
    },
  };
}

test("retries a durable RSVP webhook outbox job and marks it delivered", async () => {
  const generation = "e".repeat(64);
  const job = {
    type: "rsvp_deal_update",
    dealId: "18123",
    eventTs: 1784012400,
    eventHandlerId: "201",
    receivedAt: "2026-07-15T00:00:00.000Z",
    messageGeneration: generation,
    messageScheduledFor: "2026-07-15T00:10:00.000Z",
  };
  const row = {
    generation,
    job_json: JSON.stringify(job),
    status: "pending",
    attempts: 0,
  };
  let fail = true;
  const sent = [];
  const env = {
    GIFT_DB: outboxDb(row),
    GIFT_SYNC_QUEUE: {
      async send(body, options) {
        if (fail) {
          fail = false;
          throw new Error("temporary queue failure");
        }
        sent.push({ body, options });
      },
    },
  };

  await drainRsvpWebhookOutbox(env);
  assert.equal(row.status, "pending");
  assert.equal(row.attempts, 1);
  assert.equal(row.last_error, "temporary queue failure");

  await drainRsvpWebhookOutbox(env);
  assert.equal(row.status, "delivered");
  assert.equal(sent.length, 1);
  assert.deepEqual(sent[0].body, job);
  assert.ok(sent[0].options.delaySeconds >= 1);
  assert.ok(sent[0].options.delaySeconds <= 10);
});

test("retries a durable client-message outbox job without losing the ten-minute deadline", async () => {
  const scheduleToken = "f".repeat(64);
  const scheduledFor = new Date(Date.now() + 600_000).toISOString();
  const job = {
    type: "rsvp_send_initial_message",
    dealId: "18123",
    scheduleToken,
    scheduledFor,
  };
  const row = {
    schedule_token: scheduleToken,
    job_json: JSON.stringify(job),
    status: "pending",
    attempts: 0,
  };
  let fail = true;
  const sent = [];
  const env = {
    GIFT_DB: outboxDb(row),
    GIFT_SYNC_QUEUE: {
      async send(body, options) {
        if (fail) {
          fail = false;
          throw new Error("temporary queue failure");
        }
        sent.push({ body, options });
      },
    },
  };

  await drainRsvpMessageOutbox(env);
  assert.equal(row.status, "pending");
  assert.equal(row.attempts, 1);

  await drainRsvpMessageOutbox(env);
  assert.equal(row.status, "delivered");
  assert.equal(sent.length, 1);
  assert.deepEqual(sent[0].body, job);
  assert.ok(sent[0].options.delaySeconds >= 599);
  assert.ok(sent[0].options.delaySeconds <= 600);
});
