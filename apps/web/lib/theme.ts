"use client";

import { useEffect, useState } from "react";

export type Theme = "dark" | "light";

const KEY = "damoa-theme";

/** Inlined into <head> so the theme is applied before first paint (no FOUC). */
export const themeBootScript = `(()=>{try{var t=localStorage.getItem("${KEY}");if(!t){t=matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";}document.documentElement.dataset.theme=t;}catch(e){}})();`;

const read = (): Theme => {
  if (typeof document !== "undefined") {
    const t = document.documentElement.dataset.theme;
    if (t === "light" || t === "dark") return t;
  }
  return "dark";
};

export const useTheme = () => {
  const [theme, setThemeState] = useState<Theme>("dark");

  // The boot script set data-theme already; sync React state on mount.
  useEffect(() => setThemeState(read()), []);

  const setTheme = (next: Theme) => {
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(KEY, next);
    } catch {}
    setThemeState(next);
  };

  return {
    theme,
    toggle: () => setTheme(theme === "dark" ? "light" : "dark"),
    setTheme,
  };
};
