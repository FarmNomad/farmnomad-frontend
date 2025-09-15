import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { User } from "../../types/api";

interface AuthState {
  token: string | null;
  user: User | null;
}

const initialState: AuthState = {
  token:
    (typeof window !== "undefined" && localStorage.getItem("token")) || null,
  user: null,
};

const slice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setToken(state, action: PayloadAction<string | null>) {
      state.token = action.payload;
      if (typeof window !== "undefined") {
        if (action.payload) localStorage.setItem("token", action.payload);
        else localStorage.removeItem("token");
      }
    },
    setUser(state, action: PayloadAction<User | null>) {
      state.user = action.payload;
    },
    logout(state) {
      state.token = null;
      state.user = null;
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
      }
    },
  },
});

export const { setToken, setUser, logout } = slice.actions;
export default slice.reducer;
