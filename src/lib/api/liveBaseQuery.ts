import { fetchBaseQuery, type BaseQueryFn, type FetchArgs, type FetchBaseQueryError } from "@reduxjs/toolkit/query/react";
import { clearSession, getSession, setSession, type Session } from "@/lib/auth/session";

/**
 * The connection to the Spring Boot API.
 *
 * - Sends the access token as `Authorization: Bearer <token>`.
 * - When a request comes back 401, swaps the refresh token for a new pair once, then repeats
 *   the request. The backend rotates the refresh token, so both new values are stored.
 * - Only one tab refreshes at a time, and the others use the tokens it stored.
 * - If the server rejects the refresh token, the session is over: clear it and go to /login.
 *   If the refresh merely couldn't get through (offline, timeout, 5xx), the session is kept.
 * - A request is never repeated under a different sign-in from the one that started it.
 * - Waits up to 90 seconds and never retries a slow request. The backend sleeps when idle and
 *   takes 30 to 60 seconds to wake; a retry would only queue a second slow request.
 */

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:9000/api").replace(/\/+$/, "");
const TIMEOUT_MS = 90_000;

// Public auth routes. A stale token must not be sent to these, and a 401 from them is an
// answer ("wrong password"), not an expired session.
const PUBLIC_AUTH = /^\/auth\/(login|register|verify-email|resend-verification|forgot-password|reset-password|refresh)$/;

const pathOf = (args: string | FetchArgs) => (typeof args === "string" ? args : args.url).split("?")[0];

/** The API answers errors as JSON on some routes and plain text on others. Normalise both to `{ message }`. */
async function readBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

const raw = fetchBaseQuery({
  baseUrl: API_URL,
  timeout: TIMEOUT_MS,
  responseHandler: readBody,
  prepareHeaders: (headers, { arg }) => {
    const token = getSession()?.token;
    if (token && !PUBLIC_AUTH.test(pathOf(arg as string | FetchArgs))) headers.set("Authorization", `Bearer ${token}`);
    return headers;
  },
});

type RefreshResult =
  | { state: "ok" }
  | { state: "rejected" } // the server said no: the session is over
  | { state: "replaced" } // signed out, or signed in again, while we were waiting
  | { state: "failed"; error: FetchBaseQueryError }; // didn't get through: keep the session

// A refresh token works once. Requests in one tab share a promise; tabs take turns with a lock.
let refreshing: Promise<RefreshResult> | null = null;
const REFRESH_LOCK = "fn_refresh";
const REJECTED = new Set([400, 401, 403]);

/** What has happened to the stored session since `stale` was read, if anything. */
function changedSince(stale: Session): RefreshResult | null {
  const now = getSession();
  if (!now || now.id !== stale.id) return { state: "replaced" };
  if (now.token !== stale.token || now.refreshToken !== stale.refreshToken) return { state: "ok" };
  return null;
}

async function refreshSession(stale: Session): Promise<RefreshResult> {
  // navigator.locks only exists on https and localhost, so it can be missing on a LAN address.
  const locks = typeof navigator === "undefined" ? undefined : navigator.locks;

  const refresh = async (): Promise<RefreshResult> => {
    const changed = changedSince(stale);
    if (changed) return changed; // another tab got there while we waited for the lock
    if (!stale.refreshToken) return { state: "rejected" };
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: stale.refreshToken }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (REJECTED.has(res.status)) {
        // Without a lock, another tab may have used this token and be about to store the new pair.
        for (let i = 0; !locks && i < 10; i++) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          if (changedSince(stale)) break;
        }
        return changedSince(stale) ?? { state: "rejected" };
      }
      if (!res.ok) return { state: "failed", error: { status: res.status, data: { message: "The server isn't responding. It may still be waking up, so try again." } } };
      const data = (await res.json()) as { token?: string | null; refreshToken?: string | null };
      if (!data.token) return { state: "rejected" };
      // Someone signed out or in meanwhile: writing these tokens would undo that.
      if (getSession()?.id !== stale.id) return { state: "replaced" };
      // Both, every time. Keeping the old refresh token would fail on the next refresh.
      setSession({ id: stale.id, token: data.token, refreshToken: data.refreshToken ?? stale.refreshToken });
      return { state: "ok" };
    } catch (err) {
      const status = (err as Error)?.name === "TimeoutError" ? "TIMEOUT_ERROR" : "FETCH_ERROR";
      return { state: "failed", error: { status, error: String(err) } };
    }
  };

  return locks ? await locks.request(REFRESH_LOCK, refresh) : refresh();
}

function endSession() {
  clearSession();
  if (typeof window === "undefined") return;
  const onAuthPage = /^\/(login|register|forgot-password|reset-password|verify-email|resend-verification)/.test(window.location.pathname);
  // A full page load on purpose: this runs outside React, and it drops everything cached for the old session.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  if (!onAuthPage) window.location.assign("/login?expired=1");
}

export const liveBaseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (args, api, extra) => {
  const sentAs = getSession();
  const result = await raw(args, api, extra);
  const path = pathOf(args);
  if (result.error?.status !== 401 || PUBLIC_AUTH.test(path)) return result;

  if (!sentAs) {
    if (!getSession()) endSession();
    return result;
  }

  let outcome = changedSince(sentAs);
  if (!outcome) {
    refreshing ??= refreshSession(sentAs).finally(() => {
      refreshing = null;
    });
    outcome = await refreshing;
  }

  const now = getSession();
  if (now?.id !== sentAs.id) return result; // a different sign-in now: not ours to repeat or to end
  if (outcome.state === "failed") return { error: outcome.error };
  if (outcome.state === "rejected") endSession();
  if (outcome.state === "ok") {
    // Sign-out must revoke the token we have now, not the one the refresh just used up.
    const again = path === "/auth/logout" && typeof args !== "string" ? { ...args, body: { refreshToken: now.refreshToken } } : args;
    return raw(again, api, extra);
  }
  return result;
};
