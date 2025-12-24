import { Suspense } from "react";
import OrdersSuccessClient from "./OrdersSuccessClient";

export default function OrdersSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center text-gray-700">
          <div className="text-lg font-medium">Finalizing your order…</div>
        </div>
      }
    >
      <OrdersSuccessClient />
    </Suspense>
  );
}
