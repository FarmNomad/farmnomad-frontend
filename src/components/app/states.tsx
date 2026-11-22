"use client";

import { HourglassMedium, WarningCircle } from "@phosphor-icons/react/dist/ssr";
import { Button, EmptyState } from "./ui";

/** A failed load. Never let one pass for an empty list. */
export function LoadError({ what, onRetry }: { what: string; onRetry: () => void }) {
  return (
    <div role="alert">
      <EmptyState
        icon={<WarningCircle className="size-5" />}
        title={`We couldn't load ${what}`}
        body="The server may be waking up, or your connection dropped."
        action={<Button onClick={onRetry}>Try again</Button>}
      />
    </div>
  );
}

/** A screen whose backend isn't built yet. */
export function NotAvailableYet({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl shadow-[0_0_0_1px_var(--a-line)]">
      <EmptyState icon={<HourglassMedium className="size-5" />} title={title} body={body} />
    </div>
  );
}
