"use client";

import {
  Billboard,
  MeshTransmissionMaterial,
  RoundedBox,
  Text,
} from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import type * as THREE from "three";
import { LABS, type Lab } from "@/lib/labs";

// 토성 고리 — 길고 극단적인 / 대각선. 먼쪽은 멀어져 안개로 사라진다.
const R = 4.7; // 고리 반지름
const TILT = 1.06; // 기울기(rad)
const DIAG = 0.55; // 대각선 회전(좌우 반전) — 가까운쪽 좌상단 / 먼쪽 우하단
const X_OFFSET = 2.5; // 고리를 오른쪽으로 이동 — 액티브가 오른쪽 빈 공간에 오게
const Y_OFFSET = -1.5; // 액티브가 위로 잘리지 않게 휠 전체를 내림
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
  const glow = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const slot = (Math.PI * 2) / count;
    const ang = index * slot + offsetRef.current;
    const cx = Math.sin(ang) * R;
    const cy = Math.cos(ang) * R * Math.cos(TILT);
    const cz = Math.cos(ang) * R * Math.sin(TILT);
    g.position.set(cx * COSD - cy * SIND, cx * SIND + cy * COSD, cz);
    const f = (Math.cos(ang) + 1) / 2; // 1 = 정면(가까움)
    g.scale.setScalar(0.22 + f * 0.95); // 액티브를 덜 가깝게(작게), 먼쪽은 아주 작게
    g.renderOrder = Math.round(f * 30);
    if (glow.current) {
      glow.current.emissiveIntensity = f * 1.7;
      glow.current.opacity = f * f * 0.85; // 먼쪽 글로우는 빠르게 0
    }
  });

  return (
    <Billboard ref={group}>
      {/* 컬러 글로우(유리 뒤 빛) */}
      <RoundedBox
        args={[1.62, 2.2, 0.02]}
        radius={0.13}
        smoothness={5}
        position={[0, 0, -0.05]}
      >
        <meshStandardMaterial
          ref={glow}
          color={lab.color}
          emissive={lab.color}
          emissiveIntensity={0.8}
          transparent
          opacity={0.5}
          depthWrite={false}
          toneMapped={false}
        />
      </RoundedBox>
      {/* 애플식 프로스트 글래스 */}
      <RoundedBox args={[1.5, 2.08, 0.16]} radius={0.12} smoothness={5}>
        <MeshTransmissionMaterial
          samples={4}
          resolution={200}
          transmission={1}
          thickness={0.7}
          roughness={0.22}
          ior={1.2}
          chromaticAberration={0.05}
          distortion={0.1}
          distortionScale={0.15}
          temporalDistortion={0}
          color="#e6ecf5"
          backside={false}
        />
      </RoundedBox>
      <Text
        position={[0, 0.2, 0.1]}
        fontSize={1.0}
        color={lab.color}
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
        outlineWidth={0}
      >
        {lab.index}
      </Text>
      <Text
        position={[0, -0.78, 0.1]}
        fontSize={0.15}
        maxWidth={1.28}
        textAlign="center"
        lineHeight={1.0}
        color={lab.color}
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
    <group position={[X_OFFSET, Y_OFFSET, 0]}>
      {LABS.map((lab, i) => (
        <PosterCard
          key={lab.slug}
          lab={lab}
          index={i}
          count={N}
          offsetRef={offset}
        />
      ))}
    </group>
  );
}

export default function PosterWheel({
  onActiveChange,
}: {
  onActiveChange: (i: number) => void;
}) {
  return (
    <Canvas
      camera={{ position: [0, 0, 9.5], fov: 42 }}
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
      <fog attach="fog" args={["#08080a", 6, 13.5]} />
      <ambientLight intensity={1.1} />
      <directionalLight position={[3, 5, 6]} intensity={1.2} />
      <directionalLight
        position={[-4, -2, 1]}
        intensity={0.4}
        color="#6f8cff"
      />
      <Wheel onActive={onActiveChange} />
    </Canvas>
  );
}
