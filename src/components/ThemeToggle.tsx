"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  // Render a stable, theme-agnostic placeholder on the server and before mount
  // to avoid hydration mismatches. After mount we render the correct icon/label.
  const icon = mounted ? (theme === "light" ? <Moon size={18} /> : <Sun size={18} />) : <span className="w-4 h-4 inline-block" aria-hidden />;
  const label = mounted ? (theme === "light" ? "Dark" : "Light") : null;

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
      aria-label="Toggle theme"
    >
      {icon}
      <span className="text-sm hidden lg:inline">{label}</span>
    </button>
  );
}
