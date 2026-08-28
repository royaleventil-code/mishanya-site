import assert from "node:assert/strict";
import test from "node:test";

import { onRequestGet, onRequestPost } from "../functions/api/rsvp.js";
import { decryptPayload, encryptPayload, phoneHash } from "../shared/gift-core.js";

const SECRET = "test-secret-that-is-long-enough-for-encryption";
const MANAGE_TOKEN = "m".repeat(48);

function eventPayload() {
  return {
    locale: "ru",
    organizerName: "Анна Леви",
    organizerPhone: "+972548000000",
    childName: "Майэль и Эден",
    childAge: 10,
    startsAt: "2026-09-04T12:00:00.000Z",
    city: "Хайфа",
    address: "Herzl 10, Haifa",
    message: "Будем рады разделить этот день вместе!",
    contactEnabled: true,
  };
}

async function rsvpDb() {
  const state = {
    event: {
      id: "event-1",
      public_slug: "publicslug12",
      manage_token_hash: await phoneHash(`rsvp-manage:${MANAGE_TOKEN}`, SECRET),
      payload_ciphertext: await encryptPayload(eventPayload(), SECRET),
      status: "open",
      updated_at: "2026-08-28T09:00:00.000Z",
    },
  };
  return {
    state,
    prepare(sql) {
      return {
        bind(...args) {
          return {
            async first() {
              if (sql.includes("manage_token_hash = ?")) {
                return args[0] === state.event.manage_token_hash ? { ...state.event } : null;
              }
              if (sql.includes("public_slug = ?")) {
                return args[0] === state.event.public_slug ? { ...state.event } : null;
              }
              return null;
            },
            async run() {
              if (sql.includes("UPDATE rsvp_events SET payload_ciphertext")) {
                assert.equal(args[2], state.event.id);
                state.event.payload_ciphertext = args[0];
                state.event.updated_at = args[1];
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

function updateRequest(invitationHeadlines, token = MANAGE_TOKEN) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  return new Request("https://mishanya-show.com/api/rsvp", {
    method: "POST",
    headers,
    body: JSON.stringify({ action: "update_invitation_headlines", invitationHeadlines }),
  });
}

test("updates invitation headlines only with the private management token", async () => {
  const db = await rsvpDb();
  const response = await onRequestPost({
    request: updateRequest({
      ru: "Майэль и Эден празднуют вместе!",
      he: "יום ההולדת של מיאל ועדן!",
    }),
    env: { GIFT_DB: db, RSVP_DATA_SECRET: SECRET },
  });

  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.status, "saved");
  assert.deepEqual(result.event.invitationHeadlines, {
    ru: "Майэль и Эден празднуют вместе!",
    he: "יום ההולדת של מיאל ועדן!",
  });
  assert.equal("organizerPhone" in result.event, false);

  const stored = await decryptPayload(db.state.event.payload_ciphertext, SECRET);
  assert.deepEqual(stored.invitationHeadlines, result.event.invitationHeadlines);

  const publicResponse = await onRequestGet({
    request: new Request(`https://mishanya-show.com/api/rsvp?event=${db.state.event.public_slug}`),
    env: { GIFT_DB: db, RSVP_DATA_SECRET: SECRET },
  });
  assert.equal(publicResponse.status, 200);
  assert.deepEqual((await publicResponse.json()).invitationHeadlines, result.event.invitationHeadlines);
});

test("rejects headline updates without the private token", async () => {
  const db = await rsvpDb();
  const before = db.state.event.payload_ciphertext;
  const response = await onRequestPost({
    request: updateRequest({ ru: "Посторонний текст" }, ""),
    env: { GIFT_DB: db, RSVP_DATA_SECRET: SECRET },
  });

  assert.equal(response.status, 401);
  assert.equal(db.state.event.payload_ciphertext, before);
});

test("rejects an invitation headline longer than the card limit", async () => {
  const db = await rsvpDb();
  const response = await onRequestPost({
    request: updateRequest({ ru: "я".repeat(141) }),
    env: { GIFT_DB: db, RSVP_DATA_SECRET: SECRET },
  });

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "invalid_invitation_headlines" });
});
