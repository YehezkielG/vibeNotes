"use client";
import { Globe, NotebookText, Bell, ChartLine, Plus } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import { transformAvatar } from "@/lib/utils/image";

export default function Navbar() {
  const { data: session, status } = useSession();
  const isLoading = status === "loading";

  const pathname = usePathname();
  const isOwnProfileView = !!(
    !isLoading &&
    session?.user?.username &&
    pathname &&
    pathname.startsWith(`/profile/${session.user.username}`)
  );
  // Restore compact icon styling (smaller, muted)
  const navItems = [
    {
      href: "/note/new",
      icon: <Plus className="inline mr-3 text-gray-400" size={25} />,
      label: "New Note",
    },
    {
      href: "/",
      icon: <Globe className="inline mr-3 text-gray-400" size={25} />,
      label: "Explore",
    },
    {
      href: "/note/yours/private",
      icon: <NotebookText className="inline mr-3 text-gray-400" size={25} />,
      label: "Your Notes",
    },
    {
      href: "/notifications",
      icon: <Bell className="inline mr-3 text-gray-400" size={25} />,
      label: "Notifications",
    },
    {
      href: "/insight",
      icon: <ChartLine className="inline mr-3 text-gray-400" size={25} />,
      label: "Insight",
    },
  ];

  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    if (showDropdown)
      document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDropdown]);

  const profileImage = transformAvatar(
    session?.user?.image || "/default-profile.png",
    48
  );

  return (
    <nav>
      <div className="container mx-auto">
        <div className="flex select-none my-5">
          {/* Left column: brand + vertical nav */}
          <div className="w-48 flex flex-col items-start gap-4">
            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="Notes App Logo"
                width={25}
                height={25}
              />
              <h1 className="font-bold text-xl">vibeNotes</h1>
            </div>
            <ul className="text-lg font-medium flex flex-col w-full">
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href === "/" && pathname === "/") ||
                  (item.href.includes("/note/yours") &&
                    pathname.includes("/note/yours"));
                return (
                  <li className="py-2 w-full" key={item.label}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-2 w-full ${
                        isActive
                          ? "text-black font-semibold"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>

            {/* User summary at bottom of left column */}
            <div className="mt-auto w-full">
              {isLoading ? (
                <div className="flex items-center gap-3 min-w-0">
                  <div className="rounded-full w-7 h-7 bg-gray-200 animate-pulse" />
                  <div className="w-24 h-4 bg-gray-200 rounded animate-pulse" />
                </div>
              ) : session?.user ? (
                <div
                  ref={dropdownRef}
                  className="relative flex items-center gap-3 min-w-0"
                >
                  <button
                    onClick={() => setShowDropdown((v) => !v)}
                    aria-current={isOwnProfileView ? "true" : undefined}
                    aria-expanded={showDropdown}
                    className="flex items-center space-x-3 min-w-0"
                  >
                    <div
                      className={`rounded-full overflow-hidden w-7 h-7 ring-2 ${
                        isOwnProfileView ? "ring-black" : "ring-gray-100"
                      }`}
                    >
                      <Image
                        src={profileImage}
                        alt="Profile"
                        width={28}
                        height={28}
                        className="object-cover w-full h-full"
                      />
                    </div>

                    <span
                      className={`block truncate max-w-40 ${
                        isOwnProfileView
                          ? "text-black font-semibold"
                          : "text-gray-600 hover:text-black"
                      }`}
                      title={session?.user?.username ?? ""}
                    >
                      {session?.user?.username ?? ""}
                    </span>

                    {/* Dropdown menu with Logout */}
                  </button>
                  {showDropdown && (
                    <div className="absolute left-0 top-full mt-2 z-50 w-44 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                      <Link
                        href={`/profile/${session?.user?.username ?? ""}`}
                        onClick={() => setShowDropdown(false)}
                        className="w-full block px-4 py-2 text-left text-sm hover:bg-gray-50"
                      >
                        Profile
                      </Link>
                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          signOut({ callbackUrl: "/" });
                        }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-red-600"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  className="border-2 text-white bg-indigo-600 px-4 py-1 rounded-xl"
                  href="/auth"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
