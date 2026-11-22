import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";


const withPWA = withPWAInit({
  dest: "public",
  register: true,
  workboxOptions: {
    skipWaiting: true,
  },
  // keeps SW off in dev so it doesn't mess caching while you build
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  // eslint: {
  //   ignoreDuringBuilds: true,
  // },
  cacheComponents: true,
  experimental: {
    // Signed-in screens render in the browser only, so Next has nothing to validate on them and
    // flagged every page ("Dropped segment"). Check only pages that opt in with `instant = true`.
    instantInsights: { validationLevel: "manual-warning" },
  },
    images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "farmnomad-backend.onrender.com",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "farmnomad-backend.onrender.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "http",
        hostname: "192.168.4.145",
        port: "9000",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "9000",
        pathname: "/**",
      },
    ],
  },
  // async redirects() {
  //   return [
  //     {
  //       source: "/",
  //       destination: "/h",
  //       permanent: true,
  //     },
  //   ];
  // },
};

export default withPWA(nextConfig);

