import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { A11y, EffectCoverflow, Keyboard } from "swiper/modules";
import { portfolioSlides } from "../data/portfolio";
import AmbientVideo from "./AmbientVideo";

import "swiper/css";
import "swiper/css/effect-coverflow";

/** φ-tuned lookbook motion — custom autoplay (not Swiper Autoplay) for reliable advance */
const AUTOPLAY_MS = 4800;
const SLIDE_SPEED_MS = 820;

/** Constrained 3D coverflow — readable rotateY without stage blowout */
const COVERFLOW_3D = {
  rotate: 38,
  stretch: -44,
  depth: 220,
  modifier: 1.02,
  slideShadows: false,
};

/** Near-flat coverflow on phones — avoids 3D/atmosphere compositor flicker */
const COVERFLOW_MOBILE = {
  rotate: 0,
  stretch: -12,
  depth: 24,
  modifier: 1,
  slideShadows: false,
};

const COVERFLOW_FLAT = {
  rotate: 0,
  stretch: 0,
  depth: 0,
  modifier: 1,
  slideShadows: false,
};

/** Inline gallery glyphs — cream/gold via currentColor; no Lucide. */
function IconChevronLeft({ size = 20 }) {
  return (
    <svg
      className="gallery-icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M15 18 9 12l6-6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconChevronRight({ size = 20 }) {
  return (
    <svg
      className="gallery-icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="m9 18 6-6-6-6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconClose({ size = 22 }) {
  return (
    <svg
      className="gallery-icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M18 6 6 18M6 6l12 12"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function wrapIndex(index, length) {
  return ((index % length) + length) % length;
}

function slideAriaLabel(slide, index, total) {
  const kind = slide.type === "video" ? "Video" : "Image";
  return `${kind} slide ${index + 1} of ${total}: ${slide.title}. ${slide.alt}`;
}

/** Prefer sibling .webp only when a known companion exists in /public/portfolio. */
const WEBP_IDS = new Set([
  "work-01",
  "work-02",
  "work-05",
  "work-07",
  "extensions-before",
  "extensions-after",
]);

function webpSibling(slide) {
  if (!slide?.src || typeof slide.src !== "string") return null;
  if (!WEBP_IDS.has(slide.id)) return null;
  if (/\.webp$/i.test(slide.src)) return slide.src;
  return slide.src.replace(/\.(png|jpe?g)$/i, ".webp");
}

/** Resolve #clip-01 / #portfolio-clip-01 / #portfolio?clip=01 style hashes to a slide index. */
function slideIndexFromHash(hash = typeof window !== "undefined" ? window.location.hash : "") {
  const raw = String(hash || "")
    .replace(/^#/, "")
    .trim();
  if (!raw || raw === "portfolio") return null;

  const queryMatch = raw.match(/^portfolio\?(?:.*&)?clip=([0-9a-z-]+)/i);
  if (queryMatch) {
    const clipId = queryMatch[1].startsWith("clip-") ? queryMatch[1] : `clip-${queryMatch[1]}`;
    const byQuery = portfolioSlides.findIndex((slide) => slide.id === clipId);
    if (byQuery >= 0) return byQuery;
  }

  const normalized = raw.replace(/^portfolio-/, "");
  const candidates = [raw, normalized];
  const clipMatch = raw.match(/(?:^|-)(clip-\d+)$/i);
  if (clipMatch) candidates.push(clipMatch[1]);

  for (const id of candidates) {
    const index = portfolioSlides.findIndex((slide) => slide.id === id);
    if (index >= 0) return index;
  }
  return null;
}

/** Remeasure after layout — grid min-content can inflate before first paint. */
function recenterSwiper(instance, targetIndex) {
  if (!instance || instance.destroyed) return;
  instance.updateSize();
  instance.updateSlides();
  instance.updateProgress();
  instance.updateSlidesClasses();
  const idx =
    typeof targetIndex === "number" ? targetIndex : (instance.activeIndex ?? 0);
  instance.slideTo(idx, 0);
}

export default function PortfolioGallery() {
  const hashIndex = slideIndexFromHash();
  const [active, setActive] = useState(() => hashIndex ?? 0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [stageInView, setStageInView] = useState(false);
  const [hoverPaused, setHoverPaused] = useState(false);
  const [focusPaused, setFocusPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [narrowMobile, setNarrowMobile] = useState(false);
  const [autoplayTick, setAutoplayTick] = useState(0);
  const stageRef = useRef(null);
  const swiperRef = useRef(null);
  const lightboxCloseRef = useRef(null);
  const dragGuardRef = useRef(false);
  const liveRegionId = useId();
  const lightboxTitleId = useId();
  const lightboxCaptionId = useId();
  const count = portfolioSlides.length;
  const activeSlide = portfolioSlides[active];
  const progress = ((active + 1) / count) * 100;

  const autoplayEnabled =
    !reduceMotion && !lightboxOpen && stageInView && !hoverPaused && !focusPaused;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(mq.matches);
    sync();
    mq.addEventListener?.("change", sync);
    return () => mq.removeEventListener?.("change", sync);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setNarrowMobile(mq.matches);
    sync();
    mq.addEventListener?.("change", sync);
    return () => mq.removeEventListener?.("change", sync);
  }, []);

  const coverflowEffect = reduceMotion
    ? COVERFLOW_FLAT
    : narrowMobile
      ? COVERFLOW_MOBILE
      : COVERFLOW_3D;

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setStageInView(entry.isIntersecting && entry.intersectionRatio >= 0.18);
      },
      { threshold: [0, 0.18, 0.35, 0.55], rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  const goTo = useCallback(
    (next) => {
      const index = wrapIndex(next, count);
      const swiper = swiperRef.current;
      if (swiper && !swiper.destroyed) {
        swiper.slideTo(index, SLIDE_SPEED_MS);
      } else {
        setActive(index);
      }
    },
    [count],
  );

  const goPrev = useCallback(() => {
    const swiper = swiperRef.current;
    if (swiper && !swiper.destroyed) swiper.slidePrev(SLIDE_SPEED_MS);
    else setActive((prev) => wrapIndex(prev - 1, count));
  }, [count]);

  const goNext = useCallback(() => {
    const swiper = swiperRef.current;
    if (swiper && !swiper.destroyed) swiper.slideNext(SLIDE_SPEED_MS);
    else setActive((prev) => wrapIndex(prev + 1, count));
  }, [count]);

  /** Reliable custom autoplay — resets pace on each slide; pauses when gated off */
  useEffect(() => {
    if (!autoplayEnabled) return undefined;

    const timer = window.setInterval(() => {
      const swiper = swiperRef.current;
      if (!swiper || swiper.destroyed) return;
      if (swiper.animating) return;
      swiper.slideNext(SLIDE_SPEED_MS);
    }, AUTOPLAY_MS);

    setAutoplayTick((n) => n + 1);

    return () => window.clearInterval(timer);
  }, [autoplayEnabled, active]);

  useEffect(() => {
    const applyHashSlide = () => {
      const index = slideIndexFromHash();
      if (index == null) return;
      setActive(index);
      const swiper = swiperRef.current;
      if (swiper && !swiper.destroyed) {
        swiper.slideTo(index, 0);
      }
      /* Ensure lookbook is in view for #clip-* deep-links (App hash handler also scrolls) */
      const portfolio = document.getElementById("portfolio");
      if (portfolio) {
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const rect = portfolio.getBoundingClientRect();
        const inView = rect.top < window.innerHeight * 0.72 && rect.bottom > 80;
        if (!inView) {
          portfolio.scrollIntoView({
            behavior: reduce ? "auto" : "smooth",
            block: "start",
          });
        }
      }
    };

    applyHashSlide();
    window.addEventListener("hashchange", applyHashSlide);
    return () => window.removeEventListener("hashchange", applyHashSlide);
  }, []);

  const openLightbox = (index) => {
    setActive(index);
    setLightboxOpen(true);
    document.body.style.overflow = "hidden";
  };

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
    document.body.style.overflow = "";
    stageRef.current?.querySelector(".coverflow__nav")?.focus?.();
  }, []);

  useEffect(() => {
    if (!lightboxOpen) return undefined;
    const previousFocus = document.activeElement;
    lightboxCloseRef.current?.focus();
    return () => {
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, [lightboxOpen]);

  useEffect(() => {
    if (!lightboxOpen) return undefined;

    const onKey = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeLightbox();
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goPrev();
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        goNext();
      }
      if (event.key === "Tab") {
        const root = document.querySelector(".lightbox.is-open");
        if (!root) return;
        const focusable = root.querySelectorAll(
          'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxOpen, closeLightbox, goPrev, goNext]);

  const onSlideActivate = (swiper) => {
    const next =
      typeof swiper.realIndex === "number" ? swiper.realIndex : swiper.activeIndex;
    setActive(next);
  };

  const handleSlideClick = (index) => {
    if (dragGuardRef.current) return;
    if (index === active) openLightbox(index);
    else goTo(index);
  };

  return (
    <>
      <section
        id="portfolio"
        className="shell section portfolio-gallery-section"
        aria-label="William portfolio"
      >
        <div className="portfolio-deep-links" aria-hidden="true">
          {portfolioSlides
            .filter((slide) => slide.type === "video")
            .map((slide) => (
              <span key={slide.id} id={slide.id} />
            ))}
        </div>
        <header className="portfolio-gallery__intro motion-block">
          <span className="portfolio-gallery__hairline" aria-hidden="true" />
          <h2 className="section-heading portfolio-gallery__heading">Salon Lookbook</h2>
          <p className="portfolio-gallery__copy">
            From extension reveal to classic blowout: texture, length, and tone, finished in the
            chair.
          </p>
        </header>

        <p id={liveRegionId} className="sr-only" aria-live="polite" aria-atomic="true">
          {activeSlide ? slideAriaLabel(activeSlide, active, count) : ""}
        </p>

        <div
          ref={stageRef}
          className={`coverflow lookbook portfolio-gallery__stage lookbook--3d${
            autoplayEnabled ? " is-autoplaying" : " is-paused"
          }${reduceMotion ? " lookbook--flat" : ""}`}
          role="region"
          aria-roledescription="carousel"
          aria-label="Salon portfolio carousel"
          aria-describedby={liveRegionId}
        >
          <div
            className="coverflow__stage lookbook__stage"
            onPointerEnter={() => setHoverPaused(true)}
            onPointerLeave={() => setHoverPaused(false)}
          >
            <span className="lookbook__rim" aria-hidden="true" />
            <Swiper
              className="coverflow__swiper lookbook__swiper"
              modules={[EffectCoverflow, Keyboard, A11y]}
              effect="coverflow"
              coverflowEffect={coverflowEffect}
              grabCursor
              centeredSlides
              slidesPerView="auto"
              spaceBetween={0}
              rewind
              speed={reduceMotion ? 0 : narrowMobile ? 560 : SLIDE_SPEED_MS}
              watchSlidesProgress
              initialSlide={hashIndex ?? 0}
              keyboard={{
                enabled: true,
                onlyInViewport: true,
              }}
              a11y={{
                enabled: true,
                prevSlideMessage: "Previous work",
                nextSlideMessage: "Next work",
              }}
              onSwiper={(instance) => {
                swiperRef.current = instance;
                const start =
                  typeof instance.realIndex === "number"
                    ? instance.realIndex
                    : instance.activeIndex;
                setActive(start);
                const target = hashIndex ?? start ?? 0;
                requestAnimationFrame(() => {
                  recenterSwiper(instance, target);
                  requestAnimationFrame(() => recenterSwiper(instance, target));
                });
                window.setTimeout(() => recenterSwiper(instance, target), 80);
                window.setTimeout(() => recenterSwiper(instance, target), 240);
              }}
              onDestroy={() => {
                swiperRef.current = null;
              }}
              onSlideChange={onSlideActivate}
              onRealIndexChange={onSlideActivate}
              onResize={(instance) => {
                recenterSwiper(instance, instance.activeIndex);
              }}
              onSliderFirstMove={() => {
                dragGuardRef.current = true;
              }}
              onTouchEnd={() => {
                window.setTimeout(() => {
                  dragGuardRef.current = false;
                }, 40);
              }}
              onTransitionEnd={() => {
                dragGuardRef.current = false;
              }}
            >
              {portfolioSlides.map((slide, index) => {
                const isCenter = index === active;
                const webp = webpSibling(slide);
                return (
                  <SwiperSlide key={slide.id} className="coverflow__slide lookbook__slide">
                    <button
                      type="button"
                      className={`coverflow__card${isCenter ? " is-active" : ""}${
                        slide.type === "video" ? " coverflow__card--video" : " coverflow__card--still"
                      }${isCenter && slide.type === "video" ? " is-playing" : ""}${
                        index === 0 ? " coverflow__card--hook" : ""
                      }`}
                      onClick={() => handleSlideClick(index)}
                      aria-label={slideAriaLabel(slide, index, count)}
                      aria-current={isCenter ? "true" : undefined}
                      tabIndex={isCenter ? 0 : -1}
                    >
                      <div className="coverflow__frame">
                        <span className="coverflow__corners" aria-hidden="true" />
                        {slide.type === "video" ? (
                          <AmbientVideo
                            className="coverflow__media"
                            src={slide.src}
                            poster={slide.poster}
                            ariaLabel={slide.alt}
                            preload={Math.abs(index - active) <= 1 ? "metadata" : "none"}
                            active={isCenter && stageInView && !lightboxOpen}
                          />
                        ) : webp ? (
                          <picture className="coverflow__picture">
                            <source srcSet={webp} type="image/webp" />
                            <img
                              className="coverflow__media"
                              src={slide.src}
                              alt={slide.alt}
                              loading={Math.abs(index - active) < 2 ? "eager" : "lazy"}
                              decoding="async"
                              draggable={false}
                              onError={(event) => {
                                const img = event.currentTarget;
                                if (img.dataset.fallbackApplied === "1") return;
                                img.dataset.fallbackApplied = "1";
                                img.removeAttribute("srcset");
                                img.src = slide.src;
                              }}
                            />
                          </picture>
                        ) : (
                          <img
                            className="coverflow__media"
                            src={slide.src}
                            alt={slide.alt}
                            loading={Math.abs(index - active) < 2 ? "eager" : "lazy"}
                            decoding="async"
                            draggable={false}
                          />
                        )}
                        <span className="coverflow__caption">
                          <span className="coverflow__title">{slide.title}</span>
                          <span className="coverflow__subtitle">{slide.caption}</span>
                          {isCenter ? (
                            <span className="coverflow__cta" aria-hidden="true">
                              Tap to enlarge
                            </span>
                          ) : null}
                        </span>
                      </div>
                    </button>
                  </SwiperSlide>
                );
              })}
            </Swiper>
          </div>

          <div
            className="coverflow__rail"
            onFocusCapture={() => setFocusPaused(true)}
            onBlurCapture={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) {
                setFocusPaused(false);
              }
            }}
          >
            <div className="coverflow__controls">
              <button
                type="button"
                className="coverflow__nav"
                onClick={goPrev}
                aria-label="Previous work"
              >
                <IconChevronLeft />
              </button>
              <p className="coverflow__counter" aria-hidden="true">
                <span className="coverflow__counter-current">
                  {String(active + 1).padStart(2, "0")}
                </span>
                <span className="coverflow__counter-sep"> / </span>
                <span className="coverflow__counter-total">
                  {String(count).padStart(2, "0")}
                </span>
              </p>
              <button
                type="button"
                className="coverflow__nav"
                onClick={goNext}
                aria-label="Next work"
              >
                <IconChevronRight />
              </button>
            </div>

            <div
              className="coverflow__filmstrip"
              role="tablist"
              aria-label="Select lookbook slide"
            >
              <div
                className="coverflow__filmstrip-track"
                aria-hidden="true"
                style={{ "--film-progress": `${progress}%` }}
              />
              {autoplayEnabled ? (
                <div
                  key={`autoplay-progress-${autoplayTick}-${active}`}
                  className="coverflow__autoplay-bar"
                  aria-hidden="true"
                  style={{ "--autoplay-ms": `${AUTOPLAY_MS}ms` }}
                />
              ) : null}
              {portfolioSlides.map((slide, index) => (
                <button
                  key={slide.id}
                  type="button"
                  role="tab"
                  aria-selected={index === active}
                  aria-label={slideAriaLabel(slide, index, count)}
                  className={`coverflow__tick${index === active ? " is-active" : ""}${
                    slide.type === "video" ? " coverflow__tick--video" : ""
                  }`}
                  onClick={() => goTo(index)}
                />
              ))}
            </div>

            <p className="coverflow__book-line">
              <a className="coverflow__book-link" href="#contact-form">
                Book
              </a>
              <span className="coverflow__book-sep" aria-hidden="true">
                ·
              </span>
              <a className="coverflow__book-link coverflow__book-link--ghost" href="tel:915-920-7823">
                Call
              </a>
            </p>
          </div>
        </div>
      </section>

      <div
        className={`lightbox${lightboxOpen ? " is-open" : ""}`}
        onClick={closeLightbox}
        aria-hidden={!lightboxOpen}
        role="dialog"
        aria-modal="true"
        aria-labelledby={lightboxTitleId}
        aria-describedby={lightboxCaptionId}
      >
        <button
          ref={lightboxCloseRef}
          className="lightbox__close"
          onClick={closeLightbox}
          aria-label="Close portfolio media"
          type="button"
        >
          <IconClose />
        </button>
        <div className="lightbox__content" onClick={(event) => event.stopPropagation()}>
          {activeSlide ? (
            <figure className="lightbox__figure">
              {activeSlide.type === "video" ? (
                <AmbientVideo
                  className="lightbox__image lightbox__video"
                  src={activeSlide.src}
                  poster={activeSlide.poster}
                  ariaLabel={activeSlide.alt}
                  preload="metadata"
                  active={lightboxOpen}
                />
              ) : (
                (() => {
                  const webp = webpSibling(activeSlide);
                  return webp ? (
                    <picture>
                      <source srcSet={webp} type="image/webp" />
                      <img
                        className="lightbox__image"
                        src={activeSlide.src}
                        alt={activeSlide.alt}
                        loading="eager"
                      />
                    </picture>
                  ) : (
                    <img
                      className="lightbox__image"
                      src={activeSlide.src}
                      alt={activeSlide.alt}
                      loading="eager"
                    />
                  );
                })()
              )}
              <figcaption className="lightbox__caption">
                <span id={lightboxTitleId} className="lightbox__title">
                  {activeSlide.title}
                </span>
                <span id={lightboxCaptionId} className="lightbox__subtitle">
                  {activeSlide.caption}
                </span>
                <a className="lightbox__book" href="#contact-form" onClick={closeLightbox}>
                  Book
                </a>
              </figcaption>
              <div className="lightbox__nav">
                <button
                  type="button"
                  className="coverflow__nav"
                  onClick={goPrev}
                  aria-label="Previous portfolio item"
                >
                  <IconChevronLeft />
                </button>
                <button
                  type="button"
                  className="coverflow__nav"
                  onClick={goNext}
                  aria-label="Next portfolio item"
                >
                  <IconChevronRight />
                </button>
              </div>
            </figure>
          ) : null}
        </div>
      </div>
    </>
  );
}
