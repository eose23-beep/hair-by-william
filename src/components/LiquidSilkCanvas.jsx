import { Suspense, useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import ObsidianFluidMesh from "./ObsidianFluidMesh";

function useFluidPointer() {
  const mouseRef = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const scrollRef = useRef(0);
  const rafRef = useRef(0);

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

    const tick = () => {
      const m = mouseRef.current;
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

  return { mouseRef, scrollRef };
}

function FluidScene({ mouseRef, scrollRef }) {
  return (
    <>
      <color attach="background" args={["#050508"]} />
      <fog attach="fog" args={["#050508", 3.5, 9]} />
      <ambientLight intensity={0.08} />
      <directionalLight position={[2.4, 1.8, 3.2]} intensity={0.35} color="#8a92a8" />
      <ObsidianFluidMesh mouseRef={mouseRef} scrollRef={scrollRef} />
    </>
  );
}

export default function LiquidSilkCanvas() {
  const { mouseRef, scrollRef } = useFluidPointer();
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
          <FluidScene mouseRef={mouseRef} scrollRef={scrollRef} />
        </Suspense>
      </Canvas>
    </div>
  );
}
