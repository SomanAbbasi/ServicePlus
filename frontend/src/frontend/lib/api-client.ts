const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001/api";
const API_ORIGIN = API_BASE.replace(/\/api\/?$/, "") || "http://localhost:3001";

const TOKEN_KEY = "sp_auth_token";
const REFRESH_KEY = "sp_refresh_token";

/* ------------------------------------------------------------------ token */

const isBrowser = typeof window !== "undefined";

export function getAccessToken(): string | null {
  if (!isBrowser) return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setAccessToken(token: string): void {
  if (!isBrowser) return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function getRefreshToken(): string | null {
  if (!isBrowser) return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function setRefreshToken(token: string): void {
  if (!isBrowser) return;
  localStorage.setItem(REFRESH_KEY, token);
}

export function removeTokens(): void {
  if (!isBrowser) return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

/* --------------------------------------------------------------- snakeize */

const CAMEL_RE = /[A-Z]/g;

function toSnake(s: string): string {
  return s.replace(CAMEL_RE, (m) => `_${m.toLowerCase()}`);
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Recursively convert all object keys from camelCase to snake_case. */
export function snakeizeKeys<T>(input: T): T {
  if (Array.isArray(input)) return input.map(snakeizeKeys) as T;
  if (!isPlainObject(input)) return input;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input)) {
    out[toSnake(k)] = snakeizeKeys(v);
  }
  return out as T;
}

/** Resolve a relative image path (e.g. "/images/catalog/...") to a full backend URL. */
export function resolveImageUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${API_ORIGIN}${url.startsWith("/") ? "" : "/"}${url}`;
}

/* ---------------------------------------------------------------- errors */

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

/* ---------------------------------------------------------- refresh logic */

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) throw new ApiError(401, "No refresh token");
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) {
      removeTokens();
      throw new ApiError(res.status, "Token refresh failed");
    }
    const data = snakeizeKeys(await res.json()) as { access_token: string; refresh_token?: string };
    setAccessToken(data.access_token);
    if (data.refresh_token) setRefreshToken(data.refresh_token);
    if (isBrowser) window.dispatchEvent(new Event("auth-change"));
    return data.access_token;
  })();
  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

/* ----------------------------------------------------------- fetch wrapper */

interface RequestOptions extends Omit<RequestInit, "method" | "body"> {
  body?: unknown;
  skipAuth?: boolean;
  retry?: boolean;
}

async function request<T>(path: string, method: string, options: RequestOptions = {}): Promise<T> {
  const { skipAuth = false, retry = true, headers: extraHeaders, body, ...rest } = options;
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;

  const headers: Record<string, string> = {
    ...(extraHeaders as Record<string, string>),
  };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (!skipAuth) {
    const token = getAccessToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const fetchBody = body !== undefined ? JSON.stringify(body) : null;

  const res = await fetch(url, {
    method,
    headers,
    body: fetchBody,
    ...rest,
  });

  if (res.status === 401 && retry && !skipAuth && getRefreshToken()) {
    try {
      await refreshAccessToken();
      return request<T>(path, method, { ...options, retry: false });
    } catch {
      if (isBrowser) window.dispatchEvent(new Event("auth-logout"));
      throw new ApiError(401, "Session expired");
    }
  }

  if (!res.ok) {
    let errorBody: unknown;
    try {
      errorBody = await res.json();
    } catch {
      errorBody = await res.text().catch(() => null);
    }
    const msg =
      (errorBody && typeof errorBody === "object" && "message" in errorBody
        ? (errorBody as { message: string }).message
        : null) ?? `Request failed (${res.status})`;
    throw new ApiError(res.status, msg, errorBody);
  }

  if (res.status === 204) return undefined as T;
  const json = await res.json();
  return snakeizeKeys(json) as T;
}

/* --------------------------------------------------------- typed helpers */

export function get<T>(path: string, options?: RequestOptions): Promise<T> {
  return request<T>(path, "GET", options);
}

export function post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
  return request<T>(path, "POST", { ...options, body });
}
