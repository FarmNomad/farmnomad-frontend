"use client";

import React, { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
// Update the import path if your store is located elsewhere, e.g.:
import type { Role } from "../types/api";
import { useAppSelector } from "../redux/store";
import { routeAfterLogin } from "./routeAfterLogin";

export default function RoleGuard({
  allow,
  children,
}: {
  allow: Role[];
  children: ReactNode;
}) {
  const router = useRouter();
  const { token, user } = useAppSelector((s) => s.auth);

  useEffect(() => {
    // If not logged in → go to login
    if (!token) {
      router.replace("/login");
      return;
    }
    // If logged in but role not allowed → redirect to correct dashboard/area
    if (user && !allow.includes(user.role)) {
      router.replace(routeAfterLogin(user.role));
    }
  }, [token, user, allow, router]);

  if (!token) return null; // or a spinner
  if (user && !allow.includes(user.role)) return null;

  return <>{children}</>;
}
