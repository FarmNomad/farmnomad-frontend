"use client";

import { useGetMyProfileQuery } from "@/lib/api/farmnomad";
import { useApp } from "@/components/app/AppState";
import { hasProfileStep, type ProfileRole } from "@/lib/types/profile";

/**
 * One gate, used wherever a farmer, driver or kitchen needs their details in place first
 * (listing produce or meals, accepting a job, the dashboard banner). Reads GET /profile/me.
 * Customers, food groups and admins have no profile step and are never gated.
 */
export function useProfileGate() {
  const { role } = useApp();
  const gated = hasProfileStep(role);
  const { data, isLoading } = useGetMyProfileQuery(undefined, { skip: !gated });
  return {
    isLoading: gated && isLoading,
    /** The role with a profile step, or null when this role has none. */
    role: gated ? (role as ProfileRole) : null,
    needsProfile: gated && data ? !data.profileComplete : false,
    missingFields: data?.missingFields ?? [],
    profile: data?.profile ?? null,
    status: data,
  };
}
