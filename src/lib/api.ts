const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error("NEXT_PUBLIC_API_URL is not set");
}

type ApiError = { message: string; status?: number };

async function parseError(res: Response): Promise<ApiError> {
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const data = await res.json().catch(() => ({}));
    return { message: data?.detail || data?.message || "Request failed", status: res.status };
  }
  const text = await res.text().catch(() => "");
  return { message: text || "Request failed", status: res.status };
}

export async function apiFetch<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...opts,
    // Cruciaal: httpOnly cookie (pm_session) meesturen/ontvangen
    credentials: "include",
    headers: {
      ...(opts.headers || {}),
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) throw await parseError(res);

  if (res.status === 204) return undefined as unknown as T;
  return (await res.json()) as T;
}
