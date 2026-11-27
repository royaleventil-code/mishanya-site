import { orderAccessRole, accessIssuer } from "../../../shared/ded-moroz-access.js";
import { allDraftIssues, maxPhotos, orderPhotoPattern, orderRequestKeyPattern, photoIssue, photoSlots, preparedPhotoLimit, readOrderPatch, readSecondVideoReference, secondVideoUnavailable } from "../../../shared/ded-moroz.ts";
import { orderZip } from "../../../shared/ded-moroz-zip.js";
import {
  checkOrderLimit, deleteOrder, findOrderByRequest, getOrder, getOrderPhoto, listOrders, orderArchiveEntries,
  orderError, orderReceipt, saveOrder, updateOrder,
} from "../../../shared/ded-moroz-cloud.js";

const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
const json = (data, status = 200) => Response.json(data, { status, headers });
const orderLimit = maxPhotos * preparedPhotoLimit + 128 * 1024;

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
    const issues = allDraftIssues(draft);
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

function jpegDimensions(bytes) {
  if (bytes[0] !== 255 || bytes[1] !== 216 || bytes.at(-2) !== 255 || bytes.at(-1) !== 217) return null;
  let at = 2;
  while (at + 8 < bytes.length && bytes[at] === 255) {
    while (bytes[at] === 255) at++;
    const marker = bytes[at++];
    const size = bytes[at] * 256 + bytes[at + 1];
    if (size < 2 || at + size > bytes.length || marker === 218) return null;
    if ([192, 193, 194].includes(marker) && size >= 8) {
      return { height: bytes[at + 3] * 256 + bytes[at + 4], width: bytes[at + 5] * 256 + bytes[at + 6] };
    }
    at += size;
  }
  return null;
}

async function readOrderPhotos(form, draft) {
  const files = [];
  for (const slot of photoSlots(draft.children)) {
    const file = form.get(slot.file);
    if (!file || typeof file === "string" || file.type !== "image/jpeg" ||
      file.size < 8 || file.size > preparedPhotoLimit) {
      throw orderError("Загрузите фотографию «" + slot.label + "».");
    }
    const size = jpegDimensions(new Uint8Array(await file.arrayBuffer()));
    if (!size) throw orderError("Не удалось прочитать фотографию. Выберите другой снимок.");
    const issue = photoIssue(size.width, size.height, slot.kind);
    if (issue) throw orderError(slot.label + ". " + issue);
    files.push(file);
  }
  return files;
}

async function postOrder(env, request, staff = false) {
  const form = await orderForm(request);
  const input = form.get("key");
  if (typeof input !== "string" || !orderRequestKeyPattern.test(input)) {
    throw orderError("Обновите страницу и повторите отправку.");
  }
  const key = (staff ? "staff:" : "") + input.toLowerCase();
  const previous = await findOrderByRequest(env, key);
  if (previous) return json(orderReceipt(previous));
  const repeat = form.get("repeatKey");
  const repeatKey = readSecondVideoReference(repeat);
  if (repeat !== null && (staff || !repeatKey)) {
    throw orderError(secondVideoUnavailable, 409);
  }
  const draft = readDraft(form.get("draft"));
  if (!staff) {
    if (!await verifyOrderToken(request, env.TURNSTILE_SECRET_KEY, form.get("turnstileToken")).catch(() => false)) {
      throw orderError("Пройдите проверку формы и отправьте заказ снова.");
    }
    if (!await checkOrderLimit(env, request.headers.get("CF-Connecting-IP"))) {
      throw orderError("Слишком много заявок с этого подключения. Попробуйте позже.", 429);
    }
  }
  const order = await saveOrder(env, draft, key, await readOrderPhotos(form, draft), undefined, repeatKey);
  return json(orderReceipt(order), 201);
}

async function staffAction(env, request, id, resource) {
  const role = await orderAccessRole(request, env);
  if (!role) {
    throw orderError("Войдите в кабинет под рабочей учётной записью.", 403);
  }
  if (!id && !resource && request.method === "GET") return json(await listOrders(env));
  if (id && request.method === "GET" && resource === "zip") {
    const row = await getOrder(env, id);
    const archive = orderZip(await orderArchiveEntries(env, row));
    return new Response(archive, { headers: {
      ...headers, "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="' + id + '.zip"',
    } });
  }
  if (id && request.method === "PATCH" && !resource) {
    const input = await limitedBody(request, 8192).json().catch(error => {
      if (error.status) throw error;
      throw orderError("Проверьте статус, оплату и ссылку.");
    });
    const patch = readOrderPatch(input);
    if (!patch) throw orderError("Проверьте статус, оплату и ссылку.");
    if (role === "service" && patch.payment_status !== undefined) {
      throw orderError("Отметка об оплате доступна сотрудникам кабинета.", 403);
    }
    const link = patch.video_url;
    if (link) {
      const url = URL.parse(link);
      if (!url || url.protocol !== "https:" || url.username || url.password) {
        throw orderError("Введите полную ссылку на видео, начинающуюся с https://.");
      }
    }
    return json(await updateOrder(env, await getOrder(env, id), patch));
  }
  if (role === "service") throw orderError("Эта операция недоступна скрипту.", 403);
  if (id && !resource && request.method === "DELETE") {
    await deleteOrder(env, await getOrder(env, id));
    return new Response(null, { status: 204, headers });
  }
  if (!id && !resource && request.method === "POST") return postOrder(env, request, true);
  if (id && request.method === "GET" && orderPhotoPattern.test(resource)) {
    const photo = await getOrderPhoto(env, await getOrder(env, id), resource);
    return new Response(photo, { headers: { ...headers, "Content-Type": "image/jpeg" } });
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
          "SELECT o.payload_ciphertext, o.telegram_sent_at, o.payment_status, o.amount_ils, o.repeat_of, l.attempts, u.expires_at, p.content " +
          "FROM dm_orders o, dm_order_limits l, dm_photo_uploads u, dm_order_photo_parts p LIMIT 0",
        ).all();
        return new Response(null, { status: 204, headers });
      }
    }
    if (section === "staff" && action === "orders") return await staffAction(env, request, id, resource);
    throw orderError("Маршрут не найден.", 404);
  } catch (error) {
    if (!error.status) console.error("Ded Moroz order request failed", error.name);
    return json({ error: error.status ? error.message : "Не удалось выполнить действие с заказом. Попробуйте ещё раз." }, error.status || 500);
  }
}
