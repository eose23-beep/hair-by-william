import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { portfolioSpreads, portfolioSlides } from "../data/portfolio";

export default function PortfolioGallery() {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeSlide, setActiveSlide] = useState(null);

  const openLightbox = (src) => {
    const slide = portfolioSlides.find((item) => item.src === src) ?? null;
    setActiveSlide(slide);
    setLightboxOpen(true);
    document.body.style.overflow = "hidden";
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    document.body.style.overflow = "";
    setTimeout(() => setActiveSlide(null), 400);
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && lightboxOpen) closeLightbox();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen]);

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
            Before and after from the chair — extensions, smoothing, and color.
          </p>
        </div>

        <div className="portfolio-spreads">
          {portfolioSpreads.map((spread) => (
            <figure
              key={spread.id}
              className={`portfolio-spread${spread.featured ? " portfolio-spread--featured" : ""}`}
            >
              <div
                className={
                  spread.featured ? "portfolio-spread__grid portfolio-spread__grid--solo" : "portfolio-spread__grid"
                }
              >
                {spread.frames.map((frame) => (
                  <button
                    key={frame.src}
                    type="button"
                    className="portfolio-frame-shell"
                    onClick={() => openLightbox(frame.src)}
                    aria-label={`View ${frame.title} ${frame.label}`}
                  >
                    <div className="portfolio-frame">
                      <img
                        className="portfolio-frame__image"
                        src={frame.src}
                        alt={frame.alt}
                        loading="lazy"
                        decoding="async"
                        width={spread.featured ? 1200 : 800}
                        height={spread.featured ? 750 : 1000}
                      />
                      <span className="portfolio-frame__badge">{frame.label}</span>
                    </div>
                  </button>
                ))}
              </div>
              <figcaption className="portfolio-spread__caption">{spread.caption}</figcaption>
            </figure>
          ))}
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
          {activeSlide ? (
            <>
              <img className="lightbox__image" src={activeSlide.src} alt={activeSlide.alt} loading="eager" />
              <div className="lightbox__caption">
                <span className="lightbox__title">{activeSlide.title}</span>
                <span className="lightbox__subtitle">{activeSlide.caption}</span>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </>
  );
}
