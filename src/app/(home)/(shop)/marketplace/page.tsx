// src/app/(shop)/marketplace/page.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Truck,
  RotateCcw,
  ShoppingCart,
  Headphones,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  Plus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  useListProductsQuery,
  useDeleteProductMutation,
} from "@/lib/redux/services/product.api";
import { useAppSelector } from "@/lib/redux/store";
import { productImageSrc } from "@/lib/utils/image";
import Modal from "@/components/ui/modal";
import ProductForm from "@/components/forms/products/ProductForm";
import Confirm from "@/components/ui/confirm";

const features = [
  {
    icon: <ShoppingCart />,
    label: "Member Discount",
    desc: "Only for selected User App",
  },
  {
    icon: <RotateCcw />,
    label: "Money Return",
    desc: "Back guarantee in 7 days",
  },
  { icon: <Truck />, label: "Free Shipping", desc: "Order over $100" },
  { icon: <Headphones />, label: "Online Support", desc: "Support 24/7" },
];

function canManageProduct(
  product: any,
  user: { id: number; role: string } | null | undefined
) {
  if (!user) return false;
  if (user.role === "ADMIN") return true;
  return (
    user.role === "FARMER" && Number(product?.farmerId) === Number(user.id)
  );
}
function canCreateProduct(user: { role: string } | null | undefined) {
  return !!user && (user.role === "ADMIN" || user.role === "FARMER");
}

function daysUntil(dateISO?: string): number | null {
  if (!dateISO) return null;
  const target = new Date(dateISO);
  if (Number.isNaN(target.getTime())) return null;
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(
    target.getFullYear(),
    target.getMonth(),
    target.getDate()
  );
  const ms = end.getTime() - start.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}
function expiryClasses(days: number | null) {
  if (days === null)
    return { text: "text-gray-500", badge: "bg-gray-100 text-gray-600" };
  if (days <= 10)
    return {
      text: "text-red-600",
      badge: "bg-red-50 text-red-700 border border-red-200",
    };
  if (days <= 24)
    return {
      text: "text-amber-600",
      badge: "bg-amber-50 text-amber-700 border border-amber-200",
    };
  return { text: "text-gray-500", badge: "bg-gray-100 text-gray-700" };
}

type ModalState =
  | { type: "create" }
  | { type: "edit"; product: any }
  | { type: "delete"; product: any }
  | null;

