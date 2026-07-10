export const portfolioSpreads = [
  {
    id: "extensions",
    caption: "01 — Hair Extensions",
    frames: [
      {
        label: "Before",
        title: "Extensions",
        caption: "Starting point",
        src: "/portfolio/extensions_before.jpg",
        alt: "Hair before custom extensions install",
      },
      {
        label: "After",
        title: "Extensions",
        caption: "Seamless volume and length",
        src: "/portfolio/extensions_after.jpg",
        alt: "Hair after custom extensions with natural blend",
      },
    ],
  },
  {
    id: "blowout",
    caption: "02 — Brazilian Blowout",
    frames: [
      {
        label: "Before",
        title: "Brazilian Blowout",
        caption: "Natural texture",
        src: "/portfolio/blowout_before.jpg",
        alt: "Hair before Brazilian Blowout smoothing",
      },
      {
        label: "After",
        title: "Brazilian Blowout",
        caption: "Smooth, glossy finish",
        src: "/portfolio/blowout_after.jpg",
        alt: "Hair after Brazilian Blowout with healthy shine",
      },
    ],
  },
  {
    id: "color-cut",
    caption: "03 — Color & Cut",
    featured: true,
    frames: [
      {
        label: "Featured",
        title: "Color & Cut",
        caption: "Dimensional color with precision shaping",
        src: "/portfolio/color_cut.jpg",
        alt: "Dimensional hair color with a precision cut",
      },
    ],
  },
];

/** Flat list for lightbox navigation */
export const portfolioSlides = portfolioSpreads.flatMap((spread) =>
  spread.frames.map((frame) => ({
    id: `${spread.id}-${frame.label.toLowerCase()}`,
    title: frame.title,
    caption: `${frame.label} · ${frame.caption}`,
    src: frame.src,
    alt: frame.alt,
  })),
);
