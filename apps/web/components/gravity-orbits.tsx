"use client";

import { useEffect, useRef } from "react";

const ACCENT = "#ffd23e";

type Body = { x: number; y: number; vx: number; vy: number; m: number };

// 2D gravity sandbox: planets orbit a central sun, the pointer is a roaming
// attractor, and tapping spawns a new planet. Motion trails via alpha fade.
export default function GravityOrbits() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      w = cv.clientWidth;
      h = cv.clientHeight;
      cv.width = Math.floor(w * dpr);
      cv.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const G = 5200;
    const bodies: Body[] = [];
    const sun: Body = { x: 0, y: 0, vx: 0, vy: 0, m: 1500 };
    const pointer = { x: 0, y: 0, inside: false };

    const orbital = (x: number, y: number, m: number): Body => {
      const dx = x - sun.x;
      const dy = y - sun.y;
      const r = Math.hypot(dx, dy) || 1;
      const speed = Math.sqrt((G * sun.m) / r) * (0.75 + Math.random() * 0.4);
      return { x, y, vx: (-dy / r) * speed, vy: (dx / r) * speed, m };
    };

    let inited = false;
    const seed = () => {
      sun.x = w / 2;
      sun.y = h / 2;
      bodies.length = 0;
      const base = Math.min(w, h);
      for (let i = 0; i < 7; i++) {
        const r = base * (0.12 + i * 0.05);
        bodies.push(orbital(w / 2 + r, h / 2, 2.5 + Math.random() * 7));
      }
      inited = true;
    };

    const pos = (e: PointerEvent) => {
      const r = cv.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
    };
    const onMove = (e: PointerEvent) => {
      pos(e);
      pointer.inside = true;
    };
    const onDown = (e: PointerEvent) => {
      pos(e);
      pointer.inside = true;
      if (bodies.length < 220)
        bodies.push(orbital(pointer.x, pointer.y, 3 + Math.random() * 8));
    };
    const onLeave = () => {
      pointer.inside = false;
    };
    cv.style.touchAction = "none";
    cv.addEventListener("pointermove", onMove);
    cv.addEventListener("pointerdown", onDown);
    cv.addEventListener("pointerleave", onLeave);

    let raf = 0;
    let last = performance.now();
    const step = (now: number) => {
      raf = requestAnimationFrame(step);
      const dt = Math.min((now - last) / 1000, 0.033);
      last = now;
      if (!inited && w > 0) seed();

      // Trail fade.
      ctx.fillStyle = "rgba(8,8,10,0.2)";
      ctx.fillRect(0, 0, w, h);

      const maxR = Math.hypot(w, h);
      for (const b of bodies) {
        let dx = sun.x - b.x;
        let dy = sun.y - b.y;
        let r2 = dx * dx + dy * dy + 600;
        let inv = 1 / Math.sqrt(r2);
        let a = (G * sun.m) / r2;
        b.vx += dx * inv * a * dt;
        b.vy += dy * inv * a * dt;

        if (pointer.inside) {
          dx = pointer.x - b.x;
          dy = pointer.y - b.y;
          r2 = dx * dx + dy * dy + 1200;
          inv = 1 / Math.sqrt(r2);
          a = (G * 1100) / r2;
          b.vx += dx * inv * a * dt;
          b.vy += dy * inv * a * dt;
        }

        b.x += b.vx * dt;
        b.y += b.vy * dt;

        // Respawn bodies that escape far off-screen.
        if (Math.hypot(b.x - sun.x, b.y - sun.y) > maxR) {
          const ang = Math.random() * Math.PI * 2;
          const r = Math.min(w, h) * (0.12 + Math.random() * 0.2);
          Object.assign(
            b,
            orbital(sun.x + Math.cos(ang) * r, sun.y + Math.sin(ang) * r, b.m),
          );
        }

        const speed = Math.hypot(b.vx, b.vy);
        const rad = 1.5 + b.m * 0.45;
        ctx.beginPath();
        ctx.arc(b.x, b.y, rad, 0, Math.PI * 2);
        const light = Math.min(80, 45 + speed * 0.05);
        ctx.fillStyle = `hsl(48 100% ${light}%)`;
        ctx.shadowColor = ACCENT;
        ctx.shadowBlur = 12;
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      // Sun.
      const g = ctx.createRadialGradient(sun.x, sun.y, 2, sun.x, sun.y, 38);
      g.addColorStop(0, "#fff3c0");
      g.addColorStop(0.4, ACCENT);
      g.addColorStop(1, "rgba(255,210,62,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(sun.x, sun.y, 38, 0, Math.PI * 2);
      ctx.fill();
    };
    raf = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      cv.removeEventListener("pointermove", onMove);
      cv.removeEventListener("pointerdown", onDown);
      cv.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return <canvas ref={ref} className="h-full w-full" />;
}
