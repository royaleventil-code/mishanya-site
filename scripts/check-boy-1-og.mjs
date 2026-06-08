import { readFileSync } from "node:fs";

const imagePath = "public/og/boy-1-whatsapp-preview.png";
const htmlPath = "out/ru/boy/1.html";
const otherHtmlPath = "out/ru/boy/2.html";
const expectedImageUrl = "https://mishanya-show.com/og/boy-1-whatsapp-preview.png";
const expectedTitle = "Программы для мальчика одного года | Мишаня в Стране Чудес";
const expectedDescription =
  "Подборка праздников, героев и шоу для мальчика одного года: цены, фото, видео и быстрый выбор программы.";

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

const imageSize = pngSize(imagePath);
assert(imageSize.width === 1200, `${imagePath} width is ${imageSize.width}, expected 1200`);
assert(imageSize.height === 1200, `${imagePath} height is ${imageSize.height}, expected 1200`);

const html = readFileSync(htmlPath, "utf8");
assert(
  html.includes(`<meta property="og:title" content="${expectedTitle}"/>`),
  "boy 1 page is missing the pilot og:title",
);
assert(
  html.includes(`<meta property="og:description" content="${expectedDescription}"/>`),
  "boy 1 page is missing the pilot og:description",
);
assert(
  html.includes(`<meta property="og:image" content="${expectedImageUrl}"/>`),
  "boy 1 page is missing the pilot og:image",
);
assert(
  html.includes('<meta property="og:image:width" content="1200"/>'),
  "boy 1 page is missing the pilot og:image:width",
);
assert(
  html.includes('<meta property="og:image:height" content="1200"/>'),
  "boy 1 page is missing the pilot og:image:height",
);
assert(
  html.includes(`<meta name="twitter:image" content="${expectedImageUrl}"/>`),
  "boy 1 page is missing the pilot twitter:image",
);

const otherHtml = readFileSync(otherHtmlPath, "utf8");
assert(
  !otherHtml.includes(expectedImageUrl),
  "boy 2 page should not use the boy 1 pilot image",
);

console.log("Boy 1 OG preview checks passed.");
