import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "PhDTrack",
  description: "Track your PhD applications",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} font-sans antialiased bg-[#f0f4f0]`}
      >
        <Sidebar />
        <div className="md:ml-[240px] min-h-screen flex flex-col pb-16 md:pb-0">
          <Header />
          <main className="flex-1">{children}</main>
        </div>
        <BottomNav />
      </body>
    </html>
  );
}
