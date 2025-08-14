import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Metadata } from "next";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Home Pages",
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="w-[100%] h-full flex flex-col relative justify-between font-poppins text-text">
      <Navbar />
      <div className="w-full pt-16">{children}</div>
      <Footer />
    </div>
  );
}
