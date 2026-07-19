import { parsePhoneNumberFromString } from "libphonenumber-js/max";

export const GIFT_CODES = new Set(["discount-200", "confetti", "bubbles"]);
export const LANGUAGES = new Set(["ru", "he"]);
export const CHILD_GENDERS = new Set(["boy", "girl"]);
export const HOST_CODES = new Set([
  "mishanya",
  "artur-magician",
  "artur-mad-professor",
  "hanna",
  "ira",
  "zhenya",
  "leon",
  "unknown",
]);

const RESPONSIBLE_SERGEY = 3828;
const NEW_LEAD_STAGE = "NEW";
const BIRTHDAY_TYPE = 808;
const SELECTED_GIFT_FIELD = "UF_CRM_1784446465040";
const MAX_GIFT_CHILDREN = 8;
const SOURCE_NAME = "QR-код с праздника";
const GIFT_LABELS = {
  "discount-200": "Скидка 200 ₪",
  confetti: "Бесплатное конфетти",
  bubbles: "Бесплатное шоу мыльных пузырей",
};
const HOST_LABELS = {
  mishanya: "Мишаня",
  "artur-magician": "Артур Фокусник",
  "artur-mad-professor": "Артур Сумасшедший Профессор",
  hanna: "Ханна",
  ira: "Ира",
  zhenya: "Женя",
  leon: "Леон",
  unknown: "Не знаю, кто ведущий",
};
export function normalizeInternationalPhone(value) {
  const phoneNumber = parsePhoneNumberFromString(String(value || ""), "IL");
  return phoneNumber?.isValid() ? String(phoneNumber.number) : null;
}

export const normalizeIsraeliPhone = normalizeInternationalPhone;

export function sanitizeSource(value) {
  const clean = String(value || "party-qr").trim().toLowerCase();
  return /^[a-z0-9_-]{1,64}$/.test(clean) ? clean : "party-qr";
}

function isValidCalendarDate(year, month, day) {
  const candidate = new Date(Date.UTC(year, month - 1, day, 12));
  return candidate.getUTCMonth() === month - 1 && candidate.getUTCDate() === day;
}

function formatDate(year, month, day) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function nextBirthday(day, month, now = new Date()) {
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  for (let year = now.getUTCFullYear(); year <= now.getUTCFullYear() + 4; year += 1) {
    const safeDay = month === 2 && day === 29 && !isValidCalendarDate(year, month, day) ? 28 : day;
    if (!isValidCalendarDate(year, month, safeDay)) continue;
    const candidate = Date.UTC(year, month - 1, safeDay);
    if (candidate >= today) return formatDate(year, month, safeDay);
  }
  return null;
}

export function addOneYearIso(now) {
  const date = new Date(now);
  date.setUTCFullYear(date.getUTCFullYear() + 1);
  return date.toISOString();
}

export function validateGiftPayload(raw, now = new Date()) {
  if (!raw || typeof raw !== "object") return { error: "invalid_payload" };
  if (!LANGUAGES.has(raw.language)) return { error: "invalid_language" };
  if (!GIFT_CODES.has(raw.giftCode)) return { error: "invalid_gift" };

  const clientName = String(raw.clientName || "").trim();
  const city = String(raw.city || "").trim();
  const hostCode = String(raw.hostCode || "").trim();
  const phone = normalizeInternationalPhone(raw.phone);
  if (clientName.length < 2 || clientName.length > 120) return { error: "invalid_name" };
  if (city.length < 2 || city.length > 160) return { error: "invalid_city" };
  if (!HOST_CODES.has(hostCode)) return { error: "invalid_host" };
  if (!phone) return { error: "invalid_phone" };
  if (
    !Array.isArray(raw.children) ||
    raw.children.length < 1 ||
    raw.children.length > MAX_GIFT_CHILDREN
  ) {
    return { error: "invalid_children" };
  }

  const children = [];
  for (const item of raw.children) {
    const gender = item?.gender;
    const ageTurning = Number(item?.ageTurning);
    const birthdayDay = Number(item?.birthdayDay);
    const birthdayMonth = Number(item?.birthdayMonth);
    if (!CHILD_GENDERS.has(gender)) return { error: "invalid_child_gender" };
    if (!Number.isInteger(ageTurning) || ageTurning < 1 || ageTurning > 100) {
      return { error: "invalid_child_age" };
    }
    if (
      !Number.isInteger(birthdayDay) ||
      !Number.isInteger(birthdayMonth) ||
      birthdayMonth < 1 ||
      birthdayMonth > 12 ||
      birthdayDay < 1 ||
      birthdayDay > 31
    ) {
      return { error: "invalid_child_birthday" };
    }
    const birthday = nextBirthday(birthdayDay, birthdayMonth, now);
    if (!birthday) return { error: "invalid_child_birthday" };
    children.push({
      gender,
      ageTurning,
      birthdayDay,
      birthdayMonth,
      nextBirthday: birthday,
    });
  }

  const primaryChildIndex = children.reduce(
    (nearestIndex, child, index, list) =>
      child.nextBirthday < list[nearestIndex].nextBirthday ? index : nearestIndex,
    0,
  );

  return {
    value: {
      language: raw.language,
      sourceCode: sanitizeSource(raw.sourceCode),
      giftCode: raw.giftCode,
      clientName,
      city,
      hostCode,
      phone,
      children,
      primaryChildIndex,
      turnstileToken: String(raw.turnstileToken || ""),
    },
  };
}

