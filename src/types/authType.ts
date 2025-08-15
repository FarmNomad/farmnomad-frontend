type Role = "CUSTOMER" | "FARMER" | "DRIVER" | "FOODBANK" | "ADMIN";

// export interface AuthState {
//   userId: string | null;
//   token: string | null;
//   role: Role | null;
//   email?: string | null;
//   isActive: boolean;
// }

export interface AuthUser {
  fullName: string;
  userId: string | null;
  token: string | null;
  role: Role | null;
  email?: string | null;
  isActive: boolean;
}
export interface AuthState {
  user: AuthUser | null;
  token: string | null;
}
// export interface RegisterState {
//   fullName: string;
//   email: string;
//   password: string;
//   phoneNumber?: string;
//   address?: string;
//   postcode?: string;
//   role: Role;
// }
// export interface RegisterRes {
//   token: string;
//   role: Role;
//   email: string;
//   isActive: boolean;
// }
// export interface LoginState {
//   email: string;
//   password: string;
// }
export interface LoginReq {
  email: string;
  password: string;
}
export interface LoginRes {
  token: string;
  role: "CUSTOMER" | "FARMER" | "DRIVER" | "FOODBANK" | "ADMIN";
  email: string;
  isActive: boolean;
}
export interface RegisterReq {
  fullName: string;
  email: string;
  password: string;
  phoneNumber?: string;
  address?: string;
  postcode?: string;
  role: "CUSTOMER" | "FARMER" | "DRIVER" | "FOODBANK" | "ADMIN";
}
