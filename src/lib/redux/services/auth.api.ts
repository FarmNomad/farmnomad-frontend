import { baseApi } from "../baseApi";
import type { LoginResponse, User } from "../../types/api";

export const authApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    login: b.mutation<LoginResponse, { email: string; password: string }>({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
    }),
    me: b.query<User, void>({
      query: () => ({ url: "/users/me" }),
      providesTags: ["User"],
    }),
    activate: b.mutation<void, { email: string }>({
      query: ({ email }) => ({
        url: `/activate`,
        method: "POST",
        params: { email },
      }),
    }),
  }),
});

export const { useLoginMutation, useMeQuery, useActivateMutation, useLazyMeQuery } =
  authApi;
