import { FEATURES } from "@/lib/features";
import type { Product } from "@/lib/types/api";

/**
 * Surplus deals: a farmer sells stock that won't sell in time for less, to everyone, until a
 * date. Giving food away free is a donation, not surplus. The server sets the price charged;
 * this only decides what to show.
 */
export type Deal = { price: number; quantity: number; endsAt?: string; savePct: number };

/** The live deal on a product, or null. A "deal" that isn't cheaper, has none left or has ended isn't one. */
export function dealOf(p: Product): Deal | null {
  if (!FEATURES.surplusDeals) return null;
  const pence = p.surplusPricePence;
  const qty = p.surplusQuantity ?? 0;
  if (!pence || pence <= 0 || pence >= Math.round(p.price * 100) || qty <= 0) return null;
  if (p.surplusEndsAt && endOfDay(p.surplusEndsAt) < Date.now()) return null;
  const price = pence / 100;
  return { price, quantity: Math.min(qty, p.quantityAvailable), endsAt: p.surplusEndsAt ?? undefined, savePct: Math.round((1 - price / p.price) * 100) };
}

/** Whether to badge a product as surplus. Until deals are on, farmers mark surplus with a tag. */
export const isSurplus = (p: Product) => (FEATURES.surplusDeals ? !!dealOf(p) : !!p.tags?.some((t) => t.toLowerCase() === "surplus"));

/** What a buyer pays per unit right now. */
export const priceNow = (p: Product) => dealOf(p)?.price ?? p.price;

/** How many a buyer can add: a deal is limited to the stock offered at that price. */
export const buyLimit = (p: Product) => dealOf(p)?.quantity ?? p.quantityAvailable;

/** The farmer's action, worded for whichever surplus this is. */
export const SURPLUS_ACTION = FEATURES.surplusDeals ? "Sell as surplus" : "Flag surplus";

/** A date-only value means the end of that day, in the UK. */
function endOfDay(iso: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T23:59:59`).getTime() : new Date(iso).getTime();
}

export const shortDate = (iso: string) => new Date(/^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso}T12:00:00` : iso).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
