/**
 * Featured carousel slides — unique finished looks + short muted work clips.
 * Videos live in /public/portfolio (WhatsApp chair reveals, web-optimized).
 * work-01 ≡ color_cut.jpg (service card reuses path; not a carousel dup).
 * work-12 ≡ extensions_after (cutout); keep extensions_after only.
 * Process/near-dup rear views (work-03, work-06, work-08, work-11) omitted.
 *
 * Order: reverse narrative — extensions reveal first, classic blowout last.
 * Slide `id`s are stable for #clip-0N / hero deep-links.
 */

/** Short ambient loop for booking — not a full-bleed background. */
export const bookingAmbientClip = {
  id: "booking-ambient",
  src: "/portfolio/clip-03.mp4",
  poster: "/portfolio/clip-03-poster.jpg",
  alt: "Long glossy hair reveal with shine and length in motion",
  title: "Watch the work",
  caption: "Chair finish · shine and length",
};

/** Hero lookbook strip — muted loops beside the primary still (not a second full-bleed). */
export const heroWorkClips = [
  {
    id: "hero-clip-01",
    slideId: "clip-01",
    src: "/portfolio/clip-01.mp4",
    poster: "/portfolio/clip-01-poster.jpg",
    alt: "Highlighted waves with soft volume in motion",
  },
  {
    id: "hero-clip-02",
    slideId: "clip-02",
    src: "/portfolio/clip-02.mp4",
    poster: "/portfolio/clip-02-poster.jpg",
    alt: "Dark blowout waves bouncing as the client turns",
  },
  {
    id: "hero-clip-04",
    slideId: "clip-04",
    src: "/portfolio/clip-04.mp4",
    poster: "/portfolio/clip-04-poster.jpg",
    alt: "Honey balayage waves with soft bounce",
  },
];

export const portfolioSlides = [
  {
    id: "extensions-after",
    title: "Hair Extensions",
    caption: "The after · volume and length",
    src: "/portfolio/extensions_after.jpg",
    alt: "Hair after custom extensions with seamless blend, added length, and natural volume",
    type: "image",
  },
  {
    id: "extensions-before",
    title: "Hair Extensions",
    caption: "The before · your starting length",
    src: "/portfolio/extensions_before.jpg",
    alt: "Hair at starting length before custom extension installation",
    type: "image",
  },
  {
    id: "clip-04",
    title: "Honey Waves",
    caption: "Balayage glow · soft bounce in motion",
    src: "/portfolio/clip-04.mp4",
    poster: "/portfolio/clip-04-poster.jpg",
    alt: "Honey balayage waves with soft bounce as the client lifts her hair",
    type: "video",
  },
  {
    id: "work-07",
    title: "Extension Blend",
    caption: "Custom install · invisible join, real length",
    src: "/portfolio/work-07.jpg",
    alt: "Extension installation blended for added length and natural movement",
    type: "image",
  },
  {
    id: "clip-03",
    title: "Gloss Finish",
    caption: "High-shine blowout · sleek length",
    src: "/portfolio/clip-03.mp4",
    poster: "/portfolio/clip-03-poster.jpg",
    alt: "Long sleek dark hair with high shine revealed in a short salon clip",
    type: "video",
  },
  {
    id: "work-05",
    title: "Custom Color",
    caption: "Tone balance · lived-in dimensional depth",
    src: "/portfolio/work-05.jpg",
    alt: "Custom dimensional hair color with balanced tone and soft, lived-in depth",
    type: "image",
  },
  {
    id: "clip-02",
    title: "Blowout Motion",
    caption: "Dark waves · bounce and fall",
    src: "/portfolio/clip-02.mp4",
    poster: "/portfolio/clip-02-poster.jpg",
    alt: "Voluminous dark blowout waves moving as the client turns in the salon",
    type: "video",
  },
  {
    id: "work-02",
    title: "Soft Waves",
    caption: "Precision cut · blended highlight shape",
    src: "/portfolio/work-02.jpg",
    alt: "Long hair styled in soft waves with blended highlight dimension and light movement",
    type: "image",
  },
  {
    id: "clip-01",
    title: "Volume Reveal",
    caption: "Highlighted waves · color in motion",
    src: "/portfolio/clip-01.mp4",
    poster: "/portfolio/clip-01-poster.jpg",
    alt: "Client turning to show long highlighted waves with soft volume and shine",
    type: "video",
  },
  {
    id: "work-01",
    title: "Layered Blowout",
    caption: "Chair classic · volume finish",
    src: "/portfolio/work-01.jpg",
    alt: "Salon blowout with layered length, warm dimensional color, and soft volume through the ends",
    type: "image",
  },
];

/** @deprecated kept for any legacy imports */
export const portfolioSpreads = [];
