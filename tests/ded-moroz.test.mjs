import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { allDraftIssues, cities, newChild, newDraft, orderFromDraft, orderPhotos, photoIssue, photoSlots, validateDraft, whatsappContactDigits } from "../shared/ded-moroz.ts";
import { decodePhoto, orderStore, zipFiles } from "../scripts/ded-moroz-files.mjs";
import { createTelegramOrderNotifier, loadTelegramSettings, saveTelegramSettings, setupChats } from "../scripts/ded-moroz-telegram.mjs";
import { formatOrderNotice } from "../shared/ded-moroz-telegram.js";

const testBotSettings = { token: "123456789:" + "x".repeat(35), chatId: "-1001234567890", threadId: 15 };
const draft = (count = 2) => ({
  ...newDraft(), children_count: count, children: ["соня", "миша", "лаша", "лиза", "инна"].slice(0,count).map((name,i) => ({
    ...newChild(), name, stress: i === 4 ? 0 : 1, gender: i % 2 ? "boy" : "girl", age: i ? "14" : "1",
    fact_learned: "научилась плавать в море", fact_kind: "помогает бабушке по дому",
  })), city: "Ноф-ха-Галиль", shared_fact: "Помогали бабушке весь год",
  parentName: "Анна", whatsapp: "050-123-4567", consent: true,
});
async function pictures(count) {
  const make = (width, height) => sharp({ create: { width, height, channels: 3, background: "#775544" } }).png().toBuffer();
  const [portrait, family] = await Promise.all([make(800,920), make(1024,800)]);
  return photoSlots(draft(count).children).map(s => s.kind === "family" ? family : portrait);
}
test("the quiz uses the selected template for every family size", () => {
  assert.ok(validateDraft(newDraft(),0).count);
  for (const count of [1,2,3,4,5]) {
    const d = draft(count);
    assert.deepEqual(allDraftIssues(d), {});
    const order = orderFromDraft(d, "DM-2026-0001", new Date());
    assert.equal(order.children_count, count);
    assert.equal(order.children[0].name_stress, "СОня");
    assert.equal(order.shared_fact, count === 3 ? d.shared_fact : "");
    assert.deepEqual(order.children.map(c => c.facts.length), Array(count).fill(count === 1 ? 2 : count === 2 ? 1 : 0));
    assert.equal(orderPhotos(order).length, count === 1 ? 3 : count + 1);
    assert.equal(order.parent.whatsapp, "+972501234567");
    assert.equal(Object.hasOwn(order,"ready_by"),false);
    assert.equal(Object.hasOwn(order,"parents_words"),false);
  }
  const five = draft(5);
  const six = { ...five, children_count: 6, children: [...five.children, newChild()] };
  assert.equal(allDraftIssues(six).count, "Выберите от одного до пяти детей.");
});
test("each child needs explicit stress, valid age and a distinct spoken name", () => {
  const d = draft(); d.children[0].stress = -1;
  assert.ok(validateDraft(d,1)["child-0-stress"]);
  d.children[0].name = d.children[1].name = "Саша"; d.children[0].stress = d.children[1].stress = 1;
  assert.ok(validateDraft(d,1)["child-0-distinction"]);
  d.children[0].distinction = "старший"; d.children[1].distinction = "младший";
  assert.deepEqual(validateDraft(d,1),{});
  assert.equal(orderFromDraft(d,"DM-2026-0001",new Date()).children[0].name_stress, "САша старший");
  for (const age of ["0", "15", "18", "42"]) {
    d.children[0].age = age;
    assert.equal(validateDraft(d,1)["child-0-age"], undefined);
    assert.equal(orderFromDraft(d,"DM-2026-0001",new Date()).children[0].age, Number(age));
  }
  for (const age of ["", "-1", "1.5", "3e1", "9007199254740992"]) {
    d.children[0].age = age; assert.ok(validateDraft(d,1)["child-0-age"]);
  }
  assert.ok(validateDraft({...d,whatsapp:"050-12"},4).whatsapp);
  assert.equal(whatsappContactDigits("+1 (202) 555-0147"), "12025550147");
});
test("individual facts accept free text and require a nonempty answer", () => {
  const d = draft(1);
  const child = d.children[0];
  child.fact_learned = "Баскетбол";
  child.fact_kind = "С папой путешествует по разным местам.\nБольше всего понравилось в תל אביב! ❤️";
  assert.deepEqual(allDraftIssues(d), {});
  assert.deepEqual(orderFromDraft(d, "DM-2026-0001", new Date()).children[0].facts, [child.fact_learned, child.fact_kind]);

  child.fact_learned = " \n ";
  child.fact_kind = "";
  assert.deepEqual(Object.keys(validateDraft(d, 1)), ["child-0-fact_learned", "child-0-fact_kind"]);
});
test("the city list uses the current name and older drafts still submit", () => {
  const currentName = "Ноф-ха-Галиль";
  const formerOption = "Назарет-Иллит (Ноф-ха-Галиль)";
  assert.ok(cities.includes(currentName));
  assert.ok(!cities.includes(formerOption));

  const saved = { ...draft(), city: formerOption };
  assert.deepEqual(allDraftIssues(saved), {});
  assert.equal(orderFromDraft(saved, "DM-2026-0001", new Date()).city, currentName);
});
test("photos require the correct size and orientation, older archives retain their files", () => {
  assert.equal(photoIssue(799,1200,"portrait"),"Фото слишком маленькое, выберите другое");
  assert.ok(photoIssue(1000,800,"portrait")); assert.ok(photoIssue(800,800,"family"));
  assert.equal(photoIssue(800,800,"portrait"),""); assert.equal(photoIssue(1000,800,"family"),"");
  const legacy = { photos:{portrait:"photo1.jpg",activity:"photo2.jpg",drawing:"photo3.jpg",family:"photo4.jpg"} };
  assert.deepEqual(orderPhotos(legacy).map(s => s.file), Object.values(legacy.photos));
});
test("two- and four-child orders reach matching folders and survive a retry", async t => {
  const root = await mkdtemp(path.join(tmpdir(), "greeting-test-")); t.after(() => rm(root,{recursive:true,force:true}));
  const store = orderStore(root);
  await assert.rejects(decodePhoto(Buffer.from("text file in disguise")), /JPG/);
  for (const count of [2,4]) {
    const d = draft(count), key = randomUUID(), photos = await pictures(count);
    await assert.rejects(store.create(d,key,[...photos.slice(0,-1), Buffer.from("bad")]));
    const [first, retry] = await Promise.all([store.create(d,key,photos), store.create(d,key,photos)]);
    assert.equal(first.order_id,retry.order_id);
    const folder = path.join(root,"orders",first.order_id);
    const data = JSON.parse(await readFile(path.join(folder,"order.json"),"utf8"));
    const files = data.children.flatMap(c => c.photos).concat(data.family_photo);
    assert.equal(data.children_count,count);
    assert.equal("request_id" in data,false);
    assert.deepEqual((await readdir(folder)).sort(), ["order.json",...files].sort());
    assert.equal(data.children[0].facts.length, count === 2 ? 1 : 0);
    await store.update(first.order_id,{payment_reported:"Bit"}); await store.update(first.order_id,{status:"cancelled"});
    assert.equal((await store.read(first.order_id)).status,"cancelled");
    const archive=zipFiles([["order.json",await readFile(path.join(folder,"order.json"))]]);
    assert.equal(archive.readUInt32LE(0),0x04034b50); assert.equal(archive.readUInt32LE(archive.length-22),0x06054b50);
    await assert.rejects(store.photo(first.order_id,"../order.json"), /не найдено/);
  }
});

