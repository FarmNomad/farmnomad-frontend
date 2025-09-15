import { baseApi } from "../baseApi";
import type { Donation } from "../../types/api";

export const surplusApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listSurplus: b.query<Donation[], void>({
      query: () => ({ url: "/surplus" }),
      providesTags: ["Donation"],
    }),
    createSurplus: b.mutation<
      Donation,
      { productId: number; quantity: number }
    >({
      query: (body) => ({ url: "/surplus", method: "POST", body }),
      invalidatesTags: ["Donation"],
    }),
    // claimSurplus: b.mutation<Donation, { id: number }>({
    //   query: ({ id }) => ({ url: `/surplus/claim/${id}`, method: "POST" }),
    //   invalidatesTags: ["Donation"],
    // }),
    claimSurplus: b.mutation<Donation, { productId: number; quantity: number }>(
      {
        query: ({ productId, quantity }) => ({
          url: `/surplus/claim/${productId}`,
          method: "POST",
          body: { productId, quantity },
        }),
        invalidatesTags: ["Donation", "Order"],
      }
    ),
    assignSurplus: b.mutation<Donation, { id: number; foodBankUserId: number }>(
      {
        query: ({ id, foodBankUserId }) => ({
          url: `/surplus/assign/${id}`,
          method: "POST",
          params: { foodBankUserId },
        }),
        invalidatesTags: ["Donation"],
      }
    ),
  }),
  //   assignSurplus: b.mutation<Donation, { id: number; foodBankUserId: number }>(
  //     {
  //       query: ({ id, foodBankUserId }) => ({
  //         url: `/surplus/assign/${id}`,
  //         method: "POST",
  //         params: { foodBankUserId },
  //       }),
  //       invalidatesTags: ["Donation"],
  //     }
  //   ),
  // }),
  overrideExisting: true,
});

export const {
  useListSurplusQuery,
  useClaimSurplusMutation,
  useAssignSurplusMutation,
  useCreateSurplusMutation, 
} = surplusApi;
