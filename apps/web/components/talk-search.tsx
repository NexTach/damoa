"use client";

import { useState } from "react";
import {
  isAuthError,
  type Message,
  type MessageFilter,
  type Persona,
  searchMessages,
} from "@/lib/personae";
import { IconSearch, IconX } from "./icons";

// yyyy-MM-dd (KST day boundary) → epoch millis.
const dayStart = (d: string) => new Date(`${d}T00:00:00+09:00`).getTime();
const dayEnd = (d: string) => new Date(`${d}T23:59:59.999+09:00`).getTime();

const timeOf = (iso: string) =>
  new Date(iso).toLocaleString("ko-KR", {
    year: "2-digit",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

function MiniAvatar({ p }: { p?: Persona }) {
  if (p?.avatarUrl)
    return (
      <img
        src={p.avatarUrl}
        alt=""
        className="h-7 w-7 shrink-0 rounded-full object-cover"
      />
    );
  return (
    <span
      className="grid h-7 w-7 shrink-0 place-items-center rounded-full font-display text-[11px] text-black"
      style={{ background: p?.color ?? "#555" }}
    >
      {(p?.name?.trim()[0] ?? "?").toUpperCase()}
    </span>
  );
}

export default function TalkSearch({
  roomId,
  personas,
  participantIds,
  onJump,
  onClose,
}: {
  roomId: number;
  personas: Persona[];
  participantIds: number[];
  onJump: (messageId: number) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const [personaId, setPersonaId] = useState<number | null>(null);
  const [after, setAfter] = useState("");
  const [before, setBefore] = useState("");
  const [items, setItems] = useState<Message[] | null>(null);
  const [total, setTotal] = useState(0);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [more, setMore] = useState(false);
  const personaBy = (id: number) => personas.find((p) => p.id === id);

  const filter = (): MessageFilter => ({
    q: q.trim() || undefined,
    personaId: personaId ?? undefined,
    after: after ? dayStart(after) : undefined,
    before: before ? dayEnd(before) : undefined,
  });

  const run = async () => {
    setLoading(true);
    try {
      const r = await searchMessages(roomId, filter());
      setItems(r.messages);
      setTotal(r.total);
      setCursor(r.nextCursor);
      setMore(r.hasMore);
    } catch (e) {
      if (!isAuthError(e)) {
        setItems([]);
        setTotal(0);
        setMore(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!cursor || loading) return;
    setLoading(true);
    try {
      const r = await searchMessages(roomId, { ...filter(), cursor });
      setItems((cur) => [...(cur ?? []), ...r.messages]);
      setCursor(r.nextCursor);
      setMore(r.hasMore);
    } catch {
      // ignore; keep what we have
    } finally {
      setLoading(false);
    }
  };

  const onResultsScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (
      el.scrollHeight - el.scrollTop - el.clientHeight < 120 &&
      more &&
      !loading
    )
      loadMore();
  };

  const snippet = (m: Message) =>
    m.content?.trim() ||
    (m.attachmentExpired
      ? "만료된 파일"
      : m.attachmentType?.startsWith("image/")
        ? "사진"
        : m.attachmentType?.startsWith("video/")
          ? "동영상"
          : m.attachmentUrl
            ? "파일"
            : "");

  return (
    <div
      className="fixed inset-0 z-[110] flex items-end justify-center bg-black/65 sm:items-center sm:p-4"
      onClick={onClose}
      // biome-ignore lint/a11y/noStaticElementInteractions: backdrop click to close
      role="presentation"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        // biome-ignore lint/a11y/noStaticElementInteractions: stop backdrop close
        role="presentation"
        className="pb-safe sheet-up flex max-h-[88vh] w-full max-w-md flex-col rounded-t-2xl border border-[var(--line)] bg-[var(--bg-2)] shadow-2xl sm:max-h-[85vh] sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4">
          <span className="font-display text-lg">검색</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="text-[var(--muted)] hover:text-[var(--fg)]"
          >
            <IconX size={18} />
          </button>
        </div>

        <div className="space-y-3 border-b border-[var(--line)] p-5">
          <div className="flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--bg)] px-3">
            <IconSearch size={15} className="shrink-0 text-[var(--muted)]" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && run()}
              placeholder="내용 검색"
              className="flex-1 bg-transparent py-2.5 text-sm outline-none placeholder:text-[var(--muted)]"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setPersonaId(null)}
              className={`rounded-full border px-2.5 py-1 font-mono text-[11px] ${
                personaId === null
                  ? "border-[var(--fg)] text-[var(--fg)]"
                  : "border-[var(--line)] text-[var(--muted)]"
              }`}
            >
              전체
            </button>
            {participantIds.map((pid) => {
              const p = personaBy(pid);
              const active = personaId === pid;
              return (
                <button
                  key={pid}
                  type="button"
                  onClick={() => setPersonaId(pid)}
                  className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[11px] ${
                    active
                      ? "border-transparent text-black"
                      : "border-[var(--line)] text-[var(--muted)]"
                  }`}
                  style={active ? { background: p?.color } : undefined}
                >
                  <MiniAvatar p={p} />
                  {p?.name}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px] text-[var(--muted)]">
            <input
              type="date"
              value={after}
              onChange={(e) => setAfter(e.target.value)}
              aria-label="이후"
              className="flex-1 rounded-lg border border-[var(--line)] bg-transparent px-2 py-1.5 outline-none"
            />
            <span>~</span>
            <input
              type="date"
              value={before}
              onChange={(e) => setBefore(e.target.value)}
              aria-label="이전"
              className="flex-1 rounded-lg border border-[var(--line)] bg-transparent px-2 py-1.5 outline-none"
            />
          </div>

          <button
            type="button"
            onClick={run}
            disabled={loading}
            className="w-full rounded-xl bg-[var(--fg)] py-2.5 font-mono text-xs text-[var(--bg)] disabled:opacity-40"
          >
            {loading ? "검색 중…" : "검색"}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3" onScroll={onResultsScroll}>
          {items && (
            <div className="px-2 pb-2 font-mono text-[10px] tracking-[0.2em] text-[var(--muted)]">
              {total.toLocaleString()}건
            </div>
          )}
          {items?.length === 0 && (
            <p className="px-2 py-6 text-center font-mono text-[12px] text-[var(--muted)]">
              결과 없음
            </p>
          )}
          {items?.map((m) => {
            const p = personaBy(m.personaId);
            return (
              <button
                type="button"
                key={m.id}
                onClick={() => onJump(m.id)}
                className="flex w-full items-start gap-2 rounded-xl px-2 py-2 text-left hover:bg-[var(--hover)]"
              >
                <MiniAvatar p={p} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="truncate text-[13px]">{p?.name}</span>
                    <span className="shrink-0 font-mono text-[9px] text-[var(--muted)]">
                      {timeOf(m.sentAt)}
                    </span>
                  </div>
                  <div className="truncate text-[13px] text-[var(--muted)]">
                    {snippet(m)}
                  </div>
                </div>
              </button>
            );
          })}
          {items && items.length > 0 && more && (
            <div className="py-3 text-center font-mono text-[10px] tracking-[0.2em] text-[var(--muted)]">
              {loading ? "불러오는 중…" : "스크롤하여 더 보기"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
