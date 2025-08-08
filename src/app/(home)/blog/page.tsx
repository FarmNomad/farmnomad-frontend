import React from 'react';
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog Page",
};
export default function Page () {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-bold text-primary mb-6">Our Blog</h1>
      <p className="text-lg text-darkText mb-6">
        Stay updated with the latest news, tips, and insights on farming, fresh
        produce, and everything related to agro-business. Here at AgriRoute, we
        believe in sharing valuable knowledge to help farmers and customers
        succeed.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Blog post 1 */}
        <div className="border border-gray-300 rounded-lg overflow-hidden shadow-md">
          <img
            src="https://via.placeholder.com/400x200"
            alt="Blog post 1"
            className="w-full h-56 object-cover"
          />
          <div className="p-4">
            <h2 className="text-xl font-semibold text-primary">
              How to Improve Soil Health for Better Harvests
            </h2>
            <p className="text-lg text-darkText mb-4">
              Learn how to improve the quality of your soil to grow healthier
              crops and boost your farm's productivity.
            </p>
            <a
              href="/blog/how-to-improve-soil-health"
              className="text-lightGreen font-semibold hover:underline"
            >
              Read more
            </a>
          </div>
        </div>
        {/* Blog post 2 */}
        <div className="border border-gray-300 rounded-lg overflow-hidden shadow-md">
          <img
            src="https://via.placeholder.com/400x200"
            alt="Blog post 2"
            className="w-full h-56 object-cover"
          />
          <div className="p-4">
            <h2 className="text-xl font-semibold text-primary">
              Understanding the Importance of Crop Rotation
            </h2>
            <p className="text-lg text-darkText mb-4">
              Discover how crop rotation can prevent soil depletion and improve
              farm sustainability in the long run.
            </p>
            <a
              href="/blog/crop-rotation"
              className="text-lightGreen font-semibold hover:underline"
            >
              Read more
            </a>
          </div>
        </div>
        {/* Blog post 3 */}
        <div className="border border-gray-300 rounded-lg overflow-hidden shadow-md">
          <img
            src="https://via.placeholder.com/400x200"
            alt="Blog post 3"
            className="w-full h-56 object-cover"
          />
          <div className="p-4">
            <h2 className="text-xl font-semibold text-primary">
              5 Tools Every Farmer Should Have
            </h2>
            <p className="text-lg text-darkText mb-4">
              Here’s a list of essential tools that can make your farming
              operations more efficient and successful.
            </p>
            <a
              href="/blog/tools-for-farmers"
              className="text-lightGreen font-semibold hover:underline"
            >
              Read more
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
