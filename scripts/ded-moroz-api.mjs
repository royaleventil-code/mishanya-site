import { decodePhoto, orderPattern, problem, zipFiles } from "./ded-moroz-files.mjs";
import { allDraftIssues, maxPhotos, orderPhotoPattern, orderPhotos, photoLimit, photoSlots, readOrderPatch, readSecondVideoReference, secondVideoUnavailable } from "../shared/ded-moroz.ts";

async function body(req, limit) {
  const parts = []; let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) throw problem("Файл слишком большой.", 413);
    parts.push(chunk);
  }
  return Buffer.concat(parts);
}
const sendJson = (res, status, value) => { res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" }); res.end(JSON.stringify(value)); };
const staffOrders = "/api/ded-moroz/staff/orders";
function parseJSON(value) {
  try { return JSON.parse(value); } catch { throw problem("Проверьте данные формы."); }
}
const publicOrder = order => {
  const copy = { ...order };
  delete copy.request_id;
  delete copy.telegram_notification;
  return copy;
};

export function greetingRequestHandler(store, servePage, notifyPendingOrders) {
  let cleanedAt = 0;
  return async (req, res) => {
    try {
      const host = req.headers.host || "";
      if (!/^(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(host)) throw problem("Доступ только с этого компьютера.", 403);
      const peer = req.socket?.remoteAddress;
      if (peer && !["::1", "127.0.0.1", "::ffff:127.0.0.1"].includes(peer)) throw problem("Доступ только с этого компьютера.", 403);
      const url = new URL(req.url, "http://" + host);
      if (!url.pathname.startsWith("/api/ded-moroz/")) {
        if (servePage) return await servePage(req, res, url.pathname);
        throw problem("Маршрут не найден.", 404);
      }
      res.setHeader("Cache-Control", "no-store");
      res.setHeader("X-Content-Type-Options", "nosniff");
      if (req.headers["sec-fetch-site"] === "cross-site" || (req.headers.origin && req.headers.origin !== url.origin)) throw problem("Откройте локальную страницу заказа.", 403);
      if (Date.now() - cleanedAt >= 86400000) {
        await store.clean();
        cleanedAt = Date.now();
      }
      const route = url.pathname.replace(staffOrders, "/api/ded-moroz/orders");
      const [, , , action, id, sub] = route.split("/");
      if (req.method === "GET" && action === "ping") return sendJson(res, 200, { service: "mishanya-ded-moroz" });
      if (req.method === "POST" && action === "decode") {
        const jpg = await decodePhoto(await body(req, photoLimit));
        res.writeHead(200, { "Content-Type": "image/jpeg" }); return res.end(jpg);
      }
      if (action !== "orders") throw problem("Маршрут не найден.", 404);
      if (!id && req.method === "POST") {
        const bytes = await body(req, maxPhotos * photoLimit + 256 * 1024);
        let form;
        try { form = await new Response(bytes, { headers: { "Content-Type": req.headers["content-type"] || "" } }).formData(); }
        catch { throw problem("Не удалось прочитать форму заказа."); }
        const draft = parseJSON(form.get("draft"));
        const token = form.get("key");
        if (typeof token !== "string" || !/^[a-f\d-]{36}$/i.test(token)) throw problem("Обновите страницу и повторите отправку.");
        const staff = url.pathname === staffOrders;
        const repeat = form.get("repeatKey");
        const repeatKey = readSecondVideoReference(repeat);
        if (repeat !== null && (staff || !repeatKey)) throw problem(secondVideoUnavailable, 409);
        let issues;
        try { issues = allDraftIssues(draft); } catch { throw problem("Проверьте поля анкеты."); }
        if (Object.keys(issues).length) throw problem(Object.values(issues)[0]);
        const photos = [];
        for (const slot of photoSlots(draft.children)) {
          const file = form.get(slot.file);
          if (!file || typeof file === "string" || !file.size || file.size > photoLimit) throw problem("Загрузите фото «" + slot.label + "» до 15 МБ.");
          photos.push(Buffer.from(await file.arrayBuffer()));
        }
        const order = await store.create(draft, token, photos, { staff, repeatKey });
        void notifyPendingOrders?.();
        const { order_id, amount_ils, repeat_of } = order;
        return sendJson(res, 201, { order_id, amount_ils, repeat_of });
      }
      if (!id && req.method === "GET") return sendJson(res, 200, (await store.list()).map(publicOrder));
      if (!id || !orderPattern.test(id)) throw problem("Заказ не найден.", 404);
      if (req.method === "GET" && orderPhotoPattern.test(sub || "")) {
        const photo = await store.photo(id, sub); res.writeHead(200, { "Content-Type": "image/jpeg" }); return res.end(photo);
      }
      if (req.method === "GET" && sub === "zip") {
        const item = publicOrder(await store.read(id));
        const files = [["order.json", Buffer.from(JSON.stringify(item, null, 2))]];
        for (const slot of orderPhotos(item)) files.push([slot.file, await store.photo(id, slot.file)]);
        res.writeHead(200, { "Content-Type": "application/zip", "Content-Disposition": `attachment; filename="${id}.zip"` }); return res.end(zipFiles(files));
      }
      if (req.method === "POST" && sub === "payment") {
        const input = parseJSON(await body(req, 2048));
        if (!["Bit", "PayBox"].includes(input?.method)) throw problem("Выберите способ оплаты.");
        await store.update(id, { payment_reported: input.method }); return sendJson(res, 200, { ok: true });
      }
      if (req.method === "PATCH" && !sub) {
        const patch = readOrderPatch(parseJSON(await body(req, 8192)));
        if (!patch) throw problem("Проверьте статус, оплату и ссылку.");
        if (patch.payment_status !== undefined && url.pathname !== staffOrders + "/" + id) {
          throw problem("Отметка об оплате доступна в кабинете.", 403);
        }
        const video = patch.video_url;
        if (video && !URL.canParse(video)) throw problem("Введите полную ссылку на видео.");
        if (video && !["https:", "http:"].includes(new URL(video).protocol)) throw problem("Подойдёт ссылка http или https.");
        const order = await store.update(id, patch);
        return sendJson(res, 200, publicOrder(order));
      }
      if (req.method === "DELETE" && url.pathname === staffOrders + "/" + id) {
        await store.remove(id);
        res.writeHead(204);
        return res.end();
      }
      throw problem("Маршрут не найден.", 404);
    } catch (error) {
      if (!error.status) console.error("Local greeting preview:", error.message);
      if (!res.headersSent) sendJson(res, error.status || 500, { error: error.status ? error.message : "Не удалось сохранить изменения. Попробуйте ещё раз." });
    }
  };
}
