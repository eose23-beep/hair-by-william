import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { portfolioSlides } from "../data/portfolio";

const DEFAULT_METRICS = {
  visibleSpan: 2,
  translateSpan: 58,
  rotateY: 42,
  translateZ: 72,
  dragThreshold: 56,
  dragNorm: 280,
};

function getCarouselMetrics(width) {
  if (width <= 480) {
    return {
      visibleSpan: 1.15,
      translateSpan: 78,
      rotateY: 24,
      translateZ: 48,
      dragThreshold: 36,
      dragNorm: 180,
    };
  }
  if (width <= 767) {
    return {
      visibleSpan: 1.35,
      translateSpan: 68,
      rotateY: 32,
      translateZ: 58,
      dragThreshold: 44,
      dragNorm: 220,
    };
  }
  if (width <= 1023) {
    return {
      visibleSpan: 1.75,
      translateSpan: 62,
      rotateY: 38,
      translateZ: 64,
      dragThreshold: 50,
      dragNorm: 250,
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

export default function PortfolioGallery() {
  const [active, setActive] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [metrics, setMetrics] = useState(DEFAULT_METRICS);
  const stageRef = useRef(null);
  const dragRef = useRef({ active: false, startX: 0, lastX: 0, pointerId: null });
  const count = portfolioSlides.length;

  useEffect(() => {
    const syncMetrics = () => setMetrics(getCarouselMetrics(window.innerWidth));
    syncMetrics();
    window.addEventListener("resize", syncMetrics, { passive: true });
    return () => window.removeEventListener("resize", syncMetrics);
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

  const closeLightbox = () => {
    setLightboxOpen(false);
    document.body.style.overflow = "";
  };

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
    [lightboxOpen, goPrev, goNext, goTo, count],
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
      lastX: event.clientX,
      pointerId: event.pointerId,
    };
    setDragOffset(0);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

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
        className="portfolio-gallery-section reveal shell"
        aria-label="William portfolio"
      >
        <div className="portfolio-gallery__header">
          <p className="lookbook-tag">Portfolio</p>
          <h2 className="section-heading portfolio-gallery__heading">Recent Work</h2>
          <p className="portfolio-gallery__copy">
            A rotating look at the chair — extensions, smoothing, color, and cut.
          </p>
        </div>

        <div
          ref={stageRef}
          className="coverflow"
          tabIndex={0}
          role="region"
          aria-roledescription="carousel"
          aria-label="Salon work carousel"
          onKeyDown={handleKeyDown}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          onLostPointerCapture={onPointerCancel}
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
              const scale = 1 - Math.min(abs, 2) * 0.12;
              const opacity = abs > visibleSpan ? 0 : 1 - abs * 0.28;
              const zIndex = Math.round(40 - abs * 10);
              const isCenter = Math.abs(offset) < 0.35;

              return (
                <button
                  key={slide.id}
                  type="button"
                  className={`coverflow__card${isCenter ? " is-active" : ""}`}
                  style={{
                    transform: `translate(-50%, -50%) translateX(${cardTranslateX}%) translateZ(${cardTranslateZ}px) rotateY(${cardRotateY}deg) scale(${scale})`,
                    opacity,
                    zIndex,
                  }}
                  onClick={() => {
                    if (Math.abs(dragOffset) > 8) return;
                    if (isCenter) openLightbox(index);
                    else goTo(index);
                  }}
                  aria-label={`${slide.title}. ${slide.caption}`}
                  aria-current={isCenter ? "true" : undefined}
                  tabIndex={isCenter ? 0 : -1}
                >
                  <div className="coverflow__frame">
                    {slide.type === "video" ? (
                      <video
                        className="coverflow__media"
                        src={slide.src}
                        muted
                        playsInline
                        loop
                        autoPlay={isCenter}
                        poster={slide.poster}
                      />
                    ) : (
                      <img
                        className="coverflow__media"
                        src={slide.src}
                        alt={slide.alt}
                        loading={abs < 1.5 ? "eager" : "lazy"}
                        decoding="async"
                        draggable={false}
                      />
                    )}
                  </div>
                  <span className="coverflow__caption">
                    <span className="coverflow__title">{slide.title}</span>
                    <span className="coverflow__subtitle">{slide.caption}</span>
                  </span>
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
                aria-label={`Show ${slide.title}`}
                className={`coverflow__dot${index === active ? " is-active" : ""}`}
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
        aria-label="Image lightbox"
      >
        <button className="lightbox__close" onClick={closeLightbox} aria-label="Close lightbox" type="button">
          <X size={24} />
        </button>
        <div className="lightbox__content" onClick={(event) => event.stopPropagation()}>
          {portfolioSlides[active] ? (
            <>
              <img
                className="lightbox__image"
                src={portfolioSlides[active].src}
                alt={portfolioSlides[active].alt}
                loading="eager"
              />
              <div className="lightbox__caption">
                <span className="lightbox__title">{portfolioSlides[active].title}</span>
                <span className="lightbox__subtitle">{portfolioSlides[active].caption}</span>
              </div>
              <div className="lightbox__nav">
                <button type="button" className="coverflow__nav" onClick={goPrev} aria-label="Previous">
                  <ChevronLeft size={20} />
                </button>
                <button type="button" className="coverflow__nav" onClick={goNext} aria-label="Next">
                  <ChevronRight size={20} />
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </>
  );
}
