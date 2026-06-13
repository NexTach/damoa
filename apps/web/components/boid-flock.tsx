"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const ACCENT = "#ff4d8d";

// Boids flocking: separation / alignment / cohesion + flee from the pointer.
function Flock({ count }: { count: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const { camera, pointer } = useThree();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const forward = useMemo(() => new THREE.Vector3(0, 0, 1), []);
  const dir = useMemo(() => new THREE.Vector3(), []);
  const ptr = useMemo(() => new THREE.Vector3(), []);

  // Half-extents of the region the flock lives in.
  const B = useMemo(() => ({ x: 7, y: 4, z: 3 }), []);

  const { pos, vel } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() * 2 - 1) * B.x;
      pos[i * 3 + 1] = (Math.random() * 2 - 1) * B.y;
      pos[i * 3 + 2] = (Math.random() * 2 - 1) * B.z;
      vel[i * 3] = (Math.random() * 2 - 1) * 1.5;
      vel[i * 3 + 1] = (Math.random() * 2 - 1) * 1.5;
      vel[i * 3 + 2] = (Math.random() * 2 - 1) * 0.6;
    }
    return { pos, vel };
  }, [count, B]);

  useFrame((_, raw) => {
    const m = mesh.current;
    if (!m) return;
    const dt = Math.min(raw, 0.04);

    // Pointer → world point on the z=0 plane.
    ptr.set(pointer.x, pointer.y, 0.5).unproject(camera);
    dir.copy(ptr).sub(camera.position).normalize();
    const t = -camera.position.z / dir.z;
    ptr.copy(camera.position).addScaledVector(dir, t);

    const PERC = 1.7;
    const PERC2 = PERC * PERC;
    const SEP = 0.9;
    const SEP2 = SEP * SEP;
    const MAX_SPEED = 3.2;
    const MAX_FORCE = 6.5;
    const FLEE = 2.6;
    const FLEE2 = FLEE * FLEE;

    for (let i = 0; i < count; i++) {
      const ix = i * 3;
      const px = pos[ix];
      const py = pos[ix + 1];
      const pz = pos[ix + 2];

      let cx = 0;
      let cy = 0;
      let cz = 0; // cohesion (avg pos)
      let ax = 0;
      let ay = 0;
      let az = 0; // alignment (avg vel)
      let sx = 0;
      let sy = 0;
      let sz = 0; // separation
      let n = 0;

      for (let j = 0; j < count; j++) {
        if (j === i) continue;
        const jx = j * 3;
        const dx = pos[jx] - px;
        const dy = pos[jx + 1] - py;
        const dz = pos[jx + 2] - pz;
        const d2 = dx * dx + dy * dy + dz * dz;
        if (d2 < PERC2) {
          cx += pos[jx];
          cy += pos[jx + 1];
          cz += pos[jx + 2];
          ax += vel[jx];
          ay += vel[jx + 1];
          az += vel[jx + 2];
          n++;
          if (d2 < SEP2 && d2 > 1e-5) {
            const inv = 1 / Math.sqrt(d2);
            sx -= dx * inv;
            sy -= dy * inv;
            sz -= dz * inv;
          }
        }
      }

      let fx = 0;
      let fy = 0;
      let fz = 0;

      if (n > 0) {
        // Cohesion: steer toward neighbours' center.
        fx += (cx / n - px) * 0.9;
        fy += (cy / n - py) * 0.9;
        fz += (cz / n - pz) * 0.9;
        // Alignment: match average heading.
        fx += (ax / n) * 1.1;
        fy += (ay / n) * 1.1;
        fz += (az / n) * 1.1;
      }
      // Separation (strongest).
      fx += sx * 2.4;
      fy += sy * 2.4;
      fz += sz * 2.4;

      // Flee from the pointer.
      const dpx = px - ptr.x;
      const dpy = py - ptr.y;
      const dpz = pz - ptr.z;
      const dp2 = dpx * dpx + dpy * dpy + dpz * dpz;
      if (dp2 < FLEE2 && dp2 > 1e-5) {
        const inv = 1 / Math.sqrt(dp2);
        const strength = (1 - Math.sqrt(dp2) / FLEE) * 14;
        fx += dpx * inv * strength;
        fy += dpy * inv * strength;
        fz += dpz * inv * strength;
      }

      // Soft walls: steer back inside the box.
      if (px > B.x) fx -= (px - B.x) * 3;
      else if (px < -B.x) fx -= (px + B.x) * 3;
      if (py > B.y) fy -= (py - B.y) * 3;
      else if (py < -B.y) fy -= (py + B.y) * 3;
      if (pz > B.z) fz -= (pz - B.z) * 3;
      else if (pz < -B.z) fz -= (pz + B.z) * 3;

      // Clamp steering force.
      const f2 = fx * fx + fy * fy + fz * fz;
      if (f2 > MAX_FORCE * MAX_FORCE) {
        const s = MAX_FORCE / Math.sqrt(f2);
        fx *= s;
        fy *= s;
        fz *= s;
      }

      // Integrate velocity, clamp speed.
      let vx = vel[ix] + fx * dt;
      let vy = vel[ix + 1] + fy * dt;
      let vz = vel[ix + 2] + fz * dt;
      const v2 = vx * vx + vy * vy + vz * vz;
      if (v2 > MAX_SPEED * MAX_SPEED) {
        const s = MAX_SPEED / Math.sqrt(v2);
        vx *= s;
        vy *= s;
        vz *= s;
      }
      vel[ix] = vx;
      vel[ix + 1] = vy;
      vel[ix + 2] = vz;
      pos[ix] = px + vx * dt;
      pos[ix + 1] = py + vy * dt;
      pos[ix + 2] = pz + vz * dt;

      // Orient the instance along its velocity.
      dummy.position.set(pos[ix], pos[ix + 1], pos[ix + 2]);
      const sp = Math.sqrt(v2) || 1;
      dir.set(vx / sp, vy / sp, vz / sp);
      dummy.quaternion.setFromUnitVectors(forward, dir);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <coneGeometry args={[0.07, 0.34, 5]} onUpdate={rotateConeToZ} />
      <meshStandardMaterial
        color={ACCENT}
        emissive={ACCENT}
        emissiveIntensity={0.35}
        roughness={0.4}
        metalness={0.1}
        flatShading
      />
    </instancedMesh>
  );
}

// Cone points +Y by default; rotate so it points +Z (the forward axis we orient to).
function rotateConeToZ(geo: THREE.BufferGeometry) {
  geo.rotateX(Math.PI / 2);
}

export default function BoidFlock() {
  // Fewer boids on phones (O(n²) flocking); fixed per page load.
  const count = useMemo(
    () =>
      typeof window !== "undefined" && window.innerWidth < 768 ? 120 : 240,
    [],
  );
  return (
    <div className="h-full w-full">
      <Canvas
        camera={{ position: [0, 0, 11], fov: 45 }}
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
        <fog attach="fog" args={["#08080a", 9, 18]} />
        <ambientLight intensity={0.9} />
        <directionalLight position={[4, 6, 8]} intensity={1.4} />
        <directionalLight
          position={[-5, -3, 2]}
          intensity={0.5}
          color="#7c8cff"
        />
        <Flock count={count} />
      </Canvas>
    </div>
  );
}
