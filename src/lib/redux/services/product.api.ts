import { baseApi } from "../baseApi";
import type { Product } from "../../types/api";

export const productApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listProducts: b.query<Product[], void>({
      query: () => ({ url: "/products" }),
      providesTags: (res) =>
        res
          ? [
              ...res.map((p) => ({ type: "Product" as const, id: p.id })),
              { type: "Product" as const, id: "LIST" },
            ]
          : [{ type: "Product" as const, id: "LIST" }],
    }),
    getProduct: b.query<Product, number | string>({
      query: (id) => ({ url: `/products/${id}` }),
      providesTags: (_r, _e, id) => [{ type: "Product", id }],
    }),
    createProduct: b.mutation<Product, FormData>({
      query: (form) => ({
        url: "/products",
        method: "POST",
        body: form,
        headers: {}, // let browser set multipart boundary
      }),
      invalidatesTags: [{ type: "Product", id: "LIST" }],
    }),
    updateProduct: b.mutation<Product, { id: number | string; form: FormData }>(
      {
        query: ({ id, form }) => ({
          url: `/products/${id}`,
          method: "PUT",
          body: form,
          headers: {},
        }),
        invalidatesTags: (_r, _e, a) => [
          { type: "Product", id: a.id },
          { type: "Product", id: "LIST" },
        ],
      }
    ),
    deleteProduct: b.mutation<void, number | string>({
      query: (id) => ({ url: `/products/${id}`, method: "DELETE" }),
      invalidatesTags: (_r, _e, id) => [
        { type: "Product", id },
        { type: "Product", id: "LIST" },
      ],
    }),
    donateProduct: b.mutation<any, { id: string | number; quantity: number }>({
      // adjust URL to match your backend (e.g., /products/{id}/donate)
      query: ({ id, quantity }) => ({
        url: `/products/${id}/donate`,
        method: "POST",
        body: { quantity },
      }),
      invalidatesTags: (_r, _e, a) => [
        { type: "Product", id: a.id },
        { type: "Product", id: "LIST" },
      ],
    }),
    // ✅ Add product to farmer’s Surplus list
    addToSurplus: b.mutation<
      { ok: boolean },
      { id: number | string; quantity: number }
    >({
      query: ({ id, quantity }) => ({
        url: `/products/${id}/surplus?quantity=${encodeURIComponent(quantity)}`,
        method: "POST",
      }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: "Product" as const, id },
        { type: "Product", id: "LIST" },
        { type: "Donation", id: "LIST" }, // if you tag donations, this helps the farmer dashboard update
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListProductsQuery,
  useGetProductQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useDonateProductMutation,
  useAddToSurplusMutation,
} = productApi;
