const SALON_ADDRESS = "5411 N. Mesa, Suite 13C, El Paso, TX 79912";
const SALON_ADDRESS_SHORT = "5411 N. Mesa, Suite 13C, El Paso, TX";
const PHONE_HREF = "tel:915-920-7823";
const PHONE_LABEL = "915-920-7823";

const MAP_QUERY = encodeURIComponent(SALON_ADDRESS);
const DIRECTIONS_URL = `https://www.google.com/maps/dir/?api=1&destination=${MAP_QUERY}`;
const MAPS_SEARCH_URL = `https://www.google.com/maps/search/?api=1&query=${MAP_QUERY}`;
const MAP_EMBED_URL = `https://maps.google.com/maps?q=${MAP_QUERY}&z=16&hl=en&output=embed`;

export default function MapSection() {
  return (
    <section
      id="visit"
      className="map-section shell section reveal"
      aria-labelledby="map-section-heading"
    >
      <header className="map-section__header">
        <p className="kicker">El Paso Studio</p>
        <h2 id="map-section-heading" className="section-heading map-section__heading">
          Visit Us in El Paso
        </h2>
        <p className="lead map-section__copy">
          Hair by William — Suite 13C inside LV Hair Salon on North Mesa. Call ahead for Friday and
          Saturday availability.
        </p>
      </header>

      <div className="map-section__meta">
        <address className="map-section__address">
          <span className="map-section__address-line">{SALON_ADDRESS_SHORT}</span>
          <span className="map-section__address-line">79912 · LV Hair Salon</span>
        </address>
        <div className="map-section__actions">
          <a className="map-section__phone" href={PHONE_HREF}>
            {PHONE_LABEL}
          </a>
          <a
            className="secondary-button map-section__directions"
            href={DIRECTIONS_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Get Directions
          </a>
        </div>
      </div>

      <div className="map-section__frame">
        <iframe
          className="map-section__embed"
          title={`Map showing Hair by William at ${SALON_ADDRESS}`}
          src={MAP_EMBED_URL}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
        <p className="map-section__fallback">
          <a href={MAPS_SEARCH_URL} target="_blank" rel="noopener noreferrer">
            Open location in Google Maps
          </a>
        </p>
      </div>
    </section>
  );
}
