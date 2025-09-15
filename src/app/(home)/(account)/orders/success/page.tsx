// src/app/orders/success/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppSelector } from "@/lib/redux/store";
import { useConfirmSessionMutation } from "@/lib/redux/services/checkout.api";

export default function OrdersSuccessPage() {
  const router = useRouter();
  const qp = useSearchParams();
  const sessionId = qp.get("session_id") ?? "";
  const { token } = useAppSelector((s) => s.auth);

  const [confirmSession] = useConfirmSessionMutation();
  const [status, setStatus] = useState<
    "idle" | "confirming" | "done" | "error"
  >("idle");
  const didRun = useRef(false);

  useEffect(() => {
    if (!sessionId) return;
    if (!token) {
      // not authenticated yet—send to login and bounce back
      router.replace(
        `/login?next=${encodeURIComponent(
          `/orders/success?session_id=${sessionId}`
        )}`
      );
      return;
    }
    if (didRun.current) return; // prevent double-run on React Strict + HMR
    didRun.current = true;

    let cancelled = false;

    async function finalize() {
      setStatus("confirming");

      // small helper: retry with exponential backoff
      const maxAttempts = 5;
      let attempt = 0;
      while (!cancelled && attempt < maxAttempts) {
        attempt++;
        try {
          await confirmSession({ sessionId }).unwrap();
          if (!cancelled) {
            setStatus("done");
            // use hard replace to avoid dev HMR chunk noise
            window.location.replace("/orders");
          }
          return;
        } catch (e) {
          // If the dev socket just hiccuped, wait and try again
          const backoffMs = Math.min(3000, 300 * attempt); // 300ms, 600ms, ...
          await new Promise((r) => setTimeout(r, backoffMs));
        }
      }

      if (!cancelled) {
        setStatus("error");
        // Even if confirm fails repeatedly, let the user see their orders;
        // backend webhook (if added later) will create them regardless.
        window.location.replace("/orders");
      }
    }

    finalize();

    return () => {
      cancelled = true;
    };
  }, [sessionId, token, confirmSession, router]);

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center text-gray-700">
      <div className="text-lg font-medium">
        {status === "confirming" && "Finalizing your order…"}
        {status === "done" && "All set! Redirecting…"}
        {status === "error" && "Checking your order…"}
      </div>
      <div className="mt-2 text-xs text-gray-500">
        If this page doesn’t move, you can go to{" "}
        <a href="/orders" className="underline">
          Orders
        </a>
        .
      </div>
    </div>
  );
}
