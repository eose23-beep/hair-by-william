const PHONE_HREF = "tel:915-920-7823";
const PHONE_LABEL = "915-920-7823";

export default function BookingFab() {
  return (
    <a
      href={PHONE_HREF}
      className="booking-fab"
      aria-label={`Call Hair by William at ${PHONE_LABEL} to book`}
      data-mcp-action="call-salon"
      data-mcp-description="Call Hair by William at 915-920-7823 to book an appointment. Guest-friendly, no account required."
      data-mcp-params='{"phone":"+1-915-920-7823"}'
    >
      <span className="booking-fab__pulse" aria-hidden="true" />
      <svg
        className="booking-fab__svg"
        viewBox="0 0 24 24"
        width="18"
        height="18"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.11-.23c1.21.49 2.53.76 3.88.76a1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.35.27 2.67.76 3.88a1 1 0 01-.23 1.11l-2.2 2.2z" />
      </svg>
      <span className="booking-fab__copy">
        <span className="booking-fab__kicker">Call</span>
        <span className="booking-fab__number">{PHONE_LABEL}</span>
      </span>
    </a>
  );
}
