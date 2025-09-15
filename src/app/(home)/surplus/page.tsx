// src/app/surplus/page.tsx
"use client";

import { ShoppingBasket, PlusCircle } from "lucide-react";
import RoleGuard from "@/lib/utils/roleGuard";
import { useAppSelector } from "@/lib/redux/store";
import Spinner from "@/components/ui/spinner";
import ErrorState from "@/components/ui/errorstate";
import Modal from "@/components/ui/modal";

import {
  useListSurplusQuery,
  useClaimSurplusMutation,
  useCreateSurplusMutation,
} from "@/lib/redux/services/surplus.api";
import { useState } from "react";

function clampInt(n: number, min = 1, max = 1_000_000) {
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, Math.floor(n)));
}

export default function SurplusPage() {
  const { user } = useAppSelector((s) => s.auth);
  const role = user?.role;

  const { data: surplus, isLoading, error, refetch } = useListSurplusQuery();
  const [claimSurplus, { isLoading: claiming }] = useClaimSurplusMutation();
  const [createSurplus, { isLoading: creating }] = useCreateSurplusMutation();

  const [addOpen, setAddOpen] = useState(false);
  const [addProductId, setAddProductId] = useState<number | "">("");
  const [addQty, setAddQty] = useState<number>(1);

  if (isLoading) return <Spinner />;
  if (error) return <ErrorState />;

  const canAdd = role === "FARMER" || role === "ADMIN";
  const isFoodbank = role === "FOODBANK";

  async function submitCreate() {
    if (!addProductId) return;
    await createSurplus({
      productId: Number(addProductId),
      quantity: clampInt(addQty, 1, 999999),
    })
      .unwrap()
      .catch(() => {});
    setAddOpen(false);
    setAddProductId("");
    setAddQty(1);
    refetch();
  }

  return (
    <section className="bg-[#fefef8] min-h-screen">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 py-8 space-y-8">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#3c4f3d] flex items-center gap-2">
            <ShoppingBasket className="w-6 h-6" /> Surplus
          </h1>
          {canAdd && (
            <button
              onClick={() => setAddOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-700 text-white hover:bg-green-800"
            >
              <PlusCircle className="w-5 h-5" /> Add to surplus
            </button>
          )}
        </header>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {(surplus ?? []).length === 0 ? (
            <div className="text-sm text-gray-600">
              No surplus items right now.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="py-2 pr-4">ID</th>
                    <th className="py-2 pr-4">Product</th>
                    <th className="py-2 pr-4">Available</th>
                    <th className="py-2 pr-4">Request</th>
                    <th className="py-2 pr-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {(surplus ?? []).map((s: any) => (
                    <SurplusRow
                      key={s.id ?? s.donationId ?? s.surplusId}
                      s={s}
                      canClaim={isFoodbank}
                      onClaim={async (productId, qty) => {
                        await claimSurplus({ productId, quantity: qty })
                          .unwrap()
                          .catch(() => {});
                        refetch();
                      }}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* Add to surplus modal (Farmer/Admin) */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add to surplus"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Product ID
            </label>
            <input
              type="number"
              value={addProductId}
              onChange={(e) =>
                setAddProductId(
                  e.currentTarget.value === ""
                    ? ""
                    : Number(e.currentTarget.value)
                )
              }
              className="mt-1 w-full border rounded-lg px-3 py-2"
              placeholder="Enter your product ID"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Quantity
            </label>
            <input
              type="number"
              min={1}
              value={addQty}
              onChange={(e) =>
                setAddQty(clampInt(e.currentTarget.valueAsNumber, 1, 999999))
              }
              className="mt-1 w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setAddOpen(false)}
              className="px-4 py-2 rounded-lg border hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={submitCreate}
              disabled={!addProductId || creating}
              className="px-4 py-2 rounded-lg bg-green-700 text-white hover:bg-green-800 disabled:opacity-50"
            >
              {creating ? "Adding…" : "Add"}
            </button>
          </div>
          <p className="text-xs text-gray-500">
            This creates a surplus entry using <code>POST /surplus</code> with{" "}
            <code>{`{ productId, quantity }`}</code>.
          </p>
        </div>
      </Modal>
    </section>
  );
}

function SurplusRow({
  s,
  canClaim,
  onClaim,
}: {
  s: any;
  canClaim: boolean;
  onClaim: (id: number, qty: number) => void;
}) {
  const [qty, setQty] = useState<number>(1);
  const max = Math.max(1, Number(s.quantity ?? s.availableQuantity ?? 1));
  const id = Number(s.id ?? s.donationId ?? s.surplusId);
  const productLabel = s.productName ?? s.product?.name ?? s.productId ?? "—";

  return (
    <tr>
      <td className="py-3 pr-4">#{Number.isFinite(id) ? id : "—"}</td>
      <td className="py-3 pr-4">{productLabel}</td>
      <td className="py-3 pr-4">{max}</td>
      <td className="py-3 pr-4">
        <input
          type="number"
          inputMode="numeric"
          step={1}
          min={1}
          max={max}
          value={qty}
          onChange={(e) =>
            setQty(clampInt(e.currentTarget.valueAsNumber, 1, max))
          }
          className="w-24 border rounded-lg px-3 py-1.5"
        />
      </td>
      <td className="py-3 pr-4">
        <button
          onClick={() =>
            Number.isFinite(id) && onClaim(id, clampInt(qty, 1, max))
          }
          disabled={!canClaim || !Number.isFinite(id)}
          className="px-3 py-1.5 rounded-md bg-green-700 text-white hover:bg-green-800 disabled:opacity-50"
          title={!canClaim ? "Only foodbanks can claim" : undefined}
        >
          Claim
        </button>
      </td>
    </tr>
  );
}
