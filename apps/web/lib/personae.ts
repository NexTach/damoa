const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
const TOKEN_KEY = "personae_token";

// Stable per-tab id so the realtime stream can skip this device's own changes.
export const CLIENT_ID =
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : String(Math.random());

export const getToken = (): string | null =>
  typeof window === "undefined" ? null : localStorage.getItem(TOKEN_KEY);
export const setToken = (t: string) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

/** DataGSM 로그인 시작 (백엔드가 authorize 로 리다이렉트) */
export const loginUrl = () => `${BASE}/api/auth/datagsm/start`;

/** SSE 실시간 스트림 URL (EventSource는 헤더 불가 → 토큰을 쿼리로). */
export const eventsUrl = () =>
  `${BASE}/api/personae/events?token=${encodeURIComponent(getToken() ?? "")}`;

export type Me = { id: number; name: string; email: string };
export type Persona = {
  id: number;
  name: string;
  color: string;
  avatarUrl: string | null;
  bio: string | null;
};
export type Room = {
  id: number;
  title: string;
  participantPersonaIds: number[];
  updatedAt: string;
};
export type Message = {
  id: number;
  personaId: number;
  content: string;
  attachmentUrl: string | null;
  attachmentType: string | null;
  attachmentName: string | null;
  attachmentExpired: boolean;
  pinned: boolean;
  replyToId: number | null;
  replyToName: string | null;
  replyToText: string | null;
  sentAt: string;
};

/** Classifies a message's attachment (by mime type, or expiry) for UI labels. */
export type AttachmentKind =
  | "expired"
  | "image"
  | "video"
  | "audio"
  | "file"
  | "none";
export const attachmentKind = (m: Message): AttachmentKind =>
  m.attachmentExpired
    ? "expired"
    : m.attachmentType?.startsWith("image/")
      ? "image"
      : m.attachmentType?.startsWith("video/")
        ? "video"
        : m.attachmentType?.startsWith("audio/")
          ? "audio"
          : m.attachmentUrl
            ? "file"
            : "none";

class AuthError extends Error {}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-Client-Id": CLIENT_ID,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
  if (res.status === 401 || res.status === 403) {
    throw new AuthError("unauthorized");
  }
  if (!res.ok) throw new Error(`API ${res.status}`);
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

const tm = <T>(path: string, init?: RequestInit) =>
  req<T>(`/api/personae${path}`, init);

export const isAuthError = (e: unknown) => e instanceof AuthError;

// ── Client-side encryption (AES-GCM). Server stores ciphertext; key per user. ──
const ENC_PREFIX = "enc:v1:";
let keyPromise: Promise<CryptoKey> | null = null;

const b64encode = (buf: ArrayBuffer) =>
  btoa(String.fromCharCode(...new Uint8Array(buf)));
const b64decode = (s: string) =>
  Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

const getKey = (): Promise<CryptoKey> => {
  if (!keyPromise) {
    keyPromise = (async () => {
      const { key } = await tm<{ key: string }>("/key");
      return crypto.subtle.importKey("raw", b64decode(key), "AES-GCM", false, [
        "encrypt",
        "decrypt",
      ]);
    })().catch((e) => {
      keyPromise = null; // allow retry
      throw e;
    });
  }
  return keyPromise;
};

/** Encrypts text → "enc:v1:<iv>:<ct>". Empty stays empty. */
export const encryptText = async (plain: string): Promise<string> => {
  if (!plain) return plain;
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(plain),
  );
  return `${ENC_PREFIX}${b64encode(iv.buffer)}:${b64encode(ct)}`;
};

/** Decrypts an "enc:v1:" token; legacy plaintext is returned as-is. */
export const decryptText = async (token: string | null): Promise<string> => {
  if (!token) return token ?? "";
  if (!token.startsWith(ENC_PREFIX)) return token; // legacy plaintext
  try {
    const [, , ivB64, ctB64] = token.split(":");
    const key = await getKey();
    const pt = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: b64decode(ivB64) },
      key,
      b64decode(ctB64),
    );
    return new TextDecoder().decode(pt);
  } catch {
    return "🔒"; // undecryptable
  }
};

/** Decrypts content + reply snapshot of a message in place. */
export const decryptMessage = async (m: Message): Promise<Message> => ({
  ...m,
  content: await decryptText(m.content),
  replyToText: m.replyToText ? await decryptText(m.replyToText) : m.replyToText,
});

export const hydrateMessages = (msgs: Message[]): Promise<Message[]> =>
  Promise.all(msgs.map(decryptMessage));

/** Public URL for a stored object key (used for persona avatars). */
export const fileUrl = (key: string) => `${BASE}/api/files/${key}`;

export type OgPreview = {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
};
export const fetchOg = (url: string) =>
  tm<OgPreview>(`/og?url=${encodeURIComponent(url)}`);

export const fetchMe = () => req<Me>("/api/auth/me");

export const listPersonas = () => tm<Persona[]>("/personas");
export const createPersona = (body: Partial<Persona>) =>
  tm<Persona>("/personas", { method: "POST", body: JSON.stringify(body) });
