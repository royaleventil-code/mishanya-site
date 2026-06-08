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
<svg width="1200" height="1200" viewBox="0 0 1200 1200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fff9f0"/>
      <stop offset="0.52" stop-color="#f4fbff"/>
      <stop offset="1" stop-color="#e2f1ff"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="22" stdDeviation="22" flood-color="#0f172a" flood-opacity="0.18"/>
    </filter>
    <clipPath id="coverClip">
      <rect x="612" y="122" width="506" height="468" rx="44"/>
    </clipPath>
  </defs>

  <rect width="1200" height="1200" fill="url(#bg)"/>
  <circle cx="1028" cy="116" r="184" fill="#0a84ff" opacity="0.13"/>
  <circle cx="142" cy="1034" r="214" fill="#ff9f0a" opacity="0.13"/>
  <circle cx="574" cy="950" r="156" fill="#30d158" opacity="0.09"/>

  <g opacity="0.18" fill="none" stroke="#0f172a" stroke-width="5" stroke-linecap="round">
    <path d="M72 208h54M99 181v54"/>
    <path d="M494 1016h64M526 984v64"/>
    <path d="M1088 940h52M1114 914v52"/>
    <circle cx="1018" cy="1042" r="28"/>
    <circle cx="598" cy="726" r="18"/>
  </g>

  <rect x="54" y="56" width="1092" height="1088" rx="54" fill="#ffffff" opacity="0.76" filter="url(#shadow)"/>
  <image href="data:image/png;base64,${logo}" x="84" y="86" width="98" height="98"/>

  <rect x="82" y="624" width="516" height="76" rx="38" fill="#e8f4ff"/>
  <rect x="82" y="980" width="470" height="86" rx="43" fill="#0a84ff"/>

  <rect x="612" y="122" width="506" height="468" rx="44" fill="#ffffff" filter="url(#shadow)"/>
  <image href="data:image/png;base64,${cover}" x="612" y="122" width="506" height="468" preserveAspectRatio="xMidYMid slice" clip-path="url(#coverClip)"/>
  <rect x="656" y="526" width="416" height="88" rx="44" fill="#ffffff" opacity="0.94"/>
  <rect x="628" y="778" width="464" height="106" rx="53" fill="#fff4d9"/>
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
    { input: textLayer("Мишаня в Стране Чудес", 440, 33, "#111827"), left: 198, top: 90 },
    {
      input: textLayer("детские праздники в Израиле", 400, 24, "#4b5563", false),
      left: 198,
      top: 134,
    },
    { input: textLayer("Программы", 510, 90, "#111827"), left: 82, top: 242 },
    { input: textLayer("для мальчика", 535, 78, "#111827"), left: 82, top: 352 },
    { input: textLayer("одного года", 540, 74, "#0a84ff"), left: 82, top: 452 },
    {
      input: textLayer("герои · шоу · цены · фото", 472, 34, "#0b5cad"),
      left: 104,
      top: 642,
    },
    { input: textLayer("подбор под возраст", 374, 36, "#111827"), left: 682, top: 548 },
    { input: textLayer("самые понятные варианты", 390, 32, "#8a5200"), left: 664, top: 811 },
    { input: textLayer("открыть подборку", 390, 40, "#ffffff"), left: 118, top: 1004 },
  ])
  .toFile(outPath);

console.log(outPath);
