import type { Metadata } from "next";
import "@/app/globals.css";
import Navbar from "../../components/Navbar";
import Header from "../../components/Header";
import { Inter } from "next/font/google";
import AuthSessionProvider from "@/components/providers/AuthSessionProvider";

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
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased px-2 mainBody sm:px-28`}>
        <AuthSessionProvider>
          <Header />
          <div className="flex">
            <aside className="w-3/12 pr-8 hidden lg:block">
              <Navbar />
            </aside>
            <main className="w-full lg:w-3/4 px-5">{children}</main>
            <aside className="w-3/12 pl-8 hidden xl:block">
              {/* Future right sidebar content can go here */}
              Following
            </aside>
          </div>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
