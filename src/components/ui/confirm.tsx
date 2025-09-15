// src/components/ui/confirm.tsx
"use client";

export default function Confirm({
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmText = "Delete",
  cancelText = "Cancel",
  confirmClass = "bg-red-600 hover:bg-red-700 text-white",
  onConfirm,
  onCancel,
  loading = false,
}: {
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  confirmClass?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-base font-semibold text-gray-800">{title}</h4>
        <p className="text-sm text-gray-600 mt-1">{message}</p>
      </div>
      <div className="flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-lg border hover:bg-gray-50"
          disabled={loading}
        >
          {cancelText}
        </button>
        <button
          onClick={onConfirm}
          className={`px-4 py-2 rounded-lg ${confirmClass} disabled:opacity-60`}
          disabled={loading}
        >
          {loading ? "Please wait..." : confirmText}
        </button>
      </div>
    </div>
  );
}
