// src/app/cart/page.tsx
"use client";

import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Trash2, Minus, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  useGetItemsQuery,
  useUpdateItemQtyMutation,
  useRemoveItemMutation,
  useClearCartMutation,
} from "@/lib/redux/services/cart.api";
import { useCreateSessionMutation } from "@/lib/redux/services/checkout.api";
import { useGetProductQuery } from "@/lib/redux/services/product.api";
import { productImageSrc } from "@/lib/utils/image";
import Modal from "@/components/ui/modal";
import Confirm from "@/components/ui/confirm";

const metadata: Metadata = { title: "Cart" };

// Matches your API object
type CartItem = {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

function Row({
  item,
  onInc,
  onDec,
  onRemove,
  updating,
  removing,
}: {
  item: CartItem;
  onInc: (it: CartItem) => void;
  onDec: (it: CartItem) => void;
  onRemove: (id: number) => void;
  updating: boolean;
  removing: boolean;
}) {
  // fetch product to get its images
  const { data: product, isLoading: loadingProduct } = useGetProductQuery(
    item.productId
  );
  const imgRaw =
    product?.coverImageUrl ||
    (Array.isArray(product?.imageUrls) ? product?.imageUrls[0] : undefined);
  const img = productImageSrc(imgRaw);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 flex gap-4">
      {/* image */}
      <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-gray-50 shrink-0">
        {loadingProduct ? (
          <div className="absolute inset-0 animate-pulse bg-gray-100" />
        ) : (
          <Image
            src={img}
            alt={item.productName}
            fill
            className="object-cover"
            sizes="96px"
          />
        )}
      </div>

      {/* content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-semibold text-gray-900 truncate">
              {item.productName}
            </h3>
            <div className="mt-1 text-sm text-gray-600">
              Unit price:{" "}
              <span className="font-medium">£{item.unitPrice.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={() => onRemove(item.id)}
            className="px-2 py-1.5 rounded-md border hover:bg-red-50 text-red-600"
            title="Remove item"
            disabled={removing}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* qty + line total */}
        <div className="mt-3 flex items-center justify-between">
          <div className="inline-flex items-center gap-2">
            <button
              onClick={() => onDec(item)}
              className="w-8 h-8 rounded-md border hover:bg-gray-50 flex items-center justify-center"
              aria-label="Decrease"
              disabled={updating}
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-10 text-center font-medium">
              {item.quantity}
            </span>
            <button
              onClick={() => onInc(item)}
              className="w-8 h-8 rounded-md border hover:bg-gray-50 flex items-center justify-center"
              aria-label="Increase"
              disabled={updating}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="text-sm sm:text-base font-semibold text-gray-900">
            £{Number(item.lineTotal).toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CartPage() {
  const router = useRouter();
  const { data: items, isLoading, error, refetch } = useGetItemsQuery();
  const [updateQty, { isLoading: updating }] = useUpdateItemQtyMutation();
  const [removeItem, { isLoading: removing }] = useRemoveItemMutation();
  const [clearCart, { isLoading: clearing }] = useClearCartMutation();
  const [createSession, { isLoading: checkingOut }] =
    useCreateSessionMutation();

  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  // Use the server-provided line totals for precision
  const subtotal = useMemo(() => {
    return ((items as unknown as CartItem[]) || []).reduce(
      (sum: number, it: CartItem) => sum + Number(it.lineTotal || 0),
      0
    );
  }, [items]);

  const hasItems = (items?.length || 0) > 0;

  const handleInc = async (it: CartItem) => {
    const next = Math.max(1, it.quantity + 1);
    await updateQty({ productId: it.id, quantity: next })
      .unwrap()
      .catch(() => {});
  };

  const handleDec = async (it: CartItem) => {
    const next = Math.max(1, it.quantity - 1);
    if (next === 0) {
      await removeItem(it.id)
        .unwrap()
        .catch(() => {});
    } else {
      await updateQty({ productId: it.id, quantity: next })
        .unwrap()
        .catch(() => {});
    }
  };
  const handleRemove = async (id: number) => {
    await removeItem(id)
      .unwrap()
      .catch(() => {});
  };
  const handleClear = async () => {
    await clearCart()
      .unwrap()
      .catch(() => {});
    setConfirmClearOpen(false);
  };

  const handleCheckout = async () => {
    const res = await createSession()
      .unwrap()
      .catch(() => null);
    if (res?.checkoutUrl) {
      // ✅ redirect to Stripe (or whatever processor)
      window.location.href = res.checkoutUrl;
      return;
    }
    // fallback
    if (res?.sessionId) {
      // If your backend sometimes only returns sessionId, you could still route to a dedicated page.
      // But your current backend returns checkoutUrl, so the branch above should run.
    }
    refetch();
  };

  return (
    <section className="bg-[#fefef8] min-h-screen py-10 px-6 sm:px-8 lg:px-12">
      <div className="max-w-6xl mx-auto">
        {/* header */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-[#3c4f3d]">Your Cart</h1>
          <Link href="/marketplace" className="text-green-700 hover:underline">
            ← Continue shopping
          </Link>
        </div>

        {/* states */}
        {isLoading && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center text-gray-600">
            Loading your cart…
          </div>
        )}
        {error && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center text-red-600">
            Couldn&apos;t load your cart. Please try again.
          </div>
        )}

        {!isLoading && !error && (
          <>
            {!hasItems ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
                <p className="text-gray-700">Your cart is empty.</p>
                <div className="mt-4">
                  <Link
                    href="/marketplace"
                    className="inline-block px-4 py-2 rounded-lg bg-green-700 text-white hover:bg-green-800"
                  >
                    Browse products
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* items */}
                <div className="lg:col-span-2 space-y-4">
                  {(items as unknown as CartItem[]).map((it) => (
                    <Row
                      key={it.id}
                      item={it}
                      onInc={handleInc}
                      onDec={handleDec}
                      onRemove={handleRemove}
                      updating={updating}
                      removing={removing}
                    />
                  ))}

                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setConfirmClearOpen(true)}
                      className="px-4 py-2 rounded-lg border hover:bg-gray-50 text-red-600"
                      disabled={clearing}
                    >
                      {clearing ? "Clearing…" : "Clear cart"}
                    </button>
                    <Link
                      href="/marketplace"
                      className="text-green-700 hover:underline"
                    >
                      ← Continue shopping
                    </Link>
                  </div>
                </div>

                {/* summary */}
                <aside className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 h-fit">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Order Summary
                  </h2>

                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">
                        £{subtotal.toFixed(2)}
                      </span>
                    </div>
                    {/* Add shipping/tax rows here if your backend provides them */}
                  </div>

                  <div className="mt-6">
                    <button
                      onClick={handleCheckout}
                      disabled={!hasItems || checkingOut}
                      className="w-full px-4 py-3 rounded-lg bg-green-700 text-white hover:bg-green-800 disabled:opacity-60"
                    >
                      {checkingOut ? "Starting checkout…" : "Checkout"}
                    </button>
                  </div>

                  <p className="mt-2 text-xs text-gray-500">
                    You’ll be redirected after we create a checkout session.
                  </p>
                </aside>
              </div>
            )}
          </>
        )}
      </div>

      {/* Clear cart confirm */}
      <Modal
        open={confirmClearOpen}
        onClose={() => setConfirmClearOpen(false)}
        title="Clear cart"
        maxWidth="max-w-md"
      >
        <Confirm
          title="Remove all items?"
          message="This will remove every item from your cart."
          confirmText={clearing ? "Clearing…" : "Clear cart"}
          onConfirm={handleClear}
          onCancel={() => setConfirmClearOpen(false)}
          loading={clearing}
          confirmClass="bg-red-600 hover:bg-red-700 text-white"
        />
      </Modal>
    </section>
  );
}
