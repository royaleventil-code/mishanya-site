import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { copyFile, mkdir, mkdtemp, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { orderZip } from "../shared/ded-moroz-zip.js";
import sharp from "sharp";
import {
  orderCodePattern, orderEditConflict, orderEditIssues, orderEditPhotos, orderEditSlots, orderFromDraft, orderPhotoPattern,
  orderPhotos, orderProgress, orderRequestKeyPattern, orderWithEdits, photoIssue, photoLimit, photoSlots,
  secondVideoPhoneIssue, secondVideoUnavailable, whatsappContactDigits,
} from "../shared/ded-moroz.ts";
import { videoGreetingPrice } from "../shared/ded-moroz-pricing.js";

const run = promisify(execFile);
const imageOptions = { limitInputPixels: 65_000_000, failOn: "error" };
export const orderPattern = /^DM-\d{4}-\d{4,}$/;
export function problem(message, status = 400) { return Object.assign(new Error(message), { status }); }

async function convertHeic(dir) {
  const options = { cwd: dir, timeout: 30000, windowsHide: true };
  const args = ["input.heic", "photo.jpg"];
  try { await run("heif-convert", args, options); }
  catch (error) {
    if (error.code !== "ENOENT" || process.platform !== "win32") throw error;
    // A normal Windows shortcut may not inherit the Codex terminal's PATH.
    const { stdout } = await run("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command",
      "(Get-AppxPackage -Name 'OpenAI.CodexPrimaryRuntime*' | Sort-Object Version -Descending | Select-Object -First 1).InstallLocation"], options);
    const location = stdout.trim();
    if (!location) throw error;
    await run(path.join(location, "dependencies/native/libheif/libheif/bin/heif-convert.exe"), args, options);
  }
}
export async function decodePhoto(bytes) {
  if (!bytes.length || bytes.length > photoLimit) throw problem("Каждое фото должно быть не больше 15 МБ.");
  const heic = bytes.toString("ascii", 4, 8) === "ftyp" && /heic|heix|hevc|hevx|mif1|msf1/.test(bytes.toString("ascii", 8, 60)) && !/avif|avis/.test(bytes.toString("ascii", 8, 60));
  const jpg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  const png = bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (!(jpg || png || heic)) throw problem("Выберите файл JPG, PNG или HEIC.");
  const toJpeg = input => sharp(input, imageOptions).rotate().flatten({ background: "#ffffff" }).jpeg({ quality: 90 }).toBuffer();
  try { return await toJpeg(bytes); } catch {
    if (!heic) throw problem("Не удалось открыть фотографию. Попробуйте другой файл.");
  }
  const dir = await mkdtemp(path.join(tmpdir(), "mishanya-heic-"));
  try {
    await writeFile(path.join(dir, "input.heic"), bytes);
    await convertHeic(dir);
    const files = (await readdir(dir)).filter(name => /^photo(?:[-_]\d+)?\.jpg$/i.test(name)).sort();
    if (!files.length) throw new Error("No decoded frame");
    return await toJpeg(path.join(dir, files[0]));
  } catch { throw problem("Не удалось прочитать HEIC. Выберите другой снимок или версию в JPG."); }
  finally { await rm(dir, { recursive: true, force: true }); }
}

async function photoForSlot(input, slot) {
  const jpeg = await decodePhoto(input);
  const { width, height } = await sharp(jpeg).metadata();
  const issue = photoIssue(width, height, slot.kind);
  if (issue) throw problem(slot.label + ". " + issue);
  return jpeg;
}

