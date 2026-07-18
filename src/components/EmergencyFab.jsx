import { Phone } from "lucide-react";

const PHONE_HREF = "tel:915-920-7823";
const PHONE_LABEL = "915-920-7823";

export default function EmergencyFab() {
  return (
    <a
      href={PHONE_HREF}
      className="emergency-fab"
      aria-label={`Call William to book - ${PHONE_LABEL}`}
    >
      <span className="emergency-fab__pulse" aria-hidden="true" />
      <Phone size={20} strokeWidth={2} aria-hidden="true" />
      <span className="emergency-fab__copy">
        <span className="emergency-fab__kicker">Call</span>
        <span className="emergency-fab__number">{PHONE_LABEL}</span>
      </span>
    </a>
  );
}
