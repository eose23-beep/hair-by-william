import { MAPS_SEARCH_URL, MAP_EMBED_URL, SALON_ADDRESS } from "../data/location";

/**
 * Studio map embed — nested in the booking card beside the craft clip.
 * Anchor target: #visit (outer section uses #booking).
 */
export default function MapSection() {
  return (
    <div
      id="visit"
      className="booking-panel__map"
      aria-label={`Map showing Hair by William at ${SALON_ADDRESS}`}
    >
      <div className="booking-panel__map-frame">
        <iframe
          className="booking-panel__map-embed"
          title={`Map showing Hair by William at ${SALON_ADDRESS}`}
          src={MAP_EMBED_URL}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
        <p className="booking-panel__map-fallback">
          <a
            href={MAPS_SEARCH_URL}
            target="_blank"
            rel="noopener noreferrer"
            data-mcp-action="open-location"
            data-mcp-description="Open the Hair by William salon location in Google Maps at 5411 N. Mesa, Suite 13C, El Paso, TX 79912."
            data-mcp-params='{"address":"5411 N. Mesa, Suite 13C, El Paso, TX 79912"}'
          >
            Open location in Google Maps
          </a>
        </p>
      </div>
    </div>
  );
}
