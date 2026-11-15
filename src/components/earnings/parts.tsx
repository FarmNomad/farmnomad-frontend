"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { ArrowSquareOut, Bank, HourglassMedium, Info, Warning } from "@phosphor-icons/react/dist/ssr";
import { Button, Pill, type Tone } from "@/components/app/ui";
import { cn } from "@/lib/cn";
import { formatPence, requirementText, type EarningLine, type EarningStatus, type EarningsSummary, type PayoutLine } from "@/lib/types/earnings";

/**
 * The seller-facing money UI. The words matter: this is "Earnings", never a wallet or a balance,
 * and there is no withdraw button. Stripe holds the money and pays it out on a schedule;
 * FarmNomad only says where it goes.
 */

const day = (iso: string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }) => new Date(iso).toLocaleDateString("en-GB", opts);
const card = "rounded-xl shadow-[0_0_0_1px_var(--a-line)]";

/* ───────── Status pill ───────── */

const STATUS: Record<EarningStatus, { tone: Tone; label: string }> = {
  CLEARING: { tone: "amber", label: "Clearing" },
  AVAILABLE: { tone: "blue", label: "Available" },
  TRANSFERRED: { tone: "blue", label: "On its way" },
  PAID_OUT: { tone: "green", label: "Paid out" },
  FAILED: { tone: "red", label: "Needs attention" },
  REVERSED: { tone: "neutral", label: "Reversed" },
};

/** FAILED is a button: a seller is never shown a red pill with no way to act on it. */
export function PayoutStatusPill({ status, onExplain }: { status: EarningStatus; onExplain?: () => void }) {
  const s = STATUS[status];
  if (status === "FAILED" && onExplain)
    return (
      <button type="button" onClick={onExplain} className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-app-accent" aria-label="Needs attention. Show what to do">
        <Pill tone={s.tone} className="cursor-pointer underline decoration-dotted underline-offset-2">
          {s.label}
        </Pill>
      </button>
    );
  return <Pill tone={s.tone}>{s.label}</Pill>;
}

/* ───────── Balance card ───────── */

function Figure({ label, pence, tip }: { label: string; pence: number; tip: string }) {
  return (
    <div className="p-5">
      <dt className="flex items-center gap-1.5 text-app-muted">
        {label}
        <span title={tip} aria-label={tip} role="img" className="cursor-help text-app-faint">
          <Info className="size-3.5" />
        </span>
      </dt>
      <dd className="num mt-2 font-display text-[28px] font-medium leading-none tracking-[-0.03em]">{formatPence(pence)}</dd>
      <p className="mt-2 text-ui-sm text-app-faint">{tip}</p>
    </div>
  );
}

/** The three numbers and the next-payout line. Clearing comes first: it's what a seller looks for after a delivery. */
export function EarningsBalanceCard({ summary, driver, hidePayoutDate }: { summary: EarningsSummary; driver?: boolean; hidePayoutDate?: boolean }) {
  const due = summary.nextPayoutPence || summary.availablePence;
  let next: ReactNode;
  if (driver && due > 0)
    next = (
      <>
        Next payout: <strong className="font-medium text-app-text">tomorrow</strong> · {formatPence(due)}
      </>
    );
  else if (summary.nextPayoutDate)
    next = (
      <>
        Next payout: <strong className="font-medium text-app-text">{day(summary.nextPayoutDate, { weekday: "long", day: "numeric", month: "long" })}</strong> · {formatPence(summary.nextPayoutPence)}
      </>
    );
  else next = "No payout scheduled. You'll see one here once you have cleared earnings.";

  return (
    <section aria-label="Earnings" className={card}>
      <dl className="grid divide-y divide-app-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <Figure label="Clearing" pence={summary.clearingPence} tip={driver ? "Delivered recently. Released automatically." : "Delivered in the last 3 days. Released automatically."} />
        <Figure label="Available" pence={summary.availablePence} tip="Ready for your next payout." />
        <Figure label="Paid out" pence={summary.paidOutPence} tip="Total sent to your bank." />
      </dl>
      {!hidePayoutDate && <p className="border-t border-app-line px-5 py-3.5 text-app-muted">{next}</p>}
    </section>
  );
}

/* ───────── Transactions ───────── */

const th = "px-4 py-2.5 text-left text-ui-sm font-medium text-app-faint";
const td = "px-4 py-3 align-top";

