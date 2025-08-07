"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
// import { loginUser } from "@/utils/api";
import { useState } from "react";

export default function Page() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // const handleLogin = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   setErrorMsg("");

  //   try {
  //     await loginUser({ email, password });
  //     router.push("/"); // Redirect to homepage
  //   // eslint-disable-next-line @typescript-eslint/no-explicit-any
  //   } catch (error: any) {
  //   setErrorMsg(
  //   error?.response?.data?.error || "Login failed. Please try again."
  //   );
  //   }
  //   };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h2 className="text-2xl font-bold text-center text-green-700 mb-6">
        Welcome Back 👋
      </h2>

      <form className="space-y-5">
        {errorMsg && (
          <div className="text-red-500 text-sm text-center">{errorMsg}</div>
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

        <button className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition">
          Login
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
