"use client";

import { useMyOrganisationQuery } from "@/lib/api/farmnomad";
import { useApp } from "@/components/app/AppState";
import { ROLE_META } from "@/lib/navigation";
import { useProfileGate } from "./useProfileGate";

/** The saved farm, kitchen or organisation name, or "Your farm" and the like until there is one. */
export function useWorkspaceName(): string {
  const { role } = useApp();
  const { profile } = useProfileGate();
  const { data: org } = useMyOrganisationQuery(undefined, { skip: role !== "ORGANISATION" });
  const fallback = ROLE_META[role].workspace;
  if (role === "ORGANISATION") return org?.name || fallback;
  // A driver's profile is a vehicle and has no name.
  return (profile && "name" in profile && profile.name) || fallback;
}
