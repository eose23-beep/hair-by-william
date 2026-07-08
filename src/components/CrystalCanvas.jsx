import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Float, MeshTransmissionMaterial } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";

function Crystal() {
  const meshRef = useRef(null);

  // Higher segment sphere for a smoother dark-glass silhouette.
  const geometry = useMemo(() => new THREE.SphereGeometry(1.08, 128, 128), []);
  const coreGeometry = useMemo(() => new THREE.OctahedronGeometry(0.48, 0), []);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.x += delta * 0.08;
    meshRef.current.rotation.y += delta * 0.16;
    meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.4) * 0.06;
    meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
  });

  return (
    <Float speed={0.65} floatIntensity={0.35} rotationIntensity={0.2}>
      <group ref={meshRef}>
        <mesh geometry={geometry}>
          <MeshTransmissionMaterial
            color="#070a12"
            transmission={1}
            thickness={0.95}
            roughness={0.02}
            chromaticAberration={0.03}
            anisotropy={0.28}
            distortion={0.028}
            distortionScale={0.18}
            temporalDistortion={0.08}
            ior={1.48}
            clearcoat={1}
            clearcoatRoughness={0.06}
          />
        </mesh>
        <mesh geometry={coreGeometry}>
          <meshStandardMaterial color="#e9b79f" emissive="#a86553" emissiveIntensity={0.3} metalness={0.5} roughness={0.25} />
        </mesh>
        <pointLight position={[0, 0.16, 0.4]} color="#fbe8cc" intensity={7} distance={2.4} />
      </group>
      <mesh rotation={[0.3, 0.5, 0]}>
        <torusGeometry args={[1.85, 0.03, 24, 160]} />
        <meshStandardMaterial color="#e7c4a0" emissive="#be8a69" emissiveIntensity={0.24} metalness={0.88} roughness={0.2} />
      </mesh>
    </Float>
  );
}

export default function CrystalCanvas() {
  return (
    <div className="canvas-wrap" aria-hidden="true">
      <Canvas camera={{ position: [0, 0, 4.8], fov: 38 }} dpr={[1, 1.5]}>
        <color attach="background" args={["#080a0f"]} />
        <fog attach="fog" args={["#080a0f", 5, 11]} />
        <ambientLight intensity={0.2} />
        <directionalLight position={[2, 3, 5]} intensity={0.9} color="#f9e7d4" />
        <directionalLight position={[-3, -1, -4]} intensity={0.44} color="#c8927f" />
        <pointLight position={[0, 1.5, 1.2]} intensity={0.6} color="#fbe3cc" />
        <Environment preset="city" />
        <Crystal />
      </Canvas>
    </div>
  );
}
