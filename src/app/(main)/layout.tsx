import type { Metadata } from "next";
import "@/app/globals.css";
import Navbar from "../../components/Navbar";
import Header from "../../components/Header";
import { Inter } from 'next/font/google';

export const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter', // Ini trik CSS-nya
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
        className={`${inter.variable} antialiased px-2 mainBody sm:px-32`}
      >
        <Header />
        <div className="flex">
          <Navbar />
          <div>
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
