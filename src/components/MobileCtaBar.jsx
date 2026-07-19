import { DIRECTIONS_URL } from "../data/location";

const PHONE_HREF = "tel:915-920-7823";
const PHONE_LABEL = "915-920-7823";

/**
 * Mobile conversion rail — Book / Call / Directions in the thumb zone.
 * Editorial ink + gold; replaces the single floating call FAB on small screens.
 */
export default function MobileCtaBar() {
  return (
    <nav className="mobile-cta-bar" aria-label="Book, call, or get directions">
      <p className="mobile-cta-bar__hours">Friday–Saturday · 10 AM–6 PM · El Paso</p>
      <div className="mobile-cta-bar__actions">
        <a
          className="mobile-cta-bar__book"
          href="#contact-form"
          data-mcp-action="book-appointment"
          data-mcp-description="Jump to the booking form to request an appointment via WhatsApp or text."
          data-mcp-params='{"destination":"#contact-form","placement":"mobile-sticky"}'
        >
          Book
        </a>
        <a
          className="mobile-cta-bar__call"
          href={PHONE_HREF}
          data-mcp-action="call-salon"
          data-mcp-description="Call Hair by William at 915-920-7823 to book. Open Friday-Saturday 10 AM-6 PM."
          data-mcp-params='{"phone":"+1-915-920-7823","placement":"mobile-sticky"}'
        >
          <span className="mobile-cta-bar__glyph" aria-hidden="true">
            ☎
          </span>
          Call
          <span className="sr-only"> {PHONE_LABEL}</span>
        </a>
        <a
          className="mobile-cta-bar__dir"
          href={DIRECTIONS_URL}
          target="_blank"
          rel="noopener noreferrer"
          data-mcp-action="get-directions"
          data-mcp-description="Open Google Maps directions to Hair by William at 5411 N. Mesa, Suite 13C, El Paso, TX 79912."
          data-mcp-params='{"destination":"5411 N. Mesa, Suite 13C, El Paso, TX 79912","placement":"mobile-sticky"}'
        >
          Directions
        </a>
      </div>
    </nav>
  );
}
