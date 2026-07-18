import { useCallback, useEffect, useId, useRef, useState } from "react";
import { portfolioSlides } from "../data/portfolio";
import AmbientVideo from "./AmbientVideo";

/** Inline gallery glyphs — cream/gold via currentColor; no icon-font / Lucide dependency. */
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

function IconPlay({ size = 10 }) {
  return (
    <svg
      className="gallery-icon gallery-icon--play"
      width={size}
      height={size}
      viewBox="0 0 12 12"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M3.2 1.6v8.8L10.4 6 3.2 1.6Z" />
    </svg>
  );
}

const AUTO_ADVANCE_MS = 5600;

const DEFAULT_METRICS = {
  visibleSpan: 1.85,
  translateSpan: 38,
  rotateY: 22,
  translateZ: 48,
  scaleStep: 0.14,
  blurMax: 7,
  dimAmount: 0.42,
  dragThreshold: 48,
  dragNorm: 260,
};

function getCarouselMetrics(width) {
  if (width <= 767) {
    return {
      visibleSpan: 0.95,
      translateSpan: 88,
      rotateY: 0,
      translateZ: 0,
      scaleStep: 0.08,
      blurMax: 4,
      dimAmount: 0.35,
      dragThreshold: width <= 390 ? 24 : 32,
      dragNorm: width <= 390 ? 140 : 180,
    };
  }
  if (width <= 1023) {
    return {
      visibleSpan: 1.55,
      translateSpan: 46,
      rotateY: 20,
      translateZ: 42,
      scaleStep: 0.13,
      blurMax: 6,
      dimAmount: 0.4,
      dragThreshold: 44,
      dragNorm: 220,
    };
  }
  return DEFAULT_METRICS;
}

function wrapIndex(index, length) {
  return ((index % length) + length) % length;
}

