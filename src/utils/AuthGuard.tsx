"use client";

import { useSelector } from "react-redux";
import { RootState } from "@/lib/redux/store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AuthState } from "@/types/authType";

export default function AuthGuard({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles?: Array<"CUSTOMER" | "FARMER" | "DRIVER" | "FOODBANK" | "ADMIN">;
}) {
  const { token, user } = useSelector((s: RootState) => s.auth as AuthState);
  const role = user?.role;
  const router = useRouter();

  useEffect(() => {
    if (!token) router.replace("/login");
    else if (roles && role && !roles.includes(role)) router.replace("/");
    // Remove or update the following line if you need to check for another property
    // else if (role && role !== "ADMIN" && !isActive) router.replace("/login");
  }, [token, role, roles, router]);

  return <>{children}</>;
}
