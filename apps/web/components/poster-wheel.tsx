"use client";

import { Billboard, RoundedBox, Text } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import type * as THREE from "three";
import { LABS, type Lab } from "@/lib/labs";

// 토성 고리 느낌: 큰 반지름 + 강한 기울기 + 대각선 회전
const R = 3.3; // 고리 반지름
const TILT = 1.02; // 기울기(rad) — 거의 옆에서 보듯 납작한 타원
const DIAG = 0.5; // 대각선 회전(rad)
const COSD = Math.cos(DIAG);
const SIND = Math.sin(DIAG);
const MAX_VEL = 0.22;

function PosterCard({
  lab,
  index,
  count,
  offsetRef,
}: {
  lab: Lab;
  index: number;
  count: number;
  offsetRef: { current: number };
}) {
  const group = useRef<THREE.Group>(null);
  const mat = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const slot = (Math.PI * 2) / count;
    const ang = index * slot + offsetRef.current;
    // 수평 고리(XZ 평면)를 X로 기울이고, 다시 화면에서 대각선으로 회전
    const cx = Math.sin(ang) * R;
    const cy = Math.cos(ang) * R * Math.cos(TILT);
    const cz = Math.cos(ang) * R * Math.sin(TILT);
    g.position.set(cx * COSD - cy * SIND, cx * SIND + cy * COSD, cz);
    const f = (Math.cos(ang) + 1) / 2; // 1 = 정면(카메라에 가까움)
    g.scale.setScalar(0.5 + f * 0.78);
    g.renderOrder = Math.round(f * 30);
    if (mat.current) {
      mat.current.emissiveIntensity = 0.05 + f * 0.7;
      mat.current.opacity = 0.32 + f * 0.68;
    }
  });

  return (
    <Billboard ref={group}>
      {/* 솔리드 컬러 포스터(팜플렛 스타일) */}
      <RoundedBox args={[1.5, 2.08, 0.06]} radius={0.05} smoothness={4}>
        <meshStandardMaterial
          ref={mat}
          color={lab.color}
          emissive={lab.color}
          emissiveIntensity={0.1}
          roughness={0.45}
          transparent
          toneMapped={false}
        />
      </RoundedBox>
      <Text
        position={[0, 0.2, 0.05]}
        fontSize={1.05}
        color="#0a0a0a"
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
        outlineWidth={0}
      >
        {lab.index}
      </Text>
      <Text
        position={[0, -0.78, 0.05]}
        fontSize={0.155}
        maxWidth={1.28}
        textAlign="center"
        lineHeight={1.0}
        color="#0a0a0a"
        anchorX="center"
        anchorY="middle"
      >
        {lab.title}
      </Text>
    </Billboard>
  );
}

function Wheel({ onActive }: { onActive: (i: number) => void }) {
  const { gl } = useThree();
  const offset = useRef(0);
  const vel = useRef(0);
  const dragging = useRef(false);
  const lastX = useRef(0);
  const lastActive = useRef(-1);
  const N = LABS.length;
  const slot = (Math.PI * 2) / N;

  useEffect(() => {
    const el = gl.domElement;
    el.style.cursor = "grab";
    const down = (e: PointerEvent) => {
      dragging.current = true;
      lastX.current = e.clientX;
      el.style.cursor = "grabbing";
    };
    const move = (e: PointerEvent) => {
      if (!dragging.current) return;
      vel.current += (e.clientX - lastX.current) * 0.001;
      lastX.current = e.clientX;
    };
    const up = () => {
      dragging.current = false;
      el.style.cursor = "grab";
    };
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      const unit =
        e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1;
      const raw = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      vel.current += raw * unit * 0.00012;
      vel.current = Math.max(-MAX_VEL, Math.min(MAX_VEL, vel.current));
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("wheel", wheel, { passive: false });
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("wheel", wheel);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [gl]);

  useFrame(() => {
    vel.current = Math.max(-MAX_VEL, Math.min(MAX_VEL, vel.current));
    offset.current += vel.current;
    vel.current *= 0.9;
    if (!dragging.current && Math.abs(vel.current) < 0.0016) {
      const nearest = Math.round(offset.current / slot) * slot;
      offset.current += (nearest - offset.current) * 0.1;
    }
    const TAU = Math.PI * 2;
    offset.current = ((offset.current % TAU) + TAU) % TAU;
    const k = Math.round(offset.current / slot);
    const active = ((-k % N) + N) % N;
    if (active !== lastActive.current) {
      lastActive.current = active;
      onActive(active);
    }
  });

  return (
    <>
      {LABS.map((lab, i) => (
        <PosterCard
          key={lab.slug}
          lab={lab}
          index={i}
          count={N}
          offsetRef={offset}
        />
      ))}
    </>
  );
}

export default function PosterWheel({
  onActiveChange,
}: {
  onActiveChange: (i: number) => void;
}) {
  return (
    <Canvas
      camera={{ position: [0, 0, 9], fov: 40 }}
      dpr={[1, 2]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener(
          "webglcontextlost",
          (e) => e.preventDefault(),
          false,
        );
      }}
    >
      <color attach="background" args={["#08080a"]} />
      <fog attach="fog" args={["#08080a", 7, 19]} />
      <ambientLight intensity={0.9} />
      <directionalLight position={[3, 5, 6]} intensity={1.0} />
      <directionalLight
        position={[-4, -2, 1]}
        intensity={0.3}
        color="#6f8cff"
      />
      <Wheel onActive={onActiveChange} />
    </Canvas>
  );
}
