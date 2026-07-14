const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3333";
const TOKEN_STORAGE_KEY = "agarramais.token";

export function getToken(): string | null {
  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setToken(token: string | null): void {
  if (token) {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  auth?: boolean;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, auth = true } = options;

  const headers: Record<string, string> = {};
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const responseCopy = response.clone();
    const data = await response.json().catch(() => null);
    const fallback = await response.text().catch(() => "");
    const fallbackFromCopy = fallback || (await responseCopy.text().catch(() => ""));
    throw new ApiError(response.status, data?.message || fallbackFromCopy || "Erro ao comunicar com o servidor");
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
