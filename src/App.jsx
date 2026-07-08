import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import CrystalCanvas from "./components/CrystalCanvas";

gsap.registerPlugin(ScrollTrigger);

const servicePillars = [
  {
    index: "I",
    title: "Custom Hair Extensions",
    subtext: "Seamless blending, volume, and length",
  },
  {
    index: "II",
    title: "Brazilian Blowouts & Smoothing",
    subtext: "Frizz-free, radiant, manageable",
  },
  {
    index: "III",
    title: "Dimensional Color & Balayage",
    subtext: "Hand-painted, premium lived-in color",
  },
  {
    index: "IV",
    title: "Precision Cutting & Texture",
    subtext: "Bespoke structural cuts",
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
          <p className="kicker hero-kicker">Rosé Luxe Hair Atelier</p>
          <h1 className="hero-title">
            The new standard in <br />
            dimensional color <br />
            &amp; extension artistry.
          </h1>
          <p className="lead hero-copy">
            Bespoke styling, Brazilian blowouts, and transformative treatments in an exclusive, high-touch
            environment.
          </p>
          <div className="hero-actions">
            <a className="cta-button" href="#booking">
              Reserve an Experience
            </a>
            <a className="secondary-button" href="#services">
              Explore Services
            </a>
          </div>
        </section>

        <section id="services" className="shell section reveal">
          <div className="section-heading-wrap">
            <p className="kicker">Services</p>
            <h2 className="section-heading">Tailored rituals for color, finish, and restorative shine.</h2>
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
          <p className="kicker">Booking</p>
          <h2 className="section-heading">Reserve your Rosé Luxe appointment in under 60 seconds.</h2>
          <p className="lead">
            Select your service and preferred stylist. We confirm availability, prep notes, and arrival details by
            email right away.
          </p>
          <div className="booking-actions">
            <a
              className="cta-button"
              href="mailto:bookings@williamluxe.com?subject=Reserve%20an%20Experience%20%E2%80%94%20Hair%20by%20William"
            >
              Reserve an Experience
            </a>
            <a className="secondary-button" href="tel:+15550181234">
              Call Salon Desk
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
