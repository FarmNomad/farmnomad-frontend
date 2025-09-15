import type { Role } from "../types/api";

export const routeAfterLogin = (role?: Role) => {
  switch (role) {
    case "ADMIN":
      return "/dashboard/admin";
    case "FARMER":
      return "dashboard/farmer";
    case "DRIVER":
      return "dashboard/driver";
    case "FOODBANK":
      return "dashboard/foodbank";
    default:
      return "/"; // customers go to home/products
  }
};
