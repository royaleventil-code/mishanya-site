import assert from "node:assert/strict";
import test from "node:test";

import {
  onRequestGet,
  onRequestPost,
} from "../functions/api/bitrix/deal-update.js";

function mockDb(options = {}) {
  const receipts = new Set();
  const sync = new Map();
  const outbox = new Map();
  const prepare = (sql) => ({
    bind(...args) {
      return {
        sql,
        args,
        async first() {
          if (sql.includes("SELECT message_generation FROM rsvp_bitrix_sync")) {
            return sync.get(String(args[0])) || null;
          }
          return null;
        },
        async run() {
          if (sql.includes("INSERT OR IGNORE INTO rsvp_bitrix_webhook_receipts")) {
            if (receipts.has(args[0])) return { meta: { changes: 0 } };
            receipts.add(args[0]);
            return { meta: { changes: 1 } };
          }
          if (sql.includes("DELETE FROM rsvp_bitrix_webhook_receipts")) receipts.delete(args[0]);
          if (sql.includes("INSERT INTO rsvp_bitrix_sync") && sql.includes("message_generation")) {
            const previous = sync.get(String(args[0]));
            const wins = !previous
              || args[4] > previous.message_scheduled_for
              || (args[4] === previous.message_scheduled_for
                && args[3] > previous.message_generation);
            if (wins) {
              sync.set(String(args[0]), {
                message_generation: args[3],
                message_scheduled_for: args[4],
              });
            }
          }
          if (sql.includes("INSERT OR IGNORE INTO rsvp_webhook_outbox")) {
            if (!outbox.has(String(args[0]))) {
              outbox.set(String(args[0]), {
                generation: String(args[0]),
                deal_id: String(args[1]),
                job_json: args[2],
                status: "pending",
              });
            }
          }
          if (sql.includes("SET status = 'delivered'")) {
            const row = outbox.get(String(args[2]));
            if (row) row.status = "delivered";
          }
          if (sql.includes("SET status = 'stale'")) {
            const row = outbox.get(String(args[1]));
            if (row) row.status = "stale";
          }
          return { meta: { changes: 1 } };
        },
      };
    },
  });
  return {
    receipts,
    sync,
    outbox,
    prepare,
    async batch(statements) {
      const syncStatement = statements.find((statement) => (
        statement.sql.includes("INSERT INTO rsvp_bitrix_sync")
      ));
      if (String(syncStatement?.args?.[1] || "") === String(options.delayEventTs || "")) {
        await new Promise((resolve) => setTimeout(resolve, 15));
      }
      return Promise.all(statements.map((statement) => statement.run()));
    },
  };
}

function validBody(overrides = {}) {
  return new URLSearchParams({
    event: "ONCRMDEALUPDATE",
    event_handler_id: "201",
    "data[FIELDS][ID]": "18123",
    ts: "1784012400",
    "auth[domain]": "mishanya.bitrix24.com",
    "auth[application_token]": "event-token-value",
    ...overrides,
  }).toString();
}

function request(body = validBody(), headers = {}) {
  return new Request("https://mishanya-show.com/api/bitrix/deal-update", {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded; charset=utf-8",
      ...headers,
    },
    body,
  });
}

function context(db, sent) {
  return {
    request: request(),
    env: {
      BITRIX_EVENT_TOKEN: "event-token-value",
      BITRIX_EVENT_DOMAIN: "mishanya.bitrix24.com",
      GIFT_DB: db,
      GIFT_SYNC_QUEUE: {
        async send(body, options) {
          sent.push({ body, options });
        },
      },
    },
  };
}

test("authenticates, deduplicates and delays a Bitrix event", async () => {
  const db = mockDb();
  const sent = [];
  const first = await onRequestPost(context(db, sent));
  assert.equal(first.status, 202);
  assert.deepEqual(await first.json(), { status: "queued" });
  assert.equal(sent.length, 1);
  assert.deepEqual(sent[0].options, { delaySeconds: 10 });
  assert.equal(sent[0].body.type, "rsvp_deal_update");
  assert.equal(sent[0].body.dealId, "18123");
  assert.equal(sent[0].body.messageGeneration, db.sync.get("18123").message_generation);
  assert.equal(sent[0].body.messageScheduledFor, db.sync.get("18123").message_scheduled_for);
  assert.equal(db.outbox.get(sent[0].body.messageGeneration).status, "delivered");

  const second = await onRequestPost(context(db, sent));
  assert.equal(second.status, 202);
  assert.deepEqual(await second.json(), { status: "duplicate" });
  assert.equal(sent.length, 1);
});

test("rejects an invalid application token without queueing", async () => {
  const db = mockDb();
  const sent = [];
  const ctx = context(db, sent);
  ctx.request = request(validBody({ "auth[application_token]": "wrong-token" }));
  const response = await onRequestPost(ctx);
  assert.equal(response.status, 401);
  assert.equal(sent.length, 0);
});

test("keeps the newest generation when webhook requests finish out of order", async () => {
  const db = mockDb({ delayEventTs: "1784012400" });
  const sent = [];
  const older = context(db, sent);
  const newer = context(db, sent);
  newer.request = request(validBody({ ts: "1784012401" }));

  const olderPromise = onRequestPost(older);
  await new Promise((resolve) => setTimeout(resolve, 1));
  const newerPromise = onRequestPost(newer);
  const [olderResponse, newerResponse] = await Promise.all([olderPromise, newerPromise]);

  assert.equal(olderResponse.status, 202);
  assert.equal(newerResponse.status, 202);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].body.eventTs, 1784012401);
  assert.equal(db.sync.get("18123").message_generation, sent[0].body.messageGeneration);
});

test("keeps a durable outbox job when direct queue delivery fails", async () => {
  const db = mockDb();
  const ctx = context(db, []);
  ctx.env.GIFT_SYNC_QUEUE.send = async () => {
    throw new Error("queue failed");
  };
  const failed = await onRequestPost(ctx);
  assert.equal(failed.status, 202);
  assert.equal(db.receipts.size, 1);
  assert.equal(db.outbox.size, 1);
  assert.equal([...db.outbox.values()][0].status, "pending");
});

test("rejects non-form bodies and GET", async () => {
  const db = mockDb();
  const sent = [];
  const ctx = context(db, sent);
  ctx.request = request("{}", { "content-type": "application/json" });
  assert.equal((await onRequestPost(ctx)).status, 415);
  assert.equal(onRequestGet().status, 405);
});
