import { lazy, Suspense, useEffect, useRef } from "react";
import AmbientVideo from "./components/AmbientVideo";
import MobileCtaBar from "./components/MobileCtaBar";
import { bookingAmbientClip, heroWorkClips } from "./data/portfolio";
import { DIRECTIONS_URL, MAPS_SEARCH_URL } from "./data/location";

const PortfolioGallery = lazy(() => import("./components/PortfolioGallery"));
const HairTryOn = lazy(() => import("./components/HairTryOn"));
const ContactForm = lazy(() => import("./components/ContactForm"));
const StyleQuiz = lazy(() => import("./components/StyleQuiz"));
const MapSection = lazy(() => import("./components/MapSection"));
const ServicesGrid = lazy(() => import("./components/ServicesGrid"));
const SalonFaq = lazy(() => import("./components/SalonFaq"));
const GoldWaveField = lazy(() => import("./components/GoldWaveField"));

const PHONE_HREF = "tel:915-920-7823";
const PHONE_LABEL = "915-920-7823";
const STUDIO_ADDRESS = "5411 N. Mesa, Suite 13C";
const STUDIO_CITY = "El Paso, TX 79912 · LV Hair Salon";

/**
 * Optional living-hero video loop (4–6s, muted, WebM preferred).
 * Null = sharp still photo (default — does not break the hero).
 *
 * Drop-in steps:
 * 1. Export a short hair-sway / chair ambient loop (Runway / Kling / Luma / phone).
 * 2. Save as public/portfolio/hero-hair-sway.webm (or .mp4).
 * 3. Set: const HERO_AMBIENT_VIDEO = "/portfolio/hero-hair-sway.webm";
 * AmbientVideo uses poster + still fallback when reduced-motion is on.
 */
const HERO_AMBIENT_VIDEO = null;

