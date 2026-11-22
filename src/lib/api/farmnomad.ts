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
  ProductWrite,
  RegisterInput,
  Surplus,
  User,
} from "@/lib/types/api";
import type { EarningLine, EarningsSummary, PayoutLine } from "@/lib/types/earnings";
import type { DriverProfile, Farm, Kitchen, ProfileStatus } from "@/lib/types/profile";

/**
 * Where the data comes from.
 *
 * The Spring Boot API (NEXT_PUBLIC_API_URL) is the source of truth. Routes listed in LIVE_ROUTES
 * go to it. A route that has not been integrated yet still answers from temporary placeholder
 * data (./mock) so its page keeps working; move the route into LIVE_ROUTES when its phase lands,
 * and delete ./mock once nothing is left on it.
 */

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
  // Phase 3: orders, and the accounts an admin assigns them to.
  ["GET", /^\/orders$/],
  ["GET", /^\/orders\/(my|my\/farmer|assigned|unassigned|\d+)$/],
  ["POST", /^\/orders\/\d+\/confirm-delivery$/],
  ["PATCH", /^\/orders\/\d+\/(assign|status)$/],
  ["GET", /^\/users$/],
  ["PUT", /^\/users\/\d+$/],
  // The profile picture.
  ["POST", /^\/users\/me\/avatar$/],
  // Phase 4: surplus, donations and the food groups that claim them.
  ["GET", /^\/surplus(\/my)?$/],
  ["POST", /^\/surplus$/],
  ["POST", /^\/surplus\/(claim|assign)\/\d+$/],
  ["GET", /^\/donations(\/all|\/my\/farmer|\/my\/organisation)?$/],
  ["POST", /^\/donations$/],
  ["PATCH", /^\/donations\/\d+\/(claim|claim-and-order)$/],
  ["GET", /^\/organisations(\/\d+|\/my)?$/],
  ["POST", /^\/organisations$/],
  ["PUT", /^\/organisations\/\d+$/],
  ["PATCH", /^\/organisations\/\d+\/status$/],
  // Role profiles.
  ["GET", /^\/profile\/me$/],
  ["POST", /^\/(farms|drivers\/profile|kitchens)$/],
  ["PUT", /^\/(farms\/\d+|drivers\/profile|kitchens\/\d+)$/],
  // Earnings and payouts.
  ["GET", /^\/earnings(\/transactions|\/payouts)?$/],
  ["GET", /^\/connect\/status$/],
  ["POST", /^\/connect\/(onboard|dashboard-link)$/],
];

// Endpoints whose every request is live, whatever the path. The order endpoints also read the
// product on each order (GET /products/{id}); that path is otherwise still on placeholder data
// for the marketplace, so it is switched on here by endpoint rather than by path.
const LIVE_ENDPOINTS = new Set([
  "myOrders",
  "listFarmerOrders",
  "getOrder",
  "assignedOrders",
  "unassignedOrders",
  "listOrdersAdmin",
  "orderProduct",
  // Surplus and donations are completed from their product too.
  "listMySurplus",
  "listDonations",
  "myFarmerDonations",
  "myOrganisationDonations",
  "allDonationsAdmin",
]);

// Lists the backend has no endpoint for yet. These come back empty, so an account never sees
// made-up figures as if they were its own. Move a route to LIVE_ROUTES (with its
// real path) once the backend provides it.
const NO_BACKEND_YET: [method: string, path: RegExp][] = [
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
  if (hit(NO_BACKEND_YET)) return { data: [] };
  const live = hit(LIVE_ROUTES) || LIVE_ENDPOINTS.has(baseApi.endpoint);
  return live ? liveBaseQuery(args, baseApi, extra) : mockBaseQuery(args, baseApi, extra);
};

/**
 * Products are the only multipart resource. On the real API the body is form data: the text
 * fields, `tags` repeated once per tag, `coverImage` as one file and `images` as files.
 * No Content-Type is set here; the browser adds it with the multipart boundary.
 * Photos already on the server are not re-sent (the API takes files, not URLs).
 */
