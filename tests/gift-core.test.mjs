import assert from "node:assert/strict";
import test from "node:test";
import {
  addOneYearIso,
  buildLeadFields,
  buildLeadNote,
  decryptPayload,
  encryptPayload,
  normalizeInternationalPhone,
  validateGiftPayload,
} from "../shared/gift-core.js";

const now = new Date("2026-07-12T12:00:00.000Z");

test("phone accepts valid Israeli and international numbers", () => {
  assert.equal(normalizeInternationalPhone("0502345678"), "+972502345678");
  assert.equal(normalizeInternationalPhone("+972502345678"), "+972502345678");
  assert.equal(normalizeInternationalPhone("+380501234567"), "+380501234567");
  assert.equal(normalizeInternationalPhone("+12015550123"), "+12015550123");
  assert.equal(normalizeInternationalPhone("050123456"), null);
  assert.equal(normalizeInternationalPhone("+38050123"), null);
});

test("two boys are accepted and the nearest birthday becomes primary", () => {
  const result = validateGiftPayload(
    {
      language: "ru",
      sourceCode: "banner-01",
      giftCode: "confetti",
      clientName: "Марина",
      city: "Хайфа",
      phone: "0502345678",
      children: [
        { gender: "boy", ageTurning: 8, birthdayDay: 20, birthdayMonth: 12 },
        { gender: "boy", ageTurning: 5, birthdayDay: 20, birthdayMonth: 8 },
      ],
    },
    now,
  );
  assert.equal(result.error, undefined);
  assert.equal(result.value.children.length, 2);
  assert.equal(result.value.children[0].gender, "boy");
  assert.equal(result.value.children[1].gender, "boy");
  assert.equal(result.value.primaryChildIndex, 1);
});

test("only the child outside the main lead fields is added to the note", () => {
  const result = validateGiftPayload(
    {
      language: "ru",
      sourceCode: "banner-01",
      giftCode: "confetti",
      clientName: "Марина",
      city: "Хайфа",
      phone: "0502345678",
      children: [
        { gender: "boy", ageTurning: 8, birthdayDay: 20, birthdayMonth: 12 },
        { gender: "girl", ageTurning: 5, birthdayDay: 20, birthdayMonth: 8 },
      ],
    },
    now,
  );
  const claim = {
    id: "claim-two-children",
    submittedAt: now.toISOString(),
    validUntil: addOneYearIso(now.toISOString()),
  };
  const fields = buildLeadFields(result.value, claim, "QR_PARTY_GIFT", {});

  assert.equal(result.value.primaryChildIndex, 1);
  assert.equal(fields.BIRTHDATE, "2026-08-20");
  assert.equal(fields.UF_CRM_1644327962757, 46);
  assert.match(
    fields.COMMENTS,
    /Второй ребёнок: мальчик; исполнится 8 лет; ближайший день рождения: 20\.12\.2026/,
  );
  assert.doesNotMatch(fields.COMMENTS, /20\.08\.2026/);
  assert.doesNotMatch(fields.COMMENTS, /исполнится 5 лет/);
});

test("age dropdown range is accepted from 1 through 100", () => {
  const payload = {
    language: "ru",
    sourceCode: "banner-01",
    giftCode: "confetti",
    clientName: "Тест",
    city: "Хайфа",
    phone: "0502345678",
    children: [{ gender: "boy", ageTurning: 100, birthdayDay: 20, birthdayMonth: 8 }],
  };

  assert.equal(validateGiftPayload(payload, now).error, undefined);
  assert.equal(
    validateGiftPayload(
      { ...payload, children: [{ ...payload.children[0], ageTurning: 101 }] },
      now,
    ).error,
    "invalid_child_age",
  );
});

test("Hebrew form produces a compact Russian Bitrix note without personal data", () => {
  const result = validateGiftPayload(
    {
      language: "he",
      sourceCode: "banner-01",
      giftCode: "bubbles",
      clientName: "נועה",
      city: "חיפה",
      phone: "0502345678",
      children: [{ gender: "girl", ageTurning: 6, birthdayDay: 25, birthdayMonth: 9 }],
    },
    now,
  );
  const claim = {
    id: "claim-test",
    submittedAt: now.toISOString(),
    validUntil: addOneYearIso(now.toISOString()),
  };
  const note = buildLeadNote(result.value, claim, { LEAD: [12], CONTACT: [34] });
  assert.match(note, /Дата анкеты:/);
  assert.match(note, /Подарок: Бесплатное шоу мыльных пузырей/);
  assert.match(note, /Лиды: 12/);
  assert.match(note, /Контакты: 34/);
  for (const hiddenValue of [
    "claim-test",
    "Интерфейс анкеты",
    "banner-01",
    "נועה",
    "חיפה",
    "+972502345678",
    "Ребёнок",
    "девочка",
    "Подарок предварительный",
    "Подарок закреплён",
  ]) {
    assert.equal(note.includes(hiddenValue), false);
  }
});

test("lead is created in NEW while one child stays only in lead fields", () => {
  const result = validateGiftPayload(
    {
      language: "ru",
      sourceCode: "banner-01",
      giftCode: "discount-200",
      clientName: "Ирина",
      city: "Ашдод",
      phone: "0502345678",
      children: [{ gender: "boy", ageTurning: 7, birthdayDay: 15, birthdayMonth: 10 }],
    },
    now,
  );
  const claim = {
    id: "claim-fields",
    submittedAt: now.toISOString(),
    validUntil: addOneYearIso(now.toISOString()),
  };
  const fields = buildLeadFields(result.value, claim, "QR_PARTY_GIFT", {});
  assert.equal(fields.STATUS_ID, "NEW");
  assert.equal(fields.SOURCE_ID, "QR_PARTY_GIFT");
  assert.equal(fields.UF_CRM_1644327962757, 44);
  assert.equal(fields.UF_CRM_1644329391894, 7);
  assert.deepEqual(fields.COMMENTS.split("\n").slice(1), [
    "",
    "Подарок: Скидка 200 ₪",
    "Действует до: 12.07.2027",
  ]);
  assert.equal(fields.COMMENTS.includes("Ирина"), false);
  assert.equal(fields.COMMENTS.includes("Ашдод"), false);
  assert.equal(fields.COMMENTS.includes("+972502345678"), false);
  assert.equal(fields.COMMENTS.includes("Ребёнок"), false);
  assert.equal(fields.COMMENTS.includes("мальчик"), false);
  assert.equal(fields.COMMENTS.includes("Совпадения по телефону"), false);
  assert.equal("UF_CRM_1644332749977" in fields, false);
});

test("encrypted payload round-trips", async () => {
  const payload = { phone: "+972502345678", city: "Хайфа" };
  const encrypted = await encryptPayload(payload, "test-secret-value");
  assert.notEqual(encrypted, JSON.stringify(payload));
  assert.deepEqual(await decryptPayload(encrypted, "test-secret-value"), payload);
});
