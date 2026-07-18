import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const baseURL = process.env.AUDIT_URL || "http://127.0.0.1:5173/";
const out = "output/playwright";

await mkdir(out, { recursive: true });

const browser = await chromium.launch({ headless: true });

async function shoot(name, viewport) {
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  await page.goto(baseURL, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(800);

  // Hard refresh equivalent: bypass cache reload
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(600);

  const heroSrc = await page.locator(".hero-stage__media img").getAttribute("src");
  const objectPosition = await page.locator(".hero-stage__media img").evaluate((el) =>
    getComputedStyle(el).objectPosition,
  );

  await page.screenshot({
    path: `${out}/${name}.png`,
    fullPage: false,
  });

  await context.close();
  return { name, heroSrc, objectPosition, viewport };
}

const desktop = await shoot("hero-desktop-1440", { width: 1440, height: 900 });
const mobile = await shoot("hero-mobile-390", { width: 390, height: 844 });

console.log(JSON.stringify({ desktop, mobile, baseURL }, null, 2));
await browser.close();
