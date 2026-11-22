/** Earnings and payouts: what a farmer, kitchen or driver has earned and when it reaches their bank. */

export type EarningStatus = "CLEARING" | "AVAILABLE" | "TRANSFERRED" | "PAID_OUT" | "FAILED" | "REVERSED";
export type EarningType = "SALE" | "DELIVERY_FEE";

/** GET /earnings. All money is integer pence. */
export interface EarningsSummary {
  onboarded: boolean;
  payoutsEnabled: boolean;
  requirementsDue: string[];
  clearingPence: number;
  availablePence: number;
  paidOutPence: number;
  /** Sent to Stripe, not yet in the bank. */
  transferredPence?: number;
  // The API has no payout schedule yet, so these can be absent.
  nextPayoutDate?: string | null; // ISO date
  nextPayoutPence?: number;
}

export interface EarningLine {
  id: number;
  orderId: number;
  type: EarningType;
  label: string; // product or meal name, or a delivery summary
  date: string; // ISO
  grossPence: number;
  commissionPence: number;
  netPence: number;
  status: EarningStatus;
}

export interface PayoutLine {
  id: string;
  date: string;
  amountPence: number;
  bankLast4?: string;
  status: "PENDING" | "PAID" | "FAILED";
}

/** Money stays in pence everywhere and is divided by 100 only here, at the moment of display. 4750 → "£47.50". */
export const formatPence = (pence: number): string => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(pence / 100);

/** Which of the four screens /earnings shows. Decided by the summary alone. */
export type EarningsState = "setup" | "verifying" | "active" | "action";
export function earningsState(s: EarningsSummary): EarningsState {
  // An outstanding requirement is the most urgent thing on screen, even with payouts running.
  if (s.requirementsDue.length > 0) return "action";
  if (!s.onboarded) return "setup";
  return s.payoutsEnabled ? "active" : "verifying";
}

/** Stripe's requirement codes in plain English. Anything not listed is shown in Stripe's own words. */
const REQUIREMENTS: Record<string, string> = {
  "individual.verification.document": "A photo of your ID",
  "individual.verification.additional_document": "A second document proving your address",
  "individual.address.line1": "Your home address",
  "individual.dob.day": "Your date of birth",
  "individual.id_number": "Your National Insurance number",
  external_account: "Your bank account details",
  "tos_acceptance.date": "Acceptance of Stripe's terms",
};
export const requirementText = (code: string) => REQUIREMENTS[code] ?? code.replace(/[._]/g, " ");

/**
 * Sample payloads for looking at each screen during development (add ?preview=active and so on
 * to /earnings). They are never shown outside development. Shapes match the backend spec.
 */
export const EARNINGS_PREVIEWS: Record<EarningsState, EarningsSummary> = {
  setup: { onboarded: false, payoutsEnabled: false, requirementsDue: [], clearingPence: 4750, availablePence: 0, paidOutPence: 0, nextPayoutDate: null, nextPayoutPence: 0 },
  verifying: { onboarded: true, payoutsEnabled: false, requirementsDue: [], clearingPence: 4750, availablePence: 0, paidOutPence: 0, nextPayoutDate: null, nextPayoutPence: 0 },
  active: { onboarded: true, payoutsEnabled: true, requirementsDue: [], clearingPence: 4750, availablePence: 24750, paidOutPence: 186300, nextPayoutDate: "2026-11-21", nextPayoutPence: 24750 },
  action: { onboarded: true, payoutsEnabled: false, requirementsDue: ["individual.verification.document"], clearingPence: 0, availablePence: 24750, paidOutPence: 186300, nextPayoutDate: null, nextPayoutPence: 0 },
};
export const PREVIEW_EARNINGS: EarningLine[] = [
  { id: 1, orderId: 1042, type: "SALE", label: "Organic Carrots (5kg)", date: "2026-11-13", grossPence: 1250, commissionPence: 125, netPence: 1125, status: "CLEARING" },
  { id: 2, orderId: 1040, type: "SALE", label: "Free-range Eggs (dozen)", date: "2026-11-11", grossPence: 450, commissionPence: 45, netPence: 405, status: "AVAILABLE" },
  { id: 3, orderId: 1038, type: "SALE", label: "Maris Piper Potatoes (10kg)", date: "2026-11-09", grossPence: 1800, commissionPence: 180, netPence: 1620, status: "PAID_OUT" },
  { id: 4, orderId: 1031, type: "SALE", label: "Mixed Veg Box", date: "2026-11-04", grossPence: 2200, commissionPence: 220, netPence: 1980, status: "FAILED" },
];
export const PREVIEW_PAYOUTS: PayoutLine[] = [
  { id: "po_2", date: "2026-11-14", amountPence: 24750, bankLast4: "4821", status: "PAID" },
  { id: "po_1", date: "2026-11-07", amountPence: 18300, bankLast4: "4821", status: "PAID" },
];
