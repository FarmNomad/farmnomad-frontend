"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ShieldCheck } from "@phosphor-icons/react/dist/ssr";
import { useConfirmDeliveryMutation } from "@/lib/api/farmnomad";
import { apiError } from "@/lib/api/errors";
import { Button, orderRef } from "@/components/app/ui";
import { cn } from "@/lib/cn";
import type { Order } from "@/lib/types/api";

const CODE_LENGTH = 6;

/** The buyer's side: the code to read out once the order is in their hands. */
export function DeliveryCodeCard({ code }: { code: string }) {
  return (
    <section aria-label="Delivery code" className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl bg-app-accent-soft p-5">
      <ShieldCheck weight="duotone" className="size-7 shrink-0 text-app-accent" />
      <div className="min-w-0 flex-1 basis-[24ch]">
        <h2 className="font-medium">Your delivery code</h2>
        <p className="mt-1 text-app-muted">Give this to the driver when you have your order, and not before. It confirms the delivery.</p>
      </div>
      <p className="num font-display text-[32px] font-medium tracking-[0.18em]" aria-label={code.split("").join(" ")}>
        {code}
      </p>
    </section>
  );
}

/** The driver's side: ask the buyer for the code. A native dialog, so focus stays inside it. */
export function DeliveryCodeDialog({ order, onClose, onDelivered }: { order: Order; onClose: () => void; onDelivered: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [confirm, { isLoading }] = useConfirmDeliveryMutation();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (code.length !== CODE_LENGTH) return setError(`Enter all ${CODE_LENGTH} digits.`);
    setError(null);
    try {
      await confirm({ id: order.id, code }).unwrap();
      onDelivered();
    } catch (err) {
      setError(apiError(err, "That code didn't work. Check it with the customer and try again."));
    }
  }

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      aria-labelledby="delivery-code-title"
      className="m-auto w-[min(400px,calc(100vw-32px))] rounded-2xl bg-app-panel p-0 text-app-text shadow-pop backdrop:bg-black/40"
    >
      <form onSubmit={submit} noValidate className="grid gap-4 p-5 text-left">
        <div>
          <h2 id="delivery-code-title" className="font-display text-[20px] font-medium tracking-[-0.02em]">
            Enter the delivery code
          </h2>
          <p className="mt-1 text-app-muted">
            Ask {order.customerName} for the {CODE_LENGTH}-digit code on {orderRef(order.id)}.
          </p>
        </div>
        <input
          autoFocus
          aria-label="Delivery code"
          aria-invalid={!!error || undefined}
          inputMode="numeric"
          autoComplete="one-time-code"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.replace(/\D/g, "").slice(0, CODE_LENGTH));
            setError(null);
          }}
          placeholder="000000"
          className={cn(
            "num h-14 w-full rounded-xl bg-app-hover text-center text-[26px] tracking-[0.3em] outline-none placeholder:text-app-faint",
            error ? "shadow-[inset_0_0_0_1px_var(--a-red)]" : "focus:shadow-[inset_0_0_0_1px_var(--a-accent)]",
          )}
        />
        {error && (
          <p role="alert" className="text-ui-sm text-app-red">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isLoading}>
            {isLoading ? "Checking…" : "Confirm delivery"}
          </Button>
        </div>
      </form>
    </dialog>
  );
}