export default function MarketplacePage() {
  const router = useRouter();
  const { user } = useAppSelector((s) => s.auth);

  const { data: products, isLoading, error, refetch } = useListProductsQuery();
  const [deleteProduct, { isLoading: deleting }] = useDeleteProductMutation();

  const [modal, setModal] = useState<ModalState>(null);

  const handleDeleteConfirm = async () => {
    if (modal?.type !== "delete") return;
    try {
      await deleteProduct(modal.product.id).unwrap();
      setModal(null);
      refetch();
    } catch {
      // noop: Confirm component shows "Please wait..." during delete
    }
  };

  return (
    <section className="bg-[#fefef8] py-16 px-6 sm:px-8 lg:px-12">
      {/* HERO */}
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-8 bg-[#5a9052] rounded-3xl overflow-hidden p-6 sm:p-8 mb-12 text-white">
        <div className="flex-1">
          <span className="text-xs sm:text-sm bg-white text-green-700 px-3 py-1 rounded-full font-semibold inline-block">
            100% Natural Organic
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl font-bold leading-tight">
            Respect Nature,
            <br />
            <span className="text-white/90">Gain Benefits</span>
          </h2>
          <button
            onClick={() => router.push("/contact")}
            className="mt-6 px-6 py-3 bg-white text-green-800 font-medium rounded-full shadow hover:bg-gray-100 transition"
          >
            Contact Us →
          </button>
        </div>
        <div className="flex-1 w-full">
          <Image
            src="/images/market-hero.png"
            alt="farm"
            height={480}
            width={480}
            className="rounded-2xl object-cover w-full h-64 sm:h-80 lg:h-full"
            priority
          />
        </div>
      </div>

      {/* FEATURES */}
      <div className="max-w-7xl mx-auto flex flex-wrap justify-center gap-6 mb-16">
        {features.map((f, i) => (
          <div
            key={i}
            className="flex flex-col items-center min-w-[140px] text-gray-700 space-y-2 text-center"
          >
            <div className="text-yellow-600 w-10 h-10 flex items-center justify-center">
              {f.icon}
            </div>
            <h4 className="font-semibold text-sm">{f.label}</h4>
            <p className="text-xs text-gray-500">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* PRODUCTS */}
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 gap-4">
          <h3 className="text-2xl font-semibold text-[#3c4f3d]">
            Check Our Products
          </h3>

          {canCreateProduct(user) && (
            <button
              onClick={() => setModal({ type: "create" })}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-700 text-white hover:bg-green-800 transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Product
            </button>
          )}

          <div className="sm:w-full lg:hidden flex gap-2 place-content-end lg:place-content-center">
            <button className="p-2 border rounded hover:bg-gray-100">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="p-2 border rounded hover:bg-gray-100">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {isLoading && (
          <div className="text-center text-gray-600 py-10">
            Loading products…
          </div>
        )}
        {error && (
          <div className="text-center text-red-600 py-10">
            Couldn&apos;t load products. Please try again.
          </div>
        )}

        {!isLoading && !error && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {(products ?? []).map((p: any) => {
              const src = productImageSrc(p.coverImageUrl || p.imageUrls?.[0]);
              const manage = canManageProduct(p, user);
              const dLeft = daysUntil(p.bestBeforeDate);
              const colors = expiryClasses(dLeft);

              return (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition relative group border border-gray-100"
                >
                  {/* Image */}
                  <div className="w-full aspect-square rounded-xl bg-gray-50 overflow-hidden">
                    <Image
                      src={src}
                      alt={p.name}
                      width={320}
                      height={320}
                      className="object-cover w-full h-full group-hover:scale-[1.02] transition-transform"
                    />
                  </div>

                  {/* Content */}
                  <div className="mt-3">
                    <h4 className="font-semibold text-gray-800 mb-1 text-md line-clamp-1">
                      {p.name}
                    </h4>
                    <div className="text-sm text-gray-600 flex items-baseline gap-2">
                      <span className="font-medium text-green-700">
                        £{Number(p.price).toFixed(2)}
                      </span>
                      {typeof p.quantityAvailable === "number" && (
                        <span className="text-xs text-gray-400">
                          • {p.quantityAvailable} in stock
                        </span>
                      )}
                    </div>
                    {p.bestBeforeDate && (
                      <div className={`text-[12px] mt-1 ${colors.text}`}>
                        Best before:{" "}
                        {new Date(p.bestBeforeDate).toLocaleDateString()}
                        {dLeft !== null && (
                          <span
                            className={`ml-2 px-2 py-0.5 rounded-full text-[11px] ${colors.badge}`}
                          >
                            {dLeft < 0
                              ? "Expired"
                              : `${dLeft} day${dLeft === 1 ? "" : "s"}`}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* View */}
                  <Link
                    href={`/marketplace/${p.id}`}
                    className="absolute bottom-[1.2rem] right-[1.2rem] bg-[#f3e38e] hover:bg-[#e9dc59] w-10 h-10 flex items-center justify-center rounded-full shadow transition"
                    title="View details"
                  >
                    <ArrowUpRight className="w-5 h-5 text-[#3c4f3d]" />
                  </Link>

                  {/* Manage */}
                  {manage && (
                    <div className="mt-3 flex items-center justify-start gap-2 opacity-0 group-hover:opacity-100 transition">
                      <button
                        onClick={() => setModal({ type: "edit", product: p })}
                        className="px-2.5 py-1.5 text-xs rounded-md border hover:bg-gray-50 flex items-center gap-1"
                        title="Edit product"
                      >
                        <Pencil className="w-4 h-4" /> Edit
                      </button>
                      <button
                        onClick={() => setModal({ type: "delete", product: p })}
                        className="px-2.5 py-1.5 text-xs rounded-md border text-red-600 hover:bg-red-50 flex items-center gap-1"
                        title="Delete product"
                      >
                        <Trash2 className="w-4 h-4" /> Delete
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      <Modal
        open={modal?.type === "create" || modal?.type === "edit"}
        onClose={() => setModal(null)}
        title={modal?.type === "edit" ? "Edit Product" : "Add New Product"}
        maxWidth="max-w-2xl"
      >
        <ProductForm
          initial={
            modal?.type === "edit"
              ? {
                  id: modal.product.id,
                  name: modal.product.name,
                  description: modal.product.description,
                  price: modal.product.price,
                  quantityAvailable: modal.product.quantityAvailable,
                  category: modal.product.category,
                  pickupAddress: modal.product.pickupAddress,
                  bestBeforeDate: modal.product.bestBeforeDate,
                }
              : undefined
          }
          onDone={() => {
            setModal(null);
            // Refresh the list when saved
            refetch();
          }}
        />
      </Modal>

      {/* DELETE MODAL */}
      <Modal
        open={modal?.type === "delete"}
        onClose={() => setModal(null)}
        title="Delete Product"
        maxWidth="max-w-md"
      >
        <Confirm
          title="Delete this product?"
          message={`“${
            modal?.type === "delete" ? modal.product?.name : ""
          }” will be permanently removed.`}
          confirmText="Delete"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setModal(null)}
          loading={deleting}
        />
      </Modal>
    </section>
  );
}
