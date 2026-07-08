import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import CrystalCanvas from "./components/CrystalCanvas";

gsap.registerPlugin(ScrollTrigger);

const servicePillars = [
  {
    index: "I",
    title: "Extensions Service",
    subtext: "Seamless blending, volume, and length with a refined finish.",
  },
  {
    index: "II",
    title: "Cuts",
    subtext: "Precision shape, movement, and tailored structure.",
  },
  {
    index: "III",
    title: "Color",
    subtext: "Dimensional color work with polished tone and depth.",
  },
  {
    index: "IV",
    title: "Brazilian Blowout",
    subtext: "Silken smoothing for radiant, controlled texture.",
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

      const serviceCards = gsap.utils.toArray(".service-card");

      gsap.fromTo(
        serviceCards,
        { opacity: 0, y: 56, rotateX: 6, transformOrigin: "center top" },
        {
          opacity: 1,
          y: 0,
          rotateX: 0,
          duration: 1.1,
          stagger: 0.1,
          ease: "power4.out",
          scrollTrigger: {
            trigger: ".services-grid",
            start: "top 80%",
            once: true,
          },
        },
      );

      // Subtle float begins after each card enters; staggered to match the entrance rhythm.
      serviceCards.forEach((card, idx) => {
        const floatTween = gsap.to(card, {
          y: -8,
          duration: 2.7,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          paused: true,
        });

        ScrollTrigger.create({
          trigger: card,
          start: "top 72%",
          once: true,
          onEnter: () => {
            gsap.delayedCall(idx * 0.12, () => floatTween.play());
          },
        });
      });

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
      <CrystalCanvas />
      <div className="overlay-noise" aria-hidden="true" />

      <header className="shell section nav-row">
        <p className="brand-mark">WILLIAM</p>
        <a className="ghost-link" href="#services">
          Services
        </a>
        <a className="cta-button cta-small" href="#booking">
          Reserve an Experience
        </a>
      </header>

      <main>
        <section className="shell hero section">
          <p className="kicker hero-kicker">27 YEARS EXPERIENCE</p>
          <h1 className="hero-title">
            WILLIAM stylist
          </h1>
          <p className="lead hero-copy">
            Private-feeling luxury service, expert technique, and quietly confident hair artistry on Mesa Street.
          </p>
          <div className="hero-actions">
            <a className="cta-button" href="tel:915-920-7823">
              Reserve by Phone
            </a>
            <a className="secondary-button" href="#services">
              Explore Services
            </a>
          </div>
        </section>

        <section id="services" className="shell section reveal">
          <div className="section-heading-wrap">
            <p className="kicker">Services</p>
            <h2 className="section-heading">Refined essentials, shaped by experience.</h2>
            <p className="lead section-copy">
              Extensions Service, Cuts, Color, and Brazilian Blowout delivered with a polished, appointment-led
              approach.
            </p>
          </div>
          <div className="semantic-service-headings">
            <h2 className="sr-only">Extensions Service</h2>
            <h2 className="sr-only">Brazilian Blowout</h2>
          </div>
          <div className="services-grid">
            {servicePillars.map((service) => (
              <article key={service.title} className="service-card">
                <div className="service-meta">
                  <p>{service.index}</p>
                </div>
                <h3>{service.title}</h3>
                <p className="service-subtext">{service.subtext}</p>
                <a className="service-link" href="#booking">
                  Reserve an Experience
                </a>
              </article>
            ))}
          </div>
        </section>

        <section id="booking" className="shell section reveal booking-panel">
          <p className="kicker">El Paso Booking</p>
          <h2 className="section-heading">El Paso Hair, Refined by William</h2>
          <p className="lead">
            Private-feeling luxury service, expert technique, and 27 years of experience on Mesa Street.
          </p>
          <div className="booking-actions">
            <a className="cta-button" href="tel:915-920-7823">
              Reserve by Phone
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
        <p className="site-footer-copy">
          Extensions Service, Cuts, Color, Brazilian Blowout.
        </p>
        <div className="footer-details" aria-label="Salon contact details">
          <p>915-920-7823</p>
          <p>5411 N. Mesa, Suite 13C</p>
          <p>El Paso, TX 79912</p>
        </div>
      </footer>
    </div>
  );
}
