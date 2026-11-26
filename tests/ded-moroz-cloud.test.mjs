import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import sharp from "sharp";
import { onRequest } from "../functions/api/ded-moroz/[[path]].js";
import { newChild, newDraft, orderPhotos, photoSlots } from "../shared/ded-moroz.ts";
import { deliverOrderNotices } from "../shared/ded-moroz-notices.js";
import { getOrderPhoto, saveOrder } from "../shared/ded-moroz-cloud.js";

const origin = "https://mishanya-show.com";
const api = origin + "/api/ded-moroz";
const upload = api + "/orders";
const staff = api + "/staff/orders";
const draft = {
  ...newDraft(), children_count: 2, city: "Хайфа", parentName: "Тест", whatsapp: "+972505550100",
  parents_words: "Мы очень вами гордимся!", consent: true,
  children: [
    { ...newChild(), name: "Соня", stress: 1, gender: "girl", age: "1", fact_learned: "научилась бегать сама", fact_kind: "" },
    { ...newChild(), name: "Саша", stress: 1, gender: "boy", age: "7", fact_learned: "научился плавать в море", fact_kind: "" },
  ],
};

function fixture(t) {
  const db = new DatabaseSync(":memory:");
  t.after(() => db.close());
  db.exec(readFileSync(new URL("../migrations/0013_ded_moroz_orders.sql", import.meta.url), "utf8"));
  db.exec("PRAGMA foreign_keys=ON");
  const env = {
    GIFT_DATA_SECRET: "mock-encryption-key",
    TURNSTILE_SECRET_KEY: "mock-turnstile-key",
    DM_ACCESS_TEAM_DOMAIN: "example-test.cloudflareaccess.com",
    DM_ACCESS_AUD: "mock-orders-audience",
    DM_TELEGRAM_BOT_TOKEN: "123456:abcdefghijklmnopqrstuvwxyz",
    DM_TELEGRAM_CHAT_ID: "-100123456789",
    GIFT_DB: {
      prepare(sql) {
        const statement = db.prepare(sql);
        const bind = (...args) => {
          const values = args.map(arg => arg instanceof ArrayBuffer ? new Uint8Array(arg) : arg);
          return {
            first: async () => statement.get(...values) ?? null,
            all: async () => ({ results: statement.all(...values) }),
            run: async () => statement.run(...values),
            batchResult: () => ({ results: statement.all(...values) }),
          };
        };
        return { ...bind(), bind };
      },
      async batch(statements) {
        db.exec("BEGIN");
        try {
          const results = statements.map(statement => statement.batchResult());
          db.exec("COMMIT");
          return results;
        } catch (error) {
          db.exec("ROLLBACK");
          throw error;
        }
      },
    },
  };
  return { db, env };
}

const familyJpeg = new Blob([await sharp({ create: { width: 1000, height: 800, channels: 3, background: "#95b4c7" } }).jpeg().toBuffer()], { type: "image/jpeg" });

function orderForm(key, jpeg, payload = draft) {
  const form = new FormData();
  form.set("draft", JSON.stringify(payload));
  form.set("key", key);
  for (const slot of photoSlots(payload.children)) {
    form.set(slot.file, slot.kind === "family" ? familyJpeg : jpeg, slot.file);
  }
  return form;
}
async function submit(env, key, jpeg, turnstile = "pass") {
  const form = orderForm(key, jpeg);
  form.set("turnstileToken", turnstile);
  return onRequest({ env, request: new Request(upload, {
    method: "POST", headers: { Origin: origin, "CF-Connecting-IP": "192.0.2.1" }, body: form,
  }) });
}

