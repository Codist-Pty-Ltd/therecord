"use client";

/** Browser-side API origin (`NEXT_PUBLIC_API_URL`). */
export function clientApiBase(): string {
  const b = process.env.NEXT_PUBLIC_API_URL;
  if (!b) {
    throw new Error(
      "NEXT_PUBLIC_API_URL is not configured — required for client-side API calls.",
    );
  }
  return b.replace(/\/+$/, "");
}

export async function clientGet<T>(path: string): Promise<T> {
  const res = await fetch(`${clientApiBase()}${path}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`Request failed (${res.status}) for ${path}`);
  }
  return (await res.json()) as T;
}

export async function clientPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${clientApiBase()}${path}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      text ? text.slice(0, 200) : `Request failed (${res.status}) for ${path}`,
    );
  }
  return (await res.json()) as T;
}
