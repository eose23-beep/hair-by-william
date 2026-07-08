import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

function SilkSurface() {
  const meshRef = useRef(null);
  const basePositions = useMemo(() => [], []);
  const geometry = useMemo(() => {
    const plane = new THREE.PlaneGeometry(8.4, 8.4, 220, 220);
    const positions = plane.attributes.position;
    for (let idx = 0; idx < positions.count; idx += 1) {
      basePositions.push({
        x: positions.getX(idx),
        y: positions.getY(idx),
        z: positions.getZ(idx),
      });
    }

    return plane;
  }, [basePositions]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;
    const positions = meshRef.current.geometry.attributes.position;

    for (let idx = 0; idx < positions.count; idx += 1) {
      const base = basePositions[idx];
      const radial = Math.sqrt(base.x * base.x + base.y * base.y);
      const waveA = Math.sin(base.x * 1.15 + time * 0.4);
      const waveB = Math.cos(base.y * 1.45 - time * 0.34);
      const swirl = Math.sin(radial * 3.1 - time * 0.55);
      const drift = Math.cos((base.x + base.y) * 0.82 + time * 0.22);

      positions.setZ(idx, base.z + waveA * 0.2 + waveB * 0.16 + swirl * 0.12 + drift * 0.08);
    }

    positions.needsUpdate = true;
    meshRef.current.geometry.computeVertexNormals();
    meshRef.current.rotation.z = Math.sin(time * 0.1) * 0.08;
    meshRef.current.rotation.x = -0.92 + Math.cos(time * 0.12) * 0.04;
    meshRef.current.position.y = Math.sin(time * 0.18) * 0.14;
    meshRef.current.position.x = 0.7 + Math.sin(time * 0.08) * 0.12;
  });

  return (
    <group>
      <mesh ref={meshRef} geometry={geometry} position={[0.7, -0.2, -0.45]} rotation={[-0.92, 0.22, 0.08]}>
        <meshPhysicalMaterial
          color="#11161f"
          emissive="#2d1e1a"
          emissiveIntensity={0.18}
          roughness={0.5}
          metalness={0.08}
          clearcoat={1}
          clearcoatRoughness={0.24}
          sheen={1}
          sheenColor="#e2b8a0"
          sheenRoughness={0.62}
          reflectivity={0.46}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[-1.85, 1.35, -1.8]} rotation={[0.4, 0.1, -0.25]}>
        <planeGeometry args={[2.8, 2.8, 1, 1]} />
        <meshBasicMaterial color="#5c3428" transparent opacity={0.1} />
      </mesh>
    </group>
  );
}

export default function CrystalCanvas() {
  return (
    <div className="canvas-wrap" aria-hidden="true">
      <Canvas camera={{ position: [0, 0, 4.8], fov: 38 }} dpr={[1, 1.5]}>
        <color attach="background" args={["#070a10"]} />
        <fog attach="fog" args={["#070a10", 4.5, 10.5]} />
        <ambientLight intensity={0.62} color="#8f7667" />
        <hemisphereLight intensity={0.55} color="#f2d9ca" groundColor="#080b11" />
        <directionalLight position={[2.4, 2.6, 3.6]} intensity={1.15} color="#f6d7c1" />
        <directionalLight position={[-3.4, -1.8, 2.2]} intensity={0.72} color="#b9765f" />
        <pointLight position={[0.8, 0.8, 1.8]} intensity={1.6} distance={7} color="#f4cbb3" />
        <pointLight position={[-2.2, -1.6, 1.2]} intensity={0.8} distance={6} color="#7d4b3e" />
        <SilkSurface />
      </Canvas>
    </div>
  );
}
