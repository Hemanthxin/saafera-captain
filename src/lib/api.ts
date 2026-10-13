// Thin client for the Saafera driver API (proxied at /captain-api, see next.config.ts).
const BASE = "/captain-api";
const TOKEN_KEY = "saafera-captain:token";

export const getToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};
export const setToken = (t: string | null) => {
  try {
    if (t) localStorage.setItem(TOKEN_KEY, t);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {}
};

export type ApiResult<T> = ({ ok: true } & T) | { ok: false; error: string; status: number };

export async function api<T = Record<string, never>>(path: string, init: { method?: "GET" | "POST" | "DELETE"; body?: unknown } = {}): Promise<ApiResult<T>> {
  const token = getToken();
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: init.method ?? (init.body ? "POST" : "GET"),
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: init.body ? JSON.stringify(init.body) : undefined,
      cache: "no-store",
    });
    const data = await res.json().catch(() => null);
    if (!data) {
      // The proxy answers with plain text when the Saafera web app is down or unreachable.
      const down = res.status >= 500;
      return {
        ok: false,
        status: res.status,
        error: down ? "Can't reach the Saafera server. Make sure the Saafera app is running (npm run dev in the main project), then try again." : "The server sent an unexpected reply.",
      };
    }
    if (!data.ok) return { ok: false, error: data.error ?? "Something went wrong.", status: res.status };
    return data as { ok: true } & T;
  } catch {
    return { ok: false, error: "Can't reach Saafera. Check your connection.", status: 0 };
  }
}
