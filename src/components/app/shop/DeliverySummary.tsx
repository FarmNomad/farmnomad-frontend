"use client";

import { useGetCheckoutQuoteQuery } from "@/lib/api/farmnomad";
import type { CartItem } from "@/lib/types/api";
import { Skeleton, gbp } from "../ui";

const pounds = (pence: number) => gbp(pence / 100);

/**
 * Subtotal, delivery and total, from the server's quote. Delivery is a compulsory charge, so UK
 * pricing rules say it belongs in the total before Pay. Until the backend can quote it, this says
 * so plainly rather than showing a total that might grow on the payment page.
 */
export function useDeliveryQuote(items: CartItem[] | undefined) {
  const q = useGetCheckoutQuoteQuery(undefined, { skip: !items?.length });
  const localSubtotal = items?.reduce((s, i) => s + (i.product?.price ?? 0) * i.quantity, 0) ?? 0;
  const quote = q.data ?? null;
  const blocked = quote?.groups?.filter((g) => g.deliverable === false) ?? [];
  return {
    quote,
    // q.data is null when the backend has no quote yet, undefined while asking.
    pending: !!items?.length && q.data === undefined && !q.isError,
    failed: q.isError,
    retry: q.refetch,
    blocked,
    subtotal: quote ? quote.subtotalPence / 100 : localSubtotal,
    total: quote ? quote.totalPence / 100 : null,
  };
}

export function DeliveryRows({ d }: { d: ReturnType<typeof useDeliveryQuote> }) {
  const groups = d.quote?.groups ?? [];
  return (
    <>
      <div className="flex justify-between gap-3">
        <dt className="text-app-muted">Subtotal</dt>
        <dd className="num">{gbp(d.subtotal)}</dd>
      </div>
      {d.pending ? (
        <div className="flex items-center justify-between gap-3">
          <dt className="text-app-muted">Delivery</dt>
          <dd>
            <Skeleton className="h-4 w-14" />
          </dd>
        </div>
      ) : d.quote && groups.length > 1 ? (
        groups.map((g) => (
          <div key={g.farmerId} className="flex justify-between gap-3">
            <dt className="min-w-0 truncate text-app-muted">Delivery from {g.farmName ?? "the farm"}</dt>
            <dd className={g.deliverable === false ? "text-app-red" : "num"}>{g.deliverable === false ? "Unavailable" : g.deliveryFeePence ? pounds(g.deliveryFeePence) : "Free"}</dd>
          </div>
        ))
      ) : d.quote ? (
        <div className="flex justify-between gap-3">
          <dt className="text-app-muted">Delivery{d.quote.miles ? ` · ${d.quote.miles.toFixed(1)} miles` : ""}</dt>
          <dd className="num">{d.quote.deliveryPence ? pounds(d.quote.deliveryPence) : "Free"}</dd>
        </div>
      ) : (
        <div className="flex justify-between gap-3">
          <dt className="text-app-muted">Delivery</dt>
          <dd className="text-right text-app-muted">{d.failed ? "Couldn't work it out" : "Not priced yet"}</dd>
        </div>
      )}
      {d.blocked.map((g) => (
        <p key={`why-${g.farmerId}`} role="alert" className="text-ui-sm text-app-red">
          {g.farmName ?? "One farm"}: {g.reason ?? "can't deliver to your address."}
        </p>
      ))}
    </>
  );
}
