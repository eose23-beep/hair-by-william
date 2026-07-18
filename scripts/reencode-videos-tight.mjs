/**
 * Re-encode clips to stay ~3–5MB; restore posters from _originals via sharp (not video frames).
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DIR = path.join(ROOT, "public", "portfolio");
const BACKUP = path.join(DIR, "_originals");
const REPORT = path.join(ROOT, "scripts", "output", "video-enhance-report.json");
const TMP = path.join(ROOT, "scripts", "output", "_video_tmp");

const CLIPS = ["clip-01.mp4", "clip-02.mp4", "clip-03.mp4", "clip-04.mp4"];
const TARGET_W = 1536;
const TARGET_H = 864;
const CRF = 24;

const SHARPEN = { sigma: 0.85, m1: 0.8, m2: 0.45, x1: 2, y2: 8, y3: 16 };
const MODULATE = { saturation: 1.08, brightness: 1.02 };

function ensureDir(d) {
  fs.mkdirSync(d, { recursive: true });
}

function ffprobeJson(file) {
  return JSON.parse(
    execFileSync(
      "ffprobe",
      [
        "-v",
        "error",
        "-select_streams",
        "v:0",
        "-show_entries",
        "stream=width,height,duration",
        "-show_entries",
        "format=size,duration",
        "-of",
        "json",
        file,
      ],
      { encoding: "utf8" }
    )
  );
}

function encodeClip(input, output) {
  const vf = [
    `scale=${TARGET_W}:${TARGET_H}:flags=lanczos`,
    "unsharp=5:5:0.5:5:5:0.0",
    "eq=contrast=1.05:saturation=1.06:brightness=0.012",
  ].join(",");

  execFileSync(
    "ffmpeg",
    [
      "-y",
      "-i",
      input,
      "-vf",
      vf,
      "-c:v",
      "libx264",
      "-profile:v",
      "high",
      "-level",
      "4.1",
      "-pix_fmt",
      "yuv420p",
      "-crf",
      String(CRF),
      "-maxrate",
      "2800k",
      "-bufsize",
      "5600k",
      "-preset",
      "slow",
      "-movflags",
      "+faststart",
      "-an",
      output,
    ],
    { stdio: "inherit" }
  );
}

async function restorePoster(name) {
  const bak = path.join(BACKUP, name);
  const dest = path.join(DIR, name);
  if (!fs.existsSync(bak)) return null;
  const beforeBytes = fs.statSync(bak).size;
  const meta = await sharp(bak, { failOn: "none" }).metadata();
  const w = meta.width || 0;
  const h = meta.height || 0;
  const maxDim = Math.max(w, h);
  const scale = maxDim < 1400 ? Math.min(1.75, 2800 / maxDim) : 1;
  const tw = Math.round(w * scale);
  const th = Math.round(h * scale);

  let pipe = sharp(bak, { failOn: "none" }).rotate();
  if (scale !== 1) {
    pipe = pipe.resize(tw, th, { kernel: sharp.kernel.lanczos3 });
  }
  await pipe
    .modulate(MODULATE)
    .sharpen(SHARPEN)
    .jpeg({ quality: 86, mozjpeg: true, chromaSubsampling: "4:4:4" })
    .toFile(dest + ".tmp");
  fs.renameSync(dest + ".tmp", dest);
  const after = await sharp(dest).metadata();
  return {
    file: name,
    before: `${w}x${h}`,
    after: `${after.width}x${after.height}`,
    beforeBytes,
    afterBytes: fs.statSync(dest).size,
  };
}

async function main() {
  ensureDir(TMP);
  const report = { videos: [], posters: [], errors: [], crf: CRF };

  for (const file of CLIPS) {
    try {
      const bak = path.join(BACKUP, file);
      const live = path.join(DIR, file);
      if (!fs.existsSync(bak)) {
        report.errors.push({ file, error: "no backup" });
        continue;
      }
      const before = ffprobeJson(bak);
      const bStream = before.streams?.[0] || {};
      const beforeBytes = Number(before.format?.size) || fs.statSync(bak).size;
      const tmpOut = path.join(TMP, file);
      console.log(`\n=== Re-encode ${file} CRF${CRF} + maxrate ===`);
      encodeClip(bak, tmpOut);
      fs.copyFileSync(tmpOut, live);
      fs.unlinkSync(tmpOut);
      const after = ffprobeJson(live);
      const afterBytes = Number(after.format?.size) || fs.statSync(live).size;
      const row = {
        file,
        before: `${bStream.width}x${bStream.height}`,
        after: `${after.streams?.[0]?.width}x${after.streams?.[0]?.height}`,
        beforeBytes,
        afterBytes,
        beforeMB: +(beforeBytes / 1e6).toFixed(2),
        afterMB: +(afterBytes / 1e6).toFixed(2),
      };
      report.videos.push(row);
      console.log(`${file}: ${row.beforeMB}MB → ${row.afterMB}MB`);
    } catch (err) {
      report.errors.push({ file, error: String(err) });
      console.error(err);
    }
  }

  for (const p of [
    "clip-01-poster.jpg",
    "clip-02-poster.jpg",
    "clip-03-poster.jpg",
    "clip-04-poster.jpg",
  ]) {
    try {
      const row = await restorePoster(p);
      if (row) report.posters.push(row);
    } catch (err) {
      report.errors.push({ file: p, error: String(err) });
    }
  }

  fs.writeFileSync(REPORT, JSON.stringify(report, null, 2));
  console.log("\n", JSON.stringify(report, null, 2));
  if (report.errors.length) process.exitCode = 1;
}

main();
