import { canAccessOrders, accessIssuer } from "../../../shared/ded-moroz-access.js";
import { photoRoles, preparedPhotoLimit, statuses, validateDraft } from "../../../shared/ded-moroz.ts";
import { orderZip } from "../../../shared/ded-moroz-zip.js";
import {
  checkOrderLimit, findOrderByRequest, getOrder, getOrderPhoto, listOrders, orderArchiveEntries,
  orderError, orderPhotoPattern, orderReceipt, saveOrder, updateOrder,
} from "../../../shared/ded-moroz-cloud.js";

const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
const json = (data, status = 200) => Response.json(data, { status, headers });
const requestKeyPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const orderLimit = 4 * preparedPhotoLimit + 128 * 1024;

function limitedBody(request, limit) {
  if (Number(request.headers.get("Content-Length")) > limit) throw orderError("Данные заказа слишком большие.", 413);
  if (!request.body) throw orderError("Данные заказа не получены.");
  let total = 0;
  const guard = new TransformStream({
    transform(chunk, controller) {
      total += chunk.byteLength;
      if (total > limit) throw orderError("Данные заказа слишком большие.", 413);
      controller.enqueue(chunk);
    },
  });
  return new Response(request.body.pipeThrough(guard), { headers: request.headers });
}

async function orderForm(request) {
  try {
    return await limitedBody(request, orderLimit).formData();
  } catch (error) {
    if (error.status) throw error;
    throw orderError("Не удалось прочитать форму заказа.");
  }
}

function readDraft(value) {
  try {
    if (typeof value !== "string" || value.length > 32_768) throw new Error();
    const draft = JSON.parse(value);
    if (!Array.isArray(draft?.children)) throw new Error();
    const issues = Object.assign(validateDraft(draft, 0), validateDraft(draft, 2));
    const error = Object.values(issues)[0];
    if (error) throw orderError(error);
    return draft;
  } catch (error) {
    if (error.status) throw error;
    throw orderError("Проверьте поля анкеты.");
  }
}

async function verifyOrderToken(request, secret, token) {
  if (typeof token !== "string" || !token || token.length > 2048) return false;
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: new URLSearchParams({
      secret,
      response: token,
      remoteip: request.headers.get("CF-Connecting-IP") || "",
    }),
    signal: AbortSignal.timeout(6000),
  });
  if (!response.ok) return false;
  const value = await response.json();
  return value.success === true && value.action === "ded_moroz_order" &&
    value.hostname === new URL(request.url).hostname;
}

async function readOrderPhotos(form) {
  const files = [];
  for (const role of photoRoles) {
    const file = form.get(role);
    if (!file || typeof file === "string" || file.type !== "image/jpeg" ||
      file.size < 8 || file.size > preparedPhotoLimit) {
      throw orderError("Нужны четыре фотографии. Перезагрузите выбранные снимки.");
    }
    const start = new Uint8Array(await file.slice(0, 3).arrayBuffer());
    const end = new Uint8Array(await file.slice(-2).arrayBuffer());
    if (start[0] !== 255 || start[1] !== 216 || start[2] !== 255 || end[0] !== 255 || end[1] !== 217) {
      throw orderError("Не удалось прочитать фотографию. Выберите другой снимок.");
    }
    files.push(file);
  }
  return files;
}

async function postOrder(env, request) {
  const form = await orderForm(request);
  const input = form.get("key");
  if (typeof input !== "string" || !requestKeyPattern.test(input)) {
    throw orderError("Обновите страницу и повторите отправку.");
  }
  const key = input.toLowerCase();
  const previous = await findOrderByRequest(env, key);
  if (previous) return json(orderReceipt(previous));
  const draft = readDraft(form.get("draft"));
  if (!await verifyOrderToken(request, env.TURNSTILE_SECRET_KEY, form.get("turnstileToken")).catch(() => false)) {
    throw orderError("Пройдите проверку формы и отправьте заказ снова.");
  }
  if (!await checkOrderLimit(env, request.headers.get("CF-Connecting-IP"))) {
    throw orderError("Слишком много заявок с этого подключения. Попробуйте позже.", 429);
  }
  const order = await saveOrder(env, draft, key, await readOrderPhotos(form));
  return json(orderReceipt(order), 201);
}

async function staffAction(env, request, id, resource) {
  if (!await canAccessOrders(request, env)) {
    throw orderError("Войдите в кабинет под рабочей учётной записью.", 403);
  }
  if (!id && request.method === "GET") return json(await listOrders(env));
  const row = await getOrder(env, id);
  if (request.method === "GET" && orderPhotoPattern.test(resource)) {
    const photo = await getOrderPhoto(env, row, resource);
    return new Response(photo, { headers: { ...headers, "Content-Type": "image/jpeg" } });
  }
  if (request.method === "GET" && resource === "zip") {
    const archive = orderZip(await orderArchiveEntries(env, row));
    return new Response(archive, { headers: {
      ...headers, "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="' + id + '.zip"',
    } });
  }
  if (request.method === "PATCH" && !resource) {
    const payload = await limitedBody(request, 8192).json().catch(error => {
      if (error.status) throw error;
      throw orderError("Проверьте статус и ссылку.");
    });
    if (!Object.hasOwn(statuses, payload?.status) || typeof payload?.video_url !== "string") {
      throw orderError("Проверьте статус и ссылку.");
    }
    const link = payload.video_url.trim();
    const url = URL.parse(link);
    if (link && (!url || url.protocol !== "https:" || url.username || url.password)) {
      throw orderError("Введите полную ссылку на видео, начинающуюся с https://.");
    }
    return json(await updateOrder(env, row, { status: payload.status, video_url: link }));
  }
  throw orderError("Маршрут не найден.", 404);
}

export async function onRequest({ request, env }) {
  try {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin");
    if (request.headers.get("Sec-Fetch-Site") === "cross-site" || (origin && origin !== url.origin)) {
      throw orderError("Откройте форму на сайте.", 403);
    }
    const [, , , section, action, id, resource, ...extra] = url.pathname.split("/");
    if (extra.length) throw orderError("Маршрут не найден.", 404);
    if (!env.GIFT_DB || !env.GIFT_DATA_SECRET) {
      throw orderError("Сервис заказов временно недоступен.", 503);
    }
    if (section === "orders" && !action) {
      if (!env.TURNSTILE_SECRET_KEY || !accessIssuer(env) || !env.DM_ACCESS_AUD) {
        throw orderError("Приём заказов временно недоступен. Напишите нам в WhatsApp.", 503);
      }
      if (request.method === "POST") return await postOrder(env, request);
      if (request.method === "HEAD") {
        // Check the deployed schema without reading or creating a customer's order.
        await env.GIFT_DB.prepare(
          "SELECT o.payload_ciphertext, o.telegram_sent_at, l.attempts, u.expires_at, p.content " +
          "FROM dm_orders o, dm_order_limits l, dm_photo_uploads u, dm_order_photo_parts p LIMIT 0",
        ).all();
        return new Response(null, { status: 204, headers });
      }
    }
    if (section === "staff" && action === "orders") return await staffAction(env, request, id, resource);
    throw orderError("Маршрут не найден.", 404);
  } catch (error) {
    if (!error.status) console.error("Ded Moroz order request failed", error.name);
    return json({ error: error.status ? error.message : "Не удалось сохранить или открыть заказ. Попробуйте ещё раз." }, error.status || 500);
  }
}
