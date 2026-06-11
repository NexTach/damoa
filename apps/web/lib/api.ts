/**
 * Spring API 호출용 헬퍼.
 * Next 는 Vercel, Spring 은 온프레미스로 분리 배포되므로 절대 URL(base) 을 env 로 주입한다.
 * 서버 컴포넌트에서는 API_BASE_URL, 클라이언트에서는 NEXT_PUBLIC_API_BASE_URL 을 사용.
 */
const BASE_URL =
  process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    throw new Error(`API ${res.status}: ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}
