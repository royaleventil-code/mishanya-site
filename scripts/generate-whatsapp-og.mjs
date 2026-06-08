import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const outDir = join("public", "og");
const ages = Array.from({ length: 10 }, (_, index) => index + 1);
const items = [
  { source: "home-whatsapp-source.png", preview: "home-whatsapp-preview.png" },
  ...ages.flatMap((age) => [
    { source: `boy-${age}-whatsapp-source.png`, preview: `boy-${age}-whatsapp-preview.png` },
    { source: `girl-${age}-whatsapp-source.png`, preview: `girl-${age}-whatsapp-preview.png` },
  ]),
];

mkdirSync(outDir, { recursive: true });

for (const item of items) {
  const sourcePath = join(outDir, item.source);
  const outPath = join(outDir, item.preview);

  if (!existsSync(sourcePath)) {
    throw new Error(`${sourcePath} is missing`);
  }

  await sharp(sourcePath)
    .resize(1200, 1200, {
      fit: "cover",
      position: "center",
    })
    .png({ compressionLevel: 9 })
    .toFile(outPath);

  console.log(outPath);
}
