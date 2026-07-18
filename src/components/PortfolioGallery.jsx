import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { A11y, Autoplay, EffectCoverflow, Keyboard } from "swiper/modules";
import { portfolioSlides } from "../data/portfolio";
import AmbientVideo from "./AmbientVideo";

import "swiper/css";
import "swiper/css/effect-coverflow";

/** φ-tuned lookbook motion — Fib-adjacent delay, ease-out luxury curve */
const AUTOPLAY_MS = 4500;
const SLIDE_SPEED_MS = 720;

/** Soft coverflow — readable side peeks, not razor-thin 3D */
const COVERFLOW_DESKTOP = {
  rotate: 8,
  stretch: 12,
  depth: 72,
  modifier: 1,
  slideShadows: false,
};

const COVERFLOW_MOBILE = {
  rotate: 0,
  stretch: 0,
  depth: 28,
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

/** Prefer sibling .webp when media agent has upscaled stills. */
function webpSibling(src) {
  if (!src || typeof src !== "string") return null;
  if (/\.webp$/i.test(src)) return src;
  return src.replace(/\.(png|jpe?g)$/i, ".webp");
}

/** Resolve #clip-01 / #portfolio-clip-01 / #portfolio?clip=01 style hashes to a slide index. */
function slideIndexFromHash(hash = typeof window !== "undefined" ? window.location.hash : "") {
  const raw = String(hash || "").replace(/^#/, "").trim();
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

function syncAutoplay(swiper, shouldRun) {
  if (!swiper?.autoplay) return;
  if (shouldRun) {
    if (!swiper.autoplay.running) swiper.autoplay.start();
  } else if (swiper.autoplay.running) {
    swiper.autoplay.stop();
  }
}

export default function PortfolioGallery() {
  const hashIndex = slideIndexFromHash();
  const [active, setActive] = useState(() => hashIndex ?? 0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [stageInView, setStageInView] = useState(true);
  const [hoverPaused, setHoverPaused] = useState(false);
  const [focusPaused, setFocusPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
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
    const stage = stageRef.current;
    if (!stage) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setStageInView(entry.isIntersecting && entry.intersectionRatio > 0.2);
      },
      { threshold: [0, 0.2, 0.45] },
    );
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    syncAutoplay(swiperRef.current, autoplayEnabled);
  }, [autoplayEnabled]);

  const goTo = useCallback((next) => {
    const index = wrapIndex(next, count);
    const swiper = swiperRef.current;
    if (swiper && !swiper.destroyed) {
      swiper.slideTo(index);
    } else {
      setActive(index);
    }
  }, [count]);

  const goPrev = useCallback(() => {
    const swiper = swiperRef.current;
    if (swiper && !swiper.destroyed) swiper.slidePrev();
    else setActive((prev) => wrapIndex(prev - 1, count));
  }, [count]);

  const goNext = useCallback(() => {
    const swiper = swiperRef.current;
    if (swiper && !swiper.destroyed) swiper.slideNext();
    else setActive((prev) => wrapIndex(prev + 1, count));
  }, [count]);

  useEffect(() => {
    const applyHashSlide = () => {
      const index = slideIndexFromHash();
      if (index == null) return;
      setActive(index);
      const swiper = swiperRef.current;
      if (!swiper || swiper.destroyed) return;
      swiper.slideTo(index, 0);
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
    setActive(typeof swiper.realIndex === "number" ? swiper.realIndex : swiper.activeIndex);
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
          <p className="lookbook-tag portfolio-gallery__kicker">Portfolio</p>
          <span className="portfolio-gallery__hairline" aria-hidden="true" />
          <h2 className="section-heading portfolio-gallery__heading">Salon Lookbook</h2>
          <p className="portfolio-gallery__copy">
            Chair finishes across texture, length, and tone — extensions, precision cuts,
            and dimensional color.
          </p>
        </header>

        <p id={liveRegionId} className="sr-only" aria-live="polite" aria-atomic="true">
          {activeSlide ? slideAriaLabel(activeSlide, active, count) : ""}
        </p>

        <div
          ref={stageRef}
          className={`coverflow portfolio-gallery__stage${autoplayEnabled ? "" : " is-paused"}`}
          role="region"
          aria-roledescription="carousel"
          aria-label="Salon portfolio carousel"
          aria-describedby={liveRegionId}
          onPointerEnter={() => setHoverPaused(true)}
          onPointerLeave={() => setHoverPaused(false)}
        >
          <div className="coverflow__stage">
            <Swiper
              className="coverflow__swiper"
              modules={[EffectCoverflow, Autoplay, Keyboard, A11y]}
              effect="coverflow"
              grabCursor
              centeredSlides
              slidesPerView="auto"
              /* loop + slidesPerView:auto needs more slides than we ship — rewind wraps instead */
              rewind
              observer
              observeParents
              speed={SLIDE_SPEED_MS}
              watchSlidesProgress
              initialSlide={hashIndex ?? 0}
              coverflowEffect={COVERFLOW_DESKTOP}
              breakpoints={{
                0: {
                  coverflowEffect: COVERFLOW_MOBILE,
                },
                768: {
                  coverflowEffect: COVERFLOW_DESKTOP,
                },
              }}
              autoplay={
                reduceMotion
                  ? false
                  : {
                      delay: AUTOPLAY_MS,
                      disableOnInteraction: false,
                      pauseOnMouseEnter: true,
                    }
              }
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
                setActive(instance.activeIndex);
                syncAutoplay(instance, autoplayEnabled);
              }}
              onDestroy={() => {
                swiperRef.current = null;
              }}
              onSlideChange={onSlideActivate}
              onRealIndexChange={onSlideActivate}
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
                return (
                  <SwiperSlide key={slide.id} className="coverflow__slide">
                    <button
                      type="button"
                      className={`coverflow__card${isCenter ? " is-active" : ""}${
                        slide.type === "video" ? " coverflow__card--video" : ""
                      }${isCenter && slide.type === "video" ? " is-playing" : ""}`}
                      onClick={() => handleSlideClick(index)}
                      aria-label={slideAriaLabel(slide, index, count)}
                      aria-current={isCenter ? "true" : undefined}
                      tabIndex={isCenter ? 0 : -1}
                    >
                      <div className="coverflow__frame">
                        {slide.type === "video" ? (
                          <AmbientVideo
                            className="coverflow__media"
                            src={slide.src}
                            poster={slide.poster}
                            ariaLabel={slide.alt}
                            preload={isCenter ? "metadata" : "none"}
                            active={isCenter && stageInView && !lightboxOpen}
                          />
                        ) : (
                          <picture className="coverflow__picture">
                            <source srcSet={webpSibling(slide.src)} type="image/webp" />
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
                                img.src = "/portfolio/work-01.png";
                              }}
                            />
                          </picture>
                        )}
                        <span className="coverflow__caption">
                          <span className="coverflow__title">{slide.title}</span>
                          <span className="coverflow__subtitle">{slide.caption}</span>
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
                <picture>
                  <source srcSet={webpSibling(activeSlide.src)} type="image/webp" />
                  <img
                    className="lightbox__image"
                    src={activeSlide.src}
                    alt={activeSlide.alt}
                    loading="eager"
                  />
                </picture>
              )}
              <figcaption className="lightbox__caption">
                <span id={lightboxTitleId} className="lightbox__title">
                  {activeSlide.title}
                </span>
                <span id={lightboxCaptionId} className="lightbox__subtitle">
                  {activeSlide.caption}
                </span>
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
