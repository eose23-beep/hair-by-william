/**
 * Re-encode portfolio clips with mild upscale + unsharp/eq.
 * Backs up to public/portfolio/_originals/, overwrites in place.
 * Regenerates matching *-poster.jpg via ffmpeg frame + sharp.
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

/** 1.5× of 1024×576; cap height 1080 */
const TARGET_W = 1536;
const TARGET_H = 864;
const CRF = 21;

const SHARPEN = { sigma: 0.8, m1: 0.75, m2: 0.4, x1: 2, y2: 8, y3: 16 };
const MODULATE = { saturation: 1.07, brightness: 1.015 };

function ensureDir(d) {
  fs.mkdirSync(d, { recursive: true });
}

function ffprobeJson(file) {
  const out = execFileSync(
    "ffprobe",
    [
      "-v",
      "error",
      "-select_streams",
      "v:0",
      "-show_entries",
      "stream=width,height,codec_name,duration,bit_rate",
      "-show_entries",
      "format=size,duration",
      "-of",
      "json",
      file,
    ],
    { encoding: "utf8" }
  );
  return JSON.parse(out);
}

function encodeClip(input, output) {
  // Mild scale (lanczos), unsharp, subtle eq — natural salon skin/hair
  const vf = [
    `scale=${TARGET_W}:${TARGET_H}:flags=lanczos`,
    "unsharp=5:5:0.55:5:5:0.0",
    "eq=contrast=1.05:saturation=1.07:brightness=0.015",
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
      "-preset",
      "slow",
      "-movflags",
      "+faststart",
      "-an", // muted loops — drop audio to keep size down
      output,
    ],
    { stdio: "inherit" }
  );
}

function extractFrame(video, outJpg, durationSec) {
  const t = Math.max(0.4, Math.min(durationSec * 0.35, durationSec - 0.2));
  execFileSync(
    "ffmpeg",
    ["-y", "-ss", String(t.toFixed(2)), "-i", video, "-frames:v", "1", "-q:v", "2", outJpg],
    { stdio: "inherit" }
  );
}

async function polishPoster(rawJpg, destJpg) {
  const meta = await sharp(rawJpg, { failOn: "none" }).metadata();
  const w = meta.width || TARGET_W;
  const h = meta.height || TARGET_H;
  // Match prior poster portrait crop if source frame is landscape:
  // center-crop to ~9:16 then mild polish (keeps gallery portrait posters coherent)
  const targetRatio = 9 / 16;
  const srcRatio = w / h;
  let extract = null;
  if (srcRatio > targetRatio * 1.08) {
    const cropW = Math.round(h * targetRatio);
    const left = Math.max(0, Math.round((w - cropW) / 2));
    extract = { left, top: 0, width: Math.min(cropW, w), height: h };
  }

  let pipe = sharp(rawJpg, { failOn: "none" }).rotate();
  if (extract) pipe = pipe.extract(extract);

  const afterExtract = extract
    ? { w: extract.width, h: extract.height }
    : { w, h };
  const maxEdge = Math.max(afterExtract.w, afterExtract.h);
  const want = Math.min(1792, Math.round(maxEdge * (maxEdge < 1200 ? 1.5 : 1)));

  if (want !== maxEdge) {
    const scale = want / maxEdge;
    pipe = pipe.resize(
      Math.round(afterExtract.w * scale),
      Math.round(afterExtract.h * scale),
      { kernel: sharp.kernel.lanczos3 }
    );
  }

  await pipe
    .modulate(MODULATE)
    .sharpen(SHARPEN)
    .jpeg({ quality: 86, mozjpeg: true, chromaSubsampling: "4:4:4" })
    .toFile(destJpg + ".tmp");
  fs.renameSync(destJpg + ".tmp", destJpg);
}

async function main() {
  ensureDir(BACKUP);
  ensureDir(TMP);
  ensureDir(path.dirname(REPORT));

  const report = { videos: [], posters: [], errors: [] };

  for (const file of CLIPS) {
    try {
      const live = path.join(DIR, file);
      const bak = path.join(BACKUP, file);
      if (!fs.existsSync(live)) {
        report.errors.push({ file, error: "missing" });
        continue;
      }
      if (!fs.existsSync(bak)) {
        fs.copyFileSync(live, bak);
      }

      const before = ffprobeJson(bak);
      const bStream = before.streams?.[0] || {};
      const bFmt = before.format || {};
      const beforeBytes = Number(bFmt.size) || fs.statSync(bak).size;
      const beforeW = bStream.width;
      const beforeH = bStream.height;
      const duration = Number(bStream.duration || bFmt.duration || 5);

      const tmpOut = path.join(TMP, file);
      console.log(`\n=== Encoding ${file} (${beforeW}x${beforeH} → ${TARGET_W}x${TARGET_H}) ===`);
      encodeClip(bak, tmpOut);

      // Atomic replace
      fs.copyFileSync(tmpOut, live);
      fs.unlinkSync(tmpOut);

      const after = ffprobeJson(live);
      const aStream = after.streams?.[0] || {};
      const aFmt = after.format || {};
      const afterBytes = Number(aFmt.size) || fs.statSync(live).size;

      const row = {
        file,
        before: `${beforeW}x${beforeH}`,
        after: `${aStream.width}x${aStream.height}`,
        beforeBytes,
        afterBytes,
        beforeMB: +(beforeBytes / 1e6).toFixed(2),
        afterMB: +(afterBytes / 1e6).toFixed(2),
        crf: CRF,
        audio: "stripped (muted loop)",
      };
      report.videos.push(row);
      console.log(
        `${file}: ${row.before} → ${row.after} | ${row.beforeMB}MB → ${row.afterMB}MB`
      );

      // Poster
      const posterName = file.replace(".mp4", "-poster.jpg");
      const posterLive = path.join(DIR, posterName);
      const posterBak = path.join(BACKUP, posterName);
      if (fs.existsSync(posterLive) && !fs.existsSync(posterBak)) {
        fs.copyFileSync(posterLive, posterBak);
      }
      const rawFrame = path.join(TMP, posterName.replace(".jpg", "-frame.jpg"));
      extractFrame(live, rawFrame, duration);
      const beforePoster = fs.existsSync(posterBak)
        ? fs.statSync(posterBak).size
        : fs.existsSync(posterLive)
          ? fs.statSync(posterLive).size
          : 0;
      await polishPoster(rawFrame, posterLive);
      const afterPoster = fs.statSync(posterLive).size;
      const pMeta = await sharp(posterLive).metadata();
      report.posters.push({
        file: posterName,
        after: `${pMeta.width}x${pMeta.height}`,
        beforeBytes: beforePoster,
        afterBytes: afterPoster,
      });
      try {
        fs.unlinkSync(rawFrame);
      } catch {
        /* ignore */
      }
    } catch (err) {
      console.error("FAIL", file, err);
      report.errors.push({ file, error: String(err) });
    }
  }

  fs.writeFileSync(REPORT, JSON.stringify(report, null, 2));
  console.log("\nReport:", REPORT);
  if (report.errors.length) process.exitCode = 1;
}

main();
