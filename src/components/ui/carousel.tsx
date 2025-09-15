// src/components/ui/carousel.tsx
"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { productImageSrc } from "@/lib/utils/image";

export default function Carousel({
  images,
  alt,
}: {
  images: string[] | undefined[];
  alt: string;
}) {
  const normalized = (
    images?.length ? images : ["/images/placeholder.png"]
  ).map(productImageSrc);
  const [idx, setIdx] = useState(0);

  function prev() {
    setIdx((i) => (i - 1 + normalized.length) % normalized.length);
  }
  function next() {
    setIdx((i) => (i + 1) % normalized.length);
  }

  return (
    <div className="w-full">
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-50">
        <Image
          src={normalized[idx]}
          alt={alt}
          fill
          className="object-contain"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        {normalized.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white shadow"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white shadow"
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {normalized.length > 1 && (
        <div className="mt-3 grid grid-cols-5 sm:grid-cols-6 md:grid-cols-7 gap-2">
          {normalized.map((src, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`relative aspect-square rounded-lg overflow-hidden border ${
                i === idx
                  ? "border-green-600 ring-1 ring-green-600"
                  : "border-gray-200"
              }`}
              aria-label={`Image ${i + 1}`}
            >
              <Image
                src={src}
                alt={`${alt}-${i}`}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