/** Map in-page hashes to a real scroll target (clips -> lookbook, visit -> booking, contact -> form). */
function resolveScrollTarget(hash) {
  const id = String(hash || "")
    .replace(/^#/, "")
    .split("?")[0]
    .trim();
  if (!id) return null;

  if (/^clip-\d+/i.test(id) || /^portfolio-clip-/i.test(id)) {
    return document.getElementById("portfolio");
  }
  if (id === "visit") {
    return document.getElementById("booking") || document.getElementById("visit");
  }
  /* Book CTAs: land on the form itself, not just the section intro */
  if (id === "contact" || id === "contact-form") {
    return (
      document.getElementById("contact-form") ||
      document.getElementById("contact")
    );
  }
  return document.getElementById(id);
}

function scrollToHash(hash, { smooth = false } = {}) {
  const target = resolveScrollTarget(hash);
  if (!target) return false;
  /* Instant by default. Assigning location.hash / scrollTo() under
     html { scroll-behavior: smooth } can leave an in-flight animation that
     keeps running after Book clicks and pulls the form back out of view. */
  const root = document.documentElement;
  const prevBehavior = root.style.scrollBehavior;
  root.style.scrollBehavior = "auto";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const margin = Number.parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
  const top = Math.max(
    0,
    Math.round(target.getBoundingClientRect().top + window.scrollY - margin),
  );
  if (smooth && !reduce) {
    window.scrollTo({ top, left: 0, behavior: "smooth" });
  } else {
    /* scrollTop write cancels in-flight CSS smooth scrolls (scrollIntoView no-op won't) */
    root.scrollTop = top;
    if (document.body) document.body.scrollTop = top;
    window.scrollTo({ top, left: 0, behavior: "auto" });
  }
  root.style.scrollBehavior = prevBehavior;
  return true;
}

export default function App() {
  const rootRef = useRef(null);

  useEffect(() => {
    let ignoreSpyUntil = 0;

    const onHash = () => {
      if (!window.location.hash) return;
      ignoreSpyUntil = Date.now() + 1600;
      window.requestAnimationFrame(() => scrollToHash(window.location.hash));
    };

    const onClick = (event) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = event.target.closest("a[href]");
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      const href = anchor.getAttribute("href");
      if (!href || /^(tel:|sms:|mailto:|https?:)/i.test(href)) return;

      let url;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (!url.hash) return;

      const samePath =
        url.pathname.replace(/\/$/, "") === window.location.pathname.replace(/\/$/, "");
      if (!samePath) return;

      /* Pure hash: pushState avoids CSS-smooth native hash jump; re-clicks still scroll */
      if (href.startsWith("#")) {
        event.preventDefault();
        ignoreSpyUntil = Date.now() + 1600;
        if (window.location.hash !== url.hash) {
          window.history.pushState(null, "", url.hash);
        }
        scrollToHash(url.hash);
        return;
      }

      /* Query + hash (service book links): own navigation so scroll is instant */
      event.preventDefault();
      ignoreSpyUntil = Date.now() + 1600;
      const next = `${url.pathname}${url.search}${url.hash}`;
      const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (next !== current) {
        window.history.pushState(null, "", next);
      }
      scrollToHash(url.hash);
    };

    /* Keep hash aligned with the section in view (fixes #contact while reading Try On). */
    const sectionIds = ["portfolio", "try-on", "contact", "services", "booking"];
    const ratios = new Map();
    const spyObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          ratios.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0);
        });
        if (Date.now() < ignoreSpyUntil) return;
        let bestId = "";
        let bestRatio = 0;
        ratios.forEach((ratio, id) => {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestId = id;
          }
        });
        if (!bestId || bestRatio < 0.22) return;
        const next = `#${bestId}`;
        if (window.location.hash === next) return;
        window.history.replaceState(null, "", next);
      },
      {
        root: null,
        threshold: [0.22, 0.35, 0.5, 0.65],
        rootMargin: "-20% 0px -45% 0px",
      },
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) spyObserver.observe(el);
    });

    onHash();
    window.addEventListener("hashchange", onHash);
    window.addEventListener("popstate", onHash);
    document.addEventListener("click", onClick);
    return () => {
      spyObserver.disconnect();
      window.removeEventListener("hashchange", onHash);
      window.removeEventListener("popstate", onHash);
      document.removeEventListener("click", onClick);
    };
  }, []);

  useEffect(() => {
    if (!rootRef.current) return undefined;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const motionTargets =
      '.reveal, .motion-block, .service-card, .site-footer__brand, .site-footer__col, .nav-row > *, .services-section__header > *, .portfolio-gallery__intro > *, .hair-tryon__intro > *, .hair-tryon__stage, .contact-section__intro, .contact-section__form-wrap, .booking-panel__card > *';

    let cancelled = false;
    let context;

    const bootMotion = async () => {
      if (cancelled) return;
      const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ]);
      if (cancelled || !rootRef.current) return;

      gsap.registerPlugin(ScrollTrigger);

      if (reduceMotion) {
        gsap.set(motionTargets, { clearProps: 'opacity,transform' });
        return;
      }

      context = gsap.context(() => {
        const easeOut = 'power3.out';
        const revealOnce = { start: 'top 86%', once: true };

        gsap.fromTo(
          '.nav-row > *',
          { opacity: 0, y: -10 },
          {
            opacity: 1,
            y: 0,
            duration: 0.72,
            stagger: 0.055,
            ease: easeOut,
            delay: 0.08,
            clearProps: 'opacity,transform',
          },
        );

        const heroTl = gsap.timeline();
        heroTl
          .fromTo(
            '.hero-title',
            { opacity: 0, y: 48 },
            { opacity: 1, y: 0, duration: 1.1, ease: easeOut },
          )
          .fromTo(
            '.hero-copy',
            { opacity: 0, y: 32 },
            { opacity: 1, y: 0, duration: 0.9, ease: easeOut },
            '-=0.64',
          )
          .fromTo(
            '.hero-actions',
            { opacity: 0, y: 24 },
            { opacity: 1, y: 0, duration: 0.85, ease: easeOut },
            '-=0.5',
          )
          .fromTo(
            '.hero-film',
            { opacity: 0, y: -16 },
            { opacity: 1, y: 0, duration: 0.9, ease: easeOut },
            '-=0.45',
          );

        gsap.fromTo(
          '.portfolio-gallery__intro > *',
          { opacity: 0, y: 22 },
          {
            opacity: 1,
            y: 0,
            duration: 0.85,
            stagger: 0.07,
            ease: easeOut,
            clearProps: 'opacity,transform',
            scrollTrigger: { trigger: '#portfolio', ...revealOnce },
          },
        );

        gsap.fromTo(
          ['.hair-tryon__intro > *', '.hair-tryon__stage'],
          { opacity: 0, y: 24 },
          {
            opacity: 1,
            y: 0,
            duration: 0.88,
            stagger: 0.08,
            ease: easeOut,
            clearProps: 'opacity,transform',
            scrollTrigger: { trigger: '#try-on', ...revealOnce },
          },
        );

        gsap.fromTo(
          ['.contact-section__intro', '.contact-section__form-wrap'],
          { opacity: 0, y: 28 },
          {
            opacity: 1,
            y: 0,
            duration: 0.9,
            stagger: 0.12,
            ease: easeOut,
            clearProps: 'opacity,transform',
            scrollTrigger: { trigger: '#contact', ...revealOnce },
          },
        );

        gsap.fromTo(
          '.services-section__header > *',
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.08,
            ease: easeOut,
            clearProps: 'opacity,transform',
            scrollTrigger: { trigger: '#services', ...revealOnce },
          },
        );

        gsap.fromTo(
          gsap.utils.toArray('.service-card'),
          { opacity: 0, y: 28 },
          {
            opacity: 1,
            y: 0,
            duration: 0.88,
            stagger: 0.1,
            ease: easeOut,
            clearProps: 'transform',
            scrollTrigger: { trigger: '#services', start: 'top 78%', once: true },
          },
        );

        gsap.fromTo(
          '.booking-panel__card > *',
          { opacity: 0, y: 24 },
          {
            opacity: 1,
            y: 0,
            duration: 0.9,
            stagger: 0.1,
            ease: easeOut,
            clearProps: 'opacity,transform',
            scrollTrigger: { trigger: '#booking', ...revealOnce },
          },
        );

        gsap.fromTo(
          ['.site-footer__brand', ...gsap.utils.toArray('.site-footer__col')],
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            duration: 0.85,
            stagger: 0.09,
            ease: easeOut,
            clearProps: 'opacity,transform',
            scrollTrigger: { trigger: '.site-footer', start: 'top 92%', once: true },
          },
        );

        gsap.utils
          .toArray('.reveal:not(.services-section):not(.contact-section):not(.booking-panel)')
          .forEach((element) => {
            gsap.fromTo(
              element,
              { opacity: 0, y: 32 },
              {
                opacity: 1,
                y: 0,
                duration: 0.95,
                ease: easeOut,
                clearProps: 'opacity,transform',
                scrollTrigger: { trigger: element, start: 'top 84%', once: true },
              },
            );
          });
      }, rootRef);
    };

    const start = () => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => bootMotion(), { timeout: 2200 });
      } else {
        window.setTimeout(bootMotion, 1);
      }
    };

    if (document.readyState === 'complete') start();
    else window.addEventListener('load', start, { once: true });

    return () => {
      cancelled = true;
      context?.revert();
    };
  }, []);

  return (
    <>
      <Suspense fallback={null}>
        <GoldWaveField />
      </Suspense>

      <div ref={rootRef} className="site-shell typography-layer">
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>

        <header className="site-header">
          <div className="shell nav-row">
            <a className="brand-mark" href="#main-content" aria-label="Hair by William">
              <svg
                className="brand-mark__glyph"
                viewBox="0 0 40 40"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                focusable="false"
              >
                <circle className="brand-mark__seal" cx="20" cy="20" r="18.5" />
                <circle className="brand-mark__ring" cx="20" cy="20" r="16.55" />
                <circle className="brand-mark__ring brand-mark__ring--inner" cx="20" cy="20" r="14.7" />
                <path
                  className="brand-mark__ticks"
                  d="M20 5.05v1.45M20 33.5v1.45M5.05 20h1.45M33.5 20h1.45"
                />
                <path
                  className="brand-mark__strand"
                  d="M12.1 13.35c2.55-2.85 6.35-3.55 7.9-1.55 1.55-2 5.35-1.3 7.9 1.55"
                />
                <path
                  className="brand-mark__strand brand-mark__strand--soft"
                  d="M13.85 14.65c1.95-1.55 4.05-1.85 6.15-.15 2.1-1.7 4.2-1.4 6.15.15"
                />
                <path
                  className="brand-mark__monogram"
                  d="M10.85 16.15h2.15l2.05 11.55L20 18.35l4.95 9.35 2.05-11.55h2.15"
                />
                <path
                  className="brand-mark__jewel"
                  d="M20 31.15l0.85 0.85-0.85 0.85-0.85-0.85z"
                />
              </svg>
              <span className="brand-mark__lockup">
                <span className="brand-mark__kicker">Hair by</span>
                <span className="brand-mark__name">William</span>
              </span>
            </a>
            <a className="ghost-link ghost-link--priority" href="#portfolio">
              Portfolio
            </a>
            <a className="ghost-link" href="#services">
              Services
            </a>
            <a className="ghost-link" href="#try-on">
              Try On
            </a>
            <a className="ghost-link" href="#booking">
              Location
            </a>
            <a className="ghost-link" href="#faq">
              FAQ
            </a>
            <a
              className="nav-phone"
              href={PHONE_HREF}
              data-mcp-action="call-salon"
              data-mcp-description="Call Hair by William at 915-920-7823. No login required."
              data-mcp-params='{"phone":"+1-915-920-7823"}'
            >
              {PHONE_LABEL}
            </a>
            <a
              className="cta-button cta-small"
              href="#contact-form"
              data-mcp-action="book-appointment"
              data-mcp-description="Jump to the booking form to request an appointment via WhatsApp or text."
              data-mcp-params='{"destination":"#contact-form"}'
            >
              Book
            </a>
          </div>
        </header>

        <main id="main-content" className="site-main" tabIndex={-1}>
          <section className="hero-stage" aria-label="Hair by William">
            <div className="hero-stage__media">
              {/*
                LCP photo is a permanent #lcp-shell in index.html (never remounted / moved).
                Optional living-hero video covers that path when HERO_AMBIENT_VIDEO is set.
              */}
              {HERO_AMBIENT_VIDEO ? (
                <AmbientVideo
                  className="hero-stage__photo"
                  src={HERO_AMBIENT_VIDEO}
                  poster="/portfolio/extensions_after-hero-desk.jpg"
                  ariaLabel="Long strawberry-blonde waves and soft fringe, custom extension finish by Hair by William in El Paso"
                  preload="metadata"
                  active
                />
              ) : null}
            </div>
            {/* Soft gold sidelight / specular lift — sells hair without neon rim */}
            <div className="hero-stage__hair-sheen" aria-hidden="true" />
            <div className="hero-stage__overlay" aria-hidden="true" />
            <div className="hero-stage__content shell">
              <div className="hero-stage__copy">
                <h1 className="hero-title">
                  <span className="hero-title-secondary">Hair by</span>
                  <span className="hero-title-rule" aria-hidden="true" />
                  <span className="hero-title-primary">William</span>
                  <span className="sr-only">
                    {" "}
                    El Paso hair stylist for extensions, cuts, and color
                  </span>
                </h1>
                <p className="lead hero-copy">
                  Custom extensions, precision cuts, and color in El Paso. Twenty-seven years in the
                  chair.
                </p>
                <p className="hero-trust">
                  <span>Friday–Saturday · 10 AM–6 PM</span>
                  <span aria-hidden="true">·</span>
                  <span>El Paso · Suite 13C</span>
                </p>
                <div className="hero-actions">
                  <a
                    className="cta-button"
                    href="#contact-form"
                    data-mcp-action="book-appointment"
                    data-mcp-description="Book an appointment with Hair by William for extensions, cuts, color, or Brazilian Blowout. Opens the guest booking form."
                    data-mcp-params='{"destination":"#contact-form"}'
                  >
                    Book
                  </a>
                  <a
                    className="secondary-button secondary-button--on-dark"
                    href="#portfolio"
                    data-mcp-action="view-portfolio"
                    data-mcp-description="View the Hair by William salon portfolio of extensions, color, cuts, and blowouts."
                    data-mcp-params='{"destination":"#portfolio"}'
                  >
                    Portfolio
                  </a>
                </div>
              </div>
            </div>
            <aside className="hero-film" aria-label="Salon work in the chair">
              <ul className="hero-film__strip">
                {heroWorkClips.map((clip) => {
                  const portfolioHref = `#${clip.slideId}`;
                  return (
                    <li key={clip.id} className="hero-film__cell">
                      <a
                        className="hero-film__link"
                        href={portfolioHref}
                        aria-label={`${clip.alt}. View in portfolio`}
                        data-mcp-action="view-portfolio"
                        data-mcp-description="Open the salon portfolio on the matching motion clip."
                        data-mcp-params={`{"destination":"${portfolioHref}"}`}
                      >
                        <AmbientVideo
                          className="hero-film__media"
                          src={clip.src}
                          poster={clip.poster}
                          ariaLabel={clip.alt}
                          preload="none"
                          active
                        />
                      </a>
                    </li>
                  );
                })}
              </ul>
            </aside>
          </section>

          <Suspense fallback={null}>
            <PortfolioGallery />
          </Suspense>

          <Suspense fallback={null}>
            <ServicesGrid />
          </Suspense>

          <Suspense fallback={null}>
            <StyleQuiz />
          </Suspense>

          <Suspense fallback={null}>
            <HairTryOn />
          </Suspense>

          <Suspense fallback={null}>
            <ContactForm />
          </Suspense>

          <section
            id="booking"
            className="shell section booking-panel"
            aria-labelledby="booking-visit-heading"
          >
            <div className="booking-panel__card motion-block">
              <div className="booking-panel__body">
                <h2 id="booking-visit-heading" className="section-heading booking-panel__heading">
                  Your Appointment in El Paso
                </h2>
                <p className="lead booking-panel__copy">
                  Extensions, precision cuts, color correction, and Brazilian Blowout at Suite 13C
                  inside LV Hair Salon. Book ahead, then find us on North Mesa.
                </p>

                <dl className="booking-hours" aria-label="Salon hours and studio address">
                  <div className="booking-hours__row">
                    <dt>Hours</dt>
                    <dd>
                      Friday–Saturday 10 AM–6 PM
                      <span className="booking-hours__closed">Closed Sunday–Thursday</span>
                    </dd>
                  </div>
                  <div className="booking-hours__row booking-hours__row--studio">
                    <dt>Studio</dt>
                    <dd>
                      <address className="booking-hours__address">
                        <a href={DIRECTIONS_URL} target="_blank" rel="noopener noreferrer">
                          {STUDIO_ADDRESS}
                        </a>
                        <span className="booking-hours__city">{STUDIO_CITY}</span>
                      </address>
                    </dd>
                  </div>
                  <div className="booking-hours__row">
                    <dt>Book</dt>
                    <dd className="booking-hours__note">
                      Call, text, or WhatsApp{" "}
                      <a className="booking-hours__phone" href={PHONE_HREF}>
                        {PHONE_LABEL}
                      </a>
                      {" · "}
                      next open slot confirmed when you reach out
                    </dd>
                  </div>
                </dl>

                <div className="booking-actions">
                  <a
                    className="cta-button booking-panel__cta"
                    href="#contact-form"
                    data-mcp-action="book-appointment"
                    data-mcp-description="Book your Hair by William appointment via WhatsApp or text."
                    data-mcp-params='{"destination":"#contact-form"}'
                  >
                    Book
                  </a>
                  <a
                    className="secondary-button secondary-button--on-dark"
                    href={DIRECTIONS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-mcp-action="get-directions"
                    data-mcp-description="Open Google Maps directions to Hair by William at 5411 N. Mesa, Suite 13C, El Paso, TX 79912."
                    data-mcp-params='{"destination":"5411 N. Mesa, Suite 13C, El Paso, TX 79912"}'
                  >
                    Get Directions
                  </a>
                </div>
              </div>

              <Suspense fallback={null}>
                <MapSection />
              </Suspense>

              <figure className="booking-panel__clip">
                <a
                  className="booking-panel__clip-hit"
                  href="#clip-03"
                  data-mcp-action="open-portfolio"
                  data-mcp-description="Watch the matching chair-finish clip in the portfolio gallery."
                  data-mcp-params='{"destination":"#clip-03"}'
                  aria-label={`${bookingAmbientClip.alt}. Open in portfolio.`}
                >
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
                </a>
                <figcaption className="booking-panel__clip-caption">
                  <span className="booking-panel__clip-title">{bookingAmbientClip.title}</span>
                  <a className="booking-panel__clip-link" href="#clip-03">
                    More in portfolio
                  </a>
                </figcaption>
              </figure>
            </div>
          </section>

          <Suspense fallback={null}>
            <SalonFaq />
          </Suspense>
        </main>

        <footer className="site-footer">
          <div className="shell site-footer__inner">
            <div className="site-footer__brand motion-block">
              <p className="kicker">Hair by William</p>
              <p className="site-footer-copy">
                El Paso hair stylist for custom extensions, precision cuts, color correction, and
                Brazilian Blowouts. Twenty-seven years of refined artistry. Every texture and length
                welcome.
              </p>
            </div>
            <div className="site-footer__grid" aria-label="Salon contact details">
              <div className="site-footer__col motion-block">
                <p className="site-footer__label">Studio</p>
                <p>
                  <a
                    href={MAPS_SEARCH_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-mcp-action="open-maps"
                    data-mcp-description="Open Google Maps for Hair by William at 5411 N. Mesa, Suite 13C, El Paso, TX 79912."
                  >
                    5411 N. Mesa, Suite 13C
                  </a>
                </p>
                <p className="footer-hours">El Paso, TX 79912 · LV Hair Salon</p>
              </div>
              <div className="site-footer__col motion-block">
                <p className="site-footer__label">Contact</p>
                <p>
                  <a
                    href={PHONE_HREF}
                    data-mcp-action="call-salon"
                    data-mcp-description="Call Hair by William at 915-920-7823."
                    data-mcp-params='{"phone":"+1-915-920-7823"}'
                  >
                    {PHONE_LABEL}
                  </a>
                </p>
                <p className="footer-hours">Friday–Saturday 10 AM–6 PM</p>
                <p className="footer-hours">Closed Sunday–Thursday</p>
              </div>
              <div className="site-footer__col motion-block">
                <p className="site-footer__label">Explore</p>
                <ul className="site-footer__nav">
                  <li>
                    <a href="#portfolio">Portfolio</a>
                  </li>
                  <li>
                    <a href="#services">Services</a>
                  </li>
                  <li>
                    <a href="#try-on">Try On</a>
                  </li>
                  <li>
                    <a href="#contact-form">Book</a>
                  </li>
                  <li>
                    <a href="#booking">Location</a>
                  </li>
                  <li>
                    <a href="#faq">FAQ</a>
                  </li>
                </ul>
              </div>
            </div>
            <p className="site-footer__legal">
              <a href="/privacy.html">Privacy</a>
            </p>
          </div>
        </footer>

        <MobileCtaBar />
      </div>
    </>
  );
}
