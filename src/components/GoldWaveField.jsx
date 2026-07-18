/**
 * Ambient parchment drift — warm charcoal / parchment / gold-dust atmosphere.
 * Continuous soft radial field — no hard horizontal bands or gold ribbons.
 * Slow GPU-friendly motion (transform + opacity only). Photography stays hero.
 * Intensity: --atmosphere-bloom-opacity, --atmosphere-grain-opacity, --atmosphere-drift-duration
 */
export default function GoldWaveField() {
  return (
    <div className="gold-wave-field salon-atmosphere" aria-hidden="true">
      <div className="salon-atmosphere__base" />
      <div className="salon-atmosphere__veil" />
      <div className="salon-atmosphere__bloom salon-atmosphere__bloom--a" />
      <div className="salon-atmosphere__bloom salon-atmosphere__bloom--b" />
      <div className="salon-atmosphere__bloom salon-atmosphere__bloom--c" />
      <div className="salon-atmosphere__grain" />
    </div>
  );
}
