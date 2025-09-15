// src/app/dashboard/foodbank/page.tsx
"use client";

import { HeartHandshake, ShoppingBasket } from "lucide-react";
import RoleGuard from "@/lib/utils/roleGuard";
import {
  useListDonationsForFoodBankQuery,
  useClaimAndOrderMutation, // prefer this combined flow
} from "@/lib/redux/services/donation.api";
import {
  useListSurplusQuery,
  useClaimSurplusMutation,
} from "@/lib/redux/services/surplus.api";
import Spinner from "@/components/ui/spinner";
import ErrorState from "@/components/ui/errorstate";
import { useState } from "react";

function SectionTitle({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
      {icon}
      {children}
    </h2>
  );
}

export default function FoodbankDashboard() {
  const {
    data: donations,
    isLoading: dLoad,
    error: dErr,
  } = useListDonationsForFoodBankQuery();
  const {
    data: surplus,
    isLoading: sLoad,
    error: sErr,
  } = useListSurplusQuery();

  // console.log("Surplus data:", surplus);
  const [claimAndOrder, { isLoading: claimingDonation }] =
    useClaimAndOrderMutation();
  const [claimSurplus, { isLoading: claimingSurplus }] =
    useClaimSurplusMutation();

  if (dLoad || sLoad) return <Spinner />;
  if (dErr || sErr) return <ErrorState />;

  return (
    <RoleGuard allow={["FOODBANK"]}>
      <section className="bg-[#fefef8] min-h-screen">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 py-8 space-y-8">
          <header>
            <h1 className="text-2xl sm:text-3xl font-semibold text-[#3c4f3d]">
              Foodbank Dashboard
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Claim donations or request from surplus. You can also purchase
              products normally from the marketplace.
            </p>
          </header>

          {/* Donations */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <SectionTitle
                icon={<HeartHandshake className="w-5 h-5 text-amber-700" />}
              >
                Available Donations
              </SectionTitle>
            </div>
            {(donations ?? []).length === 0 ? (
              <div className="text-sm text-gray-600">
                No donations available right now.
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
                    {(donations ?? []).map((d: any) => (
                      <tr key={d.id}>
                        <td className="py-3 pr-4">#{d.id}</td>
                        <td className="py-3 pr-4">
                          {d.productName || d.productId}
                        </td>
                        <td className="py-3 pr-4">{d.quantity}</td>
                        <td className="py-3 pr-4">
                          <button
                            onClick={() => claimAndOrder({ id: d.id })}
                            disabled={claimingDonation}
                            className="px-3 py-1.5 rounded-md bg-green-700 text-white hover:bg-green-800 disabled:opacity-50"
                          >
                            {claimingDonation ? "Claiming…" : "Claim donation"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Surplus */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <SectionTitle
                icon={<ShoppingBasket className="w-5 h-5 text-sky-700" />}
              >
                System-Suggested Surplus
              </SectionTitle>
            </div>
            {(surplus ?? []).length === 0 ? (
              <div className="text-sm text-gray-600">
                No surplus items suggested right now.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b">
                      <th className="py-2 pr-4">ID</th>
                      <th className="py-2 pr-4">Product</th>
                      <th className="py-2 pr-4">Available</th>
                      <th className="py-2 pr-4">Request qty</th>
                      <th className="py-2 pr-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {(surplus ?? []).map((s: any) => (
                      <SurplusRow
                        key={s.id}
                        s={s}
                        onClaim={( productId, qty) =>
                          claimSurplus({ productId, quantity: qty })
                        }
                        claiming={claimingSurplus}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="mt-2 text-xs text-gray-500">
              Claim sends <code>{`{ productId, quantity }`}</code> in the
              request body, as per your Postman definition.
            </p>
          </section>
        </div>
      </section>
    </RoleGuard>
  );
}

function SurplusRow({
  s,
  onClaim,
  claiming,
}: {
  s: any;
  onClaim: (productId: number, qty: number) => void; // ✅ two args
  claiming: boolean;
}) {
  const [qty, setQty] = useState<number>(1);

  const max = Math.max(1, Number(s.quantity ?? s.availableQuantity ?? 1));

  // Robustly resolve productId (supports nested shape too)
  const rawPid = s?.id ?? s?.productId;
  const productId = Number.isFinite(Number(rawPid)) ? Number(rawPid) : null;

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    // valueAsNumber avoids string parsing edge-cases
    const n = e.currentTarget.valueAsNumber;
    const safe = Number.isFinite(n) ? n : 1;
    const clamped = Math.min(max, Math.max(1, Math.floor(safe)));
    setQty(clamped);
  };

  const handleClaim = () => {
    if (productId == null) return; 
    const clamped = Math.min(max, Math.max(1, Math.floor(qty)));
    onClaim(productId, clamped);
  };

  return (
    <tr>
      <td className="py-3 pr-4">#{s.id}</td>
      <td className="py-3 pr-4">{s?.name || "—"}</td>
      <td className="py-3 pr-4">{max}</td>
      <td className="py-3 pr-4">
        <input
          type="number"
          inputMode="numeric"
          step={1}
          min={1}
          max={max}
          value={qty}
          onChange={handleChange}
          className="w-24 border rounded-lg px-3 py-1.5"
        />
      </td>
      <td className="py-3 pr-4">
        <button
          onClick={handleClaim}
          disabled={claiming || productId == null}
          className="px-3 py-1.5 rounded-md bg-green-700 text-white hover:bg-green-800 disabled:opacity-50"
          title={productId == null ? "Missing product id" : "Claim"}
        >
          {claiming ? "Requesting…" : "Claim"}
        </button>
      </td>
    </tr>
  );
}
