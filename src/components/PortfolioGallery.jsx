import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { portfolioSlides } from "../data/portfolio";
import AmbientVideo from "./AmbientVideo";

const DEFAULT_METRICS = {
  visibleSpan: 1.35,
  translateSpan: 42,
  rotateY: 16,
  translateZ: 28,
  dragThreshold: 56,
  dragNorm: 280,
};

function getCarouselMetrics(width) {
  /* Mobile/tablet: single-focus flat carousel — no side-card overlap into the header */
  if (width <= 767) {
    return {
      visibleSpan: 0.05,
      translateSpan: 110,
      rotateY: 0,
      translateZ: 0,
      dragThreshold: width <= 390 ? 28 : 36,
      dragNorm: width <= 390 ? 160 : 200,
    };
  }
  if (width <= 1023) {
    return {
      visibleSpan: 1.15,
      translateSpan: 52,
      rotateY: 18,
      translateZ: 36,
      dragThreshold: 48,
      dragNorm: 240,
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
      ".coverflow__controls, .coverflow__dots, .coverflow__nav, .coverflow__dot",
    ),
  );
}

function slideAriaLabel(slide, index, total) {
  const kind = slide.type === "video" ? "Video" : "Image";
  return `${kind} slide ${index + 1} of ${total}: ${slide.title}. ${slide.alt}`;
}

export default function PortfolioGallery() {
  const [active, setActive] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [metrics, setMetrics] = useState(DEFAULT_METRICS);
  const [stageInView, setStageInView] = useState(true);
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

  const handleKeyDown = useCallback(
    (event) => {
      if (lightboxOpen) {
        if (event.key === "Escape") closeLightbox();
        if (event.key === "ArrowLeft") goPrev();
        if (event.key === "ArrowRight") goNext();
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
      if (event.key === "Home") {
        event.preventDefault();
        goTo(0);
      }
      if (event.key === "End") {
        event.preventDefault();
        goTo(count - 1);
      }
    },
    [lightboxOpen, goPrev, goNext, goTo, count, closeLightbox],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

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
  const { visibleSpan, translateSpan, rotateY, translateZ } = metrics;

  return (
    <>
      <section
        id="portfolio"
        className="shell section portfolio-gallery-section"
        aria-label="William portfolio"
      >
        <div className="portfolio-gallery__header">
          <p className="lookbook-tag">Portfolio</p>
          <h2 className="section-heading portfolio-gallery__heading">Recent Work</h2>
          <p className="portfolio-gallery__copy">
            Recent chair work across textures, lengths, and tones — photos and short muted clips of
            the finish in motion.
          </p>
        </div>

        <p id={liveRegionId} className="sr-only" aria-live="polite" aria-atomic="true">
          {activeSlide ? slideAriaLabel(activeSlide, active, count) : ""}
        </p>

        <div
          ref={stageRef}
          className="coverflow"
          tabIndex={0}
          role="region"
          aria-roledescription="carousel"
          aria-label="Salon portfolio carousel"
          aria-describedby={liveRegionId}
          onKeyDown={handleKeyDown}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          onLostPointerCapture={onPointerCancel}
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
              const scale = 1 - Math.min(abs, 2) * 0.11;
              const opacity = abs > visibleSpan ? 0 : 1 - abs * 0.26;
              const zIndex = Math.round(40 - abs * 10);
              const isCenter = Math.abs(offset) < 0.35;
              const depthFade = isCenter
                ? "none"
                : `brightness(${1 - Math.min(abs, 1.5) * 0.1}) saturate(${1 - Math.min(abs, 1.5) * 0.14})`;

              return (
                <button
                  key={slide.id}
                  type="button"
                  className={`coverflow__card${isCenter ? " is-active" : ""}${
                    slide.type === "video" ? " coverflow__card--video" : ""
                  }`}
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
                    )}
                    {slide.type === "video" ? (
                      <span className="coverflow__video-tag" aria-hidden="true">
                        Motion
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

          <div className="coverflow__controls">
            <button
              type="button"
              className="coverflow__nav"
              onClick={goPrev}
              aria-label="Previous work"
            >
              <ChevronLeft size={20} strokeWidth={1.75} />
            </button>
            <p className="coverflow__counter" aria-hidden="true">
              {String(active + 1).padStart(2, "0")}
              <span> / </span>
              {String(count).padStart(2, "0")}
            </p>
            <button
              type="button"
              className="coverflow__nav"
              onClick={goNext}
              aria-label="Next work"
            >
              <ChevronRight size={20} strokeWidth={1.75} />
            </button>
          </div>

          <div className="coverflow__dots" role="tablist" aria-label="Select slide">
            {portfolioSlides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                role="tab"
                aria-selected={index === active}
                aria-label={slideAriaLabel(slide, index, count)}
                className={`coverflow__dot${index === active ? " is-active" : ""}${
                  slide.type === "video" ? " coverflow__dot--video" : ""
                }`}
                onClick={() => goTo(index)}
              />
            ))}
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
          <X size={24} />
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
                <img
                  className="lightbox__image"
                  src={activeSlide.src}
                  alt={activeSlide.alt}
                  loading="eager"
                />
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
                  <ChevronLeft size={20} />
                </button>
                <button
                  type="button"
                  className="coverflow__nav"
                  onClick={goNext}
                  aria-label="Next portfolio item"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </figure>
          ) : null}
        </div>
      </div>
    </>
  );
}
