export const API_ENDPOINTS = {
  analyze: "/api/analyze",
  match: "/api/match",
  opportunities: "/api/opportunities",
  community: "/api/community",
  conversations: "/api/conversations",
  bookings: "/api/bookings",
  business: "/api/business",
  activity: "/api/activity",
  settings: "/api/settings",
  demo: "/api/demo/reset",
} as const;
export const isApiMode = process.env.NEXT_PUBLIC_DATA_MODE === "api";
// Hemish and Jay supply normalized JSON at these endpoints. No AI runs in this frontend.
export async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";
  const response = await fetch(base + path, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
    signal: options.signal ?? AbortSignal.timeout(15000),
  });
  if (!response.ok)
    throw new Error(
      `Request failed (${response.status}). Check the backend connection.`,
    );
  return response.json() as Promise<T>;
}
