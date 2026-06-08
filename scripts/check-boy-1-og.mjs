import { readFileSync } from "node:fs";

const ages = Array.from({ length: 10 }, (_, index) => index + 1);
const siteName = "Мишаня в Стране Чудес";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function pngSize(path) {
  const buffer = readFileSync(path);
  assert(buffer.subarray(0, 8).toString("hex") === "89504e470d0a1a0a", `${path} is not a PNG`);
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function childAgeLabel(age) {
  if (age === 1) return "1 год";
  if (age >= 2 && age <= 4) return `${age} года`;
  return `${age} лет`;
}

for (const age of ages) {
  const imagePath = `public/og/boy-${age}-whatsapp-preview.png`;
  const htmlPath = `out/ru/boy/${age}.html`;
  const ageLabel = childAgeLabel(age);
  const expectedImageUrl = `https://mishanya-show.com/og/boy-${age}-whatsapp-preview.png`;
  const expectedTitle = `Программа для мальчика ${ageLabel} | ${siteName}`;
  const expectedDescription = `Программа праздника для мальчика ${ageLabel}: герои, шоу, цены, фото, видео и быстрый выбор.`;

  const imageSize = pngSize(imagePath);
  assert(imageSize.width === 1200, `${imagePath} width is ${imageSize.width}, expected 1200`);
  assert(imageSize.height === 1200, `${imagePath} height is ${imageSize.height}, expected 1200`);

  const html = readFileSync(htmlPath, "utf8");
  assert(
    html.includes(`<meta property="og:title" content="${expectedTitle}"/>`),
    `boy ${age} page is missing the expected og:title`,
  );
  assert(
    html.includes(`<meta property="og:description" content="${expectedDescription}"/>`),
    `boy ${age} page is missing the expected og:description`,
  );
  assert(
    html.includes(`<meta property="og:image" content="${expectedImageUrl}"/>`),
    `boy ${age} page is missing the expected og:image`,
  );
  assert(
    html.includes('<meta property="og:image:width" content="1200"/>'),
    `boy ${age} page is missing the expected og:image:width`,
  );
  assert(
    html.includes('<meta property="og:image:height" content="1200"/>'),
    `boy ${age} page is missing the expected og:image:height`,
  );
  assert(
    html.includes(`<meta name="twitter:image" content="${expectedImageUrl}"/>`),
    `boy ${age} page is missing the expected twitter:image`,
  );
}

console.log("Boy OG preview checks passed.");
