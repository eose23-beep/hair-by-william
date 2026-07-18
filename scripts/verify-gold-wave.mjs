import { chromium } from "playwright";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "output", "playwright");
fs.mkdirSync(outDir, { recursive: true });

const BASE = "http://127.0.0.1:5173/";

async function capture(label, viewport) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    reducedMotion: "no-preference",
  });
  const page = await context.newPage();
  await page.goto(BASE, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForSelector(".gold-wave-field", { timeout: 15000 });
  await page.waitForSelector(".hero-title-primary", { timeout: 15000 });

  const t0 = path.join(outDir, `${label}-t0.png`);
  await page.screenshot({ path: t0, fullPage: false });

  await page.waitForTimeout(1500);

  const t15 = path.join(outDir, `${label}-t1.5s.png`);
  await page.screenshot({ path: t15, fullPage: false });

  const metrics = await page.evaluate(() => {
    const field = document.querySelector(".gold-wave-field");
    const mid = document.querySelector(".gold-ribbon--mid");
    const title = document.querySelector(".hero-title-primary");
    const style = mid ? getComputedStyle(mid) : null;
    const matrix = style?.transform || "none";
    const overflowX = document.documentElement.scrollWidth > window.innerWidth + 2;
    const titleColor = title ? getComputedStyle(title).color : null;
    const fieldBg = field ? getComputedStyle(field).backgroundColor : null;
    return {
      hasField: !!field,
      hasMidRibbon: !!mid,
      transform: matrix,
      overflowX,
      titleColor,
      fieldBg,
      titleText: title?.textContent?.trim() || "",
    };
  });

  // Second sample after more time to confirm transform changes
  await page.waitForTimeout(800);
  const transform2 = await page.evaluate(() => {
    const mid = document.querySelector(".gold-ribbon--mid");
    return mid ? getComputedStyle(mid).transform : "none";
  });

  await browser.close();
  return { t0, t15, metrics, transform2 };
}

const results = {};
results.desktop = await capture("desktop-1440", { width: 1440, height: 900 });
results.mobile = await capture("mobile-390", { width: 390, height: 844 });

const summary = {
  ok:
    results.desktop.metrics.hasField &&
    results.mobile.metrics.hasField &&
    !results.desktop.metrics.overflowX &&
    !results.mobile.metrics.overflowX &&
    results.desktop.metrics.transform !== results.desktop.transform2,
  desktop: {
    motionChanged: results.desktop.metrics.transform !== results.desktop.transform2,
    transformA: results.desktop.metrics.transform,
    transformB: results.desktop.transform2,
    overflowX: results.desktop.metrics.overflowX,
    title: results.desktop.metrics.titleText,
    shots: [results.desktop.t0, results.desktop.t15],
  },
  mobile: {
    motionChanged: results.mobile.metrics.transform !== results.mobile.transform2,
    transformA: results.mobile.metrics.transform,
    transformB: results.mobile.transform2,
    overflowX: results.mobile.metrics.overflowX,
    title: results.mobile.metrics.titleText,
    shots: [results.mobile.t0, results.mobile.t15],
  },
};

fs.writeFileSync(path.join(outDir, "gold-wave-verify.json"), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
