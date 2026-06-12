"use client";

import Link from "next/link";
import { useState } from "react";
import { flushSync } from "react-dom";

type Panel = { id: string; title: string; sub: string; from: string; to: string };

const PANELS: Panel[] = [
  { id: "aurora", title: "Aurora", sub: "GRADIENT FIELD", from: "#ff5e3a", to: "#ffb443" },
  { id: "cobalt", title: "Cobalt", sub: "DEEP CURRENT", from: "#3a86ff", to: "#6f5bff" },
  { id: "lime", title: "Lime", sub: "ACID BLOOM", from: "#d8ff2e", to: "#46d39a" },
  { id: "magenta", title: "Magenta", sub: "NEON DUSK", from: "#ff3ea5", to: "#b06bff" },
  { id: "ember", title: "Ember", sub: "SLOW BURN", from: "#ff7a18", to: "#ff2d55" },
  { id: "mint", title: "Mint", sub: "COOL VAPOR", from: "#27e8a7", to: "#3a86ff" },
];

// View Transitions API — React setState 를 flushSync 로 동기 커밋해야 스냅샷이 맞다.
// 미지원 브라우저는 즉시 전환으로 폴백.
function startVT(update: () => void) {
  const d = document as Document & {
    startViewTransition?: (cb: () => void) => void;
  };
  if (d.startViewTransition) d.startViewTransition(() => flushSync(update));
  else update();
}
const vt = (name: string): React.CSSProperties =>
  ({ viewTransitionName: name }) as React.CSSProperties;

export default function TransitionsPage() {
  const [openId, setOpenId] = useState<string | null>(null);
  const open = PANELS.find((p) => p.id === openId) ?? null;

  return (
    <main className="relative min-h-dvh w-screen overflow-hidden bg-[var(--bg)] p-6 md:p-9">
      <header className="flex items-start justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-mono text-xs tracking-[0.25em] transition-opacity hover:opacity-60"
        >
          ← LAB
        </Link>
        <div className="text-right font-mono text-[10px] tracking-[0.25em] text-[var(--muted)]">
          02 / VIEW TRANSITIONS
        </div>
      </header>

      <div className="mx-auto mt-10 max-w-5xl md:mt-16">
        <h1 className="font-display text-5xl leading-[0.95] md:text-7xl">
          View Transitions
        </h1>
        <p className="mt-4 max-w-md font-mono text-[13px] leading-relaxed text-[var(--muted)]">
          타일을 누르면 같은 요소가 상세 화면으로 <b className="text-[var(--fg)]">모핑</b>합니다.
          브라우저의 View Transitions API — 상태 전환에 공유 요소 애니메이션.
        </p>

        {/* 그리드: 상세가 열리면 언마운트되어 자연스럽게 퇴장 */}
        {!open && (
          <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
            {PANELS.map((p, i) => (
              <button
                key={p.id}
                type="button"
                onClick={() => startVT(() => setOpenId(p.id))}
                className="group relative aspect-[4/5] overflow-hidden rounded-2xl text-left"
                style={{
                  ...vt(`tile-${p.id}`),
                  backgroundImage: `linear-gradient(150deg, ${p.from}, ${p.to})`,
                }}
              >
                <span className="absolute left-4 top-3 font-display text-2xl text-black/70">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="absolute bottom-3 left-4 right-4">
                  <span className="block font-display text-2xl text-black md:text-3xl">
                    {p.title}
                  </span>
                  <span className="font-mono text-[9px] tracking-[0.2em] text-black/60">
                    {p.sub}
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 상세 — 같은 view-transition-name 으로 타일에서 모핑 */}
      {open && (
        <button
          type="button"
          onClick={() => startVT(() => setOpenId(null))}
          className="fixed inset-0 z-50 flex flex-col justify-end p-8 text-left md:p-14"
          style={{
            ...vt(`tile-${open.id}`),
            backgroundImage: `linear-gradient(150deg, ${open.from}, ${open.to})`,
          }}
        >
          <div className="font-display text-7xl leading-[0.9] text-black md:text-9xl">
            {open.title}
          </div>
          <div className="mt-3 font-mono text-xs tracking-[0.3em] text-black/70">
            {open.sub} · 아무 곳이나 눌러 닫기
          </div>
        </button>
      )}
    </main>
  );
}
