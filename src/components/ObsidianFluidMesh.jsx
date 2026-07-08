import { useRef, useMemo, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform vec2 uMouse;
  uniform float uScroll;
  uniform float uVelocity;

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

    float velBoost = clamp(uVelocity, 0.0, 1.0);
    float freqMult = 1.0 + velBoost * 5.5;
    float ampMult = 1.0 + velBoost * 3.2;

    float t = uTime * (0.22 + velBoost * 0.18);
    float flow = fbm(uv * (2.4 + velBoost * 1.6) + vec2(t * 0.35, t * 0.28));
    float ribbon = sin((uv.x + flow) * 9.0 * freqMult + t * 1.6) * 0.11 * ampMult;
    ribbon += sin((uv.y - flow * 0.6) * 7.0 * freqMult - t * 1.2) * 0.09 * ampMult;
    ribbon += sin(mouseDist * 14.0 * freqMult - t * 2.4) * mouseInfluence * 0.38 * ampMult;
    ribbon += sin(mouseDist * (24.0 + velBoost * 28.0) - t * (4.0 + velBoost * 3.5))
      * mouseInfluence * velBoost * 0.62;

    float scrollWave = sin(uv.y * 5.0 + uScroll * 0.004 + t) * 0.06;
    float elevation = ribbon + scrollWave + (flow - 0.5) * 0.14 * ampMult;
    pos.z += elevation;
    vElevation = elevation;

    float eps = 0.018;
    float hL = sin((uv.x - eps + flow) * 9.0 * freqMult + t * 1.6) * 0.11 * ampMult;
    float hR = sin((uv.x + eps + flow) * 9.0 * freqMult + t * 1.6) * 0.11 * ampMult;
    float hD = sin((uv.y - eps - flow * 0.6) * 7.0 * freqMult - t * 1.2) * 0.09 * ampMult;
    float hU = sin((uv.y + eps - flow * 0.6) * 7.0 * freqMult - t * 1.2) * 0.09 * ampMult;
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
  uniform float uVelocity;

  varying vec2 vUv;
  varying vec3 vWorldPos;
  varying float vElevation;
  varying vec3 vNormal;

  void main() {
    vec3 oledBlack = vec3(0.0, 0.0, 0.0);
    vec3 goldChrome = vec3(1.0, 0.76, 0.23);
    vec3 champagne = vec3(0.98, 0.84, 0.42);

    vec3 N = normalize(vNormal);
    vec3 V = normalize(cameraPosition - vWorldPos);

    vec2 mouseUv = uMouse * 0.5 + 0.5;
    float cursorDist = distance(vUv, mouseUv);
    float cursorProximity = smoothstep(0.9, 0.0, cursorDist);
    float velBoost = clamp(uVelocity, 0.0, 1.0);

    vec3 lightA = normalize(vec3(uMouse.x * 3.2, uMouse.y * 2.4 + 0.8, 3.2));
    vec3 lightB = normalize(vec3(-0.45, 0.42, 1.9));
    vec3 lightC = normalize(vec3(0.35, -0.25, 1.4));

    float specA = max(dot(reflect(-lightA, N), V), 0.0);
    float specB = max(dot(reflect(-lightB, N), V), 0.0);
    float specC = max(dot(reflect(-lightC, N), V), 0.0);

    float specBoostA = pow(specA, 4.0) * 3.5;
    float specBoostB = pow(specB, 4.0) * 3.5 * 0.55;
    float specBoostC = pow(specC, 4.0) * 3.5 * 0.32;

    float fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.2);
    float fresnelGold = pow(fresnel, 4.0) * 3.5 * 0.28;

    float peakMask = smoothstep(-0.035, 0.045, vElevation);
    float valleyClip = pow(max(vElevation, 0.0), 0.42);
    float illuminate = peakMask * valleyClip;

    vec3 color = oledBlack;
    color += specBoostA * goldChrome * illuminate * (1.0 + cursorProximity * 0.65 + velBoost * 0.45);
    color += specBoostB * champagne * illuminate * 0.72;
    color += specBoostC * goldChrome * illuminate * 0.38;
    color += fresnelGold * goldChrome * illuminate;

    float ribbonPhase = vElevation * 28.0 + uTime * 1.1 + cursorDist * 8.0;
    float ribbonWave = sin(ribbonPhase) * 0.5 + 0.5;
    color += ribbonWave * goldChrome * pow(specA, 4.0) * 3.5 * 0.12 * illuminate * (0.35 + velBoost * 0.5);

    color = mix(oledBlack, color, illuminate + specBoostA * 0.18);

    gl_FragColor = vec4(color, 1.0);
  }
`;

export default function ObsidianFluidMesh({ mouseRef, scrollRef, velocityRef }) {
  const meshRef = useRef(null);
  const materialRef = useRef(null);
  const { viewport } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uScroll: { value: 0 },
      uVelocity: { value: 0 },
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
    materialRef.current.uniforms.uVelocity.value = velocityRef?.current ?? 0;
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
