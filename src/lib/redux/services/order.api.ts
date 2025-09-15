// src/lib/redux/services/order.api.ts
import { baseApi } from "../baseApi";
// import type { Order } from "../../types/api";

// Match your backend DTOs
export type OrderStatus =
  | "PENDING"
  | "ASSIGNED"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "CANCELLED";
export type PaymentStatus = "UNPAID" | "PAID" | "REFUNDED";

export type Order = {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  customerId: number;
  customerName: string;
  driverId?: number | null;
  driverName?: string | null;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: string; // ISO
  updatedAt?: string; // ISO | null;
};
// If you need the external Order type, import it with an alias:
// import type { Order as ApiOrder } from "../../types/api";

export const orderApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    // Handy detail fetch for /orders/[id]
    getOrder: b.query<Order, number>({
      query: (id) => ({ url: `/orders/${id}` }),
      providesTags: (_res, _err, id) => [{ type: "Order" as const, id }],
    }),

    // Customer’s own orders
    myOrders: b.query<Order[], void>({
      query: () => ({ url: "/orders/my" }),
      // sort newest first (optional)
      transformResponse: (data: Order[]) =>
        [...data].sort(
          (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)
        ),
      providesTags: (res) =>
        res
          ? [
              { type: "Order", id: "LIST" },
              ...res.map((o) => ({ type: "Order" as const, id: o.id })),
            ]
          : [{ type: "Order", id: "LIST" }],
    }),

    unassignedOrders: b.query<Order[], void>({
      query: () => ({ url: "/orders/unassigned" }),
      providesTags: ["Order"],
    }),

    // Driver’s assigned orders
    assignedOrders: b.query<Order[], void>({
      query: () => ({ url: "/orders/assigned" }),
      transformResponse: (data: Order[]) =>
        [...data].sort(
          (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)
        ),
      providesTags: (res) =>
        res
          ? [
              { type: "Order", id: "ASSIGNED_LIST" },
              ...res.map((o) => ({ type: "Order" as const, id: o.id })),
            ]
          : [{ type: "Order", id: "ASSIGNED_LIST" }],
    }),

    // Admin list (optional status filter)
    listOrdersAdmin: b.query<Order[], { status?: OrderStatus } | void>({
      query: (arg) =>
        arg && "status" in (arg ?? {}) && arg?.status
          ? { url: "/orders", params: { status: arg.status } }
          : { url: "/orders" },
      transformResponse: (data: Order[]) =>
        [...data].sort(
          (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)
        ),
      providesTags: (res) =>
        res
          ? [
              { type: "Order", id: "ADMIN_LIST" },
              ...res.map((o) => ({ type: "Order" as const, id: o.id })),
            ]
          : [{ type: "Order", id: "ADMIN_LIST" }],
    }),

    // Assign an order (driver assigns to self; admin must pass driverId)
    assignOrder: b.mutation<Order, { id: number; driverId?: number }>({
      query: ({ id, driverId }) =>
        driverId
          ? {
              url: `/orders/${id}/assign`,
              method: "PATCH",
              params: { driverId },
            }
          : { url: `/orders/${id}/assign`, method: "PATCH" },
      // invalidate this order + common lists
      invalidatesTags: (_res, _err, { id }) => [
        { type: "Order", id },
        { type: "Order", id: "LIST" },
        { type: "Order", id: "ASSIGNED_LIST" },
        { type: "Order", id: "ADMIN_LIST" },
      ],
    }),

    // Update order status (driver/admin)
    updateStatus: b.mutation<Order, { id: number; status: OrderStatus }>({
      query: ({ id, status }) => ({
        url: `/orders/${id}/status`,
        method: "PATCH",
        params: { status },
      }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: "Order", id },
        { type: "Order", id: "LIST" },
        { type: "Order", id: "ASSIGNED_LIST" },
        { type: "Order", id: "ADMIN_LIST" },
      ],
    }),
  }),
  // Avoid HMR “overrideExisting” warnings in dev
  overrideExisting: true,
});

// Export hooks
export const {
  useGetOrderQuery,
  useMyOrdersQuery,
  useAssignedOrdersQuery,
  useListOrdersAdminQuery,
  useUnassignedOrdersQuery,
  useAssignOrderMutation,
  useUpdateStatusMutation,
} = orderApi;
