/**
 * The signed-in session: the access token and the refresh token, kept in the browser so a
 * page refresh stays signed in. The user and their role are not stored here; they come from
 * GET /users/me each time the app loads.
 */
export type Session = {
  /** Changes on every login and survives token refresh, so it tells one sign-in from another. */
  id: string;
  token: string;
  refreshToken?: string;
};

const KEY = "fn_session";
const LEGACY_KEY = "fn_token"; // the mock-era key, cleared on sign-out so nothing stale lingers

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    const s = raw ? (JSON.parse(raw) as Partial<Session>) : null;
    return s && typeof s.token === "string" && s.token ? { id: s.id ?? "", token: s.token, refreshToken: s.refreshToken } : null;
  } catch {
    return null;
  }
}

/** Without an id this is a new sign-in. A refresh passes the id it already had. */
export function setSession(s: Omit<Session, "id"> & { id?: string }) {
  const id = s.id ?? `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ id, token: s.token, refreshToken: s.refreshToken }));
  } catch {}
}

export function clearSession() {
  try {
    window.localStorage.removeItem(KEY);
    window.localStorage.removeItem(LEGACY_KEY);
  } catch {}
}