export const updatePersona = (id: number, body: Partial<Persona>) =>
  tm<Persona>(`/personas/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
export const deletePersona = (id: number) =>
  tm<void>(`/personas/${id}`, { method: "DELETE" });

export const listRooms = () => tm<Room[]>("/rooms");
export const createRoom = (body: Partial<Room>) =>
  tm<Room>("/rooms", { method: "POST", body: JSON.stringify(body) });
export const updateRoom = (id: number, body: Partial<Room>) =>
  tm<Room>(`/rooms/${id}`, { method: "PATCH", body: JSON.stringify(body) });
export const deleteRoom = (id: number) =>
  tm<void>(`/rooms/${id}`, { method: "DELETE" });

export type MessagePage = {
  messages: Message[];
  hasMore: boolean;
  nextCursor: string | null;
};
export const listMessages = (
  roomId: number,
  opts?: { limit?: number; before?: string; at?: number },
) => {
  const qs = new URLSearchParams();
  if (opts?.limit) qs.set("limit", String(opts.limit));
  if (opts?.before) qs.set("before", opts.before);
  if (opts?.at != null) qs.set("at", String(opts.at));
  const q = qs.toString();
  return tm<MessagePage>(`/rooms/${roomId}/messages${q ? `?${q}` : ""}`);
};

export type SearchResult = {
  messages: Message[];
  total: number;
  hasMore: boolean;
  nextCursor: string | null;
};
export type MessageFilter = {
  q?: string;
  personaId?: number;
  after?: number; // epoch millis
  before?: number; // epoch millis
  cursor?: string;
};
export const searchMessages = (roomId: number, f: MessageFilter) => {
  const qs = new URLSearchParams();
  if (f.q?.trim()) qs.set("q", f.q.trim());
  if (f.personaId != null) qs.set("personaId", String(f.personaId));
  if (f.after != null) qs.set("after", String(f.after));
  if (f.before != null) qs.set("before", String(f.before));
  if (f.cursor) qs.set("cursor", f.cursor);
  return tm<SearchResult>(`/rooms/${roomId}/messages/search?${qs.toString()}`);
};

export type PersonaStat = {
  personaId: number;
  name: string;
  color: string;
  count: number;
};
export type DayStat = { date: string; count: number };
export type RoomStats = {
  total: number;
  perPersona: PersonaStat[];
  perDay: DayStat[];
};
export const fetchRoomStats = (roomId: number) =>
  tm<RoomStats>(`/rooms/${roomId}/stats`);
export const createMessage = (
  roomId: number,
  body: {
    personaId: number;
    content: string;
    attachmentKey?: string;
    attachmentType?: string;
    attachmentName?: string;
    replyToId?: number;
    replyToName?: string;
    replyToText?: string;
    sentAt?: string;
  },
) =>
  tm<Message>(`/rooms/${roomId}/messages`, {
    method: "POST",
    body: JSON.stringify(body),
  });

export const updateMessage = (
  roomId: number,
  messageId: number,
  body: { personaId: number; content: string; sentAt?: string },
) =>
  tm<Message>(`/rooms/${roomId}/messages/${messageId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });

export class FileTooLargeError extends Error {}

/** Uploads any file to the storage and returns its key + mime type + name. */
export const uploadAttachment = async (
  file: File,
  signal?: AbortSignal,
): Promise<{ key: string; type: string; name: string | null }> => {
  const token = getToken();
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BASE}/api/personae/attachments`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
    signal,
  });
  if (res.status === 401 || res.status === 403)
    throw new AuthError("unauthorized");
  if (res.status === 413) throw new FileTooLargeError("file too large");
  if (!res.ok) throw new Error(`upload ${res.status}`);
  return res.json();
};
export const deleteMessage = (roomId: number, messageId: number) =>
  tm<void>(`/rooms/${roomId}/messages/${messageId}`, { method: "DELETE" });

/** Highlighted (pinned) messages of a room — their attachments never expire. */
export const listPinned = (roomId: number) =>
  tm<Message[]>(`/rooms/${roomId}/messages/pinned`);

/** Long "letter" messages of a room (server decrypts + filters), newest first. */
export const listLetters = (roomId: number) =>
  tm<Message[]>(`/rooms/${roomId}/messages/letters`);

/**
 * Download URL for the server-generated training JSON (latest `limit` messages,
 * decrypted server-side). Token is in the query since a download navigation
 * can't set an Authorization header.
 */
export const exportTrainingUrl = (
  roomId: number,
  assistantId: number,
  limit = 1000,
) =>
  `${BASE}/api/personae/rooms/${roomId}/messages/export?assistant=${assistantId}&limit=${limit}&token=${encodeURIComponent(getToken() ?? "")}`;

/** Toggles a message's highlight (pin) state. */
export const pinMessage = (
  roomId: number,
  messageId: number,
  pinned: boolean,
) =>
  tm<Message>(`/rooms/${roomId}/messages/${messageId}/pin`, {
    method: "PATCH",
    body: JSON.stringify({ pinned }),
  });

/** Shifts the given messages' times by deltaMs (relative gaps preserved). */
export const shiftMessages = (
  roomId: number,
  ids: number[],
  deltaMs: number,
) =>
  tm<void>(`/rooms/${roomId}/messages/shift`, {
    method: "POST",
    body: JSON.stringify({ ids, deltaMs }),
  });

/** Whether server-side AI generation is configured (OpenAI key present). */
export const aiStatus = () => tm<{ enabled: boolean }>("/ai");

/** Generates and stores an AI reply spoken by the persona, returns it. */
export const generateReply = (roomId: number, personaId: number) =>
  tm<Message>(`/rooms/${roomId}/messages/generate`, {
    method: "POST",
    body: JSON.stringify({ personaId }),
  });
