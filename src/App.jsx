import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import LiquidSilkCanvas from "./components/LiquidSilkCanvas";

gsap.registerPlugin(ScrollTrigger);

const portfolioModules = [
  {
    id: "extensions",
    type: "pair",
    caption: "[ 01 / HAIR EXTENSIONS SYSTEM — INITIAL LAYER TO VOLUME INTEGRATION ]",
    frames: [
      {
        label: "Before",
        src: "/portfolio/extensions_before.jpg",
        alt: "Hair extensions transformation before volume integration and length enhancement",
      },
      {
        label: "After",
        src: "/portfolio/extensions_after.jpg",
        alt: "Hair extensions transformation after volume integration with seamless structural blend",
      },
    ],
  },
  {
    id: "blowout",
    type: "pair",
    caption: "[ 02 / THERMO-ACTIVE KERATIN — NATURAL TEXTURE TO REFRACTIVE REFINE ]",
    frames: [
      {
        label: "Before",
        src: "/portfolio/blowout_before.jpg",
        alt: "Brazilian Blowout transformation before keratin smoothing treatment",
      },
      {
        label: "After",
        src: "/portfolio/blowout_after.jpg",
        alt: "Brazilian Blowout transformation after keratin smoothing with refined shine",
      },
    ],
  },
  {
    id: "color-cut",
    type: "centerpiece",
    caption: "[ 03 / ARTISAN SPECIFICATION — DIMENSIONAL COLORING & PRECISION GEOMETRY ]",
    frames: [
      {
        label: "Dimensional Reconstruction",
        src: "/portfolio/color_cut.jpg",
        alt: "Dimensional coloring and precision cut reconstruction with artisan tonal geometry",
      },
    ],
  },
];

