"use client";

export default function ErrorState({
  message = "Something went wrong.",
}: {
  message?: string;
}) {
  return (
    <div className="p-4 text-sm rounded-lg bg-red-50 text-red-700 border border-red-200">
      {message}
    </div>
  );
}
