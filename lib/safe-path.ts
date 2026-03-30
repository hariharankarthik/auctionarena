/**
 * Sanitizes post-auth `next` query values to prevent open redirects.
 * Allows only absolute paths on the same app (no protocol, no //).
 */
export function safeNextPath(raw: string | undefined | null, fallback = "/dashboard"): string {
  if (typeof raw !== "string") return fallback;
  const path = raw.trim();
  if (!path.startsWith("/")) return fallback;
  if (path.startsWith("//")) return fallback;
  if (path.includes("://")) return fallback;
  if (path.includes("\\")) return fallback;
  return path;
}

/** Use for server `redirect()` when sending unauthenticated users to login. */
export function loginUrlWithNext(internalPath: string, fallback = "/dashboard"): string {
  const next = safeNextPath(internalPath, fallback);
  return `/login?next=${encodeURIComponent(next)}`;
}
