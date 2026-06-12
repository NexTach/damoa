"use client";

import { Scroll, ScrollControls, useScroll } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type * as THREE from "three";

const ACCENT = "#b06bff";

function Knot() {
  const ref = useRef<THREE.Mesh>(null);
  const scroll = useScroll();

  useFrame((state) => {
    const o = scroll.offset; // 0..1
    const m = ref.current;
    if (!m) return;
    m.rotation.y = o * Math.PI * 4 + state.clock.elapsedTime * 0.12;
    m.rotation.x = o * Math.PI * 2;
    m.scale.setScalar(0.8 + Math.sin(o * Math.PI) * 0.7);
    m.position.x = Math.sin(o * Math.PI * 2) * 1.6;
  });

  return (
    <mesh ref={ref}>
      <torusKnotGeometry args={[1, 0.3, 220, 32]} />
      <meshStandardMaterial
        color={ACCENT}
        emissive={ACCENT}
        emissiveIntensity={0.25}
        roughness={0.35}
        metalness={0.2}
        wireframe
      />
    </mesh>
  );
}

function Sections() {
  const items = [
    {
      n: "01",
      t: "Scroll is the timeline",
      s: "스크롤 진행도(0→1)가 카메라·오브젝트를 구동한다.",
    },
    {
      n: "02",
      t: "One offset, many channels",
      s: "회전·스케일·위치를 같은 offset 으로 동기화.",
    },
    { n: "03", t: "Drive anything", s: "drei ScrollControls + useScroll." },
  ];
  return (
    <Scroll html style={{ width: "100%" }}>
      {items.map((it) => (
        <section
          key={it.n}
          className="flex h-dvh w-screen flex-col justify-center px-6 md:px-16"
        >
          <div
            className="font-mono text-xs tracking-[0.3em]"
            style={{ color: ACCENT }}
          >
            {it.n}
          </div>
          <h2 className="font-display mt-2 max-w-xl text-4xl leading-[1.0] md:text-6xl">
            {it.t}
          </h2>
          <p className="mt-4 max-w-sm font-mono text-[13px] leading-relaxed text-[var(--muted)]">
            {it.s}
          </p>
        </section>
      ))}
    </Scroll>
  );
}

export default function ScrollStage() {
  return (
    <Canvas camera={{ position: [0, 0, 6], fov: 45 }} dpr={[1, 2]}>
      <color attach="background" args={["#08080a"]} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 4, 5]} intensity={1.3} />
      <directionalLight
        position={[-4, -2, 1]}
        intensity={0.4}
        color="#5b8cff"
      />
      <ScrollControls pages={3} damping={0.18}>
        <Knot />
        <Sections />
      </ScrollControls>
    </Canvas>
  );
}
