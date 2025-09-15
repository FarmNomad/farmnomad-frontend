// src/app/dashboard/driver/page.tsx
"use client";

import { Truck, CheckCircle2, Loader2, Hand } from "lucide-react";
import RoleGuard from "@/lib/utils/roleGuard";
import {
  useAssignedOrdersQuery,
  useUnassignedOrdersQuery,
  useAssignOrderMutation,
  useUpdateStatusMutation,
} from "@/lib/redux/services/order.api";
import Spinner from "@/components/ui/spinner";
import ErrorState from "@/components/ui/errorstate";

function StatusPill({ status }: { status: string }) {
  const s = (status || "").toUpperCase();
  const map: Record<string, string> = {
    PENDING: "bg-gray-100 text-gray-700 border-gray-200",
    ASSIGNED: "bg-sky-50 text-sky-700 border-sky-200",
    IN_TRANSIT: "bg-amber-50 text-amber-700 border-amber-200",
    DELIVERED: "bg-green-50 text-green-700 border-green-200",
    CANCELLED: "bg-rose-50 text-rose-700 border-rose-200",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-[11px] border ${
        map[s] || "bg-gray-100 text-gray-700 border-gray-200"
      }`}
    >
      {status}
    </span>
  );
}

export default function DriverDashboard() {
  const {
    data: assigned,
    isLoading: aLoad,
    error: aErr,
  } = useAssignedOrdersQuery();
  const {
    data: unassigned,
    isLoading: uLoad,
    error: uErr,
  } = useUnassignedOrdersQuery();
  const [assignOrder, { isLoading: assigning }] = useAssignOrderMutation();
  const [updateStatus, { isLoading: updating }] = useUpdateStatusMutation();

  if (aLoad || uLoad) return <Spinner />;
  if (aErr || uErr) return <ErrorState />;

  const assignedList = assigned ?? [];
  const unassignedList = unassigned ?? [];

  return (
    <RoleGuard allow={["DRIVER"]}>
      <section className="bg-[#fefef8] min-h-screen">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 py-8 space-y-8">
          <header className="flex items-center justify-between">
            <h1 className="text-2xl sm:text-3xl font-semibold text-[#3c4f3d] flex items-center gap-2">
              <Truck className="w-6 h-6" /> Driver Dashboard
            </h1>
          </header>

          {/* Unassigned (available to claim) */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Available to claim
              </h2>
              <div className="text-sm text-gray-500">
                {unassignedList.length} pending
              </div>
            </div>

            {unassignedList.length === 0 ? (
              <div className="text-sm text-gray-600">
                No unassigned orders at the moment.
              </div>
            ) : (
              <div className="grid gap-4">
                {unassignedList.map((o) => (
                  <div
                    key={o.id}
                    className="rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                  >
                    <div>
                      <div className="font-semibold text-gray-900">
                        Order #{o.id} — {o.productName}
                      </div>
                      <div className="text-sm text-gray-600">
                        Qty {o.quantity} • Customer:{" "}
                        {o.customerName || o.customerId}
                      </div>
                      <div className="mt-1">
                        <StatusPill status={o.status} />{" "}
                        {o.paymentStatus === "PAID" && (
                          <span className="ml-2 text-xs text-green-700">
                            PAID
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => assignOrder({ id: o.id })}
                        disabled={assigning}
                        className="px-3 py-1.5 rounded-lg bg-green-700 text-white hover:bg-green-800 disabled:opacity-50 flex items-center gap-1"
                      >
                        {assigning ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Hand className="w-4 h-4" />
                        )}
                        {assigning ? "Assigning…" : "Assign to me"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* My assigned */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                My assigned orders
              </h2>
              <div className="text-sm text-gray-500">
                {assignedList.length} active
              </div>
            </div>

            {assignedList.length === 0 ? (
              <div className="text-sm text-gray-600">
                No orders assigned to you yet.
              </div>
            ) : (
              <div className="grid gap-4">
                {assignedList.map((o) => (
                  <div
                    key={o.id}
                    className="rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                  >
                    <div>
                      <div className="font-semibold text-gray-900">
                        Order #{o.id} — {o.productName}
                      </div>
                      <div className="text-sm text-gray-600">
                        Qty {o.quantity} • Customer:{" "}
                        {o.customerName || o.customerId}
                      </div>
                      <div className="mt-1">
                        <StatusPill status={o.status} />{" "}
                        {o.paymentStatus === "PAID" && (
                          <span className="ml-2 text-xs text-green-700">
                            PAID
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          updateStatus({ id: o.id, status: "IN_TRANSIT" })
                        }
                        disabled={updating || o.status !== "ASSIGNED"}
                        className="px-3 py-1.5 rounded-lg border hover:bg-gray-50 disabled:opacity-50"
                      >
                        {updating ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Mark In Transit"
                        )}
                      </button>
                      <button
                        onClick={() =>
                          updateStatus({ id: o.id, status: "DELIVERED" })
                        }
                        disabled={updating || o.status !== "IN_TRANSIT"}
                        className="px-3 py-1.5 rounded-lg bg-green-700 text-white hover:bg-green-800 disabled:opacity-50 flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-4 h-4" />{" "}
                        {updating ? "Saving…" : "Delivered"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </section>
    </RoleGuard>
  );
}
