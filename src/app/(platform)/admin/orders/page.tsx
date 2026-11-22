"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Gift, Receipt } from "@phosphor-icons/react/dist/ssr";
import { useAdminAssignOrderMutation, useAdminOrderStatusMutation, useListOrdersAdminQuery, useListUsersQuery, useRefundOrderMutation } from "@/lib/api/farmnomad";
import type { Order, OrderStatus } from "@/lib/types/api";
import { PageHeader } from "@/components/app/PageHeader";
import { Confirm, Filters, Search, Table, td, tr } from "@/components/app/admin/parts";
import { paymentMeta, statusMeta } from "@/components/app/orderMeta";
import { Button, EmptyState, Pill, gbp, orderRef, relDay, time } from "@/components/app/ui";
import { cn } from "@/lib/cn";
import { apiError } from "@/lib/api/errors";
import { formatPence } from "@/lib/types/earnings";

type F = "all" | OrderStatus;
const FLOW: OrderStatus[] = ["PENDING", "ASSIGNED", "IN_TRANSIT", "DELIVERED", "CANCELLED"];
const NEXT: Partial<Record<OrderStatus, { to: OrderStatus; label: string }>> = {
  ASSIGNED: { to: "IN_TRANSIT", label: "Mark collected" },
  IN_TRANSIT: { to: "DELIVERED", label: "Mark delivered" },
};
/** Paid by a customer and not given back. Donation runs charge nobody. */
const refundable = (o: Order) => o.paymentStatus === "PAID" && !o.donationId;
/** The refund endpoint returns exactly totalPence, so only that figure is promised. */
const refundAmount = (o: Order) => (o.totalPence ? formatPence(o.totalPence) : null);
const msg = (e: unknown) => (e as { data?: { message?: string } })?.data?.message ?? "That didn't go through";

/**
 * Admin orders (spec §3.7 GET /orders?status=, PATCH assign with driverId, PATCH status).
 * Cancelling moves no money. Refund is its own action: POST /admin/orders/{id}/refund.
 */
