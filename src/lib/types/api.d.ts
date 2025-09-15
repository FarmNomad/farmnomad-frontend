// Shared DTOs & Enums

export type Role = "ADMIN" | "FARMER" | "CUSTOMER" | "DRIVER" | "FOODBANK";

export interface User {
  id: number;
  fullName: string;
  email: string;
  role: Role;
  phoneNumber?: string;
  address?: string;
  postcode?: string;
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
  bestBeforeDate?: string; // ISO
  farmerId: number;
  farmerName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  toFixed: any;
  id: number;
  productId: number;
  quantity: number;
  product?: Product;
}

export type OrderStatus = "PENDING" | "IN_TRANSIT" | "DELIVERED" | "CANCELLED";

export interface Order {
  id: number;
  productId: number;
  quantity: number;
  status: OrderStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface Donation {
  id: number;
  productId: number;
  quantity: number;
  status?: string;
  createdAt?: string;
}

export interface LoginResponse {
  token: string;
}

export interface ApiError {
  status: number;
  data?: unknown;
}
