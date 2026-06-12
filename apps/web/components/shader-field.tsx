"use client";

import { ScreenQuad } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

const vertexShader = /* glsl */ `
  void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const fragmentShader = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform vec2  uResolution;
  uniform vec2  uMouse;
  uniform vec3  uColor;

  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p){
    vec2 i = floor(p), f = fract(p);
    vec2 u = f*f*(3.0-2.0*f);
    return mix(mix(hash(i+vec2(0,0)), hash(i+vec2(1,0)), u.x),
               mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y);
  }
  float fbm(vec2 p){
    float v = 0.0, a = 0.5;
    for(int i=0;i<6;i++){ v += a*noise(p); p *= 2.0; a *= 0.5; }
    return v;
  }

  void main(){
    vec2 uv = gl_FragCoord.xy / uResolution.xy;
    vec2 p  = (gl_FragCoord.xy - 0.5*uResolution.xy) / uResolution.y;
    float t = uTime * 0.14;

    // 도메인 워핑 (flowing fluid noise)
    vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, 1.3) - t));
    vec2 r = vec2(fbm(p + 3.5*q + vec2(1.7, 9.2) + 0.15*t),
                  fbm(p + 3.5*q + vec2(8.3, 2.8) - 0.12*t));
    float v = fbm(p + 4.0*r);

    // 포인터 주변을 밝히는 포커스
    vec2 m = (uMouse - 0.5) * vec2(uResolution.x/uResolution.y, 1.0) * 2.0;
    v += 0.22 * exp(-length(p - m) * 2.4);

    vec3 base = vec3(0.024, 0.024, 0.032);
    vec3 col  = mix(base, uColor, smoothstep(0.25, 0.92, v));
    col = mix(col, vec3(1.0), smoothstep(0.78, 1.12, v) * 0.65); // hot highlight
    col *= 1.0 - 0.28 * length(uv - 0.5);                         // vignette

    gl_FragColor = vec4(col, 1.0);
  }
`;

function Field() {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const { gl } = useThree();
  const mouse = useRef(new THREE.Vector2(0.5, 0.5));

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uColor: { value: new THREE.Color("#d8ff2e") },
    }),
    [],
  );

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      mouse.current.set(
        e.clientX / window.innerWidth,
        1 - e.clientY / window.innerHeight,
      );
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useFrame((_, dt) => {
    if (!mat.current) return;
    const u = mat.current.uniforms;
    u.uTime.value += dt;
    gl.getDrawingBufferSize(u.uResolution.value);
    u.uMouse.value.lerp(mouse.current, 0.08);
  });

  return (
    <ScreenQuad>
      <shaderMaterial
        ref={mat}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    </ScreenQuad>
  );
}

export default function ShaderStage() {
  return (
    <Canvas
      gl={{ antialias: false }}
      dpr={[1, 2]}
      onCreated={({ gl }) =>
        gl.domElement.addEventListener(
          "webglcontextlost",
          (e) => e.preventDefault(),
          false,
        )
      }
    >
      <Field />
    </Canvas>
  );
}
