import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const outDir = join("public", "og");
const ages = Array.from({ length: 10 }, (_, index) => index + 1);

mkdirSync(outDir, { recursive: true });

for (const age of ages) {
  const sourcePath = join(outDir, `boy-${age}-whatsapp-source.png`);
  const outPath = join(outDir, `boy-${age}-whatsapp-preview.png`);

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
