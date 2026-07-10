import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import ObsidianFluidMesh from "./ObsidianFluidMesh";

const MAX_RIPPLES = 5;

function useFluidInteraction() {
  const mouseRef = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const scrollRef = useRef(0);
  const ripplesRef = useRef([]);
  const rafRef = useRef(0);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return undefined;

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
  }, []);

  return { mouseRef, scrollRef, ripplesRef };
}

function FluidScene({ mouseRef, scrollRef, ripplesRef }) {
  return (
    <>
      <color attach="background" args={["#f7f3ec"]} />
      <fog attach="fog" args={["#f3eee6", 9, 20]} />
      <ambientLight intensity={0.55} color="#f7f3ec" />
      <directionalLight position={[2.2, 1.6, 3.0]} intensity={0.45} color="#efe8dc" />
      <pointLight position={[-1.6, 0.5, 2.0]} intensity={0.35} color="#b8954a" />
      <pointLight position={[1.5, -0.15, 2.4]} intensity={0.22} color="#9a7b3c" />
      <ObsidianFluidMesh mouseRef={mouseRef} scrollRef={scrollRef} ripplesRef={ripplesRef} />
    </>
  );
}

export default function LiquidSilkCanvas() {
  const { mouseRef, scrollRef, ripplesRef } = useFluidInteraction();
  const [webglFailed, setWebglFailed] = useState(false);
  const reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduceMotion || webglFailed) {
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
        camera={{ position: [0, 0.08, 2.68], fov: 38, near: 0.1, far: 20 }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
          stencil: false,
        }}
        frameloop="always"
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
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
