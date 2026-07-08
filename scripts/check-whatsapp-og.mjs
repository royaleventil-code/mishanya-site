import { readFileSync } from "node:fs";

const ages = Array.from({ length: 10 }, (_, index) => index + 1);
const siteName = "Мишаня в Стране Чудес";
const siteUrl = "https://mishanya-show.com";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

// WhatsApp/Telegram не подтягивают og-картинки тяжелее ~600 КБ
const MAX_PREVIEW_BYTES = 500 * 1024;

function jpegSize(path) {
  const buffer = readFileSync(path);
  assert(buffer.readUInt16BE(0) === 0xffd8, `${path} is not a JPEG`);
  assert(buffer.length <= MAX_PREVIEW_BYTES, `${path} is ${buffer.length} bytes, expected <= ${MAX_PREVIEW_BYTES}`);
  let offset = 2;
  while (offset < buffer.length - 8) {
    assert(buffer[offset] === 0xff, `${path}: broken JPEG marker at ${offset}`);
    const marker = buffer[offset + 1];
    // SOF0..SOF15 (кроме DHT/JPG/DAC) содержат размеры кадра
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return {
        height: buffer.readUInt16BE(offset + 5),
        width: buffer.readUInt16BE(offset + 7),
      };
    }
    offset += 2 + buffer.readUInt16BE(offset + 2);
  }
  throw new Error(`${path}: JPEG frame header not found`);
}

function childAgeLabel(age) {
  if (age === 1) return "1 год";
  if (age >= 2 && age <= 4) return `${age} года`;
  return `${age} лет`;
}

for (const age of ages) {
  for (const gender of ["boy", "girl"]) {
    const audience = gender === "boy" ? "мальчика" : "девочки";
    const imagePath = `public/og/${gender}-${age}-whatsapp-preview.jpg`;
    const htmlPath = `out/ru/${gender}/${age}.html`;
    const ageLabel = childAgeLabel(age);
    const expectedImageUrl = `${siteUrl}/og/${gender}-${age}-whatsapp-preview.jpg`;
    const expectedTitle = `Программа для ${audience} ${ageLabel} | ${siteName}`;
    const expectedDescription = `Программа праздника для ${audience} ${ageLabel}: герои, шоу, цены, фото, видео и быстрый выбор.`;

    const imageSize = jpegSize(imagePath);
    assert(imageSize.width === 1200, `${imagePath} width is ${imageSize.width}, expected 1200`);
    assert(imageSize.height === 1200, `${imagePath} height is ${imageSize.height}, expected 1200`);

    const html = readFileSync(htmlPath, "utf8");
    assert(
      html.includes(`<meta property="og:title" content="${expectedTitle}"/>`),
      `${gender} ${age} page is missing the expected og:title`,
    );
    assert(
      html.includes(`<meta property="og:description" content="${expectedDescription}"/>`),
      `${gender} ${age} page is missing the expected og:description`,
    );
    assert(
      html.includes(`<meta property="og:image" content="${expectedImageUrl}"/>`),
      `${gender} ${age} page is missing the expected og:image`,
    );
    assert(
      html.includes('<meta property="og:image:width" content="1200"/>'),
      `${gender} ${age} page is missing the expected og:image:width`,
    );
    assert(
      html.includes('<meta property="og:image:height" content="1200"/>'),
      `${gender} ${age} page is missing the expected og:image:height`,
    );
    assert(
      html.includes(`<meta name="twitter:image" content="${expectedImageUrl}"/>`),
      `${gender} ${age} page is missing the expected twitter:image`,
    );
  }
}

const homeImagePath = "public/og/home-whatsapp-preview.jpg";
const homeImageUrl = `${siteUrl}/og/home-whatsapp-preview.jpg`;
const homeTitle = `${siteName} — аниматоры и детские праздники в Израиле`;

const homeImageSize = jpegSize(homeImagePath);
assert(homeImageSize.width === 1200, `${homeImagePath} width is ${homeImageSize.width}, expected 1200`);
assert(homeImageSize.height === 1200, `${homeImagePath} height is ${homeImageSize.height}, expected 1200`);

for (const htmlPath of ["out/index.html", "out/ru.html"]) {
  const html = readFileSync(htmlPath, "utf8");
  assert(
    html.includes(`<meta property="og:title" content="${homeTitle}"/>`),
    `${htmlPath} is missing the expected home og:title`,
  );
  assert(
    html.includes(`<meta property="og:image" content="${homeImageUrl}"/>`),
    `${htmlPath} is missing the expected home og:image`,
  );
  assert(
    html.includes('<meta property="og:image:height" content="1200"/>'),
    `${htmlPath} is missing the expected home og:image:height`,
  );
  assert(
    html.includes(`<meta name="twitter:image" content="${homeImageUrl}"/>`),
    `${htmlPath} is missing the expected home twitter:image`,
  );
}

console.log("WhatsApp OG preview checks passed.");
