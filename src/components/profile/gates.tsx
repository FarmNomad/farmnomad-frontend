"use client";

import Link from "next/link";
import { ArrowRight, IdentificationCard } from "@phosphor-icons/react/dist/ssr";
import { useProfileGate } from "@/lib/hooks/useProfileGate";
import { PROFILE_META, missingFieldsText, type ProfileRole } from "@/lib/types/profile";

const link =
  "inline-flex h-9 items-center gap-2 rounded-[8px] bg-app-primary px-3.5 font-medium text-app-on-primary transition-[filter,transform] duration-150 hover:brightness-110 active:scale-[0.98]";

/** "We need your farm name and postcode", never "complete your profile" or an API field name. */
function need(role: ProfileRole, missing: string[]) {
  const what = missing.length ? missingFieldsText(role, missing) : PROFILE_META[role].noun;
  return `We need your ${what} ${PROFILE_META[role].why}`;
}

/**
 * The hard gate. It takes the place of a form (new product, new meal) rather than sitting on
 * top of it, and names exactly what is missing.
 */
export function ProfileRequiredCard({ role, missingFields, onNavigate }: { role: ProfileRole; missingFields: string[]; onNavigate?: () => void }) {
  const meta = PROFILE_META[role];
  return (
    <div className="grid justify-items-center px-6 py-14 text-center">
      <div className="grid size-12 place-items-center rounded-2xl bg-app-accent-soft text-app-accent">
        <IdentificationCard weight="duotone" className="size-6" />
      </div>
      <h2 className="mt-5 font-display text-[20px] font-medium tracking-[-0.02em]">{meta.cta} first</h2>
      <p className="mt-2 max-w-[42ch] text-app-muted">{need(role, missingFields)}</p>
      <Link href={meta.href} onClick={onNavigate} className={link + " mt-6"}>
        {meta.cta} <ArrowRight weight="bold" className="size-3.5" />
      </Link>
    </div>
  );
}

/** Dashboard nudge, shown while the profile is incomplete. Renders nothing otherwise. */
export function ProfileBanner() {
  const { role, needsProfile, missingFields } = useProfileGate();
  if (!role || !needsProfile) return null;
  const meta = PROFILE_META[role];
  return (
    <div role="status" className="mx-4 mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl bg-app-amber-soft px-4 py-3 md:mx-8">
      <IdentificationCard weight="duotone" className="size-5 shrink-0 text-app-amber" />
      <p className="min-w-0 flex-1 basis-[28ch]">
        <span className="font-medium">{meta.cta} to get started.</span> <span className="text-app-muted">{need(role, missingFields)}</span>
      </p>
      <Link href={meta.href} className="inline-flex shrink-0 items-center gap-1.5 font-medium text-app-text underline underline-offset-2">
        {meta.cta} <ArrowRight weight="bold" className="size-3.5" />
      </Link>
    </div>
  );
}

/** The backend's own gate: 409 PROFILE_INCOMPLETE with the fields still missing. */
export function profileIncomplete(err: unknown): string[] | null {
  const e = err as { status?: number; data?: { code?: string; error?: string; message?: string; missingFields?: string[] } | null };
  if (e?.status !== 409) return null;
  const tag = `${e.data?.code ?? ""} ${e.data?.error ?? ""} ${e.data?.message ?? ""}`;
  return /PROFILE_INCOMPLETE/i.test(tag) ? (e.data?.missingFields ?? []) : null;
}
