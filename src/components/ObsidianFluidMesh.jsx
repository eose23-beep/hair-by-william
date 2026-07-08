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
    vec3 moltenDeep = vec3(0.04, 0.026, 0.014);
    vec3 moltenBase = vec3(0.09, 0.058, 0.028);

    vec3 N = normalize(vNormal);
    vec3 V = normalize(cameraPosition - vWorldPos);

    vec2 mouseUv = uMouse * 0.5 + 0.5;
    float cursorDist = distance(vUv, mouseUv);
    float cursorProximity = smoothstep(0.9, 0.0, cursorDist);

    vec3 lightA = normalize(vec3(uMouse.x * 3.2, uMouse.y * 2.4 + 0.8, 3.2));
    vec3 lightB = normalize(vec3(-0.45, 0.42, 1.9));
    vec3 lightC = normalize(vec3(0.35, -0.25, 1.4));

    float specA = pow(max(dot(reflect(-lightA, N), V), 0.0), 42.0);
    float specB = pow(max(dot(reflect(-lightB, N), V), 0.0), 22.0);
    float specC = pow(max(dot(reflect(-lightC, N), V), 0.0), 18.0);
    float fresnel = pow(1.0 - max(dot(N, V), 0.0), 2.8);

    float ribbonPhase = vElevation * 24.0 + uTime * 0.95 + cursorDist * 7.2;
    vec3 champagne = vec3(
      0.92 + 0.08 * sin(ribbonPhase),
      0.76 + 0.12 * sin(ribbonPhase + 1.35),
      0.44 + 0.1 * sin(ribbonPhase + 2.6)
    );
    vec3 warmGold = vec3(0.84, 0.66, 0.36);
    vec3 burnishedBronze = vec3(0.58, 0.4, 0.22);

    vec3 color = mix(moltenDeep, moltenBase, 0.48 + vElevation * 2.1);
    color += specA * champagne * (1.05 + cursorProximity * 0.55);
    color += specB * warmGold * 0.48;
    color += specC * burnishedBronze * 0.22;
    color += fresnel * champagne * 0.34;

    float ribbonWave = sin((vUv.x + vElevation) * 18.0 + uTime * 0.7 + cursorDist * 8.0);
    color += ribbonWave * champagne * 0.04 * (0.4 + cursorProximity);

    float vignette = smoothstep(1.2, 0.35, length(vUv - 0.5));
    color *= mix(0.72, 1.0, vignette);

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
