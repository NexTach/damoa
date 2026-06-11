import Link from "next/link";
import { notFound } from "next/navigation";
import { getLab } from "@/lib/labs";

export default async function LabPlaceholder({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const lab = getLab(slug);
  if (!lab) notFound();

  return (
    <main className="relative grid h-dvh w-screen place-items-center overflow-hidden bg-[var(--bg)] p-6">
      {/* 거대한 인덱스 워터마크 */}
      <div
        className="font-display pointer-events-none absolute select-none text-[48vw] leading-none opacity-[0.06] md:text-[34vw]"
        style={{ color: lab.color }}
      >
        {lab.index}
      </div>

      <div className="relative z-10 max-w-lg text-center">
        <div
          className="font-mono text-xs tracking-[0.3em]"
          style={{ color: lab.color }}
        >
          {lab.index} — {lab.tag.toUpperCase()}
        </div>
        <h1 className="font-display mt-3 text-6xl leading-[0.95] md:text-8xl">
          {lab.title}
        </h1>
        <p className="mx-auto mt-5 max-w-sm font-mono text-[13px] leading-relaxed text-[var(--muted)]">
          {lab.blurb}
        </p>
        <div
          className="mt-7 inline-block border px-4 py-2 font-mono text-[10px] tracking-[0.3em] text-[var(--muted)]"
          style={{ borderColor: "var(--line)" }}
        >
          IN DEVELOPMENT
        </div>
        <div className="mt-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-mono text-xs tracking-[0.25em] transition-opacity hover:opacity-60"
          >
            ← BACK TO LAB
          </Link>
        </div>
      </div>
    </main>
  );
}
