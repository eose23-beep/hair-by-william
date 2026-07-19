/**
 * Compress portfolio stills for PageSpeed: modern WebP, sized hero ladder,
 * JPEG fallbacks for heavy PNGs. Does not touch video files.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIR = path.resolve(__dirname, "..", "public", "portfolio");
const ORIGINALS = path.join(DIR, "_originals");

const WEBP_Q = 82;
const JPEG_Q = 82;

/** Prefer untouched backup when re-running optimizers. */
function sourcePath(name) {
  const backup = path.join(ORIGINALS, name);
  if (fs.existsSync(backup)) return backup;
  return path.join(DIR, name);
}

async function writeWebp(input, outPath, { width, height, quality = WEBP_Q } = {}) {
  let pipeline = sharp(input, { failOn: "none", unlimited: true }).rotate();
  if (width || height) {
    pipeline = pipeline.resize({
      width,
      height,
      fit: "inside",
      withoutEnlargement: true,
      kernel: sharp.kernel.lanczos3,
    });
  }
  await pipeline.webp({ quality, effort: 5 }).toFile(outPath);
  return fs.statSync(outPath).size;
}

async function writeJpeg(input, outPath, { width, height, quality = JPEG_Q } = {}) {
  let pipeline = sharp(input, { failOn: "none", unlimited: true }).rotate();
  if (width || height) {
    pipeline = pipeline.resize({
      width,
      height,
      fit: "inside",
      withoutEnlargement: true,
      kernel: sharp.kernel.lanczos3,
    });
  }
  await pipeline.jpeg({ quality, mozjpeg: true }).toFile(outPath);
  return fs.statSync(outPath).size;
}

function kb(n) {
  return `${(n / 1024).toFixed(1)}KB`;
}

async function optimizeWorkStills() {
  const names = [
    "work-01",
    "work-02",
    "work-03",
    "work-04",
    "work-05",
    "work-06",
    "work-07",
    "work-08",
    "work-09",
    "work-10",
    "work-11",
    "work-12",
  ];
  for (const base of names) {
    const png = sourcePath(`${base}.png`);
    if (!fs.existsSync(png)) continue;
    const before = fs.statSync(png).size;
    const jpgPath = path.join(DIR, `${base}.jpg`);
    const webpPath = path.join(DIR, `${base}.webp`);
    const jpgSize = await writeJpeg(png, jpgPath, { width: 1200 });
    const webpSize = await writeWebp(png, webpPath, { width: 1200 });
    console.log(
      `${base}: png ${kb(before)} → jpg ${kb(jpgSize)} + webp ${kb(webpSize)}`,
    );
  }
}

async function optimizeHeroLadder() {
  const mobileSrc = sourcePath("extensions_after-hero.jpg");
  // Desk crop lives only in public/portfolio (no _originals twin today)
  const deskSrc = path.join(DIR, "extensions_after-hero-desk.jpg");
  // Buffer sources first so later overwrites cannot poison wider sizes
  const mobileBuf = await sharp(mobileSrc, { failOn: "none", unlimited: true })
    .rotate()
    .toBuffer();
  const deskBuf = await sharp(deskSrc, { failOn: "none", unlimited: true })
    .rotate()
    .toBuffer();

  // Mobile / small viewports — square hero, avoid shipping 2160px to phones
  for (const w of [720, 960, 1280]) {
    const webp = path.join(DIR, `extensions_after-hero-${w}.webp`);
    const jpg = path.join(DIR, `extensions_after-hero-${w}.jpg`);
    const ws = await writeWebp(mobileBuf, webp, { width: w });
    const js = await writeJpeg(mobileBuf, jpg, { width: w });
    console.log(`hero mobile ${w}: webp ${kb(ws)} jpg ${kb(js)}`);
  }

  // Rebuild default mobile companions lighter (cap 1280 / 1600)
  {
    const webp = path.join(DIR, "extensions_after-hero.webp");
    const jpg = path.join(DIR, "extensions_after-hero.jpg");
    const ws = await writeWebp(mobileBuf, webp, { width: 1280 });
    const js = await writeJpeg(mobileBuf, jpg, { width: 1600, quality: 84 });
    console.log(`hero default: webp ${kb(ws)} jpg ${kb(js)}`);
  }

  // Desktop landscape — 1920 / 2400 (drop 3600 overshoot)
  for (const [label, w] of [
    ["desk", 1920],
    ["desk-2x", 2400],
  ]) {
    const webp = path.join(DIR, `extensions_after-hero-${label}.webp`);
    const jpg = path.join(DIR, `extensions_after-hero-${label}.jpg`);
    const ws = await writeWebp(deskBuf, webp, { width: w });
    const js = await writeJpeg(deskBuf, jpg, { width: w, quality: 84 });
    console.log(`hero ${label} ${w}: webp ${kb(ws)} jpg ${kb(js)}`);
  }
}

async function optimizePostersAndMisc() {
  const posters = [
    "clip-01-poster.jpg",
    "clip-02-poster.jpg",
    "clip-03-poster.jpg",
    "clip-04-poster.jpg",
  ];
  for (const name of posters) {
    const src = sourcePath(name);
    if (!fs.existsSync(src)) continue;
    const before = fs.statSync(src).size;
    const outJpg = path.join(DIR, name);
    const webp = path.join(DIR, name.replace(/\.jpe?g$/i, ".webp"));
    const buf = await sharp(src, { failOn: "none", unlimited: true })
      .rotate()
      .toBuffer();
    const jpgSize = await writeJpeg(buf, outJpg, { width: 720, quality: 78 });
    const webpSize = await writeWebp(buf, webp, { width: 720, quality: 78 });
    console.log(
      `${name}: ${kb(before)} → jpg ${kb(jpgSize)} webp ${kb(webpSize)}`,
    );
  }

  const misc = [
    "extensions_after.jpg",
    "extensions_before.jpg",
    "blowout_after.jpg",
    "blowout_before.jpg",
    "color_cut.jpg",
  ];
  for (const name of misc) {
    const src = sourcePath(name);
    if (!fs.existsSync(src)) continue;
    const before = fs.statSync(src).size;
    const outJpg = path.join(DIR, name);
    const webp = path.join(DIR, name.replace(/\.jpe?g$/i, ".webp"));
    const buf = await sharp(src, { failOn: "none", unlimited: true })
      .rotate()
      .toBuffer();
    const jpgSize = await writeJpeg(buf, outJpg, { width: 1400, quality: 82 });
    const webpSize = await writeWebp(buf, webp, { width: 1400 });
    console.log(
      `${name}: ${kb(before)} → jpg ${kb(jpgSize)} webp ${kb(webpSize)}`,
    );
  }
}

async function main() {
  console.log("Optimizing portfolio assets…");
  await optimizeWorkStills();
  await optimizeHeroLadder();
  await optimizePostersAndMisc();
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
