/**
 * The signed-in session: the access token and the refresh token, kept in the browser so a
 * page refresh stays signed in. The user and their role are not stored here; they come from
 * GET /users/me each time the app loads.
 */
export type Session = { token: string; refreshToken?: string };

const KEY = "fn_session";
const LEGACY_KEY = "fn_token"; // the mock-era key, cleared on sign-out so nothing stale lingers

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    const s = raw ? (JSON.parse(raw) as Partial<Session>) : null;
    return s && typeof s.token === "string" && s.token ? { token: s.token, refreshToken: s.refreshToken } : null;
  } catch {
    return null;
  }
}

export function setSession(s: Session) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ token: s.token, refreshToken: s.refreshToken }));
  } catch {}
}

export function clearSession() {
  try {
    window.localStorage.removeItem(KEY);
    window.localStorage.removeItem(LEGACY_KEY);
  } catch {}
}
