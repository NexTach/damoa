"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import { LABS } from "@/lib/labs";

const PosterWheel = dynamic(() => import("@/components/poster-wheel"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full w-full place-items-center">
      <span
        className="font-mono text-xs tracking-[0.4em] text-[var(--muted)]"
        style={{ animation: "blink 1.4s infinite" }}
      >
        INITIALIZING WEBGL
      </span>
    </div>
  ),
});

export default function Home() {
  const [active, setActive] = useState(0);
  const lab = LABS[active] ?? LABS[0];

  return (
    <main className="relative h-dvh w-screen overflow-hidden bg-[var(--bg)]">
      {/* WebGL 휠 */}
      <div className="absolute inset-0">
        <PosterWheel onActiveChange={setActive} />
      </div>

      {/* 하단 스크림 — 모바일에서 텍스트 가독성 확보 */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[58%] bg-gradient-to-t from-[var(--bg)] via-[var(--bg)]/80 to-transparent md:h-[42%] md:via-[var(--bg)]/40" />

      {/* HTML 오버레이 */}
      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-5 md:p-9">
        {/* 헤더 */}
        <header className="flex items-start justify-between">
          <div className="rise">
            <div className="font-display text-2xl leading-none tracking-tight md:text-3xl">
              damoa
            </div>
            <div className="mt-1 font-mono text-[10px] tracking-[0.35em] text-[var(--muted)]">
              INTERACTIVE LAB
            </div>
          </div>
          <div className="text-right font-mono text-[10px] leading-relaxed tracking-[0.25em] text-[var(--muted)]">
            <div>
              {String(active + 1).padStart(2, "0")} /{" "}
              {String(LABS.length).padStart(2, "0")}
            </div>
            <div className="mt-1 hidden md:block">NEXT.JS · WEBGL</div>
          </div>
        </header>

        {/* 푸터: 액티브 정보 */}
        <footer className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div key={active} className="rise max-w-xl">
            <div
              className="font-mono text-xs tracking-[0.3em]"
              style={{ color: lab.color }}
            >
              {lab.index} — {lab.tag.toUpperCase()}
            </div>
            <h1 className="font-display mt-2 text-4xl leading-[0.95] sm:text-5xl md:text-7xl">
              {lab.title}
            </h1>
            <Link
              href={`/lab/${lab.slug}`}
              className="pointer-events-auto group mt-6 inline-flex items-center gap-3 border border-[var(--line)] bg-black/30 px-5 py-3 backdrop-blur-sm transition-colors hover:border-[var(--fg)]"
              style={{ borderColor: `${lab.color}55` }}
            >
              <span className="font-mono text-xs tracking-[0.25em]">
                {lab.ready ? "ENTER" : "PREVIEW"}
              </span>
              <span
                className="transition-transform group-hover:translate-x-1"
                style={{ color: lab.color }}
              >
                →
              </span>
              {!lab.ready && (
                <span className="ml-1 font-mono text-[9px] tracking-[0.2em] text-[var(--muted)]">
                  WIP
                </span>
              )}
            </Link>
          </div>

          {/* 인디케이터 + 힌트 */}
          <div className="flex items-center justify-between gap-6 md:flex-col md:items-end">
            <div className="flex gap-2">
              {LABS.map((l, i) => (
                <span
                  key={l.slug}
                  className="h-1.5 rounded-full transition-all duration-500"
                  style={{
                    width: i === active ? 26 : 6,
                    background: i === active ? l.color : "var(--line)",
                  }}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.3em] text-[var(--muted)]">
              <span className="hidden md:inline">←</span>
              DRAG · SCROLL TO SPIN
              <span className="hidden md:inline">→</span>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