function toBase64(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

async function payloadKey(secret, usages) {
  const encoder = new TextEncoder();
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(`gift-payload:${secret}`));
  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, usages);
}

export async function phoneHash(phone, secret) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(phone));
  return toBase64(new Uint8Array(signature));
}

export async function encryptPayload(payload, secret) {
  const encoder = new TextEncoder();
  const key = await payloadKey(secret, ["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(JSON.stringify(payload)),
  );
  return `${toBase64(iv)}.${toBase64(new Uint8Array(ciphertext))}`;
}

export async function decryptPayload(value, secret) {
  const [ivValue, ciphertextValue] = String(value || "").split(".");
  if (!ivValue || !ciphertextValue) throw new Error("invalid_encrypted_payload");
  const key = await payloadKey(secret, ["decrypt"]);
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromBase64(ivValue) },
    key,
    fromBase64(ciphertextValue),
  );
  return JSON.parse(new TextDecoder().decode(plaintext));
}

export async function readClaimByPhoneHash(db, hash) {
  return db
    .prepare(
      "SELECT id, phone_hash, gift_code, source_code, language, payload_ciphertext, submitted_at, valid_until, status, bitrix_lead_id, last_error FROM gift_claims WHERE phone_hash = ? LIMIT 1",
    )
    .bind(hash)
    .first();
}

export async function readClaimById(db, id) {
  return db
    .prepare(
      "SELECT id, phone_hash, gift_code, source_code, language, payload_ciphertext, submitted_at, valid_until, status, bitrix_lead_id, last_error FROM gift_claims WHERE id = ? LIMIT 1",
    )
    .bind(id)
    .first();
}

function dateLabel(isoDate) {
  const [year, month, day] = String(isoDate).slice(0, 10).split("-");
  return `${day}.${month}.${year}`;
}

function dateTimeLabel(isoDate) {
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Asia/Jerusalem",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(isoDate));
}

function yearsLabel(age) {
  const lastTwo = age % 100;
  if (lastTwo >= 11 && lastTwo <= 14) return "лет";
  const last = age % 10;
  if (last === 1) return "год";
  if (last >= 2 && last <= 4) return "года";
  return "лет";
}

function additionalChildLabel(child, index) {
  const gender = child.gender === "boy" ? "мальчик" : "девочка";
  const label =
    [
      "Второй ребёнок",
      "Третий ребёнок",
      "Четвёртый ребёнок",
      "Пятый ребёнок",
      "Шестой ребёнок",
      "Седьмой ребёнок",
      "Восьмой ребёнок",
    ][index] || `Ребёнок ${index + 2}`;
  return `${label}: ${gender}; исполнится ${child.ageTurning} ${yearsLabel(child.ageTurning)}; ближайший день рождения: ${dateLabel(child.nextBirthday)}`;
}

function duplicateLines(duplicates) {
  const leadIds = Array.isArray(duplicates?.LEAD) ? duplicates.LEAD.map(Number).filter(Boolean) : [];
  const contactIds = Array.isArray(duplicates?.CONTACT)
    ? duplicates.CONTACT.map(Number).filter(Boolean)
    : [];
  const companyIds = Array.isArray(duplicates?.COMPANY)
    ? duplicates.COMPANY.map(Number).filter(Boolean)
    : [];
  if (!leadIds.length && !contactIds.length && !companyIds.length) {
    return [];
  }
  const lines = ["Совпадения по телефону в CRM найдены - решение принимает менеджер:"];
  if (leadIds.length) lines.push(`Лиды: ${leadIds.join(", ")}`);
  if (contactIds.length) lines.push(`Контакты: ${contactIds.join(", ")}`);
  if (companyIds.length) lines.push(`Компании: ${companyIds.join(", ")}`);
  return lines;
}

