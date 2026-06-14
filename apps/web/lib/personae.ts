const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
const TOKEN_KEY = "personae_token";

export const getToken = (): string | null =>
  typeof window === "undefined" ? null : localStorage.getItem(TOKEN_KEY);
export const setToken = (t: string) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

/** DataGSM 로그인 시작 (백엔드가 authorize 로 리다이렉트) */
export const loginUrl = () => `${BASE}/api/auth/datagsm/start`;

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
  selfPersonaId: number | null;
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
  replyToId: number | null;
  replyToName: string | null;
  replyToText: string | null;
  sentAt: string;
};

class AuthError extends Error {}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
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