export default function AdminOrders() {
  const [f, setF] = useState<F>("all");
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const s = sp.get("status") as OrderStatus | null;
    if (s && FLOW.includes(s)) setF(s);
    if (sp.get("q")) setQ(sp.get("q")!);
  }, []);
  const { data, isLoading } = useListOrdersAdminQuery();
  const { data: users } = useListUsersQuery();
  const drivers = users?.filter((u) => u.role === "DRIVER") ?? [];
  const [assign] = useAdminAssignOrderMutation();
  const [setStatus, { isLoading: busy }] = useAdminOrderStatusMutation();
  const [q, setQ] = useState("");
  const [cancelling, setCancelling] = useState<Order | null>(null);
  const [refund, { isLoading: refundBusy }] = useRefundOrderMutation();
  const [refunding, setRefunding] = useState<Order | null>(null);
  const sending = useRef(false);
  const closeCancel = useCallback(() => setCancelling(null), []);
  const closeRefund = useCallback(() => {
    // Stay open while Stripe is answering, so the result isn't missed.
    if (!sending.current) setRefunding(null);
  }, []);

  const rows = useMemo(
    () => (data ?? []).filter((o) => (f === "all" || o.status === f) && `${o.id} ${o.productName} ${o.customerName} ${o.farmerName ?? ""} ${o.driverName ?? ""}`.toLowerCase().includes(q.toLowerCase())),
    [data, f, q],
  );

  const select = (v: F) => {
    setF(v);
    window.history.replaceState(null, "", v === "all" ? "/admin/orders" : `/admin/orders?status=${v}`);
  };

  async function onAssign(o: Order, driverId: number) {
    try {
      await assign({ id: o.id, driverId }).unwrap();
      toast.success(`${orderRef(o.id)} assigned`, { description: `${drivers.find((d) => d.id === driverId)?.fullName} has been told.` });
    } catch (e) {
      toast.error(msg(e));
    }
  }
  async function move(o: Order, to: OrderStatus) {
    try {
      await setStatus({ id: o.id, status: to }).unwrap();
      if (to === "CANCELLED" && refundable(o)) toast.warning(`${orderRef(o.id)} cancelled, not refunded`, { description: `No money moved. Use Refund to pay ${o.customerName} back.` });
      else toast.success(to === "CANCELLED" ? `${orderRef(o.id)} cancelled` : `${orderRef(o.id)} updated`);
      setCancelling(null);
    } catch (e) {
      toast.error(msg(e));
    }
  }

  async function giveBack(o: Order) {
    if (sending.current) return;
    sending.current = true;
    const ref = orderRef(o.id);
    try {
      const saved = await refund(o.id).unwrap();
      const amount = refundAmount(saved ?? o) ?? refundAmount(o);
      toast.success(`${ref} refunded`, { description: `${amount ?? "The payment"} is going back to ${o.customerName}'s card. It can take 5 to 10 working days.` });
      setRefunding(null);
    } catch (e) {
      const status = (e as { status?: number | string }).status;
      if (status === 409) {
        toast.error(`${ref} can't be refunded`, { description: apiError(e, "There's nothing to give back on this order.") });
        setRefunding(null);
      } else if (status === 401 || status === 403 || status === 404) {
        toast.error(`${ref} wasn't refunded`, { description: apiError(e, "Sign in as an admin and try again.") });
      } else {
        // 5xx, timeout or no connection: Stripe may or may not have done it, and a repeat is safe.
        toast.error(`${ref}'s refund isn't confirmed`, { description: "Try again. It's safe to repeat, and the customer won't be refunded twice." });
      }
    } finally {
      sending.current = false;
    }
  }

  return (
    <div className="mx-auto max-w-[1280px] pb-16">
      <PageHeader title="Orders" description="Every order on the platform. Assign drivers and step in when something's stuck." />
      <div className="grid grid-cols-[minmax(0,1fr)] gap-3 px-4 md:px-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Filters id="orders" value={f} onChange={select} options={[{ id: "all" as F, label: "All", n: data?.length }, ...FLOW.map((s) => ({ id: s as F, label: s === "PENDING" ? "Waiting for driver" : statusMeta[s].label, n: data?.filter((o) => o.status === s).length }))]} />
          <Search value={q} onChange={setQ} placeholder="Search ref, item or person" />
        </div>
        <Table
          head={["Order", "Customer · farm", "Driver", "Payment", "Total", "Status", ""]}
          minWidth={960}
          loading={isLoading}
          empty={!rows.length && !isLoading ? <EmptyState icon={<Receipt className="size-5" />} title="No orders here" body="Orders with this status will show up here." /> : undefined}
        >
          {rows.map((o) => {
            const m = statusMeta[o.status];
            const pay = paymentMeta[o.paymentStatus];
            const open = o.status !== "DELIVERED" && o.status !== "CANCELLED";
            return (
              <tr key={o.id} className={tr}>
                <td className={td}>
                  <span className="block whitespace-nowrap font-medium">
                    {o.quantity} × {o.productName}
                  </span>
                  <span className="num flex items-center gap-1.5 whitespace-nowrap text-ui-sm text-app-faint">
                    {orderRef(o.id)} · {relDay(o.createdAt)}, {time(o.createdAt)}
                    {o.donationId && <Gift weight="fill" className="size-3 text-[#6B3FA0] dark:text-[#C9A8F0]" aria-label="Donation run" />}
                  </span>
                </td>
                <td className={td + " max-w-48"}>
                  <Link href={`/admin/users?open=${o.customerId}`} className="block truncate hover:underline" title="Open their details to fix an address or phone number">
                    {o.customerName}
                  </Link>
                  {o.farmerName && <span className="block truncate text-ui-sm text-app-faint">from {o.farmerName}</span>}
                </td>
                <td className={td}>
                  {open ? (
                    <select
                      aria-label={`Driver for ${orderRef(o.id)}`}
                      value={o.driverId ?? ""}
                      onChange={(e) => onAssign(o, Number(e.target.value))}
                      className={cn("h-8 max-w-40 rounded-[7px] bg-app-panel px-2 text-ui shadow-[0_0_0_1px_var(--a-line-strong)] outline-none focus:shadow-[0_0_0_1px_var(--a-accent)]", !o.driverId && "text-app-amber")}
                    >
                      {!o.driverId && <option value="">Assign driver…</option>}
                      {drivers.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.fullName}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-app-muted">{o.driverName ?? "–"}</span>
                  )}
                </td>
                <td className={td}>
                  {o.status === "CANCELLED" && refundable(o) ? (
                    <Pill tone="amber">Not refunded</Pill>
                  ) : (
                    <Pill tone={pay.tone}>{o.donationId ? "No charge" : pay.label}</Pill>
                  )}
                </td>
                <td className={td + " num"}>{o.donationId ? "–" : gbp(o.total)}</td>
                <td className={td}>
                  <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap", m.color)}>
                    <m.icon weight="fill" className="size-4" /> <span className="text-app-text">{m.label}</span>
                  </span>
                </td>
                {/* Pinned on wide screens, so Refund is never scrolled out of sight. */}
                <td className={td + " bg-app-bg lg:sticky lg:right-0"}>
                  <div className="ml-auto flex w-[142px] flex-wrap justify-end gap-1">
                    {NEXT[o.status] && (
                      <Button size="sm" className="w-full" disabled={busy} onClick={() => move(o, NEXT[o.status]!.to)}>
                        {NEXT[o.status]!.label}
                      </Button>
                    )}
                    {refundable(o) && (
                      <Button size="sm" variant="ghost" onClick={() => setRefunding(o)}>
                        Refund
                      </Button>
                    )}
                    {open && (
                      <Button size="sm" variant="ghost" className="text-app-red" onClick={() => setCancelling(o)}>
                        Cancel
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </Table>
      </div>
      <Confirm
        open={!!cancelling}
        title={`Cancel ${cancelling ? orderRef(cancelling.id) : ""}?`}
        body={
          cancelling && refundable(cancelling) ? (
            <>
              <span className="font-medium text-app-text">This doesn&apos;t refund {cancelling.customerName}.</span> No money moves. To give the money back, go back and choose Refund, which cancels the order too.
            </>
          ) : (
            "The order stops here. No money moves."
          )
        }
        action={cancelling && refundable(cancelling) ? "Cancel without refund" : "Cancel order"}
        dismiss="Go back"
        danger
        busy={busy}
        onConfirm={() => cancelling && move(cancelling, "CANCELLED")}
        onClose={closeCancel}
      />
      <Confirm
        open={!!refunding}
        title={`Refund ${refunding ? orderRef(refunding.id) : ""}?`}
        body={
          refunding && (
            <>
              <span className="font-medium text-app-text">
                {refundAmount(refunding) ?? "The order total"} goes back to {refunding.customerName}&apos;s card.
              </span>{" "}
              {refunding.status === "DELIVERED" ? "The order stays delivered." : refunding.status === "CANCELLED" ? "The order stays cancelled." : "The order is cancelled too."} Any earnings from it are reversed. This can&apos;t be undone.
            </>
          )
        }
        action={refundBusy ? "Refunding…" : refunding && refundAmount(refunding) ? `Refund ${refundAmount(refunding)}` : "Refund"}
        dismiss="Go back"
        danger
        busy={refundBusy}
        onConfirm={() => refunding && giveBack(refunding)}
        onClose={closeRefund}
      />
    </div>
  );
}