test("a free-form phone stays on one line in the group message", () => {
  const order = orderFromDraft(draft(), "DM-2026-0002", new Date());
  order.parent.whatsapp = "  +972\n  50-123-4567  ";
  assert.equal(formatOrderNotice(order).split("\n")[2], "Телефон: +972 50-123-4567");
  order.parent.whatsapp = "9".repeat(5000);
  assert.ok(formatOrderNotice(order).length < 4096);
  order.parent.whatsapp = "";
  assert.equal(formatOrderNotice(order).split("\n")[2], "Телефон: не указан");
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
  const photos = await pictures(2);
  const older = await orderStore(root).create(draft(), randomUUID(), photos);
  const store = orderStore(root, { telegramNotifications: true });
  const key = randomUUID();
  await assert.rejects(store.create(draft(), key, [photos[0], photos[1], Buffer.from("bad")]));
  assert.equal((await store.list()).length, 1);
  const [order, replay] = await Promise.all([1, 2].map(() => store.create(draft(), key, photos)));
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
  assert.equal(sent[1].text, [
    "Новый заказ на видеопоздравление",
    "Заказ " + order.order_id,
    "Телефон: " + order.parent.whatsapp,
    "Детей в заказе — 2",
    "Открыть кабинет: https://mishanya-show.com/admin/ded-moroz",
  ].join("\n"));
  assert.ok(!sent[1].text.includes(older.order_id));
  for (const privateValue of [order.parent.name, order.children[0].name, order.children[0].facts[0], "child1_1.jpg"]) {
    assert.ok(!sent[1].text.includes(privateValue));
  }
  await notifyAfterRestart();
  assert.equal(sent.length, 2);
});
