"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
// import { selectAuth, clearAuth } from "@/src/lib/redux/features/authSlice";
import { selectAuth, clearAuth } from "@/lib/redux/features/authSlice";
import {
  Home,
  ShoppingCart,
  ShoppingBag,
  Mail,
  Cloud,
  Heart,
  UserCircle2,
  LogOut,
} from "lucide-react";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  const { user } = useSelector(selectAuth);
  console.log("Navbar user:", user);

  const links = [
    { name: "Home", href: "/", icon: <Home size={20} /> },
    {
      name: "Marketplace",
      href: "/marketplace",
      icon: <ShoppingBag size={20} />,
    },
    { name: "Orders", href: "/orders", icon: <ShoppingCart size={20} /> },
    { name: "Messages", href: "/messages", icon: <Mail size={20} /> },
    { name: "Weather", href: "/weatherforecast", icon: <Cloud size={20} /> },
  ];

  const handleLogout = async () => {
    // If you store token client-side:
    dispatch(clearAuth());

    router.push("/login");
  };

  return (
    <nav className="bg-white h-[4rem] z-20 p-4 shadow-md fixed w-full flex justify-between items-center">
      {/* Logo */}
      <Link href="/" className="text-xl font-bold text-green-800">
        AgriRoute
      </Link>

      {/* Middle links */}
      <div className="flex space-x-4">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center space-x-2 px-4 py-2 rounded ${
              pathname === link.href
                ? "bg-green-100 text-green-800"
                : "hover:bg-neutral"
            }`}
          >
            {link.icon}
            <span>{link.name}</span>
          </Link>
        ))}
      </div>

      {/* Right section: auth-aware */}
      <div className="flex space-x-3 items-center">
        {/* Favorites & Cart always visible */}
        <button
          onClick={() => router.push("/liked")}
          className="p-2 hover:bg-neutral rounded"
          aria-label="Liked"
        >
          <Heart size={20} color="#2d6a4f" />
        </button>
        <button
          onClick={() => router.push("/cart")}
          className="p-2 hover:bg-neutral rounded"
          aria-label="Cart"
        >
          <ShoppingCart size={20} color="#2d6a4f" />
        </button>

        {!user ? (
          <>
            <Link href="/login">
              <button className="px-4 py-2 rounded border border-green-700 text-green-700">
                Login
              </button>
            </Link>
            <Link href="/register">
              <button className="px-4 py-2 rounded text-white bg-green-800 hover:opacity-90">
                Join Us
              </button>
            </Link>
          </>
        ) : (
          <>
            {/* Role badge */}
            <span className="text-xs font-semibold px-2 py-1 rounded bg-green-100 text-green-700 uppercase">
              {user.role}
            </span>

            {/* Full name */}
            <span className="hidden sm:inline font-medium text-gray-800">
              {user.fullName}
            </span>

            {/* Profile icon (initials) */}
            <button
              onClick={() => router.push("/account")}
              className="w-9 h-9 rounded-full bg-green-700 text-white flex items-center justify-center"
              aria-label="Account"
              title="Account"
            >
              {/* fallback to icon if no name */}
              {user.fullName ? (
                initials(user.fullName)
              ) : (
                <UserCircle2 size={20} />
              )}
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 px-4 py-2 rounded border border-red-600 text-red-600 hover:bg-red-50"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
