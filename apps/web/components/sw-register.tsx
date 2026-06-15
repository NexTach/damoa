"use client";

import { useEffect } from "react";

// Registers the service worker in production for installability + offline shell.
export function SwRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    const onLoad = () => {
      // updateViaCache:"none" → always fetch sw.js fresh on update checks so a
      // new worker (e.g. with the share-target handler) activates promptly.
      navigator.serviceWorker
        .register("/sw.js", { updateViaCache: "none" })
        .then((reg) => reg.update())
        .catch(() => {});
    };
    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);
  return null;
}