test("the Pages API saves a single complete order, protects access and preserves the customer's phone", async t => {
  const { db, env } = fixture(t);
  const algorithm = { name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" };
  const signingKeys = await crypto.subtle.generateKey(algorithm, true, ["sign", "verify"]);
  const jwk = { ...await crypto.subtle.exportKey("jwk", signingKeys.publicKey), kid: "mock-access-key" };
  let keysResponse = Response.redirect("https://example.invalid/keys");
  t.mock.method(globalThis, "fetch", async (address, options) => {
    const url = new URL(address);
    if (url.hostname === "challenges.cloudflare.com") return Response.json({
      success: options.body.get("response") === "pass",
      hostname: new URL(origin).hostname, action: "ded_moroz_order",
    });
    assert.equal(url.hostname, env.DM_ACCESS_TEAM_DOMAIN);
    assert.equal(options.redirect, "manual");
    return keysResponse.clone();
  });
  const sign = async (audience, validSeconds) => {
    const base64 = value => Buffer.from(JSON.stringify(value)).toString("base64url");
    const header = base64({ alg: "RS256", kid: jwk.kid });
    const body = base64({
      aud: [audience], iss: "https://" + env.DM_ACCESS_TEAM_DOMAIN, email: "editor@example.test",
      exp: Date.now() / 1000 + validSeconds,
    });
    const signature = await crypto.subtle.sign(algorithm, signingKeys.privateKey, new TextEncoder().encode(header + "." + body));
    return [header, body, Buffer.from(signature).toString("base64url")].join(".");
  };
  const jpeg = new Blob([await sharp({ create: { width: 800, height: 1000, channels: 3, background: "#8d5260" } }).jpeg().toBuffer()], { type: "image/jpeg" });
  const key = crypto.randomUUID();
  const readiness = await onRequest({ env, request: new Request(upload, { method: "HEAD" }) });
  assert.equal(readiness.status, 204);
  assert.equal(await readiness.text(), "");
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM dm_orders").get().n, 0);
  const invalid = await submit(env, key, jpeg, "bad");
  assert.equal(invalid.status, 400);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM dm_order_photo_parts").get().n, 0);
  const [first, retry] = await Promise.all([submit(env, key, jpeg), submit(env, key, jpeg)]);
  assert.equal(first.ok, true);
  assert.equal(retry.ok, true);
  const receipt = await first.json();
  assert.deepEqual(await retry.json(), receipt);
  assert.deepEqual(Object.keys(receipt), ["order_id"]);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM dm_order_photo_parts").get().n, 3);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM dm_photo_uploads").get().n, 1);
  const raw = db.prepare("SELECT * FROM dm_orders").all();
  assert.equal(raw.length, 1);
  assert.ok(!raw[0].payload_ciphertext.includes(draft.whatsapp));

  const order = staff + "/" + receipt.order_id;
  for (const path of [staff, order + "/child1_1.jpg", order + "/zip"]) {
    const denied = await onRequest({ env, request: new Request(path) });
    assert.equal(denied.status, 403);
    assert.match(denied.headers.get("Cache-Control"), /no-store/);
  }
  for (const invalidJwt of [await sign("another-application", 600), await sign(env.DM_ACCESS_AUD, -1)]) {
    const request = new Request(staff, { headers: { "Cf-Access-Jwt-Assertion": invalidJwt } });
    assert.equal((await onRequest({ env, request })).status, 403);
  }
  const headers = { "Cf-Access-Jwt-Assertion": await sign(env.DM_ACCESS_AUD, 600) };
  const call = (url, init) => onRequest({ env, request: new Request(url, { ...init, headers }) });
  assert.equal((await call(staff)).status, 403);
  keysResponse = Response.json({ keys: [jwk] });
  const [item] = await (await call(staff)).json();
  assert.equal(item.parent.whatsapp, draft.whatsapp);
  assert.equal(Object.hasOwn(item, "ready_by"), false);
  assert.deepEqual(item.children.map(child => child.age), [1, 7]);
  const update = await call(order, { method: "PATCH", body: JSON.stringify({
    status: "review", video_url: "https://drive.google.com/file/d/demo/view",
  }) });
  assert.equal(update.status, 200);
  assert.equal((await update.json()).status, "review");
  const cancel = await call(order, { method: "PATCH", body: JSON.stringify({
    status: "cancelled", video_url: "",
  }) });
  assert.equal(cancel.status, 200);
  assert.equal((await (await call(staff)).json())[0].status, "cancelled");
  const photo = await call(order + "/child1_1.jpg");
  assert.equal(photo.headers.get("Content-Type"), "image/jpeg");
  assert.deepEqual(await photo.arrayBuffer(), await jpeg.arrayBuffer());
  const archive = await call(order + "/zip");
  assert.equal(archive.status, 200);
  assert.equal(Buffer.from(await archive.arrayBuffer()).readUInt32LE(), 0x04034b50);

  let time = Date.now();
  const notices = [];
  const options = { clock: () => time, request: async (url, request) => {
    assert.equal(new URL(url).hostname, "api.telegram.org");
    assert.equal(request.redirect, "manual");
    notices.push(JSON.parse(request.body));
    if (notices.length === 1) return Response.redirect("https://example.invalid/bot");
    if (notices.length === 2) {
      return Response.json({ ok: false, error_code: 429, parameters: { retry_after: 65 } }, { status: 429 });
    }
    return Response.json({ ok: true, result: { message_id: 5, chat: { id: Number(env.DM_TELEGRAM_CHAT_ID) } } });
  } };
  await deliverOrderNotices(env, options);
  assert.equal(notices.length, 1);
  assert.equal(db.prepare("SELECT telegram_sent_at FROM dm_orders").get().telegram_sent_at, null);
  time += 30_000;
  await deliverOrderNotices(env, options);
  assert.equal(notices.length, 2);
  assert.equal(db.prepare("SELECT telegram_sent_at FROM dm_orders").get().telegram_sent_at, null);
  time += 66_000;
  await Promise.all([deliverOrderNotices(env, options), deliverOrderNotices(env, options)]);
  assert.equal(notices.length, 3);
  assert.equal(notices[2].text, [
    "Новый заказ на видеопоздравление",
    "Заказ " + receipt.order_id,
    "Телефон: " + draft.whatsapp,
    "Детей в заказе — 2",
    "Открыть кабинет: https://mishanya-show.com/admin/ded-moroz",
  ].join("\n"));
  assert.ok(!notices[2].text.includes(draft.children[0].name));
  assert.equal(db.prepare("SELECT telegram_sent_at FROM dm_orders").get().telegram_sent_at, time);

  await t.test("staff create a complete order without a customer challenge and can safely retry", async () => {
    const manualKey = crypto.randomUUID();
    const post = body => call(staff, { method: "POST", body });
    const denied = await onRequest({ env, request: new Request(staff, {
      method: "POST", body: orderForm(manualKey, jpeg),
    }) });
    assert.equal(denied.status, 403);
    const incomplete = orderForm(manualKey, jpeg);
    incomplete.delete("family.jpg");
    assert.equal((await post(incomplete)).status, 400);
    assert.equal((await post(orderForm(manualKey, jpeg, { ...draft, consent: false }))).status, 400);
    assert.equal(db.prepare("SELECT count(*) AS n FROM dm_orders").get().n, 1);

    const result = await post(orderForm(manualKey, jpeg));
    assert.equal(result.status, 201);
    const manual = await result.json();
    assert.notEqual(manual.order_id, receipt.order_id);
    const replay = await post(orderForm(manualKey, jpeg));
    assert.equal(replay.status, 200);
    assert.deepEqual(await replay.json(), manual);
    assert.equal((await submit(env, manualKey, jpeg, "bad")).status, 400);
    const orders = await (await call(staff)).json();
    assert.equal(orders.length, 2);
    assert.equal(orders[0].order_id, manual.order_id);
    assert.equal(orders[0].status, "new");
    assert.equal(orders[0].parent.whatsapp, draft.whatsapp);
    assert.deepEqual(orders[0].children.map(c => c.name), draft.children.map(c => c.name));
    for (const { file: name, kind } of orderPhotos(orders[0])) {
      const stored = await call(staff + "/" + manual.order_id + "/" + name);
      assert.deepEqual(await stored.arrayBuffer(), await (kind === "family" ? familyJpeg : jpeg).arrayBuffer());
    }
  });
});

