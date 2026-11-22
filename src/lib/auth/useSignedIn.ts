"use client";

import { useSyncExternalStore } from "react";
import { getSession } from "./session";

// Re-check when another tab signs in or out, and when the page returns from the back/forward cache.
function subscribe(changed: () => void) {
  window.addEventListener("storage", changed);
  window.addEventListener("pageshow", changed);
  return () => {
    window.removeEventListener("storage", changed);
    window.removeEventListener("pageshow", changed);
  };
}

/** False on the server and during hydration, then whether this browser has a session. */
export const useSignedIn = () => useSyncExternalStore(subscribe, () => !!getSession(), () => false);
