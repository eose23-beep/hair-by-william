/**
 * Verify GoldWaveField ribbons are present, gold-visible, and animating.
 * Usage: node scripts/verify-gold-ribbons.mjs
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "tmp", "ribbon-verify");
mkdirSync(OUT, { recursive: true });

const VIEWPORTS = [
  { name: "desktop-1440", width: 1440, height: 900 },
  { name: "mobile-390", width: 390, height: 844 },
];

function scoreGold(pixels) {
  // pixels: Uint8ClampedArray RGBA
  let goldish = 0;
  let nonWhite = 0;
  const total = pixels.length / 4;
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const a = pixels[i + 3];
    if (a < 8) continue;
    const nearWhite = r > 248 && g > 248 && b > 248;
    if (!nearWhite) nonWhite += 1;
    // Metallic gold: warm yellow — R high, G mid-high, B lower
    const isGold =
      r > 160 &&
      g > 110 &&
      b < 160 &&
      r - b > 40 &&
      g - b > 20 &&
      Math.abs(r - g) < 90;
    if (isGold) goldish += 1;
  }
  return {
    total,
    goldish,
    nonWhite,
    goldRatio: goldish / total,
    nonWhiteRatio: nonWhite / total,
  };
}

function pixelDiff(a, b) {
  let changed = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i += 4) {
    const dr = Math.abs(a[i] - b[i]);
    const dg = Math.abs(a[i + 1] - b[i + 1]);
    const db = Math.abs(a[i + 2] - b[i + 2]);
    if (dr + dg + db > 18) changed += 1;
  }
  return { changed, ratio: changed / (n / 4) };
}

async function inspectPage(page, label) {
  const diagnostics = await page.evaluate(() => {
    const field = document.querySelector(".gold-wave-field");
    const svg = document.querySelector(".gold-wave-field__svg");
    const ink = document.querySelector(".gold-wave-field__ink");
    const ribbons = [...document.querySelectorAll(".gold-ribbon")];
    const paths = [...document.querySelectorAll(".gold-wave-field path")];
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const cs = (el) => (el ? getComputedStyle(el) : null);
    const fieldCs = cs(field);
    const inkCs = cs(ink);
    const ribbonStyles = ribbons.map((r) => {
      const s = getComputedStyle(r);
      return {
        className: r.className.baseVal || r.className,
        opacity: s.opacity,
        animationName: s.animationName,
        animationPlayState: s.animationPlayState,
        animationDuration: s.animationDuration,
        transform: s.transform,
        display: s.display,
        visibility: s.visibility,
      };
    });

    const pathSample = paths.slice(0, 4).map((p) => ({
      stroke: p.getAttribute("stroke"),
      strokeWidth: p.getAttribute("strokeWidth") || p.getAttribute("stroke-width"),
      fill: p.getAttribute("fill"),
      bbox: (() => {
        try {
          const b = p.getBBox();
          return { x: b.x, y: b.y, w: b.width, h: b.height };
        } catch {
          return null;
        }
      })(),
    }));

    return {
      reduceMotion: reduce,
      fieldExists: !!field,
      svgExists: !!svg,
      pathCount: paths.length,
      ribbonCount: ribbons.length,
      field: fieldCs
        ? {
            opacity: fieldCs.opacity,
            zIndex: fieldCs.zIndex,
            display: fieldCs.display,
            visibility: fieldCs.visibility,
            width: fieldCs.width,
            height: fieldCs.height,
            backgroundColor: fieldCs.backgroundColor,
            position: fieldCs.position,
          }
        : null,
      inkOpacity: inkCs?.opacity ?? null,
      ribbonStyles,
      pathSample,
      bodyBg: getComputedStyle(document.body).backgroundColor,
      rootBg: getComputedStyle(document.documentElement).backgroundColor,
    };
  });

  const shot0 = join(OUT, `${label}-t0.png`);
  const shot1 = join(OUT, `${label}-t2s.png`);
  await page.screenshot({ path: shot0, fullPage: false });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: shot1, fullPage: false });

  // Sample pixels via canvas from screenshots in page context is hard;
  // decode with playwright buffer instead.
  const buf0 = await page.screenshot({ type: "png" });
  // Re-read t0 from file for fair compare — take fresh pair:
  await page.screenshot({ path: shot0, fullPage: false });
  const png0 = await page.screenshot({ type: "png", fullPage: false });
  await page.waitForTimeout(2000);
  const png1 = await page.screenshot({ type: "png", fullPage: false });
  await page.screenshot({ path: shot1, fullPage: false });

  // Use sharp-less decode via createImageBitmap in a fresh page
  const pixelAnalysis = await page.evaluate(
    async ({ b64a, b64b }) => {
      async function decode(b64) {
        const bin = atob(b64);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        const blob = new Blob([bytes], { type: "image/png" });
        const bmp = await createImageBitmap(blob);
        const canvas = document.createElement("canvas");
        canvas.width = bmp.width;
        canvas.height = bmp.height;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(bmp, 0, 0);
        return {
          w: bmp.width,
          h: bmp.height,
          data: Array.from(ctx.getImageData(0, 0, bmp.width, bmp.height).data),
        };
      }
      const a = await decode(b64a);
      const b = await decode(b64b);
      return { a, b };
    },
    {
      b64a: png0.toString("base64"),
      b64b: png1.toString("base64"),
    },
  );

  const pixels0 = Uint8ClampedArray.from(pixelAnalysis.a.data);
  const pixels1 = Uint8ClampedArray.from(pixelAnalysis.b.data);
  const gold0 = scoreGold(pixels0);
  const gold1 = scoreGold(pixels1);
  const diff = pixelDiff(pixels0, pixels1);

  return {
    label,
    diagnostics,
    gold0,
    gold1,
    diff,
    shots: { t0: shot0, t2s: shot1 },
  };
}

const browser = await chromium.launch({ headless: true });
const report = [];

for (const vp of VIEWPORTS) {
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    reducedMotion: "no-preference",
    colorScheme: "light",
  });
  const page = await context.newPage();
  await page.goto("http://localhost:5173/", { waitUntil: "networkidle" });
  await page.waitForSelector(".gold-wave-field", { timeout: 10000 });
  const result = await inspectPage(page, vp.name);
  report.push(result);
  await context.close();
}

await browser.close();

const summaryPath = join(OUT, "report.json");
writeFileSync(summaryPath, JSON.stringify(report, null, 2));

console.log("=== Gold Ribbon Verification ===");
for (const r of report) {
  console.log(`\n[${r.label}]`);
  console.log(
    JSON.stringify(
      {
        fieldExists: r.diagnostics.fieldExists,
        pathCount: r.diagnostics.pathCount,
        inkOpacity: r.diagnostics.inkOpacity,
        reduceMotion: r.diagnostics.reduceMotion,
        field: r.diagnostics.field,
        ribbons: r.diagnostics.ribbonStyles,
        goldRatio_t0: r.gold0.goldRatio,
        goldPixels_t0: r.gold0.goldish,
        nonWhiteRatio_t0: r.gold0.nonWhiteRatio,
        goldRatio_t2: r.gold1.goldRatio,
        changedPixels: r.diff.changed,
        changeRatio: r.diff.ratio,
        shots: r.shots,
      },
      null,
      2,
    ),
  );
}
console.log(`\nFull report: ${summaryPath}`);

const failed = report.filter(
  (r) =>
    !r.diagnostics.fieldExists ||
    r.diagnostics.pathCount < 4 ||
    r.gold0.goldish < 80 ||
    r.diff.changed < 40,
);
process.exit(failed.length ? 1 : 0);
