"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLoginMutation } from "@/lib/services/authApi";
import { useDispatch } from "react-redux";
import { setAuth } from "@/lib/redux/features/authSlice";
import { AuthUser } from "@/types/authType";

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [login, { isLoading, error }] = useLoginMutation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const apiError =
    (error as any)?.data?.message ||
    (error as any)?.error ||
    (error ? "Login failed" : "");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;

    try {
      const res = await login({ email, password }).unwrap();
      // res: { token, role, email, isActive, userId? }
      dispatch(
        setAuth({
          user: res as AuthUser,
          token: res.token,
        })
      );

      // Optional: route by role
      if (!res.isActive && res.role !== "ADMIN") {
        // if you require activation
        router.replace("/"); // or /verification
        return;
      }

      // No need to check res.ok; errors are handled by the mutation's error handling
      if (!res || !res.token) {
        throw new Error("Login failed: Invalid credentials or server error.");
      }

      // simple route to products (or role dashboards)
      router.replace("/dashboard/admin");
    } catch {
      // handled by apiError
      console.error("Login failed:", error);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h2 className="text-2xl font-bold text-center text-green-700 mb-6">
        Welcome Back 👋
      </h2>

      <form className="space-y-5" onSubmit={handleLogin}>
        {apiError && (
          <div className="text-red-500 text-sm text-center">{apiError}</div>
        )}

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

        <div className="flex justify-end text-sm">
          <Link
            href="/forgot-password"
            className="text-green-700 hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <button
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition"
          disabled={isLoading}
        >
          {isLoading ? "Signing in..." : "Login"}
        </button>

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
