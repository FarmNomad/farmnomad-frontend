// src/lib/redux/features/authSlice.ts
import { AuthState, AuthUser } from "@/types/authType";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type Role = "CUSTOMER" | "FARMER" | "DRIVER" | "FOODBANK" | "ADMIN";

const initialState: AuthState = { user: null, token: null };

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuth: (
      state,
      action: PayloadAction<{ user: AuthUser; token?: string }>
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token ?? null;
    //   console.log("Auth state updated:", action.payload.user);

      if (action.payload.token) {
        // keep token for page refreshes if you’re not using httpOnly cookies
        if (typeof window !== "undefined") {
          localStorage.setItem("token", action.payload.token);
          localStorage.setItem(
            "user",
            action.payload.user ? JSON.stringify(action.payload.user) : ""
          );
        }
      }
    },

    clearAuth: (state) => {
      state.user = null;
      state.token = null;
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    },
  },
});

export const { setAuth, clearAuth } = authSlice.actions;
export default authSlice.reducer;

// selector
export const selectAuth = (state: any) => state.auth as AuthState;
