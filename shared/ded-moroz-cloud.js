import { orderCodePattern, orderEditConflict, orderFromDraft, orderPhotoPattern, orderPhotos, orderProgress, secondVideoPhoneIssue, secondVideoUnavailable, whatsappContactDigits } from "./ded-moroz.ts";
import { videoGreetingPrice } from "./ded-moroz-pricing.js";
import { decryptPayload, encryptPayload, phoneHash } from "./gift-core.js";

const hour = 3_600_000;
const photoPartBytes = 192 * 1024;
const encoder = new TextEncoder();
const storageKey = env => "ded-moroz:" + env.GIFT_DATA_SECRET;
const code = row => "DM-" + row.season_year + "-" + String(row.id).padStart(4, "0");
// Revisions share the order's original encryption identifier. Unchanged parts can be copied in D1.
const photoEncryptionId = upload => upload.split(":", 1)[0];
const photoContext = (upload, name) => encoder.encode(photoEncryptionId(upload) + "/" + name);
export const orderReceipt = row => ({
  order_id: code(row), amount_ils: row.amount_ils ?? videoGreetingPrice,
  ...(row.ready_by ? { ready_by: row.ready_by } : {}),
  ...(row.repeat_of ? { repeat_of: row.repeat_of } : {}),
});
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
  return env.GIFT_DB.prepare("SELECT id, season_year, ready_by, photo_prefix, amount_ils, repeat_of FROM dm_orders WHERE request_key = ?")
    .bind(key).first();
}

async function photoKey(env) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode("ded-moroz:photos:" + env.GIFT_DATA_SECRET));
  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, ["encrypt", "decrypt"]);
}

async function writePhoto(db, key, upload, name, file) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const algorithm = { name: "AES-GCM", iv, additionalData: photoContext(upload, name) };
  const encrypted = await crypto.subtle.encrypt(algorithm, key, await file.arrayBuffer());
  const bytes = new Blob([iv, encrypted]);
  const insert = db.prepare("INSERT INTO dm_order_photo_parts (upload_id, filename, part, content) VALUES (?, ?, ?, ?)");
  for (let offset = 0; offset < bytes.size; offset += photoPartBytes) {
    const part = await bytes.slice(offset, offset + photoPartBytes).arrayBuffer();
    await insert.bind(upload, name, offset / photoPartBytes, part).run();
  }
}

