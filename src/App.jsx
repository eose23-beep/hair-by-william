import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import GoldWaveField from "./components/GoldWaveField";
import ServicesGrid from "./components/ServicesGrid";
import PortfolioGallery from "./components/PortfolioGallery";
import ContactForm from "./components/ContactForm";
import MapSection from "./components/MapSection";
import BookingFab from "./components/BookingFab";
import AmbientVideo from "./components/AmbientVideo";
import { bookingAmbientClip } from "./data/portfolio";

gsap.registerPlugin(ScrollTrigger);

const PHONE_HREF = "tel:915-920-7823";
const PHONE_LABEL = "915-920-7823";

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
          { opacity: 1, y: 0, duration: 1.1, ease: "power3.out" },
          "-=0.42",
        )
        .fromTo(
          ".hero-copy",
          { opacity: 0, y: 32 },
          { opacity: 1, y: 0, duration: 0.9, ease: "power3.out" },
          "-=0.64",
        )
        .fromTo(
          ".hero-actions",
          { opacity: 0, y: 24 },
          { opacity: 1, y: 0, duration: 0.85, ease: "power3.out" },
          "-=0.5",
        );

      gsap.fromTo(
        gsap.utils.toArray(".service-card"),
        { opacity: 0, y: 28 },
        {
          opacity: 1,
          y: 0,
          duration: 0.85,
          stagger: 0.1,
          ease: "power3.out",
          clearProps: "transform",
          scrollTrigger: {
            trigger: ".services-menu-3d",
            start: "top 86%",
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
            ease: "power3.out",
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
      <GoldWaveField />

      <div ref={rootRef} className="site-shell typography-layer">
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>

        <header className="site-header">
          <div className="shell nav-row">
            <p className="brand-mark" aria-label="Hair by William">
              <span className="brand-mark__glyph" aria-hidden="true">
                W
              </span>
              <span className="brand-mark__lockup">
                <span className="brand-mark__kicker">Hair by</span>
                <span className="brand-mark__name">William</span>
              </span>
            </p>
            <a className="ghost-link" href="#portfolio">
              Portfolio
            </a>
            <a className="ghost-link" href="#services">
              Menu
            </a>
            <a className="ghost-link" href="#visit">
              Visit
            </a>
            <a className="nav-phone" href={PHONE_HREF}>
              {PHONE_LABEL}
            </a>
            <a className="cta-button cta-small" href="#contact">
              Book
            </a>
          </div>
        </header>

        <main id="main-content" className="site-main" tabIndex={-1}>
          <section className="hero-stage" aria-label="Hair by William">
            <div className="hero-stage__media">
              <picture>
                <source
                  srcSet="/portfolio/extensions_after-hero.webp"
                  type="image/webp"
                />
                <img
                  src="/portfolio/extensions_after-hero.jpg"
                  alt="Long strawberry-blonde waves and soft fringe — custom extension finish by Hair by William in El Paso"
                  width={2160}
                  height={2160}
                  fetchPriority="high"
                />
              </picture>
            </div>
            <div className="hero-stage__overlay" aria-hidden="true" />
            <div className="hero-stage__content shell">
              <div className="hero-stage__copy">
                <p className="kicker hero-kicker">Luxury Salon · El Paso</p>
                <h1 className="hero-title">
                  <span className="hero-title-secondary">Hair by</span>
                  <span className="hero-title-rule" aria-hidden="true" />
                  <span className="hero-title-primary">William</span>
                  <span className="sr-only">
                    {" "}
                    — El Paso hair stylist for extensions, cuts, and color
                  </span>
                </h1>
                <p className="lead hero-copy">
                  Precision cuts, custom extensions, color correction, and smoothing — twenty-seven
                  years of refined artistry in El Paso.
                </p>
                <div className="hero-actions">
                  <a className="cta-button" href="#contact">
                    Book Appointment
                  </a>
                  <a className="secondary-button secondary-button--on-dark" href="#portfolio">
                    View Portfolio
                  </a>
                </div>
                <a className="mobile-book-strip" href="#contact">
                  Book · WhatsApp or Text
                </a>
              </div>
            </div>
          </section>

          <PortfolioGallery />

          <ContactForm />

          <ServicesGrid />

          <section id="booking" className="shell section reveal booking-panel">
            <div className="booking-panel__layout">
              <div className="booking-panel__intro">
                <p className="kicker">Ready When You Are</p>
                <h2 className="section-heading booking-panel__heading">Book Your Appointment</h2>
                <p className="lead booking-panel__copy">
                  Extensions, precision cuts, color correction, and Brazilian Blowout in El Paso —
                  tailored to your texture, goals, and schedule.
                </p>
                <figure className="booking-panel__clip">
                  <div className="booking-panel__clip-frame">
                    <AmbientVideo
                      className="booking-panel__clip-media"
                      src={bookingAmbientClip.src}
                      poster={bookingAmbientClip.poster}
                      ariaLabel={bookingAmbientClip.alt}
                      preload="metadata"
                      active
                    />
                  </div>
                  <figcaption className="booking-panel__clip-caption">
                    <span className="booking-panel__clip-title">{bookingAmbientClip.title}</span>
                    <a className="booking-panel__clip-link" href="#portfolio">
                      More in portfolio
                    </a>
                  </figcaption>
                </figure>
              </div>
              <div className="booking-panel__aside">
                <dl className="booking-hours" aria-label="Salon hours">
                  <dt>Hours</dt>
                  <dd>Friday &amp; Saturday — call for current availability</dd>
                </dl>
                <div className="booking-actions">
                  <a className="cta-button" href="#contact">
                    Book Appointment
                  </a>
                  <a className="secondary-button" href="#visit">
                    Find the Studio
                  </a>
                </div>
              </div>
            </div>
          </section>
        </main>

        <MapSection />

        <footer className="site-footer">
          <div className="shell site-footer__inner">
            <div className="site-footer__brand">
              <p className="kicker">Hair by William</p>
              <p className="site-footer-copy">
                El Paso hair stylist for custom extensions, precision cuts, color correction, and
                Brazilian Blowouts — twenty-seven years of refined artistry. Every texture and length
                welcome.
              </p>
            </div>
            <div className="site-footer__grid" aria-label="Salon contact details">
              <div className="site-footer__col">
                <p className="site-footer__label">Studio</p>
                <p>
                  <a href="#visit">5411 N. Mesa, Suite 13C</a>
                </p>
                <p className="footer-hours">El Paso, TX 79912 · LV Hair Salon</p>
              </div>
              <div className="site-footer__col">
                <p className="site-footer__label">Contact</p>
                <p>
                  <a href={PHONE_HREF}>{PHONE_LABEL}</a>
                </p>
                <p className="footer-hours">Friday &amp; Saturday — call for availability</p>
              </div>
              <div className="site-footer__col">
                <p className="site-footer__label">Explore</p>
                <ul className="site-footer__tags">
                  <li>
                    <a href="#portfolio">Portfolio</a>
                  </li>
                  <li>
                    <a href="#services">Services</a>
                  </li>
                  <li>
                    <a href="#booking">Booking</a>
                  </li>
                  <li>
                    <a href="#visit">Location</a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </footer>

        <BookingFab />
      </div>
    </>
  );
}
