import { useState, useEffect } from "react";

export default function VipOfferBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show offer banner after 4 seconds if not previously dismissed
    const isDismissed = localStorage.getItem("hbw-vip-offer-dismissed");
    if (isDismissed) return;

    const timer = setTimeout(() => {
      setVisible(true);
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    setVisible(false);
    try {
      localStorage.setItem("hbw-vip-offer-dismissed", "true");
    } catch {}
  };

  if (!visible || dismissed) return null;

  return (
    <aside className="vip-offer-banner" aria-label="First Time Client Offer">
      <div className="vip-offer-banner__content">
        <div className="vip-offer-banner__badge">First-Time Client Special</div>
        <div className="vip-offer-banner__text">
          <strong>$50 Consultation Credit</strong> towards your first Hair Extension or Lived-In Color service with William in El Paso.
        </div>
        <div className="vip-offer-banner__actions">
          <a
            className="cta-button vip-offer-banner__btn"
            href="https://wa.me/19159207823?text=Hi%20William!%20I'd%20like%20to%20claim%20my%20%2450%20consultation%20credit%20for%20a%20first-time%20visit."
            target="_blank"
            rel="noopener noreferrer"
          >
            Claim $50 Credit
          </a>
          <button
            type="button"
            className="vip-offer-banner__close"
            onClick={handleDismiss}
            aria-label="Dismiss offer"
          >
            ✕
          </button>
        </div>
      </div>
    </aside>
  );
}
