"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// —— Shaders (single pass: waves + dither) ——

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  precision highp float;
  varying vec2 vUv;
  uniform vec2 resolution;
  uniform float time;
  uniform float waveSpeed;
  uniform float waveFrequency;
  uniform float waveAmplitude;
  uniform vec3 waveColor;
  uniform vec2 mousePos;
  uniform float mouseRadius;
  uniform int enableMouse;
  uniform float colorNum;
  uniform float pixelSize;
  uniform vec3 backgroundColor;
  uniform int enableDither;

  // Simplex-style noise (single octave)
  vec4 mod289(vec4 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
  vec2 fade(vec2 t) { return t*t*t*(t*(t*6.0-15.0)+10.0); }
  float cnoise(vec2 P) {
    vec4 Pi = floor(P.xyxy) + vec4(0.0,0.0,1.0,1.0);
    vec4 Pf = fract(P.xyxy) - vec4(0.0,0.0,1.0,1.0);
    Pi = mod289(Pi);
    vec4 ix = Pi.xzxz; vec4 iy = Pi.yyww; vec4 fx = Pf.xzxz; vec4 fy = Pf.yyww;
    vec4 i = permute(permute(ix) + iy);
    vec4 gx = fract(i * (1.0/41.0)) * 2.0 - 1.0;
    vec4 gy = abs(gx) - 0.5;
    vec4 tx = floor(gx + 0.5);
    gx = gx - tx;
    vec2 g00 = vec2(gx.x, gy.x); vec2 g10 = vec2(gx.y, gy.y);
    vec2 g01 = vec2(gx.z, gy.z); vec2 g11 = vec2(gx.w, gy.w);
    vec4 norm = taylorInvSqrt(vec4(dot(g00,g00), dot(g01,g01), dot(g10,g10), dot(g11,g11)));
    g00 *= norm.x; g01 *= norm.y; g10 *= norm.z; g11 *= norm.w;
    float n00 = dot(g00, vec2(fx.x, fy.x)); float n10 = dot(g10, vec2(fx.y, fy.y));
    float n01 = dot(g01, vec2(fx.z, fy.z)); float n11 = dot(g11, vec2(fx.w, fy.w));
    vec2 fade_xy = fade(Pf.xy);
    return 2.3 * mix(mix(n00, n10, fade_xy.x), mix(n01, n11, fade_xy.x), fade_xy.y);
  }

  const int OCTAVES = 4;
  float fbm(vec2 p) {
    float v = 0.0;
    float amp = 1.0;
    float f = waveFrequency;
    for (int i = 0; i < OCTAVES; i++) {
      v += amp * abs(cnoise(p));
      p *= f;
      amp *= waveAmplitude;
    }
    return v;
  }
  float pattern(vec2 p) {
    return fbm(p + fbm(p - time * waveSpeed));
  }

  // Bayer 8x8 dither
  float bayer(int x, int y) {
    const float m[64] = float[64](
      0.0/64.0, 48.0/64.0, 12.0/64.0, 60.0/64.0,  3.0/64.0, 51.0/64.0, 15.0/64.0, 63.0/64.0,
      32.0/64.0,16.0/64.0, 44.0/64.0, 28.0/64.0, 35.0/64.0,19.0/64.0, 47.0/64.0, 31.0/64.0,
      8.0/64.0, 56.0/64.0,  4.0/64.0, 52.0/64.0, 11.0/64.0,59.0/64.0,  7.0/64.0, 55.0/64.0,
      40.0/64.0,24.0/64.0, 36.0/64.0, 20.0/64.0, 43.0/64.0,27.0/64.0, 39.0/64.0, 23.0/64.0,
      2.0/64.0, 50.0/64.0, 14.0/64.0, 62.0/64.0,  1.0/64.0,49.0/64.0, 13.0/64.0, 61.0/64.0,
      34.0/64.0,18.0/64.0, 46.0/64.0, 30.0/64.0, 33.0/64.0,17.0/64.0, 45.0/64.0, 29.0/64.0,
      10.0/64.0,58.0/64.0,  6.0/64.0, 54.0/64.0,  9.0/64.0,57.0/64.0,  5.0/64.0, 53.0/64.0,
      42.0/64.0,26.0/64.0, 38.0/64.0, 22.0/64.0, 41.0/64.0,25.0/64.0, 37.0/64.0, 21.0/64.0
    );
    return m[(y & 7) * 8 + (x & 7)];
  }
  vec3 dither(vec2 fragCoord, vec3 color) {
    vec2 px = floor(fragCoord / pixelSize);
    float t = bayer(int(px.x), int(px.y)) - 0.25;
    float step = 1.0 / max(colorNum - 1.0, 1.0);
    color = clamp(color + t * step - 0.2, 0.0, 1.0);
    return floor(color * (colorNum - 1.0) + 0.5) / max(colorNum - 1.0, 1.0);
  }

  void main() {
    vec2 uv = vUv - 0.5;
    uv.x *= resolution.x / resolution.y;
    float f = pattern(uv);
    if (enableMouse == 1) {
      vec2 mouseNDC = (mousePos / resolution - 0.5) * vec2(1.0, -1.0);
      mouseNDC.x *= resolution.x / resolution.y;
      float dist = length(uv - mouseNDC);
      f -= 0.5 * (1.0 - smoothstep(0.0, mouseRadius, dist));
    }
    vec3 col = mix(backgroundColor, waveColor, f);
    if (enableDither == 1) col = dither(gl_FragCoord.xy, col);
    gl_FragColor = vec4(col, 1.0);
  }
`;

// —— Scene: one mesh, one material ——

interface WaveProps {
  waveSpeed: number;
  waveFrequency: number;
  waveAmplitude: number;
  waveColor: THREE.Vector3Tuple;
  backgroundColor: THREE.Vector3Tuple;
  dither: boolean;
  colorNum: number;
  pixelSize: number;
  disableAnimation: boolean;
  enableMouse: boolean;
  mouseRadius: number;
  onReady?: () => void;
}

const F5F5F5: THREE.Vector3Tuple = [245 / 255, 245 / 255, 245 / 255];

function Waves({
  waveSpeed,
  waveFrequency,
  waveAmplitude,
  waveColor,
  backgroundColor,
  dither,
  colorNum,
  pixelSize,
  disableAnimation,
  enableMouse,
  mouseRadius,
  onReady,
}: WaveProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const readyCalled = useRef(false);
  const { size, viewport, gl } = useThree();

  const uniforms = useMemo(
    () => ({
      resolution: { value: new THREE.Vector2(size.width, size.height) },
      time: { value: 0 },
      waveSpeed: { value: waveSpeed },
      waveFrequency: { value: waveFrequency },
      waveAmplitude: { value: waveAmplitude },
      waveColor: { value: new THREE.Vector3(...waveColor) },
      backgroundColor: { value: new THREE.Vector3(...backgroundColor) },
      enableDither: { value: 1 },
      mousePos: { value: new THREE.Vector2(0, 0) },
      mouseRadius: { value: mouseRadius },
      enableMouse: { value: enableMouse ? 1 : 0 },
      colorNum: { value: colorNum },
      pixelSize: { value: pixelSize },
    }),
    []
  );

  const mouseRef = useRef({ x: 0, y: 0 });

  useFrame((state) => {
    if (!readyCalled.current && onReady) {
      readyCalled.current = true;
      onReady();
    }
    const u = uniforms as Record<string, { value: unknown }>;
    if (!disableAnimation) (u.time.value as number) = state.clock.elapsedTime;
    (u.waveSpeed.value as number) = waveSpeed;
    (u.waveFrequency.value as number) = waveFrequency;
    (u.waveAmplitude.value as number) = waveAmplitude;
    (u.waveColor.value as THREE.Vector3).set(...waveColor);
    (u.backgroundColor.value as THREE.Vector3).set(...backgroundColor);
    (u.enableDither.value as number) = dither ? 1 : 0;
    (u.enableMouse.value as number) = enableMouse ? 1 : 0;
    (u.mouseRadius.value as number) = mouseRadius;
    (u.mousePos.value as THREE.Vector2).set(mouseRef.current.x, mouseRef.current.y);

    const dpr = gl.getPixelRatio();
    const w = Math.floor(size.width * dpr);
    const h = Math.floor(size.height * dpr);
    const res = u.resolution.value as THREE.Vector2;
    if (res.x !== w || res.y !== h) res.set(w, h);
  });

  const onPointerMove = (e: { clientX: number; clientY: number }) => {
    if (!enableMouse) return;
    const rect = gl.domElement.getBoundingClientRect();
    const dpr = gl.getPixelRatio();
    mouseRef.current.x = (e.clientX - rect.left) * dpr;
    mouseRef.current.y = (e.clientY - rect.top) * dpr;
  };

  return (
    <mesh
      ref={meshRef}
      scale={[viewport.width, viewport.height, 1]}
      onPointerMove={onPointerMove}
    >
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        depthWrite={false}
      />
    </mesh>
  );
}

// —— Public component ——

export interface DitherWavesProps {
  waveSpeed?: number;
  waveFrequency?: number;
  waveAmplitude?: number;
  waveColor?: [number, number, number];
  /** Background color (RGB 0–1). Default #f5f5f5. */
  backgroundColor?: [number, number, number];
  /** Apply Bayer dither for retro look. false = smooth waves only. */
  dither?: boolean;
  colorNum?: number;
  pixelSize?: number;
  disableAnimation?: boolean;
  enableMouseInteraction?: boolean;
  mouseRadius?: number;
  className?: string;
  /** Called after the first frame is rendered (e.g. to show content only once background has painted). */
  onReady?: () => void;
}

export default function DitherWaves({
  waveSpeed = 0.05,
  waveFrequency = 3,
  waveAmplitude = 0.3,
  waveColor = [0.24, 0.4, 0.9],
  backgroundColor = F5F5F5,
  dither = true,
  colorNum = 4,
  pixelSize = 2,
  disableAnimation = false,
  enableMouseInteraction = true,
  mouseRadius = 1,
  className = "",
  onReady,
}: DitherWavesProps) {
  return (
    <div className={className} style={{ width: "100%", height: "100%" }}>
      <Canvas
        camera={{ position: [0, 0, 6], fov: 50 }}
        dpr={[1, 2]}
        gl={{
          antialias: false,
          alpha: true,
          powerPreference: "high-performance",
        }}
      >
        <Waves
          waveSpeed={waveSpeed}
          waveFrequency={waveFrequency}
          waveAmplitude={waveAmplitude}
          waveColor={waveColor}
          backgroundColor={backgroundColor}
          dither={dither}
          colorNum={colorNum}
          pixelSize={pixelSize}
          disableAnimation={disableAnimation}
          enableMouse={enableMouseInteraction}
          mouseRadius={mouseRadius}
          onReady={onReady}
        />
      </Canvas>
    </div>
  );
}
