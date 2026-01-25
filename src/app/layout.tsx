import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  Covered_By_Your_Grace,
  Signika,
} from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const grace = Covered_By_Your_Grace({
  variable: "--font-covered-by-your-grace",
  weight: "400",
  style: ["normal"],
  subsets: ["latin"], // Or other subsets you need
});

const signika = Signika({
  variable: "--font-signika",
  weight: "400",
  style: ["normal"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: "%s | FarmNomad Website",
    default: "FarmNomad Website",
  },
  description:
    "The official FarmNomad Website built by FarmNomad Inc. A Rural logistics & surplus redistribution platform.",
  metadataBase: new URL("https://farmnomad.com"),
  manifest: "/manifest.webmanifest",
  themeColor: "#ffffff",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "MyApp" },
};

export const viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Roboto:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable}  w-full overflow-y-auto antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
