import assert from "node:assert/strict";
import test from "node:test";
import {
  addOneYearIso,
  buildLeadFields,
  buildLeadNote,
  decryptPayload,
  encryptPayload,
  normalizeIsraeliPhone,
  validateGiftPayload,
} from "../shared/gift-core.js";

const now = new Date("2026-07-12T12:00:00.000Z");

test("phone accepts exactly one Israeli mobile number", () => {
  assert.equal(normalizeIsraeliPhone("0501234567"), "+972501234567");
  assert.equal(normalizeIsraeliPhone("+972501234567"), "+972501234567");
  assert.equal(normalizeIsraeliPhone("050123456"), null);
  assert.equal(normalizeIsraeliPhone("05012345678"), null);
  assert.equal(normalizeIsraeliPhone("0401234567"), null);
});

test("two boys are accepted and the nearest birthday becomes primary", () => {
  const result = validateGiftPayload(
    {
      language: "ru",
      sourceCode: "banner-01",
      giftCode: "confetti",
      clientName: "Марина",
      city: "Хайфа",
      phone: "0501234567",
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

test("Hebrew form produces a Russian Bitrix note", () => {
  const result = validateGiftPayload(
    {
      language: "he",
      sourceCode: "banner-01",
      giftCode: "bubbles",
      clientName: "נועה",
      city: "חיפה",
      phone: "0501234567",
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
  assert.match(note, /Интерфейс анкеты: Иврит/);
  assert.match(note, /Подарок: Бесплатное шоу мыльных пузырей/);
  assert.match(note, /Ребёнок 1 - ближайший день рождения: девочка/);
  assert.match(note, /Лиды: 12/);
  assert.match(note, /Контакты: 34/);
  assert.match(note, /Имя клиента: נועה/);
});

test("lead is created in NEW with source and all event data in COMMENTS", () => {
  const result = validateGiftPayload(
    {
      language: "ru",
      sourceCode: "banner-01",
      giftCode: "discount-200",
      clientName: "Ирина",
      city: "Ашдод",
      phone: "0501234567",
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
  assert.match(fields.COMMENTS, /Скидка 200 ₪/);
  assert.equal("UF_CRM_1644332749977" in fields, false);
});

test("encrypted payload round-trips", async () => {
  const payload = { phone: "+972501234567", city: "Хайфа" };
  const encrypted = await encryptPayload(payload, "test-secret-value");
  assert.notEqual(encrypted, JSON.stringify(payload));
  assert.deepEqual(await decryptPayload(encrypted, "test-secret-value"), payload);
});
