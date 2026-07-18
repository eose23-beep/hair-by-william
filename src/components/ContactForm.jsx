import { useEffect, useId, useRef, useState } from "react";
import { MessageCircle, Phone } from "lucide-react";

const PHONE_E164 = "19159207823";
const PHONE_DISPLAY = "915-920-7823";
const WHATSAPP_HREF = `https://wa.me/${PHONE_E164}`;

const SERVICE_OPTIONS = [
  "Extensions",
  "Brazilian Blowout",
  "Precision Cuts",
  "Color Correction",
  "Not sure yet - consultation",
];

/** Slugs from service card Book links (/?service=…#contact or #booking-…). */
const SERVICE_SLUG_MAP = {
  extensions: "Extensions",
  blowout: "Brazilian Blowout",
  "brazilian-blowout": "Brazilian Blowout",
  cuts: "Precision Cuts",
  "precision-cuts": "Precision Cuts",
  color: "Color Correction",
  "color-correction": "Color Correction",
  consultation: "Not sure yet - consultation",
};

function resolveServiceSlug(raw) {
  if (!raw) return null;
  const slug = String(raw).trim().toLowerCase();
  return SERVICE_SLUG_MAP[slug] ?? null;
}

function resolveServiceFromLocation() {
  const params = new URLSearchParams(window.location.search);
  const fromQuery = resolveServiceSlug(params.get("service"));
  if (fromQuery) return fromQuery;

  const hash = window.location.hash.replace(/^#/, "");
  const hashMatch = hash.match(/^(?:booking|contact)-([a-z0-9-]+)$/i);
  if (hashMatch) return resolveServiceSlug(hashMatch[1]);

  return null;
}

function buildMessage({ name, phone, service, message }) {
  return [
    "Hi William - I'd like to book an appointment.",
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
  const [attempted, setAttempted] = useState(false);
  const [serviceHighlighted, setServiceHighlighted] = useState(false);

  const formHintId = useId();
  const nameHintId = useId();
  const phoneHintId = useId();
  const statusId = useId();
  const serviceSelectRef = useRef(null);
  const highlightTimerRef = useRef(null);
  const nameInputRef = useRef(null);

  const nameValid = name.trim().length > 1;
  const phoneValid = phone.trim().length >= 7;
  const isValid = nameValid && phoneValid;
  const showNameError = (touched.name || attempted) && !nameValid;
  const showPhoneError = (touched.phone || attempted) && !phoneValid;

  useEffect(() => {
    const applyService = (resolved) => {
      if (!resolved) return;
      setService(resolved);
      setServiceHighlighted(true);
      if (highlightTimerRef.current) window.clearTimeout(highlightTimerRef.current);
      highlightTimerRef.current = window.setTimeout(() => {
        setServiceHighlighted(false);
        highlightTimerRef.current = null;
      }, 2400);
    };

    const applyFromUrl = () => {
      applyService(resolveServiceFromLocation());
    };

    const onDocumentClick = (event) => {
      const anchor = event.target.closest("a[href]");
      if (!anchor) return;
      try {
        const url = new URL(anchor.getAttribute("href"), window.location.href);
        if (url.origin !== window.location.origin) return;
        const fromQuery = resolveServiceSlug(url.searchParams.get("service"));
        if (fromQuery) {
          applyService(fromQuery);
          return;
        }
        const hash = url.hash.replace(/^#/, "");
        const hashMatch = hash.match(/^(?:booking|contact)-([a-z0-9-]+)$/i);
        if (hashMatch) applyService(resolveServiceSlug(hashMatch[1]));
      } catch {
        /* ignore malformed hrefs */
      }
    };

    applyFromUrl();
    window.addEventListener("hashchange", applyFromUrl);
    window.addEventListener("popstate", applyFromUrl);
    document.addEventListener("click", onDocumentClick);

    return () => {
      window.removeEventListener("hashchange", applyFromUrl);
      window.removeEventListener("popstate", applyFromUrl);
      document.removeEventListener("click", onDocumentClick);
      if (highlightTimerRef.current) window.clearTimeout(highlightTimerRef.current);
    };
  }, []);

  const markTouched = (field) => {
    setTouched((current) => ({ ...current, [field]: true }));
  };

  const gateOrSend = (send) => {
    setAttempted(true);
    setTouched({ name: true, phone: true });
    if (!isValid) {
      nameInputRef.current?.focus();
      return false;
    }
    send();
    return true;
  };

  const handleWhatsApp = (event) => {
    event.preventDefault();
    gateOrSend(() => {
      const text = buildMessage({ name, phone, service, message });
      /* Same-tab navigate — avoids popup blockers that kill window.open */
      window.location.assign(`${WHATSAPP_HREF}?text=${encodeURIComponent(text)}`);
    });
  };

  const handleText = (event) => {
    event.preventDefault();
    gateOrSend(() => {
      const body = buildMessage({ name, phone, service, message });
      window.location.assign(`sms:+${PHONE_E164}?body=${encodeURIComponent(body)}`);
    });
  };

  const statusMessage = (() => {
    if (isValid) return "Ready to send. Choose WhatsApp or Text.";
    if (attempted || (touched.name && !nameValid) || (touched.phone && !phoneValid)) {
      return "Add your name and phone, then choose WhatsApp or Text.";
    }
    return "Fill in your details below, then send by WhatsApp or Text.";
  })();

  return (
    <section id="contact" className="shell section contact-section">
      <div className="contact-section__layout">
        <aside className="contact-section__intro motion-block">
          <h2 className="section-heading">Request Your Visit</h2>
          <p className="lead contact-section__copy">
            Tell William what you need. Your message opens in WhatsApp or Text, ready to send. No
            account needed.
          </p>

          <dl className="contact-section__studio" aria-label="Studio details">
            <div>
              <dt>Studio</dt>
              <dd>5411 N. Mesa, Suite 13C · El Paso, TX 79912 · LV Hair Salon</dd>
            </div>
            <div>
              <dt>Hours</dt>
              <dd>
                Friday-Saturday 10 AM-6 PM · closed Sunday-Thursday · call or text to book
              </dd>
            </div>
            <div>
              <dt>Call</dt>
              <dd>
                <a
                  href={`tel:${PHONE_DISPLAY}`}
                  data-mcp-action="call-salon"
                  data-mcp-description="Call Hair by William at 915-920-7823 to book. Open Friday-Saturday 10 AM-6 PM. No login required."
                  data-mcp-params='{"phone":"+1-915-920-7823"}'
                >
                  {PHONE_DISPLAY}
                </a>
              </dd>
            </div>
          </dl>
        </aside>

        <div id="contact-form" className="contact-section__form-wrap motion-block">
          <form
            className="contact-form"
            onSubmit={handleWhatsApp}
            aria-labelledby="contact-form-title"
            aria-describedby={`${formHintId} ${statusId}`}
            noValidate
            data-mcp-action="request-appointment"
            data-mcp-description="Request a Hair by William appointment in El Paso. Provide name, phone, and preferred service, then send via WhatsApp or SMS. No account required."
            data-mcp-params='{"required":["name","phone","service"],"optional":["message"],"channels":["whatsapp","sms"]}'
          >
            <h3 id="contact-form-title" className="contact-form__title">
              Send your request
            </h3>
            <p id={formHintId} className="contact-form__hint">
              All hair textures and lengths welcome. Required fields marked with an asterisk.
            </p>

            <div className="contact-form__grid">
              <label className="contact-field">
                <span>
                  Your name <span aria-hidden="true">*</span>
                </span>
                <input
                  ref={nameInputRef}
                  type="text"
                  name="name"
                  autoComplete="name"
                  placeholder="Alex Rivera"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  onBlur={() => markTouched("name")}
                  aria-required="true"
                  aria-invalid={showNameError}
                  aria-describedby={nameHintId}
                  required
                  data-mcp-param="name"
                  data-mcp-description="Full name of the guest requesting the appointment"
                />
                {showNameError ? (
                  <span id={nameHintId} className="contact-field__error" role="alert">
                    Enter your full name so William can confirm.
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
                  aria-invalid={showPhoneError}
                  aria-describedby={phoneHintId}
                  required
                  data-mcp-param="phone"
                  data-mcp-description="Callback phone number to confirm the booking"
                />
                {showPhoneError ? (
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

            <label
              className={`contact-field${serviceHighlighted ? " contact-field--service-focus" : ""}`}
            >
              <span>What are you interested in?</span>
              <select
                ref={serviceSelectRef}
                name="service"
                value={service}
                onChange={(event) => {
                  setService(event.target.value);
                  setServiceHighlighted(false);
                }}
                data-mcp-param="service"
                data-mcp-description="Preferred service: Extensions, Brazilian Blowout, Precision Cuts, Color Correction, or consultation"
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
                placeholder="Preferred day, hair goals, reference photo, accessibility needs…"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                data-mcp-param="message"
                data-mcp-description="Optional notes: preferred day, hair goals, or accessibility needs"
              />
            </label>

            <div className="contact-form__actions" role="group" aria-label="Send request">
              <button
                type="submit"
                className="cta-button contact-form__whatsapp"
                aria-disabled={!isValid}
                data-mcp-action="book-via-whatsapp"
                data-mcp-description="Send the completed appointment request to Hair by William on WhatsApp. Opens WhatsApp with a prefilled message."
                data-mcp-params='{"channel":"whatsapp","requires":["name","phone"]}'
              >
                <MessageCircle size={18} strokeWidth={1.75} aria-hidden="true" />
                WhatsApp
              </button>
              <button
                type="button"
                className="secondary-button contact-form__text"
                aria-disabled={!isValid}
                onClick={handleText}
                data-mcp-action="book-via-sms"
                data-mcp-description="Send the completed appointment request to Hair by William by SMS text message."
                data-mcp-params='{"channel":"sms","requires":["name","phone"]}'
              >
                <Phone size={16} strokeWidth={1.75} aria-hidden="true" />
                Text
              </button>
            </div>

            <p
              id={statusId}
              className={`contact-form__note${isValid ? " contact-form__note--ready" : ""}${
                attempted && !isValid ? " contact-form__note--warn" : ""
              }`}
              role="status"
              aria-live="polite"
            >
              {statusMessage}
            </p>

            <p className="contact-form__note contact-form__note--secondary">
              Prefer to call?{" "}
              <a
                href={`tel:${PHONE_DISPLAY}`}
                data-mcp-action="call-salon"
                data-mcp-description="Call Hair by William at 915-920-7823. No login required."
                data-mcp-params='{"phone":"+1-915-920-7823"}'
              >
                {PHONE_DISPLAY}
              </a>
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
