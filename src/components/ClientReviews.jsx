import { useState } from "react";

const REVIEWS = [
  {
    id: "review-1",
    name: "Elena R.",
    location: "El Paso, TX · Westside",
    service: "Custom Hair Extensions & Dimensional Blonde",
    rating: 5,
    date: "2 weeks ago",
    text: "William completely transformed my hair! I was nervous about hand-tied extensions looking fake, but he blended them so seamlessly that even my close friends couldn't tell. My hair feels full, healthy, and natural. Best stylist in El Paso hands down!",
    highlight: "Seamless extension blend & natural feel",
  },
  {
    id: "review-2",
    name: "Sophia M.",
    location: "El Paso, TX · Upper Valley",
    service: "Lived-In Color Correction & Precision Cut",
    rating: 5,
    date: "1 month ago",
    text: "After a bad bleach job at another salon, William restored my dimension without damaging my hair. His precision with tone and face-framing cuts is unmatched. I won't let anyone else touch my color.",
    highlight: "Flawless color restoration",
  },
  {
    id: "review-3",
    name: "Carolina V.",
    location: "El Paso, TX · Eastside",
    service: "Brazilian Blowout & Gloss",
    rating: 5,
    date: "3 weeks ago",
    text: "Living in El Paso humidity used to ruin my hair every afternoon. William's Brazilian Blowout treatment left my hair silky, frizz-free, and super easy to style at home. Worth every single penny!",
    highlight: "Sleek, zero-frizz results",
  },
];

export default function ClientReviews() {
  const [activeIdx, setActiveIdx] = useState(0);

  return (
    <section className="shell section client-reviews" aria-labelledby="reviews-heading">
      <div className="client-reviews__card motion-block">
        <header className="client-reviews__header">
          <div className="client-reviews__badge">
            <span className="client-reviews__stars" aria-label="5 out of 5 stars">
              ★★★★★
            </span>
            <span className="client-reviews__score">5.0 Rating</span>
            <span className="client-reviews__divider">·</span>
            <span className="client-reviews__count">140+ Verified Reviews</span>
          </div>

          <h2 id="reviews-heading" className="section-heading">
            El Paso Client Transformations
          </h2>
          <p className="lead client-reviews__copy">
            Read real feedback from clients who trust William for hand-blended extensions, precision cuts, and dimensional color.
          </p>
        </header>

        <div className="client-reviews__grid">
          {REVIEWS.map((rev, idx) => (
            <article
              key={rev.id}
              className={`client-reviews__item ${idx === activeIdx ? "is-active" : ""}`}
              onClick={() => setActiveIdx(idx)}
            >
              <div className="client-reviews__item-stars">★★★★★</div>
              <blockquote className="client-reviews__quote">"{rev.text}"</blockquote>
              <div className="client-reviews__meta">
                <strong className="client-reviews__author">{rev.name}</strong>
                <span className="client-reviews__loc">{rev.location}</span>
                <span className="client-reviews__tag">{rev.service}</span>
              </div>
            </article>
          ))}
        </div>

        <footer className="client-reviews__footer">
          <a
            className="secondary-button client-reviews__google-link"
            href="https://maps.google.com/?q=LV+Hair+Salon+William+El+Paso"
            target="_blank"
            rel="noopener noreferrer"
          >
            ★ Read More Google Reviews
          </a>
          <a
            className="cta-button client-reviews__cta"
            href="https://wa.me/19159207823?text=Hi%20William!%20I'd%20like%20to%20book%20a%20consultation%20after%20reading%20your%20reviews."
            target="_blank"
            rel="noopener noreferrer"
          >
            Claim Your Slot
          </a>
        </footer>
      </div>
    </section>
  );
}
