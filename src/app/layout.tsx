import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  Covered_By_Your_Grace,
  Signika,
} from "next/font/google";
import "./globals.css";

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
    template: "%s | AgriRoute Website",
    default: "AgriRoute Website",
  },
  description: "The official AgriRoute Website built by AgriRoute Inc.",
  metadataBase: new URL("https://agriroute.com"),
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
        {children}
      </body>
    </html>
  );
}
