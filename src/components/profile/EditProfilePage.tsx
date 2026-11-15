"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { useApp } from "@/components/app/AppState";
import { PageHeader } from "@/components/app/PageHeader";
import type { ProfileRole } from "@/lib/types/profile";
import { RoleProfileForm } from "./RoleProfileForm";

const COPY: Record<ProfileRole, { title: string; description: string }> = {
  FARMER: { title: "Farm details", description: "What buyers see on your listings, and where they collect from." },
  DRIVER: { title: "Vehicle details", description: "What you drive and the cover you hold for deliveries." },
  KITCHEN: { title: "Kitchen details", description: "What diners see on your NomadEat meals." },
};

/** Edit a role profile later. The same form as the onboarding step, inside the settings shell. */
export function EditProfilePage({ role }: { role: ProfileRole }) {
  const app = useApp();
  const router = useRouter();
  const mine = app.role === role;
  useEffect(() => {
    if (!mine) router.replace("/profile");
  }, [mine, router]);
  if (!mine) return null;

  return (
    <div className="mx-auto max-w-[720px] pb-16">
      <div className="px-4 pt-6 md:px-8">
        <Link href="/profile" className="inline-flex items-center gap-1.5 text-app-muted hover:text-app-text">
          <ArrowLeft className="size-4" /> Profile
        </Link>
      </div>
      <PageHeader title={COPY[role].title} description={COPY[role].description} />
      <div className="mx-4 rounded-xl p-5 shadow-[0_0_0_1px_var(--a-line)] md:mx-8">
        <RoleProfileForm role={role} submitLabel="Save changes" />
      </div>
    </div>
  );
}
