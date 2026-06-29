import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import AutoMoveEffect from "@/components/layout/AutoMoveEffect";

export const metadata: Metadata = {
  title: "PhDTrack",
  description: "Track your PhD journey",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-cream min-h-screen">
        <AutoMoveEffect />
        <Sidebar />
        <div className="md:ml-[240px] min-h-screen flex flex-col pb-20 md:pb-0">
          <Header />
          <main className="flex-1">{children}</main>
        </div>
        <BottomNav />
      </body>
    </html>
  );
}
