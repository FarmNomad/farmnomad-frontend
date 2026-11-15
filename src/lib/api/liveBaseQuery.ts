import { fetchBaseQuery, type BaseQueryFn, type FetchArgs, type FetchBaseQueryError } from "@reduxjs/toolkit/query/react";
import { clearSession, getSession, setSession } from "@/lib/auth/session";

/**
 * The connection to the Spring Boot API.
 *
 * - Sends the access token as `Authorization: Bearer <token>`.
 * - When a request comes back 401, swaps the refresh token for a new pair once, then repeats
 *   the request. The backend rotates the refresh token, so both new values are stored.
 * - If the refresh fails, the session is over: clear it and go to /login.
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

// One refresh at a time: several requests can hit 401 together, and a refresh token works once.
let refreshing: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
  const refreshToken = getSession()?.refreshToken;
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { token?: string | null; refreshToken?: string | null };
    if (!data.token) return false;
    // Both, every time. Keeping the old refresh token would fail on the next refresh.
    setSession({ token: data.token, refreshToken: data.refreshToken ?? refreshToken });
    return true;
  } catch {
    return false;
  }
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
  const sentWith = getSession()?.token;
  let result = await raw(args, api, extra);

  if (result.error?.status === 401 && !PUBLIC_AUTH.test(pathOf(args))) {
    // Another request may have refreshed already while this one was in flight.
    const alreadyRefreshed = !!sentWith && getSession()?.token !== sentWith;
    if (!alreadyRefreshed) {
      refreshing ??= refreshSession().finally(() => {
        refreshing = null;
      });
    }
    const ok = alreadyRefreshed || (await refreshing);
    if (ok) result = await raw(args, api, extra);
    else endSession();
  }
  return result;
};
