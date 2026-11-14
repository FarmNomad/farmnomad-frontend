import type { Metadata } from "next";
import { AuthScreen } from "@/components/app/auth/AuthScreen";

export const metadata: Metadata = { title: "Choose a new password" };

export default function Page() {
  return <AuthScreen initial="reset" />;
}
