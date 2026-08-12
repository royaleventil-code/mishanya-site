import assert from "node:assert/strict";
import test from "node:test";
import {
  addOneYearIso,
  buildLeadFields,
  buildLeadNote,
  decryptPayload,
  encryptPayload,
  giftWaitUntilIso,
  subtractDaysIso,
  validateGiftPayload,
} from "../shared/gift-core.js";

const now = new Date("2026-07-12T12:00:00.000Z");

test("phone accepts any non-empty format without normalization", () => {
  const basePayload = {
    language: "ru",
    sourceCode: "party-qr",
    giftCode: "discount-200",
    clientName: "Марина",
    city: "Хайфа",
    hostCode: "mishanya",
    children: [{ gender: "boy", ageTurning: 8, birthdayDay: 20, birthdayMonth: 12 }],
  };

  for (const phone of ["050-12", "+380 (50) 123-45-67", "WhatsApp: abc"]) {
    const result = validateGiftPayload({ ...basePayload, phone: `  ${phone}  ` }, now);
    assert.equal(result.error, undefined);
    assert.equal(result.value.phone, phone);
  }

  assert.equal(validateGiftPayload({ ...basePayload, phone: "   " }, now).error, "invalid_phone");
});

test("new submissions accept only the 200 shekel discount", () => {
  const payload = {
    language: "ru",
    sourceCode: "party-qr",
    clientName: "Марина",
    city: "Хайфа",
    hostCode: "mishanya",
    phone: "0502345678",
    children: [{ gender: "boy", ageTurning: 8, birthdayDay: 1, birthdayMonth: 12 }],
  };

  assert.equal(validateGiftPayload({ ...payload, giftCode: "discount-200" }, now).error, undefined);
  assert.equal(validateGiftPayload({ ...payload, giftCode: "confetti" }, now).error, "invalid_gift");
  assert.equal(validateGiftPayload({ ...payload, giftCode: "bubbles" }, now).error, "invalid_gift");
});

