import { baseApi } from "../baseApi";
import type { User } from "../../types/api";
export type Me = {
  id: number;
  fullName: string;
  email: string;
  role: "ADMIN" | "FARMER" | "DRIVER" | "FOODBANK" | "CUSTOMER";
  phoneNumber?: string | null;
  address?: string | null;
  avatarUrl?: string | null;
  // add any other fields your backend returns...
};

export type UpdateMeDto = Partial<
  Pick<Me, "fullName" | "phoneNumber" | "address" | "avatarUrl">
>;

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
    getMe: b.query<Me, void>({
      query: () => ({ url: "/users/me" }),
      providesTags: ["User"],
    }),
    updateMe: b.mutation<Me, UpdateMeDto>({
      query: (body) => ({
        url: "/users/me",
        method: "PATCH", // or "PUT" if your backend requires
        body,
      }),
      invalidatesTags: ["User"],
      async onQueryStarted(_body, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          // optional: if you mirror user in auth slice, update it here
          // dispatch(setUser(data))
        } catch {}
      },
    }),
  }),
});

export const {
  useListUsersQuery,
  useGetUserQuery,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useGetMeQuery,
  useUpdateMeMutation,
} = userApi;
