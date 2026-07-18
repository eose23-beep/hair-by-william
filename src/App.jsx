import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import LiquidSilkCanvas from "./components/LiquidSilkCanvas";
import ServicesGrid from "./components/ServicesGrid";
import PortfolioGallery from "./components/PortfolioGallery";
import ContactForm from "./components/ContactForm";
import BookingFab from "./components/BookingFab";
// Agent Harness hidden from public salon UI — dev tooling only
// import AgentHarnessDrawer from "./components/harness/AgentHarnessDrawer";

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
        gsap.utils.toArray(".service-card"),
        { opacity: 0, y: 36, rotateX: 8 },
        {
          opacity: 1,
          y: 0,
          rotateX: 0,
          duration: 0.85,
          stagger: 0.1,
          ease: "power4.out",
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
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>

        <header className="shell nav-row">
          <p className="brand-mark">Hair by William</p>
          <a className="ghost-link" href="#portfolio">
            Portfolio
          </a>
          <a className="ghost-link" href="#services">
            Menu
          </a>
          <a className="nav-phone" href={PHONE_HREF}>
            {PHONE_LABEL}
          </a>
          <a className="cta-button cta-small" href="#contact">
            Book
          </a>
        </header>

        <main id="main-content" className="site-main" tabIndex={-1}>
          <div className="above-fold">
            <section className="hero section">
              <p className="kicker hero-kicker">Luxury Salon · El Paso</p>
              <h1 className="hero-title">
                <span className="hero-title-secondary">Hair By</span>
                <span className="hero-title-primary">William</span>
              </h1>
              <p className="lead hero-copy">
                Precision cuts, custom extensions, color correction, and smoothing treatments —
                twenty-seven years of refined artistry in a calm, high-touch studio.
              </p>
              <p className="hero-meta" aria-label="Salon details">
                <span>5411 N. Mesa, Suite 13C</span>
                <span>Friday &amp; Saturday — call for availability</span>
              </p>
              <div className="hero-actions">
                <a className="cta-button" href="#contact">
                  Book Appointment
                </a>
                <a className="secondary-button" href="#portfolio">
                  View Portfolio
                </a>
              </div>
              <a className="mobile-book-strip" href="#contact">
                Book · WhatsApp or Text
              </a>
            </section>

            <ContactForm />
          </div>

          <PortfolioGallery />

          <ServicesGrid />

          <section id="booking" className="shell section reveal booking-panel">
            <p className="kicker">Visit the Salon</p>
            <h2 className="section-heading">5411 N. Mesa, Suite 13C, El Paso, TX 79912</h2>
            <p className="lead">
              A polished local destination for extensions, cuts, color, and Brazilian Blowout
              appointments.
            </p>
            <dl className="booking-hours" aria-label="Salon hours">
              <dt>Hours</dt>
              <dd>Friday &amp; Saturday — call for current availability</dd>
            </dl>
            <div className="booking-actions">
              <a className="cta-button" href="#contact">
                Book Appointment
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
              <a href={PHONE_HREF}>{PHONE_LABEL}</a>
            </p>
            <p className="footer-hours">
              Friday &amp; Saturday — call for availability · Suite 13C, LV Hair Salon
            </p>
            <p>Extensions</p>
            <p>Cuts</p>
            <p>Color</p>
            <p>Brazilian Blowout</p>
          </div>
        </footer>

        <BookingFab />
        {/* <AgentHarnessDrawer /> */}
      </div>
    </>
  );
}
