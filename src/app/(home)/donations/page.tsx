// src/app/donations/page.tsx
"use client";

import { HeartHandshake, Inbox, Users } from "lucide-react";
import Link from "next/link";
import RoleGuard from "@/lib/utils/roleGuard";
import { useAppSelector } from "@/lib/redux/store";
import Spinner from "@/components/ui/spinner";
import ErrorState from "@/components/ui/errorstate";

import {
  useMyFarmerDonationsQuery,
  useMyFoodbankDonationsQuery,
  useListDonationsForFoodBankQuery,
  useAllDonationsAdminQuery,
  useClaimAndOrderMutation,
} from "@/lib/redux/services/donation.api";

function Section({
  title,
  icon,
  children,
  action,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          {icon}
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function StatusPill({ status }: { status?: string }) {
  const s = (status || "").toUpperCase();
  const map: Record<string, string> = {
    PENDING: "bg-gray-100 text-gray-700 border-gray-200",
    CLAIMED: "bg-sky-50 text-sky-700 border-sky-200",
    COMPLETED: "bg-green-50 text-green-700 border-green-200",
    CANCELLED: "bg-rose-50 text-rose-700 border-rose-200",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-[11px] border ${
        map[s] || "bg-gray-100 text-gray-700 border-gray-200"
      }`}
    >
      {status || "—"}
    </span>
  );
}

export default function DonationsPage() {
  const { user } = useAppSelector((s) => s.auth);
  const role = user?.role;

  const {
    data: farmerDonations,
    isLoading: fdLoad,
    error: fdErr,
  } = useMyFarmerDonationsQuery(undefined, { skip: role !== "FARMER" });
  const {
    data: fbMine,
    isLoading: fbMineLoad,
    error: fbMineErr,
  } = useMyFoodbankDonationsQuery(undefined, { skip: role !== "FOODBANK" });
  const {
    data: fbAvailable,
    isLoading: fbAvailLoad,
    error: fbAvailErr,
  } = useListDonationsForFoodBankQuery(undefined, {
    skip: role !== "FOODBANK",
  });
  const {
    data: adminAll,
    isLoading: adLoad,
    error: adErr,
  } = useAllDonationsAdminQuery(undefined, { skip: role !== "ADMIN" });

  const [claimAndOrder, { isLoading: claiming }] = useClaimAndOrderMutation();

  const loading = fdLoad || fbMineLoad || fbAvailLoad || adLoad;
  const errored = fdErr || fbMineErr || fbAvailErr || adErr;

  if (loading) return <Spinner />;
  if (errored) return <ErrorState />;

  return (
    <section className="bg-[#fefef8] min-h-screen">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 py-8 space-y-8">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#3c4f3d]">
            Donations
          </h1>
          <Link
            href="/marketplace"
            className="text-green-700 hover:underline text-sm"
          >
            Back to marketplace →
          </Link>
        </header>

        {role === "FARMER" && (
          <RoleGuard allow={["FARMER"]}>
            <Section
              title="My donations"
              icon={<HeartHandshake className="w-5 h-5 text-amber-700" />}
            >
              {(farmerDonations ?? []).length === 0 ? (
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
                      {farmerDonations!.map((d: any) => (
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
                            <StatusPill status={d.status || d.donationStatus} />
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
            </Section>
          </RoleGuard>
        )}

        {role === "FOODBANK" && (
          <RoleGuard allow={["FOODBANK"]}>
            <div className="grid gap-6">
              <Section
                title="Available to my foodbank"
                icon={<Inbox className="w-5 h-5 text-sky-700" />}
              >
                {(fbAvailable ?? []).length === 0 ? (
                  <div className="text-sm text-gray-600">
                    Nothing available for your foodbank right now.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-500 border-b">
                          <th className="py-2 pr-4">ID</th>
                          <th className="py-2 pr-4">Product</th>
                          <th className="py-2 pr-4">Qty</th>
                          <th className="py-2 pr-4"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {fbAvailable!.map((d: any) => (
                          <tr key={d.id}>
                            <td className="py-3 pr-4">#{d.id}</td>
                            <td className="py-3 pr-4">
                              {d.productName || d.productId}
                            </td>
                            <td className="py-3 pr-4">{d.quantity}</td>
                            <td className="py-3 pr-4">
                              <button
                                onClick={() => claimAndOrder({ id: d.id })}
                                disabled={claiming}
                                className="px-3 py-1.5 rounded-md bg-green-700 text-white hover:bg-green-800 disabled:opacity-50"
                              >
                                {claiming
                                  ? "Claiming…"
                                  : "Claim & create order"}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Section>

              <Section title="My claimed donations">
                {(fbMine ?? []).length === 0 ? (
                  <div className="text-sm text-gray-600">
                    You haven’t claimed any donations yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-500 border-b">
                          <th className="py-2 pr-4">ID</th>
                          <th className="py-2 pr-4">Product</th>
                          <th className="py-2 pr-4">Qty</th>
                          <th className="py-2 pr-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {fbMine!.map((d: any) => (
                          <tr key={d.id}>
                            <td className="py-3 pr-4">#{d.id}</td>
                            <td className="py-3 pr-4">
                              {d.productName || d.productId}
                            </td>
                            <td className="py-3 pr-4">{d.quantity}</td>
                            <td className="py-3 pr-4">
                              <StatusPill status={d.status} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Section>
            </div>
          </RoleGuard>
        )}

        {role === "ADMIN" && (
          <RoleGuard allow={["ADMIN"]}>
            <Section
              title="All donations"
              icon={<Users className="w-5 h-5 text-amber-700" />}
            >
              {(adminAll ?? []).length === 0 ? (
                <div className="text-sm text-gray-600">
                  No donations in the system yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 border-b">
                        <th className="py-2 pr-4">ID</th>
                        <th className="py-2 pr-4">Product</th>
                        <th className="py-2 pr-4">Qty</th>
                        <th className="py-2 pr-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {adminAll!.map((d: any) => (
                        <tr key={d.id}>
                          <td className="py-3 pr-4">#{d.id}</td>
                          <td className="py-3 pr-4">
                            {d.productName || d.productId}
                          </td>
                          <td className="py-3 pr-4">{d.quantity}</td>
                          <td className="py-3 pr-4">
                            <StatusPill status={d.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Section>
          </RoleGuard>
        )}
      </div>
    </section>
  );
}
