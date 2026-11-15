"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useGetConnectDashboardLinkMutation, useGetEarningTransactionsQuery, useGetEarningsSummaryQuery, useGetPayoutHistoryQuery, useStartConnectOnboardingMutation } from "@/lib/api/farmnomad";
import { apiError } from "@/lib/api/errors";
import { useApp } from "@/components/app/AppState";
import { PageHeader } from "@/components/app/PageHeader";
import { Skeleton } from "@/components/app/ui";
import { EarningsBalanceCard, EarningsTable, OnboardingEmptyState, PayoutHistoryTable, RequirementsBanner, VerifyingState } from "@/components/earnings/parts";
import { cn } from "@/lib/cn";
import { EARNINGS_PREVIEWS, PREVIEW_EARNINGS, PREVIEW_PAYOUTS, earningsState, type EarningsState } from "@/lib/types/earnings";

const DEV = process.env.NODE_ENV === "development";
const PREVIEWS: [EarningsState | null, string][] = [
  [null, "Live"],
  ["setup", "Not set up"],
  ["verifying", "Verifying"],
  ["active", "Active"],
  ["action", "Action needed"],
];

/**
 * Earnings: what a farmer, kitchen or driver has earned and when it reaches their bank.
 * One of four screens, chosen from the summary alone (never from local state or a return URL):
 * a seller can finish Stripe's setup on another device, or be asked for more documents later.
 */
export default function EarningsPage() {
  const { role } = useApp();
  const driver = role === "DRIVER";

  // Development only: look at each screen without a backend that can produce it.
  const [preview, setPreview] = useState<EarningsState | null>(null);

  const live = useGetEarningsSummaryQuery();
  const liveLines = useGetEarningTransactionsQuery();
  const livePayouts = useGetPayoutHistoryQuery();
  const [startOnboarding, onboarding] = useStartConnectOnboardingMutation();
  const [dashboardLink, dashboard] = useGetConnectDashboardLinkMutation();

  const summary = DEV && preview ? EARNINGS_PREVIEWS[preview] : live.data;
  const lines = DEV && preview ? (preview === "setup" ? [] : PREVIEW_EARNINGS) : (liveLines.data ?? []);
  const payouts = DEV && preview ? (preview === "active" || preview === "action" ? PREVIEW_PAYOUTS : []) : (livePayouts.data ?? []);

  // Both links are single-use and short-lived, so each click asks for a fresh one.
  async function go(fetchLink: () => Promise<{ url: string }>, failed: string) {
    try {
      const { url } = await fetchLink();
      window.location.href = url; // Stripe's site: a full navigation, not the router
    } catch (err) {
      toast.error(failed, { description: apiError(err, "Try again in a moment.") });
    }
  }
  const setup = () => go(() => startOnboarding().unwrap(), "Couldn't start payout setup");
  const openStripe = () => go(() => dashboardLink().unwrap(), "Couldn't open your payout details");

  const state = summary ? earningsState(summary) : null;

  return (
    <div className="mx-auto max-w-[960px] pb-16">
      <PageHeader title="Earnings" description={driver ? "What you've earned from deliveries, and when it reaches your bank." : "What you've earned from sales, and when it reaches your bank."} />

      {DEV && (
        <div className="mx-4 mb-4 flex flex-wrap items-center gap-1.5 rounded-xl border border-dashed border-app-line-strong p-2.5 text-ui-sm text-app-faint md:mx-8">
          <span className="mr-1">Development preview:</span>
          {PREVIEWS.map(([id, label]) => (
            <button key={label} type="button" aria-pressed={preview === id} onClick={() => setPreview(id)} className={cn("h-6 rounded-full px-2.5 font-medium transition-colors", preview === id ? "bg-app-primary text-app-on-primary" : "text-app-muted hover:bg-app-hover")}>
              {label}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-4 px-4 md:px-8">
        {!summary || !state ? (
          live.isError ? (
            <p className="rounded-xl px-6 py-14 text-center text-app-muted shadow-[0_0_0_1px_var(--a-line)]">We couldn&apos;t load your earnings. Refresh the page to try again.</p>
          ) : (
            <>
              <Skeleton className="h-[150px] w-full rounded-xl" />
              <Skeleton className="h-[220px] w-full rounded-xl" />
            </>
          )
        ) : state === "setup" ? (
          <OnboardingEmptyState summary={summary} onSetup={setup} busy={onboarding.isLoading} />
        ) : (
          <>
            {state === "action" && <RequirementsBanner requirements={summary.requirementsDue} onComplete={setup} busy={onboarding.isLoading} />}
            {state === "verifying" && <VerifyingState onCheck={openStripe} busy={dashboard.isLoading} />}
            {/* While verifying, the figures show only if there is something to show, and without payout dates. */}
            {(state !== "verifying" || summary.clearingPence + summary.availablePence + summary.paidOutPence > 0) && <EarningsBalanceCard summary={summary} driver={driver} hidePayoutDate={state !== "active"} />}
            <EarningsTable lines={lines} driver={driver} onOpenStripe={openStripe} />
            <PayoutHistoryTable payouts={payouts} />
          </>
        )}
      </div>
    </div>
  );
}
