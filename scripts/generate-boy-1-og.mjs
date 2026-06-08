import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const outDir = join("public", "og");
const outPath = join(outDir, "boy-1-whatsapp-preview.png");
const fontRegular = "C:/Windows/Fonts/arial.ttf";
const fontBold = "C:/Windows/Fonts/arialbd.ttf";

mkdirSync(outDir, { recursive: true });

const logo = readFileSync(join("public", "logo-ru.png")).toString("base64");
const cover = readFileSync(join("public", "programs", "start-universal.png")).toString("base64");

const baseSvg = `
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fff7ed"/>
      <stop offset="0.48" stop-color="#f5fbff"/>
      <stop offset="1" stop-color="#e6f3ff"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#0f172a" flood-opacity="0.18"/>
    </filter>
    <clipPath id="coverClip">
      <rect x="700" y="92" width="410" height="360" rx="38"/>
    </clipPath>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="1040" cy="78" r="150" fill="#0a84ff" opacity="0.12"/>
  <circle cx="114" cy="522" r="180" fill="#ff9f0a" opacity="0.12"/>
  <circle cx="575" cy="86" r="92" fill="#30d158" opacity="0.08"/>

  <g opacity="0.18" fill="none" stroke="#0f172a" stroke-width="5" stroke-linecap="round">
    <path d="M79 168h48M103 144v48"/>
    <path d="M492 528h56M520 500v56"/>
    <path d="M1112 516h42M1133 495v42"/>
    <circle cx="1034" cy="548" r="22"/>
    <circle cx="612" cy="470" r="16"/>
  </g>

  <rect x="54" y="48" width="610" height="535" rx="44" fill="#ffffff" opacity="0.72" filter="url(#shadow)"/>
  <image href="data:image/png;base64,${logo}" x="82" y="70" width="86" height="86"/>

  <rect x="82" y="442" width="540" height="64" rx="32" fill="#e8f4ff"/>

  <rect x="700" y="92" width="410" height="360" rx="38" fill="#ffffff" filter="url(#shadow)"/>
  <image href="data:image/png;base64,${cover}" x="700" y="92" width="410" height="360" preserveAspectRatio="xMidYMid slice" clip-path="url(#coverClip)"/>
  <rect x="728" y="402" width="354" height="70" rx="35" fill="#ffffff" opacity="0.92"/>
  <rect x="740" y="492" width="330" height="70" rx="35" fill="#0a84ff"/>
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
    { input: textLayer("Мишаня в Стране Чудес", 420, 30, "#111827"), left: 184, top: 78 },
    {
      input: textLayer("детские праздники в Израиле", 390, 22, "#4b5563", false),
      left: 184,
      top: 118,
    },
    { input: textLayer("Программы", 520, 68, "#111827"), left: 82, top: 182 },
    { input: textLayer("для мальчика", 530, 60, "#111827"), left: 82, top: 263 },
    { input: textLayer("1 год", 410, 86, "#0a84ff"), left: 82, top: 334 },
    {
      input: textLayer("герои · шоу · цены · фото · видео", 510, 27, "#0b5cad"),
      left: 112,
      top: 456,
    },
    { input: textLayer("выбор под возраст", 310, 32, "#111827"), left: 766, top: 414 },
    { input: textLayer("открыть подборку", 280, 30, "#ffffff"), left: 788, top: 506 },
  ])
  .toFile(outPath);

console.log(outPath);
