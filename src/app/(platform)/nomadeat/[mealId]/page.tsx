"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, ChatsCircle, ForkKnife, MapPin, Plant, Storefront } from "@phosphor-icons/react/dist/ssr";
import { useGetMealQuery, useListMealsQuery, useMeQuery, useOrderMealMutation } from "@/lib/api/farmnomad";
import { Lightbox } from "@/components/app/shop/Gallery";
import { QtyStepper } from "@/components/app/shop/QtyStepper";
import { DietTags, MealArt } from "@/components/app/meals/meta";
import { Button, EmptyState, Skeleton, gbp } from "@/components/app/ui";
import { cn } from "@/lib/cn";
import { FEATURES } from "@/lib/features";
import { apiError } from "@/lib/api/errors";
import { PaymentCancelled } from "@/components/app/meals/PaymentNotice";

/** One meal: what it is, who cooks it, which farms it came from, and order. */
export default function MealPage() {
  const { mealId } = useParams<{ mealId: string }>();
  const { data: m, isLoading, isError } = useGetMealQuery(Number(mealId));
  const { data: all } = useListMealsQuery();
  const { data: me } = useMeQuery();
  const [order, { isLoading: ordering }] = useOrderMealMutation();
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");
  const [viewer, setViewer] = useState<number | null>(null);
  const [leaving, setLeaving] = useState(false);
  // A second click can land before the disabled button renders, and would reserve the portions twice.
  const starting = useRef(false);

  // Back from Stripe can restore this page as it was left, with the button still disabled.
  useEffect(() => {
    const reset = () => {
      starting.current = false;
      setLeaving(false);
    };
    window.addEventListener("pageshow", reset);
    return () => window.removeEventListener("pageshow", reset);
  }, []);

  if (isLoading)
    return (
      <div className="mx-auto grid max-w-[1100px] gap-8 px-4 py-8 md:grid-cols-2 md:px-8">
        <Skeleton className="aspect-[4/3] rounded-3xl" />
        <div className="grid content-start gap-3">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-24" />
        </div>
      </div>
    );
  if (isError || !m)
    return (
      <EmptyState
        icon={<ForkKnife className="size-5" />}
        title="That meal isn't available"
        body="It may have sold out today."
        action={
          <Link href="/nomadeat">
            <Button>Back to NomadEat</Button>
          </Link>
        }
      />
    );

  const out = !m.available || m.portionsAvailable === 0;
  const mineToCook = me?.role === "KITCHEN" && m.kitchenId === me.id;
  const more = all?.filter((x) => x.kitchenId === m.kitchenId && x.id !== m.id).slice(0, 3) ?? [];

  async function place() {
    if (!m || starting.current) return;
    starting.current = true;
    try {
      const res = await order({ mealId: m.id, quantity: qty, note: note.trim() || undefined }).unwrap();
      // Only ever follow a web address. Without one there is no payment, so no order to announce.
      if (!/^https?:\/\//i.test(res?.checkoutUrl ?? "")) {
        starting.current = false;
        toast.error("Couldn't open payment", { description: "The server didn't send a payment link. You haven't been charged." });
        return;
      }
      setLeaving(true);
      window.location.assign(res.checkoutUrl);
    } catch (e) {
      starting.current = false;
      toast.error("Couldn't start your order", { description: apiError(e, "You haven't been charged. Try again in a moment.") });
    }
  }

  return (
    <div className="pb-16">
      <div className="mx-auto max-w-[1100px] px-4 pt-5 md:px-8">
        <Link href="/nomadeat" className="inline-flex items-center gap-1.5 text-app-muted transition-colors hover:text-app-text">
          <ArrowLeft className="size-4" /> NomadEat
        </Link>
      </div>
      <div className="mx-auto mt-4 max-w-[1100px] px-4 empty:hidden md:px-8">
        <PaymentCancelled />
      </div>
      <div className="mx-auto mt-5 grid max-w-[1100px] items-start gap-8 px-4 md:grid-cols-2 md:gap-12 md:px-8">
        <div className="grid gap-3">
          <button onClick={() => m.imageUrls.length && setViewer(0)} className={cn("block overflow-hidden rounded-3xl", !m.imageUrls.length && "cursor-default")} aria-label={m.imageUrls.length ? "View photos" : undefined} tabIndex={m.imageUrls.length ? 0 : -1}>
            <MealArt meal={m} className={cn("aspect-[4/3]", out && "opacity-50 grayscale")} sizes="(min-width: 768px) 50vw, 100vw" />
          </button>
          {m.imageUrls.length > 1 && (
            <div className="flex gap-2">
              {m.imageUrls.slice(1, 5).map((src, i) => (
                <button key={src} onClick={() => setViewer(i + 1)} className="overflow-hidden rounded-xl" aria-label={`Photo ${i + 2}`}>
                  <MealArt meal={{ ...m, imageUrls: [src] }} className="size-16" sizes="64px" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="text-app-muted">{m.cuisine}</p>
          <h1 className="mt-1 font-display text-[34px] font-medium leading-[1.1] tracking-[-0.03em]">{m.name}</h1>
          <DietTags tags={m.dietary} className="mt-3" />
          <p className="mt-4 text-app-muted">{m.description}</p>

          <div className="mt-6 flex items-baseline gap-3">
            <p className="num font-display text-[30px] font-medium tracking-[-0.03em]">{gbp(m.price)}</p>
            <p className="text-app-faint">per portion</p>
            <p className={cn("ml-auto text-ui-sm", out ? "text-app-red" : m.portionsAvailable <= 3 ? "text-app-amber" : "text-app-muted")}>{out ? "Sold out for today" : `${m.portionsAvailable} portions left`}</p>
          </div>

          {!out && !mineToCook && !FEATURES.mealOrders && (
            <p className="mt-5 rounded-2xl bg-app-hover p-4 text-app-muted">Ordering from NomadEat opens soon. You can browse the kitchens and their menus for now.</p>
          )}
          {(!out || leaving) && !mineToCook && FEATURES.mealOrders && (
            <div className="mt-5 grid gap-3 rounded-2xl p-4 shadow-[0_0_0_1px_var(--a-line)]">
              <div className="flex items-center gap-3">
                <QtyStepper value={qty} max={m.portionsAvailable} label={m.name} removable={false} onChange={(n) => setQty(Math.max(1, n))} />
                <Button variant="primary" className="h-10 flex-1" disabled={ordering || leaving} onClick={place}>
                  {ordering || leaving ? (
                    "Opening payment…"
                  ) : (
                    <>
                      Continue to payment · <span className="num">{gbp(m.price * qty)}</span>
                    </>
                  )}
                </Button>
              </div>
              <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={120} placeholder="Note for the kitchen (optional)" className="h-9 rounded-[8px] bg-app-hover px-3 text-ui outline-none placeholder:text-app-faint focus:shadow-[inset_0_0_0_1px_var(--a-accent)]" />
              <p className="text-ui-sm text-app-faint">Your card is held now and only charged when the kitchen starts cooking. If they can&apos;t make it, you aren&apos;t charged. Collect from the kitchen when it&apos;s ready.</p>
            </div>
          )}
          {mineToCook && (
            <Link href="/meals" className="mt-5 block">
              <Button className="w-full">Edit this meal on your menu</Button>
            </Link>
          )}

          <div className="mt-6 grid gap-3">
            <div className="flex items-center gap-3 rounded-xl p-3.5 shadow-[0_0_0_1px_var(--a-line)]">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-app-hover text-app-muted">
                <Storefront weight="duotone" className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{m.kitchenName}</p>
                {m.kitchenArea && (
                  <p className="flex items-center gap-1 text-ui-sm text-app-faint">
                    <MapPin className="size-3.5" /> {m.kitchenArea}
                  </p>
                )}
              </div>
              {!mineToCook && !!m.kitchenId && (
                <Link href={`/messages?to=${m.kitchenId}&name=${encodeURIComponent(m.kitchenName ?? "")}`} aria-label={`Message ${m.kitchenName}`} className="grid size-9 place-items-center rounded-full bg-app-hover text-app-muted transition-colors hover:text-app-text">
                  <ChatsCircle className="size-4" />
                </Link>
              )}
            </div>
            {!!m.farms?.length && (
              <div className="rounded-xl bg-app-accent-soft p-4">
                <p className="flex items-center gap-1.5 font-medium text-app-accent">
                  <Plant weight="fill" className="size-4" /> Made with produce from
                </p>
                <p className="mt-1 text-app-muted">{m.farms.join(", ")}, farms selling on FarmNomad.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {more.length > 0 && (
        <section className="mx-auto mt-16 max-w-[1100px] px-4 md:px-8" aria-labelledby="more">
          <h2 id="more" className="font-display text-[22px] font-medium tracking-[-0.02em]">
            More from {m.kitchenName}
          </h2>
          <ul className="mt-5 grid gap-4 sm:grid-cols-3">
            {more.map((x) => (
              <li key={x.id}>
                <Link href={`/nomadeat/${x.id}`} className="group block overflow-hidden rounded-2xl shadow-[0_0_0_1px_var(--a-line)]">
                  <MealArt meal={x} className="aspect-[16/10]" />
                  <div className="flex items-baseline justify-between gap-3 p-3.5">
                    <p className="truncate font-medium">{x.name}</p>
                    <p className="num shrink-0">{gbp(x.price)}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      <Lightbox images={m.imageUrls} index={viewer} name={m.name} onClose={() => setViewer(null)} />
    </div>
  );
}
