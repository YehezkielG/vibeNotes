import type { Metadata } from "next";
import "@/app/globals.css";
import Navbar from "@/components/Navbar";
import RightSidebar from "@/components/RightSidebar";
import { Inter } from "next/font/google";
import AuthSessionProvider from "@/components/providers/AuthSessionProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import Footer from "@/components/Footer"
import BottomNav from "@/components/BottomNav"

export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter", // CSS variable trick
  display: "swap",
});

export const metadata: Metadata = {
  title: "vibeNotes",
  description: "Signal in the noise. An AI-powered sanctuary for self-reflection.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light dark" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme') || 
                  (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                document.documentElement.classList.toggle('dark', theme === 'dark');
                document.documentElement.style.colorScheme = theme;
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} antialiased mainBody bg-white dark:bg-gray-950 text-gray-800 dark:text-gray-100`}>
        <AuthSessionProvider>
          <ThemeProvider>
            {/* Responsive shell: stack on mobile, three-column on lg */}
            <div className="relative flex flex-col lg:flex-row lg:justify-between lg:gap-6 mx-auto w-full max-w-screen-2xl lg:px-10 px-1 pb-14 lg:pb-0">
            {/* Left nav: shows above main on mobile, sticky on desktop */}
            <aside className="w-full lg:sticky lg:top-0 lg:h-svh lg:w-2/12 overflow-y-auto pb-4">
              <Navbar />
            </aside>

            {/* Main content adjusts width; full width on mobile */}
            <main className="w-full lg:w-7/12 lg:p-5 p-2">
              {children}
            </main>

            {/* Right sidebar collapses below main on mobile */}
            <aside className="lg:sticky lg:top-0 lg:h-svh w-full lg:w-2/12 flex flex-col gap-4 mt-6 lg:mt-0">
              <RightSidebar />
              <div className="mt-auto opacity-75">
                <Footer />
              </div>
            </aside>
            <BottomNav />
          </div>
          </ThemeProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
