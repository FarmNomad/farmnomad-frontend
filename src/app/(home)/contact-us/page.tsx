"use client"
import React, { useState } from 'react';
import Image from 'next/image';
import { Mail, Phone, MapPin, ArrowUpRight } from "lucide-react";
import { Metadata } from "next";

const metadata: Metadata = {
  title: "Contact-Us Page",
};

export default function ContactUs() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    alert('Message sent successfully!');
  };

  return (
    <section className="bg-[#fefef8] py-12 px-4">
       <section className="px-6 mb-12">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Mail Card */}
        <div className="bg-white rounded-3xl p-8 relative overflow-hidden shadow-lg">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-yellow-300 p-3 rounded-full">
              <Mail className="text-[#3c4f3d]" size={24} />
            </div>
            <h3 className="text-xl font-semibold text-[#3c4f3d]">Mail us 24/7</h3>
          </div>
          <hr className="border-gray-200 mb-4" />
          <div className="text-gray-600 space-y-1">
            <p>pbminfo@admin.com</p>
            <p>pbmadmin@info.com</p>
          </div>
          <button className="absolute bottom-4 right-4 bg-white border p-2 rounded-full shadow hover:scale-110 transition">
            <ArrowUpRight className="text-[#3c4f3d]" size={20} />
          </button>
        </div>

        {/* Call Card */}
        <div className="bg-white rounded-3xl p-8 relative overflow-hidden shadow-lg">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-yellow-300 p-3 rounded-full">
              <Phone className="text-[#3c4f3d]" size={24} />
            </div>
            <h3 className="text-xl font-semibold text-[#3c4f3d]">Call us 24/7</h3>
          </div>
          <hr className="border-gray-200 mb-4" />
          <div className="text-gray-600 space-y-1">
            <p>Phone : (+55) 654-545-5418</p>
            <p>Mobile : (+01) 654-545-1235</p>
          </div>
          <button className="absolute bottom-4 right-4 bg-white border p-2 rounded-full shadow hover:scale-110 transition">
            <ArrowUpRight className="text-[#3c4f3d]" size={20} />
          </button>
        </div>

        {/* Location Card */}
        <div className="bg-white rounded-3xl p-8 relative overflow-hidden shadow-lg">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-yellow-300 p-3 rounded-full">
              <MapPin className="text-[#3c4f3d]" size={24} />
            </div>
            <h3 className="text-xl font-semibold text-[#3c4f3d]">Our Locations</h3>
          </div>
          <hr className="border-gray-200 mb-4" />
          <div className="text-gray-600 space-y-1">
            <p>4821 Ride Top, Anch St, Alaska</p>
            <p>997998, USA main city.</p>
          </div>
          <button className="absolute bottom-4 right-4 bg-white border p-2 rounded-full shadow hover:scale-110 transition">
            <ArrowUpRight className="text-[#3c4f3d]" size={20} />
          </button>
        </div>

      </div>
    </section>
      <div className="max-w-7xl px-[4rem] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left side */}
        <div className="space-y-6">
          <span className="text-sm bg-white text-green-700 px-3 py-1 rounded-full font-semibold inline-block">
            Get In Touch
          </span>
          <h2 className="text-4xl font-bold leading-tight text-[#3c4f3d]">
            Contact Us
          </h2>
          <p className="text-gray-600">
            We would love to hear from you! Whether you have a question, feedback, or just want to connect, feel free to drop us a message.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-gray-700">Your Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full p-3 mt-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700">Your Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full p-3 mt-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-semibold text-gray-700">Your Message</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows={4}
                className="w-full p-3 mt-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
            <button type="submit" className="bg-[#5a9052] hover:bg-[#477944] text-white py-3 px-6 rounded-lg transition">
              Send Message
            </button>
          </form>
        </div>

        {/* Right side Image */}
        <div className="flex justify-center">
          <Image
            src="/images/contact.png"
            alt="Contact Us"
            width={500}
            height={500}
            className="object-cover rounded-2xl shadow-lg"
          />
        </div>
      </div>
    </section>
  );
}