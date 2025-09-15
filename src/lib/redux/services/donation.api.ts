import { baseApi } from "../baseApi";
import type { Donation, Order } from "../../types/api";

export const donationApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    createDonation: b.mutation<
      Donation,
      { productId: number; quantity: number }
    >({
      query: (body) => ({ url: "/donations", method: "POST", body }),
      invalidatesTags: ["Donation"],
    }),
    listDonationsForFoodBank: b.query<Donation[], void>({
      query: () => ({ url: "/donations" }),
      providesTags: ["Donation"],
    }),
    claimDonation: b.mutation<Donation, { id: number; foodBankId?: number }>({
      query: ({ id, foodBankId }) => ({
        url: `/donations/${id}/claim`,
        method: "PATCH",
        params: foodBankId ? { foodBankId } : undefined,
      }),
      invalidatesTags: ["Donation", "Order"],
    }),
    claimAndOrder: b.mutation<Order, { id: number; foodBankId?: number }>({
      query: ({ id, foodBankId }) => ({
        url: `/donations/${id}/claim-and-order`,
        method: "PATCH",
        params: foodBankId ? { foodBankId } : undefined,
      }),
      invalidatesTags: ["Donation", "Order"],
    }),
    myFarmerDonations: b.query<Donation[], void>({
      query: () => ({ url: "/donations/my/farmer" }),
      providesTags: ["Donation"],
    }),
    myFoodbankDonations: b.query<Donation[], void>({
      query: () => ({ url: "/donations/my/foodbank" }),
      providesTags: ["Donation"],
    }),
    allDonationsAdmin: b.query<Donation[], void>({
      query: () => ({ url: "/donations/all" }),
      providesTags: ["Donation"],
    }),
  }),
});

export const {
  useCreateDonationMutation,
  useListDonationsForFoodBankQuery,
  useClaimDonationMutation,
  useClaimAndOrderMutation,
  useMyFarmerDonationsQuery,
  useMyFoodbankDonationsQuery,
  useAllDonationsAdminQuery,
} = donationApi;
