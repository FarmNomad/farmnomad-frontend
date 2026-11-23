// Types mirror FARMNOMAD-FRONTEND-BUILD-SPEC.md §2 so the mock and the Spring Boot API share one contract.

export type Role = "ADMIN" | "FARMER" | "KITCHEN" | "CUSTOMER" | "DRIVER" | "ORGANISATION";
export type OrganisationType = "FOODBANK" | "SCHOOL" | "RELIGIOUS" | "STUDENT_GROUP";
export type OrderStatus = "PENDING" | "ASSIGNED" | "IN_TRANSIT" | "DELIVERED" | "CANCELLED";
export type PaymentStatus = "UNPAID" | "PAID" | "REFUNDED";
export type NotificationType = "SURPLUS_ALERT" | "ORDER_UPDATE" | "DONATION_UPDATE" | "SYSTEM";

export interface User {
  id: number;
  fullName: string;
  email: string;
  role: Role;
  phoneNumber?: string | null;
  address?: string | null;
  city?: string | null;
  postcode?: string | null;
  country?: string | null;
  profilePictureUrl?: string | null;
  /** False until the email address has been verified. */
  active?: boolean;
  createdAt?: string;
}

/** POST /auth/login and /auth/refresh. Refresh rotates the refresh token, so store both each time. */
export interface AuthTokens {
  token: string;
  refreshToken: string;
  userId?: number;
  role?: Role;
  fullName?: string;
  message?: string | null;
}

/** POST /auth/register. ADMIN cannot self-register. */
export interface RegisterInput {
  fullName: string;
  email: string;
  password: string;
  phoneNumber?: string;
  address?: string;
  city?: string;
  postcode?: string;
  country?: string;
  profilePictureUrl?: string;
  role: Exclude<Role, "ADMIN">;
}

/** The auth routes that only confirm something happened. */
export interface ApiMessage {
  message?: string | null;
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  quantityAvailable: number;
  pickupAddress?: string;
  category?: string;
  tags?: string[];
  coverImageUrl?: string;
  imageUrls?: string[];
  bestBeforeDate?: string;
  farmerId: number;
  farmerName?: string;
  createdAt?: string;
  updatedAt?: string;
  /** Surplus deal, set by the farmer: this price, for this many, until this date. See lib/surplus.ts. */
  surplusPricePence?: number | null;
  surplusQuantity?: number | null;
  surplusEndsAt?: string | null;
}
/** GET /surplus/suggestions: stock the AI thinks won't sell in time. Only ever a suggestion. */
export interface SurplusSuggestion {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  suggestedPricePence?: number | null;
  endsAt?: string | null;
  /** Why, in plain words, e.g. "Best before Friday and selling slowly." */
  reason: string;
}

export interface Order {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  customerId: number;
  customerName: string;
  driverId?: number | null;
  driverName?: string | null;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: string;
  updatedAt?: string;
  farmerId?: number;
  farmName?: string | null;
  farmerName?: string;
  pickupAddress?: string;
  deliveryAddress?: string;
  unitPrice?: number;
  totalPence?: number | null;
  /** What the driver is paid for the job. No commission comes out of it. */
  deliveryFeePence?: number | null;
  deliveredAt?: string | null;
  /** Set by a refund. The API leaves paymentStatus PAID; completeOrders reads it as REFUNDED. */
  refundedAt?: string | null;
  // Worked out in completeOrders (api/farmnomad.ts).
  total?: number;
  coverImageUrl?: string;
  donationId?: number;
  // Delivery code. NOT IN THE BACKEND YET: the app uses it as soon as these fields arrive.
  /** True when the driver needs the buyer's code to complete the order. */
  deliveryCodeRequired?: boolean;
  /** Sent to the buyer only, never to the driver or farmer. */
  deliveryCode?: string | null;
}

export interface Surplus {
  id: number;
  productId: number;
  productName?: string;
  quantity?: number;
  availableQuantity?: number;
  createdAt?: string;
  // UI enrichments (see Donation).
  farmerName?: string;
  coverImageUrl?: string;
  bestBeforeDate?: string;
  pickupAddress?: string;
  claimedByMe?: boolean;
  /** Surplus deals only. */
  pricePence?: number | null;
  endsAt?: string | null;
}

