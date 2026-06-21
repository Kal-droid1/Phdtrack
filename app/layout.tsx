import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";

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
      <body className="font-sans antialiased bg-dark min-h-screen overflow-x-hidden">
        {/* Background gradient orbs */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-0">
          <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-glow-purple/20 blur-[120px] animate-float-slow" />
          <div className="absolute top-1/3 -right-40 w-[400px] h-[400px] rounded-full bg-glow-teal/15 blur-[120px] animate-float-delayed" />
          <div className="absolute -bottom-40 left-1/3 w-[350px] h-[350px] rounded-full bg-glow-amber/10 blur-[120px] animate-float" />
        </div>

        <div className="relative z-0">
          <Sidebar />
          <div className="md:ml-[240px] min-h-screen flex flex-col pb-20 md:pb-0">
            <Header />
            <main className="flex-1">{children}</main>
          </div>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