export function buildLeadNote(payload, claim, duplicates = {}) {
  const sections = [
    [`Дата анкеты: ${dateTimeLabel(claim.submittedAt)}`],
    [
      `Подарок: ${GIFT_LABELS[payload.giftCode]}`,
      `Ведущий на празднике: ${HOST_LABELS[payload.hostCode]}`,
    ],
  ];

  if (payload.children.length > 1) {
    const additionalChildren = payload.children
      .filter((_child, index) => index !== payload.primaryChildIndex)
      .map((child, index) => additionalChildLabel(child, index));
    if (additionalChildren.length) sections.push(additionalChildren);
  }

  const duplicatesSection = duplicateLines(duplicates);
  if (duplicatesSection.length) sections.push(duplicatesSection);

  return sections.map((section) => section.join("\n")).join("\n\n");
}

export function subtractDaysIso(isoDate, days) {
  const date = new Date(`${isoDate}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || !Number.isInteger(days) || days < 0) {
    throw new Error("Invalid date offset");
  }
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

export function buildLeadFields(payload, claim, sourceId, duplicates = {}) {
  if (!sourceId) throw new Error("BITRIX_QR_SOURCE_ID is not configured");
  const primary = payload.children[payload.primaryChildIndex];
  return {
    TITLE: `${SOURCE_NAME} - ${payload.clientName}`,
    NAME: payload.clientName,
    PHONE: [{ VALUE: payload.phone, VALUE_TYPE: "MOBILE" }],
    ASSIGNED_BY_ID: RESPONSIBLE_SERGEY,
    STATUS_ID: NEW_LEAD_STAGE,
    SOURCE_ID: sourceId,
    ORIGINATOR_ID: "mishanya-gift",
    ORIGIN_ID: claim.id,
    UTM_SOURCE: "party-qr",
    UTM_MEDIUM: "qr",
    UTM_CAMPAIGN: payload.sourceCode,
    BIRTHDATE: primary.nextBirthday,
    UF_CRM_1649234588017: primary.nextBirthday,
    UF_CRM_1644332749977: subtractDaysIso(primary.nextBirthday, 45),
    UF_CRM_1644328015350: payload.city,
    UF_CRM_1644327962757: primary.gender === "boy" ? 44 : 46,
    UF_CRM_1644329391894: primary.ageTurning,
    UF_CRM_1666781395585: BIRTHDAY_TYPE,
    [SELECTED_GIFT_FIELD]: GIFT_LABELS[payload.giftCode],
    COMMENTS: buildLeadNote(payload, claim, duplicates),
  };
}

async function bitrixCall(env, method, params) {
  const configuredBase = String(env.BITRIX_WEBHOOK_URL || "").trim();
  if (!configuredBase) throw new Error("BITRIX_WEBHOOK_URL is not configured");
  const base = `${configuredBase.replace(/\/+$/, "")}/`;
  const response = await fetch(`${base}${method}.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Accept: "application/json",
    },
    body: JSON.stringify(params),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.error) {
    throw new Error(data.error_description || data.error || `Bitrix ${method} failed`);
  }
  return data.result;
}

async function findLeadByClaim(env, claimId) {
  const leads = await bitrixCall(env, "crm.lead.list", {
    order: { ID: "DESC" },
    filter: {
      "=ORIGINATOR_ID": "mishanya-gift",
      "=ORIGIN_ID": claimId,
    },
    select: ["ID"],
    start: 0,
  });
  return Array.isArray(leads) && leads[0]?.ID ? Number(leads[0].ID) : null;
}

export async function syncBitrix(payload, claim, env) {
  const sourceId = String(env.BITRIX_QR_SOURCE_ID || "").trim();
  if (!sourceId) throw new Error("BITRIX_QR_SOURCE_ID is not configured");
  const existingClaimLeadId = await findLeadByClaim(env, claim.id);
  if (existingClaimLeadId) return { status: "created", leadId: existingClaimLeadId };

  const duplicates = await bitrixCall(env, "crm.duplicate.findbycomm", {
    type: "PHONE",
    values: [payload.phone],
  });
  const leadId = Number(
    await bitrixCall(env, "crm.lead.add", {
      fields: buildLeadFields(payload, claim, sourceId, duplicates),
      params: { REGISTER_SONET_EVENT: "Y" },
    }),
  );
  if (!leadId) throw new Error("Bitrix returned an invalid lead id");
  return { status: "created", leadId };
}
