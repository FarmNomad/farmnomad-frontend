"use client";

import { toast } from "sonner";
import { Sparkle } from "@phosphor-icons/react/dist/ssr";
import { useDismissSurplusSuggestionMutation, useListSurplusSuggestionsQuery } from "@/lib/api/farmnomad";
import { FEATURES } from "@/lib/features";
import { shortDate } from "@/lib/surplus";
import { useApp } from "./AppState";
import { Button, gbp } from "./ui";

/**
 * The AI only suggests. Nothing changes price until the farmer opens the suggestion, checks or
 * edits it, and confirms it themselves.
 */
export function SurplusSuggestions() {
  const { role, setSurplusSheet } = useApp();
  const on = FEATURES.surplusDeals && role === "FARMER";
  const { data } = useListSurplusSuggestionsQuery(undefined, { skip: !on });
  const [dismiss, { isLoading }] = useDismissSurplusSuggestionMutation();
  if (!on || !data?.length) return null;

  return (
    <section aria-labelledby="suggest" className="rounded-xl p-5 shadow-[0_0_0_1px_var(--a-line)]">
      <h2 id="suggest" className="flex items-center gap-2 font-medium">
        <Sparkle weight="fill" className="size-4 text-app-accent" /> Might not sell in time
      </h2>
      <p className="mt-1 text-ui-sm text-app-muted">Suggestions from your stock, sales and best-before dates. Nothing changes until you confirm.</p>
      <ul className="mt-4 grid gap-2">
        {data.map((s) => (
          <li key={s.id} className="flex flex-wrap items-center gap-3 rounded-lg bg-app-hover/60 px-3.5 py-3">
            <div className="min-w-0 flex-1">
              <p className="font-medium">
                {s.quantity} × {s.productName}
              </p>
              <p className="text-ui-sm text-app-muted">
                {s.reason}
                {s.suggestedPricePence ? ` Try ${gbp(s.suggestedPricePence / 100)}` : ""}
                {s.endsAt ? ` until ${shortDate(s.endsAt)}.` : s.suggestedPricePence ? "." : ""}
              </p>
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" disabled={isLoading} onClick={() => dismiss(s.id).unwrap().catch(() => toast.error("Couldn't dismiss that"))}>
                Not now
              </Button>
              <Button size="sm" onClick={() => setSurplusSheet({ productId: s.productId, quantity: s.quantity, pricePence: s.suggestedPricePence, endsAt: s.endsAt, suggestionId: s.id })}>
                Review
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
