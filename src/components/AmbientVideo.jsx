import { useEffect, useRef, useState } from "react";

/**
 * Muted, playsInline loop that only plays when on-screen.
 * Respects prefers-reduced-motion (poster / static frame only).
 */
export default function AmbientVideo({
  src,
  poster,
  className = "",
  ariaLabel,
  preload = "metadata",
  active = true,
}) {
  const videoRef = useRef(null);
  const [inView, setInView] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const node = videoRef.current;
    if (!node) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting && entry.intersectionRatio > 0.2);
      },
      { threshold: [0, 0.2, 0.45] },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const node = videoRef.current;
    if (!node) return;

    const shouldPlay =
      active && inView && !reduceMotion && document.visibilityState === "visible";

    if (shouldPlay) {
      node.muted = true;
      const playAttempt = node.play();
      if (playAttempt?.catch) playAttempt.catch(() => {});
    } else {
      node.pause();
    }
  }, [active, inView, reduceMotion]);

  useEffect(() => {
    const onVisibility = () => {
      const node = videoRef.current;
      if (!node) return;
      if (document.visibilityState !== "visible") node.pause();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  if (reduceMotion) {
    return (
      <img
        className={className}
        src={poster || src}
        alt={ariaLabel || ""}
        loading="lazy"
        decoding="async"
        draggable={false}
      />
    );
  }

  return (
    <video
      ref={videoRef}
      className={className}
      src={src}
      poster={poster}
      muted
      playsInline
      loop
      preload={preload}
      aria-label={ariaLabel}
      disablePictureInPicture
      width={720}
      height={1280}
    />
  );
}
