/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "",
    phoneNumber: "",
    address: "",
    postcode: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.role) {
      alert("Please select a role.");
      return;
    }

  }
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h2 className="text-2xl font-bold text-center text-green-700 mb-6">
        Create Account 🌱
      </h2>

      <form className="space-y-3" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-medium">Full Name</label>
          <input
            name="fullName"
            value={form.fullName}
            onChange={handleChange}
            required
            type="text"
            className="w-full border rounded p-2 mt-1"
            placeholder="Jane Doe"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            className="w-full border rounded p-2 mt-1"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Password</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            className="w-full border rounded p-2 mt-1"
            placeholder="••••••••"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Phone Number</label>
          <input
            name="phoneNumber"
            value={form.phoneNumber}
            onChange={handleChange}
            type="text"
            className="w-full border rounded p-2 mt-1"
            placeholder="+44 7xxx xxxxxx"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Role</label>
          <select
            name="role"
            className="w-full border rounded p-2 mt-1"
            value={form.role}
            onChange={handleChange}
            required
          >
            <option value="">Select Role</option>
            <option value="CUSTOMER">Customer</option>
            <option value="FARMER">Farmer</option>
            <option value="DRIVER">Driver</option>
            <option value="FOODBANK">Food Bank</option>
            {/* Admin usually shouldn’t self-register */}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Address</label>
          <input
            name="address"
            value={form.address}
            onChange={handleChange}
            type="text"
            className="w-full border rounded p-2 mt-1"
            placeholder="e.g., 12 Orchard Lane, Cumbria"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Postcode</label>
          <input
            name="postcode"
            value={form.postcode}
            onChange={handleChange}
            type="text"
            className="w-full border rounded p-2 mt-1"
            placeholder="e.g., CA1 2AB"
          />
        </div>

        {/* <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition"
        >
          {isLoading ? "Creating..." : "Sign Up"}
        </button> */}

        <p className="text-sm text-center">
          Already have an account?{" "}
          <Link href="/login" className="text-green-700 hover:underline">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}
