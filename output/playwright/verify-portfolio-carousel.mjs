import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const out = __dirname;
await mkdir(out, { recursive: true });

const browser = await chromium.launch({ headless: true });

function portfolioSnap() {
  const sw = document.querySelector(".coverflow__swiper")?.swiper;
  const copy = document.querySelector(".portfolio-gallery__copy")?.textContent?.replace(/\s+/g, " ").trim();
  const stage = document.querySelector(".coverflow__stage");
  const stageStyle = stage ? getComputedStyle(stage) : null;
  const active = document.querySelector(".swiper-slide-active .coverflow__title");
  const videoTags = document.querySelectorAll(".coverflow__video-tag").length;
  return {
    hasSwiper: Boolean(sw),
    loop: Boolean(sw?.params?.loop),
    rewind: Boolean(sw?.params?.rewind),
    autoplayRunning: Boolean(sw?.autoplay?.running),
    activeIndex: sw?.activeIndex ?? null,
    slideCount: document.querySelectorAll(".swiper-slide").length,
    title: active?.textContent?.trim() || null,
    counter: document.querySelector(".coverflow__counter-current")?.textContent?.trim(),
    copy,
    videoTagsInDom: videoTags,
    stageBorder: stageStyle?.borderTopWidth,
    stageBg: stageStyle?.backgroundImage?.slice(0, 120) || null,
  };
}

async function shotPortfolio(page, name, viewport) {
  const box = await page.locator("#portfolio").boundingBox();
  if (!box) return;
  await page.screenshot({
    path: path.join(out, name),
    clip: {
      x: Math.max(0, box.x),
      y: Math.max(0, box.y),
      width: Math.min(viewport.width - Math.max(0, box.x), box.width),
      height: Math.min(viewport.height - Math.max(0, box.y), Math.min(box.height, 920)),
    },
  });
}

const warns = [];
const errs = [];
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
page.on("console", (m) => {
  if (m.type() === "error") errs.push(m.text());
  if (m.type() === "warning") warns.push(m.text());
});
page.on("pageerror", (e) => errs.push(e.message));

await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle" });
await page.locator("#portfolio").scrollIntoViewIfNeeded();
await page.waitForTimeout(800);

const t0 = await page.evaluate(portfolioSnap);
await shotPortfolio(page, "desk1440-portfolio-t0.png", { width: 1440, height: 900 });
await page.waitForTimeout(5200);
const t5 = await page.evaluate(portfolioSnap);
await shotPortfolio(page, "desk1440-portfolio-t5.png", { width: 1440, height: 900 });

await page.evaluate(() => {
  document.querySelector('.coverflow__nav[aria-label="Next work"]')?.click();
});
await page.waitForTimeout(900);
const after = await page.evaluate(portfolioSnap);
await shotPortfolio(page, "desk1440-portfolio-after-next.png", { width: 1440, height: 900 });

await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(200);
await page.screenshot({
  path: path.join(out, "desk1440-hero-top.png"),
  clip: { x: 0, y: 0, width: 1440, height: 720 },
});

await context.close();

const mobCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const mob = await mobCtx.newPage();
await mob.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle" });
await mob.locator("#portfolio").scrollIntoViewIfNeeded();
await mob.waitForTimeout(500);
const mobState = await mob.evaluate(portfolioSnap);
await shotPortfolio(mob, "mob390-portfolio.png", { width: 390, height: 844 });
await mob.evaluate(() => window.scrollTo(0, 0));
await mob.screenshot({
  path: path.join(out, "mob390-hero-top.png"),
  clip: { x: 0, y: 0, width: 390, height: 640 },
});
await mobCtx.close();
await browser.close();

const report = {
  t0,
  t5,
  after,
  mobState,
  autoplayAdvanced: t0.activeIndex !== t5.activeIndex,
  clickAdvanced: t5.activeIndex !== after.activeIndex,
  warns,
  errs,
  generatedAt: new Date().toISOString(),
};

await writeFile(path.join(out, "portfolio-carousel-verify.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
