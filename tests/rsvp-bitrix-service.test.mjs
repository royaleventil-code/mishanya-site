import assert from "node:assert/strict";
import test from "node:test";

import {
  processRsvpDealUpdate,
  upsertSourceEvent,
} from "../shared/rsvp-bitrix-service.js";

function sourceEventDb() {
  const events = new Map();
  const sync = new Map();
  return {
    events,
    sync,
    prepare(sql) {
      return {
        bind(...args) {
          return {
            async first() {
              if (sql.includes("SELECT bitrix_activity_id FROM rsvp_bitrix_sync")) {
                return sync.get(String(args[0])) || null;
              }
              if (!sql.includes("FROM rsvp_events")) return null;
              const row = events.get(`${args[0]}:${args[1]}`);
              return row ? {
                id: row.id,
                public_slug: row.public_slug,
                manage_token_ciphertext: row.manage_token_ciphertext,
                source_payload_hash: row.source_payload_hash,
              } : null;
            },
            async run() {
              if (sql.includes("INSERT INTO rsvp_bitrix_sync")) {
                const previous = sync.get(String(args[0])) || {};
                sync.set(String(args[0]), {
                  ...previous,
                  deal_id: String(args[0]),
                  status: args[1],
                  attempts: Math.max(Number(previous.attempts || 0), Number(args[2] || 0)),
                  public_slug: args[5] || previous.public_slug || null,
                  last_error: args[8],
                });
                return { meta: { changes: 1 } };
              }
              if (sql.includes("SET writeback_status = 'writing'")) {
                const row = sync.get(String(args[2]));
                if (!row || row.bitrix_activity_id) return { meta: { changes: 0 } };
                row.writeback_status = "writing";
                return { meta: { changes: 1 } };
              }
              if (sql.includes("SET bitrix_activity_id = ?")) {
                const row = sync.get(String(args[2]));
                row.bitrix_activity_id = String(args[0]);
                row.writeback_status = "synced";
                return { meta: { changes: 1 } };
              }
              if (sql.includes("INSERT OR IGNORE INTO rsvp_events")) {
                const key = `${args[6]}:${args[7]}`;
                if (events.has(key)) return { meta: { changes: 0 } };
                events.set(key, {
                  id: args[0],
                  public_slug: args[1],
                  manage_token_hash: args[2],
                  payload_ciphertext: args[3],
                  source_type: args[6],
                  source_id: args[7],
                  manage_token_ciphertext: args[8],
                  source_payload_hash: args[9],
                });
                return { meta: { changes: 1 } };
              }
              if (sql.includes("UPDATE rsvp_events")) {
                const row = [...events.values()].find((event) => event.id === args[3]);
                row.payload_ciphertext = args[0];
                row.source_payload_hash = args[1];
                return { meta: { changes: 1 } };
              }
              return { meta: { changes: 0 } };
            },
          };
        },
      };
    },
  };
}

function payload(overrides = {}) {
  return {
    locale: "ru",
    organizerName: "Анна Леви",
    organizerPhone: "+972548000000",
    childName: "Маша",
    childAge: 6,
    startsAt: "2026-08-28T13:00:00.000Z",
    city: "Herzl 10, Haifa",
    address: "Herzl 10, Haifa",
    message: "Будем рады разделить этот день вместе!",
    contactEnabled: true,
    ...overrides,
  };
}

test("upserts one RSVP event per Bitrix deal and preserves its links", async () => {
  const db = sourceEventDb();
  const secret = "test-secret-that-is-long-enough-for-encryption";
  const created = await upsertSourceEvent(db, "18123", payload(), secret);
  const repeated = await upsertSourceEvent(db, "18123", payload(), secret);
  const updated = await upsertSourceEvent(db, "18123", payload({ childAge: 7 }), secret);

  assert.equal(db.events.size, 1);
  assert.equal(repeated.id, created.id);
  assert.equal(repeated.public_slug, created.public_slug);
  assert.equal(updated.public_slug, created.public_slug);
  assert.notEqual(updated.source_payload_hash, repeated.source_payload_hash);
  const stored = [...db.events.values()][0];
  assert.ok(stored.manage_token_ciphertext);
  assert.equal(stored.source_id, "18123");
});

test("processes a closed deal twice without creating a duplicate event", async () => {
  const db = sourceEventDb();
  const originalFetch = globalThis.fetch;
  const deal = {
    ID: "18123",
    CATEGORY_ID: "0",
    STAGE_ID: "UC_HP4F3F",
    TITLE: "др 2026 Анна Девочка возраст 6 Haifa",
    CONTACT_ID: "4854",
    UF_CRM_1645710600299: "Маша",
    UF_CRM_6314CD391B643: "Маша",
    UF_CRM_620BA6CC57523: "6",
    UF_CRM_1645710833434: "2026-08-28T16:00:00+03:00",
    UF_CRM_620BA6CC427A3: "Herzl 10, Haifa",
  };
  const contact = {
    ID: "4854",
    NAME: "Анна",
    LAST_NAME: "Леви",
    PHONE: [{ VALUE: "+972548000000" }],
  };
  const activities = [];
  globalThis.fetch = async (url, init) => {
    const params = JSON.parse(String(init?.body || "{}"));
    if (String(url).includes("crm.deal.get.json")) return Response.json({ result: deal });
    if (String(url).includes("crm.contact.get.json")) return Response.json({ result: contact });
    if (String(url).includes("crm.activity.list.json")) {
      return Response.json({ result: activities.map((activity) => ({ ...activity })) });
    }
    if (String(url).includes("crm.activity.add.json")) {
      activities.push({ ID: "9001", ...params.fields });
      return Response.json({ result: 9001 });
    }
    if (String(url).includes("crm.activity.update.json")) {
      const existing = activities.find((activity) => Number(activity.ID) === Number(params.id));
      Object.assign(existing, params.fields);
      return Response.json({ result: true });
    }
    return Response.json({ error: "unexpected_method" }, { status: 400 });
  };

  try {
    const env = {
      GIFT_DB: db,
      GIFT_DATA_SECRET: "test-secret-that-is-long-enough-for-encryption",
      BITRIX_WEBHOOK_URL: "https://example.bitrix24.com/rest/1/hidden",
    };
    const job = { dealId: "18123", eventTs: 1784012400, eventHandlerId: "201" };
    const first = await processRsvpDealUpdate(env, job, 1);
    const second = await processRsvpDealUpdate(env, job, 2);
    assert.equal(first.status, "synced");
    assert.equal(second.status, "synced");
    assert.equal(first.publicSlug, second.publicSlug);
    assert.equal(db.events.size, 1);
    assert.equal(activities.length, 1);
    assert.equal(activities[0].OWNER_TYPE_ID, 2);
    assert.equal(activities[0].OWNER_ID, 18123);
    assert.equal(activities[0].TYPE_ID, 1);
    assert.equal(activities[0].COMPLETED, "Y");
    assert.deepEqual(activities[0].COMMUNICATIONS, [{
      ENTITY_ID: 4854,
      ENTITY_TYPE_ID: 3,
      TYPE: "PHONE",
      VALUE: "+972548000000",
    }]);
    assert.match(activities[0].DESCRIPTION, /Ссылка для гостей: https:\/\/mishanya-show\.com\/invite\?event=/);
    assert.match(activities[0].DESCRIPTION, /Личный кабинет клиента: https:\/\/mishanya-show\.com\/my-event#token=/);
    assert.equal(db.sync.get("18123").status, "synced");
    assert.equal(db.sync.get("18123").bitrix_activity_id, "9001");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
