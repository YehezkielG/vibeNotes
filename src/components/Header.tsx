"use client";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { User as UserIcon, LogOut } from "lucide-react";

export default function Navbar() {
  const { data: session, status } = useSession();
  const [showDropdown, setShowDropdown] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  // Reset loading state when session image changes
  useEffect(() => {
    setIsImageLoading(true);
  }, [session?.user?.image]);

  return (
    <header className="flex justify-between py-5">
      <div className="flex items-center space-x-3">
        <Image src="/logo.png" alt="Notes App Logo" width={25} height={25} />
        <h1 className="font-bold text-xl">vibeNote</h1>
      </div>
      <div className="relative flex items-center">
        {status === "loading" ? null : session ? (
          <div ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown((v) => !v)}
              className="focus:outline-none"
            >
              <div className="relative">
                {isImageLoading && (
                  <div className="w-10 h-10 rounded-full border-2 border-gray-300 animate-pulse bg-gray-200" />
                )}
                <Image
                  src={session.user?.image || "/default-profile.png"}
                  className={`rounded-full border-2 cursor-pointer transition-opacity ${
                    isImageLoading ? "opacity-0" : "opacity-100"
                  }`}
                  alt="Profile Picture"
                  width={40}
                  height={40}
                  onLoadingComplete={() => setIsImageLoading(false)}
                />
              </div>
            </button>
            {showDropdown && (
              <div className="absolute right-0 rounded-lg bg-white border shadow-lg z-10 p-3 py-5 ">
                <div className="flex items-center justify-center">
                  <div className="relative">
                    {isImageLoading && (
                      <div className="w-12 h-12 rounded-full border-2 border-gray-300 animate-pulse bg-gray-200" />
                    )}
                    <Image
                      src={session.user?.image || "/default-profile.png"}
                      className={`rounded-full border-2 transition-opacity ${
                        isImageLoading ? "opacity-0" : "opacity-100"
                      }`}
                      alt="Profile Picture"
                      width={50}
                      height={50}
                      onLoadingComplete={() => setIsImageLoading(false)}
                    />
                  </div>
                </div>
                <div
                  className="px-4 py-2 border-b mb-2 mx-2 text-center"
                  style={{
                    width: `${Math.max(
                      (session.user?.displayName?.length || 4) * 17,
                      160
                    )}px`,
                  }}
                >
                  <p className="font-semibold text-gray-700">
                    Hello, {session.user?.displayName || "User"}
                  </p>
                </div>
                <Link
                  href="/profile"
                  className="flex items-center gap-2 hover:bg-gray-100 p-2"
                  onClick={() => setShowDropdown(false)}
                >
                  <UserIcon size={16} className="text-gray-600" />
                  <span>My Profile</span>
                </Link>
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    signOut();
                  }}
                  className="w-full text-left p-2 hover:bg-gray-100 flex items-center gap-2"
                >
                  <LogOut size={16} className="text-gray-600" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link
            className="bg-blue-600 text-white px-4 py-2 rounded-xl"
            href={"/auth"}
          >
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
}
