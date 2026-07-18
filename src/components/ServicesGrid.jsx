import { useCallback, useRef } from "react";

const services = [
  {
    id: "extensions",
    bookSlug: "extensions",
    label: "01",
    title: "Hair Extensions",
    description:
      "Custom hair extensions for seamless length and volume — tape-in, weft, I-tip, and beaded bond installations blended to your texture.",
    image: "/portfolio/extensions_after.jpg",
    imageAlt:
      "Seamless custom hair extensions with natural length and blended volume by Hair by William",
  },
  {
    id: "brazilian-blowout",
    bookSlug: "blowout",
    label: "02",
    title: "Brazilian Blowout",
    description:
      "Professional Brazilian Blowout smoothing for lasting shine, softness, and frizz control that still moves like you.",
    image: "/portfolio/blowout_after.jpg",
    imageAlt: "Brazilian Blowout finish with soft shine and smooth, frizz-controlled movement",
  },
  {
    id: "precision-cuts",
    bookSlug: "cuts",
    label: "03",
    title: "Precision Cuts",
    description:
      "Precision haircuts shaped to your face, texture, and lifestyle — clean lines with an editorial finish.",
    image: "/portfolio/work-03.png",
    imageAlt: "Precision cut with polished silhouette and editorial finish",
  },
  {
    id: "color-correction",
    bookSlug: "color",
    label: "04",
    title: "Color Correction",
    description:
      "Dimensional color and color correction for uneven tone, brassiness, or past color — healthy hair, refined results.",
    image: "/portfolio/work-05.png",
    imageAlt: "Color correction with balanced tone and healthy, refined results",
  },
];

function ServiceCard({ service, index }) {
  const cardRef = useRef(null);
  const bookHref = `?service=${service.bookSlug}#contact`;

  const onMove = useCallback((event) => {
    const el = cardRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const rect = el.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    /* Subtle desktop tilt — strong rotate reads as accidental misalignment */
    el.style.setProperty("--tilt-x", `${((0.5 - y) * 3.5).toFixed(2)}deg`);
    el.style.setProperty("--tilt-y", `${((x - 0.5) * 4.5).toFixed(2)}deg`);
    el.style.setProperty("--glow-x", `${(x * 100).toFixed(1)}%`);
    el.style.setProperty("--glow-y", `${(y * 100).toFixed(1)}%`);
  }, []);

  const onLeave = useCallback(() => {
    const el = cardRef.current;
    if (!el) return;
    el.style.setProperty("--tilt-x", "0deg");
    el.style.setProperty("--tilt-y", "0deg");
    el.style.setProperty("--glow-x", "50%");
    el.style.setProperty("--glow-y", "40%");
  }, []);

  return (
    <article
      id={service.id}
      ref={cardRef}
      className="service-card"
      style={{ "--card-i": index }}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      aria-labelledby={`${service.id}-title`}
    >
      <div className="service-card__face">
        {service.image ? (
          <div className="service-card__media">
            <picture>
              <source
                srcSet={service.image.replace(/\.(png|jpe?g)$/i, ".webp")}
                type="image/webp"
              />
              <img
                className="service-card__image"
                src={service.image}
                alt={service.imageAlt || ""}
                loading="lazy"
                decoding="async"
                width={800}
                height={1000}
              />
            </picture>
          </div>
        ) : null}
        <div className="service-card__content">
          <p className="service-card__label">{service.label}</p>
          <div className="service-card__body">
            <h3 id={`${service.id}-title`} className="service-card__title">
              {service.title}
            </h3>
            <p className="service-card__description">{service.description}</p>
          </div>
          <a
            className="service-card__cta"
            href={bookHref}
            data-mcp-action="book-appointment"
            data-mcp-description={`Book a ${service.title} appointment with Hair by William in El Paso via WhatsApp or text. No account required.`}
            data-mcp-params={`{"service":"${service.bookSlug}","destination":"#contact"}`}
          >
            Book {service.title.split(" ")[0]}
          </a>
        </div>
      </div>
    </article>
  );
}

export default function ServicesGrid() {
  return (
    <section id="services" className="shell section services-section reveal">
      <header className="services-section__header">
        <p className="lookbook-tag">Signature Services</p>
        <h2 className="section-heading">Hair Services</h2>
        <p className="lead services-section__copy">
          Tailored for your texture, length, and goals — custom extensions, Brazilian Blowout,
          precision cuts, and color correction in El Paso.
        </p>
        <nav className="services-section__jump" aria-label="Jump to a service">
          <a href="#extensions">Extensions</a>
          <a href="#precision-cuts">Cuts</a>
          <a href="#color-correction">Color</a>
          <a href="#brazilian-blowout">Blowout</a>
          <a href="#contact">Book</a>
        </nav>
      </header>

      <div className="services-menu-3d" aria-label="Hair by William salon services">
        {services.map((service, index) => (
          <ServiceCard key={service.id} service={service} index={index} />
        ))}
      </div>
    </section>
  );
}
