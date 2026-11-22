"use client";

import Image from "@/components/app/AppImage";
import { HandHeart, Plus } from "@phosphor-icons/react/dist/ssr";
import { useListMyProductsQuery, useListMySurplusQuery } from "@/lib/api/farmnomad";
import { useApp } from "@/components/app/AppState";
import { PageHeader } from "@/components/app/PageHeader";
import { Button, EmptyState, Pill, Skeleton, relDay } from "@/components/app/ui";
import { cn } from "@/lib/cn";
import { FEATURES } from "@/lib/features";
import { SURPLUS_ACTION, shortDate } from "@/lib/surplus";

// Off, surplus is free stock that food groups claim. On, it's sold for less to everyone.
const DEALS = FEATURES.surplusDeals;
const DONE = DEALS ? "sold" : "claimed";

export default function SurplusManagePage() {
  const { data, isLoading } = useListMySurplusQuery();
  const { data: products } = useListMyProductsQuery();
  const { setSurplusSheet } = useApp();

  const total = data?.reduce((s, x) => s + (x.quantity ?? 0), 0) ?? 0;
  const claimed = data?.reduce((s, x) => s + ((x.quantity ?? 0) - (x.availableQuantity ?? 0)), 0) ?? 0;

  return (
    <div className="mx-auto max-w-[1000px] pb-16">
      <PageHeader
        title="Surplus"
        description={DEALS ? "Stock you're selling for less before it goes past its best." : "Stock you've offered to verified food groups nearby."}
        actions={
          <Button variant="primary" onClick={() => setSurplusSheet(true)}>
            <Plus weight="bold" className="size-3.5" /> {SURPLUS_ACTION}
          </Button>
        }
      />

      <div className="grid gap-4 px-4 md:px-8">
        <section className="flex flex-wrap items-center gap-6 rounded-xl p-5 shadow-[0_0_0_1px_var(--a-line)]" aria-label="Summary">
          <div>
            <p className="text-app-muted">{DEALS ? "Sold so far" : "Claimed so far"}</p>
            <p className="num mt-1 font-display text-[28px] font-medium leading-none tracking-[-0.03em]">
              {claimed} <span className="text-[15px] text-app-faint">of {total} units</span>
            </p>
          </div>
          <div className="min-w-[200px] flex-1">
            <div className="h-2 overflow-hidden rounded-full bg-app-hover" role="img" aria-label={`${claimed} of ${total} units ${DONE}`}>
              <div className="h-full rounded-full bg-app-accent transition-[width] duration-700 ease-out" style={{ width: total ? `${(claimed / total) * 100}%` : 0 }} />
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl shadow-[0_0_0_1px_var(--a-line)]" aria-label="Surplus listings">
          {isLoading ? (
            <div className="grid gap-2 p-5">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !data?.length ? (
            <EmptyState
              icon={<HandHeart className="size-5" />}
              title={DEALS ? "No surplus on sale" : "Nothing flagged yet"}
              body={DEALS ? "When something won't sell in time, offer it for less here. To give food away free, donate it instead." : "When something won't sell in time, flag it here and food groups nearby can claim it."}
              action={<Button variant="primary" onClick={() => setSurplusSheet(true)}>{SURPLUS_ACTION}</Button>}
            />
          ) : (
            <ul>
              {data.map((s) => {
                const p = products?.find((x) => x.id === s.productId);
                const q = s.quantity ?? 0;
                const left = s.availableQuantity ?? 0;
                const status = left === 0 ? { label: DEALS ? "Sold out" : "Fully claimed", tone: "green" as const } : left < q ? { label: DEALS ? "Selling" : "Partly claimed", tone: "blue" as const } : { label: DEALS ? "On sale" : "Waiting for a claim", tone: "amber" as const };
                return (
                  <li key={s.id} className="flex items-center gap-4 border-b border-app-line px-5 py-3.5 last:border-0">
                    <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-app-hover">
                      {p?.coverImageUrl && <Image src={p.coverImageUrl} alt="" width={64} height={64} className="size-9 object-contain" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{s.productName}</p>
                      <p className="text-ui-sm text-app-faint">
                        {DEALS && s.pricePence ? `£${(s.pricePence / 100).toFixed(2)} each${s.endsAt ? ` until ${shortDate(s.endsAt)}` : ""} · ` : ""}
                        {DEALS ? "Listed" : "Flagged"} {s.createdAt ? relDay(s.createdAt).toLowerCase() : ""}
                      </p>
                    </div>
                    <div className="hidden w-40 sm:block">
                      <div className="flex justify-between text-ui-sm">
                        <span className="num">{q - left} {DONE}</span>
                        <span className="num text-app-faint">of {q}</span>
                      </div>
                      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-app-hover">
                        <div className={cn("h-full rounded-full", left === 0 ? "bg-app-accent" : "bg-app-blue")} style={{ width: `${((q - left) / Math.max(1, q)) * 100}%` }} />
                      </div>
                    </div>
                    <Pill tone={status.tone}>{status.label}</Pill>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
        <p className="text-ui-sm text-app-faint">{DEALS ? "Buyers see the usual price struck through next to yours. Anything left at the end date goes back to its usual price." : "Food groups are verified before they can claim. You'll get a notification when someone does."}</p>
      </div>
    </div>
  );
}
