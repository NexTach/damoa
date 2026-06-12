"use client";

import dynamic from "next/dynamic";
import Link from "next/link";

const ScrollStage = dynamic(() => import("@/components/scroll-stage"), {
  ssr: false,
});

export default function ScrollPage() {
  return (
    <main className="relative h-dvh w-screen overflow-hidden bg-[var(--bg)]">
      <div className="absolute inset-0">
        <ScrollStage />
      </div>

      {/* 고정 오버레이 (스크롤과 무관) */}
      <div className="pointer-events-none absolute inset-0 z-10 flex items-start justify-between p-6 md:p-9">
        <Link
          href="/"
          className="pointer-events-auto inline-flex items-center gap-2 font-mono text-xs tracking-[0.25em] mix-blend-difference transition-opacity hover:opacity-60"
        >
          ← LAB
        </Link>
        <div className="text-right font-mono text-[10px] tracking-[0.25em] mix-blend-difference">
          04 / SCROLL-LINKED 3D
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-6 z-10 text-center font-mono text-[10px] tracking-[0.35em] text-[var(--muted)]">
        SCROLL ↓
      </div>
    </main>
  );
}
