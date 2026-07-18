const PHONE_HREF = "tel:915-920-7823";
const PHONE_LABEL = "915-920-7823";

export default function BookingFab() {
  return (
    <a
      href={PHONE_HREF}
      className="booking-fab"
      aria-label={`Call Hair by William at ${PHONE_LABEL}`}
    >
      <span className="booking-fab__pulse" aria-hidden="true" />
      <span className="booking-fab__icon" aria-hidden="true">
        ☎
      </span>
      <span className="booking-fab__copy">
        <span className="booking-fab__kicker">Call now</span>
        <span className="booking-fab__number">{PHONE_LABEL}</span>
      </span>
    </a>
  );
}
