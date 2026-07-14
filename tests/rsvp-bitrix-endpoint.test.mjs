import assert from "node:assert/strict";
import test from "node:test";

import {
  onRequestGet,
  onRequestPost,
} from "../functions/api/bitrix/deal-update.js";

function mockDb() {
  const receipts = new Set();
  const prepare = (sql) => ({
    bind(...args) {
      return {
        async run() {
          if (sql.includes("INSERT OR IGNORE INTO rsvp_bitrix_webhook_receipts")) {
            if (receipts.has(args[0])) return { meta: { changes: 0 } };
            receipts.add(args[0]);
            return { meta: { changes: 1 } };
          }
          if (sql.includes("DELETE FROM rsvp_bitrix_webhook_receipts")) receipts.delete(args[0]);
          return { meta: { changes: 1 } };
        },
      };
    },
  });
  return {
    receipts,
    prepare,
    async batch(statements) {
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

test("removes the receipt when queue delivery fails", async () => {
  const db = mockDb();
  const ctx = context(db, []);
  ctx.env.GIFT_SYNC_QUEUE.send = async () => {
    throw new Error("queue failed");
  };
  const failed = await onRequestPost(ctx);
  assert.equal(failed.status, 503);
  assert.equal(db.receipts.size, 0);
});

test("rejects non-form bodies and GET", async () => {
  const db = mockDb();
  const sent = [];
  const ctx = context(db, sent);
  ctx.request = request("{}", { "content-type": "application/json" });
  assert.equal((await onRequestPost(ctx)).status, 415);
  assert.equal(onRequestGet().status, 405);
});
