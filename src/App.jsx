import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const signatureServices = [
  {
    name: "Hair Extensions",
    descriptor:
      "Signature structural integration across premium I-Tip, Genius Weft, Tape-In, and Micro-link frameworks.",
  },
  {
    name: "Brazilian Blowout",
    descriptor:
      "Advanced thermo-active keratin therapy for definitive texture refinement and mirror-like glass shine.",
  },
  {
    name: "Dimensional Color",
    descriptor:
      "Bespoke architectural formulation, color correction, and hand-painted high-contrast tones.",
  },
  {
    name: "Precision Cutting",
    descriptor:
      "Structural silhouette design and tailored texturing engineered for seamless movement.",
  },
];

const portfolioPlaceholders = [
  { label: "[ 01 — Extensions Integration ]", service: "Hair Extensions" },
  { label: "[ 02 — Keratin Smoothing ]", service: "Brazilian Blowout" },
  { label: "[ 03 — Dimensional Color ]", service: "Dimensional Color" },
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

      const essenceEntries = gsap.utils.toArray(".essence-entry");

      gsap.fromTo(
        essenceEntries,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          stagger: 0.1,
          ease: "power4.out",
          scrollTrigger: {
            trigger: ".essence-grid",
            start: "top 80%",
            once: true,
          },
        },
      );

      const portfolioItems = gsap.utils.toArray(".portfolio-item");

      gsap.fromTo(
        portfolioItems,
        { opacity: 0, y: 32 },
        {
          opacity: 1,
          y: 0,
          duration: 0.85,
          stagger: 0.12,
          ease: "power4.out",
          scrollTrigger: {
            trigger: ".portfolio-row",
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
    <div ref={rootRef} className="site-shell">
      <div className="overlay-noise" aria-hidden="true" />

      <header className="shell section nav-row">
        <p className="brand-mark">WILLIAM</p>
        <a className="ghost-link" href="#services">
          Services
        </a>
        <a className="cta-button cta-small" href="tel:915-920-7823">
          915-920-7823
        </a>
      </header>

      <main>
        <section className="shell hero section">
          <p className="kicker hero-kicker">27 years EXPERIENCE</p>
          <h1 className="hero-title">
            <span className="hero-title-primary">WILLIAM</span>
            <span className="hero-title-secondary">STYLIST</span>
          </h1>
          <p className="lead hero-copy">
            High-touch hair artistry, local trust, and twenty-seven years of refined experience in El Paso.
          </p>
          <div className="hero-actions">
            <a className="cta-button" href="tel:915-920-7823">
              915-920-7823
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

          <ul className="essence-grid">
            {signatureServices.map((service, index) => (
              <li key={service.name} className="essence-entry">
                <p className="essence-index">{String(index + 1).padStart(2, "0")}</p>
                <h3 className="essence-name">{service.name}</h3>
                <p className="essence-desc">{service.descriptor}</p>
              </li>
            ))}
          </ul>

          <div className="portfolio-row" aria-label="Service lookbook portfolio">
            {portfolioPlaceholders.map((item) => (
              <figure key={item.label} className="portfolio-item">
                <div className="portfolio-placeholder" aria-hidden="true" />
                <figcaption className="portfolio-caption">
                  <span className="sr-only">{item.service}</span>
                  {item.label}
                </figcaption>
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
          <p><a href="tel:915-920-7823">915-920-7823</a></p>
          <p>Extensions Service</p>
          <p>Cuts</p>
          <p>Color</p>
          <p>Brazilian Blowout</p>
        </div>
      </footer>
    </div>
  );
}
