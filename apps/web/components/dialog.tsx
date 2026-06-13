"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { IconX } from "./icons";

type Kind = "alert" | "confirm" | "prompt";

type ConfirmOpts = { title?: string; confirmText?: string; danger?: boolean };
type PromptOpts = { defaultValue?: string; placeholder?: string };

type DialogApi = {
  alert: (message: string, title?: string) => Promise<void>;
  confirm: (message: string, opts?: ConfirmOpts) => Promise<boolean>;
  prompt: (title: string, opts?: PromptOpts) => Promise<string | null>;
};

type Req = {
  kind: Kind;
  title?: string;
  message?: string;
  placeholder?: string;
  confirmText?: string;
  danger?: boolean;
  // biome-ignore lint/suspicious/noExplicitAny: resolves with void | boolean | string|null
  resolve: (v: any) => void;
};

const DialogContext = createContext<DialogApi | null>(null);

export function useDialog() {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error("useDialog must be used within DialogProvider");
  return ctx;
}

export function DialogProvider({ children }: { children: ReactNode }) {
  const [req, setReq] = useState<Req | null>(null);
  const [value, setValue] = useState("");

  const api = useMemo<DialogApi>(
    () => ({
      alert: (message, title) =>
        new Promise<void>((resolve) =>
          setReq({ kind: "alert", message, title, resolve }),
        ),
      confirm: (message, opts) =>
        new Promise<boolean>((resolve) =>
          setReq({ kind: "confirm", message, ...opts, resolve }),
        ),
      prompt: (title, opts) =>
        new Promise<string | null>((resolve) => {
          setValue(opts?.defaultValue ?? "");
          setReq({
            kind: "prompt",
            title,
            placeholder: opts?.placeholder,
            resolve,
          });
        }),
    }),
    [],
  );

  const close = (result: unknown) => {
    req?.resolve(result);
    setReq(null);
  };
  const onCancel = () => close(req?.kind === "prompt" ? null : false);
  const onConfirm = () =>
    close(req?.kind === "prompt" ? value.trim() : req?.kind === "confirm");

  useEffect(() => {
    if (!req) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // biome-ignore lint/correctness/useExhaustiveDependencies: only re-bind per dialog
  }, [req]);

  return (
    <DialogContext.Provider value={api}>
      {children}
      {req && (
        <div
          role="presentation"
          onClick={onCancel}
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/55 p-0 backdrop-blur-sm sm:items-center sm:p-4"
        >
          <div
            role="dialog"
            aria-modal
            onClick={(e) => e.stopPropagation()}
            // biome-ignore lint/a11y/noStaticElementInteractions: stop backdrop close
            className="pb-safe sheet-up relative w-full max-w-sm rounded-t-2xl border border-[var(--line)] bg-[var(--bg-2)] p-5 shadow-2xl sm:rounded-2xl"
          >
            <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-[var(--line)] sm:hidden" />
            {req.title && (
              <div className="mb-1 font-display text-lg">{req.title}</div>
            )}
            {req.message && (
              <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-[var(--fg)]">
                {req.message}
              </p>
            )}
            {req.kind === "prompt" && (
              // biome-ignore lint/a11y/noAutofocus: focus the only input on open
              <input
                autoFocus
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onConfirm();
                }}
                placeholder={req.placeholder}
                className="mt-3 w-full rounded-xl border border-[var(--line)] bg-transparent px-3 py-2.5 text-[14px] outline-none focus:border-[var(--muted)]"
              />
            )}
            <div className="mt-5 flex justify-end gap-2 font-mono text-xs">
              {req.kind !== "alert" && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="rounded-xl px-4 py-2.5 text-[var(--muted)] hover:text-[var(--fg)]"
                >
                  취소
                </button>
              )}
              <button
                type="button"
                onClick={onConfirm}
                className="rounded-xl px-4 py-2.5"
                style={{
                  background: req.danger ? "#ff5e3a" : "var(--fg)",
                  color: req.danger ? "#fff" : "var(--bg)",
                }}
              >
                {req.confirmText ?? (req.kind === "alert" ? "확인" : "확인")}
              </button>
            </div>
            <button
              type="button"
              onClick={onCancel}
              aria-label="닫기"
              className="absolute right-3 top-3 hidden text-[var(--muted)] hover:text-[var(--fg)] sm:block"
            >
              <IconX size={16} />
            </button>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}
