/**
 * Bake -90° rotation into portrait 864×1536, CRF24, web-friendly size.
 * Writes via temp then atomic replace (Windows-safe).
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DIR = path.join(ROOT, "public", "portfolio");
const BACKUP = path.join(DIR, "_originals");
const TMP = path.join(ROOT, "scripts", "output", "_video_tmp");
const REPORT = path.join(ROOT, "scripts", "output", "video-enhance-report.json");

const CLIPS = ["clip-01.mp4", "clip-02.mp4", "clip-03.mp4", "clip-04.mp4"];
// After transpose(-90 → portrait): 576×1024 → 1.5× = 864×1536
const OUT_W = 864;
const OUT_H = 1536;
const CRF = 24;

function ensureDir(d) {
  fs.mkdirSync(d, { recursive: true });
}

function probe(file) {
  return JSON.parse(
    execFileSync(
      "ffprobe",
      [
        "-v",
        "error",
        "-select_streams",
        "v:0",
        "-show_entries",
        "stream=width,height",
        "-show_entries",
        "format=size",
        "-of",
        "json",
        file,
      ],
      { encoding: "utf8" }
    )
  );
}

function replaceFile(src, dest) {
  const bakTmp = dest + ".oldswap";
  try {
    if (fs.existsSync(dest)) {
      try {
        fs.renameSync(dest, bakTmp);
      } catch {
        fs.unlinkSync(dest);
      }
    }
    fs.renameSync(src, dest);
  } finally {
    if (fs.existsSync(bakTmp)) {
      try {
        fs.unlinkSync(bakTmp);
      } catch {
        /* ignore */
      }
    }
  }
}

function encode(input, output) {
  // display matrix -90 → transpose=1 (90° CW) for upright portrait (matches posters)
  const vf = [
    "transpose=1",
    `scale=${OUT_W}:${OUT_H}:flags=lanczos`,
    "unsharp=5:5:0.5:5:5:0.0",
    "eq=contrast=1.05:saturation=1.06:brightness=0.012",
  ].join(",");

  execFileSync(
    "ffmpeg",
    [
      "-y",
      "-noautorotate",
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
      "2600k",
      "-bufsize",
      "5200k",
      "-preset",
      "slow",
      "-movflags",
      "+faststart",
      "-an",
      "-metadata:s:v:0",
      "rotate=0",
      output,
    ],
    { stdio: "inherit" }
  );
}

ensureDir(TMP);
const report = { videos: [], errors: [], note: "portrait 864x1536 baked rotation, CRF24" };

for (const file of CLIPS) {
  try {
    const bak = path.join(BACKUP, file);
    const live = path.join(DIR, file);
    const tmp = path.join(TMP, `portrait-${file}`);
    if (!fs.existsSync(bak)) throw new Error("missing backup");

    const beforeBytes = fs.statSync(bak).size;
    const beforeP = probe(bak);
    console.log(`\n=== ${file} portrait bake ===`);
    encode(bak, tmp);
    replaceFile(tmp, live);
    const afterP = probe(live);
    const afterBytes = fs.statSync(live).size;
    const row = {
      file,
      codedBefore: `${beforeP.streams[0].width}x${beforeP.streams[0].height} (+rot -90)`,
      after: `${afterP.streams[0].width}x${afterP.streams[0].height}`,
      beforeMB: +(beforeBytes / 1e6).toFixed(2),
      afterMB: +(afterBytes / 1e6).toFixed(2),
      beforeBytes,
      afterBytes,
    };
    report.videos.push(row);
    console.log(`${file}: ${row.beforeMB}MB → ${row.afterMB}MB | ${row.after}`);
  } catch (err) {
    console.error(err);
    report.errors.push({ file, error: String(err) });
  }
}

fs.writeFileSync(REPORT, JSON.stringify(report, null, 2));
console.log("\nFINAL", JSON.stringify(report, null, 2));
if (report.errors.length) process.exitCode = 1;
