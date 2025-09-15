// src/components/orders/Badges.tsx
"use client";

import React from "react";

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PENDING: "bg-amber-50 text-amber-700 border border-amber-200",
    ASSIGNED: "bg-blue-50 text-blue-700 border border-blue-200",
    IN_TRANSIT: "bg-indigo-50 text-indigo-700 border border-indigo-200",
    DELIVERED: "bg-green-50 text-green-700 border border-green-200",
    CANCELLED: "bg-red-50 text-red-700 border border-red-200",
  };
  const cls = map[status] || "bg-gray-100 text-gray-700";
  return (
    <span className={`px-2 py-0.5 rounded-full text-[11px] ${cls}`}>
      {status}
    </span>
  );
}

export function PaymentBadge({ payment }: { payment: string }) {
  const map: Record<string, string> = {
    PAID: "bg-green-50 text-green-700 border border-green-200",
    UNPAID: "bg-rose-50 text-rose-700 border border-rose-200",
    REFUNDED: "bg-gray-100 text-gray-700 border border-gray-200",
  };
  const cls = map[payment] || "bg-gray-100 text-gray-700";
  return (
    <span className={`px-2 py-0.5 rounded-full text-[11px] ${cls}`}>
      {payment}
    </span>
  );
}
