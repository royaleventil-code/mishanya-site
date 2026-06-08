import { mkdirSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const outDir = join("public", "og");
const outPath = join(outDir, "boy-1-whatsapp-preview.png");
const fontRegular = "C:/Windows/Fonts/arial.ttf";
const fontBold = "C:/Windows/Fonts/arialbd.ttf";

mkdirSync(outDir, { recursive: true });

const baseSvg = `
<svg width="1200" height="1200" viewBox="0 0 1200 1200" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="1200" fill="#ffffff"/>
</svg>`;

function escapeMarkup(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function textLayer(text, width, size, color, bold = true) {
  const fontName = bold ? "Arial Bold" : "Arial";
  return {
    text: {
      text: `<span foreground="${color}" font_desc="${fontName} ${size}">${escapeMarkup(text)}</span>`,
      font: `${fontName} ${size}`,
      fontfile: bold ? fontBold : fontRegular,
      width,
      rgba: true,
      dpi: 72,
      spacing: 0,
    },
    failOn: "none",
  };
}

await sharp(Buffer.from(baseSvg))
  .png({ compressionLevel: 9 })
  .composite([
    { input: textLayer("Программа", 1060, 174, "#111827"), left: 70, top: 146 },
    { input: textLayer("для мальчика", 1060, 136, "#111827"), left: 70, top: 378 },
    { input: textLayer("1 ГОД", 1060, 270, "#0a84ff"), left: 70, top: 620 },
  ])
  .toFile(outPath);

console.log(outPath);
