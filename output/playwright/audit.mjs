import { chromium } from "playwright";
import { writeFile } from "node:fs/promises";

const baseURL = process.env.AUDIT_URL || "http://127.0.0.1:4173";
const out = "output/playwright";
const results = {};

async function ribbonState(page) {
  return page.evaluate(() => {
    const ribbon = document.querySelector(".gold-ribbon--top");
    const shimmer = document.querySelector(".gold-ribbon__shimmer--top");
    const ink = document.querySelector(".gold-wave-field__ink");
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
      shimmerDashOffset: shimmerStyle.strokeDashoffset,
      fieldOpacity: getComputedStyle(ink).opacity,
    };
  });
}

async function auditViewport(browser, name, viewport) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto(baseURL, { waitUntil: "networkidle" });
  const motionStart = await ribbonState(page);
  await page.screenshot({ path: `${out}/${name}-ribbon-t0.png` });
  await page.waitForTimeout(3000);
  const motionEnd = await ribbonState(page);
  await page.screenshot({ path: `${out}/${name}-ribbon-t3.png` });

  const selectors = {
    header: ".nav-row",
    hero: ".above-fold",
    booking: "#contact",
    portfolioServices: "#services",
    bookingPanel: "#booking",
    locationFooter: "#visit",
    footer: ".site-footer",
  };
  for (const [label, selector] of Object.entries(selectors)) {
    const locator = page.locator(selector);
    await locator.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1100);
    const box = await locator.boundingBox();
    if (box) {
      const clip = {
        x: Math.max(0, box.x),
        y: Math.max(0, box.y),
        width: Math.min(viewport.width - Math.max(0, box.x), box.width),
        height: Math.min(viewport.height - Math.max(0, box.y), box.height),
      };
      if (clip.width > 0 && clip.height > 0) {
        await page.screenshot({ path: `${out}/${name}-${label}.png`, clip });
      }
    }
  }

  await page.screenshot({ path: `${out}/${name}-full.png`, fullPage: true });
  await page.evaluate(() => window.scrollTo(0, 0));

  const layout = await page.evaluate(() => {
    const rect = (selector) => {
      const node = document.querySelector(selector);
      if (!node) return null;
      const box = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return {
        left: Number(box.left.toFixed(1)),
        right: Number(box.right.toFixed(1)),
        top: Number(box.top.toFixed(1)),
        bottom: Number(box.bottom.toFixed(1)),
        width: Number(box.width.toFixed(1)),
        height: Number(box.height.toFixed(1)),
        fontSize: style.fontSize,
        fontWeight: style.fontWeight,
        lineHeight: style.lineHeight,
        visible: box.width > 0 && box.height > 0 && style.visibility !== "hidden",
      };
    };
    const overlaps = (selectorA, selectorB) => {
      const a = document.querySelector(selectorA)?.getBoundingClientRect();
      const b = document.querySelector(selectorB)?.getBoundingClientRect();
      if (!a || !b) return null;
      return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    };
    const images = [...document.images];
    const viewportWidth = document.documentElement.clientWidth;
    return {
      viewportWidth,
      documentScrollWidth: document.documentElement.scrollWidth,
      horizontalOverflow: document.documentElement.scrollWidth > viewportWidth + 1,
      header: rect(".nav-row"),
      brand: rect(".brand-mark"),
      phone: rect(".nav-phone"),
      book: rect(".nav-row .cta-small"),
      brandText: document.querySelector(".brand-mark")?.textContent?.trim(),
      phoneText: document.querySelector(".nav-phone")?.textContent?.trim(),
      phoneHref: document.querySelector(".nav-phone")?.getAttribute("href"),
      headerCollision: {
        brandPhone: overlaps(".brand-mark", ".nav-phone"),
        phoneBook: overlaps(".nav-phone", ".nav-row .cta-small"),
      },
      brokenImages: images
        .filter((image) => image.complete && image.naturalWidth === 0)
        .map((image) => image.currentSrc || image.src),
      clippedText: [...document.querySelectorAll("h1,h2,h3,p,a,button,label")]
        .filter((node) => {
          const style = getComputedStyle(node);
          const clips = ["hidden", "clip"].includes(style.overflow);
          return clips && (node.scrollWidth > node.clientWidth + 2 || node.scrollHeight > node.clientHeight + 2);
        })
        .map((node) => `${node.tagName}.${node.className}`)
        .slice(0, 20),
    };
  });

  await page.locator("#portfolio").scrollIntoViewIfNeeded();
  const counterBefore = await page.locator(".coverflow__counter").textContent();
  await page.getByRole("button", { name: "Next work" }).click();
  const counterAfter = await page.locator(".coverflow__counter").textContent();

  await page.locator("#contact").scrollIntoViewIfNeeded();
  await page.getByLabel("Your name *").fill("Playwright Review");
  await page.getByLabel("Your phone *").fill("915-555-0100");
  const bookingButtonsEnabled = await page
    .locator(".contact-form__actions button")
    .evaluateAll((buttons) => buttons.every((button) => !button.disabled));

  results[name] = {
    viewport,
    layout,
    motionStart,
    motionEnd,
    motionDelta: {
      translateX: Number((motionEnd.translateX - motionStart.translateX).toFixed(2)),
      translateY: Number((motionEnd.translateY - motionStart.translateY).toFixed(2)),
      shimmerDashOffsetChanged: motionEnd.shimmerDashOffset !== motionStart.shimmerDashOffset,
    },
    carousel: { counterBefore: counterBefore?.trim(), counterAfter: counterAfter?.trim() },
    bookingButtonsEnabled,
    consoleErrors,
    pageErrors,
  };
  await context.close();
}

const browser = await chromium.launch({ headless: true });
try {
  await auditViewport(browser, "desktop-1440x900", { width: 1440, height: 900 });
  await auditViewport(browser, "mobile-390x844", { width: 390, height: 844 });

  const reducedContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  });
  const reducedPage = await reducedContext.newPage();
  await reducedPage.goto(baseURL, { waitUntil: "networkidle" });
  results.reducedMotion = await reducedPage.evaluate(() => {
    const ribbon = getComputedStyle(document.querySelector(".gold-ribbon--top"));
    const shimmer = getComputedStyle(document.querySelector(".gold-ribbon__shimmer--top"));
    return {
      mediaMatches: matchMedia("(prefers-reduced-motion: reduce)").matches,
      ribbonAnimation: ribbon.animationName,
      shimmerAnimation: shimmer.animationName,
      transform: ribbon.transform,
    };
  });
  await reducedPage.screenshot({ path: `${out}/mobile-reduced-motion.png`, fullPage: true });
  await reducedContext.close();
} finally {
  await browser.close();
}

await writeFile(`${out}/audit-results.json`, `${JSON.stringify(results, null, 2)}\n`);
console.log(JSON.stringify(results, null, 2));
