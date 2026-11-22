"use client";

import Image from "@/components/app/AppImage";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Minus, Plus } from "@phosphor-icons/react/dist/ssr";
import { useCreateDonationMutation, useCreateSurplusMutation, useListMyProductsQuery } from "@/lib/api/farmnomad";
import { daysUntil, stockState } from "@/lib/types/api";
import { FEATURES } from "@/lib/features";
import { shortDate } from "@/lib/surplus";
import { cn } from "@/lib/cn";
import { useApp, type SurplusPreset } from "./AppState";
import { Field, input } from "./ProductSheet";
import { Sheet } from "./Sheet";
import { Button, Pill, gbp } from "./ui";

const COMMISSION = 0.1; // what FarmNomad keeps of a sale; delivery fees aren't commissioned
const isoDay = (d: Date) => d.toISOString().slice(0, 10);
const inDays = (n: number) => isoDay(new Date(Date.now() + n * 86400000));

/**
 * Two modes share one form: pick one of your products (never a raw ID, spec 1.9), then how much.
 * - surplus: with surplus deals on, sell it for less to everyone until a date (POST /surplus with
 *   pricePence and endsAt). Off, flag it for verified food groups to claim free, as before.
 * - donate: give it away free to verified food groups (POST /donations {productId, quantity, note}).
 */
