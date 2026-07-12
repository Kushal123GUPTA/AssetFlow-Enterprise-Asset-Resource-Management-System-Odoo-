export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function fetchJson<T>(
  url: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(
      typeof payload?.error === "string" ? payload.error : "Request failed",
      res.status
    );
  }
  return payload as T;
}
