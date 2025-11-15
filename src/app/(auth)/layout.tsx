import type { Metadata } from "next";
import "@/app/globals.css";
import { Inter } from 'next/font/google';
import Footer from "@/components/Footer";

export const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter', 
  display: 'swap',
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
      <body
    className={`${inter.variable} antialiased px-2 sm:px-32 flex justify-center h-svh items-center`}>{children}
        <div className="absolute bottom-0">
          <Footer />
        </div>
      </body>
    </html>
  );
}
