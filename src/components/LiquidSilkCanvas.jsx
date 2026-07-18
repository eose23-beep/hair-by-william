import { Component, Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import ObsidianFluidMesh from "./ObsidianFluidMesh";

/** Catches WebGL/R3F mount failures so the salon UI never white-screens. */
class SilkErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onFail?.();
  }

  render() {
    if (this.state.failed) return this.props.fallback ?? null;
    return this.props.children;
  }
}

const MAX_RIPPLES = 5;
const MOBILE_BREAKPOINT = 768;

/** low | medium | high — drives mesh segments, shader cost, and light count */
function resolvePerformanceTier() {
  if (typeof window === "undefined") return "medium";

  const narrow = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`).matches;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const cores = navigator.hardwareConcurrency ?? 4;
  const memory = navigator.deviceMemory ?? 4;

  if (cores <= 2 || memory <= 2) return "low";
  if (narrow || coarse || cores <= 4 || memory <= 4) return "medium";
  return "high";
}

const TIER_CONFIG = {
  low: { segments: 40, quality: 0.55, maxDpr: 1, lights: "minimal" },
  medium: { segments: 56, quality: 0.72, maxDpr: 1, lights: "standard" },
  high: { segments: 80, quality: 0.88, maxDpr: 1.25, lights: "full" },
};

function usePerformanceProfile() {
  const [profile, setProfile] = useState(() => {
    if (typeof window === "undefined") {
      return { useStatic: true, tier: "medium", ...TIER_CONFIG.medium };
    }
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const saveData = Boolean(navigator.connection?.saveData);
    const tier = resolvePerformanceTier();
    const useStatic = reduceMotion || saveData || tier === "low";
    return { useStatic, tier, ...TIER_CONFIG[tier] };
  });

  useEffect(() => {
    const reduceMq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const resizeMq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
    const coarseMq = window.matchMedia("(pointer: coarse)");

    const evaluate = () => {
      const saveData = Boolean(navigator.connection?.saveData);
      const tier = resolvePerformanceTier();
      const useStatic = reduceMq.matches || saveData || tier === "low";
      setProfile({ useStatic, tier, ...TIER_CONFIG[tier] });
    };

    evaluate();
    reduceMq.addEventListener("change", evaluate);
    resizeMq.addEventListener("change", evaluate);
    coarseMq.addEventListener("change", evaluate);
    navigator.connection?.addEventListener?.("change", evaluate);

    return () => {
      reduceMq.removeEventListener("change", evaluate);
      resizeMq.removeEventListener("change", evaluate);
      coarseMq.removeEventListener("change", evaluate);
      navigator.connection?.removeEventListener?.("change", evaluate);
    };
  }, []);

  return profile;
}

function useFluidInteraction(enabled) {
  const mouseRef = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const scrollRef = useRef(0);
  const ripplesRef = useRef([]);
  const rafRef = useRef(0);

  useEffect(() => {
    if (!enabled) return undefined;

    const pushRipple = (clientX, clientY) => {
      const x = (clientX / window.innerWidth) * 2 - 1;
      const y = -(clientY / window.innerHeight) * 2 + 1;
      const next = [...ripplesRef.current, { x, y, born: performance.now() / 1000 }];
      ripplesRef.current = next.slice(-MAX_RIPPLES);
    };

    const onMove = (event) => {
      mouseRef.current.tx = (event.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.ty = -(event.clientY / window.innerHeight) * 2 + 1;
    };

    const onPointerDown = (event) => {
      if (event.button !== 0) return;
      pushRipple(event.clientX, event.clientY);
    };

    const onScroll = () => {
      scrollRef.current = window.scrollY;
    };

    const tick = () => {
      const m = mouseRef.current;
      const ease = 0.018;
      m.x += (m.tx - m.x) * ease;
      m.y += (m.ty - m.y) * ease;
      rafRef.current = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafRef.current);
    };
  }, [enabled]);

  return { mouseRef, scrollRef, ripplesRef };
}

function VisibilityFrameloop({ hostRef, activeRef }) {
  const { invalidate } = useThree();

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const onScreen = entry.isIntersecting && entry.intersectionRatio > 0.02;
        const pageVisible = document.visibilityState === "visible";
        activeRef.current = onScreen && pageVisible;
        if (activeRef.current) invalidate();
      },
      { threshold: [0, 0.02, 0.1] },
    );
    observer.observe(host);

    const onVisibility = () => {
      if (document.visibilityState !== "visible") {
        activeRef.current = false;
        return;
      }
      if (activeRef.current) invalidate();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [hostRef, activeRef, invalidate]);

  useFrame(() => {
    if (activeRef.current) invalidate();
  });

  return null;
}

function FluidScene({
  mouseRef,
  scrollRef,
  ripplesRef,
  hostRef,
  activeRef,
  segments,
  quality,
  lightTier,
}) {
  const showAccentLights = lightTier === "full" || lightTier === "standard";

  return (
    <>
      <VisibilityFrameloop hostRef={hostRef} activeRef={activeRef} />
      <color attach="background" args={["#ffffff"]} />
      <fog attach="fog" args={["#fefefe", 9, 22]} />
      <hemisphereLight args={["#ffffff", "#f7f7f2", 0.4]} />
      <ambientLight intensity={0.48} color="#ffffff" />
      <directionalLight
        position={[2.4, 2.0, 3.2]}
        intensity={0.36}
        color="#ffffff"
        castShadow={false}
      />
      <directionalLight position={[-1.2, 0.6, 2.0]} intensity={0.11} color="#fffef8" />
      <pointLight position={[-1.4, 0.4, 2.0]} intensity={0.36} color="#FFE600" />
      <pointLight position={[1.6, -0.2, 1.8]} intensity={0.28} color="#FFEE00" />
      {showAccentLights ? (
        <>
          <pointLight position={[0.2, 0.9, 1.6]} intensity={0.2} color="#FFE600" />
          <pointLight position={[-0.8, -0.6, 2.2]} intensity={0.14} color="#FFEE00" />
        </>
      ) : null}
      <ObsidianFluidMesh
        mouseRef={mouseRef}
        scrollRef={scrollRef}
        ripplesRef={ripplesRef}
        segments={segments}
        quality={quality}
      />
    </>
  );
}

function StaticFallback() {
  return (
    <div className="fluid-canvas fluid-canvas--static" aria-hidden="true">
      <div className="fluid-canvas__fallback" />
    </div>
  );
}

export default function LiquidSilkCanvas() {
  const hostRef = useRef(null);
  const activeRef = useRef(true);
  const { useStatic, segments, quality, maxDpr, lights } = usePerformanceProfile();
  const { mouseRef, scrollRef, ripplesRef } = useFluidInteraction(!useStatic);
  const [webglFailed, setWebglFailed] = useState(false);
  const [dpr, setDpr] = useState([1, 1]);

  useEffect(() => {
    if (useStatic) return undefined;

    const evaluateDpr = () => {
      const cap = Math.min(window.devicePixelRatio || 1, maxDpr);
      setDpr([1, cap]);
    };

    evaluateDpr();
    window.addEventListener("resize", evaluateDpr, { passive: true });
    return () => window.removeEventListener("resize", evaluateDpr);
  }, [useStatic, maxDpr]);

  if (useStatic || webglFailed) {
    return <StaticFallback />;
  }

  return (
    <div ref={hostRef} className="fluid-canvas" aria-hidden="true">
      <SilkErrorBoundary
        fallback={<div className="fluid-canvas__fallback" />}
        onFail={() => setWebglFailed(true)}
      >
        <Canvas
          dpr={dpr}
          camera={{ position: [0, 0.02, 2.42], fov: 34, near: 0.1, far: 18 }}
          gl={{
            antialias: maxDpr > 1,
            alpha: false,
            powerPreference: "high-performance",
            stencil: false,
            depth: true,
            failIfMajorPerformanceCaveat: false,
          }}
          frameloop="demand"
          performance={{ min: 0.5 }}
          onCreated={({ gl }) => {
            const lose = (event) => {
              event.preventDefault();
              setWebglFailed(true);
            };
            gl.domElement.addEventListener("webglcontextlost", lose, { once: true });
          }}
          onError={() => setWebglFailed(true)}
        >
          <Suspense fallback={null}>
            <FluidScene
              mouseRef={mouseRef}
              scrollRef={scrollRef}
              ripplesRef={ripplesRef}
              hostRef={hostRef}
              activeRef={activeRef}
              segments={segments}
              quality={quality}
              lightTier={lights}
            />
          </Suspense>
        </Canvas>
      </SilkErrorBoundary>
    </div>
  );
}
