"use client";

import { useTheme } from "@/lib/theme";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggle } = useTheme();
  return (
    <button
      type="button"
      onClick={toggle}
      title={theme === "dark" ? "라이트 모드로" : "다크 모드로"}
      aria-label="테마 전환"
      className={`grid h-7 w-7 place-items-center rounded-full border border-[var(--line)] text-[13px] text-[var(--muted)] transition-colors hover:text-[var(--fg)] ${className}`}
    >
      {theme === "dark" ? "☀" : "☾"}
    </button>
  );
}
