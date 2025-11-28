import type { Metadata } from "next";
import "@/app/globals.css";
import Navbar from "../../components/Navbar";
import RightSidebar from "@/components/RightSidebar";
import { Inter } from "next/font/google";
import AuthSessionProvider from "@/components/providers/AuthSessionProvider";
import Footer from "@/components/Footer"

export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter", // CSS variable trick
  display: "swap",
});

export const metadata: Metadata = {
  title: "Notes App",
  description: "A note-taking application built with Next.js",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased  px-2 mainBody bg-white text-gray-800`}>
        <AuthSessionProvider>
          <div className="flex justify-between px-10 relative">
            <aside className="sticky top-0 h-svh w-2/12 hidden lg:block overflow-y-auto">
              <Navbar />
            </aside>
            <main className="w-7/12 p-5 ">
              {children}
            </main>
            <aside className="sticky top-0 h-svh w-2/12 ">
              <RightSidebar />
              <div className="absolute bottom-0" style={{
                fontSize:"10px"
              }}>
                <Footer />
              </div>
            </aside>
          </div>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
