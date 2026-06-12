"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const COUNT = 7000;

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform vec2 uMouse;
  attribute float aSeed;
  varying float vGlow;

  void main() {
    vec3 p = position;
    float s = aSeed * 6.2831853;
    // 잔잔한 드리프트
    p.x += sin(uTime * 0.5 + s) * 0.25;
    p.y += cos(uTime * 0.4 + s * 1.3) * 0.25;

    // 포인터 반발 (월드 XY)
    vec2 d = p.xy - uMouse;
    float dist = length(d);
    float force = smoothstep(1.7, 0.0, dist);
    p.xy += normalize(d + 0.0001) * force * 1.2;
    vGlow = force;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = (2.2 + force * 6.0) * (8.0 / -mv.z);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;
  uniform vec3 uColor;
  varying float vGlow;

  void main() {
    float a = smoothstep(0.5, 0.0, length(gl_PointCoord - 0.5));
    if (a <= 0.001) discard;
    vec3 col = mix(uColor * 0.55, vec3(1.0), vGlow);
    gl_FragColor = vec4(col, a * (0.45 + vGlow * 0.55));
  }
`;

function Field() {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const { viewport } = useThree();

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(COUNT * 3);
    const seed = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3] = (Math.random() * 2 - 1) * 6.4;
      pos[i * 3 + 1] = (Math.random() * 2 - 1) * 3.6;
      pos[i * 3 + 2] = (Math.random() * 2 - 1) * 0.6;
      seed[i] = Math.random();
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    return g;
  }, []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(999, 999) },
      uColor: { value: new THREE.Color("#48b0ff") },
    }),
    [],
  );

  useFrame((state, dt) => {
    if (!matRef.current) return;
    matRef.current.uniforms.uTime.value += dt;
    const target = new THREE.Vector2(
      (state.pointer.x * viewport.width) / 2,
      (state.pointer.y * viewport.height) / 2,
    );
    matRef.current.uniforms.uMouse.value.lerp(target, 0.15);
  });

  return (
    <points geometry={geometry}>
      <shaderMaterial
        ref={matRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export default function ParticleField() {
  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 50 }}
      dpr={[1, 2]}
      onCreated={({ gl }) =>
        gl.domElement.addEventListener(
          "webglcontextlost",
          (e) => e.preventDefault(),
          false,
        )
      }
    >
      <color attach="background" args={["#070709"]} />
      <Field />
    </Canvas>
  );
}
