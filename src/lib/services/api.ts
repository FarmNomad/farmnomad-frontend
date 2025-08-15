import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import Cookies from "js-cookie";
import { RootState } from "@/lib/redux/store";

export const baseApi = createApi({
  reducerPath: "agrirouteApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL,
    prepareHeaders: (headers, {getState}) => {
           const state = getState() as RootState;
           const token =
             state.auth.token ||
             (typeof window !== "undefined"
               ? localStorage.getItem("token")
               : null);
           if (token) headers.set("Authorization", `Bearer ${token}`);
           headers.set("Content-Type", "application/json");
           return headers;
    },
    credentials: "omit", // if you later use cookies from backend
  }),
  tagTypes: ["User", "Product", "Cart", "Order", "Donation", "Surplus"],
  endpoints: () => ({}),
});
