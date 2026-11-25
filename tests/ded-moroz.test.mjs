import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { cropFrame, earliestDate, newDraft, orderFromDraft, validateDraft, whatsappContactDigits } from "../shared/ded-moroz.ts";
import { decodePhoto, orderStore, zipFiles } from "../scripts/ded-moroz-files.mjs";
import { createTelegramOrderNotifier, loadTelegramSettings, saveTelegramSettings, setupChats } from "../scripts/ded-moroz-telegram.mjs";

const testBotSettings = { token: "123456789:" + "x".repeat(35), chatId: "-1001234567890", threadId: 15 };

const draft = () => ({
  ...newDraft(), children: ["соня", "миша"].map((name,i) => ({
    name, name_pronounce: "", gender: i ? "boy" : "girl", age: i ? "7" : "5",
    fact_learned: i ? "научился играть на гитаре" : "научилась плавать в море", fact_kind: "",
  })), city: "Назарет-Иллит (Ноф-ха-Галиль)", parents_words: "Мы очень вами гордимся!",
  parentName: "Анна", whatsapp: "050-123-4567", ready_by: earliestDate(), consent: true,
});
test("one or several children share an order and retain all personal text", () => {
  const d = draft();
  assert.deepEqual(validateDraft(d, 0), {}); assert.deepEqual(validateDraft(d, 2), {});
  const order = orderFromDraft(d, "DM-2026-0001", new Date());
  assert.deepEqual(order.children.map(c => c.name), ["Соня", "Миша"]);
  assert.equal(order.parent.whatsapp, "050-123-4567"); assert.equal(order.child.name, "Соня");
  d.children.pop(); assert.equal(orderFromDraft(d, "DM-2026-0002", new Date()).children.length, 1);
  d.children[0].fact_learned = "изучила https://sample.com";
  assert.ok(validateDraft(d, 0)["child-0-fact_learned"]);
  assert.ok(validateDraft({ ...d, ready_by: "2026-02-30" }, 2).ready_by);
  assert.equal(earliestDate(new Date("2026-12-31T22:05:00Z")), "2027-01-03");
});
test("orders accept ages from one through twelve and save them as numbers", () => {
  const d = draft();
  d.children[0].age = "1";
  d.children[1].age = "12";
  assert.deepEqual(validateDraft(d, 0), {});
  const order = orderFromDraft(d, "DM-2026-0001", new Date());
  assert.deepEqual(order.children.map(child => child.age), [1, 12]);
  assert.equal(order.child.age, 1);

  for (const age of ["", "0", "13", "1.5"]) {
    d.children[0].age = age;
    assert.ok(validateDraft(d, 0)["child-0-age"]);
  }
});
test("contact numbers preserve free-form input and WhatsApp links use valid digits", () => {
  const d = draft();
  for (const phone of ["050-12", "+1 (202) 555-0147", "WhatsApp: abc"]) {
    d.whatsapp = `  ${phone}  `;
    assert.deepEqual(validateDraft(d, 2), {});
    assert.equal(orderFromDraft(d, "DM-2026-0001", new Date()).parent.whatsapp, phone);
  }
  assert.ok(validateDraft({ ...d, whatsapp: "   " }, 2).whatsapp);
  assert.equal(whatsappContactDigits("050-123-4567"), "972501234567");
  assert.equal(whatsappContactDigits("+972501234567"), "972501234567");
  assert.equal(whatsappContactDigits("+1 (202) 555-0147"), "12025550147");
  assert.equal(whatsappContactDigits("050-12"), "");
});
test("cropping preserves the selected edge and uses the family landscape frame", () => {
  assert.deepEqual(cropFrame(100, 80, 0, 100), { width: 80, height: 80, left: 20, top: 0, ratio: 1, cropped: true });
  assert.equal(cropFrame(120, 160, 3, 100).top, 80);
  assert.equal(cropFrame(120, 160, 0, 50).cropped, false);
});
test("a failed upload leaves no order; concurrent retries produce one complete private folder and ZIP", async t => {
  const root = await mkdtemp(path.join(tmpdir(), "greeting-test-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const store = orderStore(root), key = randomUUID();
  const png = await sharp({ create: { width: 150, height: 200, channels: 3, background: "#775544" } }).png().toBuffer();
  await assert.rejects(decodePhoto(Buffer.from("text file in disguise")), /JPG/);
  await assert.rejects(store.create(draft(), key, [png, png, Buffer.from("bad"), png], []));
  assert.equal((await store.list()).length, 0);
  const [first, retry] = await Promise.all([1, 2].map(() => store.create(draft(), key, [png,png,png,png], [50,50,50,100])));
  assert.equal(first.order_id, retry.order_id);
  const folder = path.join(root, "orders", first.order_id);
  assert.deepEqual((await readdir(folder)).sort(), ["order.json","photo1.jpg","photo2.jpg","photo3.jpg","photo4.jpg"]);
  assert.equal((await sharp(await readFile(path.join(folder, "photo4.jpg"))).metadata()).height, 100);
  await store.update(first.order_id, { payment_reported: "Bit" });
  assert.equal((await store.read(first.order_id)).status, "new");
  const archive = zipFiles([["order.json", await readFile(path.join(folder, "order.json"))]]);
  assert.equal(archive.readUInt32LE(0), 0x04034b50); assert.equal(archive.readUInt32LE(archive.length-22), 0x06054b50);
  await assert.rejects(store.photo(first.order_id, "../order.json"), /не найдено/);
});

test("Telegram setup recognizes matching group messages and channel posts", async t => {
  const root = await mkdtemp(path.join(tmpdir(), "greeting-telegram-config-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  assert.equal(await loadTelegramSettings(root), null);
  await saveTelegramSettings(root, testBotSettings);
  assert.deepEqual(await loadTelegramSettings(root), testBotSettings);
  await assert.rejects(saveTelegramSettings(root, { ...testBotSettings, chatId: "234567890" }), /Настройки Telegram/);
  assert.deepEqual(await loadTelegramSettings(root), testBotSettings);

  const command = "/dm_connect@example_bot example-code";
  const update = { message: {
    text: command,
    chat: { id: Number(testBotSettings.chatId), type: "supergroup", title: "Проверочная группа" },
    is_topic_message: true,
    message_thread_id: testBotSettings.threadId,
  } };
  assert.deepEqual(setupChats([
    { message: { ...update.message, chat: { id: 1, type: "private" } } },
    { message: { ...update.message, text: "/dm_connect@example_bot old-code" } },
    update,
    update,
  ], command), [{ chatId: testBotSettings.chatId, threadId: 15, title: "Проверочная группа" }]);

  const channel = { id: -1009876543210, type: "channel", title: "Проверочный канал" };
  const post = { channel_post: { chat: channel, text: command } };
  assert.deepEqual(setupChats([post], "/dm_connect@example_bot old-code"), []);
  assert.deepEqual(setupChats([post], command), [
    { chatId: String(channel.id), threadId: undefined, title: channel.title },
  ]);
});

test("saved orders queue a Telegram notice, retry after a failure and send once after a confirmed response", async t => {
  const root = await mkdtemp(path.join(tmpdir(), "greeting-telegram-orders-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const png = await sharp({ create: { width: 150, height: 200, channels: 3, background: "#775544" } }).png().toBuffer();
  const photos = [png, png, png, png];
  const older = await orderStore(root).create(draft(), randomUUID(), photos, []);
  const store = orderStore(root, { telegramNotifications: true });
  const key = randomUUID();
  await assert.rejects(store.create(draft(), key, [png, png, Buffer.from("bad"), png], []));
  assert.equal((await store.list()).length, 1);
  const [order, replay] = await Promise.all([1, 2].map(() => store.create(draft(), key, photos, [])));
  assert.equal(order.order_id, replay.order_id);
  assert.equal(order.telegram_notification.attempts, 0);
  assert.equal((await store.read(older.order_id)).telegram_notification, undefined);

  let now = Date.now() + 1000;
  const sent = [];
  const request = async (url, options) => {
    assert.equal(new URL(url).hostname, "api.telegram.org");
    assert.ok(url.endsWith("/sendMessage"));
    sent.push(JSON.parse(options.body));
    if (sent.length === 1) return Response.json({
      ok: false, error_code: 429, parameters: { retry_after: 65 },
    }, { status: 429 });
    return Response.json({ ok: true, result: { message_id: 34, chat: { id: Number(testBotSettings.chatId) } } });
  };
  const options = { request, clock: () => now, log: () => {} };
  const notify = createTelegramOrderNotifier(store, testBotSettings, options);
  await Promise.all([notify(), notify(), notify()]);
  assert.equal(sent.length, 1);
  assert.deepEqual((await store.read(order.order_id)).telegram_notification, { attempts: 1, nextAttemptAt: now + 65000 });
  const notifyAfterRestart = createTelegramOrderNotifier(orderStore(root), testBotSettings, options);
  await notifyAfterRestart();
  assert.equal(sent.length, 1);
  now += 65000;
  await Promise.all([notifyAfterRestart(), notifyAfterRestart()]);
  assert.equal(sent.length, 2);
  assert.equal((await store.read(order.order_id)).telegram_notification.messageId, 34);
  assert.equal(sent[1].chat_id, testBotSettings.chatId);
  assert.equal(sent[1].message_thread_id, testBotSettings.threadId);
  assert.ok(sent[1].text.includes(order.order_id));
  assert.ok(!sent[1].text.includes(older.order_id));
  for (const privateValue of [order.parent.whatsapp, order.parent.name, order.children[0].name, order.parents_words, "photo1.jpg"]) {
    assert.ok(!sent[1].text.includes(privateValue));
  }
  await notifyAfterRestart();
  assert.equal(sent.length, 2);
});
