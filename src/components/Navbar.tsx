// src/components/Navbar.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
import { useEffect, useRef, useState } from "react";

import { useAppDispatch, useAppSelector } from "@/lib/redux/store";
import { logout as logoutAction } from "@/lib/redux/slices/auth.slice";
import { baseApi } from "@/lib/redux/baseApi";

function initials(name?: string) {
  if (!name) return "";
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
  const dispatch = useAppDispatch();
  const { token, user } = useAppSelector((s) => s.auth);

  // dropdown
  const [openMenu, setOpenMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);

  // hide-on-scroll
  const [showNav, setShowNav] = useState(true);
  const lastY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    // close dropdown on outside click or ESC
    function onDocClick(e: MouseEvent) {
      if (!openMenu) return;
      const target = e.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        btnRef.current &&
        !btnRef.current.contains(target)
      ) {
        setOpenMenu(false);
      }
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenMenu(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [openMenu]);

  useEffect(() => {
    // slide away on scroll down, slide back on scroll up
    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;

      requestAnimationFrame(() => {
        const y = window.scrollY;
        const down = y > lastY.current;
        const threshold = 64; // px before we start hiding

        if (!openMenu) {
          if (down && y > threshold) setShowNav(false);
          else setShowNav(true);
        }
        lastY.current = y;
        ticking.current = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [openMenu]);

  const links = [
    { name: "Home", href: "/home", icon: <Home size={20} /> },
    {
      name: "Marketplace",
      href: "/marketplace",
      icon: <ShoppingBag size={20} />,
    }, // change to /products if needed
    { name: "Orders", href: "/orders", icon: <ShoppingCart size={20} /> },
    { name: "Messages", href: "/messages", icon: <Mail size={20} /> },
    { name: "Weather", href: "/weatherforecast", icon: <Cloud size={20} /> },
  ];

  // non-customer dashboard path
  const dashboardHref =
    user?.role === "ADMIN"
      ? "/dashboard/admin"
      : user?.role === "FARMER"
      ? "/dashboard/farmer"
      : user?.role === "DRIVER"
      ? "/dashboard/driver"
      : user?.role === "FOODBANK"
      ? "/dashboard/foodbank"
      : null;

  const handleLogout = async () => {
    dispatch(logoutAction());
    dispatch(baseApi.util.resetApiState());
    setOpenMenu(false);
    router.replace("/login");
  };

  return (
    <nav
      className={`bg-white/95 backdrop-blur h-[4.5rem] z-20 p-4 shadow-md fixed w-full top-0 flex justify-between items-center transition-transform duration-300 ease-out ${
        showNav ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      {/* Logo */}
      <Link href="/" className="text-xl font-bold text-green-800">
        AgriRoute
      </Link>

      {/* Middle links */}
      <div className="flex space-x-1 sm:space-x-2">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md transition ${
                active
                  ? "text-[#ff5722] bg-orange-50"
                  : "text-green-800 hover:bg-gray-100"
              }`}
            >
              {link.icon}
              <span>{link.name}</span>
            </Link>
          );
        })}
        {dashboardHref && (
          <Link
            href={dashboardHref}
            className={`flex items-center space-x-2 px-3 py-2 rounded-md transition ${
              pathname === dashboardHref
                ? "text-[#ff5722] bg-orange-50"
                : "text-green-800 hover:bg-gray-100"
            }`}
          >
            <UserCircle2 size={20} />
            <span>Dashboard</span>
          </Link>
        )}
      </div>

      {/* Right section */}
      <div className="flex space-x-2 sm:space-x-3 items-center">
        {/* Favorites & Cart */}
        <button
          onClick={() => router.push("/liked")}
          className="p-2 hover:bg-gray-200 rounded-md  cursor-pointer"
          aria-label="Liked"
          title="Liked"
        >
          <Heart size={20} color="#2d6a4f" />
        </button>
        <button
          onClick={() => router.push("/cart")}
          className="p-2 hover:bg-gray-200 rounded-md cursor-pointer"
          aria-label="Cart"
          title="Cart"
        >
          <ShoppingCart size={20} color="#2d6a4f" />
        </button>

        {!token || !user ? (
          <>
            <Link href="/login">
              <button className="px-4 py-2 rounded-md border border-green-700 text-green-700 hover:bg-green-50">
                Login
              </button>
            </Link>
            <Link href="/register">
              <button className="px-4 py-2 rounded-md text-white bg-green-800 hover:opacity-90">
                Join Us
              </button>
            </Link>
          </>
        ) : (
          <>
            {/* Role badge */}
            <span className="hidden sm:inline text-xs font-semibold px-2 py-1 rounded bg-green-100 text-green-700 uppercase">
              {user.role}
            </span>

            {/* Profile dropdown */}
            <div className="relative cursor-pointer">
              <button
                ref={btnRef}
                onClick={() => setOpenMenu((v) => !v)}
                className="w-9 h-9 rounded-full bg-[#74c69d] text-white flex items-center cursor-pointer justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600"
                aria-label="Account menu"
                aria-haspopup="menu"
                aria-expanded={openMenu}
              >
                {user.fullName ? (
                  initials(user.fullName)
                ) : (
                  <UserCircle2 size={20} />
                )}
              </button>

              {openMenu && (
                <div
                  ref={menuRef}
                  role="menu"
                  className="absolute right-0 mt-2 w-48 rounded-md border bg-white shadow-lg overflow-hidden"
                >
                  <button
                    onClick={() => {
                      setOpenMenu(false);
                      router.push("/profile");
                    }}
                    className="w-full text-left px-3 py-2 text-sm flex items-center cursor-pointer gap-2 hover:bg-gray-100"
                    role="menuitem"
                  >
                    <UserCircle2 size={16} />
                    View profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer flex items-center gap-2"
                    role="menuitem"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </nav>
  );
}
