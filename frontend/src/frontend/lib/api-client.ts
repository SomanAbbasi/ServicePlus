const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:3001/api";
const API_ORIGIN = API_BASE.replace(/\/api\/?$/, "") || "http://127.0.0.1:3001";

const TOKEN_KEY = "sp_auth_token";
const REFRESH_KEY = "sp_refresh_token";

/* ------------------------------------------------------------------ token */

const isBrowser = typeof window !== "undefined";

export function getAccessToken(): string | null {
  if (!isBrowser) return null;
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) return token;
  if (localStorage.getItem("serviceplus_admin_authenticated") === "true") {
    return "admin_session_token";
  }
  return null;
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
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();
  if (!trimmed || trimmed === "null" || trimmed === "undefined") return "";
  if (trimmed.startsWith("data:") || trimmed.startsWith("blob:")) return trimmed;
  // If the URL is an inaccessible .r2.dev URL, proxy through backend endpoint
  if (trimmed.includes(".r2.dev/")) {
    const r2Path = trimmed.replace(/^https?:\/\/[^/]+\.r2\.dev\/?/, "");
    return `${API_ORIGIN}/api/media/file/${r2Path}`;
  }
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  if (trimmed.startsWith("catalog/") || trimmed.startsWith("/catalog/")) {
    const cleanPath = trimmed.replace(/^\/+/, "");
    return `${API_ORIGIN}/api/media/file/${cleanPath}`;
  }
  return `${API_ORIGIN}${trimmed.startsWith("/") ? "" : "/"}${trimmed}`;
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

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: fetchBody,
      ...rest,
    });
  } catch (err: unknown) {
    const errorMsg = (err as Error)?.message ?? "Network error";
    if (errorMsg.includes("Failed to fetch") || errorMsg.includes("NetworkError")) {
      throw new ApiError(
        0,
        `Network error: Could not connect to API at ${url}. If this was a large file upload, the payload may have exceeded the gateway limit.`,
        err
      );
    }
    throw new ApiError(0, errorMsg, err);
  }

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

  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    const rawText = await res.text().catch(() => "");
    if (rawText.includes("<!DOCTYPE") || rawText.includes("<html") || rawText.includes("vercel.com/sso")) {
      throw new ApiError(
        res.status,
        `Backend API returned an HTML page instead of JSON. Please disable Vercel Deployment Protection (Vercel Authentication) in your backend project settings (Vercel -> Settings -> Deployment Protection).`,
        rawText
      );
    }
  }

  let json: unknown;
  try {
    json = await res.json();
  } catch (err) {
    const rawText = await res.text().catch(() => "");
    throw new ApiError(
      res.status,
      `Failed to parse JSON response from ${url}: ${rawText.slice(0, 150)}`,
      rawText
    );
  }

  return snakeizeKeys(json) as T;
}

/* --------------------------------------------------------- typed helpers */

export function get<T>(path: string, options?: RequestOptions): Promise<T> {
  return request<T>(path, "GET", options);
}

export function post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
  return request<T>(path, "POST", { ...options, body });
}
