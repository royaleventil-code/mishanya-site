import { createServer } from "node:http";
import { execFile } from "node:child_process";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { orderStore, problem } from "./ded-moroz-files.mjs";
import { greetingRequestHandler } from "./ded-moroz-api.mjs";
import { createTelegramOrderNotifier, loadTelegramSettings, telegramRetryInterval } from "./ded-moroz-telegram.mjs";
import { greetingOrderPath } from "../data/new-year.ts";

const site = fileURLToPath(new URL("../", import.meta.url));
const mime = { ".html": "text/html; charset=utf-8", ".txt": "text/plain; charset=utf-8", ".css": "text/css", ".js": "application/javascript", ".json": "application/json", ".webp": "image/webp", ".jpg": "image/jpeg", ".png": "image/png", ".ico": "image/x-icon", ".woff2": "font/woff2", ".svg": "image/svg+xml", ".webmanifest": "application/manifest+json" };
async function serveExport(req, res, pathname) {
  if (!["GET", "HEAD"].includes(req.method)) throw problem("Этот метод недоступен.", 405);
  const root = path.join(site, "out");
  const decoded = decodeURIComponent(pathname);
  if (decoded.includes("\\") || decoded.includes("\0")) throw problem("Страница не найдена.", 404);
  const base = path.resolve(root, "." + decoded);
  if (base !== root && !base.startsWith(root + path.sep)) throw problem("Страница не найдена.", 404);
  const candidates = base === root ? [path.join(root, "index.html")] : [base, base + ".html", path.join(base, "index.html")];
  // Next exports nested router segments as directories, and requests them using dots.
  const segment = path.basename(base).match(/^(__next\.[!$].+)\.txt$/);
  if (segment) {
    const parts = segment[1].split(".");
    if (parts.length > 2) candidates.push(path.join(path.dirname(base), parts.slice(0, 2).join("."), ...parts.slice(2, -1), parts.at(-1) + ".txt"));
  }
  for (const file of candidates) {
    if (!(await stat(file).catch(() => null))?.isFile()) continue;
    res.writeHead(200, { "Content-Type": mime[path.extname(file)] || "application/octet-stream" });
    if (req.method === "HEAD") return res.end();
    createReadStream(file).on("error", () => res.destroy()).pipe(res); return;
  }
  throw problem("Страница не найдена.", 404);
}
export const previewHandler = (store, notifyPendingOrders) => greetingRequestHandler(store, serveExport, notifyPendingOrders);

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const address = "http://localhost:3003" + greetingOrderPath;
  const dev = process.argv.includes("--dev");
  const launch = process.argv.includes("--open");
  const open = () => execFile("explorer.exe", [address], { windowsHide: true }, () => {});
  const dataDirectory = path.join(site, ".ded-moroz-local");
  const telegramSettings = await loadTelegramSettings(dataDirectory).catch(() => {
    console.error("Не удалось прочитать настройки Telegram. Запустите setup-ded-moroz-telegram.cmd.");
    return null;
  });
  const store = orderStore(dataDirectory, { telegramNotifications: Boolean(telegramSettings) });
  const notifyPendingOrders = telegramSettings ? createTelegramOrderNotifier(store, telegramSettings) : undefined;
  const server = createServer();
  const handlePreview = previewHandler(store, notifyPendingOrders);
  if (dev) {
    process.env.NODE_ENV ??= "development";
    const { default: next } = await import("next");
    const app = next({ dev: true, webpack: true, dir: site, port: 3003, httpServer: server });
    await app.prepare();
    const handleNext = app.getRequestHandler();
    server.on("request", (req, res) =>
      req.url?.startsWith("/api/ded-moroz/") ? handlePreview(req, res) : handleNext(req, res));
  } else {
    server.on("request", handlePreview);
  }
  server.on("error", async error => {
    if (launch && error.code === "EADDRINUSE") {
      const ping = await fetch("http://127.0.0.1:3003/api/ded-moroz/ping", { signal: AbortSignal.timeout(2500) })
        .then(res => res.json()).catch(() => null);
      if (ping?.service === "mishanya-ded-moroz") { open(); return; }
      console.error("Порт 3003 занят другим локальным сервером. Закройте его и снова откройте этот файл.");
    } else console.error(error.message);
    process.exitCode = 1;
  });
  server.listen(3003, dev ? undefined : "127.0.0.1", () => {
    console.log("Мишаня • " + address);
    if (notifyPendingOrders) {
      console.log("Уведомления о новых заказах в Telegram включены.");
      void notifyPendingOrders();
      const timer = setInterval(notifyPendingOrders, telegramRetryInterval);
      timer.unref();
      server.once("close", () => clearInterval(timer));
    }
    if (launch) open();
  });
}
