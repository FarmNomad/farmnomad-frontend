// src/app/dashboard/farmer/page.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { Package, HeartHandshake, Leaf, PlusCircle } from "lucide-react";

import RoleGuard from "@/lib/utils/roleGuard";
import Spinner from "@/components/ui/spinner";
import ErrorState from "@/components/ui/errorstate";

import { useAppSelector } from "@/lib/redux/store";
import { useMyFarmerDonationsQuery } from "@/lib/redux/services/donation.api";
import { useListProductsQuery } from "@/lib/redux/services/product.api";
import { useListSurplusQuery } from "@/lib/redux/services/surplus.api"; // ⬅️ new
import { productImageSrc } from "@/lib/utils/image";

function greet(fullName?: string) {
  const h = new Date().getHours();
  const base =
    h < 5
      ? "Good night"
      : h < 12
      ? "Good morning"
      : h < 18
      ? "Good afternoon"
      : "Good evening";
  const first = (fullName || "").split(" ").filter(Boolean)[0];
  return `${base}${first ? `, ${first}` : ""} 👋`;
}
function daysUntil(dateISO?: string): number | null {
  if (!dateISO) return null;
  const d = new Date(dateISO);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  const s = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const e = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.floor((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
}
function expiryClass(days: number | null) {
  if (days === null) return "text-gray-500";
  if (days <= 0) return "text-red-600";
  if (days <= 10) return "text-red-600";
  if (days <= 24) return "text-amber-600";
  return "text-gray-600";
}
function StatCard({
  icon,
  label,
  value,
  tone = "green",
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  tone?: "green" | "amber" | "sky";
}) {
  const toneCls =
    tone === "amber"
      ? "bg-amber-50 text-amber-800 border-amber-200"
      : tone === "sky"
      ? "bg-sky-50 text-sky-800 border-sky-200"
      : "bg-green-50 text-green-800 border-green-200";
  return (
    <div
      className={`rounded-2xl border ${toneCls} p-4 flex items-center gap-3`}
    >
      <div className="shrink-0">{icon}</div>
      <div>
        <div className="text-xs uppercase tracking-wide">{label}</div>
        <div className="text-xl font-semibold">{value}</div>
      </div>
    </div>
  );
}

export default function FarmerDashboard() {
  const { user } = useAppSelector((s) => s.auth);

  const {
    data: donations,
    isLoading: dLoad,
    error: dErr,
  } = useMyFarmerDonationsQuery();
  const {
    data: products,
    isLoading: pLoad,
    error: pErr,
  } = useListProductsQuery();
  const {
    data: surplus,
    isLoading: sLoad,
    error: sErr,
  } = useListSurplusQuery(); // system surplus

  if (dLoad || pLoad || sLoad) return <Spinner />;
  if (dErr || pErr || sErr) return <ErrorState />;

  const prodList = products ?? [];
  const myProductIds = new Set(
    prodList
      .filter((p: any) => Number(p.farmerId) === Number(user?.id))
      .map((p: any) => Number(p.id))
  );
  const mySurplus = (surplus ?? []).filter((s: any) =>
    myProductIds.has(Number(s.productId))
  ); // ⬅️ farmer’s surplus only

  const donationList = donations ?? [];
  const totalProducts = prodList.length;
  const totalStock = prodList.reduce(
    (sum: number, p: any) => sum + Number(p.quantityAvailable || 0),
    0
  );
  const totalDonations = donationList.length;
  const totalSurplus = mySurplus.length;

  return (
    <RoleGuard allow={["FARMER"]}>
      <section className="bg-[#fefef8] min-h-screen">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 py-8 space-y-8">
          <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-[#3c4f3d]">
                {greet(user?.fullName)}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Here’s a quick look at your products, donations and surplus
                items.
              </p>
            </div>
            <Link
              href="/marketplace/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-700 text-white hover:bg-green-800"
            >
              <PlusCircle className="w-5 h-5" /> Add new product
            </Link>
          </header>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              icon={<Package className="w-5 h-5" />}
              label="Products"
              value={totalProducts}
            />
            <StatCard
              icon={<Leaf className="w-5 h-5" />}
              label="Total Stock"
              value={totalStock}
              tone="sky"
            />
            <StatCard
              icon={<HeartHandshake className="w-5 h-5" />}
              label="Donations"
              value={totalDonations}
              tone="amber"
            />
            <StatCard
              icon={<HeartHandshake className="w-5 h-5" />}
              label="Surplus"
              value={totalSurplus}
            />
          </div>

          {/* My Products */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                My Products
              </h2>
              <Link
                href="/marketplace"
                className="text-green-700 hover:underline text-sm"
              >
                View all →
              </Link>
            </div>
            {prodList.length === 0 ? (
              <div className="text-sm text-gray-600">
                You haven’t added any products yet.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {prodList.slice(0, 6).map((p: any) => {
                  const img = productImageSrc(
                    p.coverImageUrl || p.imageUrls?.[0]
                  );
                  const dLeft = daysUntil(p.bestBeforeDate);
                  const expCls = expiryClass(dLeft);
                  const lowStock = Number(p.quantityAvailable || 0) <= 5;
                  return (
                    <div
                      key={p.id}
                      className="rounded-xl border border-gray-100 shadow-sm overflow-hidden bg-white"
                    >
                      <div className="relative w-full aspect-video bg-gray-50">
                        <Image
                          src={img}
                          alt={p.name}
                          fill
                          className="object-cover"
                          sizes="(max-width:768px) 100vw, 33vw"
                        />
                      </div>
                      <div className="p-4 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {p.name}
                          </h3>
                          {lowStock && (
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                              Low stock
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-700">
                          Qty:{" "}
                          <span className="font-medium">
                            {p.quantityAvailable}
                          </span>
                        </div>
                        {p.bestBeforeDate && (
                          <div className={`text-xs ${expCls}`}>
                            Best before:{" "}
                            {new Date(p.bestBeforeDate).toLocaleDateString()}
                            {dLeft !== null ? ` · ${dLeft}d left` : ""}
                          </div>
                        )}
                        <div className="pt-2">
                          <Link
                            href={`/marketplace/${p.id}`}
                            className="text-sm text-green-700 hover:underline"
                          >
                            Manage →
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* My Donations */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                My Donations
              </h2>
              <Link
                href="/donations"
                className="text-green-700 hover:underline text-sm"
              >
                View all →
              </Link>
            </div>
            {donationList.length === 0 ? (
              <div className="text-sm text-gray-600">No donations yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b">
                      <th className="py-2 pr-4">ID</th>
                      <th className="py-2 pr-4">Product</th>
                      <th className="py-2 pr-4">Qty</th>
                      <th className="py-2 pr-4">Status</th>
                      <th className="py-2 pr-4">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {donationList.slice(0, 6).map((d: any) => (
                      <tr key={d.id}>
                        <td className="py-3 pr-4">#{d.id}</td>
                        <td className="py-3 pr-4">
                          <Link
                            href={`/marketplace/${d.productId}`}
                            className="text-green-700 hover:underline"
                          >
                            {d.productName || d.productId}
                          </Link>
                        </td>
                        <td className="py-3 pr-4">{d.quantity}</td>
                        <td className="py-3 pr-4">
                          <span className="px-2 py-0.5 rounded-full text-[11px] bg-gray-100 text-gray-700 border border-gray-200">
                            {d.status || d.donationStatus || "—"}
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          {d.createdAt
                            ? new Date(d.createdAt).toLocaleString()
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* My Surplus (joined by my product ownership) */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                My Surplus
              </h2>
              <Link
                href="/donations?tab=surplus"
                className="text-green-700 hover:underline text-sm"
              >
                Manage →
              </Link>
            </div>
            {mySurplus.length === 0 ? (
              <div className="text-sm text-gray-600">
                No surplus currently listed.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b">
                      <th className="py-2 pr-4">ID</th>
                      <th className="py-2 pr-4">Product</th>
                      <th className="py-2 pr-4">Qty</th>
                      <th className="py-2 pr-4">Best Before</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {mySurplus.slice(0, 6).map((s: any) => {
                      const prod = prodList.find(
                        (p: any) => Number(p.id) === Number(s.productId)
                      );
                      const dLeft = daysUntil(prod?.bestBeforeDate);
                      return (
                        <tr key={s.id}>
                          <td className="py-3 pr-4">#{s.id}</td>
                          <td className="py-3 pr-4">
                            <Link
                              href={`/marketplace/${s.productId}`}
                              className="text-green-700 hover:underline"
                            >
                              {prod?.name || s.productId}
                            </Link>
                          </td>
                          <td className="py-3 pr-4">
                            {s.quantity ?? s.availableQuantity ?? "—"}
                          </td>
                          <td className={`py-3 pr-4 ${expiryClass(dLeft)}`}>
                            {prod?.bestBeforeDate
                              ? `${new Date(
                                  prod.bestBeforeDate
                                ).toLocaleDateString()}${
                                  dLeft !== null ? ` · ${dLeft}d left` : ""
                                }`
                              : "—"}
                          </td>
                        </tr>
                      );
                    })}
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
