/**
 * Turn a failed request into something to show the user: the API's own message when it sent
 * one, a plain explanation for the cases it can't describe itself, or the fallback given.
 */
export function apiError(err: unknown, fallback: string): string {
  const e = err as { status?: number | string; data?: { message?: string | null } | null };
  if (e?.status === "TIMEOUT_ERROR") return "The server took too long to answer. It may still be waking up, so try again.";
  if (e?.status === "FETCH_ERROR") return "Couldn't reach the server. Check your connection and try again.";
  // 403 means the signed-in account has the wrong role for this, not that something is broken.
  if (e?.status === 403) return e.data?.message || "You don't have access to this.";
  return e?.data?.message || fallback;
}
