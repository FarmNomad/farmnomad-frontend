"use client";

import Link from "next/link";
import { useState } from "react";
import { X } from "@phosphor-icons/react/dist/ssr";
import { useGetEarningsSummaryQuery } from "@/lib/api/farmnomad";

/**
 * Shown above the product and meal forms while the seller can't be paid yet. A soft gate: it can
 * be dismissed and never blocks the form, it only makes the consequence visible.
 */
export function PayoutsNotice({ onNavigate }: { onNavigate?: () => void }) {
  const { data } = useGetEarningsSummaryQuery();
  const [dismissed, setDismissed] = useState(false);
  if (!data || data.payoutsEnabled || dismissed) return null;
  return (
    <div role="status" className="mx-5 mt-5 flex items-start gap-3 rounded-xl bg-app-amber-soft p-3.5">
      <p className="min-w-0 flex-1">
        <span className="font-medium">Set up payouts before you start selling.</span>{" "}
        <span className="text-app-muted">You can create listings now, but you will not be able to receive money until your payout details are verified.</span>{" "}
        <Link href="/earnings" onClick={onNavigate} className="font-medium underline underline-offset-2">
          Set up payouts
        </Link>
      </p>
      <button type="button" aria-label="Dismiss" onClick={() => setDismissed(true)} className="grid size-6 shrink-0 place-items-center rounded-md text-app-muted hover:bg-black/5 hover:text-app-text dark:hover:bg-white/10">
        <X className="size-3.5" />
      </button>
    </div>
  );
}
