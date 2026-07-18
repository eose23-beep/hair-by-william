const services = [
  {
    index: 'I',
    name: 'Custom Hair Extensions',
    description: "Blending, volume, and length",
  },
  {
    index: 'II',
    name: 'Brazilian Blowouts & Smoothing',
    description: 'Frizz-free, radiant, manageable',
  },
  {
    index: 'III',
    name: 'Dimensional Color',
    description: 'Hand-painted, premium lived-in color',
  },
  {
    index: 'IV',
    name: 'Precision Cutting & Texture',
    description: 'Bespoke structural cuts',
  },
];

export default function ServicesMenu() {
  return (
    <div className="services-menu">
      <div className="section-heading-wrap">
        <p className="kicker">Services</p>
        <h2 className="section-heading">Signature atelier menu</h2>
      </div>

      <div className="services-grid">
        {services.map((service) => (
          <article key={service.name} className="service-card">
            <div className="service-meta">
              <p>{service.index}</p>
            </div>
            <h3>{service.name}</h3>
            <p className="service-subtext">{service.description}</p>
            <a className="service-link" href="#booking">
              Reserve an Experience
            </a>
          </article>
        ))}
      </div>
    </div>
  );
}
