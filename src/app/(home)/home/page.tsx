import Image from "next/image";
import { Metadata } from "next";
import ScrollingMarquee from "@/components/forms/Marquees";

import {
  Calendar,
  User,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Home Page",
};

const blogs = [
  {
    tag: "Food Crops",
    image: "/images/farm1.png",
    date: "March 28, 2024",
    author: "Admin",
    title: "What technology is used in vertical farming?",
  },
  {
    tag: "Organic Farm",
    image: "/images/farm2.png",
    date: "March 28, 2024",
    author: "Admin",
    title: "Which type of farming is more prevalent today?",
  },
  {
    tag: "Farming Tips",
    image: "/images/farm3.png",
    date: "March 28, 2024",
    author: "Admin",
    title: "The Farmers Sentiment Darkens Hopes Fade",
  },
];

const services = [
  {
    category: "Fertilizer",
    title: "Harvest Concepts",
    image: "/images/service1.png",
    description:
      "Farming and animal husbandry and discuss with farmers and scientists.",
  },
  {
    category: "Fruits",
    title: "Farming Products",
    image: "/images/service2.png",
    description:
      "Farming and animal husbandry and discuss with farmers and scientists.",
  },
  {
    category: "Fertilizer",
    title: "Soil Fertilization",
    image: "/images/service3.png",
    description:
      "Farming and animal husbandry and discuss with farmers and scientists.",
  },
];

