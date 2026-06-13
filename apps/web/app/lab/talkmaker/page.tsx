"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { DialogProvider, useDialog } from "@/components/dialog";
import {
  IconArrowLeft,
  IconCamera,
  IconDownload,
  IconFile,
  IconPaperclip,
  IconPencil,
  IconPlus,
  IconSend,
  IconSettings,
  IconTrash,
  IconX,
} from "@/components/icons";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  clearToken,
  createMessage,
  createPersona,
  createRoom,
  deleteMessage,
  deletePersona,
  deleteRoom,
  fetchMe,
  fetchOg,
  FileTooLargeError,
  fileUrl,
  getToken,
  isAuthError,
  listMessages,
  listPersonas,
  listRooms,
  loginUrl,
  type Me,
  type Message,
  type OgPreview,
  type Persona,
  type Room,
  setToken,
  updateMessage,
  updatePersona,
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
  new Date(iso).toLocaleString("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

// Break a message group when the same persona pauses longer than this.
const GROUP_GAP = 5 * 60 * 1000;
const gapMs = (a: string, b: string) =>
  new Date(b).getTime() - new Date(a).getTime();

/** ISO(UTC) → `<input type="datetime-local">` 값(로컬 타임존 기준). */
const toLocalInput = (iso: string) => {
  const d = new Date(iso);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

const URL_RE = /(https?:\/\/[^\s]+)/gi;
const firstUrl = (s: string) => s.match(/(https?:\/\/[^\s]+)/i)?.[0] ?? null;

// Renders message text with clickable links.
function renderContent(text: string) {
  return text.split(URL_RE).map((part, i) =>
    /^https?:\/\//i.test(part) ? (
      <a
        // biome-ignore lint/suspicious/noArrayIndexKey: split is stable per render
        key={i}
        href={part}
        target="_blank"
        rel="noreferrer noopener"
        className="underline underline-offset-2 opacity-90 hover:opacity-100"
      >
        {part}
      </a>
    ) : (
      // biome-ignore lint/suspicious/noArrayIndexKey: split is stable per render
      <span key={i}>{part}</span>
    ),
  );
}

const ogCache = new Map<string, OgPreview | null>();

function LinkPreview({ url }: { url: string }) {
  const [og, setOg] = useState<OgPreview | null | undefined>(() =>
    ogCache.get(url),
  );
  useEffect(() => {
    if (ogCache.has(url)) {
      setOg(ogCache.get(url));
      return;
    }
    let alive = true;
    fetchOg(url)
      .then((d) => {
        ogCache.set(url, d);
        if (alive) setOg(d);
      })
      .catch(() => {
        ogCache.set(url, null);
        if (alive) setOg(null);
      });
    return () => {
      alive = false;
    };
  }, [url]);
  if (!og || (!og.title && !og.image && !og.description)) return null;
  return (
    <a
      href={og.url}
      target="_blank"
      rel="noreferrer noopener"
      className="mt-1 block w-64 max-w-full overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--bg-2)] text-left transition-colors hover:border-[var(--muted)]"
    >
      {og.image && (
        <img src={og.image} alt="" className="h-32 w-full object-cover" />
      )}
      <div className="p-3">
        {og.siteName && (
          <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--muted)]">
            {og.siteName}
          </div>
        )}
        {og.title && (
          <div className="mt-1 line-clamp-2 text-[13px] font-medium text-[var(--fg)]">
            {og.title}
          </div>
        )}
        {og.description && (
          <div className="mt-1 line-clamp-2 text-[11px] text-[var(--muted)]">
            {og.description}
          </div>
        )}
      </div>
    </a>
  );
}

