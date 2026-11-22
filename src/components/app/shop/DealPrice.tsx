import { dealOf } from "@/lib/surplus";
import type { Product } from "@/lib/types/api";
import { cn } from "@/lib/cn";
import { gbp } from "../ui";

/** The price a buyer pays, with the usual price struck through when it's a surplus deal. */
export function DealPrice({ p, className, large }: { p: Product; className?: string; large?: boolean }) {
  const deal = dealOf(p);
  const now = deal?.price ?? p.price;
  return (
    <span className={cn("inline-flex flex-wrap items-baseline gap-x-1.5", className)}>
      <span className={cn("num", large ? "font-display text-[34px] font-medium leading-none tracking-[-0.03em]" : "font-semibold")}>{gbp(now)}</span>
      {deal && (
        <>
          <span className={cn("num text-app-faint line-through", large ? "text-[17px]" : "text-ui-sm")}>
            <span className="sr-only">usually </span>
            {gbp(p.price)}
          </span>
          <span className={cn("font-medium text-app-accent", large ? "text-ui" : "text-ui-sm")}>{deal.savePct}% off</span>
        </>
      )}
    </span>
  );
}