test("large photos survive D1 chunking and a partial upload can be retried", async t => {
  const { db, env } = fixture(t);
  const file = new Blob([Buffer.alloc(3 * 1024 * 1024, 173)], { type: "image/jpeg" });
  const files = photoSlots(draft.children).map(() => file);
  const key = crypto.randomUUID();
  db.exec("CREATE TRIGGER fail_photo BEFORE INSERT ON dm_order_photo_parts WHEN NEW.filename = 'child2_1.jpg' AND NEW.part = 2 BEGIN SELECT RAISE(ABORT, 'test'); END");
  await assert.rejects(saveOrder(env, draft, key, files), /фотографии/);
  for (const table of ["dm_orders", "dm_photo_uploads", "dm_order_photo_parts"]) {
    assert.equal(db.prepare("SELECT COUNT(*) AS n FROM " + table).get().n, 0);
  }
  db.exec("DROP TRIGGER fail_photo");
  const receipt = await saveOrder(env, draft, key, files);
  const row = db.prepare("SELECT * FROM dm_orders WHERE id = ?").get(receipt.id);
  const stored = db.prepare("SELECT content FROM dm_order_photo_parts WHERE part = 0 LIMIT 1").get().content;
  assert.ok(stored.byteLength < 2_000_000);
  assert.notDeepEqual(stored.slice(0, 100), new Uint8Array(100).fill(173));
  for (const name of ["child1_1.jpg", "child2_1.jpg", "family.jpg"]) {
    assert.deepEqual(await getOrderPhoto(env, row, name), await file.arrayBuffer());
  }
  db.prepare("INSERT INTO dm_photo_uploads (upload_id, expires_at) VALUES ('abandoned', 1)").run();
  db.prepare("INSERT INTO dm_order_photo_parts VALUES ('abandoned', 'photo1.jpg', 0, X'00')").run();
  await deliverOrderNotices({ ...env, DM_TELEGRAM_BOT_TOKEN: "" });
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM dm_order_photo_parts WHERE upload_id = 'abandoned'").get().n, 0);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM dm_photo_uploads").get().n, 1);
});