// Renders a sent attachment by mime type: image / video / audio / generic file.
function AttachmentView({
  url,
  type,
  name,
}: {
  url: string;
  type: string | null;
  name: string | null;
}) {
  if (type?.startsWith("image/")) {
    return (
      <img
        src={url}
        alt={name ?? ""}
        className="mb-1 max-h-72 max-w-full rounded-2xl object-cover"
      />
    );
  }
  if (type?.startsWith("video/")) {
    return (
      // biome-ignore lint/a11y/useMediaCaption: user-authored fake chat clip
      <video
        src={url}
        controls
        className="mb-1 max-h-72 max-w-full rounded-2xl"
      />
    );
  }
  if (type?.startsWith("audio/")) {
    return <audio src={url} controls className="mb-1 max-w-full" />;
  }
  return (
    <a
      href={url}
      download={name ?? true}
      target="_blank"
      rel="noreferrer noopener"
      className="mb-1 flex max-w-[15rem] items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--bg-2)] px-3 py-2.5 text-left transition-colors hover:border-[var(--muted)]"
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--surface)] text-[var(--muted)]">
        <IconFile size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] text-[var(--fg)]">
          {name ?? "파일"}
        </span>
        <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-[var(--muted)]">
          {(type?.split("/")[1] ?? "file").slice(0, 12)}
        </span>
      </span>
      <span className="shrink-0 text-[var(--muted)]">
        <IconDownload size={16} />
      </span>
    </a>
  );
}

