import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, mkdtemp, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { orderZip } from "../shared/ded-moroz-zip.js";
import sharp from "sharp";
import { cropFrame, orderFromDraft, photoLimit } from "../shared/ded-moroz.ts";

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
  const toJpeg = input => sharp(input, imageOptions).rotate().flatten({ background: "#ffffff" })
    .resize({ width: 2560, height: 2560, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 90, mozjpeg: true }).toBuffer();
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

export function orderStore(root, { telegramNotifications = false } = {}) {
  const orders = path.join(root, "orders");
  let writes = Promise.resolve();
  const exclusive = fn => { const result = writes.then(fn); writes = result.catch(() => {}); return result; };
  const read = async id => {
    if (!orderPattern.test(id)) throw problem("Заказ не найден.", 404);
    try { return JSON.parse(await readFile(path.join(orders, id, "order.json"), "utf8")); }
    catch (error) { if (error.code === "ENOENT") throw problem("Заказ не найден.", 404); throw error; }
  };
  async function list() {
    await mkdir(orders, { recursive: true });
    const names = (await readdir(orders)).filter(name => orderPattern.test(name));
    return (await Promise.all(names.map(read))).sort((a,b) => b.created_at.localeCompare(a.created_at));
  }
  const create = (draft, token, photos, positions) => exclusive(async () => {
    const records = await list();
    const previous = records.find(item => item.request_id === token);
    if (previous) return previous;
    const now = new Date();
    if (records.filter(item => now.getTime() - Date.parse(item.created_at) < 3600000).length >= 5) throw problem("За час можно оформить до пяти заказов. Попробуйте позже.", 429);
    const year = new Intl.DateTimeFormat("en", { year: "numeric", timeZone: "Asia/Jerusalem" }).format(now);
    const prefix = "DM-" + year + "-";
    const counter = path.join(root, "sequence-" + year);
    const saved = await readFile(counter, "utf8").catch(error => { if (error.code === "ENOENT") return "0"; throw error; });
    const sequence = records.reduce((last, item) => item.order_id.startsWith(prefix) ? Math.max(last, Number(item.order_id.slice(prefix.length))) : last, Number(saved)) + 1;
    const id = prefix + String(sequence).padStart(4, "0");
    const stage = await mkdtemp(path.join(root, "pending-"));
    try {
      for (let i = 0; i < 4; i++) {
        const jpeg = await decodePhoto(photos[i]);
        const { width, height } = await sharp(jpeg).metadata();
        const { width: w, height: h, left, top } = cropFrame(width, height, i, positions[i]);
        await sharp(jpeg).extract({ left, top, width: w, height: h }).jpeg({ quality: 90 }).toFile(path.join(stage, `photo${i + 1}.jpg`));
      }
      const order = { ...orderFromDraft(draft, id, now), request_id: token };
      if (telegramNotifications) order.telegram_notification = { attempts: 0, nextAttemptAt: now.getTime() };
      await writeFile(path.join(stage, "order.json"), JSON.stringify(order, null, 2));
      const nextCounter = path.join(stage, "next-counter");
      await writeFile(nextCounter, String(sequence));
      await rename(nextCounter, counter);
      await rename(stage, path.join(orders, id));
      return order;
    } finally { await rm(stage, { recursive: true, force: true }); }
  });
  const update = (id, patch) => exclusive(async () => {
    const order = { ...await read(id), ...patch };
    const file = path.join(orders, id, "order.json");
    const temp = file + "." + randomUUID() + ".tmp";
    try {
      await writeFile(temp, JSON.stringify(order, null, 2));
      await rename(temp, file);
    } finally { await rm(temp, { force: true }); }
    return order;
  });
  const clean = () => exclusive(async () => {
    const oldest = Date.now() - 60 * 86400000;
    for (const order of await list()) {
      if (Date.parse(order.created_at) < oldest && orderPattern.test(order.order_id)) await rm(path.join(orders, order.order_id), { recursive: true });
    }
  });
  const photo = async (id, file) => {
    if (!orderPattern.test(id) || !/^photo[1-4]\.jpg$/.test(file)) throw problem("Фото не найдено.", 404);
    try { return await readFile(path.join(orders, id, file)); }
    catch (error) { if (error.code === "ENOENT") throw problem("Фото не найдено.", 404); throw error; }
  };
  return { list, create, update, clean, read, photo };
}

export function zipFiles(entries) { return Buffer.from(orderZip(entries)); }
