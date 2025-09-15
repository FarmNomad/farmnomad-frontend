// src/app/orders/page.tsx
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { CalendarClock, User2, Package } from "lucide-react";

import { useAppSelector } from "@/lib/redux/store";
import {
  useGetOrderQuery,
  useMyOrdersQuery,
  useAssignedOrdersQuery,
  useListOrdersAdminQuery,
  useAssignOrderMutation,
  useUpdateStatusMutation,
  type OrderStatus,
} from "@/lib/redux/services/order.api";

// Define OrderResponse type here if not exported from order.api
type OrderResponse = {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  customerName: string;
  driverName?: string;
  status: OrderStatus;
  paymentStatus: string;
  createdAt: string;
  updatedAt?: string;
};
import { StatusBadge, PaymentBadge } from "@/components/orders/Badges";

const ADMIN_STATUSES: OrderStatus[] = [
  "PENDING",
  "ASSIGNED",
  "IN_TRANSIT",
  "DELIVERED",
  "CANCELLED",
];

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <h1 className="text-2xl font-semibold text-[#3c4f3d]">{title}</h1>
      <Link href="/marketplace" className="text-green-700 hover:underline">
        ← Continue shopping
      </Link>
    </div>
  );
}

function EmptyState({ role }: { role: string }) {
  const note =
    role === "CUSTOMER"
      ? "You have no orders yet."
      : role === "DRIVER"
      ? "No assigned orders at the moment."
      : "No orders found for the selected filter.";
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
      <p className="text-gray-700">{note}</p>
      <div className="mt-4">
        <Link
          href="/marketplace"
          className="inline-block px-4 py-2 rounded-lg bg-green-700 text-white hover:bg-green-800"
        >
          Browse products
        </Link>
      </div>
    </div>
  );
}

function OrdersSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 animate-pulse"
        >
          <div className="h-4 w-1/3 bg-gray-100 rounded" />
          <div className="mt-3 h-3 w-1/2 bg-gray-100 rounded" />
          <div className="mt-2 h-3 w-2/3 bg-gray-100 rounded" />
        </div>
      ))}
    </div>
  );
}

function OrdersTable({ items }: { items: OrderResponse[] }) {
  if (!items.length) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 text-[13px] text-gray-500 border-b">
        <div className="col-span-3">Product</div>
        <div className="col-span-2">Quantity</div>
        <div className="col-span-2">Customer</div>
        <div className="col-span-2">Driver</div>
        <div className="col-span-1">Status</div>
        <div className="col-span-2">Payment</div>
      </div>

      <div className="divide-y">
        {items.map((o) => (
          <div key={o.id} className="grid md:grid-cols-12 gap-4 px-6 py-4">
            {/* Product (mobile stacks) */}
            <div className="md:col-span-3">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-gray-500" />
                <Link
                  href={`/marketplace/${o.productId}`}
                  className="font-medium text-gray-900 hover:underline truncate"
                  title={o.productName}
                >
                  {o.productName}
                </Link>
              </div>
              <div className="mt-1 text-xs text-gray-500 flex items-center gap-2">
                <CalendarClock className="w-3.5 h-3.5" />
                <span>
                  {new Date(o.createdAt).toLocaleString()}{" "}
                  {o.updatedAt
                    ? `· updated ${new Date(o.updatedAt).toLocaleString()}`
                    : ""}
                </span>
              </div>
              {/* Mobile meta */}
              <div className="mt-2 md:hidden flex flex-wrap items-center gap-2">
                <StatusBadge status={o.status} />
                <PaymentBadge payment={o.paymentStatus} />
              </div>
            </div>

            {/* Qty */}
            <div className="md:col-span-2 flex items-center">
              <span className="text-sm text-gray-800">{o.quantity}</span>
            </div>

            {/* Customer */}
            <div className="md:col-span-2 flex items-center">
              <div className="flex items-center gap-2 text-sm text-gray-800">
                <User2 className="w-4 h-4 text-gray-500" />
                <span className="truncate">{o.customerName}</span>
              </div>
            </div>

            {/* Driver */}
            <div className="md:col-span-2 flex items-center">
              {o.driverName ? (
                <span className="text-sm text-gray-800">{o.driverName}</span>
              ) : (
                <span className="text-xs text-gray-500">—</span>
              )}
            </div>

            {/* Status */}
            <div className="hidden md:flex md:col-span-1 items-center">
              <StatusBadge status={o.status} />
            </div>

            {/* Payment */}
            <div className="hidden md:flex md:col-span-2 items-center">
              <PaymentBadge payment={o.paymentStatus} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const pathname = usePathname();
  const { user } = useAppSelector((s) => s.auth);
  const role = user?.role ?? "CUSTOMER";

  // Admin filter
  const [adminStatus, setAdminStatus] = useState<OrderStatus | "ALL">("ALL");

  // Data hooks by role
  const {
    data: myOrders,
    isLoading: loadingMy,
    error: errMy,
  } = useMyOrdersQuery(undefined, { skip: role !== "CUSTOMER" });
  const {
    data: assigned,
    isLoading: loadingAssigned,
    error: errAssigned,
  } = useAssignedOrdersQuery(undefined, { skip: role !== "DRIVER" });
  const {
    data: all,
    isLoading: loadingAll,
    error: errAll,
  } = useListOrdersAdminQuery(
    adminStatus !== "ALL" ? { status: adminStatus as OrderStatus } : undefined,
    { skip: role !== "ADMIN" }
  );

  const items: OrderResponse[] = useMemo(() => {
    const convert = (orders: any[] | undefined) =>
      (orders ?? []).map((o) => ({
        ...o,
        id: o.id?.toString?.() ?? "",
        productId: o.productId?.toString?.() ?? "",
        quantity: typeof o.quantity === "number" ? o.quantity : Number(o.quantity),
      }));
    if (role === "CUSTOMER") return convert(myOrders);
    if (role === "DRIVER") return convert(assigned);
    return convert(all);
  }, [role, myOrders, assigned, all]);

  const isLoading =
    (role === "CUSTOMER" && loadingMy) ||
    (role === "DRIVER" && loadingAssigned) ||
    (role === "ADMIN" && loadingAll);
  const isError =
    (role === "CUSTOMER" && errMy) ||
    (role === "DRIVER" && errAssigned) ||
    (role === "ADMIN" && errAll);

  return (
    <section className="bg-[#fefef8] min-h-screen py-10 px-6 sm:px-8 lg:px-12">
      <div className="max-w-6xl mx-auto">
        <SectionHeader
          title={
            role === "CUSTOMER"
              ? "My Orders"
              : role === "DRIVER"
              ? "Assigned Orders"
              : "All Orders"
          }
        />

        {/* Role-specific controls */}
        {role === "ADMIN" && (
          <div className="mb-4 flex items-center gap-3">
            <label className="text-sm text-gray-700">Filter by status</label>
            <select
              className="border rounded-lg px-3 py-2 bg-white text-sm"
              value={adminStatus}
              onChange={(e) => setAdminStatus(e.target.value as any)}
            >
              <option value="ALL">All</option>
              {ADMIN_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* States */}
        {isLoading && <OrdersSkeleton />}
        {isError && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center text-red-600">
            Couldn&apos;t load orders. Please try again.
          </div>
        )}

        {!isLoading && !isError && (
          <>
            {items.length === 0 ? (
              <EmptyState role={role} />
            ) : (
              <OrdersTable items={items} />
            )}
          </>
        )}
      </div>
    </section>
  );
}
