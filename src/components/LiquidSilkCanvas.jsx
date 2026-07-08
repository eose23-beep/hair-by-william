import { Suspense, useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { ThreePerf } from "three-perf";
import ObsidianFluidMesh from "./ObsidianFluidMesh";

function useFluidPointer() {
  const mouseRef = useRef({ x: 0, y: 0, tx: 0, ty: 0, px: 0, py: 0 });
  const scrollRef = useRef(0);
  const velocityRef = useRef(0);
  const rafRef = useRef(0);
  const lastTimeRef = useRef(performance.now());

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return undefined;

    const onMove = (event) => {
      mouseRef.current.tx = (event.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.ty = -(event.clientY / window.innerHeight) * 2 + 1;
    };

    const onScroll = () => {
      scrollRef.current = window.scrollY;
    };

    const tick = (now) => {
      const m = mouseRef.current;
      const dt = Math.max((now - lastTimeRef.current) / 1000, 0.001);
      lastTimeRef.current = now;

      const dx = m.tx - m.px;
      const dy = m.ty - m.py;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const instantVelocity = distance / dt;
      m.px = m.tx;
      m.py = m.ty;

      const normalized = Math.min(instantVelocity / 9.5, 1.0);
      velocityRef.current += (normalized - velocityRef.current) * 0.2;
      velocityRef.current *= 0.94;

      const ease = 0.055;
      m.x += (m.tx - m.x) * ease;
      m.y += (m.ty - m.y) * ease;
      rafRef.current = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return { mouseRef, scrollRef, velocityRef };
}

function FluidScene({ mouseRef, scrollRef, velocityRef }) {
  return (
    <>
      <color attach="background" args={["#000000"]} />
      <fog attach="fog" args={["#000000", 10, 22]} />
      <ambientLight intensity={0} color="#000000" />
      <ObsidianFluidMesh mouseRef={mouseRef} scrollRef={scrollRef} velocityRef={velocityRef} />
      {import.meta.env.DEV ? <ThreePerf position="top-right" minimal={true} /> : null}
    </>
  );
}

export default function LiquidSilkCanvas() {
  const { mouseRef, scrollRef, velocityRef } = useFluidPointer();
  const reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduceMotion) {
    return (
      <div className="fluid-canvas fluid-canvas--static" aria-hidden="true">
        <div className="fluid-canvas__fallback" />
      </div>
    );
  }

  return (
    <div className="fluid-canvas" aria-hidden="true">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0.15, 2.65], fov: 42, near: 0.1, far: 20 }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
          stencil: false,
        }}
        frameloop="always"
      >
        <Suspense fallback={null}>
          <FluidScene mouseRef={mouseRef} scrollRef={scrollRef} velocityRef={velocityRef} />
        </Suspense>
      </Canvas>
    </div>
  );
}
