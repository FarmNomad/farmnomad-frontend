// src/components/ui/modal.tsx
"use client";

import { useEffect, useRef } from "react";

export default function Modal({
  open,
  title,
  children,
  onClose,
  maxWidth = "max-w-lg",
}: {
  open: boolean;
  title?: string;
  children: React.ReactNode;
  onClose: () => void;
  maxWidth?: string; // e.g., "max-w-lg", "max-w-2xl"
}) {
  const overlayRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
    >
      <div
        className={`w-full ${maxWidth} bg-white rounded-2xl shadow-xl max-h-[32rem] overflow-auto animate-[fadeIn_.15s_ease-out]`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-600"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