test("two boys are accepted and the nearest birthday becomes primary", () => {
  const result = validateGiftPayload(
    {
      language: "ru",
      sourceCode: "banner-01",
      giftCode: "discount-200",
      clientName: "Марина",
      city: "Хайфа",
      hostCode: "mishanya",
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

test("up to eight children are accepted and every additional child is added to the note", () => {
  const payload = {
    language: "ru",
    sourceCode: "parent-5135",
    giftCode: "discount-200",
    clientName: "Анна",
    city: "Нетания",
    hostCode: "hanna",
    phone: "0502345678",
    children: [
      { gender: "boy", ageTurning: 8, birthdayDay: 20, birthdayMonth: 12 },
      { gender: "girl", ageTurning: 5, birthdayDay: 20, birthdayMonth: 8 },
      { gender: "boy", ageTurning: 3, birthdayDay: 25, birthdayMonth: 7 },
      { gender: "girl", ageTurning: 10, birthdayDay: 5, birthdayMonth: 1 },
    ],
  };
  const result = validateGiftPayload(payload, now);
  const claim = {
    id: "claim-four-children",
    submittedAt: now.toISOString(),
    validUntil: addOneYearIso(now.toISOString()),
  };
  const fields = buildLeadFields(result.value, claim, "QR_PARTY_GIFT", {});

  assert.equal(result.error, undefined);
  assert.equal(result.value.children.length, 4);
  assert.equal(result.value.primaryChildIndex, 2);
  assert.equal(fields.BIRTHDATE, "2026-07-25");
  assert.match(fields.COMMENTS, /Второй ребёнок: мальчик; исполнится 8 лет/);
  assert.match(fields.COMMENTS, /Третий ребёнок: девочка; исполнится 5 лет/);
  assert.match(fields.COMMENTS, /Четвёртый ребёнок: девочка; исполнится 10 лет/);
  assert.doesNotMatch(fields.COMMENTS, /исполнится 3 года/);

  const tooManyChildren = Array.from({ length: 9 }, () => payload.children[0]);
  assert.equal(
    validateGiftPayload({ ...payload, children: tooManyChildren }, now).error,
    "invalid_children",
  );
});

test("only the child outside the main lead fields is added to the note", () => {
  const result = validateGiftPayload(
    {
      language: "ru",
      sourceCode: "banner-01",
      giftCode: "discount-200",
      clientName: "Марина",
      city: "Хайфа",
      hostCode: "artur-magician",
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
  assert.equal(fields.UF_CRM_1644332749977, "2026-07-19");
  assert.equal(fields.UF_CRM_1644327962757, 46);
  assert.match(
    fields.COMMENTS,
    /Второй ребёнок: мальчик; исполнится 8 лет; ближайший день рождения: 20\.12\.2026/,
  );
  assert.doesNotMatch(fields.COMMENTS, /20\.08\.2026/);
  assert.doesNotMatch(fields.COMMENTS, /исполнится 5 лет/);
});

test("age selection is accepted from 1 through 10", () => {
  const payload = {
    language: "ru",
    sourceCode: "banner-01",
    giftCode: "discount-200",
    clientName: "Тест",
    city: "Хайфа",
    hostCode: "leon",
    phone: "0502345678",
    children: [{ gender: "boy", ageTurning: 10, birthdayDay: 1, birthdayMonth: 8 }],
  };

  assert.equal(validateGiftPayload(payload, now).error, undefined);
  assert.equal(
    validateGiftPayload(
      { ...payload, children: [{ ...payload.children[0], ageTurning: 11 }] },
      now,
    ).error,
    "invalid_child_age",
  );
});

test("name, city, and phone accept any non-empty Unicode text without length limits", () => {
  const longText = "שלום🙂Привет".repeat(5000);
  const result = validateGiftPayload(
    {
      language: "he",
      sourceCode: "party-qr",
      giftCode: "discount-200",
      clientName: longText,
      city: longText,
      hostCode: "unknown",
      phone: longText,
      children: [{ gender: "girl", ageTurning: 1, birthdayDay: 1, birthdayMonth: 1 }],
    },
    now,
  );

  assert.equal(result.error, undefined);
  assert.equal(result.value.clientName, longText);
  assert.equal(result.value.city, longText);
  assert.equal(result.value.phone, longText);
});

test("host selection is required and limited to the approved list", () => {
  const payload = {
    language: "ru",
    sourceCode: "banner-01",
    giftCode: "discount-200",
    clientName: "Тест",
    city: "Хайфа",
    phone: "0502345678",
    children: [{ gender: "boy", ageTurning: 7, birthdayDay: 20, birthdayMonth: 8 }],
  };

  assert.equal(validateGiftPayload(payload, now).error, "invalid_host");
  assert.equal(
    validateGiftPayload({ ...payload, hostCode: "other-host" }, now).error,
    "invalid_host",
  );
  assert.equal(validateGiftPayload({ ...payload, hostCode: "unknown" }, now).error, undefined);
});

test("wait until is 32 days before the nearest birthday across a year boundary", () => {
  assert.equal(giftWaitUntilIso("2027-01-10"), "2026-12-09");
});

test("wait until moves from Saturday to the following Sunday", () => {
  const waitUntil = giftWaitUntilIso("2026-08-19");

  assert.equal(subtractDaysIso("2026-08-19", 32), "2026-07-18");
  assert.equal(waitUntil, "2026-07-19");
  assert.notEqual(new Date(`${waitUntil}T00:00:00.000Z`).getUTCDay(), 6);
});

test("wait until always stays 30 to 35 days before birthday and never lands on Saturday", () => {
  const birthday = new Date("2026-01-01T00:00:00.000Z");

  for (let day = 0; day < 730; day += 1) {
    const birthdayIso = birthday.toISOString().slice(0, 10);
    const waitUntil = giftWaitUntilIso(birthdayIso);
    const waitUntilDate = new Date(`${waitUntil}T00:00:00.000Z`);
    const daysBefore = Math.round((birthday.getTime() - waitUntilDate.getTime()) / 86_400_000);

    assert.ok(daysBefore >= 30 && daysBefore <= 35, `${birthdayIso}: ${daysBefore} days`);
    assert.notEqual(waitUntilDate.getUTCDay(), 6, `${birthdayIso}: ${waitUntil}`);
    birthday.setUTCDate(birthday.getUTCDate() + 1);
  }
});

test("Hebrew form produces a compact Russian Bitrix note without personal data", () => {
  const result = validateGiftPayload(
    {
      language: "he",
      sourceCode: "banner-01",
      giftCode: "discount-200",
      clientName: "נועה",
      city: "חיפה",
      hostCode: "artur-mad-professor",
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
  assert.match(note, /Подарок: Скидка 200 ₪/);
  assert.match(note, /Ведущий на празднике: Артур Сумасшедший Профессор/);
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
      hostCode: "hanna",
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
  assert.deepEqual(fields.PHONE, [{ VALUE: "0502345678", VALUE_TYPE: "WORK" }]);
  assert.equal(fields.UF_CRM_1644327962757, 44);
  assert.equal(fields.UF_CRM_1644329391894, 7);
  assert.equal(fields.UF_CRM_1784446465040, "Скидка 200 ₪");
  assert.deepEqual(fields.COMMENTS.split("\n").slice(1), [
    "",
    "Подарок: Скидка 200 ₪",
    "Ведущий на празднике: Ханна",
  ]);
  assert.equal(fields.COMMENTS.includes("Действует до"), false);
  assert.equal(fields.COMMENTS.includes("Ирина"), false);
  assert.equal(fields.COMMENTS.includes("Ашдод"), false);
  assert.equal(fields.COMMENTS.includes("+972502345678"), false);
  assert.equal(fields.COMMENTS.includes("Ребёнок"), false);
  assert.equal(fields.COMMENTS.includes("мальчик"), false);
  assert.equal(fields.COMMENTS.includes("Совпадения по телефону"), false);
  assert.equal(fields.UF_CRM_1644332749977, "2026-09-13");
});

test("encrypted payload round-trips", async () => {
  const payload = { phone: "+972502345678", city: "Хайфа" };
  const encrypted = await encryptPayload(payload, "test-secret-value");
  assert.notEqual(encrypted, JSON.stringify(payload));
  assert.deepEqual(await decryptPayload(encrypted, "test-secret-value"), payload);
});
