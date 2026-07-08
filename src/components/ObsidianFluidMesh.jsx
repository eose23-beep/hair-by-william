import { useRef, useMemo, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform vec2 uMouse;
  uniform float uScroll;

  varying vec2 vUv;
  varying vec3 vWorldPos;
  varying float vElevation;
  varying vec3 vNormal;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 4; i++) {
      value += amplitude * noise(p);
      p *= 2.1;
      amplitude *= 0.48;
    }
    return value;
  }

  void main() {
    vUv = uv;
    vec3 pos = position;

    vec2 mouseUv = uMouse * 0.5 + 0.5;
    float mouseDist = distance(uv, mouseUv);
    float mouseInfluence = smoothstep(0.72, 0.0, mouseDist);

    float t = uTime * 0.22;
    float flow = fbm(uv * 2.4 + vec2(t * 0.35, t * 0.28));
    float ribbon = sin((uv.x + flow) * 9.0 + t * 1.6) * 0.11;
    ribbon += sin((uv.y - flow * 0.6) * 7.0 - t * 1.2) * 0.09;
    ribbon += sin(mouseDist * 14.0 - t * 2.4) * mouseInfluence * 0.38;

    float scrollWave = sin(uv.y * 5.0 + uScroll * 0.004 + t) * 0.06;
  float elevation = ribbon + scrollWave + (flow - 0.5) * 0.14;
    pos.z += elevation;
    vElevation = elevation;

    float eps = 0.018;
    float hL = sin((uv.x - eps + flow) * 9.0 + t * 1.6) * 0.11;
    float hR = sin((uv.x + eps + flow) * 9.0 + t * 1.6) * 0.11;
    float hD = sin((uv.y - eps - flow * 0.6) * 7.0 - t * 1.2) * 0.09;
    float hU = sin((uv.y + eps - flow * 0.6) * 7.0 - t * 1.2) * 0.09;
    vec3 tangent = normalize(vec3(2.0 * eps, 0.0, hR - hL));
    vec3 bitangent = normalize(vec3(0.0, 2.0 * eps, hU - hD));
    vNormal = normalize(cross(tangent, bitangent));

    vec4 worldPos = modelMatrix * vec4(pos, 1.0);
    vWorldPos = worldPos.xyz;

    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec2 uMouse;

  varying vec2 vUv;
  varying vec3 vWorldPos;
  varying float vElevation;
  varying vec3 vNormal;

  void main() {
    vec3 obsidian = vec3(0.028, 0.03, 0.038);
    vec3 deep = vec3(0.012, 0.014, 0.02);

    vec3 N = normalize(vNormal);
    vec3 V = normalize(cameraPosition - vWorldPos);

    vec2 mouseUv = uMouse * 0.5 + 0.5;
    vec3 lightA = normalize(vec3(uMouse.x * 1.8, uMouse.y * 1.4 + 0.6, 2.4));
    vec3 lightB = normalize(vec3(-0.6, 0.35, 1.6));

    float specA = pow(max(dot(reflect(-lightA, N), V), 0.0), 48.0);
    float specB = pow(max(dot(reflect(-lightB, N), V), 0.0), 24.0);
    float fresnel = pow(1.0 - max(dot(N, V), 0.0), 4.0);

    float chromePhase = vElevation * 18.0 + uTime * 0.6 + distance(vUv, mouseUv) * 4.0;
    vec3 chrome = vec3(
      0.62 + 0.18 * sin(chromePhase),
      0.66 + 0.16 * sin(chromePhase + 1.9),
      0.74 + 0.14 * sin(chromePhase + 3.7)
    );

    vec3 color = mix(deep, obsidian, 0.5 + vElevation * 1.6);
    color += specA * chrome * 0.72;
    color += specB * vec3(0.42, 0.44, 0.5) * 0.22;
    color += fresnel * chrome * 0.11;

  float grid = abs(sin(vUv.x * 42.0 + uTime * 0.15)) * abs(sin(vUv.y * 38.0 - uTime * 0.12));
  color += grid * 0.018 * (0.35 + specA);

    float vignette = smoothstep(1.35, 0.25, length(vUv - 0.5));
    color *= mix(0.55, 1.0, vignette);

    gl_FragColor = vec4(color, 1.0);
  }
`;

export default function ObsidianFluidMesh({ mouseRef, scrollRef }) {
  const meshRef = useRef(null);
  const materialRef = useRef(null);
  const { viewport } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uScroll: { value: 0 },
    }),
    [],
  );

  useEffect(() => {
    if (!meshRef.current) return;
    const aspect = viewport.width / viewport.height;
    meshRef.current.scale.set(aspect * 2.4, 2.4, 1);
  }, [viewport.width, viewport.height]);

  useFrame((state) => {
    if (!materialRef.current) return;

    const eased = mouseRef.current;
    materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    materialRef.current.uniforms.uMouse.value.set(eased.x, eased.y);
    materialRef.current.uniforms.uScroll.value = scrollRef.current;
  });

  return (
    <mesh ref={meshRef} rotation={[-0.42, 0.12, 0]}>
      <planeGeometry args={[1, 1, 192, 192]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