function Avatar({ persona, size = 32 }: { persona?: Persona; size?: number }) {
  const color = persona?.color ?? "#555";
  if (persona?.avatarUrl) {
    return (
      <img
        src={persona.avatarUrl}
        alt={persona.name}
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
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
  return (
    <DialogProvider>
      <TalkmakerInner />
    </DialogProvider>
  );
}

function TalkmakerInner() {
  const dialog = useDialog();
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
    name: string | null;
    url: string;
  } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [editing, setEditing] = useState<{
    id: number;
    personaId: number;
    content: string;
    at: string;
  } | null>(null);
  const [capture, setCapture] = useState(false);
  const [personaModal, setPersonaModal] = useState(false);
  const personaBy = (id: number) => personas.find((p) => p.id === id);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const busy = sending || uploading;

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
  const setPersonaAvatar = async (p: Persona, file: File) => {
    const { key } = await uploadAttachment(file);
    await editPersona(p, { avatarUrl: fileUrl(key) });
  };
  const editPersona = async (
    p: Persona,
    patch: Partial<Pick<Persona, "name" | "color" | "avatarUrl" | "bio">>,
  ) => {
    const updated = await updatePersona(p.id, {
      name: patch.name ?? p.name,
      color: patch.color ?? p.color,
      avatarUrl: patch.avatarUrl !== undefined ? patch.avatarUrl : p.avatarUrl,
      bio: patch.bio !== undefined ? patch.bio : p.bio,
    });
    setPersonas((cur) => cur.map((x) => (x.id === updated.id ? updated : x)));
  };

  const newRoom = async () => {
    const title = (
      await dialog.prompt("새 채팅방", { placeholder: "채팅방 이름" })
    )?.trim();
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
    const ok = await dialog.confirm(`'${r.title}' 채팅방을 삭제할까요?`, {
      title: "채팅방 삭제",
      confirmText: "삭제",
      danger: true,
    });
    if (!ok) return;
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
    if (!file || uploading) return;
    if (pending) URL.revokeObjectURL(pending.url);
    setUploading(true);
    try {
      const { key, type, name } = await uploadAttachment(file);
      setPending({
        key,
        type,
        name: name ?? file.name,
        url: URL.createObjectURL(file),
      });
    } catch (e) {
      if (isAuthError(e)) return;
      dialog.alert(
        e instanceof FileTooLargeError
          ? "파일이 너무 커요. 더 작은 파일로 보내주세요."
          : "파일 업로드에 실패했어요.",
        "첨부 실패",
      );
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const send = async () => {
    if (!room || sender == null || sending) return;
    if (!draft.trim() && !pending) return;
    setSending(true);
    try {
      const msg = await createMessage(room.id, {
        personaId: sender,
        content: draft.trim(),
        attachmentKey: pending?.key,
        attachmentType: pending?.type,
        attachmentName: pending?.name ?? undefined,
      });
      setMessages((cur) => [...cur, msg]);
      setDraft("");
      if (pending) URL.revokeObjectURL(pending.url);
      setPending(null);
      refreshRooms();
    } finally {
      setSending(false);
    }
  };
  const removeMessage = async (id: number) => {
    if (!room) return;
    const ok = await dialog.confirm("이 메시지를 삭제할까요?", {
      title: "메시지 삭제",
      confirmText: "삭제",
      danger: true,
    });
    if (!ok) return;
    await deleteMessage(room.id, id);
    setMessages((cur) => cur.filter((m) => m.id !== id));
  };

  const startEdit = (m: Message) =>
    setEditing({
      id: m.id,
      personaId: m.personaId,
      content: m.content,
      at: toLocalInput(m.sentAt),
    });

  const saveEdit = async () => {
    if (!room || !editing || sending) return;
    setSending(true);
    try {
      const msg = await updateMessage(room.id, editing.id, {
        personaId: editing.personaId,
        content: editing.content,
        sentAt: new Date(editing.at).toISOString(),
      });
      setMessages((cur) =>
        cur
          .map((m) => (m.id === msg.id ? msg : m))
          .sort((a, b) => a.sentAt.localeCompare(b.sentAt) || a.id - b.id),
      );
      setEditing(null);
      refreshRooms();
    } finally {
      setSending(false);
    }
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
      <main className="grid min-h-dvh place-items-center bg-[var(--bg)] px-6 py-10">
        <div className="w-full max-w-sm text-center">
          <div
            className="font-mono text-[11px] tracking-[0.3em] sm:text-xs"
            style={{ color: "#27e8a7" }}
          >
            05 — TALKMAKER
          </div>
          <h1 className="font-display mt-3 text-[clamp(2.5rem,14vw,3.5rem)] leading-[0.95]">
            Talkmaker
          </h1>
          <p className="mx-auto mt-4 max-w-xs font-mono text-[12px] leading-relaxed text-[var(--muted)] sm:text-[13px]">
            페르소나를 만들고, 직접 대사를 이어 붙여 연출된 대화를 만드세요.
            계정마다 따로 보관됩니다.
          </p>
          <a
            href={loginUrl()}
            className="mt-8 inline-flex w-full items-center justify-center gap-3 rounded-full bg-[var(--fg)] px-6 py-3.5 font-mono text-xs tracking-[0.2em] text-[var(--bg)] transition-transform hover:scale-[1.03] sm:w-auto"
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
      {/* 사이드바 — 모바일에선 방이 열리면 숨기고 채팅을 전체폭으로 */}
      <aside
        className={`${room ? "hidden md:flex" : "flex"} w-full shrink-0 flex-col border-r border-[var(--line)] bg-[var(--bg-2)] md:w-72`}
      >
        <div className="flex items-center justify-between p-4">
          <div>
            <div className="font-display text-lg leading-none">Talkmaker</div>
            <div className="mt-1 font-mono text-[9px] tracking-[0.3em] text-[var(--muted)]">
              {me?.name ?? "…"}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              onClick={logout}
              className="font-mono text-[9px] tracking-[0.2em] text-[var(--muted)] hover:text-[var(--fg)]"
            >
              LOGOUT
            </button>
          </div>
        </div>

        {/* 페르소나 */}
        <PersonaManager
          personas={personas}
          onAdd={addPersona}
          onDelete={removePersona}
          onAvatar={setPersonaAvatar}
          onManage={() => setPersonaModal(true)}
        />

        {/* 채팅방 */}
        <div className="flex items-center justify-between px-4 pb-2 pt-3">
          <span className="font-mono text-[10px] tracking-[0.3em] text-[var(--muted)]">
            CHATS
          </span>
          <button
            type="button"
            onClick={newRoom}
            aria-label="새 채팅방"
            className="grid h-6 w-6 place-items-center rounded-full text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--fg)]"
          >
            <IconPlus size={14} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-3">
          {rooms.map((r) => (
            <div
              key={r.id}
              className={`group flex w-full items-center gap-2 rounded-lg px-3 py-2 transition-colors ${
                room?.id === r.id
                  ? "bg-[var(--hover-strong)]"
                  : "hover:bg-[var(--hover)]"
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
                aria-label="채팅방 삭제"
                className="hidden shrink-0 text-[var(--muted)] hover:text-[#ff5e3a] group-hover:block"
              >
                <IconTrash size={13} />
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
        <div className="hidden flex-1 place-items-center font-mono text-xs tracking-[0.3em] text-[var(--muted)] md:grid">
          채팅방을 선택하거나 + 로 만드세요
        </div>
      ) : (
        <section
          className="relative flex flex-1 flex-col"
          onDragEnter={(e) => {
            if (e.dataTransfer.types.includes("Files")) {
              e.preventDefault();
              setDragOver(true);
            }
          }}
          onDragOver={(e) => {
            if (e.dataTransfer.types.includes("Files")) e.preventDefault();
          }}
          onDragLeave={(e) => {
            if (e.currentTarget === e.target) setDragOver(false);
          }}
          onDrop={(e) => {
            if (!e.dataTransfer.files.length) return;
            e.preventDefault();
            setDragOver(false);
            pickFile(e.dataTransfer.files[0]);
          }}
        >
          {dragOver && (
            <div className="pointer-events-none absolute inset-0 z-30 m-3 grid place-items-center rounded-2xl border-2 border-dashed border-[var(--accent)] bg-[var(--bg)]/80 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-2 font-mono text-xs tracking-[0.2em] text-[var(--fg)]">
                <IconPaperclip size={28} />
                여기에 놓아 첨부
              </div>
            </div>
          )}
          <header className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-4 md:px-6">
            <div className="flex min-w-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setRoom(null)}
                aria-label="목록으로"
                className="shrink-0 text-[var(--muted)] hover:text-[var(--fg)] md:hidden"
              >
                <IconArrowLeft size={20} />
              </button>
              <div className="truncate font-display text-xl">{room.title}</div>
            </div>
            <div className="flex shrink-0 items-center gap-1 text-[var(--muted)]">
              <button
                type="button"
                onClick={() => {
                  setCapture((v) => !v);
                  setSettingsOpen(false);
                  setEditing(null);
                }}
                aria-label={capture ? "캡처 모드 종료" : "캡처 모드"}
                title={capture ? "캡처 모드 종료" : "캡처 모드"}
                className={`grid h-9 w-9 place-items-center rounded-full hover:bg-[var(--hover)] hover:text-[var(--fg)] ${capture ? "bg-[var(--hover-strong)] text-[var(--accent)]" : ""}`}
              >
                {capture ? <IconX size={18} /> : <IconCamera size={18} />}
              </button>
              {!capture && (
                <button
                  type="button"
                  onClick={() => setSettingsOpen((v) => !v)}
                  aria-label="참여자 · 설정"
                  title="참여자 · 설정"
                  className="grid h-9 w-9 place-items-center rounded-full hover:bg-[var(--hover)] hover:text-[var(--fg)]"
                >
                  <IconSettings size={18} />
                </button>
              )}
            </div>
          </header>

          {settingsOpen && !capture && (
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
            className="flex-1 overflow-y-auto px-4 py-5 md:px-6 md:py-6"
          >
            {messages.length === 0 && (
              <div className="grid h-full place-items-center font-mono text-[11px] tracking-[0.2em] text-[var(--muted)]">
                아래에서 보낸 사람을 고르고 대사를 입력하세요
              </div>
            )}
            {messages.map((m, i) => {
              const p = personaBy(m.personaId);
              const mine = m.personaId === room.selfPersonaId;
              const prev = messages[i - 1];
              const next = messages[i + 1];
              // Group consecutive messages from the same persona within GROUP_GAP.
              const grouped =
                !!prev &&
                prev.personaId === m.personaId &&
                gapMs(prev.sentAt, m.sentAt) < GROUP_GAP;
              const sameAsNext =
                !!next &&
                next.personaId === m.personaId &&
                gapMs(m.sentAt, next.sentAt) < GROUP_GAP;
              // Show the timestamp only on the last bubble of a group.
              const showTime = !sameAsNext;
              const url = m.content ? firstUrl(m.content) : null;
              return (
                <div
                  key={m.id}
                  className={`group relative flex items-start gap-2 ${grouped ? "mt-0.5" : "mt-4"} ${mine ? "flex-row-reverse" : ""}`}
                >
                  {!mine &&
                    (grouped ? (
                      <div className="w-7 shrink-0" />
                    ) : (
                      <Avatar persona={p} size={28} />
                    ))}
                  <div
                    className={`flex max-w-[68%] flex-col ${mine ? "items-end text-right" : "items-start"}`}
                  >
                    {!mine && !grouped && (
                      <span className="mb-1 font-mono text-[10px] text-[var(--muted)]">
                        {p?.name}
                      </span>
                    )}
                    {m.attachmentExpired && (
                      <div className="mb-1 flex items-center gap-2 rounded-2xl border border-dashed border-[var(--muted)] px-4 py-3 font-mono text-[12px] text-[var(--muted)]">
                        <IconTrash size={13} /> 만료된 파일입니다
                      </div>
                    )}
                    {m.attachmentUrl && (
                      <AttachmentView
                        url={m.attachmentUrl}
                        type={m.attachmentType}
                        name={m.attachmentName}
                      />
                    )}
                    {editing?.id === m.id ? (
                      <div className="flex w-64 max-w-full flex-col gap-2 rounded-2xl border border-[var(--line)] bg-[var(--bg-2)] p-2 text-left">
                        <textarea
                          value={editing.content}
                          onChange={(e) =>
                            setEditing(
                              (s) => s && { ...s, content: e.target.value },
                            )
                          }
                          rows={2}
                          placeholder="내용"
                          className="resize-none rounded-lg border border-[var(--line)] bg-transparent px-2 py-1 text-[13px] outline-none placeholder:text-[var(--muted)]"
                        />
                        <input
                          type="datetime-local"
                          value={editing.at}
                          onChange={(e) =>
                            setEditing((s) => s && { ...s, at: e.target.value })
                          }
                          className="rounded-lg border border-[var(--line)] bg-transparent px-2 py-1 font-mono text-[11px] outline-none"
                        />
                        <div className="flex justify-end gap-1 font-mono text-[10px]">
                          <button
                            type="button"
                            onClick={() => setEditing(null)}
                            disabled={sending}
                            className="px-2 py-1 text-[var(--muted)] hover:text-[var(--fg)] disabled:opacity-40"
                          >
                            취소
                          </button>
                          <button
                            type="button"
                            onClick={saveEdit}
                            disabled={sending}
                            className="rounded-md bg-[var(--fg)] px-3 py-1 text-[var(--bg)] disabled:opacity-40"
                          >
                            {sending ? "저장 중…" : "저장"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {m.content && (
                          <div
                            className="whitespace-pre-wrap break-words rounded-2xl px-4 py-2 text-[14px] leading-relaxed"
                            style={
                              mine
                                ? { background: "#27e8a7", color: "#04130d" }
                                : {
                                    background: "var(--surface)",
                                    color: "var(--fg)",
                                  }
                            }
                          >
                            {renderContent(m.content)}
                          </div>
                        )}
                        {url && <LinkPreview url={url} />}
                        {(showTime || !capture) && (
                          <span
                            className={`mt-1 font-mono text-[9px] text-[var(--muted)] transition-opacity ${
                              showTime
                                ? ""
                                : "opacity-0 group-hover:opacity-100"
                            }`}
                          >
                            {timeOf(m.sentAt)}
                          </span>
                        )}
                        {!capture && (
                          <span
                            className={`absolute top-0 flex gap-1 text-[var(--muted)] opacity-0 transition-opacity group-hover:opacity-100 ${
                              mine ? "left-0" : "right-0"
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => startEdit(m)}
                              aria-label="수정"
                              title="수정"
                              className="grid h-6 w-6 place-items-center rounded-full bg-[var(--bg-2)] hover:text-[var(--fg)]"
                            >
                              <IconPencil size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeMessage(m.id)}
                              aria-label="삭제"
                              title="삭제"
                              className="grid h-6 w-6 place-items-center rounded-full bg-[var(--bg-2)] hover:text-[#ff5e3a]"
                            >
                              <IconTrash size={12} />
                            </button>
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 작성 — 입력창은 유지, 캡처 모드에선 페르소나 선택기만 숨김 */}
          <div className="pb-safe border-t border-[var(--line)] px-4 pt-4 md:px-6 md:pb-4">
            {!capture && (
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
            )}
            {pending && (
              <div className="mb-3 inline-flex max-w-full items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-1.5">
                {pending.type.startsWith("image/") ? (
                  <img
                    src={pending.url}
                    alt=""
                    className="h-12 w-12 shrink-0 rounded-lg object-cover"
                  />
                ) : pending.type.startsWith("video/") ? (
                  // biome-ignore lint/a11y/useMediaCaption: preview of staged clip
                  <video
                    src={pending.url}
                    className="h-12 w-12 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-[var(--surface)] text-[var(--muted)]">
                    <IconFile size={20} />
                  </span>
                )}
                <span className="min-w-0 truncate px-1 font-mono text-[11px] text-[var(--muted)]">
                  {pending.name ?? "첨부됨"}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    URL.revokeObjectURL(pending.url);
                    setPending(null);
                  }}
                  aria-label="첨부 제거"
                  className="grid h-6 w-6 shrink-0 place-items-center text-[var(--muted)] hover:text-[#ff5e3a]"
                >
                  <IconX size={14} />
                </button>
              </div>
            )}
            <div className="flex items-end gap-2">
              <input
                ref={fileRef}
                type="file"
                hidden
                onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={sender == null || busy}
                aria-label="파일 첨부"
                title="사진·동영상·파일 첨부"
                className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-xl border border-[var(--line)] bg-[var(--bg-2)] text-[var(--muted)] hover:text-[var(--fg)] disabled:opacity-30"
              >
                {uploading ? (
                  <span className="animate-pulse">…</span>
                ) : (
                  <IconPaperclip size={18} />
                )}
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
                  sender != null ? "메시지 보내기" : "보낸 사람을 먼저 고르세요"
                }
                disabled={sender == null || busy}
                className="max-h-32 flex-1 resize-none rounded-xl border border-[var(--line)] bg-[var(--bg-2)] px-4 py-2.5 text-sm outline-none transition-opacity placeholder:text-[var(--muted)] focus:border-[var(--muted)] disabled:opacity-50"
              />
              <button
                type="button"
                onClick={send}
                disabled={sender == null || busy || (!draft.trim() && !pending)}
                aria-label="전송"
                title="전송"
                className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-xl bg-[var(--fg)] text-[var(--bg)] transition-opacity disabled:opacity-30"
              >
                {sending ? (
                  <span className="animate-pulse">…</span>
                ) : (
                  <IconSend size={18} />
                )}
              </button>
            </div>
          </div>
        </section>
      )}
      {personaModal && (
        <PersonaModal
          personas={personas}
          onAdd={addPersona}
          onDelete={removePersona}
          onAvatar={setPersonaAvatar}
          onEdit={editPersona}
          onClose={() => setPersonaModal(false)}
        />
      )}
    </main>
  );
}

