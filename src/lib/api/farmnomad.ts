import {
  createApi,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import { liveBaseQuery } from "./liveBaseQuery";
import type {
  ApiMessage,
  AuthTokens,
  CartItem,
  CheckoutSession,
  Donation,
  Meal,
  MealInput,
  MealOrder,
  MealOrderStatus,
  Message,
  Notification,
  Order,
  OrderStatus,
  Organisation,
  Product,
  ProductInput,
  ProductWrite,
  RegisterInput,
  Surplus,
  User,
} from "@/lib/types/api";

/**
 * Where the data comes from.
 *
 * NEXT_PUBLIC_USE_MOCKS defaults to on: everything runs on sample data, no backend needed.
 * Set it to "false" (with NEXT_PUBLIC_API_URL pointing at the backend) and the routes listed in
 * LIVE_ROUTES go to the Spring Boot API. Everything else still uses sample data until its phase
 * of the integration lands; add its routes to LIVE_ROUTES then.
 */
export const LIVE_API = process.env.NEXT_PUBLIC_USE_MOCKS === "false";

// A route is a method ("*" for any) and a path. Listing the method keeps a phase to exactly what it
// integrated: the farmer's own products are live, while the marketplace list (GET /products) stays
// on sample data until the customer side is done.
const LIVE_ROUTES: [method: string, path: RegExp][] = [
  // Phase 1: auth and the signed-in user.
  ["*", /^\/auth\//],
  ["GET", /^\/users\/me$/],
  // Phase 2: the farmer's products.
  ["GET", /^\/products\/my$/],
  ["POST", /^\/products$/],
  ["PUT", /^\/products\/\d+$/],
  ["DELETE", /^\/products\/\d+$/],
];

// Lists the backend has no endpoint for yet. On the real API these come back empty, so a real
// account never sees sample figures as if they were its own. Move a route to LIVE_ROUTES (with its
// real path) once the backend provides it.
const NO_BACKEND_YET: [method: string, path: RegExp][] = [
  ["GET", /^\/orders\/my\/farmer$/], // a farmer's incoming orders
  ["GET", /^\/analytics\/farmer\/revenue$/], // daily revenue for the dashboard chart
];

const mockBaseQuery: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args) => {
  const { handle } = await import("./mock/handlers");
  const a = typeof args === "string" ? { url: args } : args;
  const res = await handle({
    method: (a.method ?? "GET").toUpperCase(),
    path: a.url,
    body: a.body,
    params: a.params,
  });
  return "error" in res
    ? { error: res.error as FetchBaseQueryError }
    : { data: res.data };
};

const baseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = (args, baseApi, extra) => {
  const path = (typeof args === "string" ? args : args.url).split("?")[0];
  const method = (typeof args === "string" ? "GET" : (args.method ?? "GET")).toUpperCase();
  const hit = (routes: [string, RegExp][]) => routes.some(([m, r]) => (m === "*" || m === method) && r.test(path));
  if (LIVE_API && hit(NO_BACKEND_YET)) return { data: [] };
  return LIVE_API && hit(LIVE_ROUTES) ? liveBaseQuery(args, baseApi, extra) : mockBaseQuery(args, baseApi, extra);
};

/**
 * Products are the only multipart resource. On the real API the body is form data: the text
 * fields, `tags` repeated once per tag, `coverImage` as one file and `images` as files.
 * No Content-Type is set here; the browser adds it with the multipart boundary.
 * Photos already on the server are not re-sent (the API takes files, not URLs).
 * On sample data the body stays JSON and the picked files are left out.
 */
function productBody({ coverImage, images, ...fields }: Partial<ProductWrite>): FormData | Partial<ProductInput> {
  if (!LIVE_API) return fields;
  const fd = new FormData();
  const text = (k: string, v: string | number | undefined | null) => {
    if (v !== undefined && v !== null && v !== "") fd.append(k, String(v));
  };
  text("name", fields.name);
  text("description", fields.description);
  text("price", fields.price);
  text("quantityAvailable", fields.quantityAvailable); // not "quantity"
  text("category", fields.category);
  text("bestBeforeDate", fields.bestBeforeDate);
  text("pickupAddress", fields.pickupAddress);
  fields.tags?.forEach((t) => fd.append("tags", t));
  if (coverImage) fd.append("coverImage", coverImage);
  images?.forEach((f) => fd.append("images", f));
  return fd;
}

export const api = createApi({
  reducerPath: "api",
  baseQuery,
  tagTypes: [
    "Product",
    "Order",
    "Surplus",
    "Notification",
    "Me",
    "Cart",
    "Market",
    "MyOrders",
    "Jobs",
    "Donation",
    "Org",
    "Messages",
    "Meal",
    "MealOrder",
    "Users",
    "AdminOrders",
    "Orgs",
  ],
  endpoints: (b) => ({
    me: b.query<User, void>({ query: () => "/users/me", providesTags: ["Me"] }),

    // Products (spec §7.5)
    listMyProducts: b.query<Product[], void>({
      query: () => "/products/my",
      providesTags: ["Product"],
    }),
    createProduct: b.mutation<Product, ProductWrite>({
      query: (input) => ({ url: "/products", method: "POST", body: productBody(input) }),
      invalidatesTags: ["Product"],
    }),
    updateProduct: b.mutation<Product, { id: number } & Partial<ProductWrite>>({
      // FARMER (own) or ADMIN (any).
      query: ({ id, ...input }) => ({
        url: `/products/${id}`,
        method: "PUT",
        body: productBody(input),
      }),
      invalidatesTags: ["Product", "Market"],
    }),
    // The real API answers with an empty body.
    deleteProduct: b.mutation<Product | null, number>({
      query: (id) => ({ url: `/products/${id}`, method: "DELETE" }),
      invalidatesTags: ["Product", "Market"],
    }),
    restoreProduct: b.mutation<Product, Product>({
      query: (body) => ({
        url: "/__mock/products/restore",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Product", "Market"],
    }),

    // Orders. CONFIRM WITH BACKEND: no farmer-scoped list is documented yet; this assumes GET /orders/my/farmer.
    listFarmerOrders: b.query<Order[], void>({
      query: () => "/orders/my/farmer",
      providesTags: ["Order"],
    }),

    // Surplus (spec §7.10). CONFIRM WITH BACKEND: create endpoint is not documented; this assumes POST /surplus.
    listMySurplus: b.query<Surplus[], void>({
      query: () => "/surplus/my",
      providesTags: ["Surplus"],
    }),
    createSurplus: b.mutation<Surplus, { productId: number; quantity: number }>(
      {
        query: (body) => ({ url: "/surplus", method: "POST", body }),
        invalidatesTags: ["Surplus"],
      },
    ),

    myNotifications: b.query<Notification[], void>({
      query: () => "/notifications/my",
      providesTags: ["Notification"],
    }),
    markNotificationRead: b.mutation<Notification, number>({
      query: (id) => ({ url: `/notifications/${id}/read`, method: "PUT" }),
      invalidatesTags: ["Notification"],
    }),

    // ───────── Customer (spec §3.6–3.8, §7.5, §7.8, §7.9) ─────────
    updateMe: b.mutation<User, { id: number } & Partial<User>>({
      query: ({ id, ...body }) => ({
        url: `/users/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Me"],
    }),
    // ───────── Auth (integration brief §2) ─────────
    changePassword: b.mutation<ApiMessage, { currentPassword: string; newPassword: string }>({
      query: (body) => ({ url: "/auth/change-password", method: "POST", body }),
    }),
    // Returns tokens only. The user and their role come from GET /users/me afterwards.
    login: b.mutation<AuthTokens, { email: string; password: string }>({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
    }),
    // Always 200 with a deliberately vague message (no account enumeration). Show the message as sent.
    forgotPassword: b.mutation<ApiMessage, { email: string }>({
      query: (body) => ({ url: "/auth/forgot-password", method: "POST", body }),
    }),
    // The token comes from the link in the reset email.
    resetPassword: b.mutation<ApiMessage, { token: string; newPassword: string }>({
      query: (body) => ({ url: "/auth/reset-password", method: "POST", body }),
    }),
    // Creates an inactive account and emails a verification link. Returns the user, not a session.
    register: b.mutation<User, RegisterInput>({
      query: (body) => ({ url: "/auth/register", method: "POST", body }),
    }),
    // Ends the session on the server. Sending the refresh token revokes it too.
    logout: b.mutation<ApiMessage, { refreshToken?: string }>({
      query: (body) => ({ url: "/auth/logout", method: "POST", body }),
    }),

    listProducts: b.query<Product[], void>({
      query: () => "/products",
      providesTags: ["Market"],
    }),
    getProduct: b.query<Product, number>({
      query: (id) => `/products/${id}`,
      providesTags: ["Market"],
    }),

    getCart: b.query<CartItem[], void>({
      query: () => "/cart/items",
      providesTags: ["Cart"],
    }),
    addToCart: b.mutation<CartItem, { productId: number; quantity: number }>({
      query: (body) => ({ url: "/cart/items", method: "POST", body }),
      invalidatesTags: ["Cart"],
    }),
    updateCartQty: b.mutation<CartItem, { itemId: number; quantity: number }>({
      query: ({ itemId, quantity }) => ({
        url: `/cart/items/${itemId}`,
        method: "PUT",
        params: { quantity },
      }),
      // Optimistic: steppers feel instant, the server confirms behind.
      async onQueryStarted({ itemId, quantity }, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          api.util.updateQueryData("getCart", undefined, (d) => {
            const it = d.find((x) => x.id === itemId);
            if (it) it.quantity = quantity;
          }),
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
    }),
    removeCartItem: b.mutation<CartItem, number>({
      query: (itemId) => ({ url: `/cart/items/${itemId}`, method: "DELETE" }),
      invalidatesTags: ["Cart"],
    }),
    clearCart: b.mutation<{ ok: boolean }, void>({
      query: () => ({ url: "/cart/clear", method: "DELETE" }),
      invalidatesTags: ["Cart"],
    }),

    createCheckoutSession: b.mutation<CheckoutSession, void>({
      query: () => ({ url: "/checkout/create-session", method: "POST" }),
    }),
    confirmCheckout: b.mutation<Order[], string>({
      query: (sessionId) => ({
        url: "/checkout/confirm",
        method: "POST",
        params: { sessionId },
      }),
      invalidatesTags: ["Cart", "MyOrders", "Market"],
    }),

    myOrders: b.query<Order[], void>({
      query: () => "/orders/my",
      providesTags: ["MyOrders"],
    }),
    // CONFIRM WITH BACKEND: GET /orders/{id} is not documented (spec §10 Q2).
    getOrder: b.query<Order, number>({
      query: (id) => `/orders/${id}`,
      providesTags: ["MyOrders"],
    }),

    // ───────── Driver jobs (spec §3.7) ─────────
    assignedOrders: b.query<Order[], void>({
      query: () => "/orders/assigned",
      providesTags: ["Jobs"],
    }),
    unassignedOrders: b.query<Order[], void>({
      query: () => "/orders/unassigned",
      providesTags: ["Jobs"],
    }),
    assignOrder: b.mutation<Order, number>({
      // Driver → self: driverId is optional (required only for admin).
      query: (id) => ({ url: `/orders/${id}/assign`, method: "PATCH" }),
      invalidatesTags: ["Jobs", "Order", "MyOrders", "Notification"],
    }),
    updateOrderStatus: b.mutation<Order, { id: number; status: OrderStatus }>({
      query: ({ id, status }) => ({
        url: `/orders/${id}/status`,
        method: "PATCH",
        params: { status },
      }),
      invalidatesTags: [
        "Jobs",
        "Order",
        "MyOrders",
        "Donation",
        "Notification",
      ],
    }),

    // ───────── Donations (spec §3.9) ─────────
    listDonations: b.query<Donation[], void>({
      query: () => "/donations",
      providesTags: ["Donation"],
    }),
    myFarmerDonations: b.query<Donation[], void>({
      query: () => "/donations/my/farmer",
      providesTags: ["Donation"],
    }),
    myOrganisationDonations: b.query<Donation[], void>({
      query: () => "/donations/my/organisation",
      providesTags: ["Donation"],
    }),
    createDonation: b.mutation<
      Donation,
      { productId: number; quantity: number; note?: string }
    >({
      query: (body) => ({ url: "/donations", method: "POST", body }),
      invalidatesTags: ["Donation", "Product"],
    }),
    // organisationId is only required when the caller is ADMIN; omitted for ORGANISATION.
    claimDonation: b.mutation<Donation, { id: number; withDelivery?: boolean }>(
      {
        query: ({ id, withDelivery }) => ({
          url: `/donations/${id}/${withDelivery ? "claim-and-order" : "claim"}`,
          method: "PATCH",
        }),
        invalidatesTags: ["Donation", "Jobs", "Notification"],
      },
    ),

    // ───────── Surplus browse (spec §3.10) ─────────
    listSurplus: b.query<Surplus[], void>({
      query: () => "/surplus",
      providesTags: ["Surplus"],
    }),
    claimSurplus: b.mutation<Surplus, number>({
      query: (productId) => ({
        url: `/surplus/claim/${productId}`,
        method: "POST",
      }),
      invalidatesTags: ["Surplus", "Notification"],
    }),

    // ───────── Organisations (spec §3.11). CONFIRM WITH BACKEND: GET /organisations/my is assumed. ─────────
    myOrganisation: b.query<Organisation | null, void>({
      query: () => "/organisations/my",
      // No organisation yet → 404, and the page shows the apply form.
      providesTags: ["Org"],
    }),
    createOrganisation: b.mutation<
      Organisation,
      Pick<Organisation, "name" | "type" | "charityNumber" | "description">
    >({
      query: (body) => ({ url: "/organisations", method: "POST", body }),
      invalidatesTags: ["Org"],
    }),
    updateOrganisation: b.mutation<
      Organisation,
      { id: number } & Partial<Organisation>
    >({
      query: ({ id, ...body }) => ({
        url: `/organisations/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Org", "Orgs"],
    }),
    mockResetOrganisation: b.mutation<{ ok: boolean }, void>({
      query: () => ({ url: "/__mock/organisation", method: "DELETE" }),
      invalidatesTags: ["Org"],
    }),
    mockVerifyOrganisation: b.mutation<Organisation, void>({
      query: () => ({ url: "/__mock/organisation/verify", method: "POST" }),
      invalidatesTags: ["Org"],
    }),

    // ───────── Messages (spec §3.12). Polls until STOMP lands. ─────────
    myMessages: b.query<Message[], void>({
      query: () => "/messages",
      providesTags: ["Messages"],
    }),
    sendMessage: b.mutation<
      Message,
      { recipientId: number; content: string; recipientName?: string }
    >({
      // recipientName is a hint for the mock only; the API takes recipientId and content.
      query: (body) => ({ url: "/messages", method: "POST", body }),
      invalidatesTags: ["Messages"],
    }),
    markMessageRead: b.mutation<Message, number>({
      query: (id) => ({ url: `/messages/${id}/read`, method: "PATCH" }),
      invalidatesTags: ["Messages"],
    }),
    people: b.query<{ id: number; name: string; role: string }[], void>({
      query: () => "/__mock/people",
    }),

    // ───────── NomadEat meals (spec §3.4, JSON with already-hosted imageUrls) ─────────
    listMeals: b.query<Meal[], void>({
      query: () => "/meals",
      providesTags: ["Meal"],
    }),
    getMeal: b.query<Meal, number>({
      query: (id) => `/meals/${id}`,
      providesTags: ["Meal"],
    }),
    myMeals: b.query<Meal[], void>({
      query: () => "/meals/my",
      providesTags: ["Meal"],
    }),
    createMeal: b.mutation<Meal, MealInput>({
      query: (body) => ({ url: "/meals", method: "POST", body }),
      invalidatesTags: ["Meal"],
    }),
    updateMeal: b.mutation<Meal, { id: number } & Partial<MealInput>>({
      query: ({ id, ...body }) => ({
        url: `/meals/${id}`,
        method: "PUT",
        body,
      }),
      // Optimistic: availability toggles feel instant.
      async onQueryStarted({ id, ...patch }, { dispatch, queryFulfilled }) {
        const undo = dispatch(
          api.util.updateQueryData("myMeals", undefined, (d) => {
            const m = d.find((x) => x.id === id);
            if (m) Object.assign(m, patch);
          }),
        );
        queryFulfilled.catch(undo.undo);
      },
      invalidatesTags: ["Meal"],
    }),
    deleteMeal: b.mutation<Meal, number>({
      query: (id) => ({ url: `/meals/${id}`, method: "DELETE" }),
      invalidatesTags: ["Meal"],
    }),

    // ───────── Meal orders. CONFIRM WITH BACKEND: not in the spec yet. ─────────
    orderMeal: b.mutation<
      MealOrder,
      { mealId: number; quantity: number; note?: string }
    >({
      query: (body) => ({ url: "/meal-orders", method: "POST", body }),
      invalidatesTags: ["Meal", "MealOrder", "Users", "AdminOrders", "Orgs"],
    }),
    myMealOrders: b.query<MealOrder[], void>({
      query: () => "/meal-orders/my",
      providesTags: ["MealOrder"],
    }),
    kitchenMealOrders: b.query<MealOrder[], void>({
      query: () => "/meal-orders/kitchen",
      providesTags: ["MealOrder"],
    }),
    updateMealOrder: b.mutation<
      MealOrder,
      { id: number; status: MealOrderStatus }
    >({
      query: ({ id, status }) => ({
        url: `/meal-orders/${id}/status`,
        method: "PATCH",
        params: { status },
      }),
      invalidatesTags: ["MealOrder", "Meal", "Notification"],
    }),

    // ───────── Admin console ─────────
    listUsers: b.query<User[], void>({
      query: () => "/users",
      providesTags: ["Users"],
    }),
    // Spec §3.2 PUT /users/{id}: ADMIN or owner.
    updateUser: b.mutation<User, { id: number } & Partial<User>>({
      query: ({ id, ...body }) => ({
        url: `/users/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Users", "Me", "AdminOrders"],
    }),
    // Always 200 with a deliberately vague message (no account enumeration). Show the message as sent.
    resendVerification: b.mutation<ApiMessage, { email: string }>({
      query: (body) => ({
        url: "/auth/resend-verification",
        method: "POST",
        body,
      }),
    }),
    // The token comes from the link in the verification email. Returns a message, not a session: the user still logs in.
    verifyEmail: b.mutation<ApiMessage, { token: string }>({
      query: (body) => ({ url: "/auth/verify-email", method: "POST", body }),
    }),
    allMealsAdmin: b.query<Meal[], void>({
      query: () => "/__admin/meals",
      providesTags: ["Meal"],
    }),
    deleteUser: b.mutation<User, number>({
      query: (id) => ({ url: `/users/${id}`, method: "DELETE" }),
      invalidatesTags: ["Users"],
    }),
    mockRestoreUser: b.mutation<User, User>({
      query: (body) => ({ url: "/__mock/users", method: "POST", body }),
      invalidatesTags: ["Users"],
    }),
    listOrdersAdmin: b.query<(Order & { total: number })[], OrderStatus | void>(
      {
        query: (status) => ({
          url: "/orders",
          params: status ? { status } : undefined,
        }),
        providesTags: ["AdminOrders"],
      },
    ),
    // Real API: PATCH /orders/{id}/assign?driverId= and PATCH /orders/{id}/status (admin rules).
    adminAssignOrder: b.mutation<Order, { id: number; driverId: number }>({
      query: ({ id, driverId }) => ({
        url: `/__admin/orders/${id}/assign`,
        method: "PATCH",
        params: { driverId },
      }),
      invalidatesTags: ["AdminOrders", "Jobs", "Order", "MyOrders"],
    }),
    adminOrderStatus: b.mutation<Order, { id: number; status: OrderStatus }>({
      query: ({ id, status }) => ({
        url: `/__admin/orders/${id}/status`,
        method: "PATCH",
        params: { status },
      }),
      invalidatesTags: ["AdminOrders", "Jobs", "Order", "MyOrders"],
    }),
    listOrganisations: b.query<Organisation[], void>({
      query: () => "/organisations",
      providesTags: ["Orgs"],
    }),
    // Real API: PUT /organisations/{id} { verificationLevel } (field name to confirm).
    verifyOrganisation: b.mutation<
      Organisation,
      {
        id: number;
        verificationLevel: NonNullable<Organisation["verificationLevel"]>;
      }
    >({
      query: ({ id, verificationLevel }) => ({
        url: `/__admin/organisations/${id}`,
        method: "PATCH",
        body: { verificationLevel },
      }),
      invalidatesTags: ["Orgs", "Org", "Notification"],
    }),
    allDonationsAdmin: b.query<Donation[], void>({
      query: () => "/donations/all",
      providesTags: ["Donation"],
    }),
    assignSurplus: b.mutation<
      Surplus & { assignedTo: string },
      { productId: number; organisationUserId: number }
    >({
      query: ({ productId, organisationUserId }) => ({
        url: `/surplus/assign/${productId}`,
        method: "POST",
        params: { organisationUserId },
      }),
      invalidatesTags: ["Surplus"],
    }),

    // CONFIRM WITH BACKEND: revenue analytics endpoint is not documented yet.
    farmerRevenue: b.query<{ date: string; value: number }[], void>({
      query: () => "/analytics/farmer/revenue",
    }),
  }),
});

export const {
  useMeQuery,
  useLazyMeQuery,
  useResetPasswordMutation,
  useLogoutMutation,
  useListMyProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useRestoreProductMutation,
  useListFarmerOrdersQuery,
  useListMySurplusQuery,
  useCreateSurplusMutation,
  useMyNotificationsQuery,
  useMarkNotificationReadMutation,
  useFarmerRevenueQuery,
  useUpdateMeMutation,
  useChangePasswordMutation,
  useLoginMutation,
  useRegisterMutation,
  useForgotPasswordMutation,
  useListProductsQuery,
  useGetProductQuery,
  useGetCartQuery,
  useAddToCartMutation,
  useUpdateCartQtyMutation,
  useRemoveCartItemMutation,
  useClearCartMutation,
  useCreateCheckoutSessionMutation,
  useConfirmCheckoutMutation,
  useMyOrdersQuery,
  useGetOrderQuery,
  useAssignedOrdersQuery,
  useUnassignedOrdersQuery,
  useAssignOrderMutation,
  useUpdateOrderStatusMutation,
  useListDonationsQuery,
  useMyFarmerDonationsQuery,
  useMyOrganisationDonationsQuery,
  useCreateDonationMutation,
  useClaimDonationMutation,
  useListSurplusQuery,
  useClaimSurplusMutation,
  useMyOrganisationQuery,
  useCreateOrganisationMutation,
  useUpdateOrganisationMutation,
  useMockResetOrganisationMutation,
  useMockVerifyOrganisationMutation,
  useMyMessagesQuery,
  useSendMessageMutation,
  useMarkMessageReadMutation,
  usePeopleQuery,
  useListMealsQuery,
  useGetMealQuery,
  useMyMealsQuery,
  useCreateMealMutation,
  useUpdateMealMutation,
  useDeleteMealMutation,
  useOrderMealMutation,
  useMyMealOrdersQuery,
  useKitchenMealOrdersQuery,
  useUpdateMealOrderMutation,
  useListUsersQuery,
  useUpdateUserMutation,
  useResendVerificationMutation,
  useVerifyEmailMutation,
  useAllMealsAdminQuery,
  useDeleteUserMutation,
  useMockRestoreUserMutation,
  useListOrdersAdminQuery,
  useAdminAssignOrderMutation,
  useAdminOrderStatusMutation,
  useListOrganisationsQuery,
  useVerifyOrganisationMutation,
  useAllDonationsAdminQuery,
  useAssignSurplusMutation,
} = api;
