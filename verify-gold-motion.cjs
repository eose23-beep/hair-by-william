const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const outDir = path.join(__dirname, ".verify-tmp");
fs.mkdirSync(outDir, { recursive: true });

async function checkViewport(browser, name, width, height) {
  const context = await browser.newContext({
    viewport: { width, height },
    reducedMotion: "no-preference",
  });
  const page = await context.newPage();
  await page.goto("http://localhost:5173/", { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(1500);

  const shotA = path.join(outDir, `${name}-t0.png`);
  const shotB = path.join(outDir, `${name}-t3.png`);
  await page.screenshot({ path: shotA, fullPage: false });

  const anim1 = await page.evaluate(() => {
    const field = document.querySelector(".gold-wave-field");
    const layers = [...document.querySelectorAll(".gold-wave-layer")];
    const paths = [...document.querySelectorAll(".gold-wave-field path, .gold-wave-layer path, svg path")];
    const sample = layers.length ? layers : paths.slice(0, 6);
    const styles = sample.map((el, i) => {
      const cs = getComputedStyle(el);
      return {
        i,
        tag: el.tagName,
        className: el.className?.baseVal || el.className || "",
        animationName: cs.animationName,
        animationDuration: cs.animationDuration,
        animationPlayState: cs.animationPlayState,
        transform: cs.transform,
      };
    });
    // Also check any animated descendants
    const allAnimated = [...document.querySelectorAll("*")].filter((el) => {
      const n = getComputedStyle(el).animationName;
      return n && n !== "none";
    }).slice(0, 12).map((el) => {
      const cs = getComputedStyle(el);
      return {
        tag: el.tagName,
        className: String(el.className?.baseVal || el.className || "").slice(0, 80),
        animationName: cs.animationName,
        animationDuration: cs.animationDuration,
        animationPlayState: cs.animationPlayState,
        transform: cs.transform,
      };
    });
    return {
      hasField: !!field,
      fieldDisplay: field ? getComputedStyle(field).display : null,
      fieldOpacity: field ? getComputedStyle(field).opacity : null,
      layerCount: layers.length,
      pathCount: paths.length,
      styles,
      allAnimated,
      title: document.title,
      h1: document.querySelector("h1")?.textContent?.trim() || null,
      readableTextSample: (document.body?.innerText || "").slice(0, 400),
      portfolioOrCarousel: !!(
        document.querySelector("[class*='carousel'], [class*='portfolio'], [class*='gallery'], .swiper, [data-carousel]")
        || [...document.querySelectorAll("section, div")].some((el) => /portfolio|gallery|work|carousel/i.test(el.className + " " + (el.id || "")))
      ),
    };
  });

  await page.waitForTimeout(3000);

  const anim2 = await page.evaluate(() => {
    const layers = [...document.querySelectorAll(".gold-wave-layer")];
    const sample = layers.length ? layers : [...document.querySelectorAll(".gold-wave-field path, svg path")].slice(0, 6);
    return sample.map((el, i) => {
      const cs = getComputedStyle(el);
      return { i, transform: cs.transform, animationPlayState: cs.animationPlayState, animationName: cs.animationName };
    });
  });

  await page.screenshot({ path: shotB, fullPage: false });

  // Compare pixel buffers for motion evidence
  const bufA = fs.readFileSync(shotA);
  const bufB = fs.readFileSync(shotB);
  const filesDiffer = !bufA.equals(bufB);

  // Compare transforms
  const transformChanged = anim1.styles.some((s, idx) => {
    const b = anim2[idx];
    return b && s.transform !== b.transform;
  });

  // Content checks: scroll to look for portfolio
  await page.evaluate(() => window.scrollTo(0, Math.min(1200, document.body.scrollHeight)));
  await page.waitForTimeout(500);
  const content = await page.evaluate(() => {
    const text = document.body?.innerText || "";
    return {
      hasBrand: /william|hair/i.test(text),
      hasPortfolioCue: /portfolio|gallery|work|look|cut|style/i.test(text),
      imgCount: document.images.length,
      brokenImgs: [...document.images].filter((img) => !img.complete || img.naturalWidth === 0).length,
      buttons: [...document.querySelectorAll("button, a")].slice(0, 8).map((el) => el.textContent?.trim()).filter(Boolean),
    };
  });
  const contentShot = path.join(outDir, `${name}-scrolled.png`);
  await page.screenshot({ path: contentShot, fullPage: false });

  await context.close();
  return {
    name,
    width,
    height,
    shotA,
    shotB,
    contentShot,
    filesDiffer,
    transformChanged,
    motionVisible: filesDiffer || transformChanged,
    animPlaying: anim1.allAnimated.some((a) => a.animationPlayState === "running") ||
      anim1.styles.some((s) => s.animationPlayState === "running" && s.animationName !== "none"),
    anim1,
    anim2,
    content,
  };
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const desktop = await checkViewport(browser, "desktop-1280", 1280, 800);
  const mobile = await checkViewport(browser, "mobile-390", 390, 844);
  await browser.close();
  const report = { desktop, mobile, url: "http://localhost:5173/" };
  fs.writeFileSync(path.join(outDir, "report.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({
    url: report.url,
    desktop: {
      motionVisible: desktop.motionVisible,
      filesDiffer: desktop.filesDiffer,
      transformChanged: desktop.transformChanged,
      animPlaying: desktop.animPlaying,
      hasField: desktop.anim1.hasField,
      layerCount: desktop.anim1.layerCount,
      allAnimated: desktop.anim1.allAnimated,
      title: desktop.anim1.title,
      h1: desktop.anim1.h1,
      content: desktop.content,
      shots: [desktop.shotA, desktop.shotB, desktop.contentShot],
    },
    mobile: {
      motionVisible: mobile.motionVisible,
      filesDiffer: mobile.filesDiffer,
      transformChanged: mobile.transformChanged,
      animPlaying: mobile.animPlaying,
      hasField: mobile.anim1.hasField,
      layerCount: mobile.anim1.layerCount,
      allAnimated: mobile.anim1.allAnimated,
      content: mobile.content,
      shots: [mobile.shotA, mobile.shotB, mobile.contentShot],
    },
  }, null, 2));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
