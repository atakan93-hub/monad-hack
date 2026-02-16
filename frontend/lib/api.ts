// baseFetch wrapper — use this for client-side API calls to /api/* routes.
// Migrate components away from direct supabase-api.ts imports incrementally.

export class ApiError extends Error {
  constructor(
    public status: number,
    public serverMessage?: string
  ) {
    super(serverMessage ?? `API error ${status}`);
    this.name = "ApiError";
  }

  get isUnauthorized() {
    return this.status === 401;
  }
  get isNotFound() {
    return this.status === 404;
  }
  get isServerError() {
    return this.status >= 500;
  }
}

type AuthMode = "none" | "cookie" | "bearer";

interface IFetchOptions {
  body?: unknown;
  auth?: AuthMode;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

async function baseFetch<T>(
  method: string,
  path: string,
  options?: IFetchOptions
): Promise<T> {
  const { body, auth = "cookie", headers: extraHeaders, signal } = options ?? {};

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...extraHeaders,
  };

  if (auth === "bearer") {
    // Add bearer token logic if needed
  }

  const res = await fetch(path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    credentials: auth === "cookie" ? "same-origin" : undefined,
    signal,
  });

  if (!res.ok) {
    let serverMessage: string | undefined;
    try {
      const json = await res.json();
      serverMessage = json.error ?? json.message;
    } catch {
      // ignore parse errors
    }
    throw new ApiError(res.status, serverMessage);
  }

  // Handle 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

export const httpGet = <T>(path: string, options?: IFetchOptions) =>
  baseFetch<T>("GET", path, options);

export const httpPost = <T>(path: string, options?: IFetchOptions) =>
  baseFetch<T>("POST", path, options);

export const httpPut = <T>(path: string, options?: IFetchOptions) =>
  baseFetch<T>("PUT", path, options);

export const httpPatch = <T>(path: string, options?: IFetchOptions) =>
  baseFetch<T>("PATCH", path, options);

export const httpDelete = <T>(path: string, options?: IFetchOptions) =>
  baseFetch<T>("DELETE", path, options);
