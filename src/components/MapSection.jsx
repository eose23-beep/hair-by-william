import { useState } from "react";
import { MAPS_SEARCH_URL, MAP_EMBED_URL, SALON_ADDRESS } from "../data/location";

/**
 * Studio map — click-to-load embed so Google Maps JS stays off the critical path.
 * Anchor target: #visit (outer section uses #booking).
 */
export default function MapSection() {
  const [mapActive, setMapActive] = useState(false);

  return (
    <div
      id="visit"
      className="booking-panel__map"
      aria-label={`Map showing Hair by William at ${SALON_ADDRESS}`}
    >
      <div className="booking-panel__map-frame">
        {mapActive ? (
          <iframe
            className="booking-panel__map-embed"
            title={`Map showing Hair by William at ${SALON_ADDRESS}`}
            src={MAP_EMBED_URL}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            className="booking-panel__map-activate"
            onClick={() => setMapActive(true)}
            aria-label={`Load interactive map for ${SALON_ADDRESS}`}
          >
            <span className="booking-panel__map-activate-kicker">El Paso · Suite 13C</span>
            <span className="booking-panel__map-activate-title">Load map</span>
            <span className="booking-panel__map-activate-hint">Tap to explore the studio location</span>
          </button>
        )}
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
