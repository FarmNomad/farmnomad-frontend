// src/lib/services/authApi.ts
import { LoginRes, LoginReq, RegisterReq } from "@/types/authType";
import { baseApi } from "./api";



export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    login: build.mutation<LoginRes, LoginReq>({
      query: (body) => ({ url: "/api/auth/login", method: "POST", body }),
    }),
    register: build.mutation<{ id: number }, RegisterReq>({
      query: (body) => ({ url: "/api/auth/register", method: "POST", body }),
    }),
  }),
});

export const { useLoginMutation, useRegisterMutation } = authApi;
