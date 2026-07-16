// Генерирует печатные QR-файлы страницы «Подарок с праздника».
// Использование: node scripts/generate-gift-qrs.mjs <папка-вывода>
import { mkdir } from "node:fs/promises";
import path from "node:path";
import QRCode from "qrcode";

const SITE_URL = "https://mishanya-show.com";

const SOURCES = [{ source: "party-qr", label: "Общий QR" }];

const outDir = process.argv[2];
if (!outDir) {
  console.error("Укажите папку вывода: node scripts/generate-gift-qrs.mjs <папка>");
  process.exit(1);
}

await mkdir(outDir, { recursive: true });

for (const { source, label } of SOURCES) {
  const link = `${SITE_URL}/gift?src=${source}`;
  const file = path.join(outDir, `QR ${label} (${source}).png`);
  await QRCode.toFile(file, link, {
    width: 2048,
    margin: 3,
    errorCorrectionLevel: "M",
    color: { dark: "#0f0f14", light: "#ffffff" },
  });
  console.log(`✓ ${file} → ${link}`);
}
