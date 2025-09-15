// src/app/(auth)/login/page.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useAppDispatch } from "@/lib/redux/store";
import { setToken, setUser } from "@/lib/redux/slices/auth.slice";
import {
  useLoginMutation,
  useMeQuery,
  useLazyMeQuery,
} from "@/lib/redux/services/auth.api";
import { routeAfterLogin } from "@/lib/utils/routeAfterLogin";

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const [login, { isLoading }] = useLoginMutation();
  const [fetchMe] = useLazyMeQuery();
  // const { refetch: fetchMe } = useMeQuery(undefined, { skip: true });

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!email || !password) {
      setFormError("Please enter your email and password.");
      return;
    }

    try {
      // 1) Login → get JWT
      const res = await login({ email, password }).unwrap();
      dispatch(setToken(res.token));
      // console.log("Logged in, token set:", res.token);
      // 2) Fetch current user (/users/me) to know the role
      const me = await fetchMe().unwrap();
      dispatch(setUser(me));
      console.log("Fetched current user, user set:", me);
      // 3) Route by role (admins/farmers/drivers/foodbanks get dashboards; customers go to /products)
      router.replace(routeAfterLogin(me?.role));
      // console.log("Routed to appropriate area for role:", me?.role);
    } catch (err) {
      setFormError("Invalid credentials or server error. Please try again.");
      // Optional: clear token if partial state
      dispatch(setToken(null));
      dispatch(setUser(null));
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h2 className="text-2xl font-bold text-center text-green-700 mb-6">
        Welcome Back 👋
      </h2>

      <form className="space-y-5" onSubmit={handleLogin}>
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input
            type="email"
            className="w-full border rounded p-2 mt-1"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Password</label>
          <input
            type="password"
            className="w-full border rounded p-2 mt-1"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>

        {formError && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
            {formError}
          </p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition disabled:opacity-60"
        >
          {isLoading ? "Signing in..." : "Login"}
        </button>

        <div className="flex justify-end text-sm">
          <Link
            href="/forgot-password"
            className="text-green-700 hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <p className="text-sm text-center">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-green-700 hover:underline">
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
}
