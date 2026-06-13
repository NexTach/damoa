"use client";

import dynamic from "next/dynamic";
import Link from "next/link";

const BoidFlock = dynamic(() => import("@/components/boid-flock"), {
  ssr: false,
});

export default function SwarmPage() {
  return (
    <main className="relative h-dvh w-screen overflow-hidden bg-[var(--bg)]">
      <div className="absolute inset-0">
        <BoidFlock />
      </div>

      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-6 md:p-9">
        <header className="flex items-start justify-between">
          <Link
            href="/"
            className="pointer-events-auto inline-flex items-center gap-2 font-mono text-xs tracking-[0.25em] mix-blend-difference transition-opacity hover:opacity-60"
          >
            ← LAB
          </Link>
          <div className="text-right font-mono text-[10px] tracking-[0.25em] mix-blend-difference">
            06 / FLOCKING
          </div>
        </header>

        <footer className="rise">
          <div
            className="font-mono text-xs tracking-[0.3em]"
            style={{ color: "#ff4d8d" }}
          >
            SEPARATION · ALIGNMENT · COHESION
          </div>
          <h1 className="font-display mt-2 text-5xl leading-[0.95] md:text-7xl">
            Murmuration
          </h1>
          <div className="mt-4 font-mono text-[10px] tracking-[0.3em] mix-blend-difference">
            MOVE POINTER TO SCATTER ↗
          </div>
        </footer>
      </div>
    </main>
  );
}