export default function Page() {
  return (
    <div className="font-signika font-light">
      {/* Hero Section */}
      <section
        className="relative h-[80vh] bg-cover bg-center flex items-center justify-start overflow-y-auto mb-12"
        style={{ backgroundImage: "url('/images/home-hero1.jpg')" }}
      >
        <div className="bg-black/40 absolute inset-0 z-0" />
        <div className="container lg:w-[40%] relative px-12 text-white">
          <h5 className="text-lg mb-2 uppercase">Welcome to AgriRoute</h5>
          <h1 className="text-[5rem] grace-font font leading-tight mb-4 relative">
            Agriculture <span className="text-[#EEC044]">&</span> <br />
            Eco Farming
            <Image
              className="h-[3rem] w-[3rem] absolute top-[6rem] left-[20rem]"
              src={"svg/leaf2.svg"}
              alt="leaf"
              height={16}
              width={16}
            />
          </h1>
          <p className="max-w-xl mb-6 font-extralight text-gray-100">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut elit
            tellus, luctus nec ullamcorper mattis.
          </p>
          <div className="flex gap-10">
            <button className="bg-[#4BAF47] hover:bg-green-700 text-white px-6 py-3 rounded-md shadow-lg">
              Discover More
            </button>
            <Image
              className="h-[3rem] w-[7rem]"
              src={"/svg/leaf.svg"}
              alt="leaf"
              height={16}
              width={16}
            />
          </div>
        </div>
      </section>

      <ScrollingMarquee />

      <section className="bg-[#5a9052] px-6 py-16 relative overflow-hidden">
        <div className="max-w-7xl mx-auto text-white">
          {/* Header */}
          <div className="flex justify-between items-center mb-10">
            <div>
              <div className="text-xs uppercase font-semibold text-[#d3f5d2] mb-2">
                <span className="px-2 py-1 bg-white text-green-700 rounded-full">
                  MarketPlace
                </span>
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-white">
                Best Agricultural Product
              </h2>
            </div>
            <div className="flex gap-2">
              <button className="p-2 border rounded hover:bg-[#4d7e45] border-white">
                <ChevronLeft className="w-4 h-4 text-white" />
              </button>
              <button className="p-2 border rounded hover:bg-[#4d7e45] border-white">
                <ChevronRight className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          {/* Service Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl overflow-hidden text-gray-700 shadow hover:shadow-md transition group"
              >
                <div className="h-52 overflow-hidden">
                  <Image
                    src={service.image}
                    alt={service.title}
                    className="w-full h-full object-cover transition group-hover:scale-105"
                    height={480}
                    width={480}
                  />
                </div>
                <div className="p-6 relative">
                  <p className="text-xs uppercase text-[#d3b54b] font-bold mb-1">
                    ● {service.category}
                  </p>
                  <h3 className="text-lg font-semibold mb-2">
                    {service.title}
                  </h3>
                  <p className="text-sm text-gray-500">{service.description}</p>

                  <div className="absolute bottom-5 right-5">
                    <button className="w-10 h-10 rounded-full bg-[#f3e38e] flex items-center justify-center shadow hover:bg-[#e9dc59] cursor-pointer transition">
                      <Image
                        src="/svg/arrow.svg"
                        alt="arrow"
                        height={16}
                        width={16}
                      />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Background Leaves Decor (optional visual effect) */}
        <div className="absolute inset-0 bg-[url('/images/leaf-pattern.png')] opacity-10 bg-repeat pointer-events-none"></div>
      </section>

      <section className="bg-[#fefef8] px-6 py-16">
        <div className="lg:max-w-7xl mx-auto flex flex-col items-center">
          <div className="text-xs uppercase font-semibold text-center text-gray-400 mb-2">
            <span className="px-2 py-1 bg-gray-100 text-center rounded-full">
              Grow Naturally
            </span>
          </div>
          <h2 className="lg:w-[30%] text-3xl md:text-4xl text-center font-extrabold text-[#3c4f3d]">
            Choose What&apos;s Perfect For Your Field
          </h2>
        </div>
        <div className="flex flex-col lg:flex-row justify-center gap-[2rem] items-center mt-[3rem]">
          <div className="flex flex-col gap-[4rem]">
            <div className="flex gap-[2rem]">
              <div className="w-[4rem] h-[4rem] rounded-full bg-[#f3e38e] flex items-center justify-center shadow hover:bg-[#e9dc59]">
                <Image
                  src={"/svg/hand.svg"}
                  alt="hand"
                  className="h-[1.5rem] w-[1.5rem] lg:h-[2.5rem] lg:w-[2.5rem]"
                  height={480}
                  width={480}
                />
              </div>
              <div className="text-start">
                <h5 className="text-[1.25rem] text-start font-semibold text-[#3c4f3d]">
                  Agriculture Products
                </h5>
                <p className="text-start">
                  Nullam porta enim vel tellus commodo, eget laoreet odio
                  ultrices.
                </p>
              </div>
            </div>
            <div className="flex gap-[2rem]">
              <div className="w-[4rem] h-[4rem] rounded-full bg-[#f3e38e] flex items-center justify-center shadow hover:bg-[#e9dc59]">
                <Image
                  src={"/svg/field.svg"}
                  alt="field"
                  className="h-[2.5rem] w-[2.5rem] "
                  height={480}
                  width={480}
                />
              </div>
              <div className="text-start">
                <h5 className="text-[1.25rem] text-start font-semibold text-[#3c4f3d]">
                  Quality Products
                </h5>
                <p className="text-start">
                  Nullam porta enim vel tellus commodo, eget laoreet odio
                  ultrices.
                </p>
              </div>
            </div>
          </div>
          <div>
            <Image
              src={"/images/corn.png"}
              alt="corn"
              className="h-[26rem] w-[24rem] hidden lg:block "
              height={480}
              width={480}
            />
          </div>
          <div className="flex flex-col gap-[4rem]">
            <div className="flex gap-[2rem]">
              <div className="w-[4rem] h-[4rem] rounded-full bg-[#f3e38e] flex items-center justify-center shadow hover:bg-[#e9dc59]">
                <Image
                  src={"/svg/carrot.svg"}
                  alt="carrot"
                  className="h-[2.5rem] w-[2.5rem] "
                  height={480}
                  width={480}
                />
              </div>
              <div className="text-start">
                <h5 className="text-[1.25rem] text-start font-semibold text-[#3c4f3d]">
                  Fresh Vegetables
                </h5>
                <p className="text-start">
                  Nullam porta enim vel tellus commodo, eget laoreet odio
                  ultrices.
                </p>
              </div>
            </div>
            <div className="flex gap-[2rem]">
              <div className="w-[4rem] h-[4rem] rounded-full bg-[#f3e38e] flex items-center justify-center shadow hover:bg-[#e9dc59]">
                <Image
                  src={"/svg/grain.svg"}
                  alt="grain"
                  className="h-[2.5rem] w-[2.5rem] "
                  height={480}
                  width={480}
                />
              </div>
              <div className="text-start">
                <h5 className="text-[1.25rem] text-start font-semibold text-[#3c4f3d]">
                  Pure & Organic
                </h5>
                <p className="text-start">
                  Nullam porta enim vel tellus commodo, eget laoreet odio
                  ultrices.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#fefef8] px-6 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-10">
            <div>
              <div className="text-xs uppercase font-semibold text-gray-400 mb-2">
                <span className="px-2 py-1 bg-gray-100 rounded-full">
                  Latest Blog
                </span>
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#3c4f3d]">
                Latest posts & articles
              </h2>
            </div>
            <div className="flex gap-2">
              <button className="p-2 border rounded hover:bg-gray-100">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button className="p-2 border rounded hover:bg-gray-100">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogs.map((post, i) => (
              <div key={i} className="space-y-4 group">
                <div className="relative overflow-hidden rounded-xl">
                  <Image
                    src={post.image}
                    alt={post.title}
                    height={320}
                    width={320}
                    className="w-full h-60 object-cover transition duration-300 group-hover:scale-105"
                  />
                  <span className="absolute top-3 left-3 text-xs bg-white text-[#3c4f3d] font-semibold px-3 py-1 rounded-full shadow">
                    {post.tag}
                  </span>
                  <div className="absolute bottom-3 right-3 rounded-full">
                    <button className="w-10 h-10 rounded-full bg-[#f3e38e] flex items-center justify-center shadow hover:bg-[#e9dc59] cursor-pointer">
                      {/* <ArrowUpRight className="w-4 h-4 text-[#3c4f3d]" /> */}
                      <Image
                        src="/svg/arrow.svg"
                        alt="arrow"
                        height={16}
                        width={16}
                      />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {post.date}
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {post.author}
                  </div>
                </div>
                <h3 className="font-semibold text-lg text-[#3c4f3d] leading-snug">
                  {post.title}
                </h3>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}