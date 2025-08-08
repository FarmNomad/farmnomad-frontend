import Image from "next/image";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Authentication Page",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fefef8] p-4 relative font-signika">
      <div className="bg-white h-auto min-h-[80%] shadow-xl rounded-2xl p-8 w-full max-w-md space-y-6 z-40">
        {children}
      </div>
      <div className="fixed bottom-45 left-5 lg:bottom-10 lg:left-20 opacity-30 text-[100px]">
        🌿
      </div>
      <Image
        src={"/images/corn.png"}
        alt="corn"
        className="h-[26rem] w-[20rem] opacity-50 top-5 lg:top-[5%] fixed left-[8%] -rotate-45 translate-50 lg:translate-40"
        height={480}
        width={480}
      />
      <Image
        src={"/images/carrot.png"}
        alt="corn"
        className="h-[3rem] w-[4rem] lg:h-auto lg:w-auto fixed opacity-50 top-[-10%] scale-125 right-[20%] translate-40"
        height={480}
        width={480}
      />
      <div className="fixed bottom-5 right-5 lg:bottom-[-2rem] lg:right-20 opacity-30 text-[100px]">
        🌱
      </div>
    </div>
  );
}
