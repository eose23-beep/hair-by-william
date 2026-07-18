/**
 * Salon atmosphere — cream silk parchment with drifting hair-strand
 * ribbons and soft champagne light. Transform-only motion; content stays crisp.
 */
export default function GoldWaveField() {
  return (
    <div className="gold-wave-field salon-atmosphere" aria-hidden="true">
      <div className="salon-atmosphere__base" />
      <div className="salon-atmosphere__veil" />

      <svg
        className="salon-atmosphere__filaments"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Champagne silk — soft brush body */}
          <linearGradient id="silk-brush-a" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f8e7a0" stopOpacity="0" />
            <stop offset="22%" stopColor="#e8c547" stopOpacity="0.38" />
            <stop offset="48%" stopColor="#d4af37" stopOpacity="0.52" />
            <stop offset="72%" stopColor="#e8c547" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#f0d060" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="silk-brush-b" x1="100%" y1="10%" x2="0%" y2="90%">
            <stop offset="0%" stopColor="#f0d060" stopOpacity="0" />
            <stop offset="30%" stopColor="#e8c547" stopOpacity="0.34" />
            <stop offset="55%" stopColor="#c9a227" stopOpacity="0.46" />
            <stop offset="100%" stopColor="#f8e7a0" stopOpacity="0" />
          </linearGradient>

          {/* Fine hair / silk core highlight */}
          <linearGradient id="hair-strand-gold" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f8e7a0" stopOpacity="0" />
            <stop offset="18%" stopColor="#f0d060" stopOpacity="0.55" />
            <stop offset="42%" stopColor="#e8c547" stopOpacity="0.85" />
            <stop offset="68%" stopColor="#d4af37" stopOpacity="0.7" />
            <stop offset="88%" stopColor="#f0d060" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#f8e7a0" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="hair-strand-champagne" x1="0%" y1="40%" x2="100%" y2="60%">
            <stop offset="0%" stopColor="#fff8e7" stopOpacity="0" />
            <stop offset="25%" stopColor="#f0d060" stopOpacity="0.45" />
            <stop offset="50%" stopColor="#e8c547" stopOpacity="0.72" />
            <stop offset="75%" stopColor="#d4af37" stopOpacity="0.38" />
            <stop offset="100%" stopColor="#c9a227" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="hair-strand-soft" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#d4af37" stopOpacity="0" />
            <stop offset="35%" stopColor="#e8c547" stopOpacity="0.5" />
            <stop offset="60%" stopColor="#f0d060" stopOpacity="0.62" />
            <stop offset="100%" stopColor="#f8e7a0" stopOpacity="0" />
          </linearGradient>

          <filter id="hair-soft-glow" x="-15%" y="-25%" width="130%" height="150%">
            <feGaussianBlur stdDeviation="4.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="brush-soft" x="-10%" y="-20%" width="120%" height="140%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Soft silk brushstrokes — hair sweep silhouettes */}
        <g
          className="salon-atmosphere__ribbon salon-atmosphere__ribbon--brush-a"
          filter="url(#brush-soft)"
        >
          <path
            d="M-100 180 C180 90, 380 260, 640 190 S1100 80, 1580 160"
            fill="none"
            stroke="url(#silk-brush-a)"
            strokeWidth="64"
            strokeLinecap="round"
            opacity="0.55"
          />
          <path
            d="M-90 248 C200 170, 420 320, 700 250 S1160 150, 1560 230"
            fill="none"
            stroke="url(#silk-brush-a)"
            strokeWidth="40"
            strokeLinecap="round"
            opacity="0.4"
          />
        </g>

        <g
          className="salon-atmosphere__ribbon salon-atmosphere__ribbon--brush-b"
          filter="url(#brush-soft)"
        >
          <path
            d="M-80 480 C240 390, 460 580, 740 500 S1200 380, 1520 470"
            fill="none"
            stroke="url(#silk-brush-b)"
            strokeWidth="72"
            strokeLinecap="round"
            opacity="0.48"
          />
          <path
            d="M-70 560 C260 490, 500 650, 800 570 S1240 470, 1540 540"
            fill="none"
            stroke="url(#silk-brush-b)"
            strokeWidth="38"
            strokeLinecap="round"
            opacity="0.36"
          />
        </g>

        {/* Lock A — upper cascading strands */}
        <g
          className="salon-atmosphere__ribbon salon-atmosphere__ribbon--lock-a"
          filter="url(#hair-soft-glow)"
        >
          <path
            d="M-60 160 C200 100, 400 240, 680 175 S1120 95, 1500 155"
            fill="none"
            stroke="url(#hair-strand-gold)"
            strokeWidth="2.4"
            strokeLinecap="round"
            opacity="0.92"
          />
          <path
            d="M-50 188 C220 125, 430 265, 710 200 S1160 115, 1510 185"
            fill="none"
            stroke="url(#hair-strand-champagne)"
            strokeWidth="1.6"
            strokeLinecap="round"
            opacity="0.78"
          />
          <path
            d="M-40 214 C240 155, 450 290, 740 225 S1180 140, 1520 210"
            fill="none"
            stroke="url(#hair-strand-gold)"
            strokeWidth="1.35"
            strokeLinecap="round"
            opacity="0.7"
          />
          <path
            d="M-55 236 C210 180, 440 310, 720 248 S1170 165, 1515 230"
            fill="none"
            stroke="url(#hair-strand-soft)"
            strokeWidth="1.1"
            strokeLinecap="round"
            opacity="0.58"
          />
        </g>

        {/* Lock B — mid flowing cascade */}
        <g
          className="salon-atmosphere__ribbon salon-atmosphere__ribbon--lock-b"
          filter="url(#hair-soft-glow)"
        >
          <path
            d="M-70 470 C250 395, 470 575, 760 505 S1220 395, 1540 485"
            fill="none"
            stroke="url(#hair-strand-champagne)"
            strokeWidth="2.6"
            strokeLinecap="round"
            opacity="0.88"
          />
          <path
            d="M-55 498 C270 430, 490 600, 790 530 S1240 420, 1530 510"
            fill="none"
            stroke="url(#hair-strand-gold)"
            strokeWidth="1.7"
            strokeLinecap="round"
            opacity="0.76"
          />
          <path
            d="M-45 524 C290 460, 510 620, 810 555 S1260 445, 1545 535"
            fill="none"
            stroke="url(#hair-strand-soft)"
            strokeWidth="1.3"
            strokeLinecap="round"
            opacity="0.65"
          />
          <path
            d="M-65 548 C255 485, 500 640, 780 575 S1230 475, 1525 555"
            fill="none"
            stroke="url(#hair-strand-gold)"
            strokeWidth="1.05"
            strokeLinecap="round"
            opacity="0.55"
          />
          <path
            d="M-40 568 C280 510, 520 655, 820 590 S1270 495, 1550 570"
            fill="none"
            stroke="url(#hair-strand-champagne)"
            strokeWidth="0.95"
            strokeLinecap="round"
            opacity="0.48"
          />
        </g>

        {/* Lock C — lower whisper strands */}
        <g
          className="salon-atmosphere__ribbon salon-atmosphere__ribbon--lock-c"
          filter="url(#hair-soft-glow)"
        >
          <path
            d="M-50 720 C280 655, 540 800, 860 730 S1260 640, 1540 710"
            fill="none"
            stroke="url(#hair-strand-soft)"
            strokeWidth="2.1"
            strokeLinecap="round"
            opacity="0.72"
          />
          <path
            d="M-35 748 C300 690, 560 825, 890 755 S1280 665, 1550 735"
            fill="none"
            stroke="url(#hair-strand-gold)"
            strokeWidth="1.4"
            strokeLinecap="round"
            opacity="0.62"
          />
          <path
            d="M-45 772 C290 720, 550 845, 870 780 S1270 690, 1535 760"
            fill="none"
            stroke="url(#hair-strand-champagne)"
            strokeWidth="1.05"
            strokeLinecap="round"
            opacity="0.5"
          />
        </g>
      </svg>

      {/* Soft salon light — specular champagne blooms */}
      <div className="salon-atmosphere__bloom salon-atmosphere__bloom--a" />
      <div className="salon-atmosphere__bloom salon-atmosphere__bloom--b" />
      <div className="salon-atmosphere__bloom salon-atmosphere__bloom--c" />
      <div className="salon-atmosphere__shimmer" />
      <div className="salon-atmosphere__grain" />
    </div>
  );
}
