"use client";

import { Billboard, RoundedBox, Text } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import type * as THREE from "three";
import { LABS, type Lab } from "@/lib/labs";

const R = 2.6; // 휠 반지름
const TILT = 0.52; // 휠 기울기(rad)
const MAX_VEL = 0.22; // 프레임당 최대 회전 속도(rad) — 휠 폭주 방지

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
  const frame = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const slot = (Math.PI * 2) / count;
    const ang = index * slot + offsetRef.current;
    // X축으로 기울인 원 위에 배치 (앞=상단이 카메라로 다가오며 커짐)
    g.position.set(
      Math.sin(ang) * R,
      Math.cos(ang) * R * Math.cos(TILT) + 0.15,
      Math.cos(ang) * R * Math.sin(TILT),
    );
    const f = (Math.cos(ang) + 1) / 2; // 1 = 정면(액티브)
    g.scale.setScalar(0.66 + f * 0.62);
    g.renderOrder = Math.round(f * 20);
    if (frame.current) {
      frame.current.emissiveIntensity = 0.12 + f * 1.7;
      frame.current.opacity = 0.45 + f * 0.55;
    }
  });

  return (
    <Billboard ref={group}>
      {/* 액센트 프레임(글로우) */}
      <RoundedBox args={[1.74, 2.4, 0.04]} radius={0.11} smoothness={4}>
        <meshStandardMaterial
          ref={frame}
          color={lab.color}
          emissive={lab.color}
          emissiveIntensity={0.5}
          transparent
          toneMapped={false}
        />
      </RoundedBox>
      {/* 어두운 본문 */}
      <RoundedBox
        args={[1.6, 2.26, 0.08]}
        radius={0.1}
        smoothness={4}
        position={[0, 0, 0.03]}
      >
        <meshStandardMaterial
          color="#0c0c10"
          roughness={0.55}
          metalness={0.15}
        />
      </RoundedBox>
      <Text
        position={[0, 0.64, 0.1]}
        fontSize={0.7}
        color={lab.color}
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
        outlineWidth={0}
      >
        {lab.index}
      </Text>
      <Text
        position={[0, -0.16, 0.1]}
        fontSize={0.205}
        maxWidth={1.34}
        textAlign="center"
        lineHeight={1.05}
        color="#f1f0e8"
        anchorX="center"
        anchorY="middle"
      >
        {lab.title}
      </Text>
      <Text
        position={[0, -0.92, 0.1]}
        fontSize={0.092}
        letterSpacing={0.18}
        color="#7d7d76"
        anchorX="center"
        anchorY="middle"
      >
        {lab.tag.toUpperCase()}
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
    // 마우스 휠/트랙패드 스크롤로 회전 (deltaMode 정규화 + 클램프)
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      const unit =
        e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1;
      const raw =
        Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
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
    // 폭주 방지: 속도 클램프
    vel.current = Math.max(-MAX_VEL, Math.min(MAX_VEL, vel.current));
    offset.current += vel.current;
    vel.current *= 0.9;
    // 관성이 멎으면 가장 가까운 슬롯으로 스냅
    if (!dragging.current && Math.abs(vel.current) < 0.0016) {
      const nearest = Math.round(offset.current / slot) * slot;
      offset.current += (nearest - offset.current) * 0.1;
    }
    // 각도가 무한정 커져 정밀도 깨지지 않게 [0, 2π) 로 래핑
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
      camera={{ position: [0, 0, 7.6], fov: 38 }}
      dpr={[1, 2]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        // 컨텍스트 로스 시 기본 동작(영구 손실)을 막아 자동 복구되게 한다
        gl.domElement.addEventListener(
          "webglcontextlost",
          (e) => e.preventDefault(),
          false,
        );
      }}
    >
      <color attach="background" args={["#08080a"]} />
      <fog attach="fog" args={["#08080a", 7, 18]} />
      <ambientLight intensity={0.85} />
      <directionalLight position={[3, 5, 6]} intensity={1.1} />
      <directionalLight
        position={[-4, -2, 1]}
        intensity={0.35}
        color="#6f8cff"
      />
      <Wheel onActive={onActiveChange} />
    </Canvas>
  );
}
