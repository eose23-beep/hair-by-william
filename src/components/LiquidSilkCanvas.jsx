import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const VIDEO_SOURCES = [
  'https://assets.mixkit.co/videos/8377/8377-720.mp4',
  'https://assets.mixkit.co/videos/8477/8477-720.mp4',
];

const POSTER_SRC = 'https://assets.mixkit.co/videos/8377/8377-thumb-720-0.jpg';

export default function LiquidSilkCanvas() {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    let scrubTween = null;

    const bindScrub = () => {
      const duration = video.duration;
      if (!Number.isFinite(duration) || duration <= 0 || scrubTween) return;

      const proxy = { time: 0 };
      scrubTween = gsap.to(proxy, {
        time: duration,
        ease: 'none',
        scrollTrigger: {
          trigger: document.body,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1.4,
          invalidateOnRefresh: true,
        },
        onUpdate: () => {
          if (video.readyState < 2) return;
          const next = Math.min(Math.max(proxy.time, 0), duration - 0.05);
          if (Number.isFinite(next)) {
            video.currentTime = next;
          }
        },
      });

      ScrollTrigger.refresh();
    };

    video.pause();

    if (video.readyState >= 1) {
      bindScrub();
    } else {
      video.addEventListener('loadedmetadata', bindScrub, { once: true });
    }

    return () => {
      video.removeEventListener('loadedmetadata', bindScrub);
      scrubTween?.scrollTrigger?.kill();
      scrubTween?.kill();
      scrubTween = null;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[-3] overflow-hidden bg-[#0A0A0A] pointer-events-none" aria-hidden="true">
      <video
        ref={videoRef}
        muted
        playsInline
        loop
        preload="auto"
        poster={POSTER_SRC}
        className="absolute inset-0 h-full w-full object-cover opacity-80 contrast-125 saturate-0"
        style={{ objectPosition: 'center' }}
      >
        {VIDEO_SOURCES.map((src) => (
          <source key={src} src={src} type="video/mp4" />
        ))}
      </video>

      <div className="absolute inset-0 bg-[#0A0A0A]/85" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A] via-[#0A0A0A]/60 to-[#0A0A0A]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,transparent_0%,transparent_38%,rgba(10,10,10,0.85)_100%)]" />
    </div>
  );
}
