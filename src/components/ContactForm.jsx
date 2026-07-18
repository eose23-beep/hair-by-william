import { useId, useState } from "react";
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
  const [touched, setTouched] = useState({ name: false, phone: false });

  const formHintId = useId();
  const nameHintId = useId();
  const phoneHintId = useId();

  const nameValid = name.trim().length > 1;
  const phoneValid = phone.trim().length >= 7;
  const isValid = nameValid && phoneValid;

  const markTouched = (field) => {
    setTouched((current) => ({ ...current, [field]: true }));
  };

  const handleWhatsApp = (event) => {
    event.preventDefault();
    setTouched({ name: true, phone: true });
    if (!isValid) return;

    const text = buildMessage({ name, phone, service, message });
    const url = `https://wa.me/${PHONE_E164}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleText = (event) => {
    event.preventDefault();
    setTouched({ name: true, phone: true });
    if (!isValid) return;

    const body = buildMessage({ name, phone, service, message });
    window.location.href = `sms:+${PHONE_E164}?body=${encodeURIComponent(body)}`;
  };

  return (
    <section id="contact" className="shell section reveal contact-section">
      <div className="contact-section__layout">
        <aside className="contact-section__intro">
          <p className="kicker">Book Appointment</p>
          <h2 className="section-heading">Request Your Visit</h2>
          <p className="lead contact-section__copy">
            Share your details and send via WhatsApp or Text — your message opens ready to send. No
            account needed.
          </p>

          <dl className="contact-section__studio" aria-label="Studio details">
            <div>
              <dt>Studio</dt>
              <dd>5411 N. Mesa, Suite 13C · El Paso, TX 79912 · LV Hair Salon</dd>
            </div>
            <div>
              <dt>Hours</dt>
              <dd>Friday &amp; Saturday — call for availability</dd>
            </div>
            <div>
              <dt>Direct</dt>
              <dd>
                <a href={`tel:${PHONE_DISPLAY}`}>{PHONE_DISPLAY}</a>
              </dd>
            </div>
          </dl>

          <ol className="contact-form__steps contact-form__steps--intro" aria-label="Booking steps">
            <li className="contact-form__step is-active" aria-current="step">
              <span className="contact-form__step-label">Your details</span>
            </li>
            <li className="contact-form__step">
              <span className="contact-form__step-label">Send request</span>
            </li>
          </ol>
        </aside>

        <div className="contact-section__form-wrap">
          <form
            className="contact-form"
            onSubmit={handleWhatsApp}
            aria-labelledby="contact-form-title"
            aria-describedby={formHintId}
            noValidate
          >
            <h3 id="contact-form-title" className="sr-only">
              Appointment request form
            </h3>
            <p id={formHintId} className="contact-form__hint">
              All hair textures and lengths welcome. Required fields are marked with an asterisk.
            </p>

            <fieldset className="contact-form__fieldset">
              <legend className="contact-form__legend">Contact information</legend>

              <div className="contact-form__grid">
                <label className="contact-field">
                  <span>
                    Your name <span aria-hidden="true">*</span>
                  </span>
                  <input
                    type="text"
                    name="name"
                    autoComplete="name"
                    placeholder="Alex Rivera"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    onBlur={() => markTouched("name")}
                    aria-required="true"
                    aria-invalid={touched.name && !nameValid}
                    aria-describedby={nameHintId}
                    required
                  />
                  {touched.name && !nameValid ? (
                    <span id={nameHintId} className="contact-field__error" role="alert">
                      Enter your full name so William can confirm your appointment.
                    </span>
                  ) : (
                    <span id={nameHintId} className="contact-field__hint">
                      First and last name preferred.
                    </span>
                  )}
                </label>

                <label className="contact-field">
                  <span>
                    Your phone <span aria-hidden="true">*</span>
                  </span>
                  <input
                    type="tel"
                    name="phone"
                    autoComplete="tel"
                    inputMode="tel"
                    placeholder="915-555-1234"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    onBlur={() => markTouched("phone")}
                    aria-required="true"
                    aria-invalid={touched.phone && !phoneValid}
                    aria-describedby={phoneHintId}
                    required
                  />
                  {touched.phone && !phoneValid ? (
                    <span id={phoneHintId} className="contact-field__error" role="alert">
                      Add a phone number where William can reach you.
                    </span>
                  ) : (
                    <span id={phoneHintId} className="contact-field__hint">
                      Used only to confirm your booking.
                    </span>
                  )}
                </label>
              </div>
            </fieldset>

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
                placeholder="Preferred day, hair goals, reference photo, accessibility needs, etc."
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

            <p className="contact-form__note" role="status" aria-live="polite">
              {isValid
                ? "Ready to send — choose WhatsApp or Text above."
                : "Complete your name and phone to continue."}
            </p>

            <p className="contact-form__note contact-form__note--secondary">
              Or call William directly:{" "}
              <a href={`tel:${PHONE_DISPLAY}`}>{PHONE_DISPLAY}</a>
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
