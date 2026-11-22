"use client";

import { useEffect } from "react";
import { getSession } from "./session";

/**
 * Keeps a tab from showing one account while its requests go out as another: when a different
 * tab signs out or signs in, this one reloads to match. A token refresh keeps the same id, so it
 * doesn't trigger this.
 */
export function useSessionGuard() {
  useEffect(() => {
    const id = getSession()?.id;
    const check = () => {
      const now = getSession();
      if (now?.id !== id) window.location.replace(now ? "/dashboard" : "/login");
    };
    window.addEventListener("storage", check);
    window.addEventListener("pageshow", check);
    return () => {
      window.removeEventListener("storage", check);
      window.removeEventListener("pageshow", check);
    };
  }, []);
}
