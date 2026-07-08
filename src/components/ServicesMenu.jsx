const services = [
  {
    name: 'Volume Extensions',
    description:
      'Premium nano-bead and tape-in boutique hair extensions for natural volume, length, and movement — the Westside\'s most sought-after extension experience.',
    price: 'From $285',
    duration: '4–6 hours',
  },
  {
    name: 'Platinum Balayage',
    description:
      'Hand-painted, sun-kissed dimension with icy platinum tones and zero harsh lines — a signature custom balayage blended for your skin tone and lifestyle.',
    price: 'From $425',
    duration: '4–5 hours',
  },
  {
    name: 'Precision Cuts',
    description:
      'A precision cut tailored to your face shape, finished with a polished blowout at our El Paso Westside salon studio.',
    price: 'From $95',
    duration: '1–1.5 hours',
  },
];

export default function ServicesMenu() {
  return (
    <div>
      <div className="text-center mb-12">
        <p className="text-champagne text-sm font-medium tracking-[0.2em] uppercase mb-3">
          El Paso Westside Salon Services
        </p>
        <h2 className="font-serif text-4xl md:text-5xl text-charcoal font-light tracking-tight">
          Boutique Extensions &amp; Custom Balayage
        </h2>
        <p className="mt-4 text-slate max-w-xl mx-auto text-base leading-relaxed">
          Every service at our 79912 Westside studio begins with a personalized consultation — serving El Paso, Coronado, and the 79932 corridor.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {services.map((service) => (
          <article
            key={service.name}
            className="bg-white/40 backdrop-blur-xl border border-black/5 rounded-xl p-6 shadow-soft hover:shadow-card transition-shadow duration-300"
          >
            <h3 className="font-serif text-xl text-charcoal mb-2">{service.name}</h3>
            <p className="text-slate text-sm leading-relaxed mb-5">{service.description}</p>
            <div className="flex items-center justify-between pt-4 border-t border-black/5">
              <span className="text-champagne font-medium text-sm">{service.price}</span>
              <span className="text-slate/70 text-xs">{service.duration}</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
