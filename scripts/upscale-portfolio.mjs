/**
 * Batch upscale + mild sharpen/vibrance for public/portfolio stills.
 * Backs up originals once to public/portfolio/_originals/, overwrites in place.
 * Skips .mp4. Cap max edge 2800. Prefer quality over neon skin.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DIR = path.join(ROOT, "public", "portfolio");
const BACKUP = path.join(DIR, "_originals");
const REPORT = path.join(ROOT, "scripts", "output", "upscale-report.json");

const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const MAX_EDGE = 2800;
const MIN_UPSCALE_EDGE = 1400; // below this → ~1.75× until cap
const TARGET_SCALE = 1.75;

const SHARPEN = { sigma: 0.85, m1: 0.8, m2: 0.45, x1: 2, y2: 8, y3: 16 };
const MODULATE = { saturation: 1.08, brightness: 1.02 };

function ensureDir(d) {
  fs.mkdirSync(d, { recursive: true });
}

async function processOne(file) {
  const ext = path.extname(file).toLowerCase();
  if (!IMAGE_EXT.has(ext)) return null;
  if (file.startsWith(".")) return null;

  const srcPath = path.join(DIR, file);
  const backupPath = path.join(BACKUP, file);
  const beforeStat = fs.statSync(srcPath);

  // Prefer backup as source of truth if we re-run
  const inputPath = fs.existsSync(backupPath) ? backupPath : srcPath;
  if (!fs.existsSync(backupPath)) {
    ensureDir(BACKUP);
    fs.copyFileSync(srcPath, backupPath);
  }

  const meta = await sharp(inputPath, { failOn: "none" }).metadata();
  const w = meta.width || 0;
  const h = meta.height || 0;
  const maxDim = Math.max(w, h);

  let targetW = w;
  let targetH = h;
  if (maxDim > 0 && maxDim < MIN_UPSCALE_EDGE) {
    const scale = Math.min(TARGET_SCALE, MAX_EDGE / maxDim);
    targetW = Math.round(w * scale);
    targetH = Math.round(h * scale);
  } else if (maxDim > MAX_EDGE) {
    const scale = MAX_EDGE / maxDim;
    targetW = Math.round(w * scale);
    targetH = Math.round(h * scale);
  }

  let pipeline = sharp(inputPath, { failOn: "none", unlimited: true }).rotate();

  if (targetW !== w || targetH !== h) {
    pipeline = pipeline.resize(targetW, targetH, {
      kernel: sharp.kernel.lanczos3,
      fit: "fill",
      withoutEnlargement: false,
    });
  }

  pipeline = pipeline
    .modulate(MODULATE)
    .sharpen(SHARPEN);

  const outBase = path.join(DIR, path.basename(file, ext));
  const results = [];

  // Always write primary format matching original extension (overwrite)
  if (ext === ".png") {
    await pipeline
      .clone()
      .png({ compressionLevel: 8, quality: 90, effort: 8 })
      .toFile(srcPath + ".tmp");
    fs.renameSync(srcPath + ".tmp", srcPath);
  } else if (ext === ".webp") {
    await pipeline
      .clone()
      .webp({ quality: 82, effort: 5 })
      .toFile(srcPath + ".tmp");
    fs.renameSync(srcPath + ".tmp", srcPath);
  } else {
    // jpg / jpeg
    await pipeline
      .clone()
      .jpeg({ quality: 85, mozjpeg: true, chromaSubsampling: "4:4:4" })
      .toFile(srcPath + ".tmp");
    fs.renameSync(srcPath + ".tmp", srcPath);
  }

  const afterStat = fs.statSync(srcPath);
  const afterMeta = await sharp(srcPath, { failOn: "none" }).metadata();

  results.push({
    file,
    role: "primary",
    beforeBytes: beforeStat.size,
    afterBytes: afterStat.size,
    before: `${w}x${h}`,
    after: `${afterMeta.width}x${afterMeta.height}`,
  });

  // For key stills that are jpg/png (not already -hero.webp), emit webp sibling if missing
  // Skip posters and hero variants that already have dedicated webp
  const isHeroVariant = file.includes("-hero");
  const isPoster = file.includes("-poster");
  if (!isHeroVariant && !isPoster && (ext === ".jpg" || ext === ".jpeg" || ext === ".png")) {
    const webpPath = `${outBase}.webp`;
    // Only create webp for frequently used assets — list driven below via KEY_WEBP
  }

  return {
    file,
    beforeBytes: beforeStat.size,
    afterBytes: afterStat.size,
    before: `${w}x${h}`,
    after: `${afterMeta.width}x${afterMeta.height}`,
    upscaled: targetW !== w || targetH !== h,
  };
}

/** Key assets that get an optimized webp sibling for picture/srcset use */
const KEY_WEBP = new Set([
  "extensions_after.jpg",
  "extensions_before.jpg",
  "blowout_after.jpg",
  "blowout_before.jpg",
  "color_cut.jpg",
  "work-01.png",
  "work-02.png",
  "work-03.png",
  "work-05.png",
  "work-07.png",
  "extensions_after-hero.jpg",
]);

