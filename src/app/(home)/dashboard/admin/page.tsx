// src/app/dashboard/admin/page.tsx
"use client";

import { Users, Package, HeartHandshake, ClipboardList } from "lucide-react";
import RoleGuard from "@/lib/utils/roleGuard";
import { useListUsersQuery } from "@/lib/redux/services/user.api";
import { useListProductsQuery } from "@/lib/redux/services/product.api";
import { useAllDonationsAdminQuery } from "@/lib/redux/services/donation.api";
import { useListOrdersAdminQuery } from "@/lib/redux/services/order.api";
import Spinner from "@/components/ui/spinner";
import ErrorState from "@/components/ui/errorstate";

function Stat({
  icon,
  title,
  value,
  tone = "green",
}: {
  icon: React.ReactNode;
  title: string;
  value: number | string;
  tone?: "green" | "amber" | "sky" | "rose";
}) {
  const map = {
    green: "bg-green-50 text-green-800 border-green-200",
    amber: "bg-amber-50 text-amber-800 border-amber-200",
    sky: "bg-sky-50 text-sky-800 border-sky-200",
    rose: "bg-rose-50 text-rose-800 border-rose-200",
  } as const;
  return (
    <div
      className={`rounded-2xl border ${map[tone]} p-4 flex items-center gap-3`}
    >
      <div>{icon}</div>
      <div>
        <div className="text-xs uppercase tracking-wide">{title}</div>
        <div className="text-2xl font-semibold">{value}</div>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const s = status?.toUpperCase?.() || "";
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

export default function AdminDashboard() {
  const { data: users, isLoading: uLoad, error: uErr } = useListUsersQuery();
  const {
    data: products,
    isLoading: pLoad,
    error: pErr,
  } = useListProductsQuery();
  const {
    data: donations,
    isLoading: dLoad,
    error: dErr,
  } = useAllDonationsAdminQuery();
  const {
    data: orders,
    isLoading: oLoad,
    error: oErr,
  } = useListOrdersAdminQuery();

  if (uLoad || pLoad || dLoad || oLoad) return <Spinner />;
  if (uErr || pErr || dErr || oErr) return <ErrorState />;

  return (
    <RoleGuard allow={["ADMIN"]}>
      <section className="bg-[#fefef8] min-h-screen">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 py-8 space-y-8">
          <header>
            <h1 className="text-2xl sm:text-3xl font-semibold text-[#3c4f3d]">
              Admin Dashboard
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Platform overview at a glance.
            </p>
          </header>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Stat
              icon={<Users className="w-5 h-5" />}
              title="Users"
              value={users?.length ?? 0}
            />
            <Stat
              icon={<Package className="w-5 h-5" />}
              title="Products"
              value={products?.length ?? 0}
              tone="sky"
            />
            <Stat
              icon={<HeartHandshake className="w-5 h-5" />}
              title="Donations"
              value={donations?.length ?? 0}
              tone="amber"
            />
            <Stat
              icon={<ClipboardList className="w-5 h-5" />}
              title="Orders"
              value={orders?.length ?? 0}
            />
          </div>

          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Recent Orders
              </h2>
            </div>
            {(orders ?? []).length === 0 ? (
              <div className="text-sm text-gray-600">No orders yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b">
                      <th className="py-2 pr-4">ID</th>
                      <th className="py-2 pr-4">Product</th>
                      <th className="py-2 pr-4">Customer</th>
                      <th className="py-2 pr-4">Driver</th>
                      <th className="py-2 pr-4">Status</th>
                      <th className="py-2 pr-4">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {[...orders!].slice(0, 8).map((o: any) => (
                      <tr key={o.id}>
                        <td className="py-3 pr-4">#{o.id}</td>
                        <td className="py-3 pr-4">
                          {o.productName || o.productId}
                        </td>
                        <td className="py-3 pr-4">
                          {o.customerName || o.customerId}
                        </td>
                        <td className="py-3 pr-4">{o.driverName || "—"}</td>
                        <td className="py-3 pr-4">
                          <StatusPill status={o.status} />
                        </td>
                        <td className="py-3 pr-4">
                          {o.createdAt
                            ? new Date(o.createdAt).toLocaleString()
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </section>
    </RoleGuard>
  );
}
