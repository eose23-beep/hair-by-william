import { useEffect, useRef, useState } from "react";

/**
 * Muted, playsInline loop that only loads + plays when near/on-screen.
 * Respects prefers-reduced-motion (poster / static frame only).
 */
export default function AmbientVideo({
  src,
  poster,
  className = "",
  ariaLabel,
  preload = "none",
  active = true,
}) {
  const hostRef = useRef(null);
  const videoRef = useRef(null);
  const [nearView, setNearView] = useState(false);
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
    const node = hostRef.current;
    if (!node) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const ratio = entry.intersectionRatio;
        if (entry.isIntersecting) {
          setNearView(true);
          setInView(ratio > 0.2);
        } else {
          setInView(false);
        }
      },
      { rootMargin: "240px 0px", threshold: [0, 0.2, 0.45] },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const node = videoRef.current;
    if (!node || !nearView) return;

    const shouldPlay =
      active && inView && !reduceMotion && document.visibilityState === "visible";

    if (shouldPlay) {
      node.muted = true;
      const playAttempt = node.play();
      if (playAttempt?.catch) playAttempt.catch(() => {});
    } else {
      node.pause();
    }
  }, [active, inView, nearView, reduceMotion]);

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
        ref={hostRef}
        className={className}
        src={poster || src}
        alt={ariaLabel || ""}
        loading="lazy"
        decoding="async"
        width={720}
        height={1280}
        draggable={false}
      />
    );
  }

  /* Defer src until near viewport — prevents multi-MB clips from joining LCP */
  return (
    <video
      ref={(el) => {
        videoRef.current = el;
        hostRef.current = el;
      }}
      className={className}
      src={nearView ? src : undefined}
      poster={poster}
      muted
      playsInline
      loop
      preload={nearView ? preload : "none"}
      aria-label={ariaLabel}
      disablePictureInPicture
      width={720}
      height={1280}
    >
      <track
        kind="captions"
        src="/portfolio/ambient-captions.vtt"
        srcLang="en"
        label="English"
      />
    </video>
  );
}
