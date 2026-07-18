import { useState } from "react";
import { MessageCircle, Phone } from "lucide-react";

const PHONE_E164 = "19159207823";
const PHONE_DISPLAY = "915-920-7823";

const SERVICE_OPTIONS = [
  "Extensions",
  "Brazilian Blowout",
  "Precision Cuts",
  "Color Correction",
  "Not sure yet — consultation",
];

function buildMessage({ name, phone, service, message }) {
  return [
    "Hi William — I'd like to book an appointment.",
    "",
    `Name: ${name}`,
    `Phone: ${phone}`,
    `Service: ${service}`,
    message ? `Notes: ${message}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

export default function ContactForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [service, setService] = useState(SERVICE_OPTIONS[0]);
  const [message, setMessage] = useState("");

  const isValid = name.trim().length > 1 && phone.trim().length >= 7;

  const handleWhatsApp = (event) => {
    event.preventDefault();
    if (!isValid) return;

    const text = buildMessage({ name, phone, service, message });
    const url = `https://wa.me/${PHONE_E164}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleText = (event) => {
    event.preventDefault();
    if (!isValid) return;

    const body = buildMessage({ name, phone, service, message });
    window.location.href = `sms:+${PHONE_E164}?body=${encodeURIComponent(body)}`;
  };

  return (
    <section id="contact" className="section reveal contact-section">
      <p className="kicker">Book Appointment</p>
      <h2 className="section-heading">Request Your Visit</h2>
      <p className="lead contact-section__copy">
        Share your details and send via WhatsApp or Text — your message opens ready to send. No
        account needed.
      </p>

      <form className="contact-form" onSubmit={handleWhatsApp}>
        <div className="contact-form__grid">
          <label className="contact-field">
            <span>Your name</span>
            <input
              type="text"
              name="name"
              autoComplete="name"
              placeholder="Maria Garcia"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </label>

          <label className="contact-field">
            <span>Your phone</span>
            <input
              type="tel"
              name="phone"
              autoComplete="tel"
              placeholder="915-555-1234"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              required
            />
          </label>
        </div>

        <label className="contact-field">
          <span>What are you interested in?</span>
          <select
            name="service"
            value={service}
            onChange={(event) => setService(event.target.value)}
          >
            {SERVICE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="contact-field">
          <span>Anything else? (optional)</span>
          <textarea
            name="message"
            rows={3}
            placeholder="Preferred day, reference photo, etc."
            value={message}
            onChange={(event) => setMessage(event.target.value)}
          />
        </label>

        <div className="contact-form__actions">
          <button type="submit" className="cta-button contact-form__whatsapp" disabled={!isValid}>
            <MessageCircle size={18} strokeWidth={1.75} aria-hidden="true" />
            Book via WhatsApp
          </button>
          <button
            type="button"
            className="secondary-button contact-form__text"
            disabled={!isValid}
            onClick={handleText}
          >
            <Phone size={16} strokeWidth={1.75} aria-hidden="true" />
            Book via Text
          </button>
        </div>

        <p className="contact-form__note">
          Or call William directly:{" "}
          <a href={`tel:${PHONE_DISPLAY}`}>{PHONE_DISPLAY}</a>
        </p>
      </form>
    </section>
  );
}