export async function saveOrder(env, draft, key, files, now = new Date(), repeatKey) {
  const existing = await findOrderByRequest(env, key);
  if (existing) return existing;

  const firstByCode = !!repeatKey && orderCodePattern.test(repeatKey);
  let first = null;
  if (firstByCode) {
    // Older confirmations have an order number but may no longer have their submission key.
    first = await getOrder(env, repeatKey).catch(error => {
      if (error.status === 404) return null;
      throw error;
    });
    if (first?.request_key.startsWith("staff:")) first = null;
    if (first && !first.repeat_of) {
      const order = await toOrder(env, first);
      if (whatsappContactDigits(order.parent.whatsapp) !== whatsappContactDigits(draft.whatsapp)) {
        throw orderError(secondVideoPhoneIssue);
      }
    }
  } else if (repeatKey) {
    first = await findOrderByRequest(env, repeatKey);
  }
  if (repeatKey && (!first || first.repeat_of)) throw orderError(secondVideoUnavailable, 409);
  const season = new Intl.DateTimeFormat("en", { year: "numeric", timeZone: "Asia/Jerusalem" }).format(now);
  const order = orderFromDraft(draft, "", now, first ? code(first) : undefined);
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
    // The unique request key and first-order reference also protect concurrent submissions.
    await db.batch([
      db.prepare(
        "INSERT INTO dm_orders (request_key, season_year, created_at, ready_by, child_count, payload_ciphertext, photo_prefix, telegram_next_at, payment_status, amount_ils, repeat_of) " +
        "SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? WHERE ? IS NULL OR EXISTS (SELECT 1 FROM dm_orders WHERE id = ?) " +
        "ON CONFLICT DO NOTHING",
      ).bind(
        key, season, now.toISOString(), "", order.children.length, payload, upload, +now,
        order.payment_status, order.amount_ils, order.repeat_of ?? null, first?.id ?? null, first?.id ?? null,
      ),
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
  if (first) throw orderError(secondVideoUnavailable, 409);
  throw orderError("Не удалось сохранить заказ. Попробуйте ещё раз.", 503);
}

export async function toOrder(env, row) {
  const stored = await decryptPayload(row.payload_ciphertext, storageKey(env));
  return { ...stored, ...orderReceipt(row), ...orderProgress(row.status, row.payment_status), video_url: row.video_url || undefined };
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
  const updated = await env.GIFT_DB.prepare(
    "UPDATE dm_orders SET status = COALESCE(?, CASE WHEN status = 'paid' THEN 'new' ELSE status END), " +
    "payment_status = COALESCE(?, CASE WHEN status = 'paid' THEN 'paid' ELSE payment_status END), " +
    "video_url = COALESCE(?, video_url) WHERE id = ? RETURNING *",
  ).bind(payload.status ?? null, payload.payment_status ?? null, payload.video_url ?? null, row.id).first();
  if (!updated) throw orderError("Заказ не найден.", 404);
  return toOrder(env, updated);
}

export async function orderEditSnapshot(env, row) {
  return {
    order: await toOrder(env, row),
    revision: await phoneHash("edit:" + row.payload_ciphertext, storageKey(env)),
  };
}

export async function saveOrderDetails(env, row, order, replacements) {
  const db = env.GIFT_DB;
  const payload = await encryptPayload(order, storageKey(env));
  const update = upload => db.prepare(
    "UPDATE dm_orders SET payload_ciphertext = ?, amount_ils = ?, child_count = ?, photo_prefix = ? " +
    "WHERE id = ? AND payload_ciphertext = ? AND photo_prefix = ? RETURNING *",
  ).bind(payload, order.amount_ils, order.children.length, upload, row.id, row.payload_ciphertext, row.photo_prefix);
  if (!replacements.size && order.children.length === row.child_count) {
    const saved = await update(row.photo_prefix).first();
    if (!saved) throw orderError(orderEditConflict, 409);
    return toOrder(env, saved);
  }

  const upload = photoEncryptionId(row.photo_prefix) + ":" + crypto.randomUUID();
  await db.prepare("INSERT INTO dm_photo_uploads (upload_id, expires_at) VALUES (?, ?)")
    .bind(upload, Date.now() + 24 * hour).run();
  const forgetPending = db.prepare("DELETE FROM dm_photo_uploads WHERE upload_id = ? AND expires_at IS NOT NULL").bind(upload);
  try {
    const cipher = await photoKey(env);
    const uploads = await Promise.allSettled(Array.from(replacements, ([name, file]) => writePhoto(db, cipher, upload, name, file)));
    if (uploads.some(result => result.status === "rejected")) throw orderError("Не удалось сохранить новые фотографии. Попробуйте ещё раз.", 503);
    const originals = orderPhotos(order).map(slot => slot.file).filter(file => !replacements.has(file));
    const keep = originals.length ? [db.prepare(
      "INSERT INTO dm_order_photo_parts (upload_id, filename, part, content) " +
      "SELECT ?, filename, part, content FROM dm_order_photo_parts WHERE upload_id = ? " +
      "AND filename IN (" + originals.map(() => "?").join(", ") + ")",
    ).bind(upload, row.photo_prefix, ...originals)] : [];
    const [saved] = await db.batch([
      update(upload),
      ...keep,
      db.prepare(
        "UPDATE dm_photo_uploads SET expires_at = NULL WHERE upload_id = ? AND EXISTS (SELECT 1 FROM dm_orders WHERE photo_prefix = ?)",
      ).bind(upload, upload),
      db.prepare(
        "DELETE FROM dm_photo_uploads WHERE upload_id = ? AND NOT EXISTS (SELECT 1 FROM dm_orders WHERE photo_prefix = ?)",
      ).bind(row.photo_prefix, row.photo_prefix),
    ]);
    if (!saved.results[0]) throw orderError(orderEditConflict, 409);
    return toOrder(env, saved.results[0]);
  } finally {
    // If the commit succeeded, the uploaded files have no expiry and are kept.
    await forgetPending.run().catch(() => {});
  }
}

export async function deleteOrder(env, row) {
  const db = env.GIFT_DB;
  await db.batch([
    db.prepare("DELETE FROM dm_photo_uploads WHERE upload_id = (SELECT photo_prefix FROM dm_orders WHERE id = ?)").bind(row.id),
    db.prepare("DELETE FROM dm_orders WHERE id = ?").bind(row.id),
  ]);
}

async function readOrderPhoto(env, row, name) {
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
  const algorithm = { name: "AES-GCM", iv, additionalData: photoContext(row.photo_prefix, name) };
  return crypto.subtle.decrypt(algorithm, await photoKey(env), await bytes.slice(12).arrayBuffer());
}

async function readCurrentPhotos(env, row, read) {
  try { return await read(row); }
  catch (error) {
    // The old set can be deleted while a download is in progress. Retry the entire read with a fresh snapshot.
    const current = await getOrder(env, code(row));
    if (current.photo_prefix === row.photo_prefix) throw error;
    return read(current);
  }
}

export async function getOrderPhoto(env, row, name) {
  if (!orderPhotoPattern.test(name)) throw orderError("Фото не найдено.", 404);
  return readCurrentPhotos(env, row, current => readOrderPhoto(env, current, name));
}

export function orderArchiveEntries(env, row) {
  return readCurrentPhotos(env, row, async current => {
    const order = await toOrder(env, current);
    const files = await Promise.all(orderPhotos(order).map(async slot => {
      const photo = await readOrderPhoto(env, current, slot.file);
      return [slot.file, new Uint8Array(photo)];
    }));
    return [["order.json", encoder.encode(JSON.stringify(order, null, 2))], ...files];
  });
}
