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
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const route = useRouter();

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

  return (
    <nav className="bg-white text-white h-[4rem] z-20 p-4 shadow-md fixed w-full flex justify-between items-center">
      {/* Logo */}
      <Link href="/" className="text-xl font-bold">
        AgriRoute
      </Link>

      <div className="flex space-x-4">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center space-x-2 px-4 py-2 rounded ${
              pathname === link.href ? "bg-secondary" : "hover:bg-neutral"
            }`}
          >
            {link.icon}
            <span>{link.name}</span>
          </Link>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-4 items-center">
        <Link href="/login">
          <button className="px-4 py-2 rounded border border-secondary text-secondary cursor-pointer">
            Login
          </button>
        </Link>
        <Link href="/register">
          <button className="px-4 py-2 rounded text-white bg-green-800 transition cursor-pointer hover:opacity-80">
            Join Us
          </button>
        </Link>
        <button
          onClick={() => {
            route.push("/liked");
          }}
          className="p-2 hover:bg-neutral rounded"
        >
          <Heart size={20} color="#2d6a4f" />
        </button>
        <button
          onClick={() => {
            route.push("/cart");
          }}
          className="p-2 hover:bg-neutral rounded"
        >
          <ShoppingCart size={20} color="#2d6a4f" />
        </button>
      </div>
    </nav>

    // {/* Top Header */}
    // <div className="bg-[#f3f3f3] text-sm text-gray-700 px-8 py-2 flex justify-between items-center">
    //   <div className="flex gap-4">
    //     <a href="#">
    //       <FaPhoneAlt className="inline mr-1" /> +94 (000) - 9630
    //     </a>
    //     <a href="#">
    //       <FaEnvelope className="inline mr-1" /> ambed@agrios.com
    //     </a>
    //     <a href="#">
    //       <FaMapMarkerAlt className="inline mr-1" /> Melbourne, Australia
    //     </a>
    //   </div>
    //   <div className="flex gap-4">
    //     <FaTwitter />
    //     <FaFacebookF />
    //     <FaPinterest />
    //     <FaInstagram />
    //   </div>
    // </div>

    // {/* Navbar */}
    // <nav className="flex items-center justify-between px-8 py-5 shadow bg-white">
    //   <div className="text-2xl font-bold text-green-700">
    //     <span className="text-black">Agrios</span> 🌱
    //   </div>
    //   <ul className="flex gap-6 text-gray-700 font-medium">
    //     <li>
    //       <a href="#">Home</a>
    //     </li>
    //     <li>
    //       <a href="#">About</a>
    //     </li>
    //     <li>
    //       <a href="#">Services</a>
    //     </li>
    //     <li>
    //       <a href="#">Projects</a>
    //     </li>
    //     <li>
    //       <a href="#">News</a>
    //     </li>
    //     <li>
    //       <a href="#">Shop</a>
    //     </li>
    //     <li>
    //       <a href="#">Contact</a>
    //     </li>
    //   </ul>
    //   <div className="relative">
    //     <button className="text-gray-600 hover:text-green-600">🛒</button>
    //   </div>
    // </nav>
  );
}
