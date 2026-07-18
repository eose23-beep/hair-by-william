import { useCallback, useRef } from "react";

const services = [
  {
    id: "extensions",
    label: "01",
    title: "Extensions",
    description:
      "Custom length and volume with seamless blending — tape-in, weft, and beaded bond installations.",
    image: "/portfolio/extensions_after.jpg",
    imageAlt: "Seamless custom hair extensions with natural length and blended volume by Hair by William",
  },
  {
    id: "brazilian-blowout",
    label: "02",
    title: "Brazilian Blowout",
    description:
      "Thermo-active smoothing for lasting shine, softness, and frizz control that still moves like you.",
    image: "/portfolio/blowout_after.jpg",
    imageAlt: "Brazilian Blowout finish with soft shine and smooth, frizz-controlled movement",
  },
  {
    id: "precision-cuts",
    label: "03",
    title: "Precision Cuts",
    description:
      "Architectural shaping tailored to your face, texture, and lifestyle — clean lines with editorial finish.",
    image: "/portfolio/work-03.png",
    imageAlt: "Precision cut with polished silhouette and editorial finish",
  },
  {
    id: "color-correction",
    label: "04",
    title: "Color Correction",
    description:
      "Thoughtful restoration for uneven tone, brassiness, or past color — healthy hair, refined results.",
    image: "/portfolio/work-05.png",
    imageAlt: "Color correction with balanced tone and healthy, refined results",
  },
];

function ServiceCard({ service, index }) {
  const cardRef = useRef(null);

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
      ref={cardRef}
      className="service-card"
      style={{ "--card-i": index }}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      <div className="service-card__face">
        {service.image ? (
          <div className="service-card__media">
            <img
              className="service-card__image"
              src={service.image}
              alt={service.imageAlt || ""}
              loading="lazy"
              decoding="async"
            />
          </div>
        ) : null}
        <div className="service-card__content">
          <p className="service-card__label">{service.label}</p>
          <div className="service-card__body">
            <h3 className="service-card__title">{service.title}</h3>
            <p className="service-card__description">{service.description}</p>
          </div>
          <a className="service-card__cta" href="#contact">
            Book
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
      </header>

      <div className="services-menu-3d" aria-label="Hair by William salon services">
        {services.map((service, index) => (
          <ServiceCard key={service.id} service={service} index={index} />
        ))}
      </div>
    </section>
  );
}
