/**
 * Desktop media sharpness + hair-forward focus derivatives.
 * Uses public assets (prefer already-oriented portfolio files) + sharp / ffmpeg.
 */
import sharp from "sharp";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PORT = path.join(ROOT, "public", "portfolio");

const JPG_Q = 86;
const WEBP_Q = 84;
const WEBP_Q_HERO = 88;

function exists(p) {
  return fs.existsSync(p);
}

function kb(p) {
  return (fs.statSync(p).size / 1024).toFixed(1);
}

/** Soft elliptical alpha matte (opaque = keep sharp hair zone). */
function ellipticalAlphaSvg(width, height, { cx, cy, rx, ry }) {
  return Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <defs>
    <radialGradient id="g" gradientUnits="userSpaceOnUse"
      cx="${cx * width}" cy="${cy * height}" r="${Math.max(rx * width, ry * height)}">
      <stop offset="0%" stop-color="#fff" stop-opacity="1"/>
      <stop offset="48%" stop-color="#fff" stop-opacity="1"/>
      <stop offset="68%" stop-color="#fff" stop-opacity="0.55"/>
      <stop offset="86%" stop-color="#fff" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="#fff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="100%" height="100%" fill="#000" fill-opacity="0"/>
  <ellipse cx="${cx * width}" cy="${cy * height}" rx="${rx * width}" ry="${ry * height}" fill="url(#g)"/>
</svg>`);
}

/**
 * Editorial faux-DoF: blurred surround + sharp hair ellipse.
 * Warm parchment/black crush on periphery — not neon green/purple.
 */
async function hairFocusComposite(inputPath, outBase, {
  width,
  height,
  left = 0,
  top = 0,
  extractW,
  extractH,
  cx = 0.62,
  cy = 0.36,
  rx = 0.34,
  ry = 0.46,
  blurSigma = 22,
  darken = 0.78,
}) {
  const meta = await sharp(inputPath).metadata();
  const ew = extractW || meta.width;
  const eh = extractH || meta.height;

  const cropped = await sharp(inputPath)
    .extract({ left, top, width: ew, height: eh })
    .resize(width, height, { fit: "fill", kernel: sharp.kernel.lanczos3 })
    .sharpen({ sigma: 0.7, m1: 0.6, m2: 0.35 })
    .toBuffer();

  const blurred = await sharp(cropped)
    .blur(blurSigma)
    .modulate({ brightness: darken, saturation: 0.88 })
    .toBuffer();

  const maskPng = await sharp(ellipticalAlphaSvg(width, height, { cx, cy, rx, ry }))
    .resize(width, height)
    .ensureAlpha()
    .png()
    .toBuffer();

  const maskedSharp = await sharp(cropped)
    .ensureAlpha()
    .composite([{ input: maskPng, blend: "dest-in" }])
    .png()
    .toBuffer();

  const focusBuf = await sharp(blurred)
    .composite([{ input: maskedSharp, blend: "over" }])
    .sharpen({ sigma: 0.55, m1: 0.5, m2: 0.28 })
    .toBuffer();

  await sharp(focusBuf)
    .jpeg({ quality: JPG_Q, mozjpeg: true, chromaSubsampling: "4:4:4" })
    .toFile(`${outBase}.jpg`);
  await sharp(focusBuf)
    .webp({ quality: WEBP_Q_HERO, effort: 5 })
    .toFile(`${outBase}.webp`);

  console.log(`  focus ${path.basename(outBase)} ${width}x${height} jpg=${kb(`${outBase}.jpg`)}KB webp=${kb(`${outBase}.webp`)}KB`);
}

async function optimizeHero() {
  console.log("\n== Hero desk crops + hair focus ==");
  const master = path.join(PORT, "extensions_after-hero.jpg");
  if (!exists(master)) throw new Error("missing hero master");

  const meta = await sharp(master).metadata();
  // Landscape desk crop from square master (matches prior framing)
  const cropH = Math.round(meta.width * (1405 / 2880));
  const top = Math.max(0, Math.round((meta.height - cropH) * 0.28));

  const targets = [
    { w: 2880, h: 1405, base: "extensions_after-hero-desk" },
    { w: 3600, h: 1757, base: "extensions_after-hero-desk-2x" },
  ];

  for (const t of targets) {
    const base = path.join(PORT, t.base);
    const pipe = sharp(master)
      .extract({ left: 0, top, width: meta.width, height: cropH })
      .resize(t.w, t.h, { fit: "fill", kernel: sharp.kernel.lanczos3 })
      .sharpen({ sigma: 0.85, m1: 0.7, m2: 0.4 });

    await pipe
      .clone()
      .jpeg({ quality: JPG_Q, mozjpeg: true, chromaSubsampling: "4:4:4" })
      .toFile(`${base}.jpg`);
    await pipe
      .clone()
      .webp({ quality: WEBP_Q_HERO, effort: 5 })
      .toFile(`${base}.webp`);
    console.log(`  ${t.base} ${t.w}x${t.h} jpg=${kb(`${base}.jpg`)}KB webp=${kb(`${base}.webp`)}KB`);

    // Hair-focus editorial variants (desk)
    await hairFocusComposite(master, path.join(PORT, `${t.base}-focus`), {
      width: t.w,
      height: t.h,
      left: 0,
      top,
      extractW: meta.width,
      extractH: cropH,
      cx: 0.66,
      cy: 0.38,
      rx: 0.32,
      ry: 0.48,
      blurSigma: 28,
      darken: 0.72,
    });
  }

  // Mobile square — write via temp (Windows can lock the live LCP file)
  const mobBase = path.join(PORT, "extensions_after-hero");
  const mobBuf = await sharp(master)
    .sharpen({ sigma: 0.65, m1: 0.55, m2: 0.3 })
    .toBuffer();
  const tmpJpg = `${mobBase}.tmp.jpg`;
  const tmpWebp = `${mobBase}.tmp.webp`;
  await sharp(mobBuf)
    .jpeg({ quality: JPG_Q, mozjpeg: true, chromaSubsampling: "4:4:4" })
    .toFile(tmpJpg);
  await sharp(mobBuf).webp({ quality: WEBP_Q_HERO, effort: 5 }).toFile(tmpWebp);
  try {
    fs.renameSync(tmpJpg, `${mobBase}.jpg`);
    fs.renameSync(tmpWebp, `${mobBase}.webp`);
  } catch {
    // Fallback: keep temps beside originals if replace is locked
    console.warn("  mobile hero locked — left .tmp.jpg/.tmp.webp beside originals");
  }
  if (exists(`${mobBase}.jpg`)) {
    console.log(`  mobile hero jpg=${kb(`${mobBase}.jpg`)}KB webp=${kb(`${mobBase}.webp`)}KB`);
  }
}

async function optimizeStill(name, {
  deskW = 1600,
  hairPos = { cx: 0.5, cy: 0.28 },
  makeFocus = false,
} = {}) {
  const candidates = [
    path.join(PORT, `${name}.png`),
    path.join(PORT, `${name}.jpg`),
    path.join(PORT, `${name}.webp`),
  ];
  const src = candidates.find(exists);
  if (!src) {
    console.log(`  skip ${name} (missing)`);
    return;
  }

  const meta = await sharp(src).metadata();
  const targetW = Math.min(deskW, Math.max(meta.width, Math.round(meta.width * 1.2)));
  // Cap upscale: never go beyond ~1.35× native public pixels (already upscaled from IG)
  const maxW = Math.round(meta.width * 1.25);
  const outW = Math.min(targetW, maxW);
  const outH = Math.round((meta.height / meta.width) * outW);

  const baseDesk = path.join(PORT, `${name}-desk`);
  const resized = sharp(src)
    .resize(outW, outH, { fit: "fill", kernel: sharp.kernel.lanczos3 })
    .sharpen({ sigma: 0.75, m1: 0.65, m2: 0.35 });

  const ext = name.startsWith("work-") ? "jpg" : "jpg";
  await resized
    .clone()
    .jpeg({ quality: JPG_Q, mozjpeg: true, chromaSubsampling: "4:4:4" })
    .toFile(`${baseDesk}.${ext}`);
  await resized
    .clone()
    .webp({ quality: WEBP_Q, effort: 5 })
    .toFile(`${baseDesk}.webp`);
  console.log(`  ${name}-desk ${outW}x${outH} jpg=${kb(`${baseDesk}.jpg`)}KB webp=${kb(`${baseDesk}.webp`)}KB`);

  // Refresh companion webp for original path at higher quality (via buffer)
  const origWebp = path.join(PORT, `${name}.webp`);
  const refreshBuf = await sharp(src)
    .sharpen({ sigma: 0.55, m1: 0.5, m2: 0.28 })
    .toBuffer();
  await sharp(refreshBuf).webp({ quality: WEBP_Q, effort: 5 }).toFile(origWebp);
  console.log(`  ${name}.webp refresh ${kb(origWebp)}KB`);

  if (makeFocus) {
    await hairFocusComposite(src, path.join(PORT, `${name}-desk-focus`), {
      width: outW,
      height: outH,
      cx: hairPos.cx,
      cy: hairPos.cy,
      rx: 0.4,
      ry: 0.48,
      blurSigma: 20,
      darken: 0.76,
    });
  }
}

async function optimizePosters() {
  console.log("\n== Clip posters (desk) ==");
  for (const id of ["clip-01", "clip-02", "clip-03", "clip-04"]) {
    const src = path.join(PORT, `${id}-poster.jpg`);
    if (!exists(src)) continue;
    const meta = await sharp(src).metadata();
    const outW = Math.min(1296, Math.round(meta.width * 1.28));
    const outH = Math.round((meta.height / meta.width) * outW);
    const base = path.join(PORT, `${id}-poster-desk`);
    const pipe = sharp(src)
      .resize(outW, outH, { fit: "fill", kernel: sharp.kernel.lanczos3 })
      .sharpen({ sigma: 0.8, m1: 0.7, m2: 0.38 });
    await pipe.clone().jpeg({ quality: JPG_Q, mozjpeg: true, chromaSubsampling: "4:4:4" }).toFile(`${base}.jpg`);
    await pipe.clone().webp({ quality: WEBP_Q, effort: 5 }).toFile(`${base}.webp`);
    console.log(`  ${id}-poster-desk ${outW}x${outH} jpg=${kb(`${base}.jpg`)}KB`);
  }
}

async function optimizeServiceStills() {
  console.log("\n== Service / try-on stills ==");
  for (const name of ["extensions_after", "extensions_before", "blowout_after", "blowout_before", "color_cut"]) {
    await optimizeStill(name, {
      deskW: name.includes("extensions_after") ? 1920 : 1600,
      hairPos: { cx: 0.5, cy: 0.22 },
      makeFocus: name === "extensions_after" || name === "blowout_after",
    });
  }
}

async function optimizeWorkStills() {
  console.log("\n== Lookbook work stills ==");
  for (const id of ["work-01", "work-02", "work-05", "work-07"]) {
    await optimizeStill(id, {
      deskW: 1680,
      hairPos: { cx: 0.5, cy: 0.24 },
      makeFocus: true,
    });
  }
}

function ffmpegAvailable() {
  try {
    execSync("ffmpeg -version", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function optimizeVideos() {
  console.log("\n== Videos desk re-encode (1080×1920) ==");
  if (!ffmpegAvailable()) {
    console.log("  ffmpeg missing — skip video re-encode");
    return;
  }

  for (const id of ["clip-01", "clip-02", "clip-03", "clip-04"]) {
    const src = path.join(PORT, `${id}.mp4`);
    const out = path.join(PORT, `${id}-desk.mp4`);
    if (!exists(src)) continue;

    // Upscale portrait 864×1536 → 1080×1920 with lanczos; CRF 22 keeps desk sharp without bloating
    const cmd = [
      "ffmpeg",
      "-y",
      "-i",
      `"${src}"`,
      "-vf",
      `"scale=1080:1920:flags=lanczos"`,
      "-c:v",
      "libx264",
      "-preset",
      "medium",
      "-crf",
      "22",
      "-profile:v",
      "high",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      "-an",
      `"${out}"`,
    ].join(" ");

    console.log(`  encoding ${id}-desk.mp4 ...`);
    execSync(cmd, { stdio: "inherit", shell: true });
    console.log(`  done ${id}-desk.mp4 ${(fs.statSync(out).size / 1024 / 1024).toFixed(2)}MB`);
  }
}

async function main() {
  console.log("optimize-desk-media starting…");
  const mode = process.argv[2] || "all";
  try {
    if (mode === "all" || mode === "hero") await optimizeHero();
  } catch (err) {
    console.warn("hero optimize warning:", err.message);
  }
  if (mode === "all" || mode === "stills") {
    await optimizeServiceStills();
    await optimizeWorkStills();
    await optimizePosters();
  }
  if (mode === "all" || mode === "videos") optimizeVideos();
  console.log("\nAll media derivatives written.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
