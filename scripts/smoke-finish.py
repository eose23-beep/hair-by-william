from playwright.sync_api import sync_playwright
import json
import sys

URL = "http://127.0.0.1:5173/"
VIEWPORTS = [
    ("320", 320, 640),
    ("375", 375, 812),
    ("768", 768, 1024),
    ("1024", 1024, 768),
    ("1440", 1440, 900),
    ("1920", 1920, 1080),
]

EVAL_JS = """
() => {
  const doc = document.documentElement;
  const body = document.body;
  const scrollW = Math.max(doc.scrollWidth, body.scrollWidth);
  const overflowAmount = scrollW - window.innerWidth;
  const portfolio = document.querySelector('.portfolio-gallery-section');
  const services = [...document.querySelectorAll('.service-card__image')];
  const imagesLoaded = services.map((img) => ({
    src: img.getAttribute('src'),
    complete: img.complete,
    naturalWidth: img.naturalWidth,
  }));
  const portRect = portfolio ? portfolio.getBoundingClientRect() : null;
  const aboveFold = document.querySelector('.above-fold');
  const afRect = aboveFold ? aboveFold.getBoundingClientRect() : null;
  return {
    overflowX: overflowAmount > 1,
    overflowAmount,
    serviceImages: imagesLoaded,
    hasCoverflow: !!document.querySelector('.coverflow'),
    hasMap: !!document.querySelector('.map-section__embed'),
    bookCtas: document.querySelectorAll('a[href="#contact"]').length,
    portfolioInFirstViewport: portRect
      ? portRect.top < window.innerHeight && portRect.bottom > 0
      : false,
    portfolioTop: portRect ? Math.round(portRect.top) : null,
    aboveFoldHeight: afRect ? Math.round(afRect.height) : null,
    viewportH: window.innerHeight,
  };
}
"""

results = []
fails = []

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, channel="chrome")
    for name, w, h in VIEWPORTS:
        page = browser.new_page(viewport={"width": w, "height": h})
        page.goto(URL, wait_until="networkidle", timeout=30000)
        page.wait_for_timeout(900)
        data = page.evaluate(EVAL_JS)

        carousel_ok = False
        navs = page.locator(".coverflow__nav")
        if navs.count() > 0:
            navs.last.click(force=True)
            page.wait_for_timeout(350)
            carousel_ok = True
        elif page.locator(".coverflow__dot").count() > 1:
            page.locator(".coverflow__dot").nth(1).click(force=True)
            carousel_ok = True

        row = {"viewport": name, **data, "carouselOk": carousel_ok}
        results.append(row)

        if data["overflowX"]:
            fails.append(f"{name}: overflow-x {data['overflowAmount']}px")
        if not data["hasCoverflow"]:
            fails.append(f"{name}: missing coverflow")
        if not data["hasMap"]:
            fails.append(f"{name}: missing map")
        if data["bookCtas"] < 2:
            fails.append(f"{name}: few booking CTAs ({data['bookCtas']})")
        if not carousel_ok:
            fails.append(f"{name}: carousel click failed")
        if int(name) >= 1024 and not data["portfolioInFirstViewport"]:
            fails.append(f"{name}: portfolio not in first viewport")
        bad = [i["src"] for i in data["serviceImages"] if not i["naturalWidth"]]
        if bad:
            fails.append(f"{name}: broken service images {','.join(bad)}")
        if len(data["serviceImages"]) < 4:
            fails.append(f"{name}: expected 4 service images, got {len(data['serviceImages'])}")

        page.close()
    browser.close()

print(json.dumps(results, indent=2))
if fails:
    print("\nFAILS:\n" + "\n".join(fails), file=sys.stderr)
    sys.exit(1)
print("\nALL SMOKE CHECKS PASSED")