export interface Notification {
  id: number;
  recipientId: number;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
}

export const PRODUCT_CATEGORIES = ["Vegetables", "Fruit", "Grain", "Dairy", "Meat", "Other"] as const;

/** Product fields as the form collects them. */
export type ProductInput = Pick<Product, "name" | "price" | "quantityAvailable"> &
  Partial<Pick<Product, "description" | "category" | "bestBeforeDate" | "pickupAddress" | "tags" | "coverImageUrl" | "imageUrls">>;

/**
 * What create and update send. The real API takes multipart: newly picked photos travel as files
 * (`coverImage` is the cover, `images` the rest). The URL fields are only used by the sample data.
 */
export type ProductWrite = ProductInput & { coverImage?: File; images?: File[]; removeImageUrls?: string[] };

// ─── UI-derived helpers (not part of the API) ───
export type StockState = "active" | "low" | "expiring" | "expired" | "out";

export function stockState(p: Product, now = new Date()): StockState {
  if (p.quantityAvailable <= 0) return "out";
  if (p.bestBeforeDate) {
    const days = daysUntil(p.bestBeforeDate, now);
    if (days < 0) return "expired";
    if (days <= 3) return "expiring";
  }
  if (p.quantityAvailable <= 10) return "low";
  return "active";
}

export function daysUntil(iso: string, now = new Date()) {
  const d = new Date(iso + (iso.length === 10 ? "T00:00:00" : ""));
  const a = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const b = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.round((b - a) / 86_400_000);
}

/**
 * GET /checkout/quote: what checkout will charge, worked out by the server from the cart and the
 * saved address. All money in pence.
 */
export interface CheckoutQuote {
  subtotalPence: number;
  deliveryPence: number;
  totalPence: number;
  miles?: number | null;
  /** One per farm, when the cart spans several. */
  groups?: { farmerId: number; farmName?: string | null; fulfilment?: string | null; miles?: number | null; subtotalPence?: number; deliveryFeePence?: number | null; deliverable?: boolean; reason?: string | null }[];
}
export interface CartItem {
  id: number;
  productId: number;
  quantity: number;
  product?: Product;
}

export interface CheckoutSession {
  sessionId: string;
  checkoutUrl: string;
}

/** Roles the demo can show: every role, including the admin console. */
export type MockRole = Role;

// ─── R3: NomadEat (spec §3.4 /meals) ───
export interface Meal {
  id: number;
  name: string;
  description: string;
  price: number;
  portionsAvailable: number;
  cuisine: string;
  imageUrls: string[];
  available: boolean;
  kitchenId?: number;
  createdAt?: string;
  // kitchenArea and farms aren't in the API.
  kitchenName?: string;
  kitchenArea?: string;
  dietary?: string[];
  farms?: string[]; // farms on FarmNomad the ingredients came from
}
export type MealInput = Pick<Meal, "name" | "description" | "price" | "portionsAvailable" | "cuisine" | "imageUrls" | "available"> & Partial<Pick<Meal, "dietary" | "farms">>;

/**
 * Meal orders:
 * POST /meal-orders {mealId, quantity, note}, GET /meal-orders/my, GET /meal-orders/kitchen,
 * PATCH /meal-orders/{id}/status?status=.
 */
export type MealOrderStatus = "NEW" | "PREPARING" | "READY" | "COLLECTED" | "CANCELLED";
/** The card is held at order (HELD) and charged when the kitchen starts cooking (CAPTURED). */
export type MealPaymentStatus = "AWAITING_PAYMENT" | "HELD" | "CAPTURED" | "RELEASED" | "REFUNDED" | "EXPIRED";
/** What POST /meal-orders answers: where to send the diner to pay. */
export interface MealCheckout {
  orderId: number;
  checkoutUrl: string;
}
export interface MealOrder {
  id: number;
  mealId: number;
  mealName: string;
  quantity: number;
  total: number;
  customerId: number;
  customerName: string;
  kitchenId: number;
  kitchenName?: string;
  status: MealOrderStatus;
  createdAt: string;
  updatedAt?: string;
  note?: string;
  /** Absent means no payment was recorded, so it mustn't be cooked. */
  paymentStatus?: MealPaymentStatus | null;
}

