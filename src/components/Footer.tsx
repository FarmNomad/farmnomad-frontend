import Link from "next/link";
import { Facebook, Twitter, Instagram, Linkedin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#fefef8] text-[#5b5b5b] font-signika pt-16 pb-10 relative mb-[2rem]">
      {/* Top yellow bar */}
      <div className="bg-[#e9dc59] text-sm py-3 px-4 flex flex-col md:flex-row flex-wrap justify-between items-center gap-4">
        <div className="flex gap-3 lg:gap-6 font-semibold uppercase tracking-wide text-[13px] text-[#333] flex-wrap justify-center">
          <span>Farmers</span>
          <span>•</span>
          <span>Organic</span>
          <span>•</span>
          <span>Foods</span>
          <span>•</span>
          <span>Product</span>
        </div>

        <div className="flex flex-row items-center lg:gap-4 text-sm">
          <div className="flex items-center lg:gap-2">
            <span className="bg-white p-1 lg:p-2 rounded-full shadow">📞</span>
            <span className="text-[#333] font-medium">+44 (07380) 972-982</span>
          </div>
          <div className="flex items-center lg:gap-2">
            <span className="bg-white p-1 lg:p-2 rounded-full shadow">✉️</span>
            <span className="text-[#333] font-medium">
              noreply@agriroute.com
            </span>
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-6 flex flex-col lg:flex-row gap-10 mt-10 relative">
        {/* Logo and description */}
        <div className="space-y-4 lg:flex-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-2xl text-[#3c4f3d]">AgriRoute</span>
          </div>
          <p className="text-sm text-[#666] text-start">
            AgriRoute is a platform that connects farmers directly with
            customers, eliminating middlemen. Farmers can sell produce, shop for
            discounted farm machinery, and access weather forecasts to optimize
            farming decisions. 🚜🌾
          </p>
          <div className="flex space-x-4">
            <Link
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Facebook size={20} className="hover:opacity-80" />
            </Link>
            <Link
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Twitter size={20} className="hover:opacity-80" />
            </Link>
            <Link
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Instagram size={20} className="hover:opacity-80" />
            </Link>
            <Link
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Linkedin size={20} className="hover:opacity-80" />
            </Link>
          </div>
        </div>

        {/* Useful links */}
        <div className="flex-1">
          <p className="font-bold text-xl text-[#3c4f3d] mb-6">
            Professional & modern, a theme designed to help your business stand
            out from the rest.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            <div className="text-[#5b5b5b]">
              <h3 className="font-bold mb-3">Useful Link</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href={"/company"}>Company</Link>
                </li>
                <li>
                  <Link href={"/about-us"}>About</Link>
                </li>
                <li>
                  <Link href={"/contact-us"}>Contact</Link>
                </li>
              </ul>
            </div>

            <div className="text-[#5b5b5b]">
              <h3 className="font-bold mb-3">Working Time</h3>
              <ul className="space-y-2 text-sm">
                <li>Mon - Fri: 9.00am - 5.00pm</li>
                <li>Saturday: 10.00am - 6.00pm</li>
                <li>Sunday Closed</li>
              </ul>
            </div>

            <div className="text-[#5b5b5b]">
              <h3 className="font-bold mb-3">Our Address</h3>
              <p className="text-sm">
                12 Deanes Road, Bolton
                <br />
                BL3 5AB, United Kingdom
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="mt-10 border-t border-gray-300 pt-6 mb-6 text-center text-xs text-gray-500 px-4">
        <div className="flex flex-col md:flex-row justify-between items-center max-w-7xl mx-auto gap-4">
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="#">Terms & Conditions</Link>
            <Link href="#">Privacy Policy</Link>
          </div>
          <div>
            Copyright © 2024 <span className="font-semibold">AgriRoute</span>.
            All Rights Reserved.
          </div>
        </div>
      </div>

      {/* Decorations */}
      <div className="absolute bottom-10 left-5 sm:left-20 opacity-10 text-[60px] sm:text-[100px]">
        🌿
      </div>
      <div className="absolute bottom-5 right-5 sm:right-20 opacity-10 text-[60px] sm:text-[100px]">
        🌱
      </div>
    </footer>
  );
}
