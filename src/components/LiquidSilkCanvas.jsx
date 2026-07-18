import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import ObsidianFluidMesh from "./ObsidianFluidMesh";

const MAX_RIPPLES = 5;
const MOBILE_BREAKPOINT = 768;

function useShouldUseStaticFallback() {
  const [useStatic, setUseStatic] = useState(() => {
    if (typeof window === "undefined") return true;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const saveData = Boolean(navigator.connection?.saveData);
    const narrow = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`).matches;
    return reduceMotion || saveData || narrow;
  });

  useEffect(() => {
    const reduceMq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const narrowMq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

    const evaluate = () => {
      const saveData = Boolean(navigator.connection?.saveData);
      setUseStatic(reduceMq.matches || saveData || narrowMq.matches);
    };

    evaluate();
    reduceMq.addEventListener("change", evaluate);
    narrowMq.addEventListener("change", evaluate);
    navigator.connection?.addEventListener?.("change", evaluate);

    return () => {
      reduceMq.removeEventListener("change", evaluate);
      narrowMq.removeEventListener("change", evaluate);
      navigator.connection?.removeEventListener?.("change", evaluate);
    };
  }, []);

  return useStatic;
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

function FluidScene({ mouseRef, scrollRef, ripplesRef, hostRef, activeRef }) {
  return (
    <>
      <VisibilityFrameloop hostRef={hostRef} activeRef={activeRef} />
      <color attach="background" args={["#faf8f4"]} />
      <fog attach="fog" args={["#f8f5ef", 10, 22]} />
      <ambientLight intensity={0.62} color="#fffaf2" />
      <directionalLight position={[2.0, 1.4, 2.8]} intensity={0.38} color="#ffe8a0" />
      <pointLight position={[-1.4, 0.4, 2.0]} intensity={0.48} color="#f5b820" />
      <pointLight position={[1.6, -0.2, 1.8]} intensity={0.36} color="#ffd040" />
      <pointLight position={[0.2, 0.9, 1.6]} intensity={0.28} color="#ffcc22" />
      <pointLight position={[-0.8, -0.6, 2.2]} intensity={0.22} color="#e8a818" />
      <ObsidianFluidMesh mouseRef={mouseRef} scrollRef={scrollRef} ripplesRef={ripplesRef} />
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
  const useStatic = useShouldUseStaticFallback();
  const { mouseRef, scrollRef, ripplesRef } = useFluidInteraction(!useStatic);
  const [webglFailed, setWebglFailed] = useState(false);
  const [dpr, setDpr] = useState([1, 1.25]);

  useEffect(() => {
    if (useStatic) return undefined;

    const evaluateDpr = () => {
      const narrow = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`).matches;
      const coarse = window.matchMedia("(pointer: coarse)").matches;
      if (narrow || coarse) {
        setDpr([1, 1]);
      } else {
        setDpr([1, Math.min(window.devicePixelRatio || 1, 1.5)]);
      }
    };

    evaluateDpr();
    window.addEventListener("resize", evaluateDpr, { passive: true });
    return () => window.removeEventListener("resize", evaluateDpr);
  }, [useStatic]);

  if (useStatic || webglFailed) {
    return <StaticFallback />;
  }

  return (
    <div ref={hostRef} className="fluid-canvas" aria-hidden="true">
      <Canvas
        dpr={dpr}
        camera={{ position: [0, 0.08, 2.68], fov: 38, near: 0.1, far: 20 }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
          stencil: false,
        }}
        frameloop="demand"
        onCreated={({ gl }) => {
          const lose = () => setWebglFailed(true);
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
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
