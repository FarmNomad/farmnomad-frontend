"use client";

import Link from "next/link";
import { toast } from "sonner";
import { ChatsCircle } from "@phosphor-icons/react/dist/ssr";
import { useUpdateMealOrderMutation } from "@/lib/api/farmnomad";
import type { MealOrder, MealOrderStatus } from "@/lib/types/api";
import { Button, Pill, gbp, relDay, time } from "@/components/app/ui";
import { cn } from "@/lib/cn";
import { apiError } from "@/lib/api/errors";
import { mealOrderMeta } from "./meta";

export function useAdvanceMealOrder() {
  const [update, { isLoading }] = useUpdateMealOrderMutation();
  async function move(o: MealOrder, to: MealOrderStatus) {
    const held = o.paymentStatus === "HELD";
    try {
      await update({ id: o.id, status: to }).unwrap();
      const words: Partial<Record<MealOrderStatus, string>> = {
        PREPARING: "Payment taken. Start cooking.",
        READY: `Ready. ${o.customerName} has been told.`,
        COLLECTED: "Collected",
        CANCELLED: held ? `Declined. ${o.customerName} wasn't charged, and the portions are back on the menu.` : "Order cancelled.",
      };
      toast.success(words[to] ?? "Updated");
    } catch (e) {
      // Starting captures the hold, so a failure here means the money wasn't confirmed.
      if (to === "PREPARING") toast.error("Don't start cooking", { description: apiError(e, "We couldn't confirm the payment. Try again.") });
      else toast.error("Couldn't update the order", { description: apiError(e, "Try again in a moment.") });
    }
  }
  return { move, busy: isLoading };
}

/** A ticket on the kitchen pass: what, how many, who, and the one next step. */
export function OrderTicket({ o, compact }: { o: MealOrder; compact?: boolean }) {
  const { move, busy } = useAdvanceMealOrder();
  // Nothing gets cooked without a hold to charge. The server enforces this too.
  const canStart = o.status !== "NEW" || o.paymentStatus === "HELD";
  const m: (typeof mealOrderMeta)[MealOrderStatus] = mealOrderMeta[o.status] ?? { ...mealOrderMeta.COLLECTED, label: String(o.status ?? "Unknown") };
  return (
    <li className={cn("flex min-w-0 flex-col gap-3 rounded-xl bg-app-panel p-4 shadow-[0_0_0_1px_var(--a-line)]", o.status === "NEW" && "shadow-[0_0_0_1px_var(--a-line),inset_3px_0_0_var(--a-amber)]")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium leading-snug">
            <span className="num">{o.quantity}</span> × {o.mealName}
          </p>
          <p className="mt-0.5 truncate text-ui-sm text-app-muted">
            {o.customerName} · <span className="num">{gbp(o.total)}</span>
          </p>
          <p className="num mt-0.5 text-ui-sm text-app-faint">
            #{o.id} · {relDay(o.createdAt)}, {time(o.createdAt)}
          </p>
        </div>
        <Pill tone={m.tone}>{m.label}</Pill>
      </div>
      {o.note && <p className="rounded-lg bg-app-hover px-3 py-2 text-ui-sm text-app-muted">“{o.note}”</p>}
      {o.status === "NEW" && (
        <p className={cn("text-ui-sm", canStart ? "text-app-muted" : "text-app-red")}>
          {canStart ? "Card held. Start within 15 minutes or the order is cancelled." : "No payment is held for this order, so don't cook it."}
        </p>
      )}
      {!compact && (m.next || o.status === "NEW") && (
        <div className="flex flex-wrap items-center gap-2">
          {m.next && canStart && (
            <Button size="sm" variant={o.status === "NEW" ? "primary" : "secondary"} disabled={busy} onClick={() => move(o, m.next!.to)} className="flex-1">
              {(() => {
                const Icon = mealOrderMeta[m.next.to].icon;
                return <Icon className="size-4" />;
              })()}{" "}
              {m.next.label}
            </Button>
          )}
          {o.status === "NEW" && (
            <Button size="sm" variant="ghost" disabled={busy} onClick={() => move(o, "CANCELLED")}>
              Decline
            </Button>
          )}
          <Link href={`/messages?to=${o.customerId}&name=${encodeURIComponent(o.customerName)}`} aria-label={`Message ${o.customerName}`} className="grid size-8 shrink-0 place-items-center rounded-[7px] text-app-muted transition-colors hover:bg-app-hover hover:text-app-text">
            <ChatsCircle className="size-4" />
          </Link>
        </div>
      )}
    </li>
  );
}
