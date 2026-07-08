import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

// Исходники лежат вне public/, чтобы 40+ МБ PNG не попадали в деплой
const sourceDir = "og-sources";
const outDir = join("public", "og");
const ages = Array.from({ length: 10 }, (_, index) => index + 1);
// Превью — JPEG: WhatsApp/Telegram не показывают og-картинки тяжелее ~600 КБ,
// а PNG 1200×1200 выходил 2,4–3,2 МБ. Прозрачность превью не нужна.
const items = [
  { source: "home-whatsapp-source.png", preview: "home-whatsapp-preview.jpg" },
  ...ages.flatMap((age) => [
    { source: `boy-${age}-whatsapp-source.png`, preview: `boy-${age}-whatsapp-preview.jpg` },
    { source: `girl-${age}-whatsapp-source.png`, preview: `girl-${age}-whatsapp-preview.jpg` },
  ]),
];

mkdirSync(outDir, { recursive: true });

for (const item of items) {
  const sourcePath = join(sourceDir, item.source);
  const outPath = join(outDir, item.preview);

  if (!existsSync(sourcePath)) {
    throw new Error(`${sourcePath} is missing`);
  }

  await sharp(sourcePath)
    .resize(1200, 1200, {
      fit: "cover",
      position: "center",
    })
    .jpeg({ quality: 85, mozjpeg: true })
    .toFile(outPath);

  console.log(outPath);
}
