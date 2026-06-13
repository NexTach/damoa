"use client";

import { useEffect, useRef } from "react";

const ACCENT = "#36e0ff";
const WORDS = ["damoa", "type", "play", "lab"];

type P = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  tx: number;
  ty: number;
};

// Kinetic typography: particles assemble into a word, scatter away from the
// pointer, then spring back. Tap/click cycles to the next word.
export default function KineticType() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const parts: P[] = [];
    const pointer = { x: -9999, y: -9999, inside: false };
    let wordIdx = 0;

    // Sample a word into target points via an offscreen canvas.
    const sampleWord = (word: string) => {
      const off = document.createElement("canvas");
      off.width = Math.max(1, Math.floor(w));
      off.height = Math.max(1, Math.floor(h));
      const o = off.getContext("2d");
      if (!o) return [] as Array<{ x: number; y: number }>;
      const size = Math.min(w * 0.22, h * 0.5);
      o.fillStyle = "#fff";
      o.textAlign = "center";
      o.textBaseline = "middle";
      o.font = `800 ${size}px "Syne", system-ui, sans-serif`;
      o.fillText(word, w / 2, h / 2);
      const img = o.getImageData(0, 0, off.width, off.height).data;
      const gap = Math.max(4, Math.round(size / 26));
      const pts: Array<{ x: number; y: number }> = [];
      for (let y = 0; y < off.height; y += gap) {
        for (let x = 0; x < off.width; x += gap) {
          if (img[(y * off.width + x) * 4 + 3] > 128) pts.push({ x, y });
        }
      }
      return pts;
    };

    const retarget = () => {
      const pts = sampleWord(WORDS[wordIdx]);
      // Match particle count to target points.
      while (parts.length < pts.length) {
        parts.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: 0,
          vy: 0,
          tx: 0,
          ty: 0,
        });
      }
      parts.length = Math.max(pts.length, 1);
      // Shuffle assignment a touch for organic motion.
      for (let i = 0; i < parts.length; i++) {
        const p = pts[i % pts.length];
        parts[i].tx = p.x;
        parts[i].ty = p.y;
      }
    };

    const resize = () => {
      w = cv.clientWidth;
      h = cv.clientHeight;
      cv.width = Math.floor(w * dpr);
      cv.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      retarget();
    };

    const pos = (e: PointerEvent) => {
      const r = cv.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
      pointer.inside = true;
    };
    const onLeave = () => {
      pointer.inside = false;
      pointer.x = -9999;
      pointer.y = -9999;
    };
    const onDown = (e: PointerEvent) => {
      pos(e);
      wordIdx = (wordIdx + 1) % WORDS.length;
      retarget();
    };

    cv.style.touchAction = "none";
    cv.addEventListener("pointermove", pos);
    cv.addEventListener("pointerdown", onDown);
    cv.addEventListener("pointerleave", onLeave);
    window.addEventListener("resize", resize);
    // Fonts may load after first paint — re-sample once ready.
    document.fonts?.ready.then(retarget).catch(() => {});
    resize();

    let raf = 0;
    const R = 90;
    const R2 = R * R;
    const step = () => {
      raf = requestAnimationFrame(step);
      ctx.fillStyle = "rgba(8,8,10,0.32)";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = ACCENT;
      for (const p of parts) {
        // Spring toward target.
        p.vx += (p.tx - p.x) * 0.012;
        p.vy += (p.ty - p.y) * 0.012;
        // Repel from pointer.
        if (pointer.inside) {
          const dx = p.x - pointer.x;
          const dy = p.y - pointer.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < R2 && d2 > 0.01) {
            const f = (1 - Math.sqrt(d2) / R) * 6;
            const inv = 1 / Math.sqrt(d2);
            p.vx += dx * inv * f;
            p.vy += dy * inv * f;
          }
        }
        p.vx *= 0.86;
        p.vy *= 0.86;
        p.x += p.vx;
        p.y += p.vy;
        ctx.fillRect(p.x - 1, p.y - 1, 2.4, 2.4);
      }
    };
    raf = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      cv.removeEventListener("pointermove", pos);
      cv.removeEventListener("pointerdown", onDown);
      cv.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return <canvas ref={ref} className="h-full w-full" />;
}
