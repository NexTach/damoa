"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { getLab } from "@/lib/labs";

const ShaderStage = dynamic(() => import("@/components/shader-field"), {
  ssr: false,
});

const lab = getLab("shader");

export default function ShaderPage() {
  return (
    <main className="relative h-dvh w-screen overflow-hidden bg-[var(--bg)]">
      <div className="absolute inset-0">
        <ShaderStage />
      </div>

      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-6 md:p-9">
        <header className="flex items-start justify-between">
          <Link
            href="/"
            className="pointer-events-auto inline-flex items-center gap-2 font-mono text-xs tracking-[0.25em] text-[var(--fg)] mix-blend-difference transition-opacity hover:opacity-60"
          >
            ← LAB
          </Link>
          <div className="text-right font-mono text-[10px] tracking-[0.25em] text-[var(--fg)] mix-blend-difference">
            01 / GLSL · WEBGL
          </div>
        </header>

        <footer className="rise">
          <div
            className="font-mono text-xs tracking-[0.3em]"
            style={{ color: lab?.color }}
          >
            REAL-TIME FRAGMENT SHADER
          </div>
          <h1 className="font-display mt-2 text-5xl leading-[0.95] md:text-7xl">
            Shader Field
          </h1>
          <div className="mt-4 font-mono text-[10px] tracking-[0.3em] text-[var(--fg)] mix-blend-difference">
            MOVE POINTER ↗
          </div>
        </footer>
      </div>
    </main>
  );
}
