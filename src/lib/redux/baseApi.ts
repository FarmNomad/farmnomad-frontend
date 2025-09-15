import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "./store";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL,
  prepareHeaders: (headers, { getState }) => {
    const state = getState() as RootState;
    const token =
      state.auth.token ||
      (typeof window !== "undefined" ? localStorage.getItem("token") : null);
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return headers;
  },
});

export const baseApi = createApi({
  reducerPath: "agrirouteApi",
  baseQuery: rawBaseQuery,
  tagTypes: ["User", "Product", "Cart", "Order", "Donation"],
  endpoints: () => ({}),
});