// ─── R2: donations, organisations, messages (spec §2, §3.9–3.12) ───
export type VerificationLevel = "UNVERIFIED" | "PENDING" | "VERIFIED";
/** CONFIRM WITH BACKEND: spec types status as a plain string; these are the values the UI expects. */
// The API sends PENDING, CLAIMED, REQUESTED, REJECTED and CANCELLED. IN_DELIVERY and DELIVERED
// are kept for when a claimed donation is tracked through its delivery order.
export type DonationStatus = "PENDING" | "CLAIMED" | "REQUESTED" | "REJECTED" | "CANCELLED" | "IN_DELIVERY" | "DELIVERED";

export interface Donation {
  id: number;
  productId: number;
  productName?: string;
  quantity: number;
  status?: DonationStatus;
  farmerId?: number;
  organisationId?: number | null;
  createdAt?: string;
  // UI enrichments: the mock joins these from the product. If the API doesn't, join with GET /products/{id}.
  farmerName?: string;
  organisationName?: string | null;
  coverImageUrl?: string;
  bestBeforeDate?: string;
  pickupAddress?: string;
  note?: string;
}

export interface Organisation {
  id: number;
  name: string;
  type: OrganisationType;
  charityNumber?: string;
  verificationLevel?: VerificationLevel;
  userId?: number;
  createdAt?: string;
  description?: string;
}

export interface Message {
  id: number;
  senderId: number;
  senderName?: string;
  recipientId: number;
  recipientName?: string;
  content: string;
  read: boolean;
  createdAt: string;
}

// ─── Farmer tools: crop scanner and weather & planting ───────────────
// Everything goes through the Spring Boot API (never the farmnomad-ai service directly).
// CONFIRM WITH BACKEND: paths and fields below follow the agreed contract as described, not a
// published schema. Adjust here and in src/lib/api/cropScan.api.ts / weather.api.ts if they differ.

/** POST /uploads (multipart, field `file`) → hosted image URL (Cloudinary). */
export interface UploadResult {
  url: string;
}

export type ScanSeverity = "NONE" | "LOW" | "MODERATE" | "HIGH";

/** A diagnosed crop photo. POST /crop-scans/diagnose { imageUrl } returns one and saves it. */
export interface CropScan {
  id: number;
  imageUrl: string;
  crop?: string; // e.g. "Tomato"
  diagnosis: string; // disease name, or "Healthy"
  healthy?: boolean;
  confidence: number; // 0–1 (spec §10 Q6: confirm the scale; the UI also accepts 0–100)
  severity?: ScanSeverity;
  treatment?: string[];
  prevention?: string[];
  recommendation?: string; // older single-text field from spec §3.14, shown if the lists are empty
  createdAt: string;
  // For the admin list. GET /crop-scans?farmerId= (ADMIN).
  farmerId?: number;
  farmerName?: string;
  farmerPostcode?: string;
}

export type FrostRisk = "NONE" | "LOW" | "MEDIUM" | "HIGH";

/** GET /weather/conditions?lat=&lon= */
export interface WeatherConditions {
  soilTemp6cm: number; // °C at 6 cm
  airTemp?: number; // °C now
  frostRisk: FrostRisk;
  minTempNext7d?: number; // °C, lowest forecast night
  rainNext24hMm: number;
  rainNext7dMm?: number;
  observedAt?: string;
  /** Not returned yet: the 7-day ForecastCard needs a small /conditions extension. Shown when present. */
  daily?: { date: string; tempMax: number; tempMin: number; rainMm: number }[];
}

export type PlantingMethod = "SOW_INDOORS" | "SOW_OUTDOORS" | "PLANT_OUT";

export interface CropAdvice {
  crop: string;
  method?: PlantingMethod;
  minSoilTemp?: number; // °C the crop needs
  blockers: string[]; // why not today, e.g. "Soil is 7°C; needs 10°C"
  warnings: string[]; // OK to go, but watch out, e.g. "Frost possible on Thursday night: fleece it"
  notes?: string;
}

/** GET /weather/planting?lat=&lon= — the 35-crop calendar lives in the AI service. */
export interface PlantingAdvice {
  readyToPlantOut: CropAdvice[];
  readyToSow: CropAdvice[];
  notReady?: CropAdvice[]; // crops with blockers
}
