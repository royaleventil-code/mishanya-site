import assert from "node:assert/strict";
import test from "node:test";

import {
  buildRsvpClientMessage,
  evaluateRsvpClientMessageEligibility,
  processRsvpClientMessageSend,
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

test("live client messages only allow deals moved to the closed stage after the rollout cutoff", () => {
  const env = {
    RSVP_CLIENT_MESSAGE_MODE: "live",
    RSVP_CLIENT_MESSAGE_ENABLED_AFTER: "2026-07-14T12:00:00.000Z",
  };
  const contact = { ID: "4854" };
  assert.equal(
    evaluateRsvpClientMessageEligibility(env, {
      ID: "18123",
      MOVED_TIME: "2026-07-01T21:20:18+03:00",
      DATE_MODIFY: "2026-07-14T20:25:57+03:00",
    }, contact).status,
    "before_cutoff",
  );
  assert.equal(
    evaluateRsvpClientMessageEligibility(env, {
      ID: "18124",
      MOVED_TIME: "2026-07-14T15:00:00+03:00",
    }, contact).status,
    "eligible",
  );
  assert.equal(
    evaluateRsvpClientMessageEligibility(env, { ID: "18125" }, contact).status,
    "live_blocked",
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
              if (sql.includes("SELECT message_generation, message_scheduled_for")) {
                return sync.get(String(args[0])) || null;
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
              if (sql.includes("SET status = 'retryable', schedule_token = NULL")) {
                const key = `${args[1]}:${args[2]}`;
                const row = messages.get(key);
                if (!row || row.schedule_token !== args[3] || row.status !== "scheduled") {
                  return { meta: { changes: 0 } };
                }
                row.status = "retryable";
                row.schedule_token = null;
                row.scheduled_for = null;
                row.last_error = "queue_unavailable";
                return { meta: { changes: 1 } };
              }
              if (sql.includes("INSERT INTO rsvp_client_messages")) {
                const key = `${args[0]}:${args[1]}`;
                const row = messages.get(key);
                const syncRow = sync.get(String(args[9]));
                if (!syncRow || syncRow.message_generation !== args[10]) {
                  return { meta: { changes: 0 } };
                }
                if (row && ["accepted", "sent", "sending", "ambiguous", "failed"].includes(row.status)) {
                  return { meta: { changes: 0 } };
                }
                if (row?.status === "claimed" && row.schedule_token === args[5]) {
                  return { meta: { changes: 0 } };
                }
                messages.set(key, {
                  ...row,
                  deal_id: String(args[0]),
                  message_kind: args[1],
                  contact_id: String(args[2]),
                  template_version: args[3],
                  message_fingerprint: args[4],
                  status: "scheduled",
                  attempts: Number(row?.attempts || 0),
                  schedule_token: args[5],
                  scheduled_for: args[6],
                });
                return { meta: { changes: 1 } };
              }
              if (sql.includes("SET status = ?, schedule_token = NULL")) {
                const key = `${args[2]}:${args[3]}`;
                const row = messages.get(key);
                const hasTokenCheck = sql.includes("AND schedule_token = ?");
                const hasGenerationCheck = sql.includes("message_generation = ?");
                const generationDealIndex = hasTokenCheck ? 5 : 4;
                const generationIndex = hasTokenCheck ? 6 : 5;
                if (!row || !["scheduled", "rescheduling", "retryable"].includes(row.status)
                  || (hasTokenCheck && row.schedule_token !== args[4])
                  || (hasGenerationCheck
                    && sync.get(String(args[generationDealIndex]))?.message_generation !== args[generationIndex])) {
                  return { meta: { changes: 0 } };
                }
                row.status = args[0];
                row.schedule_token = null;
                row.scheduled_for = null;
                return { meta: { changes: 1 } };
              }
              if (sql.includes("SET status = 'claimed', contact_id = ?")) {
                const key = `${args[5]}:${args[6]}`;
                const row = messages.get(key);
                if (!row || row.schedule_token !== args[7]
                  || sync.get(String(args[9]))?.message_generation !== args[10]
                  || (!["scheduled", "retryable"].includes(row.status)
                    && !(row.status === "claimed" && (!row.claimed_at || row.claimed_at < args[8])))) {
                  return { meta: { changes: 0 } };
                }
                row.status = "claimed";
                row.contact_id = String(args[0]);
                row.template_version = args[1];
                row.message_fingerprint = args[2];
                row.claimed_at = args[3];
                row.attempts += 1;
                return { meta: { changes: 1 } };
              }
              if (sql.includes("SET status = 'sending', updated_at = ?")) {
                const key = `${args[1]}:${args[2]}`;
                const row = messages.get(key);
                if (!row || row.status !== "claimed" || row.schedule_token !== args[3]
                  || sync.get(String(args[4]))?.message_generation !== args[5]) {
                  return { meta: { changes: 0 } };
                }
                row.status = "sending";
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
    MOVED_TIME: "2026-07-14T15:40:08+03:00",
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
  const queuedMessages = [];
  let failNextQueue = true;
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
    const firstGeneration = "a".repeat(64);
    const secondGeneration = "b".repeat(64);
    const firstScheduledFor = new Date(Date.now() + 600_000).toISOString();
    const secondScheduledFor = new Date(Date.now() + 600_000).toISOString();
    db.sync.set("18123", {
      message_generation: firstGeneration,
      message_scheduled_for: firstScheduledFor,
    });
    const env = {
      GIFT_DB: db,
      GIFT_DATA_SECRET: "test-secret-that-is-long-enough-for-encryption",
      BITRIX_WEBHOOK_URL: "https://example.bitrix24.com/rest/1/hidden",
      OLCHAT_SEND_TEXT_URL: "https://olchat.example.test/rest/webhook/wa/hidden/sendText",
      RSVP_CLIENT_MESSAGE_MODE: "test",
      RSVP_CLIENT_MESSAGE_TEST_DEAL_ID: "18123",
      RSVP_CLIENT_MESSAGE_TEST_CONTACT_ID: "4854",
      GIFT_SYNC_QUEUE: {
        async send(body, options) {
          if (failNextQueue) {
            failNextQueue = false;
            throw new Error("queue unavailable");
          }
          queuedMessages.push({ body, options });
        },
      },
    };
    const firstJob = {
      dealId: "18123",
      eventTs: 1784012400,
      eventHandlerId: "201",
      messageGeneration: firstGeneration,
      messageScheduledFor: firstScheduledFor,
    };
    await assert.rejects(
      processRsvpDealUpdate(env, firstJob, 1),
      /rsvp_message_queue_unavailable/,
    );
    assert.equal(db.messages.get("18123:rsvp_client_invitation").status, "retryable");
    assert.equal(db.messages.get("18123:rsvp_client_invitation").schedule_token, null);
    const first = await processRsvpDealUpdate(env, firstJob, 2);
    db.sync.set("18123", {
      ...db.sync.get("18123"),
      message_generation: secondGeneration,
      message_scheduled_for: secondScheduledFor,
    });
    const secondJob = {
      ...firstJob,
      eventTs: 1784012401,
      messageGeneration: secondGeneration,
      messageScheduledFor: secondScheduledFor,
    };
    const second = await processRsvpDealUpdate(env, secondJob, 3);
    assert.equal(first.status, "synced");
    assert.equal(second.status, "synced");
    assert.equal(first.clientMessageStatus, "scheduled");
    assert.equal(second.clientMessageStatus, "scheduled");
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
    assert.match(activities[0].DESCRIPTION, /через 10 минут после последнего изменения сделки/);
    assert.equal(db.sync.get("18123").status, "synced");
    assert.equal(db.sync.get("18123").bitrix_activity_id, "9001");
    assert.equal(db.messages.get("18123:rsvp_client_invitation").status, "scheduled");
    assert.equal(db.messages.get("18123:rsvp_client_invitation").attempts, 0);
    assert.equal(queuedMessages.length, 2);
    assert.ok(queuedMessages[0].options.delaySeconds >= 599);
    assert.ok(queuedMessages[0].options.delaySeconds <= 600);
    assert.equal(queuedMessages[0].body.type, "rsvp_send_initial_message");
    assert.notEqual(queuedMessages[0].body.scheduleToken, queuedMessages[1].body.scheduleToken);

    const outOfOrder = await processRsvpDealUpdate(env, firstJob, 4);
    assert.equal(outOfOrder.clientMessageStatus, "stale");
    assert.equal(queuedMessages.length, 2);
    assert.match(activities[0].DESCRIPTION, /через 10 минут после последнего изменения сделки/);

    const stale = await processRsvpClientMessageSend(env, queuedMessages[0].body);
    assert.equal(stale.status, "stale");
    assert.equal(olchatCalls.length, 0);

    await assert.rejects(
      processRsvpClientMessageSend(env, queuedMessages[1].body),
      (error) => error?.message === "rsvp_message_not_due" && error.retryAfterSeconds > 0,
    );
    assert.equal(olchatCalls.length, 0);

    db.messages.get("18123:rsvp_client_invitation").scheduled_for = "2020-01-01T00:00:00.000Z";
    db.sync.get("18123").message_scheduled_for = "2020-01-01T00:00:00.000Z";
    db.messages.get("18123:rsvp_client_invitation").status = "claimed";
    db.messages.get("18123:rsvp_client_invitation").claimed_at = new Date().toISOString();
    await assert.rejects(
      processRsvpClientMessageSend(env, queuedMessages[1].body),
      (error) => error?.message === "rsvp_message_claim_busy" && error.retryAfterSeconds > 0,
    );
    assert.equal(olchatCalls.length, 0);
    db.messages.get("18123:rsvp_client_invitation").claimed_at = "2020-01-01T00:00:00.000Z";
    const sent = await processRsvpClientMessageSend(env, queuedMessages[1].body);
    assert.equal(sent.status, "accepted");
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

    const afterAccepted = await processRsvpDealUpdate(env, secondJob, 5);
    assert.equal(afterAccepted.clientMessageStatus, "accepted");
    assert.equal(queuedMessages.length, 2);
    assert.equal(olchatCalls.length, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("cancels a pending client message when the deal leaves the closed stage", async () => {
  const db = sourceEventDb();
  const generation = "c".repeat(64);
  db.sync.set("18123", {
    message_generation: generation,
    message_scheduled_for: "2030-01-01T00:00:00.000Z",
  });
  db.messages.set("18123:rsvp_client_invitation", {
    deal_id: "18123",
    message_kind: "rsvp_client_invitation",
    status: "scheduled",
    schedule_token: "d".repeat(64),
    scheduled_for: "2030-01-01T00:00:00.000Z",
    attempts: 0,
  });
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    if (String(url).includes("crm.deal.get.json")) {
      return Response.json({
        result: {
          ID: "18123",
          CATEGORY_ID: "0",
          STAGE_ID: "NEW",
          CONTACT_ID: "4854",
        },
      });
    }
    if (String(url).includes("crm.contact.get.json")) {
      return Response.json({ result: { ID: "4854", NAME: "Анна" } });
    }
    return Response.json({ error: "unexpected_method" }, { status: 400 });
  };

  try {
    const result = await processRsvpDealUpdate({
      GIFT_DB: db,
      GIFT_DATA_SECRET: "test-secret-that-is-long-enough-for-encryption",
      BITRIX_WEBHOOK_URL: "https://example.bitrix24.com/rest/1/hidden",
    }, { dealId: "18123", messageGeneration: generation }, 1);
    assert.equal(result.status, "ignored_stage");
    assert.equal(db.messages.get("18123:rsvp_client_invitation").status, "canceled");
    assert.equal(db.messages.get("18123:rsvp_client_invitation").schedule_token, null);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
