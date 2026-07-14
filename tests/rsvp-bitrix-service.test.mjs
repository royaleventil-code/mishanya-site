import assert from "node:assert/strict";
import test from "node:test";

import {
  buildRsvpClientMessage,
  evaluateRsvpClientMessageEligibility,
  processRsvpDealUpdate,
  upsertSourceEvent,
} from "../shared/rsvp-bitrix-service.js";

test("builds the approved client message exactly", () => {
  assert.equal(
    buildRsvpClientMessage("Анна", "Маша", "https://mishanya-show.com/my-event#token=safe"),
    [
      "Анна, я также для вашего удобства подготовил текстовое приглашение на праздник Маша 🎉",
      "",
      "В нём уже указаны дата, время и место праздника. По ссылке вы сможете проверить информацию, отправить приглашение гостям и видеть ответы гостей в своём кабинете.",
      "",
      "https://mishanya-show.com/my-event#token=safe",
      "",
      "Если приглашение вам неактуально, просто не обращайте внимания на это сообщение.",
    ].join("\n"),
  );
});

test("live client messages only allow events created after the rollout cutoff", () => {
  const env = {
    RSVP_CLIENT_MESSAGE_MODE: "live",
    RSVP_CLIENT_MESSAGE_ENABLED_AFTER: "2026-07-14T12:00:00.000Z",
  };
  const deal = { ID: "18123" };
  const contact = { ID: "4854" };
  assert.equal(
    evaluateRsvpClientMessageEligibility(env, deal, contact, { created_at: "2026-07-14T11:59:59.999Z" }).status,
    "before_cutoff",
  );
  assert.equal(
    evaluateRsvpClientMessageEligibility(env, deal, contact, { created_at: "2026-07-14T12:00:00.000Z" }).status,
    "eligible",
  );
});

function sourceEventDb() {
  const events = new Map();
  const sync = new Map();
  const messages = new Map();
  return {
    events,
    sync,
    messages,
    prepare(sql) {
      return {
        bind(...args) {
          return {
            async first() {
              if (sql.includes("FROM rsvp_client_messages")) {
                return messages.get(`${args[0]}:${args[1]}`) || null;
              }
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
                created_at: row.created_at,
              } : null;
            },
            async run() {
              if (sql.includes("INSERT OR IGNORE INTO rsvp_client_messages")) {
                const key = `${args[0]}:${args[1]}`;
                if (messages.has(key)) return { meta: { changes: 0 } };
                messages.set(key, {
                  deal_id: String(args[0]),
                  message_kind: args[1],
                  contact_id: String(args[2]),
                  template_version: args[3],
                  message_fingerprint: args[4],
                  status: "pending",
                  attempts: 0,
                });
                return { meta: { changes: 1 } };
              }
              if (sql.includes("SET status = 'sending'")) {
                const key = `${args[2]}:${args[3]}`;
                const row = messages.get(key);
                if (!row || row.message_fingerprint !== args[4]
                  || !["pending", "retryable"].includes(row.status)) {
                  return { meta: { changes: 0 } };
                }
                row.status = "sending";
                row.attempts += 1;
                return { meta: { changes: 1 } };
              }
              if (sql.includes("SET status = ?, accepted_at = ?")) {
                const key = `${args[7]}:${args[8]}`;
                const row = messages.get(key);
                if (!row || row.status !== "sending") return { meta: { changes: 0 } };
                row.status = args[0];
                row.accepted_at = args[1];
                row.next_attempt_at = args[2];
                row.provider_message_id = args[3];
                row.last_http_status = args[4];
                row.last_error = args[5];
                return { meta: { changes: 1 } };
              }
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
                  created_at: args[4],
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
  const olchatCalls = [];
  globalThis.fetch = async (url, init) => {
    if (String(url).startsWith("https://olchat.example.test/")) {
      olchatCalls.push({
        method: init?.method,
        params: new URL(String(url)).searchParams,
      });
      return new Response("OK", { status: 200 });
    }
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
      OLCHAT_SEND_TEXT_URL: "https://olchat.example.test/rest/webhook/wa/hidden/sendText",
      RSVP_CLIENT_MESSAGE_MODE: "test",
      RSVP_CLIENT_MESSAGE_TEST_DEAL_ID: "18123",
      RSVP_CLIENT_MESSAGE_TEST_CONTACT_ID: "4854",
    };
    const job = { dealId: "18123", eventTs: 1784012400, eventHandlerId: "201" };
    const first = await processRsvpDealUpdate(env, job, 1);
    env.RSVP_CLIENT_MESSAGE_MODE = "live";
    env.RSVP_CLIENT_MESSAGE_ENABLED_AFTER = "2030-01-01T00:00:00.000Z";
    const second = await processRsvpDealUpdate(env, job, 2);
    assert.equal(first.status, "synced");
    assert.equal(second.status, "synced");
    assert.equal(first.clientMessageStatus, "accepted");
    assert.equal(second.clientMessageStatus, "accepted");
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
    assert.match(activities[0].DESCRIPTION, /автоматически принято WhatsApp-сервисом/);
    assert.equal(db.sync.get("18123").status, "synced");
    assert.equal(db.sync.get("18123").bitrix_activity_id, "9001");
    assert.equal(db.messages.get("18123:rsvp_client_invitation").status, "accepted");
    assert.equal(db.messages.get("18123:rsvp_client_invitation").attempts, 1);
    assert.equal(olchatCalls.length, 1);
    assert.equal(olchatCalls[0].method, "GET");
    assert.equal(olchatCalls[0].params.get("phone_number"), "972548000000");
    assert.equal(olchatCalls[0].params.get("send_to_imol"), "Y");
    const manageUrl = activities[0].DESCRIPTION.match(/Личный кабинет клиента: (https:\/\/\S+)/)?.[1];
    assert.equal(
      olchatCalls[0].params.get("body"),
      buildRsvpClientMessage("Анна", "Маша", manageUrl),
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
