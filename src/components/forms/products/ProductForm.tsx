// src/components/products/ProductForm.tsx
"use client";

import { useState } from "react";
import {
  useCreateProductMutation,
  useUpdateProductMutation,
} from "@/lib/redux/services/product.api";

type ProductInput = {
  id?: number | string;
  name?: string;
  description?: string;
  price?: number | string;
  quantityAvailable?: number | string;
  category?: string;
  pickupAddress?: string;
  bestBeforeDate?: string;
  tags?: string[];
  coverImageUrl?: string;
};

const CATEGORY_OPTIONS = [
  "Fruits",
  "Vegetables",
  "Cereals",
  "Grain",
  "Dairy_and_Eggs",
  "Meat",
  "Seafood",
  "Artisanal",
  "Value_Added",
  "Herbs",
  "nuts",
  "Beverages",
  "Other",
];

export default function ProductForm({
  initial,
  onDone,
}: {
  initial?: ProductInput;
  onDone?: () => void;
}) {
  const isEdit = Boolean(initial?.id);
  const [createProduct, { isLoading: creating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: updating }] = useUpdateProductMutation();

  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [price, setPrice] = useState<string>(initial?.price?.toString() ?? "");
  const [quantity, setQuantity] = useState<string>(
    initial?.quantityAvailable?.toString() ?? ""
  );
  const [category, setCategory] = useState(initial?.category ?? "");
  const [pickupAddress, setPickupAddress] = useState(
    initial?.pickupAddress ?? ""
  );
  const [bestBeforeDate, setBestBeforeDate] = useState(
    initial?.bestBeforeDate ? initial.bestBeforeDate.slice(0, 10) : ""
  );

  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
  const [tagInput, setTagInput] = useState("");

  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [images, setImages] = useState<FileList | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleAddTag(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput("");
    }
  }
  function handleRemoveTag(tag: string) {
    setTags(tags.filter((t) => t !== tag));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    try {
      const form = new FormData();
      form.append("name", name);
      form.append("price", String(price));
      form.append("quantityAvailable", String(quantity));
      if (description) form.append("description", description);
      if (category) form.append("category", category);
      if (pickupAddress) form.append("pickupAddress", pickupAddress);
      if (bestBeforeDate) form.append("bestBeforeDate", bestBeforeDate);

      if (tags.length) tags.forEach((tag) => form.append("tags", tag));
      if (coverImage) form.append("coverImage", coverImage);
      if (images && images.length) {
        Array.from(images).forEach((f) => form.append("images", f));
      }

      if (isEdit && initial?.id != null) {
        await updateProduct({ id: initial.id, form }).unwrap();
      } else {
        await createProduct(form).unwrap();
      }
      onDone?.();
    } catch {
      setError(
        "Could not save product. Please check your inputs and try again."
      );
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* name / price */}
        <div>
          <label className="text-sm font-medium text-gray-700">Name</label>
          <input
            className="w-full mt-1 border rounded-lg px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Price (£)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            className="w-full mt-1 border rounded-lg px-3 py-2"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </div>

        {/* quantity / category */}
        <div>
          <label className="text-sm font-medium text-gray-700">Quantity</label>
          <input
            type="number"
            min="0"
            className="w-full mt-1 border rounded-lg px-3 py-2"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Category</label>
          <select
            className="w-full mt-1 border rounded-lg px-3 py-2 bg-white"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          >
            <option value="" disabled>
              Select category
            </option>
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* pickup address */}
        <div className="sm:col-span-2">
          <label className="text-sm font-medium text-gray-700">
            Pickup Address
          </label>
          <input
            className="w-full mt-1 border rounded-lg px-3 py-2"
            value={pickupAddress}
            onChange={(e) => setPickupAddress(e.target.value)}
          />
        </div>

        {/* description */}
        <div className="sm:col-span-2">
          <label className="text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            className="w-full mt-1 border rounded-lg px-3 py-2 min-h-[80px]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your product..."
          />
        </div>

        {/* tags */}
        <div className="sm:col-span-2">
          <label className="text-sm font-medium text-gray-700">Tags</label>
          <div className="mt-1 flex flex-wrap gap-2 border rounded-lg px-2 py-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs flex items-center gap-1"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="text-red-600 hover:text-red-800 ml-1"
                >
                  ×
                </button>
              </span>
            ))}
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && tagInput.trim()) {
                  e.preventDefault();
                  if (!tags.includes(tagInput.trim())) {
                    setTags([...tags, tagInput.trim()]);
                  }
                  setTagInput("");
                }
              }}
              placeholder="Type tag & press Enter"
              className="flex-1 min-w-[120px] border-0 focus:ring-0 text-sm"
            />
          </div>
        </div>

        {/* best before */}
        <div>
          <label className="text-sm font-medium text-gray-700">
            Best Before
          </label>
          <input
            type="date"
            className="w-full mt-1 border rounded-lg px-3 py-2"
            value={bestBeforeDate}
            onChange={(e) => setBestBeforeDate(e.target.value)}
          />
        </div>

        {/* cover / gallery */}
        <div>
          <label className="text-sm font-medium text-gray-700">
            Cover Image
          </label>
          <input
            type="file"
            accept="image/*"
            className="w-full mt-1 border rounded-lg px-3 py-2"
            onChange={(e) => setCoverImage(e.target.files?.[0] || null)}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-sm font-medium text-gray-700">
            Gallery Images
          </label>
          <input
            type="file"
            accept="image/*"
            multiple
            className="w-full mt-1 border rounded-lg px-3 py-2"
            onChange={(e) => setImages(e.target.files)}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="submit"
          disabled={creating || updating}
          className="px-4 py-2 rounded-lg bg-green-700 text-white hover:bg-green-800 disabled:opacity-60"
        >
          {creating || updating
            ? "Saving..."
            : isEdit
            ? "Update Product"
            : "Create Product"}
        </button>
      </div>
    </form>
  );
}
