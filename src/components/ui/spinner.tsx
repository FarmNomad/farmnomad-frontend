"use client";

export default function Spinner() {
  return (
    <div className="flex items-center justify-center p-6">
      <div className="animate-spin h-6 w-6 rounded-full border-2 border-current border-t-transparent" />
    </div>
  );
}
