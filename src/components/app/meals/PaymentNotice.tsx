"use client";

import { useEffect, useState, type ReactNode } from "react";
import { CheckCircle, HourglassMedium, Info, X } from "@phosphor-icons/react/dist/ssr";
import { useMyMealOrdersQuery } from "@/lib/api/farmnomad";
import type { MealOrder } from "@/lib/types/api";
import { Button, IconButton, gbp } from "@/components/app/ui";
import { cn } from "@/lib/cn";

type Tone = "wait" | "good" | "info";
const ICON = { wait: HourglassMedium, good: CheckCircle, info: Info };

function Notice({ tone, title, body, action, onClose }: { tone: Tone; title: string; body: string; action?: ReactNode; onClose: () => void }) {
  const Icon = ICON[tone];
  return (
    <div role="status" className={cn("flex items-start gap-3 rounded-xl p-3.5", tone === "good" ? "bg-app-accent-soft" : "bg-app-hover")}>
      <Icon weight="fill" className={cn("mt-0.5 size-5 shrink-0", tone === "good" ? "text-app-accent" : "text-app-muted")} />
      <div className="min-w-0 flex-1">
        <p className="font-medium">{title}</p>
        <p className="mt-0.5 text-ui-sm text-app-muted">{body}</p>
        {action && <div className="mt-2.5">{action}</div>}
      </div>
      <IconButton label="Dismiss" onClick={onClose}>
        <X className="size-4" />
      </IconButton>
    </div>
  );
}

const param = (name: string) => (typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get(name));
const clearParams = () => window.history.replaceState(null, "", window.location.pathname);

/** What to tell the diner. Only the server's paymentStatus counts: reaching this page proves nothing. */
function describe(o: MealOrder | undefined, slow: boolean): { tone: Tone; title: string; body: string; settled: boolean } {
  const amount = o ? gbp(o.total) : "";
  switch (o?.paymentStatus) {
    case "HELD":
      return { tone: "good", title: "The kitchen has your order", body: `${amount} is held on your card. You're only charged when they start cooking.`, settled: true };
    case "CAPTURED":
      return { tone: "good", title: "Payment taken", body: `You were charged ${amount} when the kitchen started cooking.`, settled: true };
    case "RELEASED":
      return { tone: "info", title: "Order cancelled. You weren't charged", body: "The hold is released. Your bank can take a few days to clear it from your statement.", settled: true };
    case "REFUNDED":
      return { tone: "info", title: "Order cancelled and refunded", body: `${amount} is on its way back to your card, usually within 5 to 10 working days.`, settled: true };
    case "EXPIRED":
      return { tone: "info", title: "Payment wasn't completed", body: "You weren't charged, and the order didn't go to the kitchen.", settled: true };
  }
  return slow
    ? { tone: "wait", title: "Still confirming your payment", body: "This is taking longer than usual. Please don't pay again. The order goes to the kitchen once it's confirmed.", settled: false }
    : { tone: "wait", title: "Confirming your payment", body: "This usually takes a few seconds.", settled: false };
}

/** Back from Stripe at /nomadeat?ordered={id}. */
export function PaymentReturn() {
  const [id, setId] = useState(() => Number(param("ordered")) || null);
  return id ? (
    <Confirming
      id={id}
      onClose={() => {
        setId(null);
        clearParams();
      }}
    />
  ) : null;
}

function Confirming({ id, onClose }: { id: number; onClose: () => void }) {
  const [slow, setSlow] = useState(false);
  // The webhook can land after the diner does, and the kitchen can answer while they watch.
  const { data, refetch, isFetching } = useMyMealOrdersQuery(undefined, { pollingInterval: slow ? 10000 : 3000 });
  const { settled, ...notice } = describe(
    data?.find((o) => o.id === id),
    slow,
  );

  useEffect(() => {
    const t = window.setTimeout(() => setSlow(true), 45000);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <Notice
      {...notice}
      onClose={onClose}
      action={
        slow && !settled ? (
          <Button size="sm" disabled={isFetching} onClick={refetch}>
            Check again
          </Button>
        ) : undefined
      }
    />
  );
}

/** Back from Stripe at /nomadeat/{mealId}?payment=cancelled. Shown even if the meal now reads as sold out. */
export function PaymentCancelled() {
  const [show, setShow] = useState(() => param("payment") === "cancelled");
  if (!show) return null;
  return (
    <Notice
      tone="info"
      title="You left payment, so nothing was charged"
      body="The portions you chose can stay set aside for about 30 minutes, so this meal may show fewer until then."
      onClose={() => {
        setShow(false);
        clearParams();
      }}
    />
  );
}
