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
const DIAG = 0.55; // 대각선 회전(rad)
const COSD = Math.cos(DIAG);
const SIND = Math.sin(DIAG);
// 화면상 고리의 가장 높은 지점의 각도 = 선택(featured)이 놓이는 위치(우상단)
const PHI = Math.atan2(SIND, Math.cos(TILT) * COSD);
const X_OFFSET = -0.5; // 좌우 미세 위치
const Y_OFFSET = -2.5; // 선택 포스터를 기준 수평선 높이에 맞춤
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
    // 고리 최고점(PHI)에 가까울수록 f=1 (= 선택)
    const d = Math.atan2(Math.sin(ang - PHI), Math.cos(ang - PHI));
    const f = (Math.cos(d) + 1) / 2;
    g.scale.setScalar(0.24 + f * 1.16); // 액티브 더 크게(가깝게)
    g.renderOrder = Math.round(f * 30);
    if (glow.current) {
      glow.current.emissiveIntensity = f * 1.7;
      glow.current.opacity = f * f * 0.85;
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

// Pulls the camera back on small / portrait viewports so the ring never clips.
function Rig() {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  useEffect(() => {
    const portrait = size.height >= size.width;
    const small = size.width < 768;
    const z = small ? (portrait ? 13 : 11) : 9.5;
    camera.position.set(0, 0, z);
    camera.updateProjectionMatrix();
  }, [camera, size]);
  return null;
}

function Wheel({ onActive }: { onActive: (i: number) => void }) {
  const { gl, size } = useThree();
  const portrait = size.height >= size.width;
  const small = size.width < 768;
  // On mobile, shrink the ring and lift it into the upper area so the
  // text overlay below stays readable.
  const fit = small ? (portrait ? 0.72 : 0.85) : 1;
  const gx = small ? 0 : X_OFFSET;
  const gy = small ? (portrait ? 1.4 : -0.6) : Y_OFFSET;
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
    el.style.touchAction = "none"; // let the canvas own touch drags (no page scroll)
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
    // 멈추면: 한 포스터가 정확히 최고점(PHI)에 오도록 스냅
    if (!dragging.current && Math.abs(vel.current) < 0.0016) {
      const phase = (((offset.current - PHI) % slot) + slot) % slot;
      const toNearest = phase < slot / 2 ? -phase : slot - phase;
      offset.current += toNearest * 0.1;
    }
    const TAU = Math.PI * 2;
    offset.current = ((offset.current % TAU) + TAU) % TAU;
    const k = Math.round((offset.current - PHI) / slot);
    const active = ((-k % N) + N) % N;
    if (active !== lastActive.current) {
      lastActive.current = active;
      onActive(active);
    }
  });

  return (
    <group position={[gx, gy, 0]} scale={fit}>
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
      <Rig />
      <Wheel onActive={onActiveChange} />
    </Canvas>
  );
}
