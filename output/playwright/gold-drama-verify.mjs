import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const baseURL = process.env.AUDIT_URL || "http://127.0.0.1:4173";
const out = "output/playwright";

async function ribbonState(page) {
  return page.evaluate(() => {
    const ribbon = document.querySelector(".gold-ribbon--top");
    const shimmer = document.querySelector(".gold-ribbon__shimmer--top");
    const flash = document.querySelector(".gold-ribbon__flash--mid");
    const ink = document.querySelector(".gold-wave-field__ink");
    const fieldFlash = document.querySelector(".gold-wave-field__flash");
    const ribbonStyle = getComputedStyle(ribbon);
    const shimmerStyle = getComputedStyle(shimmer);
    const matrix = new DOMMatrixReadOnly(ribbonStyle.transform);
    return {
      animationName: ribbonStyle.animationName,
      animationDuration: ribbonStyle.animationDuration,
      transform: ribbonStyle.transform,
      translateX: Number(matrix.m41.toFixed(2)),
      translateY: Number(matrix.m42.toFixed(2)),
      shimmerAnimation: shimmerStyle.animationName,
      shimmerDuration: shimmerStyle.animationDuration,
      fieldOpacity: getComputedStyle(ink).opacity,
      hasFlashLayer: Boolean(fieldFlash),
      flashAnim: flash ? getComputedStyle(flash).animationName : null,
      crossRibbon: Boolean(document.querySelector(".gold-ribbon--cross")),
    };
  });
}

async function sampleGoldPixels(page) {
  return page.evaluate(() => {
    const canvas = document.createElement("canvas");
    const w = Math.min(window.innerWidth, 720);
    const h = Math.min(window.innerHeight, 480);
    canvas.width = w;
    canvas.height = h;
    // Approximate via computed gold stops + field presence (DOM check)
    const field = document.querySelector(".gold-wave-field");
    const bg = getComputedStyle(field).backgroundColor;
    const intensity = getComputedStyle(
      document.querySelector(".gold-wave-field__ink"),
    ).opacity;
    const stops = [...document.querySelectorAll("linearGradient#silk-fill-a stop")].map(
      (s) => ({
        color: s.getAttribute("stop-color"),
        opacity: s.getAttribute("stop-opacity"),
      }),
    );
    return { bg, intensity, stops, w, h };
  });
}

async function runViewport(browser, name, viewport) {
  const context = await browser.newContext({
    viewport,
    reducedMotion: "no-preference",
  });
  const page = await context.newPage();
  await page.goto(baseURL, { waitUntil: "networkidle" });

  const t0 = await ribbonState(page);
  const gold = await sampleGoldPixels(page);
  await page.screenshot({
    path: `${out}/${name}-gold-t0.png`,
    fullPage: false,
  });

  await page.waitForTimeout(1500);
  const t15 = await ribbonState(page);
  await page.screenshot({
    path: `${out}/${name}-gold-t15.png`,
    fullPage: false,
  });

  // Hero readability crop
  const hero = page.locator(".above-fold .hero, .hero").first();
  if (await hero.count()) {
    await hero.screenshot({ path: `${out}/${name}-hero-scrim.png` });
  }

  const moved =
    Math.abs(t15.translateX - t0.translateX) > 8 ||
    Math.abs(t15.translateY - t0.translateY) > 8 ||
    t0.transform !== t15.transform;

  await context.close();
  return { name, viewport, t0, t15, gold, moved };
}

await mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = [];
results.push(await runViewport(browser, "desk1440", { width: 1440, height: 900 }));
results.push(await runViewport(browser, "mob390", { width: 390, height: 844 }));
await browser.close();

const summary = {
  ok: results.every(
    (r) =>
      r.moved &&
      r.t0.hasFlashLayer &&
      r.t0.crossRibbon &&
      Number(r.gold.intensity) >= 0.8,
  ),
  results: results.map((r) => ({
    name: r.name,
    moved: r.moved,
    dx: Number((r.t15.translateX - r.t0.translateX).toFixed(1)),
    dy: Number((r.t15.translateY - r.t0.translateY).toFixed(1)),
    intensity: r.gold.intensity,
    duration: r.t0.animationDuration,
    shimmer: r.t0.shimmerDuration,
    flash: r.t0.hasFlashLayer,
    cross: r.t0.crossRibbon,
    fillA: r.gold.stops,
  })),
};

console.log(JSON.stringify(summary, null, 2));
if (!summary.ok) process.exit(1);