async function emitWebp(file) {
  if (!KEY_WEBP.has(file)) return null;
  const ext = path.extname(file).toLowerCase();
  const srcPath = path.join(DIR, file);
  const webpPath = path.join(DIR, path.basename(file, ext) + ".webp");
  // Prefer regenerating hero webp from hero jpg after processing
  const before = fs.existsSync(webpPath) ? fs.statSync(webpPath).size : 0;
  await sharp(srcPath, { failOn: "none" })
    .webp({ quality: 82, effort: 5 })
    .toFile(webpPath + ".tmp");
  fs.renameSync(webpPath + ".tmp", webpPath);
  const after = fs.statSync(webpPath).size;
  return { file: path.basename(webpPath), beforeBytes: before, afterBytes: after };
}

async function main() {
  ensureDir(BACKUP);
  ensureDir(path.dirname(REPORT));

  const files = fs
    .readdirSync(DIR)
    .filter((f) => fs.statSync(path.join(DIR, f)).isFile())
    .filter((f) => IMAGE_EXT.has(path.extname(f).toLowerCase()))
    .sort();

  const report = { processed: [], webp: [], skippedMp4: [], errors: [] };

  for (const f of fs.readdirSync(DIR)) {
    if (path.extname(f).toLowerCase() === ".mp4") {
      const s = fs.statSync(path.join(DIR, f));
      report.skippedMp4.push({ file: f, bytes: s.size });
    }
  }

  for (const file of files) {
    try {
      const row = await processOne(file);
      if (row) report.processed.push(row);
      const w = await emitWebp(file);
      if (w) report.webp.push(w);
    } catch (err) {
      report.errors.push({ file, error: String(err) });
      console.error("FAIL", file, err);
    }
  }

  fs.writeFileSync(REPORT, JSON.stringify(report, null, 2));

  console.log("\n=== UPSCALED / SHARPENED ===");
  for (const r of report.processed) {
    const kbB = (r.beforeBytes / 1024).toFixed(1);
    const kbA = (r.afterBytes / 1024).toFixed(1);
    console.log(
      `${r.file}\t${r.before} → ${r.after}\t${kbB}KB → ${kbA}KB${r.upscaled ? " [up]" : ""}`
    );
  }
  console.log("\n=== WEBP ===");
  for (const r of report.webp) {
    console.log(`${r.file}\t${(r.afterBytes / 1024).toFixed(1)}KB`);
  }
  console.log("\n=== MP4 SKIPPED ===");
  for (const r of report.skippedMp4) {
    console.log(`${r.file}\t${(r.bytes / 1024).toFixed(1)}KB`);
  }
  if (report.errors.length) {
    console.log("\n=== ERRORS ===");
    console.log(report.errors);
    process.exitCode = 1;
  }
  console.log(`\nReport: ${REPORT}`);
}

main();