export default function App() {
  const rootRef = useRef(null);

  useEffect(() => {
    if (!rootRef.current) return undefined;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return undefined;

    const context = gsap.context(() => {
      const heroTl = gsap.timeline();
      heroTl
        .fromTo(
          ".hero-kicker",
          { opacity: 0, y: 24 },
          { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" },
        )
        .fromTo(
          ".hero-title",
          { opacity: 0, y: 48 },
          { opacity: 1, y: 0, duration: 1.1, ease: "back.out(1.2)" },
          "-=0.42",
        )
        .fromTo(
          ".hero-copy",
          { opacity: 0, y: 32 },
          { opacity: 1, y: 0, duration: 0.9, ease: "power4.out" },
          "-=0.64",
        )
        .fromTo(
          ".hero-actions",
          { opacity: 0, y: 24 },
          { opacity: 1, y: 0, duration: 0.85, ease: "back.out(1.1)" },
          "-=0.5",
        );

      gsap.fromTo(
        gsap.utils.toArray(".portfolio-module"),
        { opacity: 0, y: 32 },
        {
          opacity: 1,
          y: 0,
          duration: 0.85,
          stagger: 0.12,
          ease: "power4.out",
          scrollTrigger: {
            trigger: ".portfolio-grid",
            start: "top 84%",
            once: true,
          },
        },
      );

      gsap.utils.toArray(".reveal").forEach((element) => {
        gsap.fromTo(
          element,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.95,
            ease: "power4.out",
            scrollTrigger: {
              trigger: element,
              start: "top 84%",
              once: true,
            },
          },
        );
      });
    }, rootRef);

    return () => context.revert();
  }, []);

  return (
    <>
      <LiquidSilkCanvas />

      <div ref={rootRef} className="site-shell typography-layer">
        <header className="shell section nav-row">
          <p className="brand-mark">WILLIAM</p>
          <a className="ghost-link" href="#services">
            Services
          </a>
          <a className="cta-button cta-small" href="tel:915-920-7823">
            915-920-7823
          </a>
        </header>

        <main className="site-main">
          <section className="shell hero section">
            <p className="kicker hero-kicker">27 years EXPERIENCE</p>
            <h1 className="hero-title">
              <span className="hero-title-primary">WILLIAM</span>
              <span className="hero-title-secondary">STYLIST</span>
            </h1>
            <p className="lead hero-copy">
              High-touch hair artistry, local trust, and twenty-seven years of refined experience in El Paso.
            </p>
            <p className="hero-meta" aria-label="Salon credentials">
              <span>5411 N. Mesa, Suite 13-C</span>
              <span>Friday &amp; Saturday</span>
            </p>
            <div className="hero-actions">
              <a className="cta-button" href="tel:915-920-7823">
                915-920-7823
              </a>
              <a className="secondary-button" href="#services">
                View Transformations
              </a>
            </div>
          </section>

          <section id="services" className="shell shell--offset section lookbook-section reveal">
            <p className="lookbook-tag">01 / Services</p>

            <div className="semantic-service-headings">
              <h2 className="sr-only">Hair Extensions</h2>
              <h2 className="sr-only">Brazilian Blowout</h2>
              <h2 className="sr-only">Dimensional Color</h2>
              <h2 className="sr-only">Precision Cutting</h2>
            </div>

            <div className="lookbook-intro">
              <h2 className="section-heading lookbook-heading">Transformation Lookbook</h2>
              <p className="lead lookbook-copy">
                A transparent editorial spread for extensions, smoothing, and dimensional reconstruction,
                composed to float over the live molten-gold ambient field.
              </p>
            </div>

            <div className="portfolio-grid" aria-label="Service lookbook portfolio">
              {portfolioModules.map((module) => (
                <figure
                  key={module.id}
                  className={`portfolio-module portfolio-module--${module.type}`}
                >
                  <div
                    className={
                      module.type === "pair" ? "portfolio-pair" : "portfolio-centerpiece"
                    }
                  >
                    {module.frames.map((frame) => (
                      <div key={frame.src} className="portfolio-cell">
                        <div className="portfolio-frame-shell">
                          <div className="portfolio-frame">
                            <img
                              className="portfolio-image"
                              src={frame.src}
                              alt={frame.alt}
                              loading="lazy"
                              decoding="async"
                              width={module.type === "centerpiece" ? 1600 : 800}
                              height={module.type === "centerpiece" ? 900 : 1067}
                            />
                            {module.type === "pair" ? (
                              <span className="portfolio-badge">{frame.label}</span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <figcaption className="portfolio-caption">{module.caption}</figcaption>
                </figure>
              ))}
            </div>
          </section>

          <section id="booking" className="shell section reveal booking-panel">
            <p className="kicker">Location</p>
            <h2 className="section-heading">5411 N. Mesa, Suite 13C, El Paso, TX 79912</h2>
            <p className="lead">
              A polished local destination for extensions, cuts, color, and Brazilian Blowout appointments.
            </p>
            <dl className="booking-hours" aria-label="Salon hours">
              <dt>Hours</dt>
              <dd>Friday — 9:00 AM to 6:00 PM</dd>
              <dd>Saturday — 9:00 AM to 4:00 PM</dd>
            </dl>
            <div className="booking-actions">
              <a className="cta-button" href="tel:915-920-7823">
                915-920-7823
              </a>
              <a
                className="secondary-button"
                href="https://www.google.com/maps/search/?api=1&query=5411%20N.%20Mesa%2C%20Suite%2013C%2C%20El%20Paso%2C%20TX%2079912"
                target="_blank"
                rel="noreferrer"
              >
                Get Directions
              </a>
            </div>
          </section>
        </main>

        <footer className="shell section site-footer">
          <p className="kicker">Hair by William</p>
          <p className="site-footer-copy">5411 N. Mesa, Suite 13C, El Paso, TX 79912</p>
          <div className="footer-details" aria-label="Salon contact details">
            <p>
              <a href="tel:915-920-7823">915-920-7823</a>
            </p>
            <p className="footer-hours">Open Friday &amp; Saturday — Suite 13-C, LV Hair Salon</p>
            <p>Extensions Service</p>
            <p>Cuts</p>
            <p>Color</p>
            <p>Brazilian Blowout</p>
          </div>
        </footer>
      </div>
    </>
  );
}
