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
  webpack: (config) => config,
  images: {
    remotePatterns: [
      {
        protocol: "http",
        // hostname: "192.168.4.145",
        hostname: "farmnomad-backend.onrender.com",
        // port: "9000",
        // pathname: "/**",
        pathname: "/uploads/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "9000",
        pathname: "/**",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/",
        destination: "/home",
        permanent: true,
      },
    ];
  },
};

export default withPWA(nextConfig);

// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   eslint: {
//     ignoreDuringBuilds: true,
//   },
//   images: {
//     remotePatterns: [
//       {
//         protocol: "http",
//         hostname: "192.168.4.145",
//         port: "9000",
//         pathname: "/**",
//       },
//       // keep this if you sometimes run via localhost during dev:
//       {
//         protocol: "http",
//         hostname: "localhost",
//         port: "9000",
//         pathname: "/**",
//       },
//     ],
//   },
//   // images: {
//   //   remotePatterns: [
//   //     {
//   //       protocol: "http",
//   //       hostname: "localhost",
//   //       port: "9000",
//   //       pathname: "/**",
//   //     },
//   //     // add prod host later
//   //     // { protocol: 'https', hostname: 'api.my-domain.com', pathname: '/**' },
//   //   ],

//   // },
//   /* config options here */
//   async redirects() {
//     return [
//       // Basic redirect
//       {
//         source: "/",
//         destination: "/home",
//         permanent: true,
//       },
//     ];
//   },
// };

// export default nextConfig;
