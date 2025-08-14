import React from 'react';
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About-Us Page",
};
export default function Page (){
  return (
    <section className="bg-[#fefef8] py-16 px-4">
      <div className="max-w-7xl mx-auto space-y-10">
        <div className="text-center">
          <span className="text-sm bg-white text-green-700 px-3 py-1 rounded-full font-semibold inline-block">
            About Us
          </span>
          <h1 className="text-4xl font-bold leading-tight text-[#3c4f3d] mt-4">
            Welcome to AgriRoute
          </h1>
          <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
            AgriRoute is an innovative platform designed to bridge the gap
            between farmers and customers, enabling a direct marketplace where
            fresh, quality farm products can be purchased without the need for
            middlemen.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-semibold text-[#3c4f3d]">
              Our Mission
            </h2>
            <p className="text-gray-600">
              At AgriRoute, our mission is to empower farmers by providing them
              with a platform where they can sell their produce directly to
              consumers, ensuring fair prices, better quality, and faster access
              to farm products.
            </p>
          </div>
          <div className="space-y-6 bg-green-100 p-6 rounded-lg">
            <h2 className="text-3xl font-semibold text-[#3c4f3d]">
              Why Choose AgriRoute?
            </h2>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Direct farmer-to-consumer connection</li>
              <li>Competitive prices on farm products</li>
              <li>Convenient online shopping experience</li>
              <li>Access to reliable weather forecasts and farming tools</li>
            </ul>
          </div>
        </div>

        <div className="text-center mt-10">
          <p className="text-lg text-gray-700 max-w-2xl mx-auto">
            Join us in revolutionizing the agricultural marketplace and creating
            a fairer system for both farmers and consumers.
          </p>
        </div>
      </div>
    </section>
  );
}
