/** ⌘ on Apple devices, Ctrl everywhere else. Only call this from screens that render in the browser. */
export function isApple() {
  return typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);
}

export const modKey = () => (isApple() ? "⌘" : "Ctrl");

/** "⌘K" on a Mac, "Ctrl K" on Windows and Linux. */
export const shortcut = (key: string) => (isApple() ? `⌘${key}` : `Ctrl ${key}`);