function productBody({ coverImage, images, ...fields }: Partial<ProductWrite>): FormData {
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

type Fetch = (arg: string | FetchArgs) => PromiseLike<{ data?: unknown; error?: FetchBaseQueryError }> | { data?: unknown; error?: FetchBaseQueryError };

/**
 * Orders carry the farm, address and price, but not the photo, and older orders can have gaps.
 * The photo and anything missing are filled in from the order's product. A product that has
 * since been deleted simply leaves those blank.
 */
async function completeOrders(fetch: Fetch, orders: Order[]): Promise<Order[]> {
  const products = await productsById(
    fetch,
    orders.map((o) => o.productId),
  );
  return orders.map((o) => {
    const product = products.get(o.productId);
    const unitPrice = o.unitPrice ?? product?.price;
    return {
      ...o,
      farmerName: o.farmName ?? o.farmerName ?? product?.farmerName,
      pickupAddress: o.pickupAddress ?? product?.pickupAddress,
      unitPrice,
      total: o.totalPence != null ? o.totalPence / 100 : unitPrice != null ? Math.round(unitPrice * o.quantity * 100) / 100 : undefined,
      coverImageUrl: product?.coverImageUrl,
    };
  });
}

async function orderList(fetch: Fetch, arg: string | FetchArgs) {
  const res = await fetch(arg);
  if (res.error) return { error: res.error };
  return { data: await completeOrders(fetch, (res.data as Order[] | null) ?? []) };
}

/** The product behind each row, read once per distinct product. Deleted products are simply absent. */
async function productsById(fetch: Fetch, ids: number[]): Promise<Map<number, Product>> {
  const unique = [...new Set(ids)];
  const found = await Promise.all(unique.map((id) => fetch(`/products/${id}`)));
  const map = new Map<number, Product>();
  unique.forEach((id, i) => {
    if (!found[i].error && found[i].data) map.set(id, found[i].data as Product);
  });
  return map;
}

/**
 * Donations and a farmer's surplus arrive with only the product's id and name. The photo,
 * best-before date and pickup address shown on the cards come from the product itself.
 */
async function withProductDetails<T extends { productId: number; coverImageUrl?: string; bestBeforeDate?: string; pickupAddress?: string; farmerName?: string }>(
  fetch: Fetch,
  arg: string,
  finish: (row: T) => T = (row) => row,
) {
  const res = await fetch(arg);
  if (res.error) return { error: res.error };
  const rows = (res.data as T[] | null) ?? [];
  const products = await productsById(
    fetch,
    rows.map((r) => r.productId),
  );
  return {
    data: rows.map((row) => {
      const p = products.get(row.productId);
      return finish(p ? { ...row, coverImageUrl: p.coverImageUrl, bestBeforeDate: p.bestBeforeDate, pickupAddress: p.pickupAddress, farmerName: row.farmerName ?? p.farmerName } : row);
    }),
  };
}

/** GET /surplus answers with products (the ones flagged as surplus), so shape them as surplus rows. */
const surplusFromProduct = (p: Product): Surplus => ({
  id: p.id,
  productId: p.id,
  productName: p.name,
  quantity: p.quantityAvailable,
  availableQuantity: p.quantityAvailable,
  createdAt: p.createdAt,
  farmerName: p.farmerName,
  coverImageUrl: p.coverImageUrl,
  bestBeforeDate: p.bestBeforeDate,
  pickupAddress: p.pickupAddress,
});

/** The API's organisation, in the shape the pages use. */
type ApiOrganisation = { id: number; name: string; type: Organisation["type"]; charityNumber?: string | null; registrationStatus?: string | null; verifiedAt?: string | null; userId?: number; userName?: string | null };
// CONFIRM WITH BACKEND: the exact registrationStatus values. Matched whole, never by substring:
// "INACTIVE" contains "ACTIVE" and "PENDING_VERIFICATION" contains "VERIF", and neither is verified.
const VERIFIED_STATUSES = new Set(["VERIFIED", "APPROVED", "ACTIVE"]);
const PENDING_STATUSES = new Set(["PENDING", "PENDING_VERIFICATION", "PENDING_REVIEW", "IN_REVIEW", "UNDER_REVIEW", "SUBMITTED"]);
function toOrganisation(o: ApiOrganisation): Organisation {
  const status = (o.registrationStatus ?? "").toUpperCase();
  // A stated status always wins: a group that was verified and later turned down keeps its verifiedAt.
  const verified = status ? VERIFIED_STATUSES.has(status) : !!o.verifiedAt;
  const verificationLevel = verified ? "VERIFIED" : PENDING_STATUSES.has(status) ? "PENDING" : "UNVERIFIED";
  return { id: o.id, name: o.name, type: o.type, charityNumber: o.charityNumber ?? undefined, verificationLevel, userId: o.userId };
}
// CONFIRM WITH BACKEND: the values PATCH /organisations/{id}/status accepts.
const ORG_STATUS: Record<NonNullable<Organisation["verificationLevel"]>, string> = { VERIFIED: "VERIFIED", PENDING: "PENDING", UNVERIFIED: "REJECTED" };

type ApiEarning = Omit<EarningLine, "label" | "date"> & { productName?: string | null; createdAt: string };
const toEarningLine = ({ productName, createdAt, ...e }: ApiEarning): EarningLine => ({
  ...e,
  date: createdAt,
  label: productName || (e.type === "DELIVERY_FEE" ? "Delivery" : "Sale"),
});
type ApiPayout = { id: string; amountPence: number; status?: string | null; arrivalDate?: string | null; createdAt: string };
const toPayoutLine = (p: ApiPayout): PayoutLine => {
  // Stripe's words: paid, pending, in_transit, failed, canceled.
  const status = (p.status ?? "").toUpperCase();
  return { id: p.id, amountPence: p.amountPence, date: p.arrivalDate ?? p.createdAt, status: status === "PAID" ? "PAID" : /^(FAILED|CANCELL?ED)$/.test(status) ? "FAILED" : "PENDING" };
};

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
    "Profile",
    "Earnings",
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

    // A farmer's incoming orders.
    listFarmerOrders: b.query<Order[], void>({
      queryFn: (_arg, _api, _extra, fetch) => orderList(fetch, "/orders/my/farmer"),
      providesTags: ["Order"],
    }),

    // Surplus (spec §7.10). CONFIRM WITH BACKEND: create endpoint is not documented; this assumes POST /surplus.
    listMySurplus: b.query<Surplus[], void>({
      // The API doesn't say how much of a listing has been claimed, so all of it counts as available.
      queryFn: (_arg, _api, _extra, fetch) => withProductDetails<Surplus>(fetch, "/surplus/my", (row) => ({ ...row, availableQuantity: row.availableQuantity ?? row.quantity })),
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
      query: (id) => ({ url: `/notifications/${id}/read`, method: "PATCH" }),
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

    // The order list differs by role: /orders/my (customer), /orders/assigned (driver), /orders (admin).
    myOrders: b.query<Order[], void>({
      queryFn: (_arg, _api, _extra, fetch) => orderList(fetch, "/orders/my"),
      providesTags: ["MyOrders"],
    }),
    getOrder: b.query<Order, number>({
      queryFn: async (id, _api, _extra, fetch) => {
        const res = await fetch(`/orders/${id}`);
        if (res.error) return { error: res.error };
        return { data: (await completeOrders(fetch, [res.data as Order]))[0] };
      },
      providesTags: ["MyOrders", "Jobs", "AdminOrders"],
    }),
    // The product on an order, read from the real API (the marketplace's own product pages are
    // still on placeholder data, so they keep using getProduct).
    orderProduct: b.query<Product, number>({
      query: (id) => `/products/${id}`,
      providesTags: ["Product"],
    }),

    // ───────── Driver jobs (spec §3.7) ─────────
    assignedOrders: b.query<Order[], void>({
      queryFn: (_arg, _api, _extra, fetch) => orderList(fetch, "/orders/assigned"),
      providesTags: ["Jobs"],
    }),
    unassignedOrders: b.query<Order[], void>({
      queryFn: (_arg, _api, _extra, fetch) => orderList(fetch, "/orders/unassigned"),
      providesTags: ["Jobs"],
    }),
    assignOrder: b.mutation<Order, number>({
      // Driver → self: driverId is optional (required only for admin).
      query: (id) => ({ url: `/orders/${id}/assign`, method: "PATCH" }),
      invalidatesTags: ["Jobs", "Order", "MyOrders", "Notification"],
    }),
    // Used only for orders the API marks deliveryCodeRequired. The server checks the code; the
    // driver's browser never receives it.
    confirmDelivery: b.mutation<Order, { id: number; code: string }>({
      query: ({ id, code }) => ({ url: `/orders/${id}/confirm-delivery`, method: "POST", body: { code } }),
      invalidatesTags: ["Jobs", "Order", "MyOrders", "AdminOrders", "Donation", "Notification", "Earnings"],
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
        "AdminOrders",
        "Donation",
        "Notification",
        "Earnings",
      ],
    }),

    // ───────── Donations (spec §3.9) ─────────
    listDonations: b.query<Donation[], void>({
      queryFn: (_arg, _api, _extra, fetch) => withProductDetails<Donation>(fetch, "/donations"),
      providesTags: ["Donation"],
    }),
    myFarmerDonations: b.query<Donation[], void>({
      queryFn: (_arg, _api, _extra, fetch) => withProductDetails<Donation>(fetch, "/donations/my/farmer"),
      providesTags: ["Donation"],
    }),
    myOrganisationDonations: b.query<Donation[], void>({
      queryFn: (_arg, _api, _extra, fetch) => withProductDetails<Donation>(fetch, "/donations/my/organisation"),
      providesTags: ["Donation"],
    }),
    createDonation: b.mutation<
      Donation,
      { productId: number; quantity: number; note?: string }
    >({
      // The API takes the product and the quantity only; a note has nowhere to go yet.
      query: ({ productId, quantity }) => ({ url: "/donations", method: "POST", body: { productId, quantity } }),
      invalidatesTags: ["Donation", "Product"],
    }),
    // organisationId is only required when the caller is ADMIN; omitted for ORGANISATION.
    claimDonation: b.mutation<Donation, { id: number; withDelivery?: boolean }>(
      {
        query: ({ id, withDelivery }) => ({
          url: `/donations/${id}/${withDelivery ? "claim-and-order" : "claim"}`,
          method: "PATCH",
        }),
        // Claiming with delivery creates an order, shown on Deliveries and on admin orders.
        invalidatesTags: ["Donation", "Jobs", "MyOrders", "AdminOrders", "Notification"],
      },
    ),

    // ───────── Surplus browse (spec §3.10) ─────────
    listSurplus: b.query<Surplus[], void>({
      query: () => "/surplus",
      transformResponse: (products: Product[] | null) => (products ?? []).map(surplusFromProduct),
      providesTags: ["Surplus"],
    }),
    // The product id goes in the path and there is no body. The API answers with an empty body.
    claimSurplus: b.mutation<Surplus | null, number>({
      query: (productId) => ({
        url: `/surplus/claim/${productId}`,
        method: "POST",
      }),
      invalidatesTags: ["Surplus", "Notification"],
    }),

    // ───────── Organisations (spec §3.11). CONFIRM WITH BACKEND: GET /organisations/my is assumed. ─────────
    // Null means no organisation yet (404), and the page shows the apply form.
    myOrganisation: b.query<Organisation | null, void>({
      queryFn: async (_arg, _api, _extra, fetch) => {
        const res = await fetch("/organisations/my");
        if (res.error) return res.error.status === 404 ? { data: null } : { error: res.error };
        const org = res.data as ApiOrganisation | null;
        return { data: org?.id ? toOrganisation(org) : null };
      },
      providesTags: ["Org"],
    }),
    createOrganisation: b.mutation<
      Organisation,
      Pick<Organisation, "name" | "type" | "charityNumber" | "description">
    >({
      // The API takes name, type and charityNumber. The owner comes from the session.
      query: ({ name, type, charityNumber }) => ({ url: "/organisations", method: "POST", body: { name, type, charityNumber } }),
      transformResponse: toOrganisation,
      invalidatesTags: ["Org", "Orgs"],
    }),
    updateOrganisation: b.mutation<
      Organisation,
      { id: number } & Partial<Organisation>
    >({
      query: ({ id, name, type, charityNumber }) => ({
        url: `/organisations/${id}`,
        method: "PUT",
        body: { name, type, charityNumber },
      }),
      transformResponse: toOrganisation,
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
        queryFn: async (status, _api, _extra, fetch) => {
          const res = await orderList(fetch, { url: "/orders", params: status ? { status } : undefined });
          if (res.error) return { error: res.error };
          return { data: res.data.map((o) => ({ ...o, total: o.total ?? 0 })) };
        },
        providesTags: ["AdminOrders"],
      },
    ),
    // An admin assigning a driver must send driverId as a query param (a driver taking a job
    // for themselves sends none; see assignOrder).
    adminAssignOrder: b.mutation<Order, { id: number; driverId: number }>({
      query: ({ id, driverId }) => ({
        url: `/orders/${id}/assign`,
        method: "PATCH",
        params: { driverId },
      }),
      invalidatesTags: ["AdminOrders", "Jobs", "Order", "MyOrders"],
    }),
    adminOrderStatus: b.mutation<Order, { id: number; status: OrderStatus }>({
      query: ({ id, status }) => ({
        url: `/orders/${id}/status`,
        method: "PATCH",
        params: { status },
      }),
      invalidatesTags: ["AdminOrders", "Jobs", "Order", "MyOrders"],
    }),
    listOrganisations: b.query<Organisation[], void>({
      query: () => "/organisations",
      transformResponse: (list: ApiOrganisation[] | null) => (list ?? []).map(toOrganisation),
      providesTags: ["Orgs"],
    }),
    // An admin approving or turning down a food group: PATCH /organisations/{id}/status { status }.
    verifyOrganisation: b.mutation<
      Organisation,
      {
        id: number;
        verificationLevel: NonNullable<Organisation["verificationLevel"]>;
      }
    >({
      query: ({ id, verificationLevel }) => ({
        url: `/organisations/${id}/status`,
        method: "PATCH",
        body: { status: ORG_STATUS[verificationLevel] },
      }),
      transformResponse: toOrganisation,
      invalidatesTags: ["Orgs", "Org", "Notification"],
    }),
    allDonationsAdmin: b.query<Donation[], void>({
      queryFn: (_arg, _api, _extra, fetch) => withProductDetails<Donation>(fetch, "/donations/all"),
      providesTags: ["Donation"],
    }),
    // Admin only. organisationUserId is the food group's user id, not the organisation's id.
    assignSurplus: b.mutation<
      (Surplus & { assignedTo?: string }) | null,
      { productId: number; organisationUserId: number }
    >({
      query: ({ productId, organisationUserId }) => ({
        url: `/surplus/assign/${productId}`,
        method: "POST",
        params: { organisationUserId },
      }),
      invalidatesTags: ["Surplus"],
    }),

    // ───────── Profile picture (multipart; the file field must be named exactly "file") ─────────
    uploadAvatar: b.mutation<User, File>({
      query: (file) => {
        const body = new FormData();
        body.append("file", file);
        return { url: "/users/me/avatar", method: "POST", body };
      },
      invalidatesTags: ["Me", "Users"],
    }),

    // ───────── Role profiles: farm, vehicle and kitchen details (role profiles spec §7) ─────────
    // The owner is never sent; the backend takes it from the session.
    getMyProfile: b.query<ProfileStatus, void>({
      query: () => "/profile/me",
      transformResponse: (s: ProfileStatus) => ({ ...s, missingFields: s.missingFields ?? [], profile: s.profile?.id ? s.profile : null }),
      providesTags: ["Profile"],
    }),
    createFarm: b.mutation<Farm, Partial<Farm>>({
      query: (body) => ({ url: "/farms", method: "POST", body }),
      invalidatesTags: ["Profile"],
    }),
    updateFarm: b.mutation<Farm, { id: number; body: Partial<Farm> }>({
      query: ({ id, body }) => ({ url: `/farms/${id}`, method: "PUT", body }),
      invalidatesTags: ["Profile"],
    }),
    createDriverProfile: b.mutation<DriverProfile, Partial<DriverProfile>>({
      query: (body) => ({ url: "/drivers/profile", method: "POST", body }),
      invalidatesTags: ["Profile"],
    }),
    updateDriverProfile: b.mutation<DriverProfile, Partial<DriverProfile>>({
      query: (body) => ({ url: "/drivers/profile", method: "PUT", body }),
      invalidatesTags: ["Profile"],
    }),
    createKitchen: b.mutation<Kitchen, Partial<Kitchen>>({
      query: (body) => ({ url: "/kitchens", method: "POST", body }),
      invalidatesTags: ["Profile"],
    }),
    updateKitchen: b.mutation<Kitchen, { id: number; body: Partial<Kitchen> }>({
      query: ({ id, body }) => ({ url: `/kitchens/${id}`, method: "PUT", body }),
      invalidatesTags: ["Profile"],
    }),

    // ───────── Earnings and payouts (payouts spec §5) ─────────
    getEarningsSummary: b.query<EarningsSummary, void>({
      // The money is on /earnings; what Stripe still needs from the seller is on /connect/status.
      queryFn: async (_arg, _api, _extra, fetch) => {
        const res = await fetch("/earnings");
        if (res.error) return { error: res.error };
        const status = await fetch("/connect/status");
        // 404: no Stripe account yet, so nothing is being asked for.
        if (status.error && status.error.status !== 404) return { error: status.error };
        const requirementsDue = (status.data as { requirementsDue?: string[] | null } | undefined)?.requirementsDue ?? [];
        return { data: { ...(res.data as EarningsSummary), requirementsDue } };
      },
      providesTags: ["Earnings"],
    }),
    getEarningTransactions: b.query<EarningLine[], void>({
      // Paged by the API. The table filters by month, so it needs every page.
      queryFn: async (_arg, _api, _extra, fetch) => {
        const lines: EarningLine[] = [];
        for (let page = 0; ; page++) {
          const res = await fetch({ url: "/earnings/transactions", params: { page, size: 100 } });
          if (res.error) return { error: res.error };
          const body = res.data as { content?: ApiEarning[]; last?: boolean } | null;
          const rows = body?.content ?? [];
          lines.push(...rows.map(toEarningLine));
          if (!rows.length || body?.last !== false) return { data: lines };
        }
      },
      providesTags: ["Earnings"],
    }),
    getPayoutHistory: b.query<PayoutLine[], void>({
      query: () => "/earnings/payouts",
      transformResponse: (rows: ApiPayout[] | null) => (rows ?? []).map(toPayoutLine),
      providesTags: ["Earnings"],
    }),
    // Mutations, not queries: each call mints a single-use, short-lived Stripe link. Never cache one.
    startConnectOnboarding: b.mutation<{ url: string }, void>({
      query: () => ({ url: "/connect/onboard", method: "POST" }),
    }),
    getConnectDashboardLink: b.mutation<{ url: string }, void>({
      query: () => ({ url: "/connect/dashboard-link", method: "POST" }),
    }),

    // CONFIRM WITH BACKEND: revenue analytics endpoint is not documented yet.
    farmerRevenue: b.query<{ date: string; value: number }[], void>({
      query: () => "/analytics/farmer/revenue",
    }),
  }),
});

export const {
  useUploadAvatarMutation,
  useGetMyProfileQuery,
  useLazyGetMyProfileQuery,
  useCreateFarmMutation,
  useUpdateFarmMutation,
  useCreateDriverProfileMutation,
  useUpdateDriverProfileMutation,
  useCreateKitchenMutation,
  useUpdateKitchenMutation,
  useGetEarningsSummaryQuery,
  useGetEarningTransactionsQuery,
  useGetPayoutHistoryQuery,
  useStartConnectOnboardingMutation,
  useGetConnectDashboardLinkMutation,
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
  useOrderProductQuery,
  useAssignedOrdersQuery,
  useUnassignedOrdersQuery,
  useAssignOrderMutation,
  useUpdateOrderStatusMutation,
  useConfirmDeliveryMutation,
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
