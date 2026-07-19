import sharp from "sharp";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const dir = "public/portfolio";
const files = fs.readdirSync(dir).filter((f) => /\.(jpe?g|png|webp|avif)$/i.test(f));
const rows = [];
for (const f of files) {
  const p = path.join(dir, f);
  const meta = await sharp(p).metadata();
  const kb = (fs.statSync(p).size / 1024).toFixed(1);
  rows.push({
    file: f,
    w: meta.width,
    h: meta.height,
    format: meta.format,
    kb: Number(kb),
  });
}
rows.sort((a, b) => a.file.localeCompare(b.file));
console.log(JSON.stringify(rows, null, 2));

const od = path.join(dir, "_originals");
if (fs.existsSync(od)) {
  console.log("\n--- originals ---");
  const walk = (d, prefix = "") => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, e.name);
      if (e.isDirectory()) walk(full, `${prefix}${e.name}/`);
      else {
        const st = fs.statSync(full);
        let dims = "";
        if (/\.(jpe?g|png|webp)$/i.test(e.name)) {
          try {
            // sync via await outside — use sharp sync metadata in top-level later
          } catch {}
        }
        console.log(`${prefix}${e.name}\t${(st.size / 1024).toFixed(1)}KB`);
      }
    }
  };
  walk(od);

  // dimensions for originals
  const all = [];
  const collect = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, e.name);
      if (e.isDirectory()) collect(full);
      else if (/\.(jpe?g|png|webp|avif)$/i.test(e.name)) all.push(full);
    }
  };
  collect(od);
  for (const p of all) {
    const meta = await sharp(p).metadata();
    console.log(
      `DIM ${path.relative(od, p)}: ${meta.width}x${meta.height} ${(fs.statSync(p).size / 1024).toFixed(1)}KB`,
    );
  }
}

// video probe
console.log("\n--- videos ---");
for (const c of ["clip-01", "clip-02", "clip-03", "clip-04"]) {
  const p = path.join(dir, `${c}.mp4`);
  if (!fs.existsSync(p)) continue;
  try {
    const out = execSync(
      `ffprobe -v error -select_streams v:0 -show_entries stream=width,height,bit_rate,codec_name -show_entries format=bit_rate,duration,size -of json "${p}"`,
      { encoding: "utf8" },
    );
    const j = JSON.parse(out);
    const s = j.streams?.[0] || {};
    const f = j.format || {};
    console.log(
      `${c}: ${s.width}x${s.height} codec=${s.codec_name} vbr=${s.bit_rate} fmt_br=${f.bit_rate} dur=${f.duration} sizeMB=${(Number(f.size) / 1024 / 1024).toFixed(2)}`,
    );
  } catch (e) {
    console.log(`${c}: ffprobe failed — ${(fs.statSync(p).size / 1024 / 1024).toFixed(2)}MB only`);
  }
}
