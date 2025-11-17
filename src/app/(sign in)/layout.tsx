import type { Metadata } from "next";
import "@/app/globals.css";
import { Inter } from 'next/font/google';
import Footer from "@/components/Footer";
import AuthSessionProvider from "@/components/providers/AuthSessionProvider";

export const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter', 
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Notes App",
  description: "A note-taking application built with Next.js",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {


  return (
    <html lang="en">
      <body
    className={`${inter.variable} antialiased px-2 sm:px-32 flex justify-center h-svh items-center`}>
    <AuthSessionProvider>
          {children}
        <div className="absolute bottom-0">
          <Footer />
        </div>
      </AuthSessionProvider>
      </body>
    </html>
  );
}
