/**
 * Further shrink hero ladder for mobile LCP (quality ~62–68).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "public", "portfolio");
const ORIGINALS = path.join(DIR, "_originals");

function source(name) {
  const b = path.join(ORIGINALS, name);
  if (fs.existsSync(b)) return b;
  return path.join(DIR, name);
}

async function write(buf, out, { width, quality, format }) {
  let p = sharp(buf, { failOn: "none", unlimited: true }).rotate().resize({
    width,
    fit: "inside",
    withoutEnlargement: true,
  });
  if (format === "webp") p = p.webp({ quality, effort: 6 });
  else p = p.jpeg({ quality, mozjpeg: true });
  await p.toFile(out);
  return fs.statSync(out).size;
}

const kb = (n) => `${(n / 1024).toFixed(1)}KB`;

async function main() {
  const mobileSrc = source("extensions_after-hero.jpg");
  const mobileAlt = source("extensions_after-hero-hero.jpg");
  const mPath = fs.existsSync(path.join(DIR, "_originals", "extensions_after-hero-hero.jpg"))
    ? path.join(DIR, "_originals", "extensions_after-hero-hero.jpg")
    : fs.existsSync(path.join(DIR, "extensions_after-hero-hero.jpg"))
      ? path.join(DIR, "extensions_after-hero-hero.jpg")
      : mobileSrc;

  // Prefer dedicated mobile source if present
  let src = mPath;
  if (!fs.existsSync(src)) src = source("extensions_after-hero.jpg");
  const buf = await sharp(src, { failOn: "none", unlimited: true }).rotate().toBuffer();

  for (const [w, q] of [
    [540, 64],
    [720, 66],
    [960, 68],
    [1280, 70],
  ]) {
    const webp = path.join(DIR, w === 540 ? "extensions_after-hero-540.webp" : `extensions_after-hero-${w}.webp`);
    const jpg = path.join(DIR, w === 540 ? "extensions_after-hero-540.jpg" : `extensions_after-hero-${w}.jpg`);
    if (w === 540) {
      const ws = await write(buf, webp, { width: w, quality: q, format: "webp" });
      const js = await write(buf, jpg, { width: w, quality: q + 4, format: "jpg" });
      console.log(`hero ${w}: webp ${kb(ws)} jpg ${kb(js)}`);
      continue;
    }
    const ws = await write(buf, webp, { width: w, quality: q, format: "webp" });
    const js = await write(buf, jpg, { width: w, quality: q + 4, format: "jpg" });
    console.log(`hero ${w}: webp ${kb(ws)} jpg ${kb(js)}`);
  }

  // Default companions stay at 1280
  {
    const ws = await write(buf, path.join(DIR, "extensions_after-hero.webp"), {
      width: 1280,
      quality: 70,
      format: "webp",
    });
    console.log(`hero default webp ${kb(ws)}`);
  }

  // Misc heavy stills called out by PSI
  for (const { name, width, q } of [
    { name: "extensions_before.jpg", width: 640, q: 68 },
    { name: "blowout_after.jpg", width: 720, q: 68 },
    { name: "extensions_after.jpg", width: 720, q: 68 },
    { name: "color_cut.jpg", width: 720, q: 68 },
  ]) {
    const srcPath = source(name);
    if (!fs.existsSync(srcPath)) continue;
    const b = await sharp(srcPath, { failOn: "none", unlimited: true }).rotate().toBuffer();
    const base = name.replace(/\.jpe?g$/i, "");
    const ws = await write(b, path.join(DIR, `${base}.webp`), { width, quality: q, format: "webp" });
    const js = await write(b, path.join(DIR, name), { width, quality: q + 4, format: "jpg" });
    console.log(`${base}: webp ${kb(ws)} jpg ${kb(js)}`);
  }

  // Posters smaller for thumb display
  for (const name of ["clip-01-poster.jpg", "clip-02-poster.jpg", "clip-03-poster.jpg", "clip-04-poster.jpg"]) {
    const srcPath = source(name);
    if (!fs.existsSync(srcPath)) continue;
    const b = await sharp(srcPath, { failOn: "none", unlimited: true }).rotate().toBuffer();
    const webp = path.join(DIR, name.replace(/\.jpe?g$/i, ".webp"));
    const ws = await write(b, webp, { width: 480, quality: 66, format: "webp" });
    const js = await write(b, path.join(DIR, name), { width: 480, quality: 70, format: "jpg" });
    console.log(`${name}: webp ${kb(ws)} jpg ${kb(js)}`);
  }

  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
