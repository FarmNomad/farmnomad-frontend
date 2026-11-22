"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useMeQuery } from "@/lib/api/farmnomad";
import { getSession } from "@/lib/auth/session";
import { useSessionGuard } from "@/lib/auth/useSessionGuard";
import { HOME } from "@/lib/navigation";
import { PROFILE_META, hasProfileStep } from "@/lib/types/profile";
import { OnboardingFrame } from "@/components/profile/OnboardingFrame";
import { RoleProfileForm } from "@/components/profile/RoleProfileForm";

/**
 * The profile step after a farmer's, driver's or kitchen's first login. The role decides the
 * form. Customers, food groups and admins have no such step and are sent on to their home page.
 */
export default function OnboardingProfilePage() {
  const router = useRouter();
  const [signedIn] = useState(() => !!getSession());
  const { data: me } = useMeQuery(undefined, { skip: !signedIn });
  const role = me?.role;
  useSessionGuard();

  useEffect(() => {
    if (!signedIn) router.replace("/login");
    else if (role && !hasProfileStep(role)) router.replace(HOME[role]);
  }, [signedIn, role, router]);

  if (!signedIn || !hasProfileStep(role)) return <div className="min-h-[100dvh]" aria-busy="true" />;

  return (
    <OnboardingFrame step={1} heading={PROFILE_META[role].heading} sub="A few details so buyers and drivers know who they're dealing with. Only the starred fields are needed now." skipHref={HOME[role]}>
      {/* Then the payouts step, not the dashboard: two steps in a row beat two banners. */}
      <RoleProfileForm role={role} submitLabel="Save and continue" onSaved={() => router.push("/earnings?welcome=1")} />
    </OnboardingFrame>
  );
}