export function EarningsTable({ lines, driver, onOpenStripe }: { lines: EarningLine[]; driver?: boolean; onOpenStripe: () => void }) {
  const [month, setMonth] = useState("all");
  const [explain, setExplain] = useState<number | null>(null);
  const months = useMemo(() => [...new Set(lines.map((l) => l.date.slice(0, 7)))].sort().reverse(), [lines]);
  const rows = useMemo(() => lines.filter((l) => month === "all" || l.date.startsWith(month)).sort((a, b) => b.date.localeCompare(a.date)), [lines, month]);

  return (
    <section aria-labelledby="earn-title" className={cn(card, "overflow-hidden")}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-app-line px-4 py-3">
        <h2 id="earn-title" className="font-medium">
          Earnings
        </h2>
        {months.length > 0 && (
          <select aria-label="Month" value={month} onChange={(e) => setMonth(e.target.value)} className="h-8 rounded-[7px] bg-app-panel px-2 text-ui-sm outline-none shadow-[0_0_0_1px_var(--a-line-strong)] focus:shadow-[0_0_0_1px_var(--a-accent),0_0_0_4px_var(--a-accent-soft)]">
            <option value="all">All months</option>
            {months.map((m) => (
              <option key={m} value={m}>
                {day(`${m}-01`, { month: "long", year: "numeric" })}
              </option>
            ))}
          </select>
        )}
      </div>
      {rows.length === 0 ? (
        <p className="px-6 py-14 text-center text-app-muted">{lines.length ? "Nothing in that month." : "No earnings yet. They'll appear here once your first order is delivered."}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse">
            <thead>
              <tr className="border-b border-app-line">
                <th className={th}>Date</th>
                <th className={th}>Order</th>
                <th className={th}>{driver ? "Delivery" : "Item"}</th>
                <th className={cn(th, "text-right")}>{driver ? "Delivery fee" : "Gross"}</th>
                {!driver && <th className={cn(th, "text-right")}>Commission</th>}
                <th className={cn(th, "text-right")}>Net</th>
                <th className={th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((l) => {
                // Shown on every row, with the percentage: no deduction a seller wasn't told about.
                const pct = l.grossPence ? Math.round((l.commissionPence / l.grossPence) * 100) : 0;
                return [
                  <tr key={l.id} className="border-b border-app-line last:border-0">
                    <td className={cn(td, "num whitespace-nowrap text-app-muted")}>{day(l.date, { day: "numeric", month: "short" })}</td>
                    <td className={td}>
                      <Link href={driver ? `/jobs/${l.orderId}` : `/orders/${l.orderId}`} className="num font-medium underline-offset-2 hover:underline">
                        #{l.orderId}
                      </Link>
                    </td>
                    <td className={td}>{l.label}</td>
                    <td className={cn(td, "num text-right")}>{formatPence(l.grossPence)}</td>
                    {!driver && (
                      <td className={cn(td, "num whitespace-nowrap text-right text-app-muted")}>
                        −{formatPence(l.commissionPence)} ({pct}%)
                      </td>
                    )}
                    <td className={cn(td, "num text-right font-medium")}>{formatPence(l.netPence)}</td>
                    <td className={td}>
                      <PayoutStatusPill status={l.status} onExplain={() => setExplain(explain === l.id ? null : l.id)} />
                    </td>
                  </tr>,
                  explain === l.id && (
                    <tr key={`${l.id}-why`} className="border-b border-app-line bg-app-red-soft last:border-0">
                      <td colSpan={driver ? 6 : 7} className="px-4 py-3">
                        <p>
                          <span className="font-medium">This payout didn&apos;t reach your bank.</span> It usually means the bank details Stripe holds are out of date. Check them and the payout is sent again automatically.
                        </p>
                        <Button size="sm" className="mt-2" onClick={onOpenStripe}>
                          Check payout details <ArrowSquareOut className="size-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ),
                ];
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

/* ───────── Past payouts ───────── */

const PAYOUT: Record<PayoutLine["status"], { tone: Tone; label: string }> = {
  PENDING: { tone: "blue", label: "On its way" },
  PAID: { tone: "green", label: "Paid" },
  FAILED: { tone: "red", label: "Failed" },
};

export function PayoutHistoryTable({ payouts }: { payouts: PayoutLine[] }) {
  if (!payouts.length) return null;
  return (
    <section aria-labelledby="payouts-title" className={cn(card, "overflow-hidden")}>
      <h2 id="payouts-title" className="border-b border-app-line px-4 py-3 font-medium">
        Payouts to your bank
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] border-collapse">
          <thead>
            <tr className="border-b border-app-line">
              <th className={th}>Date</th>
              <th className={th}>Bank account</th>
              <th className={cn(th, "text-right")}>Amount</th>
              <th className={th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {payouts.map((p) => (
              <tr key={p.id} className="border-b border-app-line last:border-0">
                <td className={cn(td, "num whitespace-nowrap text-app-muted")}>{day(p.date)}</td>
                <td className={cn(td, "num")}>•••• {p.bankLast4}</td>
                <td className={cn(td, "num text-right font-medium")}>{formatPence(p.amountPence)}</td>
                <td className={td}>
                  <Pill tone={PAYOUT[p.status].tone}>{PAYOUT[p.status].label}</Pill>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ───────── State 1: not set up ───────── */

export function OnboardingEmptyState({ summary, onSetup, busy }: { summary: EarningsSummary; onSetup: () => void; busy: boolean }) {
  const waiting = summary.clearingPence + summary.availablePence;
  return (
    <section className={cn(card, "grid justify-items-center px-6 py-14 text-center")}>
      <div className="grid size-14 place-items-center rounded-2xl bg-app-accent-soft text-app-accent">
        <Bank weight="duotone" className="size-7" />
      </div>
      <h2 className="mt-5 font-display text-[22px] font-medium tracking-[-0.02em]">Set up payouts to get paid</h2>
      {waiting > 0 && (
        <p className="mt-3 rounded-full bg-app-accent-soft px-3.5 py-1.5 font-medium text-app-accent">
          <span className="num">{formatPence(waiting)}</span> is waiting for you. Set up payouts to receive it.
        </p>
      )}
      <p className="mt-3 max-w-[46ch] text-app-muted">You&apos;ll be taken to Stripe to confirm your identity and bank details. It takes about five minutes, and FarmNomad never sees your bank details.</p>
      <Button variant="primary" className="mt-6 h-10 px-5" onClick={onSetup} disabled={busy}>
        {busy ? "Opening Stripe…" : "Set up payouts"}
      </Button>
    </section>
  );
}

/* ───────── State 2: verifying ───────── */

/** No spinner: this isn't a request in flight, it's a state that can last days. */
export function VerifyingState({ onCheck, busy }: { onCheck: () => void; busy: boolean }) {
  return (
    <section className={cn(card, "flex flex-wrap items-start gap-4 p-5")}>
      <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-app-blue-soft text-app-blue">
        <HourglassMedium weight="duotone" className="size-5" />
      </div>
      <div className="min-w-0 flex-1 basis-[30ch]">
        <h2 className="font-display text-[20px] font-medium tracking-[-0.02em]">We&apos;re verifying your details</h2>
        <p className="mt-1 text-app-muted">Stripe is checking the information you provided. This usually takes a few minutes but can take up to a few days.</p>
        <button type="button" onClick={onCheck} disabled={busy} className="mt-3 inline-flex items-center gap-1.5 font-medium text-app-accent hover:underline disabled:opacity-60">
          Check your details <ArrowSquareOut className="size-3.5" />
        </button>
      </div>
    </section>
  );
}

/* ───────── State 4: action needed ───────── */

export function RequirementsBanner({ requirements, onComplete, busy }: { requirements: string[]; onComplete: () => void; busy: boolean }) {
  return (
    <section role="alert" className="flex flex-wrap items-start gap-4 rounded-xl bg-app-amber-soft p-5">
      <Warning weight="fill" className="mt-0.5 size-5 shrink-0 text-app-amber" />
      <div className="min-w-0 flex-1 basis-[30ch]">
        <h2 className="font-medium">Stripe needs more information before you can be paid.</h2>
        <ul className="mt-2 list-disc pl-5 text-app-muted">
          {requirements.map((r) => (
            <li key={r}>{requirementText(r)}</li>
          ))}
        </ul>
        <p className="mt-2 text-app-muted">Your earnings keep adding up in the meantime. Only the payout to your bank is on hold.</p>
      </div>
      <Button variant="primary" onClick={onComplete} disabled={busy}>
        {busy ? "Opening Stripe…" : "Complete verification"}
      </Button>
    </section>
  );
}
