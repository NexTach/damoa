"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  clearToken,
  createMessage,
  createPersona,
  createRoom,
  deleteMessage,
  deletePersona,
  deleteRoom,
  fetchMe,
  getToken,
  isAuthError,
  listMessages,
  listPersonas,
  listRooms,
  loginUrl,
  type Me,
  type Message,
  type Persona,
  type Room,
  setToken,
  updateRoom,
  uploadAttachment,
} from "@/lib/talkmaker";

const PALETTE = [
  "#ff5e3a",
  "#48b0ff",
  "#d8ff2e",
  "#b06bff",
  "#27e8a7",
  "#ff3ea5",
  "#ffb443",
];
const initial = (s: string) => (s.trim()[0] ?? "?").toUpperCase();
const timeOf = (iso: string) =>
  new Date(iso).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });

function Avatar({ persona, size = 32 }: { persona?: Persona; size?: number }) {
  const color = persona?.color ?? "#555";
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full font-display text-black"
      style={{
        width: size,
        height: size,
        background: color,
        fontSize: size * 0.42,
      }}
    >
      {initial(persona?.name ?? "?")}
    </span>
  );
}

export default function TalkmakerPage() {
  const [status, setStatus] = useState<"loading" | "anon" | "ready">("loading");
  const [me, setMe] = useState<Me | null>(null);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [room, setRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sender, setSender] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pending, setPending] = useState<{
    key: string;
    type: string;
    url: string;
  } | null>(null);
  const [uploading, setUploading] = useState(false);
  const personaBy = (id: number) => personas.find((p) => p.id === id);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const openRoom = useCallback(async (r: Room) => {
    setRoom(r);
    setSettingsOpen(false);
    const msgs = await listMessages(r.id);
    setMessages(msgs);
    setSender(r.selfPersonaId ?? r.participantPersonaIds[0] ?? null);
  }, []);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.location.hash.startsWith("#token=")
    ) {
      setToken(decodeURIComponent(window.location.hash.slice(7)));
      history.replaceState(null, "", window.location.pathname);
    }
    (async () => {
      if (!getToken()) return setStatus("anon");
      try {
        const [ps, rs] = await Promise.all([listPersonas(), listRooms()]);
        setPersonas(ps);
        setRooms(rs);
        setStatus("ready");
        fetchMe()
          .then(setMe)
          .catch(() => {});
        if (rs.length) openRoom(rs[0]);
      } catch (e) {
        if (isAuthError(e)) clearToken();
        setStatus("anon");
      }
    })();
  }, [openRoom]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: 메시지 변경 시 하단 스크롤
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const refreshRooms = async () => setRooms(await listRooms());

  const addPersona = async (name: string) => {
    if (!name.trim()) return;
    const color = PALETTE[personas.length % PALETTE.length];
    const p = await createPersona({ name, color });
    setPersonas((cur) => [...cur, p]);
  };
  const removePersona = async (id: number) => {
    await deletePersona(id);
    setPersonas((cur) => cur.filter((p) => p.id !== id));
  };

  const newRoom = async () => {
    const title = prompt("채팅방 이름")?.trim();
    if (!title) return;
    const r = await createRoom({
      title,
      participantPersonaIds: [],
      selfPersonaId: null,
    });
    setRooms((cur) => [r, ...cur]);
    openRoom(r);
    setSettingsOpen(true);
  };
  const removeRoom = async (r: Room) => {
    if (!confirm(`'${r.title}' 삭제?`)) return;
    await deleteRoom(r.id);
    setRooms((cur) => cur.filter((x) => x.id !== r.id));
    if (room?.id === r.id) {
      setRoom(null);
      setMessages([]);
    }
  };

  const patchRoom = async (patch: Partial<Room>) => {
    if (!room) return;
    const updated = await updateRoom(room.id, {
      title: patch.title ?? room.title,
      participantPersonaIds:
        patch.participantPersonaIds ?? room.participantPersonaIds,
      selfPersonaId:
        patch.selfPersonaId !== undefined
          ? patch.selfPersonaId
          : room.selfPersonaId,
    });
    setRoom(updated);
    setRooms((cur) => cur.map((r) => (r.id === updated.id ? updated : r)));
    if (sender == null)
      setSender(
        updated.selfPersonaId ?? updated.participantPersonaIds[0] ?? null,
      );
  };

  const pickFile = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    try {
      const { key, type } = await uploadAttachment(file);
      setPending({ key, type, url: URL.createObjectURL(file) });
    } catch {
      alert("파일 업로드에 실패했어요.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const send = async () => {
    if (!room || sender == null) return;
    if (!draft.trim() && !pending) return;
    const msg = await createMessage(room.id, {
      personaId: sender,
      content: draft.trim(),
      attachmentKey: pending?.key,
      attachmentType: pending?.type,
    });
    setMessages((cur) => [...cur, msg]);
    setDraft("");
    if (pending) URL.revokeObjectURL(pending.url);
    setPending(null);
    refreshRooms();
  };
  const removeMessage = async (id: number) => {
    if (!room) return;
    await deleteMessage(room.id, id);
    setMessages((cur) => cur.filter((m) => m.id !== id));
  };

  const logout = () => {
    clearToken();
    setStatus("anon");
    setRoom(null);
  };

  if (status === "loading") {
    return (
      <main className="grid h-dvh place-items-center bg-[var(--bg)]">
        <span className="font-mono text-xs tracking-[0.4em] text-[var(--muted)]">
          LOADING…
        </span>
      </main>
    );
  }

  if (status === "anon") {
    return (
      <main className="grid h-dvh place-items-center bg-[var(--bg)] p-6">
        <div className="w-full max-w-sm text-center">
          <div
            className="font-mono text-xs tracking-[0.3em]"
            style={{ color: "#27e8a7" }}
          >
            05 — TALKMAKER
          </div>
          <h1 className="font-display mt-3 text-5xl leading-[0.95]">
            Talkmaker
          </h1>
          <p className="mt-4 font-mono text-[13px] leading-relaxed text-[var(--muted)]">
            페르소나를 만들고, 직접 대사를 이어 붙여 연출된 대화를 만드세요.
            계정마다 따로 보관됩니다.
          </p>
          <a
            href={loginUrl()}
            className="mt-8 inline-flex items-center gap-3 rounded-full bg-[var(--fg)] px-6 py-3 font-mono text-xs tracking-[0.2em] text-black transition-transform hover:scale-[1.03]"
          >
            DataGSM 로그인 →
          </a>
          <div className="mt-8">
            <Link
              href="/"
              className="font-mono text-[10px] tracking-[0.3em] text-[var(--muted)] hover:text-[var(--fg)]"
            >
              ← LAB
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex h-dvh bg-[var(--bg)] text-[var(--fg)]">
      {/* 사이드바 */}
      <aside className="flex w-72 shrink-0 flex-col border-r border-[var(--line)] bg-[var(--bg-2)]">
        <div className="flex items-center justify-between p-4">
          <div>
            <div className="font-display text-lg leading-none">Talkmaker</div>
            <div className="mt-1 font-mono text-[9px] tracking-[0.3em] text-[var(--muted)]">
              {me?.name ?? "…"}
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="font-mono text-[9px] tracking-[0.2em] text-[var(--muted)] hover:text-[var(--fg)]"
          >
            LOGOUT
          </button>
        </div>

        {/* 페르소나 */}
        <PersonaManager
          personas={personas}
          onAdd={addPersona}
          onDelete={removePersona}
        />

        {/* 채팅방 */}
        <div className="flex items-center justify-between px-4 pb-2 pt-3">
          <span className="font-mono text-[10px] tracking-[0.3em] text-[var(--muted)]">
            CHATS
          </span>
          <button
            type="button"
            onClick={newRoom}
            className="font-mono text-xs text-[var(--muted)] hover:text-[var(--fg)]"
          >
            +
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-3">
          {rooms.map((r) => (
            <div
              key={r.id}
              className={`group flex w-full items-center gap-2 rounded-lg px-3 py-2 transition-colors ${
                room?.id === r.id ? "bg-white/10" : "hover:bg-white/5"
              }`}
            >
              <button
                type="button"
                onClick={() => openRoom(r)}
                className="flex flex-1 items-center gap-2 overflow-hidden text-left"
              >
                <span className="flex -space-x-2">
                  {r.participantPersonaIds.slice(0, 3).map((pid) => (
                    <Avatar key={pid} persona={personaBy(pid)} size={22} />
                  ))}
                  {r.participantPersonaIds.length === 0 && <Avatar size={22} />}
                </span>
                <span className="flex-1 truncate text-sm">{r.title}</span>
              </button>
              <button
                type="button"
                onClick={() => removeRoom(r)}
                className="hidden font-mono text-[10px] text-[var(--muted)] hover:text-[#ff5e3a] group-hover:inline"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <Link
          href="/"
          className="border-t border-[var(--line)] p-3 text-center font-mono text-[10px] tracking-[0.3em] text-[var(--muted)] hover:text-[var(--fg)]"
        >
          ← LAB
        </Link>
      </aside>

      {/* 메인 */}
      {!room ? (
        <div className="grid flex-1 place-items-center font-mono text-xs tracking-[0.3em] text-[var(--muted)]">
          채팅방을 선택하거나 + 로 만드세요
        </div>
      ) : (
        <section className="relative flex flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-[var(--line)] px-6 py-4">
            <div className="font-display text-xl">{room.title}</div>
            <button
              type="button"
              onClick={() => setSettingsOpen((v) => !v)}
              className="font-mono text-[10px] tracking-[0.25em] text-[var(--muted)] hover:text-[var(--fg)]"
            >
              참여자 · 설정
            </button>
          </header>

          {settingsOpen && (
            <RoomSettings
              room={room}
              personas={personas}
              onPatch={patchRoom}
              onClose={() => setSettingsOpen(false)}
            />
          )}

          {/* 메시지 */}
          <div
            ref={scrollRef}
            className="flex-1 space-y-3 overflow-y-auto px-6 py-6"
          >
            {messages.length === 0 && (
              <div className="grid h-full place-items-center font-mono text-[11px] tracking-[0.2em] text-[var(--muted)]">
                아래에서 보낸 사람을 고르고 대사를 입력하세요
              </div>
            )}
            {messages.map((m) => {
              const p = personaBy(m.personaId);
              const mine = m.personaId === room.selfPersonaId;
              return (
                <div
                  key={m.id}
                  className={`group flex items-end gap-2 ${mine ? "flex-row-reverse" : ""}`}
                >
                  {!mine && <Avatar persona={p} size={28} />}
                  <div
                    className={`max-w-[68%] ${mine ? "items-end text-right" : ""} flex flex-col`}
                  >
                    {!mine && (
                      <span className="mb-1 font-mono text-[10px] text-[var(--muted)]">
                        {p?.name}
                      </span>
                    )}
                    {m.attachmentExpired && (
                      <div className="mb-1 flex items-center gap-2 rounded-2xl border border-dashed border-[var(--muted)] px-4 py-3 font-mono text-[12px] text-[var(--muted)]">
                        <span aria-hidden>🗑️</span> 만료된 파일입니다
                      </div>
                    )}
                    {m.attachmentUrl &&
                      (m.attachmentType?.startsWith("video/") ? (
                        // biome-ignore lint/a11y/useMediaCaption: user-authored fake chat clip
                        <video
                          src={m.attachmentUrl}
                          controls
                          className="mb-1 max-h-72 max-w-full rounded-2xl"
                        />
                      ) : (
                        <img
                          src={m.attachmentUrl}
                          alt=""
                          className="mb-1 max-h-72 max-w-full rounded-2xl object-cover"
                        />
                      ))}
                    {m.content && (
                      <div
                        className="whitespace-pre-wrap break-words rounded-2xl px-4 py-2 text-[14px] leading-relaxed"
                        style={
                          mine
                            ? { background: "#27e8a7", color: "#04130d" }
                            : { background: "#17171c", color: "var(--fg)" }
                        }
                      >
                        {m.content}
                      </div>
                    )}
                    <span className="mt-1 flex items-center gap-2 font-mono text-[9px] text-[var(--muted)]">
                      {timeOf(m.sentAt)}
                      <button
                        type="button"
                        onClick={() => removeMessage(m.id)}
                        className="hidden hover:text-[#ff5e3a] group-hover:inline"
                      >
                        삭제
                      </button>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 작성 */}
          <div className="border-t border-[var(--line)] px-6 py-4">
            <div className="mb-3 flex flex-wrap gap-2">
              {room.participantPersonaIds.length === 0 && (
                <span className="font-mono text-[10px] text-[var(--muted)]">
                  '참여자 · 설정'에서 페르소나를 추가하세요
                </span>
              )}
              {room.participantPersonaIds.map((pid) => {
                const p = personaBy(pid);
                const active = sender === pid;
                return (
                  <button
                    key={pid}
                    type="button"
                    onClick={() => setSender(pid)}
                    className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[11px] transition-colors ${
                      active
                        ? "border-transparent text-black"
                        : "border-[var(--line)] text-[var(--muted)]"
                    }`}
                    style={active ? { background: p?.color } : undefined}
                  >
                    <Avatar persona={p} size={16} />
                    {p?.name}
                    {pid === room.selfPersonaId && (
                      <span className="opacity-60">(나)</span>
                    )}
                  </button>
                );
              })}
            </div>
            {pending && (
              <div className="mb-3 inline-flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-1.5">
                {pending.type.startsWith("video/") ? (
                  // biome-ignore lint/a11y/useMediaCaption: preview of staged clip
                  <video
                    src={pending.url}
                    className="h-12 w-12 rounded-lg object-cover"
                  />
                ) : (
                  <img
                    src={pending.url}
                    alt=""
                    className="h-12 w-12 rounded-lg object-cover"
                  />
                )}
                <span className="font-mono text-[10px] text-[var(--muted)]">
                  첨부됨
                </span>
                <button
                  type="button"
                  onClick={() => {
                    URL.revokeObjectURL(pending.url);
                    setPending(null);
                  }}
                  className="px-1.5 font-mono text-[12px] text-[var(--muted)] hover:text-[#ff5e3a]"
                >
                  ✕
                </button>
              </div>
            )}
            <div className="flex items-end gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/*,video/*"
                hidden
                onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={sender == null || uploading}
                title="사진·동영상 첨부"
                className="rounded-xl border border-[var(--line)] bg-[var(--bg-2)] px-3 py-2.5 text-sm text-[var(--muted)] hover:text-[var(--fg)] disabled:opacity-30"
              >
                {uploading ? "…" : "+"}
              </button>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                rows={1}
                placeholder={
                  sender != null
                    ? "대사 입력 (Enter 전송, Shift+Enter 줄바꿈)"
                    : "보낸 사람을 먼저 고르세요"
                }
                disabled={sender == null}
                className="max-h-32 flex-1 resize-none rounded-xl border border-[var(--line)] bg-[var(--bg-2)] px-4 py-2.5 text-sm outline-none placeholder:text-[var(--muted)] focus:border-[var(--muted)]"
              />
              <button
                type="button"
                onClick={send}
                disabled={sender == null || (!draft.trim() && !pending)}
                className="rounded-xl bg-[var(--fg)] px-4 py-2.5 font-mono text-xs text-black disabled:opacity-30"
              >
                전송
              </button>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

function PersonaManager({
  personas,
  onAdd,
  onDelete,
}: {
  personas: Persona[];
  onAdd: (name: string) => void;
  onDelete: (id: number) => void;
}) {
  const [name, setName] = useState("");
  return (
    <div className="border-b border-[var(--line)] px-4 pb-3 pt-1">
      <div className="pb-2 font-mono text-[10px] tracking-[0.3em] text-[var(--muted)]">
        PERSONAS
      </div>
      <div className="flex flex-wrap gap-1.5">
        {personas.map((p) => (
          <span
            key={p.id}
            className="group flex items-center gap-1.5 rounded-full border border-[var(--line)] py-0.5 pl-0.5 pr-2 text-[11px]"
          >
            <Avatar persona={p} size={18} />
            {p.name}
            <button
              type="button"
              onClick={() => onDelete(p.id)}
              className="hidden text-[var(--muted)] group-hover:inline hover:text-[#ff5e3a]"
            >
              ✕
            </button>
          </span>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onAdd(name);
          setName("");
        }}
        className="mt-2 flex gap-1"
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="새 페르소나"
          className="flex-1 rounded-md border border-[var(--line)] bg-transparent px-2 py-1 text-[12px] outline-none placeholder:text-[var(--muted)]"
        />
        <button
          type="submit"
          className="rounded-md bg-white/10 px-2 font-mono text-xs hover:bg-white/20"
        >
          +
        </button>
      </form>
    </div>
  );
}

function RoomSettings({
  room,
  personas,
  onPatch,
  onClose,
}: {
  room: Room;
  personas: Persona[];
  onPatch: (patch: Partial<Room>) => void;
  onClose: () => void;
}) {
  const toggle = (id: number) => {
    const set = new Set(room.participantPersonaIds);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    const ids = [...set];
    onPatch({
      participantPersonaIds: ids,
      selfPersonaId: ids.includes(room.selfPersonaId ?? -1)
        ? room.selfPersonaId
        : null,
    });
  };
  return (
    <div className="absolute right-6 top-16 z-20 w-72 rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-4 shadow-2xl">
      <div className="flex items-center justify-between pb-2">
        <span className="font-mono text-[10px] tracking-[0.3em] text-[var(--muted)]">
          참여자
        </span>
        <button
          type="button"
          onClick={onClose}
          className="font-mono text-xs text-[var(--muted)]"
        >
          ✕
        </button>
      </div>
      {personas.length === 0 && (
        <p className="font-mono text-[11px] text-[var(--muted)]">
          왼쪽에서 페르소나를 먼저 만드세요
        </p>
      )}
      <div className="space-y-1">
        {personas.map((p) => {
          const inRoom = room.participantPersonaIds.includes(p.id);
          const isSelf = room.selfPersonaId === p.id;
          return (
            <div
              key={p.id}
              className="flex items-center gap-2 rounded-lg px-1 py-1 hover:bg-white/5"
            >
              <button
                type="button"
                onClick={() => toggle(p.id)}
                className="flex flex-1 items-center gap-2"
              >
                <input
                  type="checkbox"
                  checked={inRoom}
                  readOnly
                  className="accent-[#27e8a7]"
                />
                <Avatar persona={p} size={20} />
                <span className="text-[13px]">{p.name}</span>
              </button>
              {inRoom && (
                <button
                  type="button"
                  onClick={() =>
                    onPatch({ selfPersonaId: isSelf ? null : p.id })
                  }
                  className={`rounded-full px-2 py-0.5 font-mono text-[9px] ${
                    isSelf
                      ? "bg-[#27e8a7] text-black"
                      : "border border-[var(--line)] text-[var(--muted)]"
                  }`}
                >
                  나
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
