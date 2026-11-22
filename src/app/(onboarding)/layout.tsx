import type { Metadata } from "next";
import { AuthShell } from "@/components/app/AuthShell";

export const metadata: Metadata = { title: { template: "%s · FarmNomad", default: "FarmNomad" }, robots: { index: false, follow: false } };

/** Focused steps after the first login: no sidebar, one job per screen. */
export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <AuthShell>{children}</AuthShell>;
}
