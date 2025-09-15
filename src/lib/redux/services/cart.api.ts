import { baseApi } from "../baseApi";
import type { CartItem } from "../../types/api";

export const cartApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    addItem: b.mutation<CartItem, { productId: number; quantity: number }>({
      query: (body) => ({ url: "/cart/items", method: "POST", body }),
      invalidatesTags: ["Cart"],
    }),
    getItems: b.query<CartItem[], void>({
      query: () => ({ url: "/cart/items" }),
      providesTags: ["Cart"],
    }),
    updateItemQty: b.mutation<
      CartItem,
      { productId: number; quantity: number }
    >({
      query: ({ productId, quantity }) => ({
        url: `/cart/items/${productId}?quantity=${encodeURIComponent(
          Math.max(1, quantity)
        )}`,
        method: "PUT",
      }),
      invalidatesTags: ["Cart"],
    }),
    removeItem: b.mutation<void, number>({
      query: (id) => ({ url: `/cart/items/${id}`, method: "DELETE" }),
      invalidatesTags: ["Cart"],
    }),
    clearCart: b.mutation<void, void>({
      query: () => ({ url: "/cart/clear", method: "DELETE" }),
      invalidatesTags: ["Cart"],
    }),
  }),
  overrideExisting: true,
});

export const {
  useAddItemMutation,
  useGetItemsQuery,
  useUpdateItemQtyMutation,
  useRemoveItemMutation,
  useClearCartMutation,
} = cartApi;
