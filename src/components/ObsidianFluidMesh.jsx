import { useRef, useMemo, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform vec2 uMouse;
  uniform float uScroll;
  uniform float uQuality;
  uniform vec3 uRipples[5];

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
    for (int i = 0; i < 3; i++) {
      value += amplitude * noise(p);
      p *= 2.1;
      amplitude *= 0.48;
    }
    if (uQuality > 0.85) {
      value += 0.24 * noise(p);
    }
    return value;
  }

  float rippleWave(vec2 uv, vec3 ripple) {
    float age = uTime - ripple.z;
    if (age < 0.0 || age > 3.5) return 0.0;

    vec2 origin = ripple.xy * 0.5 + 0.5;
    float dist = distance(uv, origin);
    float wave = sin(dist * 28.0 - age * 9.0);
    float ring = smoothstep(0.18, 0.0, abs(dist - age * 0.22));
    float bounce = exp(-age * 1.35) * (1.0 + 0.35 * sin(age * 11.0));
    return wave * ring * bounce * 0.22;
  }

  void main() {
    vUv = uv;
    vec3 pos = position;

    float edgeMask = smoothstep(0.0, 0.12, uv.x)
      * smoothstep(0.0, 0.12, 1.0 - uv.x)
      * smoothstep(0.0, 0.12, uv.y)
      * smoothstep(0.0, 0.12, 1.0 - uv.y);

    vec2 mouseUv = uMouse * 0.5 + 0.5;
    float mouseDist = distance(uv, mouseUv);
    float mouseInfluence = smoothstep(0.95, 0.08, mouseDist) * 0.35;

    float t = uTime * 0.16;
    float flow = fbm(uv * 1.8 + vec2(t * 0.22, t * 0.18));
    float ribbon = sin((uv.x + flow) * 6.5 + t * 1.1) * 0.095;
    ribbon += sin((uv.y - flow * 0.6) * 5.0 - t * 0.85) * 0.078;
    ribbon += sin((uv.x * 1.4 - uv.y * 0.9 + flow) * 7.2 + t * 0.95) * 0.055;
    ribbon += sin(mouseDist * 9.0 - t * 1.4) * mouseInfluence * 0.16;

    float scrollWave = sin(uv.y * 3.5 + uScroll * 0.002 + t) * 0.042;
    float elevation = (ribbon + scrollWave + (flow - 0.5) * 0.12) * edgeMask;

    float rippleSum = 0.0;
    for (int i = 0; i < 5; i++) {
      rippleSum += rippleWave(uv, uRipples[i]);
    }
    elevation += rippleSum;

    pos.z += elevation;
    vElevation = elevation;

    float eps = 0.02;
    float hL = sin((uv.x - eps + flow) * 8.5 + t * 1.5) * 0.13 * edgeMask;
    float hR = sin((uv.x + eps + flow) * 8.5 + t * 1.5) * 0.13 * edgeMask;
    float hD = sin((uv.y - eps - flow * 0.6) * 6.5 - t * 1.1) * 0.10 * edgeMask;
    float hU = sin((uv.y + eps - flow * 0.6) * 6.5 - t * 1.1) * 0.10 * edgeMask;
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
  uniform float uQuality;
  uniform vec3 uRipples[5];

  varying vec2 vUv;
  varying vec3 vWorldPos;
  varying float vElevation;
  varying vec3 vNormal;

  void main() {
    /* Path A — quiet luminous white silk; electric-yellow wisps only (portfolio stays hero) */
    vec3 silkDeep = vec3(0.982, 0.980, 0.976);
    vec3 silk = vec3(0.994, 0.992, 0.988);
    vec3 silkLite = vec3(1.0, 0.999, 0.997);
    /* #FFE600 / #FFEE00 — neon electric yellow, not champagne/gold */
    vec3 voltCore = vec3(1.0, 0.902, 0.0);
    vec3 voltSheen = vec3(1.0, 0.933, 0.0);
    vec3 voltHot = vec3(1.0, 0.96, 0.12);

    vec3 N = normalize(vNormal);
    vec3 V = normalize(cameraPosition - vWorldPos);

    vec2 mouseUv = uMouse * 0.5 + 0.5;
    float cursorDist = distance(vUv, mouseUv);
    float cursorGlow = smoothstep(0.72, 0.0, cursorDist) * 0.08;

    vec3 lightA = normalize(vec3(0.25, 0.75, 2.6));
    vec3 lightB = normalize(vec3(-0.4, 0.35, 1.5));
    vec3 lightVolt = normalize(vec3(0.6, 0.2, 1.8));

    float specA = pow(max(dot(reflect(-lightA, N), V), 0.0), 52.0);
    float specB = pow(max(dot(reflect(-lightB, N), V), 0.0), 24.0);
    float specVolt = pow(max(dot(reflect(-lightVolt, N), V), 0.0), 38.0);
    float fresnel = pow(1.0 - max(dot(N, V), 0.0), 2.8);

    vec3 color = mix(silkDeep, silk, 0.48 + vElevation * 0.92);
    color = mix(color, silkLite, fresnel * 0.18);
    color += specA * silkLite * 0.08;
    color += specB * voltHot * 0.05;
    color += specVolt * voltSheen * 0.16;
    color += cursorGlow * voltCore * 0.18;

    /* Soft silk ribbons — vivid electric-yellow filaments, never washing the field */
    float flow = uTime * 0.22;
    float ribbonA = sin((vUv.x * 1.1 + vUv.y * 1.8 + vElevation * 2.5) * 4.8 + flow);
    float ribbonB = sin((vUv.x * 1.6 - vUv.y * 1.2 + vElevation * 1.8) * 6.2 - flow * 0.85);
    float ribbonC = sin((vUv.x * 0.55 + vUv.y * 2.2) * 3.6 + flow * 0.45 + vElevation * 3.5);

    float filamentA = pow(smoothstep(0.58, 1.0, 0.5 + 0.5 * ribbonA), 3.2);
    float filamentB = pow(smoothstep(0.62, 1.0, 0.5 + 0.5 * ribbonB), 3.8);
    float filamentC = pow(smoothstep(0.60, 1.0, 0.5 + 0.5 * ribbonC), 3.4);

    float streak = filamentA * 0.42 + filamentB * 0.58 + filamentC * 0.32;
    streak *= 0.32 + 0.48 * smoothstep(-0.06, 0.12, vElevation);

    color += voltSheen * streak * 0.52;
    color = mix(color, voltHot, filamentA * 0.12 + filamentC * 0.09);
    color += voltCore * filamentB * specVolt * 0.22;

    float rippleFlash = 0.0;
    for (int i = 0; i < 5; i++) {
      float age = uTime - uRipples[i].z;
      if (age > 0.0 && age < 1.8) {
        vec2 origin = uRipples[i].xy * 0.5 + 0.5;
        float dist = distance(vUv, origin);
        rippleFlash += exp(-age * 2.8) * smoothstep(0.16, 0.0, abs(dist - age * 0.14)) * 0.08;
      }
    }
    color += voltCore * rippleFlash * 0.42;

    float vignette = smoothstep(1.45, 0.42, length(vUv - 0.5));
    color = mix(color * 0.988, color, vignette);
    color = clamp(color, 0.0, 1.0);
    gl_FragColor = vec4(color, 1.0);
  }
`;

function buildRippleUniforms() {
  return Array.from({ length: 5 }, () => new THREE.Vector3(0, 0, -999));
}

export default function ObsidianFluidMesh({
  mouseRef,
  scrollRef,
  ripplesRef,
  segments = 96,
  quality = 1,
}) {
  const meshRef = useRef(null);
  const materialRef = useRef(null);
  const { viewport } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uScroll: { value: 0 },
      uQuality: { value: quality },
      uRipples: { value: buildRippleUniforms() },
    }),
    [],
  );

  useEffect(() => {
    if (!meshRef.current) return;
    const aspect = viewport.width / viewport.height;
    meshRef.current.scale.set(aspect * 3.05, 3.05, 1);
  }, [viewport.width, viewport.height]);

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uQuality.value = quality;
    }
  }, [quality]);

  useEffect(() => {
    return () => {
      meshRef.current?.geometry?.dispose();
      materialRef.current?.dispose();
    };
  }, []);

  useFrame((state) => {
    if (!materialRef.current) return;

    const eased = mouseRef.current;
    const now = state.clock.elapsedTime;

    materialRef.current.uniforms.uTime.value = now;
    materialRef.current.uniforms.uMouse.value.set(eased.x, eased.y);
    materialRef.current.uniforms.uScroll.value = scrollRef.current;

    const rippleUniforms = materialRef.current.uniforms.uRipples.value;
    const ripples = ripplesRef?.current ?? [];
    for (let i = 0; i < 5; i += 1) {
      const ripple = ripples[i];
      if (ripple) {
        rippleUniforms[i].set(ripple.x, ripple.y, ripple.born);
      } else {
        rippleUniforms[i].set(0, 0, -999);
      }
    }
  });

  return (
    <mesh ref={meshRef} rotation={[-0.26, 0.05, 0]} key={`silk-${segments}`}>
      <planeGeometry args={[1, 1, segments, segments]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        side={THREE.FrontSide}
      />
    </mesh>
  );
}
