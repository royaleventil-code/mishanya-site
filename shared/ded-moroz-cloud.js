import { orderFromDraft, orderPhotoPattern, orderPhotos } from "./ded-moroz.ts";
import { decryptPayload, encryptPayload, phoneHash } from "./gift-core.js";

const hour = 3_600_000;
const photoPartBytes = 192 * 1024;
const encoder = new TextEncoder();
const orderCodePattern = /^DM-(\d{4})-(\d{4,12})$/;
const storageKey = env => "ded-moroz:" + env.GIFT_DATA_SECRET;
const code = row => "DM-" + row.season_year + "-" + String(row.id).padStart(4, "0");
export const orderReceipt = row => ({ order_id: code(row), ...(row.ready_by ? { ready_by: row.ready_by } : {}) });
export function orderError(message, status = 400) {
  return Object.assign(new Error(message), { status });
}

export async function checkOrderLimit(env, ip, now = Date.now()) {
  if (!ip) return false;
  const windowStart = Math.floor(now / hour) * hour;
  const key = await phoneHash("order-ip:" + ip, storageKey(env));
  const row = await env.GIFT_DB.prepare(
    "INSERT INTO dm_order_limits (rate_key, window_start) VALUES (?, ?) " +
    "ON CONFLICT(rate_key, window_start) DO UPDATE SET attempts = attempts + 1 RETURNING attempts",
  ).bind(key, windowStart).first();
  return row?.attempts <= 10;
}

export function findOrderByRequest(env, key) {
  return env.GIFT_DB.prepare("SELECT id, season_year, ready_by, photo_prefix FROM dm_orders WHERE request_key = ?")
    .bind(key).first();
}

async function photoKey(env) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode("ded-moroz:photos:" + env.GIFT_DATA_SECRET));
  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, ["encrypt", "decrypt"]);
}

async function writePhoto(db, key, upload, name, file) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const algorithm = { name: "AES-GCM", iv, additionalData: encoder.encode(upload + "/" + name) };
  const encrypted = await crypto.subtle.encrypt(algorithm, key, await file.arrayBuffer());
  const bytes = new Blob([iv, encrypted]);
  const insert = db.prepare("INSERT INTO dm_order_photo_parts (upload_id, filename, part, content) VALUES (?, ?, ?, ?)");
  for (let offset = 0; offset < bytes.size; offset += photoPartBytes) {
    const part = await bytes.slice(offset, offset + photoPartBytes).arrayBuffer();
    await insert.bind(upload, name, offset / photoPartBytes, part).run();
  }
}

export async function saveOrder(env, draft, key, files, now = new Date()) {
  const existing = await findOrderByRequest(env, key);
  if (existing) return existing;

  const season = new Intl.DateTimeFormat("en", { year: "numeric", timeZone: "Asia/Jerusalem" }).format(now);
  const order = orderFromDraft(draft, "", now);
  const payload = await encryptPayload(order, storageKey(env));
  const db = env.GIFT_DB;
  const upload = crypto.randomUUID();
  const cipher = await photoKey(env);
  await db.prepare("INSERT INTO dm_photo_uploads (upload_id, expires_at) VALUES (?, ?)")
    .bind(upload, +now + 24 * hour).run();
  const forgetPending = db.prepare("DELETE FROM dm_photo_uploads WHERE upload_id = ? AND expires_at IS NOT NULL").bind(upload);
  try {
    const slots = orderPhotos(order);
    if (files.length !== slots.length) throw orderError("Проверьте комплект фотографий.");
    const saved = await Promise.allSettled(files.map((file, i) => writePhoto(db, cipher, upload, slots[i].file, file)));
    if (saved.some(result => result.status === "rejected")) throw orderError("Не удалось сохранить фотографии. Попробуйте ещё раз.", 503);
    // Only the winner for a request key publishes an order and keeps its photo upload.
    await db.batch([
      db.prepare(
        "INSERT INTO dm_orders (request_key, season_year, created_at, ready_by, child_count, payload_ciphertext, photo_prefix, telegram_next_at) " +
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(request_key) DO NOTHING",
      ).bind(key, season, now.toISOString(), "", order.children.length, payload, upload, +now),
      db.prepare(
        "UPDATE dm_photo_uploads SET expires_at = NULL WHERE upload_id = ? AND EXISTS (SELECT 1 FROM dm_orders WHERE photo_prefix = ?)",
      ).bind(upload, upload),
      forgetPending,
    ]);
  } catch (error) {
    // Safe even if the batch committed before its response was lost.
    await forgetPending.run().catch(() => {});
    const persisted = await findOrderByRequest(env, key).catch(() => null);
    if (persisted) return persisted;
    throw error;
  }
  const row = await findOrderByRequest(env, key);
  if (row) return row;
  throw orderError("Не удалось сохранить заказ. Попробуйте ещё раз.", 503);
}

export async function toOrder(env, row) {
  const stored = await decryptPayload(row.payload_ciphertext, storageKey(env));
  return { ...stored, order_id: code(row), status: row.status, video_url: row.video_url || undefined };
}

export async function listOrders(env) {
  const rows = await env.GIFT_DB.prepare("SELECT * FROM dm_orders ORDER BY id DESC").all();
  return Promise.all(rows.results.map(row => toOrder(env, row)));
}

export async function getOrder(env, codeValue) {
  const match = orderCodePattern.exec(codeValue);
  const row = match && await env.GIFT_DB.prepare("SELECT * FROM dm_orders WHERE id = ? AND season_year = ?")
    .bind(Number(match[2]), match[1]).first();
  if (!row || code(row) !== codeValue) throw orderError("Заказ не найден.", 404);
  return row;
}

export async function updateOrder(env, row, payload) {
  const updated = await env.GIFT_DB.prepare("UPDATE dm_orders SET status = ?, video_url = ? WHERE id = ? RETURNING *")
    .bind(payload.status, payload.video_url, row.id).first();
  if (!updated) throw orderError("Заказ не найден.", 404);
  return toOrder(env, updated);
}

export async function getOrderPhoto(env, row, name) {
  if (!orderPhotoPattern.test(name)) throw orderError("Фото не найдено.", 404);
  const select = env.GIFT_DB.prepare("SELECT content FROM dm_order_photo_parts WHERE upload_id = ? AND filename = ? AND part = ?");
  const parts = [];
  for (let part = 0; ; part++) {
    const rowPart = await select.bind(row.photo_prefix, name, part).first();
    if (!rowPart) break;
    const content = new Uint8Array(rowPart.content);
    parts.push(content);
    if (content.length < photoPartBytes) break;
  }
  if (!parts.length) throw orderError("Фото не найдено.", 404);
  const bytes = new Blob(parts);
  const iv = await bytes.slice(0, 12).arrayBuffer();
  const algorithm = { name: "AES-GCM", iv, additionalData: encoder.encode(row.photo_prefix + "/" + name) };
  return crypto.subtle.decrypt(algorithm, await photoKey(env), await bytes.slice(12).arrayBuffer());
}

export async function orderArchiveEntries(env, row) {
  const order = await toOrder(env, row);
  const files = await Promise.all(orderPhotos(order).map(async slot => {
    const photo = await getOrderPhoto(env, row, slot.file);
    return [slot.file, new Uint8Array(photo)];
  }));
  return [["order.json", new TextEncoder().encode(JSON.stringify(order, null, 2))], ...files];
}
