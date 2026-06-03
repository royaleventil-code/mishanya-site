// One-off image optimizer (resize + recompress IN PLACE, same path & format).
// Safe: filenames/extensions unchanged → no code references break.
import sharp from "sharp";
import { readdirSync, statSync, readFileSync, writeFileSync } from "fs";
import { join, extname, basename } from "path";
import { fileURLToPath } from "url";

const PUBLIC = fileURLToPath(new URL("../public/", import.meta.url));
const EXT = new Set([".png", ".webp", ".jpg", ".jpeg"]);

function walk(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

function paramsFor(p) {
  const b = basename(p);
  if (b.startsWith("logo")) return { max: 520, q: 92 };
  if (p.includes("/heroes/") || p.includes("/addons/")) return { max: 384, q: 82 };
  if (p.includes("/programs/")) return { max: 1000, q: 86 };
  if (p.includes("/generated/")) return { max: 1100, q: 82 };
  if (p.includes("/proof/")) return { max: 1000, q: 78 };
  return { max: 1000, q: 82 };
}

sharp.cache(false);

const files = walk(PUBLIC).filter((p) => EXT.has(extname(p).toLowerCase()));
let before = 0,
  after = 0,
  changed = 0;

for (const p of files) {
  const ext = extname(p).toLowerCase();
  const { max, q } = paramsFor(p);
  const inBuf = readFileSync(p);
  before += inBuf.length;
  try {
    let pipe = sharp(inBuf, { failOn: "none" }).rotate();
    const meta = await sharp(inBuf).metadata();
    if (meta.width && meta.width > max) {
      pipe = pipe.resize({ width: max, height: max, fit: "inside", withoutEnlargement: true });
    }
    if (ext === ".png") pipe = pipe.png({ quality: q, palette: true, compressionLevel: 9, effort: 8 });
    else if (ext === ".webp") pipe = pipe.webp({ quality: q });
    else pipe = pipe.jpeg({ quality: q, mozjpeg: true });
    const outBuf = await pipe.toBuffer();
    if (outBuf.length < inBuf.length) {
      writeFileSync(p, outBuf);
      after += outBuf.length;
      changed++;
    } else {
      after += inBuf.length;
    }
  } catch (err) {
    after += inBuf.length;
    console.error("skip", p, err.message);
  }
}

const mb = (n) => (n / 1048576).toFixed(1);
console.log(`Files: ${files.length}, optimized: ${changed}`);
console.log(`Before: ${mb(before)} MB → After: ${mb(after)} MB (saved ${mb(before - after)} MB)`);