function PersonaManager({
  personas,
  onAdd,
  onDelete,
  onAvatar,
  onManage,
}: {
  personas: Persona[];
  onAdd: (name: string) => void;
  onDelete: (id: number) => void;
  onAvatar: (p: Persona, file: File) => Promise<void>;
  onManage: () => void;
}) {
  const dialog = useDialog();
  const [name, setName] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const avatarInput = useRef<HTMLInputElement>(null);
  const targetRef = useRef<Persona | null>(null);

  const pickAvatar = (p: Persona) => {
    targetRef.current = p;
    avatarInput.current?.click();
  };
  const onAvatarChange = async (file: File | null) => {
    const p = targetRef.current;
    if (!file || !p) return;
    setBusyId(p.id);
    try {
      await onAvatar(p, file);
    } catch {
      dialog.alert("프로필 사진 변경에 실패했어요.");
    } finally {
      setBusyId(null);
      if (avatarInput.current) avatarInput.current.value = "";
    }
  };

  return (
    <div className="border-b border-[var(--line)] px-4 pb-3 pt-1">
      <div className="flex items-center justify-between pb-2">
        <span className="font-mono text-[10px] tracking-[0.3em] text-[var(--muted)]">
          PERSONAS
        </span>
        <button
          type="button"
          onClick={onManage}
          className="font-mono text-[10px] text-[var(--muted)] hover:text-[var(--fg)]"
        >
          관리
        </button>
      </div>
      <input
        ref={avatarInput}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => onAvatarChange(e.target.files?.[0] ?? null)}
      />
      <div className="flex flex-wrap gap-1.5">
        {personas.map((p) => (
          <span
            key={p.id}
            className="group flex items-center gap-1.5 rounded-full border border-[var(--line)] py-0.5 pl-0.5 pr-2 text-[11px]"
          >
            <button
              type="button"
              onClick={() => pickAvatar(p)}
              title="프로필 사진 변경"
              className="relative shrink-0 rounded-full opacity-100 transition-opacity hover:opacity-80"
            >
              <Avatar persona={p} size={18} />
              {busyId === p.id && (
                <span className="absolute inset-0 grid place-items-center rounded-full bg-black/50 text-[7px] text-white">
                  …
                </span>
              )}
            </button>
            {p.name}
            <button
              type="button"
              onClick={async () => {
                if (
                  await dialog.confirm(`'${p.name}' 페르소나를 삭제할까요?`, {
                    title: "페르소나 삭제",
                    confirmText: "삭제",
                    danger: true,
                  })
                )
                  onDelete(p.id);
              }}
              aria-label="삭제"
              className="hidden text-[var(--muted)] group-hover:block hover:text-[#ff5e3a]"
            >
              <IconX size={12} />
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
          aria-label="페르소나 추가"
          className="grid w-8 shrink-0 place-items-center rounded-md bg-[var(--hover-strong)] hover:bg-[var(--hover)]"
        >
          <IconPlus size={14} />
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
  const [title, setTitle] = useState(room.title);
  const saveTitle = () => {
    const t = title.trim();
    if (t && t !== room.title) onPatch({ title: t });
    else setTitle(room.title);
  };
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
    <div className="fixed inset-0 z-30 md:absolute md:inset-auto md:right-6 md:top-16">
      {/* Mobile backdrop (desktop is a popover, no dimming). */}
      <button
        type="button"
        aria-label="닫기"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 md:hidden"
      />
      <div className="pb-safe sheet-up absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-2xl border border-[var(--line)] bg-[var(--bg-2)] p-4 shadow-2xl md:static md:max-h-none md:w-72 md:rounded-xl">
        <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-[var(--line)] md:hidden" />
        <div className="flex items-center justify-between pb-1">
          <span className="font-mono text-[10px] tracking-[0.3em] text-[var(--muted)]">
            제목
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="text-[var(--muted)] hover:text-[var(--fg)]"
          >
            <IconX size={16} />
          </button>
        </div>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={saveTitle}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
          placeholder="채팅방 제목"
          className="mb-3 w-full rounded-md border border-[var(--line)] bg-transparent px-2 py-1.5 text-[13px] outline-none focus:border-[var(--muted)]"
        />
        <div className="pb-2 font-mono text-[10px] tracking-[0.3em] text-[var(--muted)]">
          참여자
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
                className="flex items-center gap-2 rounded-lg px-1 py-1 hover:bg-[var(--hover)]"
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
    </div>
  );
}

function PersonaModal({
  personas,
  onAdd,
  onDelete,
  onAvatar,
  onEdit,
  onClose,
}: {
  personas: Persona[];
  onAdd: (name: string) => void;
  onDelete: (id: number) => void;
  onAvatar: (p: Persona, file: File) => Promise<void>;
  onEdit: (
    p: Persona,
    patch: Partial<Pick<Persona, "name" | "color" | "avatarUrl" | "bio">>,
  ) => Promise<void>;
  onClose: () => void;
}) {
  const dialog = useDialog();
  const [name, setName] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const avatarInput = useRef<HTMLInputElement>(null);
  const targetRef = useRef<Persona | null>(null);

  const pickAvatar = (p: Persona) => {
    targetRef.current = p;
    avatarInput.current?.click();
  };
  const onAvatarChange = async (file: File | null) => {
    const p = targetRef.current;
    if (!file || !p) return;
    setBusyId(p.id);
    try {
      await onAvatar(p, file);
    } catch {
      dialog.alert("프로필 사진 변경에 실패했어요.");
    } finally {
      setBusyId(null);
      if (avatarInput.current) avatarInput.current.value = "";
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
      // biome-ignore lint/a11y/noStaticElementInteractions: backdrop click to close
      role="presentation"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        // biome-ignore lint/a11y/noStaticElementInteractions: stop backdrop close
        role="presentation"
        className="sheet-up flex max-h-[85vh] w-full max-w-md flex-col rounded-t-2xl border border-[var(--line)] bg-[var(--bg-2)] shadow-2xl sm:max-h-[80vh] sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4">
          <span className="font-display text-lg">페르소나 관리</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="text-[var(--muted)] hover:text-[var(--fg)]"
          >
            <IconX size={18} />
          </button>
        </div>
        <input
          ref={avatarInput}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => onAvatarChange(e.target.files?.[0] ?? null)}
        />
        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {personas.length === 0 && (
            <p className="font-mono text-[12px] text-[var(--muted)]">
              아직 페르소나가 없어요. 아래에서 추가하세요.
            </p>
          )}
          {personas.map((p) => (
            <div
              key={p.id}
              className="flex items-start gap-3 rounded-xl border border-[var(--line)] p-3"
            >
              <button
                type="button"
                onClick={() => pickAvatar(p)}
                title="프로필 사진 변경"
                className="relative shrink-0 rounded-full transition-opacity hover:opacity-80"
              >
                <Avatar persona={p} size={44} />
                <span className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-[var(--fg)] text-[var(--bg)]">
                  <IconPencil size={10} />
                </span>
                {busyId === p.id && (
                  <span className="absolute inset-0 grid place-items-center rounded-full bg-black/50 text-[9px] text-white">
                    …
                  </span>
                )}
              </button>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    defaultValue={p.color}
                    onChange={(e) => onEdit(p, { color: e.target.value })}
                    title="색상"
                    className="h-7 w-7 shrink-0 cursor-pointer rounded border border-[var(--line)] bg-transparent"
                  />
                  <input
                    defaultValue={p.name}
                    onBlur={(e) => {
                      const v = e.target.value.trim();
                      if (v && v !== p.name) onEdit(p, { name: v });
                    }}
                    placeholder="이름"
                    className="min-w-0 flex-1 rounded-md border border-[var(--line)] bg-transparent px-2 py-1 text-[13px] outline-none focus:border-[var(--muted)]"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      if (
                        await dialog.confirm(
                          `'${p.name}' 페르소나를 삭제할까요?`,
                          {
                            title: "페르소나 삭제",
                            confirmText: "삭제",
                            danger: true,
                          },
                        )
                      )
                        onDelete(p.id);
                    }}
                    aria-label="삭제"
                    className="grid h-7 w-7 shrink-0 place-items-center text-[var(--muted)] hover:text-[#ff5e3a]"
                  >
                    <IconTrash size={14} />
                  </button>
                </div>
                <input
                  defaultValue={p.bio ?? ""}
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    if (v !== (p.bio ?? "")) onEdit(p, { bio: v || null });
                  }}
                  placeholder="한 줄 소개 (선택)"
                  className="w-full rounded-md border border-[var(--line)] bg-transparent px-2 py-1 text-[12px] text-[var(--muted)] outline-none focus:border-[var(--muted)]"
                />
              </div>
            </div>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            onAdd(name);
            setName("");
          }}
          className="pb-safe flex gap-2 border-t border-[var(--line)] px-5 pt-4"
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="새 페르소나 이름"
            className="flex-1 rounded-md border border-[var(--line)] bg-transparent px-3 py-2 text-[13px] outline-none focus:border-[var(--muted)]"
          />
          <button
            type="submit"
            className="rounded-md bg-[var(--fg)] px-4 font-mono text-xs text-[var(--bg)]"
          >
            추가
          </button>
        </form>
      </div>
    </div>
  );
}
