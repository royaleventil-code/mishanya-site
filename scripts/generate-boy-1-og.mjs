import { mkdirSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const outDir = join("public", "og");
const sourcePath = join(outDir, "boy-1-whatsapp-source.png");
const outPath = join(outDir, "boy-1-whatsapp-preview.png");

mkdirSync(outDir, { recursive: true });

await sharp(sourcePath)
  .resize(1200, 1200, {
    fit: "cover",
    position: "center",
  })
  .png({ compressionLevel: 9 })
  .toFile(outPath);

console.log(outPath);