function isControlTarget(target) {
  return Boolean(
    target.closest?.(
      ".coverflow__controls, .coverflow__filmstrip, .coverflow__nav, .coverflow__tick",
    ),
  );
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

export default function PortfolioGallery() {
  const [active, setActive] = useState(() => slideIndexFromHash() ?? 0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [metrics, setMetrics] = useState(DEFAULT_METRICS);
  const [stageInView, setStageInView] = useState(true);
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const stageRef = useRef(null);
  const lightboxCloseRef = useRef(null);
  const dragRef = useRef({ active: false, startX: 0, startY: 0, lastX: 0, pointerId: null });
  const liveRegionId = useId();
  const lightboxTitleId = useId();
  const lightboxCaptionId = useId();
  const count = portfolioSlides.length;
  const activeSlide = portfolioSlides[active];

  useEffect(() => {
    const syncMetrics = () => setMetrics(getCarouselMetrics(window.innerWidth));
    syncMetrics();
    window.addEventListener("resize", syncMetrics, { passive: true });
    return () => window.removeEventListener("resize", syncMetrics);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(mq.matches);
    sync();
    mq.addEventListener?.("change", sync);
    return () => mq.removeEventListener?.("change", sync);
  }, []);

  useEffect(() => {
    const applyHashSlide = () => {
      const index = slideIndexFromHash();
      if (index == null) return;
      setActive(index);
      setDragOffset(0);
    };

    applyHashSlide();
    window.addEventListener("hashchange", applyHashSlide);
    return () => window.removeEventListener("hashchange", applyHashSlide);
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setStageInView(entry.isIntersecting && entry.intersectionRatio > 0.15);
      },
      { threshold: [0, 0.15, 0.4] },
    );
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  const goTo = useCallback(
    (next) => {
      setActive(wrapIndex(next, count));
      setDragOffset(0);
    },
    [count],
  );

  const goPrev = useCallback(() => goTo(active - 1), [active, goTo]);
  const goNext = useCallback(() => goTo(active + 1), [active, goTo]);

  /* Subtle auto-advance — pauses on hover/focus, lightbox, off-screen, reduced motion */
  useEffect(() => {
    if (reduceMotion || paused || lightboxOpen || !stageInView || dragOffset !== 0) {
      return undefined;
    }
    const id = window.setInterval(() => {
      setActive((prev) => wrapIndex(prev + 1, count));
      setDragOffset(0);
    }, AUTO_ADVANCE_MS);
    return () => window.clearInterval(id);
  }, [reduceMotion, paused, lightboxOpen, stageInView, dragOffset, count]);

  const openLightbox = (index) => {
    setActive(index);
    setLightboxOpen(true);
    document.body.style.overflow = "hidden";
  };

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
    document.body.style.overflow = "";
    stageRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!lightboxOpen) return undefined;
    const previousFocus = document.activeElement;
    lightboxCloseRef.current?.focus();
    return () => {
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, [lightboxOpen]);

  const handleStageKeyDown = useCallback(
    (event) => {
      if (lightboxOpen) return;

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goPrev();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        goNext();
      } else if (event.key === "Home") {
        event.preventDefault();
        goTo(0);
      } else if (event.key === "End") {
        event.preventDefault();
        goTo(count - 1);
      } else if (
        (event.key === "Enter" || event.key === " ") &&
        event.target === event.currentTarget
      ) {
        event.preventDefault();
        openLightbox(active);
      }
    },
    [lightboxOpen, goPrev, goNext, goTo, count, active],
  );

  /* Lightbox only: Escape / arrows — do not steal keys while typing in the contact form */
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

  const endDrag = useCallback(
    (pointerId) => {
      if (!dragRef.current.active) return;

      const delta = dragRef.current.lastX - dragRef.current.startX;
      dragRef.current.active = false;

      const stage = stageRef.current;
      if (stage && pointerId != null && stage.hasPointerCapture?.(pointerId)) {
        stage.releasePointerCapture(pointerId);
      }

      if (Math.abs(delta) > metrics.dragThreshold) {
        if (delta > 0) goPrev();
        else goNext();
      } else {
        setDragOffset(0);
      }
    },
    [goPrev, goNext, metrics.dragThreshold],
  );

  const onPointerDown = (event) => {
    if (isControlTarget(event.target)) return;
    if (event.button !== 0 && event.pointerType === "mouse") return;

    dragRef.current = {
      active: true,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      pointerId: event.pointerId,
    };
    setDragOffset(0);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return undefined;

    const onMove = (event) => {
      if (!dragRef.current.active) return;
      const deltaX = event.clientX - dragRef.current.startX;
      const deltaY = event.clientY - dragRef.current.startY;
      if (Math.abs(deltaX) > Math.abs(deltaY) + 4) {
        event.preventDefault();
      }
      dragRef.current.lastX = event.clientX;
      setDragOffset(deltaX);
    };

    stage.addEventListener("pointermove", onMove, { passive: false });
    return () => stage.removeEventListener("pointermove", onMove);
  }, []);

  const onPointerMove = (event) => {
    if (!dragRef.current.active) return;
    dragRef.current.lastX = event.clientX;
    setDragOffset(event.clientX - dragRef.current.startX);
  };

  const onPointerUp = (event) => {
    endDrag(event.pointerId);
  };

  const onPointerCancel = (event) => {
    dragRef.current.active = false;
    setDragOffset(0);
    const stage = stageRef.current;
    if (stage && event.pointerId != null && stage.hasPointerCapture?.(event.pointerId)) {
      stage.releasePointerCapture(event.pointerId);
    }
  };

  const dragNorm = dragOffset / metrics.dragNorm;
  const { visibleSpan, translateSpan, rotateY, translateZ, scaleStep, blurMax, dimAmount } =
    metrics;
  const progress = ((active + 1) / count) * 100;

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
        <header className="portfolio-gallery__intro">
          <p className="lookbook-tag portfolio-gallery__kicker">Portfolio</p>
          <span className="portfolio-gallery__hairline" aria-hidden="true" />
          <h2 className="section-heading portfolio-gallery__heading">Salon Lookbook</h2>
          <p className="portfolio-gallery__copy">
            Chair finishes across texture, length, and tone — extensions, precision cuts,
            dimensional color, and muted motion clips.
          </p>
        </header>

        <p id={liveRegionId} className="sr-only" aria-live="polite" aria-atomic="true">
          {activeSlide ? slideAriaLabel(activeSlide, active, count) : ""}
        </p>

        <div
          ref={stageRef}
          className={`coverflow portfolio-gallery__stage${paused ? " is-paused" : ""}`}
          tabIndex={0}
          role="region"
          aria-roledescription="carousel"
          aria-label="Salon portfolio carousel"
          aria-describedby={liveRegionId}
          onKeyDown={handleStageKeyDown}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          onLostPointerCapture={onPointerCancel}
          onPointerEnter={() => setPaused(true)}
          onPointerLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
          }}
          style={{ touchAction: "pan-y" }}
        >
          <div className="coverflow__stage" aria-live="polite">
            {portfolioSlides.map((slide, index) => {
              let offset = index - active;
              if (offset > count / 2) offset -= count;
              if (offset < -count / 2) offset += count;
              offset -= dragNorm;

              const abs = Math.abs(offset);
              if (abs > visibleSpan + 0.85) return null;

              const cardRotateY = offset * -rotateY;
              const cardTranslateX = offset * translateSpan;
              const cardTranslateZ = -abs * translateZ;
              const scale = 1 - Math.min(abs, 2) * scaleStep;
              const opacity = abs > visibleSpan ? 0 : Math.max(0.28, 1 - abs * 0.32);
              const zIndex = Math.round(48 - abs * 12);
              const isCenter = Math.abs(offset) < 0.35;
              const blur = isCenter ? 0 : Math.min(abs, 1.6) * blurMax;
              const brightness = isCenter ? 1 : 1 - Math.min(abs, 1.5) * dimAmount;
              const saturate = isCenter ? 1 : 1 - Math.min(abs, 1.5) * 0.28;
              const depthFade = isCenter
                ? "none"
                : `blur(${blur.toFixed(2)}px) brightness(${brightness.toFixed(3)}) saturate(${saturate.toFixed(3)})`;

              return (
                <button
                  key={slide.id}
                  type="button"
                  className={`coverflow__card${isCenter ? " is-active" : ""}${
                    slide.type === "video" ? " coverflow__card--video" : ""
                  }${isCenter && slide.type === "video" ? " is-playing" : ""}`}
                  style={{
                    transform: `translate(-50%, -50%) translateX(${cardTranslateX}%) translateZ(${cardTranslateZ}px) rotateY(${cardRotateY}deg) scale(${scale})`,
                    opacity,
                    zIndex,
                    filter: depthFade,
                  }}
                  onClick={() => {
                    if (Math.abs(dragOffset) > 8) return;
                    if (isCenter) openLightbox(index);
                    else goTo(index);
                  }}
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
                          loading={abs < 1.5 ? "eager" : "lazy"}
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
                    {slide.type === "video" ? (
                      <span className="coverflow__video-tag" aria-hidden="true">
                        <IconPlay />
                        <span className="coverflow__video-tag-label">
                          {isCenter ? "Playing" : "Motion"}
                        </span>
                      </span>
                    ) : null}
                    <span className="coverflow__caption">
                      <span className="coverflow__title">{slide.title}</span>
                      <span className="coverflow__subtitle">{slide.caption}</span>
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="coverflow__rail">
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
