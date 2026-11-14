import type { Metadata } from "next";
import { AuthScreen } from "@/components/app/auth/AuthScreen";

export const metadata: Metadata = { title: "Verify your email" };
export const instant = false;
export default function Page() {
  return <AuthScreen initial="verify" />;
}
