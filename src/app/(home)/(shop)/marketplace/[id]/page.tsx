// src/app/(shop)/marketplace/[id]/page.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Heart, Pencil, Trash2 } from "lucide-react";

import {
  useGetProductQuery,
  useDeleteProductMutation,
} from "@/lib/redux/services/product.api";

import {
  useCreateDonationMutation,
  useListDonationsForFoodBankQuery,
  useClaimAndOrderMutation, // request donation directly
} from "@/lib/redux/services/donation.api";

import {
  useListSurplusQuery,
  useClaimSurplusMutation,
} from "@/lib/redux/services/surplus.api";

import { useAddItemMutation } from "@/lib/redux/services/cart.api";
import { useCreateSessionMutation } from "@/lib/redux/services/checkout.api";
import { useAppSelector } from "@/lib/redux/store";

import Carousel from "@/components/ui/carousel";
import Modal from "@/components/ui/modal";
import Confirm from "@/components/ui/confirm";

// --- helpers ---
function daysUntil(dateISO?: string): number | null {
  if (!dateISO) return null;
  const t = new Date(dateISO);
  if (Number.isNaN(t.getTime())) return null;
  const now = new Date();
  const s = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const e = new Date(t.getFullYear(), t.getMonth(), t.getDate());
  return Math.floor((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
}
function expiryBadge(days: number | null) {
  if (days === null)
    return { text: "No date", className: "bg-gray-100 text-gray-700" };
  if (days <= 0)
    return {
      text: "Expired",
      className: "bg-red-50 text-red-700 border border-red-200",
    };
  if (days <= 7)
    return {
      text: `${days} day${days === 1 ? "" : "s"} left`,
      className: "bg-red-50 text-red-700 border border-red-200",
    };
  if (days <= 24)
    return {
      text: `${days} days left`,
      className: "bg-amber-50 text-amber-700 border border-amber-200",
    };
  return { text: `${days} days left`, className: "bg-gray-100 text-gray-700" };
}

function isOwnerFarmer(product: any, user: any) {
  return (
    user?.role === "FARMER" && Number(product?.farmerId) === Number(user?.id)
  );
}
function canManage(product: any, user: any) {
  if (!user) return false;
  if (user.role === "ADMIN") return true;
  return isOwnerFarmer(product, user);
}
function isFoodbank(user: any) {
  return user?.role === "FOODBANK";
}
function canPurchase(product: any, user: any) {
  if (!user) return true; // allow guests; change if you require login
  return !isOwnerFarmer(product, user);
}
function nearExpiry(daysLeft: number | null) {
  return daysLeft !== null && daysLeft <= 7; // your backend "about to expire" rule
}

// Donation/Surplus availability predicate (adjust to your DTO)
function isAvailableEntry(x: any) {
  const s = (x?.status || x?.donationStatus || "").toString().toUpperCase();
  return !s || s.includes("AVAILABLE") || s.includes("OPEN");
}

type ModalState = { type: "delete" | "donate" } | null;

export default function ProductDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAppSelector((s) => s.auth);

  // product
  const { data: product, isLoading, error, refetch } = useGetProductQuery(id);
  const [deleteProduct, { isLoading: deleting }] = useDeleteProductMutation();

  // farmer create donation
  const [createDonation, { isLoading: donating }] = useCreateDonationMutation();

  // foodbank — get available donations & surplus, claim endpoints
  const { data: donationsFB } = useListDonationsForFoodBankQuery(undefined, {
    skip: !isFoodbank(user),
  });
  const { data: surplus } = useListSurplusQuery(undefined, {
    skip: !isFoodbank(user),
  });
  const [claimAndOrder, { isLoading: claimingDonation }] =
    useClaimAndOrderMutation();
  const [claimSurplus, { isLoading: claimingSurplus }] =
    useClaimSurplusMutation();

  // cart/checkout
  const [addItem, { isLoading: addingToCart }] = useAddItemMutation();
  const [createSession, { isLoading: checkingOut }] =
    useCreateSessionMutation();

  // ui state
  const [modal, setModal] = useState<ModalState>(null);
  const [donateQty, setDonateQty] = useState<number>(1);
  const [buyQty, setBuyQty] = useState<number>(1);

  const canManageThis = useMemo(
    () => canManage(product, user),
    [product, user]
  );
  const ownerIsFarmer = useMemo(
    () => isOwnerFarmer(product, user),
    [product, user]
  );
  const isFoodBankUser = useMemo(() => isFoodbank(user), [user]);

  const dLeft = useMemo(
    () => daysUntil(product?.bestBeforeDate),
    [product?.bestBeforeDate]
  );
  const badge = expiryBadge(dLeft);

  // filter available donation/surplus entries for THIS product (foodbank view)
  const donationsForProduct = useMemo(
    () =>
      (donationsFB ?? []).filter(
        (d: any) =>
          Number(d.productId) === Number(product?.id) && isAvailableEntry(d)
      ),
    [donationsFB, product?.id]
  );
  const surplusForProduct = useMemo(
    () =>
      (surplus ?? []).filter(
        (s: any) =>
          Number(s.productId) === Number(product?.id) && isAvailableEntry(s)
      ),
    [surplus, product?.id]
  );

  // farmer: show donation when near-expiry OR product is already on surplus list
  const farmerCanDonate =
    ownerIsFarmer && (nearExpiry(dLeft) || surplusForProduct.length > 0);

  // buyer visibility
  const showPurchaseArea = canPurchase(product, user);

  // --- actions ---
  async function confirmDelete() {
    if (!product) return;
    await deleteProduct(product.id)
      .unwrap()
      .catch(() => {});
    setModal(null);
    router.replace("/marketplace");
  }

  async function confirmDonate() {
    if (!product || donateQty <= 0) return;
    await createDonation({
      productId: Number(product.id),
      quantity: donateQty,
    })
      .unwrap()
      .catch(() => {});
    setModal(null);
    refetch();
  }

  async function handleAddToCart() {
    if (!product) return;
    const qty = Math.max(
      1,
      Math.min(buyQty, Number(product.quantityAvailable || 1))
    );
    await addItem({ productId: Number(product.id), quantity: qty })
      .unwrap()
      .catch(() => {});
  }

  async function handleCheckoutNow() {
    const res = await createSession()
      .unwrap()
      .catch(() => null);
    if (res?.checkoutUrl) window.location.href = res.checkoutUrl;
  }

  // foodbank: claim specific donation entry (no quantity param in your RTK definition)
  async function claimDonationEntry(donationId: number) {
    await claimAndOrder({ id: donationId })
      .unwrap()
      .catch(() => {});
    refetch();
  }

  // foodbank: claim specific surplus entry with quantity input
  async function claimSurplusEntry(surplusId: number, qty: number) {
    if (!product || qty <= 0) return;
    await claimSurplus({
      productId: Number(product.id),
      quantity: qty,
    })
      .unwrap()
      .catch(() => {});
    refetch();
  }

  return (
    <section className="bg-[#fefef8] min-h-screen py-10 px-6 sm:px-8 lg:px-12">
      <div className="max-w-6xl mx-auto">
        {/* header */}
        <div className="mb-6 flex items-center justify-between">
          <Link href="/marketplace" className="text-green-700 hover:underline">
            ← Back to marketplace
          </Link>

          <div className="flex items-center gap-2">
            {/* Like (wire if you add a like endpoint) */}
            <button
              className="px-3 py-1.5 rounded-md border flex items-center gap-2 transition hover:bg-gray-50"
              title="Like"
            >
              <Heart className="w-4 h-4 stroke-red-500" />
              <span className="text-sm">Like</span>
            </button>

            {/* Manage actions (Admin or owning Farmer) */}
            {canManageThis && (
              <>
                <button
                  onClick={() =>
                    router.push(`/marketplace/${product?.id}/edit`)
                  }
                  className="px-3 py-1.5 text-sm rounded-md border hover:bg-gray-50 flex items-center gap-1"
                >
                  <Pencil className="w-4 h-4" /> Edit
                </button>
                <button
                  onClick={() => setModal({ type: "delete" })}
                  className="px-3 py-1.5 text-sm rounded-md border text-red-600 hover:bg-red-50 flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </>
            )}
          </div>
        </div>

        {/* states */}
        {isLoading && (
          <div className="text-center text-gray-600 py-12">
            Loading product…
          </div>
        )}
        {error && (
          <div className="text-center text-red-600 py-12">
            Couldn&apos;t load product.
          </div>
        )}

        {!isLoading && product && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* images */}
            <Carousel
              images={[
                product.coverImageUrl,
                ...(product.imageUrls || []),
              ].filter((img): img is string => typeof img === "string")}
              alt={product.name}
            />

            {/* info */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h1 className="text-2xl font-semibold text-gray-900">
                {product.name}
              </h1>

              <div className="mt-2 flex items-center gap-2">
                <span className="text-green-700 text-lg font-semibold">
                  £{Number(product.price).toFixed(2)}
                </span>
                {typeof product.quantityAvailable === "number" && (
                  <span className="text-sm text-gray-500">
                    • {product.quantityAvailable} in stock
                  </span>
                )}
              </div>

              <div className="mt-3 text-sm text-gray-700 whitespace-pre-line">
                {product.description || "No description provided."}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {product.category && (
                  <span className="px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs">
                    {product.category}
                  </span>
                )}
                {Array.isArray(product.tags) &&
                  product.tags.map((t: string) => (
                    <span
                      key={t}
                      className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs"
                    >
                      {t}
                    </span>
                  ))}
              </div>

              <div className="mt-4 space-y-2 text-sm">
                {product.pickupAddress && (
                  <div>
                    <span className="text-gray-500">Pickup:</span>{" "}
                    <span className="text-gray-800">
                      {product.pickupAddress}
                    </span>
                  </div>
                )}
                {product.bestBeforeDate && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Best before:</span>
                    <span className="text-gray-800">
                      {new Date(product.bestBeforeDate).toLocaleDateString()}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] ${badge.className}`}
                    >
                      {badge.text}
                    </span>
                  </div>
                )}
                {product.farmerName && (
                  <div>
                    <span className="text-gray-500">Farmer:</span>{" "}
                    <span className="text-gray-800">{product.farmerName}</span>
                  </div>
                )}
              </div>

              {/* Action areas */}
              <div className="mt-6 space-y-6">
                {/* Purchase (everyone except owning farmer) */}
                {showPurchaseArea && (
                  <div className="p-4 rounded-xl border border-gray-200">
                    <div className="text-sm font-semibold text-gray-800">
                      Buy
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      <label className="text-sm text-gray-700">Quantity</label>
                      <input
                        type="number"
                        min={1}
                        max={Math.max(
                          1,
                          Number(product.quantityAvailable || 1)
                        )}
                        value={buyQty}
                        onChange={(e) =>
                          setBuyQty(Math.max(1, Number(e.target.value)))
                        }
                        className="w-28 border rounded-lg px-3 py-1.5"
                      />
                      <button
                        onClick={handleAddToCart}
                        disabled={addingToCart}
                        className="px-3 py-1.5 rounded-lg border hover:bg-gray-50"
                      >
                        {addingToCart ? "Adding…" : "Add to cart"}
                      </button>
                      <button
                        onClick={handleCheckoutNow}
                        disabled={checkingOut}
                        className="px-3 py-1.5 rounded-lg bg-green-700 text-white hover:bg-green-800"
                      >
                        {checkingOut ? "Processing…" : "Checkout now"}
                      </button>
                    </div>
                  </div>
                )}

                {/* FARMER (owner) → Add to Donation list (near expiry OR already on surplus) */}
                {farmerCanDonate && (
                  <div className="p-4 rounded-xl border border-amber-200 bg-amber-50">
                    <div className="text-sm font-semibold text-amber-800">
                      Add to donation list
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      <label className="text-sm text-gray-700">Quantity</label>
                      <input
                        type="number"
                        min={1}
                        max={Math.max(
                          1,
                          Number(product.quantityAvailable || 1)
                        )}
                        value={donateQty}
                        onChange={(e) =>
                          setDonateQty(Math.max(1, Number(e.target.value)))
                        }
                        className="w-28 border rounded-lg px-3 py-1.5"
                      />
                      <button
                        onClick={() => setModal({ type: "donate" })}
                        className="px-3 py-1.5 rounded-lg bg-green-700 text-white hover:bg-green-800"
                      >
                        Add to donation
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-amber-700">
                      Available when the item is about to expire or already
                      flagged as surplus.
                    </p>
                  </div>
                )}

                {/* FOODBANK: Request donation entries for THIS product */}
                {isFoodBankUser && donationsForProduct.length > 0 && (
                  <div className="p-4 rounded-2xl border border-green-200 bg-green-50">
                    <div className="text-sm font-semibold text-green-800 mb-2">
                      Request as donation (available entries)
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-gray-600 border-b">
                            <th className="py-2 pr-4">Donation ID</th>
                            <th className="py-2 pr-4">Qty</th>
                            <th className="py-2 pr-4"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {donationsForProduct.map((d: any) => (
                            <tr key={d.id}>
                              <td className="py-3 pr-4">#{d.id}</td>
                              <td className="py-3 pr-4">{d.quantity}</td>
                              <td className="py-3 pr-4">
                                <button
                                  onClick={() =>
                                    claimDonationEntry(Number(d.id))
                                  }
                                  disabled={claimingDonation}
                                  className="px-3 py-1.5 rounded-md bg-green-700 text-white hover:bg-green-800"
                                >
                                  {claimingDonation
                                    ? "Requesting…"
                                    : "Request donation"}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="mt-2 text-xs text-green-700">
                      Requesting will claim this donation and create an order
                      for pickup/delivery.
                    </p>
                  </div>
                )}

                {/* FOODBANK: Claim from surplus entries for THIS product */}
                {isFoodBankUser && surplusForProduct.length > 0 && (
                  <div className="p-4 rounded-2xl border border-sky-200 bg-sky-50">
                    <div className="text-sm font-semibold text-sky-800 mb-2">
                      Request from surplus (available entries)
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-gray-600 border-b">
                            <th className="py-2 pr-4">Surplus ID</th>
                            <th className="py-2 pr-4">Available</th>
                            <th className="py-2 pr-4">Request qty</th>
                            <th className="py-2 pr-4"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {surplusForProduct.map((s: any) => (
                            <SurplusRow
                              key={s.id}
                              s={s}
                              productId={Number(product.id)}
                              onClaim={claimSurplusEntry}
                              claiming={claimingSurplus}
                            />
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="mt-2 text-xs text-sky-700">
                      We’ll send <code>{`{ productId, quantity }`}</code> in the
                      body when claiming.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* DELETE */}
      <Modal
        open={modal?.type === "delete"}
        onClose={() => setModal(null)}
        title="Delete Product"
        maxWidth="max-w-md"
      >
        <Confirm
          title="Delete this product?"
          message={`“${product?.name ?? ""}” will be permanently removed.`}
          confirmText="Delete"
          onConfirm={confirmDelete}
          onCancel={() => setModal(null)}
          loading={deleting}
        />
      </Modal>

      {/* DONATE (farmer) */}
      <Modal
        open={modal?.type === "donate"}
        onClose={() => setModal(null)}
        title="Confirm Donation"
        maxWidth="max-w-md"
      >
        <Confirm
          title="Add to donation list?"
          message={`Donate ${donateQty} unit(s) of “${product?.name ?? ""}”.`}
          confirmText={donating ? "Adding…" : "Add to donation"}
          onConfirm={confirmDonate}
          onCancel={() => setModal(null)}
          loading={donating}
          confirmClass="bg-green-700 hover:bg-green-800 text-white"
        />
      </Modal>
    </section>
  );
}

/** Row component for surplus claims with an inline quantity input */
function SurplusRow({
  s,
  productId,
  onClaim,
  claiming,
}: {
  s: any;
  productId: number;
  onClaim: (id: number, qty: number) => Promise<void>;
  claiming: boolean;
}) {
  const [qty, setQty] = useState<number>(1);
  const max = Math.max(1, Number(s.quantity || s.availableQuantity || 1));

  return (
    <tr>
      <td className="py-3 pr-4">#{s.id}</td>
      <td className="py-3 pr-4">{max}</td>
      <td className="py-3 pr-4">
        <input
          type="number"
          className="w-24 border rounded-lg px-3 py-1.5"
          min={1}
          max={max}
          value={qty}
          onChange={(e) =>
            setQty(Math.max(1, Math.min(Number(e.target.value || 1), max)))
          }
        />
      </td>
      <td className="py-3 pr-4">
        <button
          onClick={() => onClaim(Number(s.id), qty)}
          disabled={claiming}
          className="px-3 py-1.5 rounded-md bg-green-700 text-white hover:bg-green-800"
        >
          {claiming ? "Requesting…" : "Claim"}
        </button>
      </td>
    </tr>
  );
}