export function orderStore(root, { telegramNotifications = false } = {}) {
  const orders = path.resolve(root, "orders");
  const stateDir = path.join(root, "order-state");
  const statePath = id => path.join(stateDir, id + ".json");
  let writes = Promise.resolve();
  const exclusive = fn => { const result = writes.then(fn); writes = result.catch(() => {}); return result; };
  const read = async id => {
    if (!orderPattern.test(id)) throw problem("Заказ не найден.", 404);
    try {
      const data = JSON.parse(await readFile(path.join(orders, id, "order.json"), "utf8"));
      const state = await readFile(statePath(id), "utf8").catch(error => {
        if (error.code === "ENOENT") return "{}";
        throw error;
      });
      const order = { ...data, ...JSON.parse(state) };
      return { ...order, amount_ils: order.amount_ils ?? videoGreetingPrice, ...orderProgress(order.status, order.payment_status) };
    }
    catch (error) { if (error.code === "ENOENT") throw problem("Заказ не найден.", 404); throw error; }
  };
  async function list() {
    await mkdir(orders, { recursive: true });
    const names = (await readdir(orders)).filter(name => orderPattern.test(name));
    return (await Promise.all(names.map(read))).sort((a,b) => b.created_at.localeCompare(a.created_at));
  }
  const create = (draft, token, photos, { staff = false, repeatKey } = {}) => exclusive(async () => {
    const records = await list();
    const requestId = (staff ? "staff:" : "") + token;
    const previous = records.find(item => item.request_id === requestId);
    if (previous) return previous;
    const firstByCode = !!repeatKey && orderCodePattern.test(repeatKey);
    const first = repeatKey && !staff
      ? records.find(item => firstByCode ? item.order_id === repeatKey : item.request_id === repeatKey)
      : undefined;
    if (repeatKey && (!first || first.repeat_of || first.request_id?.startsWith("staff:") ||
      records.some(item => item.repeat_of === first.order_id))) throw problem(secondVideoUnavailable, 409);
    if (firstByCode && first && whatsappContactDigits(first.parent.whatsapp) !== whatsappContactDigits(draft.whatsapp)) {
      throw problem(secondVideoPhoneIssue);
    }
    const now = new Date();
    if (!staff && records.filter(item => !item.request_id?.startsWith("staff:") && now.getTime() - Date.parse(item.created_at) < 3600000).length >= 5) throw problem("За час можно оформить до пяти заказов. Попробуйте позже.", 429);
    const year = new Intl.DateTimeFormat("en", { year: "numeric", timeZone: "Asia/Jerusalem" }).format(now);
    const prefix = "DM-" + year + "-";
    const counter = path.join(root, "sequence-" + year);
    const saved = await readFile(counter, "utf8").catch(error => { if (error.code === "ENOENT") return "0"; throw error; });
    const sequence = records.reduce((last, item) => item.order_id.startsWith(prefix) ? Math.max(last, Number(item.order_id.slice(prefix.length))) : last, Number(saved)) + 1;
    const id = prefix + String(sequence).padStart(4, "0");
    const stage = await mkdtemp(path.join(root, "pending-"));
    try {
      const slots = photoSlots(draft.children);
      if (photos.length !== slots.length) throw problem("Проверьте комплект фотографий.");
      for (const [i, slot] of slots.entries()) await writeFile(path.join(stage, slot.file), await photoForSlot(photos[i], slot));
      const order = orderFromDraft(draft, id, now, first?.order_id);
      const state = { request_id: requestId };
      if (telegramNotifications) state.telegram_notification = { attempts: 0, nextAttemptAt: now.getTime() };
      await writeFile(path.join(stage, "order.json"), JSON.stringify(order, null, 2));
      await mkdir(stateDir, { recursive: true });
      await writeFile(path.join(stage, "state"), JSON.stringify(state));
      const nextCounter = path.join(stage, "next-counter");
      await writeFile(nextCounter, String(sequence));
      await rename(nextCounter, counter);
      await rename(path.join(stage, "state"), statePath(id));
      await rename(stage, path.join(orders, id));
      return { ...order, ...state };
    } finally { await rm(stage, { recursive: true, force: true }); }
  });
  async function writeOrder(id, order, internal = false) {
    const { request_id, telegram_notification, ...publicData } = order;
    const file = internal ? statePath(id) : path.join(orders, id, "order.json");
    // A legacy order stores both in one file until it first changes.
    await mkdir(stateDir, { recursive: true });
    if (!internal) await writeFile(statePath(id), JSON.stringify({ request_id, telegram_notification }), { flag: "wx" }).catch(error => {
      if (error.code !== "EEXIST") throw error;
    });
    const temp = file + "." + randomUUID() + ".tmp";
    try {
      await writeFile(temp, JSON.stringify(internal ? { request_id, telegram_notification } : publicData, null, 2));
      await rename(temp, file);
    } finally { await rm(temp, { force: true }).catch(() => {}); }
    return order;
  }
  const update = (id, patch) => exclusive(async () =>
    writeOrder(id, { ...await read(id), ...patch }, Object.hasOwn(patch, "telegram_notification")),
  );
  function photoDir(id, revision) {
    const dir = path.resolve(orders, id);
    if (!orderPattern.test(id) || path.dirname(dir) !== orders) throw problem("Заказ не найден.", 404);
    if (!revision) return dir;
    const media = path.resolve(dir, "photos-" + revision);
    if (!orderRequestKeyPattern.test(revision) || path.dirname(media) !== dir) throw problem("Фото не найдено.", 404);
    return media;
  }
  const edit = (id, revision, draft, uploads) => exclusive(async () => {
    const order = await read(id);
    if (revision !== (order.edit_revision ?? "initial")) throw problem(orderEditConflict, 409);
    const [issue] = Object.values(orderEditIssues(order, draft));
    if (issue) throw problem(issue);
    const slots = orderEditSlots(order, draft);
    const replacements = new Map(slots.filter(slot => uploads.has(slot.file)).map(slot => [slot.file, uploads.get(slot.file)]));
    const { kept, missing } = orderEditPhotos(order, draft, new Set(replacements.keys()));
    if (missing.length) throw problem("Загрузите фотографию «" + missing[0].label + "».");
    const next = { ...orderWithEdits(order, draft, kept), edit_revision: randomUUID() };
    if (!replacements.size && draft.children.length === order.children.length) return writeOrder(id, next);

    const currentDir = photoDir(id, order.photo_revision);
    const stagedDir = photoDir(id, next.edit_revision);
    await mkdir(stagedDir);
    try {
      for (const slot of slots) {
        if (!kept.has(slot.file)) continue;
        const target = path.join(stagedDir, slot.file);
        if (replacements.has(slot.file)) await writeFile(target, await photoForSlot(replacements.get(slot.file), slot));
        else await copyFile(path.join(currentDir, slot.file), target);
      }
      // A single metadata rename publishes the whole set of photographs.
      next.photo_revision = next.edit_revision;
      await writeOrder(id, next);
    } catch (error) {
      await rm(stagedDir, { recursive: true, force: true }).catch(() => {});
      throw error;
    }
    if (order.photo_revision) {
      await rm(currentDir, { recursive: true, force: true }).catch(() => {});
    } else {
      for (const { file } of orderPhotos(order)) {
        if (orderPhotoPattern.test(file)) await rm(path.join(currentDir, file), { force: true }).catch(() => {});
      }
    }
    return next;
  });
  async function removeFiles(id) {
    const dir = path.resolve(orders, id);
    if (!orderPattern.test(id) || path.dirname(dir) !== orders) throw problem("Заказ не найден.", 404);
    await rm(dir, { recursive: true, force: true });
    await rm(statePath(id), { force: true });
  }
  const remove = id => exclusive(() => removeFiles(id));
  const clean = () => exclusive(async () => {
    const oldest = Date.now() - 60 * 86400000;
    for (const order of await list()) {
      if (Date.parse(order.created_at) < oldest && orderPattern.test(order.order_id)) {
        await removeFiles(order.order_id);
      }
    }
  });
  async function readPhoto(order, file) {
    if (!orderPhotoPattern.test(file)) throw problem("Фото не найдено.", 404);
    try { return await readFile(path.join(photoDir(order.order_id, order.photo_revision), file)); }
    catch (error) { if (error.code === "ENOENT") throw problem("Фото не найдено.", 404); throw error; }
  }
  const photo = (id, file) => exclusive(async () => readPhoto(await read(id), file));
  const archive = id => exclusive(async () => {
    const order = await read(id);
    const files = [];
    for (const slot of orderPhotos(order)) files.push([slot.file, await readPhoto(order, slot.file)]);
    return { order, files };
  });
  return { list: () => exclusive(list), create, update, edit, remove, clean, read, photo, archive };
}

export function zipFiles(entries) { return Buffer.from(orderZip(entries)); }
