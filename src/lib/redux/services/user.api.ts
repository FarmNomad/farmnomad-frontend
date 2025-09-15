import { baseApi } from "../baseApi";
import type { User } from "../../types/api";

export const userApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listUsers: b.query<User[], void>({
      query: () => ({ url: "/users" }),
      providesTags: ["User"],
    }),
    getUser: b.query<User, number | string>({
      query: (id) => ({ url: `/users/${id}` }),
      providesTags: (_r, _e, id) => [{ type: "User", id }],
    }),
    updateUser: b.mutation<User, { id: number | string; body: Partial<User> }>({
      query: ({ id, body }) => ({ url: `/users/${id}`, method: "PUT", body }),
      invalidatesTags: (_r, _e, a) => [{ type: "User", id: a.id }],
    }),
    deleteUser: b.mutation<void, number | string>({
      query: (id) => ({ url: `/users/${id}`, method: "DELETE" }),
      invalidatesTags: ["User"],
    }),
  }),
});

export const {
  useListUsersQuery,
  useGetUserQuery,
  useUpdateUserMutation,
  useDeleteUserMutation,
} = userApi;