export function SurplusSheet({ mode = "surplus" }: { mode?: "surplus" | "donate" }) {
  const app = useApp();
  const donate = mode === "donate";
  const deals = !donate && FEATURES.surplusDeals;
  const open = donate ? !!app.donateSheet : !!app.surplusSheet;
  const surplusPreset: SurplusPreset | undefined = !donate && typeof app.surplusSheet === "object" ? app.surplusSheet : undefined;
  const presetId = donate ? app.donateSheet?.productId : surplusPreset?.productId;
  // Only farmers have products; other roles would just get "no access" from the API.
  const { data: products = [] } = useListMyProductsQuery(undefined, { skip: app.role !== "FARMER" });
  const [createSurplus, s1] = useCreateSurplusMutation();
  const [createDonation, s2] = useCreateDonationMutation();
  const isLoading = s1.isLoading || s2.isLoading;
  const [pid, setPid] = useState<number | null>(null);
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");
  const [price, setPrice] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [tried, setTried] = useState(false);

  // Soonest best-before first: those are the ones worth flagging.
  const sorted = useMemo(
    () => products.filter((p) => p.quantityAvailable > 0).sort((a, b) => (a.bestBeforeDate ?? "9").localeCompare(b.bestBeforeDate ?? "9")),
    [products],
  );
  const chosen = sorted.find((p) => p.id === pid);
  const max = chosen?.quantityAvailable ?? 1;
  const today = inDays(0);
  // A deal can't outlast the food.
  const lastDay = chosen?.bestBeforeDate && chosen.bestBeforeDate >= today ? chosen.bestBeforeDate : undefined;
  const pastDate = !!chosen?.bestBeforeDate && chosen.bestBeforeDate < today;

  function pick(id: number | null, keepPreset = false) {
    setPid(id);
    const p = sorted.find((x) => x.id === id);
    // A suggestion's numbers apply only to the product it was about.
    const sp = keepPreset && surplusPreset?.productId === id ? surplusPreset : undefined;
    setQty(Math.min(p?.quantityAvailable ?? 1, Math.max(1, sp?.quantity ?? 1)));
    setPrice(sp?.pricePence ? (sp.pricePence / 100).toFixed(2) : "");
    const bb = p?.bestBeforeDate && p.bestBeforeDate >= today ? p.bestBeforeDate : undefined;
    const wanted = sp?.endsAt ?? undefined;
    setEndsAt(wanted && wanted >= today && (!bb || wanted <= bb) ? wanted : bb && bb < inDays(3) ? bb : inDays(3));
  }

  useEffect(() => {
    if (!open) return;
    setNote("");
    setTried(false);
    pick(presetId ?? sorted[0]?.id ?? null, true);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const close = () => (donate ? app.setDonateSheet(null) : app.setSurplusSheet(false));

  const pence = Math.round(Number(price) * 100);
  const usual = chosen ? Math.round(chosen.price * 100) : 0;
  const priceError = !deals ? undefined : !(pence > 0) ? "Set the surplus price." : pence >= usual ? `Make it less than the usual ${gbp(chosen?.price ?? 0)}.` : undefined;
  const endError = !deals ? undefined : !endsAt || endsAt < today ? "Pick today or a later day." : lastDay && endsAt > lastDay ? `It can't run past the best-before date, ${shortDate(lastDay)}.` : undefined;
  const off = usual && pence > 0 && pence < usual ? Math.round((1 - pence / usual) * 100) : null;

  async function submit() {
    if (!chosen) return;
    setTried(true);
    if (deals && (priceError || endError || pastDate)) return;
    try {
      if (donate) {
        await createDonation({ productId: chosen.id, quantity: qty, note: note.trim() || undefined }).unwrap();
        toast.success("Donation listed", { description: `Verified food groups nearby can now claim ${qty} × ${chosen.name}.` });
      } else if (deals) {
        await createSurplus({ productId: chosen.id, quantity: qty, pricePence: pence, endsAt, suggestionId: surplusPreset?.suggestionId }).unwrap();
        toast.success("Surplus on sale", { description: `${qty} × ${chosen.name} at ${gbp(pence / 100)} until ${shortDate(endsAt)}.` });
      } else {
        await createSurplus({ productId: chosen.id, quantity: qty }).unwrap();
        toast.success("Surplus flagged", { description: `Food groups nearby can now claim ${qty} × ${chosen.name}.` });
      }
      close();
    } catch (e) {
      toast.error((e as { data?: { message?: string } })?.data?.message ?? "That didn't go through", { description: "Try again in a moment." });
    }
  }

  return (
    <Sheet
      open={open}
      onClose={close}
      title={donate ? "Donate produce" : deals ? "Sell as surplus" : "Flag surplus"}
      subtitle={
        donate
          ? "Free to verified food banks, schools and community groups nearby. It comes off your stock."
          : deals
            ? "Everyone on FarmNomad sees it for less until the date you choose. To give food away free, donate it instead."
            : "Verified food groups nearby are told straight away."
      }
      footer={
        <>
          <Button variant="ghost" onClick={close}>Cancel</Button>
          <Button variant="primary" onClick={submit} disabled={!chosen || isLoading || (deals && pastDate)}>
            {donate ? "Donate" : deals ? "Put on sale:" : "Flag"} {qty} {qty === 1 ? "unit" : "units"}
          </Button>
        </>
      }
    >
      <div className="grid gap-5 px-5 py-5">
        <div className="grid gap-1.5">
          <p className="font-medium">Product</p>
          <div role="radiogroup" aria-label="Product" className="grid gap-1 rounded-[9px] p-1 shadow-[0_0_0_1px_var(--a-line-strong)]">
            {sorted.map((p) => {
              const d = p.bestBeforeDate ? daysUntil(p.bestBeforeDate) : null;
              const s = stockState(p);
              return (
                <button
                  key={p.id}
                  type="button"
                  role="radio"
                  aria-checked={pid === p.id}
                  onClick={() => pick(p.id)}
                  className={cn("flex items-center gap-3 rounded-[7px] px-2 py-1.5 text-left transition-colors", pid === p.id ? "bg-app-active" : "hover:bg-app-hover")}
                >
                  <span className={cn("grid size-4 place-items-center rounded-full shadow-[inset_0_0_0_1.5px_var(--a-line-strong)]", pid === p.id && "shadow-[inset_0_0_0_5px_var(--a-accent)]")} />
                  <span className="grid size-8 place-items-center rounded-md bg-app-hover">
                    {p.coverImageUrl && <Image src={p.coverImageUrl} alt="" width={48} height={48} className="size-7 object-contain" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{p.name}</span>
                    <span className="num text-ui-sm text-app-faint">
                      {p.quantityAvailable} in stock{deals ? ` · ${gbp(p.price)} each` : ""}
                    </span>
                  </span>
                  {d !== null && (s === "expiring" || s === "expired") ? (
                    <Pill tone={s === "expired" ? "red" : "amber"}>{d < 0 ? "Past date" : d === 0 ? "Today" : `${d}d left`}</Pill>
                  ) : d !== null ? (
                    <span className="num text-ui-sm text-app-faint">{d}d left</span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        {deals && pastDate && (
          <p role="alert" className="rounded-lg bg-app-red-soft px-3 py-2 text-ui-sm text-app-text">
            {chosen?.name} is past its best-before date, so it can&apos;t be sold. Donate it if it&apos;s still good to eat.
          </p>
        )}

        <Field label="Quantity" hint={chosen ? `Up to ${max} available${deals ? ". The rest stays at the usual price." : ""}` : undefined}>
          <div className="flex items-center gap-2">
            <Button type="button" aria-label="Less" onClick={() => setQty((q) => Math.max(1, q - 1))} className="w-9 px-0">
              <Minus className="size-4" />
            </Button>
            <input
              inputMode="numeric"
              value={qty}
              onChange={(e) => setQty(Math.min(max, Math.max(1, Number(e.target.value.replace(/\D/g, "")) || 1)))}
              className={cn(input(false), "num w-24 text-center")}
              aria-label="Quantity"
            />
            <Button type="button" aria-label="More" onClick={() => setQty((q) => Math.min(max, q + 1))} className="w-9 px-0">
              <Plus className="size-4" />
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setQty(max)} className="ml-1">
              All {max}
            </Button>
          </div>
        </Field>

        {deals && chosen && !pastDate && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Surplus price" required error={tried ? priceError : undefined} hint={`Usually ${gbp(chosen.price)}`}>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-app-faint">£</span>
                  <input inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value.replace(/[^\d.]/g, ""))} className={cn(input(!!(tried && priceError)), "num pl-6")} aria-label="Surplus price in pounds" placeholder="0.00" />
                </div>
              </Field>
              <Field label="On sale until" required error={tried ? endError : undefined} hint={lastDay ? `Best before ${shortDate(lastDay)}` : undefined}>
                <input type="date" value={endsAt} min={today} max={lastDay} onChange={(e) => setEndsAt(e.target.value)} className={input(!!(tried && endError))} aria-label="On sale until" />
              </Field>
            </div>
            {off !== null && (
              <p className="-mt-2 text-ui-sm text-app-muted">
                Buyers see <span className="num font-medium text-app-text">{gbp(pence / 100)}</span>, <span className="num">{off}%</span> off. You get{" "}
                <span className="num font-medium text-app-text">{gbp((pence * (1 - COMMISSION)) / 100)}</span> each after FarmNomad&apos;s 10%.
              </p>
            )}
            {surplusPreset?.suggestionId && <p className="-mt-2 text-ui-sm text-app-faint">Filled in from a suggestion. Change anything before you confirm.</p>}
          </>
        )}

        {donate && (
          <Field label="Note for food groups" hint="Optional. Condition, collection times, anything useful.">
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={240} placeholder="e.g. A little wilted, fine for cooking. Collect before 4pm." className={cn(input(false), "h-auto resize-none py-2")} />
          </Field>
        )}
      </div>
    </Sheet>
  );
}
